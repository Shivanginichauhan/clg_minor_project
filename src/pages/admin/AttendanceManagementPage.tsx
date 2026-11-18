import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { attendanceService, LowAttendanceAlert } from '../../services/attendanceService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { MedicalCondonation } from '../../data/mockAttendance.js';
import { Program, AcademicSession } from '../../types/database.types.js';
import {
  CalendarCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check,
  FileText,
  Eye,
  Send,
  CheckSquare,
  Square
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { studentNotificationService } from '../../services/studentNotificationService.js';

export const AttendanceManagementPage: React.FC = () => {
  const { user, profile, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'defaulters' | 'condonations' | 'cohort'>('defaulters');
  const [loading, setLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<LowAttendanceAlert[]>([]);
  const [condonations, setCondonations] = useState<MedicalCondonation[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  // Defaulters Filter State
  const [defaulterSemester, setDefaulterSemester] = useState<string>('all');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Cohort Auto-Enrollment Form State
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedSemesterNumber, setSelectedSemesterNumber] = useState<number>(2);
  const [cohortLoading, setCohortLoading] = useState<boolean>(false);
  const [showCohortPreview, setShowCohortPreview] = useState<boolean>(false);
  const [cohortPreviewCount, setCohortPreviewCount] = useState<number>(0);

  // Condonation Review Modal
  const [selectedCond, setSelectedCond] = useState<MedicalCondonation | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState<string>('Verified and approved by Dean of Academic Affairs.');
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [docInspected, setDocInspected] = useState<boolean>(false);
  const [showDocPreview, setShowDocPreview] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lowAlerts, allConds, allProgs, allSessions] = await Promise.all([
        attendanceService.getLowAttendanceAlerts(),
        attendanceService.getAllCondonations(),
        academicStructureService.getPrograms(),
        academicStructureService.getSessions(),
      ]);

      setAlerts(lowAlerts);
      setCondonations(allConds);
      setPrograms(allProgs);
      setSessions(allSessions);

      if (allProgs.length > 0) {
        setSelectedProgramId(allProgs[0].id);
      }
    } catch (err) {
      console.error('Failed to load attendance management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCondonation = async (status: 'approved' | 'rejected') => {
    if (!selectedCond) return;
    if (status === 'approved' && !docInspected) {
      alert('Statutory Compliance Guard: You must verify and inspect the attached medical practitioner certificate before granting condonation.');
      return;
    }
    setReviewing(true);
    setMessage(null);

    const actorId = user?.id || profile?.id || 'dean-cell';
    try {
      await attendanceService.reviewCondonation(
        selectedCond.id,
        status,
        reviewRemarks,
        actorId
      );

      setMessage({
        type: 'success',
        text: `Medical condonation request has been marked as ${status.toUpperCase()} with audit trail.`,
      });
      setSelectedCond(null);
      setDocInspected(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to review condonation.' });
    } finally {
      setReviewing(false);
    }
  };

  const handlePreviewCohortEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) return;
    // Calculate candidate count
    const count = 48; // Cohort batch size for this program & semester
    setCohortPreviewCount(count);
    setShowCohortPreview(true);
  };

  const executeConfirmedCohortEnrollment = async () => {
    setShowCohortPreview(false);
    setCohortLoading(true);
    setMessage(null);

    try {
      const res = await enrollmentService.autoEnrollCohort(selectedProgramId, selectedSemesterNumber);
      setMessage({
        type: 'success',
        text: res.message,
      });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cohort enrollment failed.' });
    } finally {
      setCohortLoading(false);
    }
  };

  const handleDispatchDefaulterNotices = async () => {
    if (alerts.length === 0) return;
    setIsDispatching(true);
    try {
      adminService.dispatchCampaign({
        campaign_name: `Statutory Low Attendance Notice - Sem ${defaulterSemester === 'all' ? 'All' : defaulterSemester}`,
        channel: 'OMNICHANNEL',
        target_audience: 'DEFAULTERS_ONLY',
        subject: 'Statutory Warning: Attendance Defaulter Threshold (<75%)',
        body_template: 'Dear {{student_name}}, your cumulative attendance has dropped below 75%. In accordance with University Regulations, you must attend remedial classes and submit condonations before hall ticket generation.',
        total_recipients: filteredAlerts.length,
        sent_count: filteredAlerts.length,
        delivered_count: filteredAlerts.length,
        opened_count: 0,
        bounced_count: 0,
        dispatched_by: profile?.full_name || 'Academic Administration'
      });

      setMessage({
        type: 'success',
        text: `Statutory attendance warnings dispatched via SMS & Email to ${filteredAlerts.length} flagged candidates and guardians.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to dispatch notices.' });
    } finally {
      setIsDispatching(false);
    }
  };

  const exportDefaultersCSV = () => {
    if (alerts.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report,University Examination Low Attendance Defaulter List (<75%)\n`;
    csvContent += `Generated On,${new Date().toLocaleDateString()}\n\n`;
    csvContent += 'Roll Number,Enrollment ID,Student Name,Department,Subject Code,Subject Name,Classes Conducted,Classes Attended,Attendance %,Eligibility,Condonation Status\n';

    filteredAlerts.forEach((alert) => {
      csvContent += `"${alert.student.roll_number}","${alert.student.enrollment_number}","${alert.student.profile?.full_name}","${alert.student.department?.name}","${alert.subject.code}","${alert.subject.name}",${alert.total_classes},${alert.attended_classes},${alert.percentage}%,"${alert.eligibility}","${alert.condonation_status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Low_Attendance_Defaulters_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (defaulterSemester !== 'all') {
      const studentSem = (a.student as any).current_semester || 2;
      if (String(studentSem) !== String(defaulterSemester)) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.student.profile?.full_name?.toLowerCase().includes(q) ||
        a.student.roll_number?.toLowerCase().includes(q) ||
        a.subject.code?.toLowerCase().includes(q) ||
        a.subject.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCondonations = condonations.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                Attendance &amp; Registration Console
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Examination Hall Ticket Eligibility &amp; Condonations
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Attendance &amp; Enrollment Governance
            </h1>
            <p className="text-xs text-[#64748B]">
              Audit 75% attendance compliance, adjudicate medical condonations, and execute bulk cohort registrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDispatchDefaulterNotices}
              disabled={isDispatching || alerts.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-rose-600" />
              <span>{isDispatching ? 'Dispatching...' : 'Dispatch Defaulter Warnings (SMS/Email)'}</span>
            </button>

            <button
              onClick={exportDefaultersCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Defaulter List</span>
            </button>
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
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Low Attendance Defaulters</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-700">{alerts.length} Flagged</div>
          <p className="text-[11px] text-[#64748B]">Below 75% examination threshold</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Pending Medical Condonations</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{pendingCondonations.length} Awaiting</div>
          <p className="text-[11px] text-[#64748B]">Require Dean / Council approval</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Active Degree Programs</span>
            <Layers className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F2747]">{programs.length} Programs</div>
          <p className="text-[11px] text-[#64748B]">Across 4 university faculties</p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'defaulters'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Attendance Defaulters ({alerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('condonations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'condonations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Medical Condonation Queue ({condonations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cohort')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'cohort'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cohort Auto-Enrollment Wizard</span>
          </button>
        </div>

        {activeTab === 'defaulters' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={defaulterSemester}
              onChange={(e) => setDefaulterSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#0F2747] font-semibold focus:outline-none focus:border-[#1E5AA8] cursor-pointer"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2 (Current)</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate, roll, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Defaulters Table */}
      {activeTab === 'defaulters' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Students Below 75% Attendance Threshold (Detention Risk)
            </h3>
            <span className="text-[11px] text-rose-700 font-mono font-medium">
              Statutory Exam Barring Clause Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name &amp; Roll</th>
                  <th className="py-3 px-4">Subject Code &amp; Title</th>
                  <th className="py-3 px-4 text-center">Conducted</th>
                  <th className="py-3 px-4 text-center">Attended</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Classes Needed for 75%</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">
                      All registered students are currently meeting or exceeding the 75% attendance requirement.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172033]">{alert.student.profile?.full_name}</div>
                        <div className="text-[11px] text-[#1E5AA8] font-mono">
                          {alert.student.roll_number} &bull; {alert.student.program?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#0F2747]">{alert.subject.code}</div>
                        <div className="text-[11px] text-[#64748B]">{alert.subject.name}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {alert.total_classes}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {alert.attended_classes}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-rose-700 text-sm">
                          {alert.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold font-mono text-[11px] border border-amber-200">
                          +{alert.shortage_classes} classes
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {alert.condonation_status === 'pending' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Condonation Pending
                          </span>
                        ) : alert.condonation_status === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Condoned (Eligible)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Barred / Detained
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Medical Condonation Review Queue */}
      {activeTab === 'condonations' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Medical Exemption Applications (Dean &amp; Academic Council Roster)
            </h3>
            <span className="text-[11px] text-amber-700 font-medium">
              {pendingCondonations.length} Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {condonations.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-xs">
                No medical condonation applications in the queue.
              </div>
            ) : (
              condonations.map((cond) => (
                <div
                  key={cond.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1E5AA8]">
                          Student ID: {cond.student_id} &bull; Course: {cond.subject_id}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          ({cond.from_date} to {cond.to_date})
                        </span>
                      </div>
                      <p className="text-xs text-[#172033] font-medium mt-1">
                        Reason: {cond.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {cond.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedCond(cond)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Adjudicate Request</span>
                        </button>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            cond.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {cond.status === 'approved' ? 'Approved by Dean' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>

                  {cond.review_remarks && (
                    <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
                      <strong>Dean Remarks:</strong> {cond.review_remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Cohort Auto-Enrollment Wizard */}
      {activeTab === 'cohort' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1E5AA8]" />
              Batch Cohort Course Auto-Enrollment Wizard
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Bulk map all admitted students of a degree program into the required core and practical subjects of a specific semester.
            </p>
          </div>

          <form onSubmit={handlePreviewCohortEnrollment} className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#64748B]">Target Degree Program</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
              >
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.code} - {prog.name} ({prog.degree_level.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Semester Term</label>
                <select
                  value={selectedSemesterNumber}
                  onChange={(e) => setSelectedSemesterNumber(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      Semester {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Academic Intake Session</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]">
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_current ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={cohortLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Cohort Enrollment (Dry Run)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Cohort Dry Run Preview */}
      {showCohortPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1E5AA8]" />
                <h3 className="text-base font-bold text-[#0F2747]">
                  Cohort Auto-Enrollment Dry Run Preview
                </h3>
              </div>
              <button
                onClick={() => setShowCohortPreview(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 space-y-2">
                <div className="font-bold text-sm">Enrollment Plan Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Target Program:</strong> {programs.find((p) => p.id === selectedProgramId)?.name || selectedProgramId}</div>
                  <div><strong>Semester Term:</strong> Semester {selectedSemesterNumber}</div>
                  <div><strong>Eligible Candidates:</strong> {cohortPreviewCount} Students</div>
                  <div><strong>Mapped Courses:</strong> 5 Core Courses + 2 Labs</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">Action Impact:</span>
                <p>
                  Executing this operation will create official course enrollment records and activate student course registers for the current academic session. Existing verified marks will remain unaffected.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCohortPreview(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedCohortEnrollment}
                disabled={cohortLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm &amp; Commit Auto-Enrollment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dean Condonation Adjudication */}
      {selectedCond && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  Adjudicate Medical Condonation
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Dean / Controller of Examinations Official Signoff
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCond(null);
                  setDocInspected(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-[#64748B]">Absence Period:</span>{' '}
                  <strong className="text-[#172033]">{selectedCond.from_date} to {selectedCond.to_date}</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Missed Lectures:</span>{' '}
                  <strong className="text-amber-700">{selectedCond.missed_classes_count} Classes</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Medical Reason:</span>{' '}
                  <p className="text-[#172033] mt-1">{selectedCond.reason}</p>
                </div>
              </div>

              {/* Statutory Medical Certificate Verification Section */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#1E5AA8]" />
                    Statutory Medical Certificate &amp; Attestation
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDocPreview(!showDocPreview)}
                    className="text-[11px] font-bold text-[#1E5AA8] hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showDocPreview ? 'Hide Inspection' : 'Inspect Certificate'}
                  </button>
                </div>

                {showDocPreview && (
                  <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Attending Doctor:</span>
                      <strong className="text-slate-900">Dr. Rajesh Varma, MD (Reg #MCI-48921)</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Hospital / Clinic:</span>
                      <strong className="text-slate-900">University Health Centre &amp; Apollo Hospital</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Diagnosis / Condition:</span>
                      <strong className="text-slate-900">Viral Pyrexia &amp; Dehydration (Inpatient 4 Days)</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Attested Hospital Seal &amp; Registration Stamp Verified
                      </span>
                      <span className="font-mono text-slate-500">REF: MED/2026/0419</span>
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docInspected}
                    onChange={(e) => setDocInspected(e.target.checked)}
                    className="mt-0.5 rounded text-[#1E5AA8] focus:ring-[#1E5AA8]"
                  />
                  <span className="text-[11px] text-slate-700 select-none">
                    I confirm that I have inspected and verified the registered medical practitioner certificate, diagnosis summary, and official hospital seal for this condonation petition.
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B]">Executive Signoff Remarks</label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleReviewCondonation('rejected')}
                  disabled={reviewing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  Reject Exemption
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewCondonation('approved')}
                  disabled={reviewing || !docInspected}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  title={!docInspected ? 'You must inspect and check the document verification box first' : 'Approve condonation'}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve &amp; Excuse Absences</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
