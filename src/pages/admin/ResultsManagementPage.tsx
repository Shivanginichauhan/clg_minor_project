import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Search,
  Check,
  X,
  Send,
  Eye,
  Lock,
  Sparkles,
  BarChart3,
  Users,
  ShieldCheck,
  ChevronRight,
  Filter,
  FileText,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { resultsService } from '../../services/resultsService.js';
import { examService } from '../../services/examService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { marksService } from '../../services/marksService.js';
import { SemesterResultWithDetails, UGC_GRADE_SCALE } from '../../data/mockResults.js';

export const ResultsManagementPage: React.FC = () => {
  const [examinations, setExaminations] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SemesterResultWithDetails[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDraftWarning, setPendingDraftWarning] = useState<string | null>(null);

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

  const initiateTabulation = async () => {
    setIsProcessing(true);
    try {
      const allMarks = await marksService.getAllMarks({ examinationId: selectedExamId });
      const draftMarks = allMarks.filter((m) => m.status === 'draft');
      if (draftMarks.length > 0) {
        setPendingDraftWarning(
          `Notice: ${draftMarks.length} candidate marks entries are currently in DRAFT status and have not been locked by the Controller of Examinations. Tabulating now will incorporate tentative marks.`
        );
      } else {
        setPendingDraftWarning(null);
      }
      setShowConfirmModal(true);
    } catch (e) {
      setShowConfirmModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeRetabulateCohort = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    try {
      const regenerated = resultsService.tabulateCohortResults(
        selectedExamId,
        selectedProgramId,
        selectedSemester
      );
      setResults(regenerated);
      setMessage({
        type: 'success',
        text: `Results successfully compiled and tabulated from verified marks for ${regenerated.length} candidates.`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Cohort tabulation failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'PASS' && r.overall_status !== 'PASS') return false;
      if (statusFilter === 'PROMOTED_WITH_ARREARS' && r.overall_status !== 'PROMOTED_WITH_ARREARS') return false;
      if (statusFilter === 'FAIL' && r.overall_status !== 'FAIL') return false;
      if (statusFilter === 'ARREAR' && r.overall_status !== 'PROMOTED_WITH_ARREARS' && r.overall_status !== 'FAIL') return false;
      if (statusFilter === 'WITHHELD' && r.overall_status !== 'WITHHELD') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.student_name.toLowerCase().includes(q) ||
        r.roll_number.toLowerCase().includes(q) ||
        r.enrollment_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = results.length;
  const fullPassed = results.filter((r) => r.overall_status === 'PASS').length;
  const promotedWithArrears = results.filter((r) => r.overall_status === 'PROMOTED_WITH_ARREARS').length;
  const failed = results.filter((r) => r.overall_status === 'FAIL').length;
  const withheld = results.filter((r) => r.overall_status === 'WITHHELD').length;
  const clearancePct = total > 0 ? Math.round(((fullPassed + promotedWithArrears) / total) * 100) : 0;
  const avgSgpa = total > 0 ? (results.reduce((s, r) => s + (r.sgpa || 0), 0) / total).toFixed(2) : '0.00';
  const arrearCount = promotedWithArrears + failed;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
              Examination Cell Tabulation Hub
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> UGC 10-Pt SGPA Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Results Tabulation &amp; Grade Processing
          </h1>
          <p className="text-xs text-[#64748B]">
            Automated SGPA/CGPA compilation from verified continuous assessments, moderation adjustments, and gazette preparation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={initiateTabulation}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-2 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Tabulating...' : 'Re-Tabulate Cohort'}
          </button>

          <Link
            to="/dean/results-approval"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1.5 shadow-xs transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Dean Sign-off Console &rarr;
          </Link>

          <Link
            to="/admin/revaluation"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition"
          >
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            Re-evaluation Desk &rarr;
          </Link>
        </div>
      </div>

      {/* Cohort Selectors */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Examination Session
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Academic Program
          </label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            <option value="all">All Academic Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            <option value={2}>Semester 2</option>
            <option value={4}>Semester 4</option>
            <option value={1}>Semester 1</option>
            <option value={3}>Semester 3</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
          >
            <option value="all">All Statuses ({total})</option>
            <option value="PASS">Passed Full ({fullPassed})</option>
            <option value="PROMOTED_WITH_ARREARS">Promoted with Arrears ({promotedWithArrears})</option>
            <option value="FAIL">Failed / Year Back ({failed})</option>
            <option value="WITHHELD">Withheld ({withheld})</option>
            <option value="ARREAR">Any Backlog / Arrear ({arrearCount})</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Cohort Candidates</span>
            <Users className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="text-2xl font-bold text-[#0F2747]">{total} Students</div>
          <p className="text-[11px] text-[#64748B]">{fullPassed} clear &bull; {promotedWithArrears} promoted w/ arrears</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Overall Clearance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{clearancePct}%</div>
          <p className="text-[11px] text-[#64748B]">{fullPassed + promotedWithArrears} of {total} advanced</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Cohort Average SGPA</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{avgSgpa}</div>
          <p className="text-[11px] text-[#64748B]">UGC 10-point scale</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Backlog Candidates</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{arrearCount}</div>
          <p className="text-[11px] text-[#64748B]">Eligible for supplementary / re-eval</p>
        </div>
      </div>

      {/* Tabulation Register Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1E5AA8]" />
            <h3 className="text-sm font-bold text-[#0F2747]">
              Tabulated Grade Foil Sheet &bull; {filteredResults.length} Records
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F2747] focus:outline-none"
              />
            </div>
            <button
              onClick={() => resultsService.exportTabulationRegisterCSV(selectedExamId, selectedProgramId)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-[#64748B] uppercase">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Registered</th>
                <th className="py-3 px-4 text-center">Earned</th>
                <th className="py-3 px-4 text-center">SGPA</th>
                <th className="py-3 px-4 text-center">CGPA</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Academic Division</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length > 0 ? (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F2747]">{r.roll_number}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F2747]">{r.student_name}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.total_credits_registered}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">{r.total_credits_earned}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-extrabold text-[#0F2747] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {r.sgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-purple-900">{r.cgpa.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          r.overall_status === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.overall_status === 'WITHHELD'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {r.overall_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{r.academic_standing}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No results found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cohort Tabulation Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1E5AA8]" />
                <h3 className="text-base font-bold text-[#0F2747]">
                  Confirm Cohort Grade Tabulation
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Tabulating cohort results will compile internal assessments and external theory examination scores, recalculate UGC 10-point SGPA and cumulative credits, and generate the gazette foil sheet.
              </p>

              {pendingDraftWarning ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-semibold block">Attention: Unlocked Draft Marks Detected</strong>
                    <p className="text-[11px] leading-normal">{pendingDraftWarning}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All course marks for this examination cycle have been verified by examiners.</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Target Exam Cycle:</span>
                  <span className="font-semibold text-slate-900">
                    {examinations.find((e) => e.id === selectedExamId)?.name || selectedExamId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Academic Semester:</span>
                  <span className="font-semibold text-slate-900">Semester {selectedSemester}</span>
                </div>
                <div className="flex justify-between">
                  <span>Candidate Roster Size:</span>
                  <span className="font-semibold text-slate-900">{results.length} Candidates</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRetabulateCohort}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Tabulate Cohort</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
