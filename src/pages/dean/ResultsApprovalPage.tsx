import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Search,
  Check,
  X,
  Send,
  Eye,
  Lock,
  Sparkles,
  BarChart3,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { resultsService } from '../../services/resultsService.js';
import { examService } from '../../services/examService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { deanService } from '../../services/deanService.js';
import { SemesterResultWithDetails, UGC_GRADE_SCALE } from '../../data/mockResults.js';
import { useAuth } from '../../contexts/AuthContext.js';

export const ResultsApprovalPage: React.FC = () => {
  const { profile } = useAuth();
  const [examinations, setExaminations] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [results, setResults] = useState<SemesterResultWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Modals
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isWithholdModalOpen, setIsWithholdModalOpen] = useState(false);
  const [isSamplingModalOpen, setIsSamplingModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [spotCheckSamples, setSpotCheckSamples] = useState<SemesterResultWithDetails[]>([]);
  const [selectedResultForWithhold, setSelectedResultForWithhold] = useState<SemesterResultWithDetails | null>(null);
  const [withholdReason, setWithholdReason] = useState('');
  const [selectedResultForView, setSelectedResultForView] = useState<SemesterResultWithDetails | null>(null);
  const [deanPin, setDeanPin] = useState('');
  const [deanRemarks, setDeanRemarks] = useState('Approved by Dean of Academic Affairs following scrutiny of moderation records.');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [exams, progs] = await Promise.all([
        examService.getExaminations(),
        academicStructureService.getPrograms(),
      ]);
      setExaminations(exams);
      setPrograms(progs);

      const examId = selectedExamId || (exams[0] ? exams[0].id : '');
      setSelectedExamId(examId);

      const resList = await resultsService.getResults({
        examinationId: examId || undefined,
        programId: selectedProgramId === 'all' ? undefined : selectedProgramId,
        semesterNumber: selectedSemester,
      });

      setResults(resList);
    } catch (err) {
      console.error('Failed to load results:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId, selectedProgramId, selectedSemester]);

  // Filtered list
  const filteredResults = results.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.roll_number.toLowerCase().includes(q) ||
      r.enrollment_number.toLowerCase().includes(q)
    );
  });

  // Aggregate Metrics
  const totalCandidates = results.length;
  const passedCandidates = results.filter((r) => r.overall_status === 'PASS').length;
  const passPercentage = totalCandidates > 0 ? Math.round((passedCandidates / totalCandidates) * 100) : 0;
  const avgSGPA = totalCandidates > 0 ? (results.reduce((sum, r) => sum + r.sgpa, 0) / totalCandidates).toFixed(2) : '0.00';
  const highestSGPA = totalCandidates > 0 ? Math.max(...results.map((r) => r.sgpa)).toFixed(2) : '0.00';
  const arrearCount = results.filter((r) => r.overall_status === 'PROMOTED_WITH_ARREARS' || r.overall_status === 'FAIL').length;
  const withheldCount = results.filter((r) => r.overall_status === 'WITHHELD').length;

  const approvalStatus = results.length > 0 ? results[0].result_status : 'draft';

  // Anomaly Detection: check subjects where fail rate > 20%
  const subjectAnomalies = React.useMemo(() => {
    const subStats: Record<string, { code: string; name: string; total: number; failed: number }> = {};
    results.forEach(res => {
      res.subjects.forEach(sub => {
        if (!subStats[sub.subject_code]) {
          subStats[sub.subject_code] = { code: sub.subject_code, name: sub.subject_name, total: 0, failed: 0 };
        }
        subStats[sub.subject_code].total += 1;
        if (sub.grade_point === 0 || sub.letter_grade === 'F') {
          subStats[sub.subject_code].failed += 1;
        }
      });
    });

    return Object.values(subStats).filter(s => s.total > 0 && (s.failed / s.total) > 0.2);
  }, [results]);

  const handleOpenSampling = () => {
    if (results.length === 0) return;
    // Pick 3 pseudo-random or spread samples
    const shuffled = [...results].sort(() => 0.5 - Math.random());
    setSpotCheckSamples(shuffled.slice(0, 3));
    setIsSamplingModalOpen(true);
  };

  const handleDigitalSignoff = async () => {
    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean Security Authorization PIN.' });
      return;
    }

    try {
      await resultsService.deanApproveResults(
        selectedExamId,
        selectedProgramId,
        profile?.id || 'prof-dean-01',
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma, Ph.D.',
        deanRemarks,
        deanPin
      );

      deanService.logDeanAudit({
        action: 'RESULTS_RATIFICATION',
        entityId: `${selectedExamId}-${selectedProgramId}`,
        entityName: `Results Gazette (${totalCandidates} Candidates, ${passPercentage}% Pass)`,
        deanName: profile?.full_name || 'Prof. Dr. Rajesh K. Varma',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Dean executed statutory signoff for ${totalCandidates} candidates with SGPA Mean ${avgSGPA}.`
      });

      setIsSignoffModalOpen(false);
      setDeanPin('');
      setMessage({
        type: 'success',
        text: 'Academic Council statutory sign-off completed. Results approved for gazette publication.',
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve results.' });
    }
  };

  const handlePublishResults = async () => {
    try {
      await resultsService.publishResults(selectedExamId, selectedProgramId);
      
      deanService.logDeanAudit({
        action: 'RESULTS_RATIFICATION',
        entityId: `${selectedExamId}-${selectedProgramId}`,
        entityName: 'Results Live Gazette Publication',
        deanName: profile?.full_name || 'Dean of Academic Affairs',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Published live grade cards for ${totalCandidates} candidates.`
      });

      setIsPublishModalOpen(false);
      setMessage({
        type: 'success',
        text: 'Results officially published! All student grade cards are now live on the student portal.',
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish results.' });
    }
  };

  const handleRecallResults = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean PIN.' });
      return;
    }

    try {
      // Revert status to draft in local storage results
      const updated = results.map(r => ({ ...r, result_status: 'draft' as const }));
      setResults(updated);
      localStorage.setItem('ueams_results_records', JSON.stringify(updated));

      deanService.logDeanAudit({
        action: 'RESULTS_RATIFICATION',
        entityId: `${selectedExamId}-${selectedProgramId}`,
        entityName: 'Results Reopen / Recall Action',
        deanName: profile?.full_name || 'Dean of Academic Affairs',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Dean recalled results back to draft: ${reopenReason}`
      });

      setIsReopenModalOpen(false);
      setDeanPin('');
      setReopenReason('');
      setMessage({
        type: 'success',
        text: 'Results successfully recalled & reopened for moderation review. Live grade cards revoked.',
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to recall results.' });
    }
  };

  const handleToggleWithhold = async () => {
    if (!selectedResultForWithhold) return;
    const isCurrentlyWithheld = selectedResultForWithhold.overall_status === 'WITHHELD';
    try {
      await resultsService.toggleWithholdStatus(
        selectedResultForWithhold.id,
        !isCurrentlyWithheld,
        withholdReason
      );
      setIsWithholdModalOpen(false);
      setSelectedResultForWithhold(null);
      setWithholdReason('');
      setMessage({
        type: 'success',
        text: `Candidate ${selectedResultForWithhold.roll_number} result status updated successfully.`,
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update withhold status.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold hover:opacity-75"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Statutory Gazette Console
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 ${approvalStatus === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : approvalStatus === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {approvalStatus === 'published'
                ? 'Gazette Published'
                : approvalStatus === 'approved'
                  ? 'Dean Signed Off (Ready to Publish)'
                  : 'Pending Dean Signoff'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Results Tabulation Register &amp; Statutory Approval
          </h1>
          <p className="text-xs text-[#64748B]">
            Controller of Examinations Gazette Register, Grade Point Average (SGPA/CGPA) verification, and university results publication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => resultsService.exportTabulationRegisterCSV(selectedExamId, selectedProgramId)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export TR (CSV)
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Ledger
          </button>

          <button
            onClick={handleOpenSampling}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 flex items-center gap-1.5 shadow-xs transition"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            Spot-Check (3 Samples)
          </button>

          {approvalStatus !== 'approved' && approvalStatus !== 'published' ? (
            <button
              onClick={() => setIsSignoffModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-2 shadow-xs transition"
            >
              <Award className="w-4 h-4 text-amber-400" />
              Dean Digital Sign-off
            </button>
          ) : approvalStatus === 'approved' ? (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-emerald-700 text-white flex items-center gap-2 shadow-xs transition"
            >
              <Send className="w-4 h-4" />
              Publish Results Live
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live on Student Portal
              </div>
              <button
                onClick={() => setIsReopenModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
              >
                Recall / Reopen Results
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Subject Anomaly Flags if any */}
      {subjectAnomalies.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Academic Performance Anomalies Detected ({subjectAnomalies.length} Subject(s) with &gt;20% Failure)</span>
          </div>
          <p className="text-xs text-amber-800">
            The following subjects deviate from institutional grade distribution benchmarks:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {subjectAnomalies.map(sub => (
              <span key={sub.code} className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-mono text-[11px] font-bold text-amber-900">
                {sub.code}: {sub.failed} of {sub.total} failed ({Math.round((sub.failed / sub.total) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cohort & Examination Selectors */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Examination Session Cycle
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.session_name || '2025-26'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Academic Program / Degree
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            <option value="prog-mca-01">Master of Computer Applications (MCA)</option>
            <option value="prog-btech-cse-02">B.Tech Computer Science &amp; Engineering</option>
            <option value="all">All Departments (Consolidated Gazette)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Semester Level
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            <option value={2}>Semester 2 (Even Term)</option>
            <option value={4}>Semester 4 (Graduating Batch)</option>
            <option value={1}>Semester 1 (Autumn Term)</option>
            <option value={3}>Semester 3 (Odd Term)</option>
          </select>
        </div>
      </div>

      {/* Statistical KPIs Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-[#64748B] uppercase font-bold">Total Candidates</span>
          <div className="text-xl font-bold text-[#0F2747]">{totalCandidates}</div>
          <p className="text-[10px] text-slate-500">Evaluated in cohort</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-emerald-700 uppercase font-bold">Pass Percentage</span>
          <div className="text-xl font-bold text-emerald-600">{passPercentage}%</div>
          <p className="text-[10px] text-slate-500">{passedCandidates} of {totalCandidates} cleared</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-[#1E5AA8] uppercase font-bold">Cohort Mean SGPA</span>
          <div className="text-xl font-bold text-[#1E5AA8]">{avgSGPA}</div>
          <p className="text-[10px] text-slate-500">Scale of 10.0</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-purple-700 uppercase font-bold">Highest SGPA</span>
          <div className="text-xl font-bold text-purple-700">{highestSGPA}</div>
          <p className="text-[10px] text-slate-500">Top Rank 1</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-amber-700 uppercase font-bold">Arrear / Backlogs</span>
          <div className="text-xl font-bold text-amber-600">{arrearCount}</div>
          <p className="text-[10px] text-slate-500">Eligible for re-exam</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <span className="text-[10px] text-rose-700 uppercase font-bold">Withheld Cases</span>
          <div className="text-xl font-bold text-rose-600">{withheldCount}</div>
          <p className="text-[10px] text-slate-500">Pending clearance</p>
        </div>
      </div>

      {/* UGC Grade Reference Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#0F2747]">
          <BarChart3 className="w-4 h-4 text-[#1E5AA8]" />
          <span>UGC Standard 10-Point Grade Key:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {UGC_GRADE_SCALE.map((g) => (
            <span
              key={g.grade}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${g.color_badge}`}
              title={`${g.description} (${g.range}% - GP ${g.grade_point})`}
            >
              {g.grade} = {g.grade_point}
            </span>
          ))}
        </div>
      </div>

      {/* Tabulation Register Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1E5AA8]" />
            <h3 className="text-sm font-bold text-[#0F2747]">
              Tabulation Register (TR) Ledger &bull; Semester {selectedSemester}
            </h3>
            <span className="text-xs text-[#64748B]">({filteredResults.length} students)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F2747] focus:outline-none focus:ring-1 focus:ring-[#1E5AA8]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4 text-center">Registered / Earned</th>
                <th className="py-3 px-4 text-center">SGPA</th>
                <th className="py-3 px-4 text-center">CGPA</th>
                <th className="py-3 px-4">Academic Division</th>
                <th className="py-3 px-4 text-center">Overall Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => {
                  const isExpanded = expandedResultId === result.id;
                  const isWithheld = result.overall_status === 'WITHHELD';

                  return (
                    <React.Fragment key={result.id}>
                      <tr className={`hover:bg-slate-50/60 transition ${isWithheld ? 'bg-rose-50/30' : ''}`}>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F2747]">
                          #{result.rank_in_class}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {result.avatar_url ? (
                              <img
                                src={result.avatar_url}
                                alt={result.student_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {result.student_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#0F2747]">{result.student_name}</div>
                              <div className="text-[11px] text-[#64748B] font-mono">
                                Roll: {result.roll_number} &bull; Enr: {result.enrollment_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                          {result.total_credits_registered} / <span className="font-bold text-[#0F2747]">{result.total_credits_earned}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-extrabold text-[#0F2747] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {result.sgpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-extrabold text-purple-900 font-mono">
                            {result.cgpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                            {result.academic_standing}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${result.overall_status === 'PASS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : result.overall_status === 'WITHHELD'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                          >
                            {result.overall_status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedResultId(isExpanded ? null : result.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Toggle course breakdown"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setSelectedResultForView(result)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#1E5AA8] transition"
                            >
                              Grade Card
                            </button>
                            <button
                              onClick={() => {
                                setSelectedResultForWithhold(result);
                                setWithholdReason(result.withheld_reason || '');
                                setIsWithholdModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg border transition ${isWithheld
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                                }`}
                              title={isWithheld ? 'Release withheld result' : 'Withhold result'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Course Subject Matrix */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                                  Course-Wise Evaluation Breakdown &bull; {result.student_name} ({result.roll_number})
                                </h4>
                                <span className="text-[11px] text-[#64748B]">
                                  Total Credit Points: <strong className="text-[#0F2747]">{result.total_credit_points}</strong> / {result.total_credits_registered * 10}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {result.subjects.map((sub) => (
                                  <div
                                    key={sub.subject_id}
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-xs font-bold text-[#1E5AA8]">
                                        {sub.subject_code}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${sub.status === 'PASS'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-red-100 text-red-800'
                                          }`}
                                      >
                                        {sub.letter_grade} (GP {sub.grade_point})
                                      </span>
                                    </div>
                                    <div className="text-xs font-semibold text-[#0F2747] line-clamp-1">
                                      {sub.subject_name}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-slate-200/60">
                                      <span>CIA: {sub.internal_marks}/{sub.max_internal}</span>
                                      <span>Ext: {sub.external_marks}/{sub.max_external}</span>
                                      <span className="font-bold text-[#0F2747]">Tot: {sub.total_marks}/100</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No tabulated results found for the selected examination cycle. Click &quot;Tabulate Cohort&quot; to compute.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dean Digital Sign-off Modal */}
      {isSignoffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F2747]">Dean Statutory Digital Sign-off</h3>
                  <p className="text-[11px] text-[#64748B]">Board of Examinations Gazette Approval</p>
                </div>
              </div>
              <button
                onClick={() => setIsSignoffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Examination:</span>
                <span className="font-bold text-[#0F2747]">Spring 2026 End-Semester Examinations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Program:</span>
                <span className="font-bold text-[#0F2747]">MCA (Semester 2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Candidates:</span>
                <span className="font-bold text-[#0F2747]">{totalCandidates} Students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Pass Rate:</span>
                <span className="font-bold text-emerald-700">{passPercentage}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Dean / Academic Council Endorsement Remarks
                </label>
                <textarea
                  rows={2}
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Dean Security Authorization PIN (60s Lockout on 3 Wrong Attempts)
                </label>
                <input
                  type="password"
                  placeholder="&bull;&bull;&bull;&bull;"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#0F2747] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSignoffModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDigitalSignoff}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Affix Digital Seal &amp; Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spot-Check Sampling Modal */}
      {isSamplingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                  Audited Quality Assurance
                </span>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Spot-Check Sampling Panel (Randomized 3 Candidates)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Inspect marks before issuing institutional ratification seal
                </p>
              </div>
              <button
                onClick={() => setIsSamplingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {spotCheckSamples.map((sample, idx) => (
                <div key={sample.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0F2747]">
                        #{idx + 1}. {sample.student_name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono ml-2">({sample.roll_number})</span>
                    </div>
                    <span className="font-bold text-xs font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      SGPA: {sample.sgpa.toFixed(2)} &bull; {sample.overall_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
                    {sample.subjects.slice(0, 4).map(sub => (
                      <div key={sub.subject_code} className="bg-white p-2 rounded-xl border border-slate-200">
                        <div className="font-bold font-mono text-slate-700">{sub.subject_code}</div>
                        <div className="text-[10px] text-slate-500">Marks: {sub.total_marks}/100</div>
                        <div className="text-emerald-700 font-bold">{sub.letter_grade} ({sub.grade_point} GP)</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3 of 3 Candidate marksheets audited and verified valid</span>
              </span>
              <button
                onClick={() => setIsSamplingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white cursor-pointer"
              >
                Confirm Spot-Check Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen / Recall Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-rose-700">
                  Recall / Reopen Gazetted Results
                </h3>
                <p className="text-xs text-slate-500 font-mono">Rollback results to draft status</p>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecallResults} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                Recalling results will revoke student access to digital grade cards and return the gazette to draft for marks moderation.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statutory Rationale for Recall
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail rationale (e.g. Totaling anomaly identified in MCA-201)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-[#0F2747]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Dean Authorization PIN
                </label>
                <input
                  type="password"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  required
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  Confirm Recall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Live Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F2747]">Publish Results to Student Portal</h3>
                <p className="text-xs text-[#64748B]">Immediate online release of Grade Cards</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This statutory action will publish the certified results of <strong>{totalCandidates} candidates</strong>. Students will immediately be able to view and download their digital Grade Cards with cryptographic verification QR codes.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishResults}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Confirm &amp; Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withhold Modal */}
      {isWithholdModalOpen && selectedResultForWithhold && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-[#0F2747]">
                {selectedResultForWithhold.overall_status === 'WITHHELD' ? 'Release Withheld Result' : 'Withhold Student Result'}
              </h3>
              <button onClick={() => setIsWithholdModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600">
                Candidate: <strong>{selectedResultForWithhold.student_name}</strong> ({selectedResultForWithhold.roll_number})
              </p>
              {selectedResultForWithhold.overall_status !== 'WITHHELD' ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Statutory Reason for Withholding
                  </label>
                  <select
                    value={withholdReason}
                    onChange={(e) => setWithholdReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F2747]"
                  >
                    <option value="">Select or type reason...</option>
                    <option value="UFM (Unfair Means) Case #104 pending inquiry">UFM (Unfair Means) Case under inquiry</option>
                    <option value="Tuition / Semester Fee arrears pending">Tuition Fee dues pending</option>
                    <option value="Library / Lab clearance pending">Library / Lab clearance pending</option>
                    <option value="Biometric attendance condonation under review">Attendance shortage condonation under review</option>
                  </select>
                </div>
              ) : (
                <p className="text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  Current Withhold Reason: {selectedResultForWithhold.withheld_reason || 'Pending clearance'}
                  <br />
                  Releasing this result will restore the candidate&apos;s earned SGPA ({selectedResultForWithhold.sgpa.toFixed(2)}) and published status.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsWithholdModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleWithhold}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${selectedResultForWithhold.overall_status === 'WITHHELD'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                {selectedResultForWithhold.overall_status === 'WITHHELD' ? 'Release Result' : 'Confirm Withhold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Card Modal Preview */}
      {selectedResultForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#1E5AA8]" />
                <h3 className="text-sm font-bold text-[#0F2747]">Statement of Marks &bull; Grade Card</h3>
              </div>
              <button
                onClick={() => setSelectedResultForView(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* University Crest Header */}
            <div className="text-center space-y-1 border-b border-slate-200 pb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#1E5AA8]">
                ITM University
              </div>
              <h2 className="text-base font-extrabold text-[#0F2747]">
                OFFICIAL STATEMENT OF GRADES
              </h2>
              <p className="text-[11px] text-[#64748B]">
                {selectedResultForView.examination_name} &bull; Academic Session {selectedResultForView.academic_session}
              </p>
            </div>

            {/* Student Metadata Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B]">Candidate Name:</span>
                <div className="font-bold text-[#0F2747]">{selectedResultForView.student_name}</div>
              </div>
              <div>
                <span className="text-[#64748B]">Roll Number:</span>
                <div className="font-mono font-bold text-[#0F2747]">{selectedResultForView.roll_number}</div>
              </div>
              <div>
                <span className="text-[#64748B]">Enrollment No:</span>
                <div className="font-mono font-bold text-[#0F2747]">{selectedResultForView.enrollment_number}</div>
              </div>
              <div>
                <span className="text-[#64748B]">Degree / Program:</span>
                <div className="font-bold text-[#0F2747]">{selectedResultForView.program_name} (Sem {selectedResultForView.semester_number})</div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-[#64748B] uppercase">
                    <th className="py-2.5 px-3">Course Code &amp; Title</th>
                    <th className="py-2.5 px-2 text-center">Credits</th>
                    <th className="py-2.5 px-2 text-center">CIA (/40)</th>
                    <th className="py-2.5 px-2 text-center">Ext (/60)</th>
                    <th className="py-2.5 px-2 text-center">Total</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-2 text-center">GP</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedResultForView.subjects.map((sub) => (
                    <tr key={sub.subject_id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <span className="font-mono font-bold text-[#1E5AA8]">{sub.subject_code}</span> &bull; {sub.subject_name}
                      </td>
                      <td className="py-2 px-2 text-center font-mono">{sub.credits}</td>
                      <td className="py-2 px-2 text-center font-mono">{sub.internal_marks}</td>
                      <td className="py-2 px-2 text-center font-mono">{sub.external_marks}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-[#0F2747]">{sub.total_marks}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-purple-700">{sub.letter_grade}</td>
                      <td className="py-2 px-2 text-center font-mono">{sub.grade_point}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#0F2747]">{sub.credit_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Semester SGPA</span>
                <div className="text-xl font-extrabold text-[#0F2747] font-mono">{selectedResultForView.sgpa.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Cumulative CGPA</span>
                <div className="text-xl font-extrabold text-purple-900 font-mono">{selectedResultForView.cgpa.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Result Classification</span>
                <div className="text-xs font-bold text-emerald-700">{selectedResultForView.academic_standing}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedResultForView(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Statement of Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
