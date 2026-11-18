import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  Clock,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ChevronRight,
  Download,
  CreditCard,
  UserCheck,
  AlertCircle,
  Check,
  Archive,
  Layers,
  FolderDown,
  FileCheck,
  ExternalLink,
  MapPin,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { enrollmentService, EnrollmentWithDetails } from '../../services/enrollmentService.js';
import { attendanceService, StudentSubjectReport } from '../../services/attendanceService.js';
import { studentClearanceService, StudentClearanceRecord } from '../../services/studentClearanceService.js';
import { examRegistrationService, ExamRegistrationApplication } from '../../services/examRegistrationService.js';
import { assignmentService, Assignment } from '../../services/assignmentService.js';
import { timetableService } from '../../services/timetableService.js';
import { degreeProgressService, DegreeProgressSummary } from '../../services/degreeProgressService.js';
import { examService } from '../../services/examService.js';
import { scholarshipService, ScholarshipApplication } from '../../services/scholarshipService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { TimetableSlot } from '../../data/mockTimetable.js';

interface TodaySlotWithStatus extends TimetableSlot {
  timeStatus: 'live' | 'upcoming' | 'completed' | 'ongoing';
  statusBadge: string;
}

export const StudentDashboard: React.FC = () => {
  const { profile, user } = useAuth();

  const [attendanceReports, setAttendanceReports] = useState<StudentSubjectReport[]>([]);
  const [overallAttendance, setOverallAttendance] = useState<number>(85);
  const [clearance, setClearance] = useState<StudentClearanceRecord | null>(null);
  const [examApp, setExamApp] = useState<ExamRegistrationApplication | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todaySlots, setTodaySlots] = useState<TodaySlotWithStatus[]>([]);
  const [degreeAudit, setDegreeAudit] = useState<DegreeProgressSummary | null>(null);
  const [upcomingExamsList, setUpcomingExamsList] = useState<any[]>([]);
  const [myScholarships, setMyScholarships] = useState<ScholarshipApplication[]>([]);
  const [currentDayName, setCurrentDayName] = useState<string>('Monday');
  const [loading, setLoading] = useState(true);

  const studentId = user?.id;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const semesterId = (user?.user_metadata?.current_semester_id as string | undefined) || 'sem-mca-2';
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDay = dayNames[new Date().getDay()];
        const targetDay = todayDay === 'Sunday' ? 'Monday' : todayDay;
        setCurrentDayName(targetDay);

        const [attSummary, clr, app, asgs, allSemesterSlots, audit, hallTicket, scholApps] = await Promise.all([
          attendanceService.getStudentAttendanceOverview(studentId),
          studentClearanceService.getStudentClearance(studentId),
          examRegistrationService.getStudentApplication(studentId),
          assignmentService.getAssignments(studentId),
          timetableService.getSlotsBySemester(semesterId),
          degreeProgressService.getDegreeProgress(studentId),
          examService.getHallTicketForStudent(studentId),
          scholarshipService.getApplications({ studentId }),
        ]);

        setAttendanceReports(attSummary?.subjectReports || []);
        setOverallAttendance(attSummary?.overallPercentage ?? 85);
        setClearance(clr);
        setExamApp(app);
        setAssignments(asgs);
        setDegreeAudit(audit);
        setMyScholarships(scholApps);

        // Filter and evaluate live time status for today's slots
        const daySlots = allSemesterSlots.filter(
          (s) => s.day.toLowerCase() === targetDay.toLowerCase()
        );

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const slotsWithStatus: TodaySlotWithStatus[] = daySlots.map((slot) => {
          // Parse slot start & end time like '10:00 AM'
          const parseMinutes = (timeStr: string) => {
            const [timePart, modifier] = timeStr.trim().split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return hours * 60 + (minutes || 0);
          };

          const startMin = parseMinutes(slot.start_time);
          const endMin = parseMinutes(slot.end_time);

          let timeStatus: 'live' | 'upcoming' | 'completed' | 'ongoing' = 'upcoming';
          let statusBadge = 'Upcoming';

          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            timeStatus = 'ongoing';
            statusBadge = 'In Session 🟢';
          } else if (currentMinutes < startMin && startMin - currentMinutes <= 30) {
            timeStatus = 'live';
            statusBadge = `Live in ${startMin - currentMinutes}m`;
          } else if (currentMinutes > endMin) {
            timeStatus = 'completed';
            statusBadge = 'Completed ✓';
          }

          return {
            ...slot,
            timeStatus,
            statusBadge,
          };
        });

        setTodaySlots(slotsWithStatus);

        // Upcoming Exams
        if (hallTicket?.papers && hallTicket.papers.length > 0) {
          const mappedExams = hallTicket.papers.slice(0, 3).map((p: any) => {
            const examTime = new Date(p.exam_date).getTime();
            const daysLeft = Math.max(1, Math.ceil((examTime - now.getTime()) / (1000 * 3600 * 24)));
            return {
              code: p.subject_code,
              title: p.subject_name,
              date: new Date(p.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
              time: `${p.start_time} - ${p.end_time}`,
              daysLeft,
              room: `${p.room_number || 'Hall 302'} • ${p.seat_number || 'Desk B-14'}`,
              reporting: '09:15 AM',
            };
          });
          setUpcomingExamsList(mappedExams);
        }
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [studentId, user]);

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Please sign in to access your student academic console.</p>
        <Link to="/login" className="btn-3d-gold inline-block mt-3 px-4 py-2 text-xs font-bold">
          Go to Sign In &rarr;
        </Link>
      </div>
    );
  }

  const userMeta = user.user_metadata || {};
  const studentName = profile?.full_name || userMeta.full_name || user.email?.split('@')[0] || 'Candidate';
  const studentRoll = userMeta.roll_number || userMeta.enrollment_number || '2025-MCA-042';
  const studentDept = userMeta.department_name || 'Department of Computer Science & Engineering';
  const studentProgram = userMeta.program_name || 'Master of Computer Applications';
  const studentSemester = userMeta.current_semester || 2;

  // ── DYNAMIC URGENT ACTIONS COMPILATION ──
  const urgentActions: Array<{
    id: string;
    level: 'critical' | 'deadline' | 'info' | 'success';
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaUrl: string;
  }> = [];

  // 1. Attendance Warnings
  const dangerCourse = attendanceReports.find((r) => r.percentage < 75);
  if (dangerCourse) {
    const needed = Math.max(1, Math.ceil(3 * dangerCourse.total_classes - 4 * dangerCourse.attended_classes));
    urgentActions.push({
      id: `urg-att-${dangerCourse.subject.id}`,
      level: 'critical',
      title: `${dangerCourse.subject.code} Attendance is ${dangerCourse.percentage.toFixed(1)}% — Below Statutory 75%`,
      subtitle: `Attend the next ${needed} consecutive lectures to become eligible for hall ticket issuance.`,
      ctaLabel: 'View Attendance Ledger',
      ctaUrl: `/student/attendance?subjectId=${dangerCourse.subject.id}`,
    });
  } else {
    const warningCourse = attendanceReports.find((r) => r.percentage >= 75 && r.percentage < 78);
    if (warningCourse) {
      urgentActions.push({
        id: `urg-att-warn-${warningCourse.subject.id}`,
        level: 'deadline',
        title: `${warningCourse.subject.code} Attendance Warning (${warningCourse.percentage.toFixed(1)}%)`,
        subtitle: 'Attendance is close to statutory limit. Missing classes will trigger condonation requirements.',
        ctaLabel: 'View Attendance',
        ctaUrl: `/student/attendance?subjectId=${warningCourse.subject.id}`,
      });
    }
  }

  // 2. Examination Registration
  if (!examApp) {
    urgentActions.push({
      id: 'urg-exam-pending',
      level: 'critical',
      title: 'End-Semester Exam Form Final Call — Open for Submission',
      subtitle: 'Statutory examination form submission deadline is active. Register required theory & practical papers.',
      ctaLabel: 'Submit Exam Form',
      ctaUrl: '/student/exam-apply',
    });
  } else if (examApp.payment_status === 'pending') {
    urgentActions.push({
      id: 'urg-exam-pay',
      level: 'critical',
      title: `Exam Registration Fee Settlement Pending (₹${examApp.total_amount_paid})`,
      subtitle: 'Complete verification payment to clear Accounts approval and generate Hall Ticket.',
      ctaLabel: 'Pay Exam Fee',
      ctaUrl: '/student/exam-apply',
    });
  }

  // 3. Upcoming Coursework / Assignments Due
  const pendingAssignments = assignments
    .filter((a) => a.status !== 'submitted' && a.status !== 'graded')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  if (pendingAssignments.length > 0) {
    const nextAsg = pendingAssignments[0];
    const diffHours = (new Date(nextAsg.due_date).getTime() - Date.now()) / (1000 * 3600);
    urgentActions.push({
      id: `urg-asg-${nextAsg.id}`,
      level: diffHours <= 24 ? 'critical' : 'deadline',
      title: `${nextAsg.subject_code}: ${nextAsg.title} Due Soon`,
      subtitle: `Coursework submission due by ${new Date(nextAsg.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(nextAsg.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} (Total: ${nextAsg.total_marks} Marks).`,
      ctaLabel: 'Upload Submission',
      ctaUrl: '/student/assignments',
    });
  }

  // 4. Accounts & Fee Clearance Status
  if (clearance?.accounts_cleared) {
    urgentActions.push({
      id: 'urg-fee-cleared',
      level: 'info',
      title: 'Accounts Clearance: Zero Outstanding Balance',
      subtitle: 'Fee ledger fully reconciled. Official digital bursar fee receipts ready for download.',
      ctaLabel: 'Download Receipt',
      ctaUrl: '/student/fees',
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="academic-hero text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Matriculated Regular Scholar &bull; AY 2025-26
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                CBCS 10-Point Scale
              </span>
            </div>
            <h1 className="font-academic-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              Good day, {studentName}
            </h1>
            <p className="text-xs text-slate-300">
              {studentDept} &bull; <span className="font-mono text-emerald-200 font-bold">{studentRoll}</span> &bull; {studentProgram} (Sem {studentSemester})
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-center">
              <p className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Hall Ticket</p>
              <div className="text-xs font-bold text-emerald-300 mt-0.5">
                {examApp?.admit_card_available ? 'Verified &bull; Ready' : 'Filing In Progress'}
              </div>
            </div>
            <UniversityCrest size="sm" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* ── SECTION 1: URGENT WORKFLOW & ACTION BOARD ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Statutory Action Items &bull; Priority Alerts</span>
          </h2>
          <span className="text-xs text-slate-500">Live academic status synchronization</span>
        </div>

        {urgentActions.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>All Clear: Academic standing is verified with no pending statutory flags or overdue submissions.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {urgentActions.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 shadow-2xs ${
                  item.level === 'critical'
                    ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
                    : item.level === 'deadline'
                    ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                    : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded border ${
                        item.level === 'critical'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : item.level === 'deadline'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-[#0F2747] border-blue-300'
                      }`}
                    >
                      {item.level === 'critical' ? '🔴 Critical' : item.level === 'deadline' ? '🟠 Deadline' : '🟡 Info'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#0F2747] leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.subtitle}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex justify-end mt-2">
                  <Link
                    to={item.ctaUrl}
                    className="btn-3d-gold px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span>{item.ctaLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: DEGREE PROGRESS AUDIT SNAPSHOT ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
              Degree Audit On-Track
            </span>
            <span className="text-xs font-bold text-[#0F2747]">Choice Based Credit System (CBCS)</span>
          </div>
          <p className="text-xs text-slate-600">
            Credits Earned: <strong className="text-emerald-700">{degreeAudit?.totalEarnedCredits ?? 42} / {degreeAudit?.totalRequiredCredits ?? 88}</strong> &bull; Current CGPA:{' '}
            <strong className="text-[#1E5AA8]">{degreeAudit?.currentCGPA?.toFixed(2) ?? '8.84'}</strong> &bull; Backlogs: <strong className="text-emerald-700">{degreeAudit?.backlogsCount ?? 0}</strong> &bull; Standing:{' '}
            <strong>{degreeAudit?.standing ?? 'First Class with Distinction'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/student/degree-progress"
            className="btn-3d-secondary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>What-If Planner &rarr;</span>
          </Link>
        </div>
      </div>

      {/* ── SECTION 3: ACADEMIC QUICK CONSOLE (8 DIRECT MODULE HUBS) ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Academic Quick Access Console
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <Link
            to="/student/timetable"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Timetable</p>
            <p className="text-[10px] text-slate-400">Class schedule</p>
          </Link>

          <Link
            to="/student/materials"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <FolderDown className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Course Notes</p>
            <p className="text-[10px] text-teal-700 font-semibold">Slides &amp; PDFs</p>
          </Link>

          <Link
            to="/student/assignments"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Assignments</p>
            <p className="text-[10px] text-amber-600 font-semibold">{pendingAssignments.length} Pending</p>
          </Link>

          <Link
            to="/student/attendance"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Attendance</p>
            <p className="text-[10px] text-slate-400">{overallAttendance.toFixed(1)}% Overall</p>
          </Link>

          <Link
            to="/student/examinations"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <Download className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Hall Ticket</p>
            <p className="text-[10px] text-purple-700 font-semibold">Admit Card</p>
          </Link>

          <Link
            to="/student/fees"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <CreditCard className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Fee Status</p>
            <p className="text-[10px] text-emerald-700 font-semibold">
              {clearance?.accounts_cleared ? 'All Cleared' : 'Pending'}
            </p>
          </Link>

          <Link
            to="/student/requests"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <FileCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">My Requests</p>
            <p className="text-[10px] text-indigo-700 font-semibold">Unified Tracker</p>
          </Link>

          <Link
            to="/student/documents"
            className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8] transition group text-center space-y-1.5 block"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] mx-auto flex items-center justify-center group-hover:scale-110 transition">
              <Archive className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#0F2747] truncate">Documents</p>
            <p className="text-[10px] text-slate-400">Vault Archive</p>
          </Link>
        </div>
      </div>

      {/* ── SECTION 4: MAIN WORKFLOW GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Live Schedule (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E5AA8]" />
                <span>Today&apos;s Lecture Schedule ({currentDayName})</span>
              </h3>
              <p className="text-xs text-slate-500">Live timetable tracking for your registered section</p>
            </div>
            <Link to="/student/timetable" className="text-xs font-bold text-[#1E5AA8] hover:underline">
              View Full Timetable &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {todaySlots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-[#0F2747]">No classes scheduled for today ({currentDayName})</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Enjoy your study recess or preview upcoming lab sessions and theoretical lectures in the master timetable.
                </p>
                <Link to="/student/timetable" className="btn-3d-secondary inline-block px-3 py-1.5 text-xs font-bold mt-1">
                  Open Master Timetable &rarr;
                </Link>
              </div>
            ) : (
              todaySlots.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    cls.timeStatus === 'live' || cls.timeStatus === 'ongoing'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                      : cls.timeStatus === 'completed'
                      ? 'bg-slate-50/60 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {cls.subject_code}
                      </span>
                      <span className="text-xs font-bold text-[#0F2747]">{cls.subject_name}</span>
                      {cls.timeStatus === 'live' && (
                        <span className="badge-3d text-[10px] px-2 py-0.5 bg-amber-500 text-white font-bold animate-pulse">
                          {cls.statusBadge}
                        </span>
                      )}
                      {cls.timeStatus === 'ongoing' && (
                        <span className="badge-3d text-[10px] px-2 py-0.5 bg-emerald-600 text-white font-bold">
                          {cls.statusBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#1E5AA8]" />
                        {cls.room_number} ({cls.building})
                      </span>
                      &bull;
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        {cls.faculty_name}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-700 text-xs">{cls.start_time} - {cls.end_time}</p>
                      <span className="text-[10px] font-bold text-slate-400">{cls.statusBadge}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Examinations & 4-Stage Live Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Examinations */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Upcoming Examinations</span>
              </h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                May 2026 Term
              </span>
            </div>

            <div className="space-y-3">
              {upcomingExamsList.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  No upcoming examinations scheduled in the active 14-day window.
                </div>
              ) : (
                upcomingExamsList.map((exam, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F2747]">{exam.code} - {exam.title}</span>
                      <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        In {exam.daysLeft} Days
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{exam.date} ({exam.time})</span>
                      <span>Reporting: <strong>{exam.reporting}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/student/examinations"
              className="btn-3d-gold w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Verified Admit Card &rarr;</span>
            </Link>
          </div>

          {/* ── 4-STAGE STATUTORY VERIFICATION STATUS TRACKER ── */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1E5AA8]" />
                <span>Exam Form Approval Lifecycle</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                examApp?.admit_card_available
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {examApp?.admit_card_available ? 'Admit Card Generated' : 'Under Verification'}
              </span>
            </div>

            {examApp ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Docket Ref:</span>
                  <span className="font-mono font-bold text-[#0F2747]">{examApp.application_no}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {/* Stage 1: Form Submitted */}
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold">
                    1. Form Submitted ✓
                    <p className="text-[9px] text-emerald-700 font-normal mt-0.5">
                      {new Date(examApp.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>

                  {/* Stage 2: HOD Verification */}
                  <div className={`p-2.5 rounded-lg border font-bold ${
                    (examApp.attendance_percentage ?? 0) >= 75 || examApp.is_eligible
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    2. HOD Clearance {(examApp.attendance_percentage ?? 0) >= 75 ? '✓' : '⏳'}
                    <p className="text-[9px] font-normal mt-0.5">
                      {(examApp.attendance_percentage ?? 0) >= 75
                        ? `Attendance ${examApp.attendance_percentage}%`
                        : 'Review in Progress'}
                    </p>
                  </div>

                  {/* Stage 3: Accounts Clearance */}
                  <div className={`p-2.5 rounded-lg border font-bold ${
                    examApp.payment_status === 'paid'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    3. Accounts Cleared {examApp.payment_status === 'paid' ? '✓' : '⏳'}
                    <p className="text-[9px] font-normal mt-0.5">
                      {examApp.payment_status === 'paid' ? 'Zero Dues (Paid)' : 'Pending Fee'}
                    </p>
                  </div>

                  {/* Stage 4: Hall Ticket Issued */}
                  <div className={`p-2.5 rounded-lg border font-bold ${
                    examApp.admit_card_available
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    4. Hall Ticket {examApp.admit_card_available ? '✓' : '⏳'}
                    <p className="text-[9px] font-normal mt-0.5">
                      {examApp.admit_card_available ? 'Desk B-14' : 'Pending CoE Seal'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/student/exam-apply"
                  className="btn-3d-secondary w-full py-2 text-xs font-bold text-center block"
                >
                  View Full Examination Docket &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-center">
                <p className="text-slate-600">No active examination application submitted for May 2026 cycle.</p>
                <Link to="/student/exam-apply" className="btn-3d-primary inline-block px-4 py-2 text-xs font-bold">
                  File Examination Registration Form &rarr;
                </Link>
              </div>
            )}

            {/* Other Active Petitions */}
            {myScholarships.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#0F2747]">{myScholarships[0].scheme_name}</p>
                    <p className="text-[10px] text-slate-500">Ref: {myScholarships[0].application_no}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {myScholarships[0].status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link to="/student/requests" className="text-xs font-bold text-[#1E5AA8] hover:underline">
                View All Consolidated Requests &amp; Petitions (5 Trackers) &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
