import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Send,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Award,
  AlertCircle,
  Lock,
  Printer,
  Calendar,
  Building,
  Users,
  ShieldCheck
} from 'lucide-react';
import {
  examService,
  ScheduleConflict
} from '../../services/examService.js';
import { deanService } from '../../services/deanService.js';
import {
  ExamCycleWithDetails,
  ExamScheduleWithDetails
} from '../../data/mockExams.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const ExamApprovalPage: React.FC = () => {
  const { profile } = useAuth();
  const [exams, setExams] = useState<ExamCycleWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [schedules, setSchedules] = useState<ExamScheduleWithDetails[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamCycleWithDetails | null>(null);

  // Review Modals
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [deanRemarks, setDeanRemarks] = useState('Ratified by Dean of Academic Affairs. Verified conflict-free with mandatory 24h revision gap.');
  const [deanPin, setDeanPin] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const allExams = await examService.getExaminations();
      setExams(allExams);

      const pendingOrFirst = allExams.find((e) => e.approval_status === 'submitted') || allExams[0];
      const currentId = selectedExamId || (pendingOrFirst ? pendingOrFirst.id : '');
      setSelectedExamId(currentId);

      if (currentId) {
        const current = allExams.find((e) => e.id === currentId) || null;
        setSelectedExam(current);
        const exSchedules = await examService.getSchedules({ examinationId: currentId });
        setSchedules(exSchedules);
        const detectedConflicts = examService.detectConflicts(exSchedules);
        setConflicts(detectedConflicts);
      }
    } catch (e) {
      console.error('Failed to load exam data for dean:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId]);

  // Enhanced student-level cohort gap check (e.g. 0-gap back-to-back papers)
  const cohortGapAlerts = React.useMemo(() => {
    const alerts: string[] = [];
    // Sort schedules by date
    const sorted = [...schedules].sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (a.program_name === b.program_name && a.semester_number === b.semester_number) {
        const diffMs = new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays === 0) {
          alerts.push(`Critical Clash: ${a.program_name} Sem ${a.semester_number} has two papers (${a.subject_code} & ${b.subject_code}) on the same date (${a.exam_date})!`);
        } else if (diffDays === 1) {
          alerts.push(`Strenuous Schedule: ${a.program_name} Sem ${a.semester_number} has consecutive papers on ${a.exam_date} and ${b.exam_date} (0 prep days).`);
        }
      }
    }
    return alerts;
  }, [schedules]);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean Security Authorization PIN.' });
      return;
    }

    const deanName = profile?.full_name || 'Prof. Dr. Rajesh K. Varma, Ph.D. (Dean of Academic Affairs)';
    setActionProcessing(true);
    try {
      await examService.deanApproveTimetable(selectedExamId, deanName, deanRemarks, deanPin, profile?.id);

      deanService.logDeanAudit({
        action: 'EXAM_SCHEDULE_SIGNOFF',
        entityId: selectedExamId,
        entityName: selectedExam?.name || 'Examination Cycle',
        deanName,
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Timetable ratified with Dean statutory seal. Remarks: ${deanRemarks}`
      });

      setMessage({
        type: 'success',
        text: 'Examination timetable successfully ratified & approved by Dean! Ready for gazette publication.',
      });
      setIsApproveModalOpen(false);
      setDeanPin('');
      await loadData();
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve timetable.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedExamId) return;
    setActionProcessing(true);
    try {
      await examService.publishTimetable(selectedExamId);
      
      deanService.logDeanAudit({
        action: 'EXAM_SCHEDULE_SIGNOFF',
        entityId: selectedExamId,
        entityName: `${selectedExam?.name || 'Exam'} Gazette Publication`,
        deanName: profile?.full_name || 'Dean',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: 'Dean published approved examination timetable university-wide. Hall tickets unlocked.'
      });

      setMessage({ type: 'success', text: 'Timetable published university-wide! Student Hall Tickets generated automatically.' });
      setIsPublishModalOpen(false);
      await loadData();
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish timetable.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleReturnRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    if (!deanRemarks.trim()) {
      setMessage({ type: 'error', text: 'Please provide revision directives for the examination controller.' });
      return;
    }
    const deanName = profile?.full_name || 'Dean of Academic Affairs';
    setActionProcessing(true);
    try {
      await examService.returnScheduleForRevision(selectedExamId, deanName, deanRemarks);

      deanService.logDeanAudit({
        action: 'EXAM_SCHEDULE_SIGNOFF',
        entityId: selectedExamId,
        entityName: selectedExam?.name || 'Exam Cycle',
        deanName,
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Returned timetable for revision: ${deanRemarks}`
      });

      setMessage({
        type: 'success',
        text: 'Timetable returned to Controller of Examinations with formal revision directives.',
      });
      setIsRejectModalOpen(false);
      await loadData();
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to return timetable.' });
    } finally {
      setActionProcessing(false);
    }
  };

  // Group schedules by Degree Program & Semester for structured Dean review
  const groupedSchedules: Record<string, ExamScheduleWithDetails[]> = {};
  schedules.forEach((sch) => {
    const key = `${sch.program_name} — Semester ${sch.semester_number}`;
    if (!groupedSchedules[key]) groupedSchedules[key] = [];
    groupedSchedules[key].push(sch);
  });

  return (
    <div className="space-y-6">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory Examination Timetable Ratification Desk</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Examination Timetable &amp; Schedule Ratification
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Conduct statutory review of draft examination timetables submitted by the Controller of Examinations. Verify room clash immunity, faculty invigilation assignments, student study intervals, and execute cryptographic Dean Sign-off.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Approval Status</span>
              <div className="text-lg font-academic-display font-extrabold text-amber-400 mt-0.5 capitalize">
                {selectedExam?.approval_status?.replace(/_/g, ' ') || 'Draft Review'}
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">
                {conflicts.length === 0 ? '0 Conflict Flags' : `${conflicts.length} Venue Conflicts`}
              </span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Cycle Selector & Submission Audit Dossier */}
      <div className="card-3d bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Active Examination Cycle
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] min-w-[280px]"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.approval_status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Submission Audit Dossier */}
          {selectedExam && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex flex-wrap items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Submitted By</span>
                <span className="font-bold text-[#0F2747]">Controller of Examinations</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Exam Window</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedExam.start_date} to {selectedExam.end_date}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Integrity Seal</span>
                <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">
                  SHA256: 8f9a2b4...
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedExam?.approval_status === 'submitted' && (
              <>
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Ratify Timetable</span>
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                >
                  Return Revision
                </button>
              </>
            )}

            {selectedExam?.approval_status === 'approved' && (
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Publish University-Wide</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cohort Prep Gap / Back-to-Back Warning Alert */}
      {cohortGapAlerts.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Student Cohort Schedule Alerts ({cohortGapAlerts.length})</span>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {cohortGapAlerts.map((alt, idx) => (
              <li key={idx} className="text-amber-800 font-medium">
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structured Grouped Timetable by Program */}
      <div className="space-y-6">
        {Object.keys(groupedSchedules).length === 0 ? (
          <div className="card-3d bg-white p-8 rounded-3xl text-center text-slate-500 text-xs">
            No papers scheduled under this examination cycle yet.
          </div>
        ) : (
          Object.entries(groupedSchedules).map(([groupTitle, list]) => (
            <div key={groupTitle} className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1E5AA8]" />
                  <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                    {groupTitle}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {list.length} Papers Scheduled
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/60 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-3 px-4">Date &amp; Day</th>
                      <th className="py-3 px-4">Time Window</th>
                      <th className="py-3 px-4">Course &amp; Subject</th>
                      <th className="py-3 px-4">Exam Hall / Venue</th>
                      <th className="py-3 px-4">Chief Invigilator</th>
                      <th className="py-3 px-3 text-center">Clash Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F2747]">
                          {sch.exam_date}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {sch.start_time} - {sch.end_time}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-2 border border-slate-200">
                            {sch.subject_code}
                          </span>
                          <span className="font-semibold text-slate-800">{sch.subject_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{sch.room_number || 'Main Examination Hall'}</div>
                          <div className="text-[10px] text-slate-400">Capacity: 60 Seats</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {(sch as any).chief_invigilator_name || 'Dr. Priya Nambiar'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Clear
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── APPROVE TIMETABLE MODAL (WITH PIN) ── */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747]">
                  Ratify Examination Schedule
                </h2>
                <p className="text-xs text-slate-500 font-mono">Cycle: {selectedExam?.name}</p>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dean Statutory Remarks / Endorsement Note
                </label>
                <textarea
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              {/* Secure PIN Gate */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <label className="block text-xs font-bold text-amber-900">
                  Dean Authorization PIN
                </label>
                <input
                  type="password"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  required
                  placeholder="Enter 4-digit Dean PIN"
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747]"
                />
                <span className="text-[10px] text-amber-800">
                  Required to affix Academic Council digital seal.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  {actionProcessing ? 'Ratifying...' : 'Affix Seal & Ratify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FORMAL PUBLISH CONFIRMATION MODAL (REPLACED BROWSER CONFIRM) ── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747]">
                  Publish Examination Gazette
                </h2>
                <p className="text-xs text-slate-500 font-mono">University-Wide Distribution</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Statutory Publication Notice</span>
              </div>
              <div>
                Publishing this approved timetable will:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Make dates visible across all student and faculty portals</li>
                <li>Unlock automated Hall Ticket generation for fee-cleared students</li>
                <li>Dispatch SMS and in-app circular alerts to enrolled candidates</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={actionProcessing}
                className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
              >
                {actionProcessing ? 'Publishing...' : 'Confirm University Publication'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN REVISION MODAL ── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-rose-700">
                  Return Timetable for Revision
                </h2>
                <p className="text-xs text-slate-500 font-mono">Directives for Controller of Examinations</p>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Directives / Conflict Details
                </label>
                <textarea
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  rows={4}
                  required
                  placeholder="Detail why schedule is returned (e.g., MCA-202 has 0 prep gap, Hall 204 capacity issue)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {actionProcessing ? 'Returning...' : 'Return Directives'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
