import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Sliders,
  History,
  Printer,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  marksService,
  SubjectMarksStatistics,
  ModerationLogEntry
} from '../../services/marksService.js';
import {
  StudentMarksWithDetails,
  SubjectMarksSummary,
  ModerationRule
} from '../../data/mockMarks.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { examService } from '../../services/examService.js';
import { Department, Examination } from '../../types/database.types.js';

export const MarksManagementPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [subjectSummaries, setSubjectSummaries] = useState<SubjectMarksSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectMarksSummary | null>(null);
  const [subjectMarksList, setSubjectMarksList] = useState<StudentMarksWithDetails[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'inspector' | 'moderation' | 'audit_logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Moderation modal state
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [modRuleType, setModRuleType] = useState<ModerationRule['rule_type']>('borderline_grace');
  const [modGraceMarks, setModGraceMarks] = useState<number>(2);
  const [modResolutionRef, setModResolutionRef] = useState<string>('AC/2026/RES-14B');
  const [modReason, setModReason] = useState<string>('Academic Council borderline compensation for semester moderation.');

  // Unlock modal state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  const [moderationLogs, setModerationLogs] = useState<any[]>([]);

  // Load departments, exams, summaries
  const loadData = async () => {
    try {
      const [depts, exams] = await Promise.all([
        academicStructureService.getDepartments(),
        examService.getExaminations(),
      ]);
      setDepartments(depts);
      setExaminations(exams);

      const initialExamId = selectedExamId || exams[0]?.id || '';
      if (!selectedExamId && initialExamId) setSelectedExamId(initialExamId);

      const allMarks = await marksService.getAllMarks({ examinationId: initialExamId });
      setSubjectMarksList(allMarks);
      setModerationLogs(marksService.getModerationLogs(initialExamId));
    } catch (err) {
      console.error('Failed to load marks data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId]);

  // Load marks list for selected subject inspector
  useEffect(() => {
    if (selectedSubject && selectedExamId) {
      const marks = marksService.getMarksBySubject(selectedSubject.subject_id, selectedExamId);
      setSubjectMarksList(marks);
    }
  }, [selectedSubject, selectedExamId]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return subjectSummaries.filter((s) => {
      const matchDept = selectedDeptId === 'all' || s.department_name.toLowerCase().includes(selectedDeptId.toLowerCase());
      const matchSearch =
        !searchQuery.trim() ||
        s.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.faculty_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [subjectSummaries, selectedDeptId, searchQuery]);

  // Key University-wide Metrics
  const totalCourses = subjectSummaries.length;
  const submittedCourses = subjectSummaries.filter((s) => s.status === 'submitted' || s.status === 'verified' || s.status === 'moderated' || s.status === 'locked').length;
  const verifiedCourses = subjectSummaries.filter((s) => s.status === 'verified' || s.status === 'moderated' || s.status === 'locked').length;
  const lockedCourses = subjectSummaries.filter((s) => s.status === 'locked').length;
  const overallAvgPass = Math.round(
    subjectSummaries.reduce((acc, s) => acc + s.pass_percentage, 0) / (totalCourses || 1)
  );

  // Inspector subject statistics
  const inspectorStats: SubjectMarksStatistics = useMemo(() => {
    if (!selectedSubject) {
      return {
        total_candidates: 0,
        evaluated_count: 0,
        passed_count: 0,
        failed_count: 0,
        absent_count: 0,
        pass_percentage: 0,
        average_score: 0,
        highest_score: 0,
        lowest_score: 0,
        std_deviation: 0,
        grade_distribution: {},
        anomalies: []
      };
    }
    return marksService.getSubjectStatistics(selectedSubject.subject_id, selectedExamId);
  }, [selectedSubject, selectedExamId, subjectMarksList]);

  // Admin Actions
  const handleVerifySubject = (subjectId: string) => {
    try {
      const subjectMarks = subjectMarksList.filter((m) => m.subject_id === subjectId);
      const unentered = subjectMarks.filter((m) => m.total_marks === undefined || m.total_marks === null);
      if (unentered.length > 0) {
        setMessage({
          type: 'error',
          text: `Cannot verify marks: ${unentered.length} of ${subjectMarks.length} candidates still have unentered scores. Completeness is statutorily required before administrative verification.`,
        });
        return;
      }

      marksService.verifySubjectMarks(subjectId, selectedExamId, profile?.id || 'usr-admin-01');
      setMessage({
        type: 'success',
        text: 'Subject marks verified by Examination Branch & Controller of Examinations.'
      });
      loadData();
    } catch {
      setMessage({ type: 'error', text: 'Failed to verify marks.' });
    }
  };

  const handleLockSubject = (subjectId: string) => {
    try {
      marksService.lockSubjectMarks(subjectId, selectedExamId, profile?.id || 'usr-admin-01');
      setMessage({
        type: 'success',
        text: 'Subject marks locked permanently. Ready for Tabulation & Results Publication!'
      });
      loadData();
    } catch {
      setMessage({ type: 'error', text: 'Failed to lock marks.' });
    }
  };

  const handleApplyModeration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      const rule: ModerationRule = {
        rule_type: modRuleType,
        grace_marks: Number(modGraceMarks) || 0,
        resolution_reference: modResolutionRef,
        moderated_by: profile?.full_name || 'Board of Examiners Moderation Committee',
        reason: modReason
      };

      const result = marksService.applyModerationRule(
        selectedSubject.subject_id,
        selectedExamId,
        rule
      );

      setMessage({
        type: 'success',
        text: `Moderation rule applied successfully! ${result.affectedCount} candidate records updated.`
      });
      setIsModerationModalOpen(false);
      loadData();
    } catch {
      setMessage({ type: 'error', text: 'Failed to apply moderation rule.' });
    }
  };

  const handleUnlockSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !unlockReason.trim()) return;

    try {
      marksService.reopenSubjectMarks(selectedSubject.subject_id, selectedExamId, unlockReason);
      setMessage({
        type: 'success',
        text: 'Subject reopened for revision. Evaluating faculty notified with audit reason.'
      });
      setIsUnlockModalOpen(false);
      setUnlockReason('');
      loadData();
    } catch {
      setMessage({ type: 'error', text: 'Failed to reopen subject.' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Hidden in Print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                Examination Branch &bull; CoE Console
              </span>
              <span className="text-xs text-[#64748B] font-medium">Evaluation Oversight &amp; Moderation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              University Marks Moderation &amp; Assessment Verification
            </h1>
            <p className="text-xs text-[#64748B]">
              Course submission tracker, bell curve audit, Moderation Committee grace mark engine, and CoE final lock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Board Report</span>
            </button>
          </div>
        </div>

        {/* Global Progress Metrics */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-[#64748B] block">Total Courses</span>
            <span className="text-xl font-mono font-bold text-[#0F2747]">{totalCourses}</span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-[#1E5AA8] block">Faculty Submitted</span>
            <span className="text-xl font-mono font-bold text-[#1E5AA8]">{submittedCourses} / {totalCourses}</span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Verified by Admin</span>
            <span className="text-xl font-mono font-bold text-emerald-700">{verifiedCourses} / {totalCourses}</span>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-purple-700 block">Locked for Results</span>
            <span className="text-xl font-mono font-bold text-purple-700">{lockedCourses} / {totalCourses}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-[#64748B] block">Average Pass Rate</span>
            <span className="text-xl font-mono font-bold text-emerald-600">{overallAvgPass}%</span>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`print:hidden p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="print:hidden flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Course Evaluation Board ({totalCourses})</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Subject Marks Inspector &amp; Bell Curve</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Moderation Committee Console</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Moderation History &amp; Minutes</span>
        </button>
      </div>

      {/* TAB 1: Course Evaluation Board */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Examination Cycle</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1E5AA8]"
                >
                  {examinations.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Department</span>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1E5AA8]"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8] w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject Code &amp; Title</th>
                  <th className="py-3 px-4">Department &amp; Examiner</th>
                  <th className="py-3 px-3 text-center">Candidates</th>
                  <th className="py-3 px-3 text-center">Pass Rate</th>
                  <th className="py-3 px-3 text-center">Class Avg</th>
                  <th className="py-3 px-4 text-center">Submission Status</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((sub) => (
                  <tr key={sub.subject_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <strong className="font-mono text-[#1E5AA8] block">{sub.subject_code}</strong>
                      <span className="text-xs font-bold text-[#0F2747]">{sub.subject_name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-medium block">{sub.faculty_name}</span>
                      <span className="text-[11px] text-[#64748B]">{sub.department_name}</span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {sub.total_students}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          sub.pass_percentage >= 75
                            ? 'text-emerald-700'
                            : sub.pass_percentage >= 50
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {sub.pass_percentage}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#0F2747]">
                      {sub.average_marks} / 100
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          sub.status === 'locked'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : sub.status === 'moderated'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : sub.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sub.status === 'submitted'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubject(sub);
                            setActiveTab('inspector');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {sub.status === 'submitted' && (
                          <button
                            onClick={() => handleVerifySubject(sub.subject_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        {(sub.status === 'verified' || sub.status === 'moderated') && (
                          <button
                            onClick={() => handleLockSubject(sub.subject_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Lock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Subject Marks Inspector & Bell Curve */}
      {activeTab === 'inspector' && selectedSubject && (
        <div className="space-y-6">
          {/* Subject Header & Quick Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#1E5AA8] tracking-wider">
                  Course Evaluation Inspection
                </span>
                <h3 className="text-base font-bold text-[#0F2747]">
                  {selectedSubject.subject_code}: {selectedSubject.subject_name}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Examiner: {selectedSubject.faculty_name} &bull; {selectedSubject.department_name}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsModerationModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Apply Moderation</span>
                </button>

                {selectedSubject.status !== 'verified' && selectedSubject.status !== 'locked' && (
                  <button
                    onClick={() => handleVerifySubject(selectedSubject.subject_id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Marks</span>
                  </button>
                )}

                {selectedSubject.status !== 'locked' ? (
                  <button
                    onClick={() => handleLockSubject(selectedSubject.subject_id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Final Lock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen for Revision</span>
                  </button>
                )}
              </div>
            </div>

            {/* Statistics and Bell Curve Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Pass Rate</span>
                <strong className="text-lg font-mono text-emerald-700">{inspectorStats.pass_percentage}%</strong>
                <span className="text-[10px] text-slate-500 block">{inspectorStats.passed_count} of {inspectorStats.total_candidates} passed</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Class Mean</span>
                <strong className="text-lg font-mono text-[#1E5AA8]">{inspectorStats.average_score} / 100</strong>
                <span className="text-[10px] text-slate-500 block">Std Dev &plusmn;{inspectorStats.std_deviation}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Score Range</span>
                <strong className="text-lg font-mono text-slate-900">{inspectorStats.highest_score} - {inspectorStats.lowest_score}</strong>
                <span className="text-[10px] text-slate-500 block">Max vs Min Marks</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Grade Breakdown</span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold pt-1">
                  <span className="text-purple-700">O:{inspectorStats.grade_distribution['O'] || 0}</span>
                  <span className="text-blue-700">A:{inspectorStats.grade_distribution['A'] || 0}</span>
                  <span className="text-emerald-700">B:{inspectorStats.grade_distribution['B'] || 0}</span>
                  <span className="text-rose-700">F:{inspectorStats.grade_distribution['F'] || 0}</span>
                </div>
              </div>
            </div>

            {/* Candidate List */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Roll Number &amp; Candidate</th>
                    <th className="py-3 px-3 text-center">CIA (/40)</th>
                    <th className="py-3 px-3 text-center">Theory (/60)</th>
                    <th className="py-3 px-3 text-center">Grace</th>
                    <th className="py-3 px-3 text-center font-bold text-[#0F2747]">Total (/100)</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-center">GPA</th>
                    <th className="py-3 px-4 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectMarksList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <strong className="text-[#0F2747] font-mono block">{m.roll_number}</strong>
                        <span className="text-[11px] text-[#64748B]">{m.student_name}</span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">{m.internal_marks}</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {(m.external_theory_marks || 0) + (m.external_practical_marks || 0)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700">
                        {m.moderation_grace_marks ? `+${m.moderation_grace_marks}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{m.total_marks}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#1E5AA8]">{m.grade_letter}</td>
                      <td className="py-3 px-3 text-center font-mono">{m.grade_point}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.is_passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {m.is_passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Moderation Committee Console */}
      {activeTab === 'moderation' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Statutory Marks Moderation Engine</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Apply Academic Council approved moderation rules, borderline grace marks, and paper scaling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => {
                setModRuleType('borderline_grace');
                setModGraceMarks(2);
                setIsModerationModalOpen(true);
              }}
              className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Borderline Grace Compensation</span>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">
                Compensates candidates failing by 1 to 3 marks (scoring 37-39) to achieve 40 passing threshold under Regulation 14(b).
              </p>
              <span className="text-[11px] font-bold text-purple-700 underline block pt-2">
                Configure &amp; Apply Rule &rarr;
              </span>
            </div>

            <div
              onClick={() => {
                setModRuleType('flat_curve');
                setModGraceMarks(3);
                setIsModerationModalOpen(true);
              }}
              className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <TrendingUp className="w-4 h-4 text-[#1E5AA8]" />
                <span>Uniform Flat Curve</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Applies a uniform +N score increment across all candidates in cases of syllabus deviations or defective question keys.
              </p>
              <span className="text-[11px] font-bold text-[#1E5AA8] underline block pt-2">
                Configure &amp; Apply Rule &rarr;
              </span>
            </div>

            <div
              onClick={() => {
                setModRuleType('proportional_scale');
                setModGraceMarks(5);
                setIsModerationModalOpen(true);
              }}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sliders className="w-4 h-4 text-slate-700" />
                <span>Proportional Scaling Adjustment</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scales marks by a percentage factor based on comparative statistical difficulty index and multi-year bell curve normalization.
              </p>
              <span className="text-[11px] font-bold text-slate-700 underline block pt-2">
                Configure &amp; Apply Rule &rarr;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Moderation History & Minutes */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747]">
              Board of Examiners &bull; Moderation Minutes &amp; Audit Trail
            </h3>
            <p className="text-xs text-[#64748B]">
              Complete immutable record of all academic council moderation decisions and affected candidate records.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Resolution Reference</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">Rule Applied</th>
                  <th className="py-3 px-3 text-center">Grace/Factor</th>
                  <th className="py-3 px-3 text-center">Affected Candidates</th>
                  <th className="py-3 px-4">Authorized Examiner/CoE</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moderationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">
                      No statutory moderation actions executed for this examination cycle yet.
                    </td>
                  </tr>
                ) : (
                  moderationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#1E5AA8]">
                        {log.resolution_reference}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0F2747]">
                        {log.subject_code}
                      </td>
                      <td className="py-3 px-3 text-center uppercase text-[10px] font-bold text-purple-700">
                        {log.rule_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        +{log.grace_marks} Marks
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {log.affected_students_count}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.moderated_by}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.applied_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Apply Moderation */}
      {isModerationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                Statutory Moderation Committee Tool
              </h3>
              <button
                onClick={() => setIsModerationModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyModeration} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">Target Subject:</span>
                <strong className="text-slate-900 block font-mono">
                  {selectedSubject?.subject_code}: {selectedSubject?.subject_name}
                </strong>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Moderation Algorithm</label>
                <select
                  value={modRuleType}
                  onChange={(e) => setModRuleType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#172033]"
                >
                  <option value="borderline_grace">Borderline Grace Marks (Students 35-39)</option>
                  <option value="flat_curve">Flat Curve (+N Marks to All)</option>
                  <option value="proportional_scale">Proportional Scaling (Percentile Adjust)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grace Marks / Adjustment Factor</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={modGraceMarks}
                  onChange={(e) => setModGraceMarks(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#172033]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Academic Council Resolution Reference</label>
                <input
                  type="text"
                  required
                  value={modResolutionRef}
                  onChange={(e) => setModResolutionRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#172033]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Statutory Reason &amp; Committee Minutes</label>
                <textarea
                  required
                  rows={3}
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#172033]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModerationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Execute Moderation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reopen / Unlock Subject */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Unlock className="w-4 h-4 text-amber-600" />
                Reopen Locked Subject for Revision
              </h3>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUnlockSubject} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Reopening this course will permit the evaluating faculty member to edit draft marks. Please state the formal justification.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Revision Ground / Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="e.g. Scrutiny discrepancy found in question 4 totaling..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#172033]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reopen Subject Marks</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
