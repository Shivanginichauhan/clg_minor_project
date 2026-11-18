import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { attendanceService, StudentSubjectReport } from '../../services/attendanceService.js';
import { MedicalCondonation } from '../../data/mockAttendance.js';
import {
  CalendarCheck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  Upload,
  Plus,
  Send,
  Sparkles,
  Info,
  Calendar,
  Paperclip
} from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [overallPercentage, setOverallPercentage] = useState<number>(100);
  const [totalClasses, setTotalClasses] = useState<number>(0);
  const [attendedClasses, setAttendedClasses] = useState<number>(0);
  const [excusedClasses, setExcusedClasses] = useState<number>(0);
  const [subjectReports, setSubjectReports] = useState<StudentSubjectReport[]>([]);
  const [condonations, setCondonations] = useState<MedicalCondonation[]>([]);

  // Medical Condonation Modal
  const [isCondonationOpen, setIsCondonationOpen] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [missedCount, setMissedCount] = useState<number>(2);
  const [reason, setReason] = useState<string>('');
  const [medicalDocUrl, setMedicalDocUrl] = useState<string>('');
  const [medicalDocName, setMedicalDocName] = useState<string>('');
  const [isDocDragging, setIsDocDragging] = useState<boolean>(false);
  const medicalDocInputRef = useRef<HTMLInputElement>(null);
  const [submittingCond, setSubmittingCond] = useState<boolean>(false);

  const handleMedicalFileSelected = (file: File) => {
    if (!file) return;

    // Enforce 10 MB limit in code (not just as hint text)
    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `File is too large. Please upload a document under ${MAX_FILE_SIZE_MB} MB.` });
      return;
    }

    setMedicalDocName(file.name);
    // Use an object URL to avoid inflating large PDFs as base64 in React state.
    // The URL is revoked when the condonation is submitted or the component unmounts.
    const objectUrl = URL.createObjectURL(file);
    setMedicalDocUrl(objectUrl);
  };

  // Selected subject for lecture logs drawer
  const [selectedLogReport, setSelectedLogReport] = useState<StudentSubjectReport | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'subjects' | 'condonations'>('subjects');

  useEffect(() => {
    loadAttendanceData();
  }, [user]);

  const loadAttendanceData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const studentId = user.id;
      const overview = await attendanceService.getStudentAttendanceOverview(studentId);
      const allConds = await attendanceService.getAllCondonations();
      const myConds = allConds.filter((c) => c.student_id === studentId);

      setOverallPercentage(overview.overallPercentage);
      setTotalClasses(overview.totalClasses);
      setAttendedClasses(overview.attendedClasses);
      setExcusedClasses(overview.excusedClasses);
      setSubjectReports(overview.subjectReports);
      setCondonations(myConds);

      const targetSubjectParam = searchParams.get('subjectId');
      if (targetSubjectParam) {
        const found = overview.subjectReports.find(
          (r) => r.subject.id === targetSubjectParam || r.subject.code.toLowerCase() === targetSubjectParam.toLowerCase()
        );
        if (found) {
          setSelectedSubjectId(found.subject.id);
          setSelectedLogReport(found);
        } else if (overview.subjectReports.length > 0) {
          setSelectedSubjectId(overview.subjectReports[0].subject.id);
        }
      } else if (overview.subjectReports.length > 0) {
        setSelectedSubjectId(overview.subjectReports[0].subject.id);
      }
    } catch (err) {
      console.error('Failed to load student attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCondonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedSubjectId || !reason.trim() || !fromDate || !toDate) {
      setMessage({ type: 'error', text: 'Please fill in all required medical condonation fields.' });
      return;
    }

    setSubmittingCond(true);
    setMessage(null);

    try {
      await attendanceService.applyCondonation({
        student_id: user.id,
        subject_id: selectedSubjectId,
        session_id: 'session-2025-26',
        reason: reason.trim(),
        medical_doc_url: medicalDocUrl || '',
        from_date: fromDate,
        to_date: toDate,
        missed_classes_count: missedCount,
      });

      // Revoke object URL now that submission is done to free memory
      if (medicalDocUrl && medicalDocUrl.startsWith('blob:')) {
        URL.revokeObjectURL(medicalDocUrl);
      }

      setMessage({
        type: 'success',
        text: 'Medical condonation request submitted for Dean & Academic Council review!',
      });
      setIsCondonationOpen(false);
      setReason('');
      setMedicalDocUrl('');
      setMedicalDocName('');
      await loadAttendanceData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit condonation.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmittingCond(false);
    }
  };

  const isEligible = overallPercentage >= 75;
  const isCondonable = overallPercentage >= 65 && overallPercentage < 75;

  // What-If & Recovery Calculator State
  const [calcSubjectId, setCalcSubjectId] = useState<string>('all');
  const [hypotheticalMissed, setHypotheticalMissed] = useState<number>(2);

  const selectedCalcReport = subjectReports.find((r) => r.subject.id === calcSubjectId);
  const calcAttended = selectedCalcReport ? selectedCalcReport.attended_classes : attendedClasses;
  const calcTotal = selectedCalcReport ? selectedCalcReport.total_classes : totalClasses;
  const calcCurrentPercent = calcTotal > 0 ? (calcAttended / calcTotal) * 100 : 100;
  
  // Future if missed
  const projectedPercentIfMissed = calcTotal + hypotheticalMissed > 0
    ? (calcAttended / (calcTotal + hypotheticalMissed)) * 100
    : calcCurrentPercent;

  // Classes to attend to reach 75%
  const classesToAttendFor75 = Math.max(0, Math.ceil(3 * calcTotal - 4 * calcAttended));

  // Find any course in danger zone (<75% or 75-78%)
  const dangerCourse = subjectReports.find((r) => r.percentage < 75);
  const borderlineCourse = subjectReports.find((r) => r.percentage >= 75 && r.percentage <= 78);

  return (
    <div className="space-y-6">
      {/* Early Warning Banner */}
      {dangerCourse && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-2xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="badge-3d text-[10px] uppercase font-extrabold px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300">
              🔴 Statutory Examination Risk Alert
            </span>
            <span className="text-xs font-mono font-bold text-rose-700">Clause 14.2 Violation</span>
          </div>
          <p className="text-xs text-rose-950 font-semibold leading-relaxed">
            Your attendance in <strong>{dangerCourse.subject.name} ({dangerCourse.subject.code})</strong> is currently{' '}
            <strong className="text-rose-700">{dangerCourse.percentage.toFixed(1)}%</strong> (Threshold: 75%).
            You must attend the next <strong>{Math.max(1, Math.ceil(3 * dangerCourse.total_classes - 4 * dangerCourse.attended_classes))} consecutive classes</strong> to restore your eligibility or file a medical condonation.
          </p>
        </div>
      )}

      {!dangerCourse && borderlineCourse && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-2xs space-y-1">
          <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
            ⚠️ Borderline Attendance Warning
          </span>
          <p className="text-xs text-amber-950">
            <strong>{borderlineCourse.subject.name} ({borderlineCourse.subject.code})</strong> is at{' '}
            <strong>{borderlineCourse.percentage.toFixed(1)}%</strong>. Missing just 1 more lecture will drop you below 75%.
          </p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Attendance &amp; Eligibility Ledger
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Official Examination Attendance Ledger
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              My Attendance &amp; Exam Eligibility
            </h1>
            <p className="text-xs text-[#64748B]">
              Track course-wise lecture attendance, verify 75% statutory hall-ticket thresholds, and request medical condonations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="apply-condonation-btn"
              onClick={() => setIsCondonationOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Medical Condonation</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE WHAT-IF & RECOVERY SAFETY CALCULATOR ── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] flex items-center justify-center font-bold text-xs">
              ?%
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F2747]">What-If Attendance &amp; Recovery Calculator</h3>
              <p className="text-[11px] text-slate-500">Calculate how missing upcoming lectures or attending consecutive sessions will shift your score</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
            <select
              value={calcSubjectId}
              onChange={(e) => setCalcSubjectId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
            >
              <option value="all">All Enrolled Courses (Average)</option>
              {subjectReports.map((r) => (
                <option key={r.subject.id} value={r.subject.id}>
                  {r.subject.code} - {r.subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              "If I miss..." <span className="text-rose-600 font-bold">{hypotheticalMissed} upcoming classes</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={hypotheticalMissed}
              onChange={(e) => setHypotheticalMissed(parseInt(e.target.value) || 0)}
              className="w-full accent-rose-600 cursor-pointer mt-2"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Projected Percentage:</span>
              <span className={`text-base font-extrabold ${projectedPercentIfMissed >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {projectedPercentIfMissed.toFixed(1)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              {classesToAttendFor75 === 0 ? (
                <span className="text-emerald-700 font-bold">✓ Safely above 75% threshold!</span>
              ) : (
                <span>
                  Must attend next <strong className="text-rose-700">{classesToAttendFor75} classes</strong> without absence to recover to 75%.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification">&times;</button>
        </div>
      )}

      {/* Statutory 75% Rule Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Overall Percentage Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Cumulative Attendance</span>
            <CalendarCheck className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="flex items-baseline gap-3">
            <div className={`text-3xl font-extrabold ${isEligible ? 'text-emerald-700' : isCondonable ? 'text-amber-700' : 'text-rose-700'}`}>
              {overallPercentage.toFixed(1)}%
            </div>
            <span className="text-xs text-[#64748B]">
              ({attendedClasses + excusedClasses} of {totalClasses} classes)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${isEligible ? 'bg-emerald-600' : isCondonable ? 'bg-amber-500' : 'bg-rose-600'}`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Exam Hall Ticket Eligibility */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Hall Ticket Admissibility</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2">
            {isEligible ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Eligible (Passes 75% Mandate)
              </span>
            ) : isCondonable ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Condonation Required (65%-74.9%)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Detained / Ineligible (&lt;65%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B]">
            {isEligible
              ? 'Admit card will be generated automatically for the end-semester examination.'
              : 'Medical exemption approval from Dean is required to permit exam entry.'}
          </p>
        </div>

        {/* Statutory Policy Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Statutory Regulation</span>
            <Info className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xs text-slate-700">
            University Academic Code Clause 14.2: <span className="font-semibold text-[#0F2747]">Minimum 75% attendance</span> in each registered theory and laboratory course is strictly mandatory for Semester End Exams.
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Course-wise Breakdown ({subjectReports.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('condonations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'condonations'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Medical Condonation Requests ({condonations.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Course Breakdown Cards */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectReports.map((report) => {
            const isSubEligible = report.percentage >= 75 || report.condonation?.status === 'approved';
            const isSubWarn = report.percentage >= 65 && report.percentage < 75;

            return (
              <div
                key={report.subject.id}
                className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl shadow-xs space-y-4 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1E5AA8]">{report.subject.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-100 text-slate-700">
                        {report.subject.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F2747] mt-1">{report.subject.name}</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Credits: {report.subject.credits} &bull; Semester {report.subject.semester_number}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xl font-black ${
                        isSubEligible ? 'text-emerald-700' : isSubWarn ? 'text-amber-700' : 'text-rose-700'
                      }`}
                    >
                      {report.percentage.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-[#64748B] uppercase font-semibold">Attendance</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full ${
                      isSubEligible ? 'bg-emerald-600' : isSubWarn ? 'bg-amber-500' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(report.percentage, 100)}%` }}
                  />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold">Conducted</span>
                    <div className="font-bold text-[#172033]">{report.total_classes}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold">Attended</span>
                    <div className="font-bold text-emerald-700">{report.attended_classes}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-amber-700 uppercase font-bold">Excused</span>
                    <div className="font-bold text-amber-700">{report.excused_classes}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-rose-700 uppercase font-bold">Absent</span>
                    <div className="font-bold text-rose-700">{report.absent_classes}</div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isSubEligible ? (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Exam Eligible
                      </span>
                    ) : (
                      <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLogReport(report)}
                    className="text-xs text-[#1E5AA8] hover:text-[#0F2747] font-semibold hover:underline cursor-pointer"
                  >
                    View Lecture Logs &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Medical Condonations History */}
      {activeTab === 'condonations' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Submitted Medical Condonations &amp; Dean Approvals
            </h3>
            <button
              onClick={() => setIsCondonationOpen(true)}
              className="text-xs text-[#1E5AA8] hover:text-[#0F2747] font-semibold cursor-pointer"
            >
              + New Application
            </button>
          </div>

          <div className="space-y-3">
            {condonations.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-xs">
                No medical condonation applications submitted.
              </div>
            ) : (
              condonations.map((cond) => (
                <div
                  key={cond.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1E5AA8]">
                        {cond.subject_id} &bull; Missed {cond.missed_classes_count} Lectures
                      </span>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Absence Period: <strong className="text-[#172033]">{cond.from_date}</strong> to <strong className="text-[#172033]">{cond.to_date}</strong>
                      </div>
                    </div>

                    <div>
                      {cond.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Condonation Approved
                        </span>
                      ) : cond.status === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Request Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Under Dean Review
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                    <strong className="text-[#64748B]">Reason:</strong> {cond.reason}
                  </p>

                  {cond.review_remarks && (
                    <p className="text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
                      <strong className="text-indigo-700">Dean / Academic Office Remarks:</strong> {cond.review_remarks}
                    </p>
                  )}

                  {cond.medical_doc_url && (
                    <div className="pt-1">
                      <a
                        href={cond.medical_doc_url}
                        target="_blank"
                        rel="noreferrer"
                        download="medical_certificate"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E5AA8] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Attached Medical Certificate</span>
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Apply Medical Condonation */}
      {isCondonationOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1E5AA8]" />
                  Medical Condonation Application
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Request formal attendance exemption for genuine clinical illness
                </p>
              </div>
              <button
                onClick={() => setIsCondonationOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                aria-label="Close condonation modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyCondonation} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B]">Course / Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                >
                  {subjectReports.map((sr) => (
                    <option key={sr.subject.id} value={sr.subject.id}>
                      {sr.subject.code} - {sr.subject.name} ({sr.percentage.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B]">Illness Start Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B]">Illness End Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B]">Missed Lectures Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={missedCount}
                  onChange={(e) => setMissedCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B]">Clinical Reason &amp; Medical Diagnosis</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain your medical condition, hospitalization, or doctor's prescription..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#64748B]">
                  Doctor's Certificate / Prescription (PDF or Image)
                </label>

                <input
                  ref={medicalDocInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMedicalFileSelected(file);
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => medicalDocInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDocDragging(true);
                  }}
                  onDragLeave={() => setIsDocDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDocDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleMedicalFileSelected(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
                    isDocDragging
                      ? 'border-[#1E5AA8] bg-blue-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-[#1E5AA8] bg-slate-50 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1E5AA8]">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  {medicalDocName ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#1E5AA8] font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{medicalDocName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-[#0F2747]">
                      <span className="text-[#1E5AA8] font-semibold underline">Click to upload doctor certificate</span> or drag &amp; drop
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Or enter public document URL (optional)"
                    value={medicalDocUrl}
                    onChange={(e) => setMedicalDocUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCondonationOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCond}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingCond ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Day-by-day Lecture Logs */}
      {selectedLogReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1E5AA8]" />
                  Lecture Attendance Log: {selectedLogReport.subject.code}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selectedLogReport.subject.name} &bull; {selectedLogReport.records.length} Classes Recorded
                </p>
              </div>
              <button
                onClick={() => setSelectedLogReport(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                aria-label="Close lecture log drawer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {selectedLogReport.records.length === 0 ? (
                <p className="text-center py-8 text-[#64748B] text-xs">No daily attendance entries recorded yet.</p>
              ) : (
                selectedLogReport.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#172033]">{rec.date}</span>
                        {rec.remarks && <span className="text-[10px] text-[#64748B]">({rec.remarks})</span>}
                      </div>
                    </div>

                    <div>
                      {rec.status === 'present' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Present
                        </span>
                      ) : rec.status === 'excused' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Excused (Medical)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Absent
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedLogReport(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
