import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  DoorOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Award,
  RefreshCw,
  UserCheck,
  Eye,
  X,
  Phone,
  Send,
  Building,
  Layers,
  FileCheck,
  Calendar,
  MessageSquare,
  ClipboardList,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { academicStructureService } from '../../services/academicStructureService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import {
  classMentorshipService,
  MenteeStudent,
  MentorshipCohortSummary
} from '../../services/classMentorshipService.js';
import { facultyFeaturesService } from '../../services/facultyFeaturesService.js';

export const FacultyDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Floating Welcome Toast State
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);

  // Mentorship Cohort State
  const [mentorshipSummary, setMentorshipSummary] = useState<MentorshipCohortSummary | null>(null);
  const [mentees, setMentees] = useState<MenteeStudent[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // AI Assistant State
  const [aiActivePrompt, setAiActivePrompt] = useState<string>('What do I need to do today?');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadFacultyData = async () => {
      setLoading(true);
      try {
        const allAllocs = await academicStructureService.getAllocations();
        const facultyAllocs = allAllocs.filter((a) => {
          if (!user) return true;
          return a.faculty_id === user.id || a.faculty?.profile?.email === user.email || a.faculty?.profile?.id === user.id;
        });
        setAllocations(facultyAllocs.length > 0 ? facultyAllocs : allAllocs.slice(0, 3));

        // Load Class Mentorship Cohort
        const cohortData = await classMentorshipService.getCohortSummary(profile?.full_name);
        setMentorshipSummary(cohortData.summary);
        setMentees(cohortData.mentees);
      } catch (err) {
        console.error('Failed to load faculty dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFacultyData();
  }, [user, profile]);

  // AI Assistant Query Engine
  const runAiPrompt = (prompt: string) => {
    setAiActivePrompt(prompt);
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      if (prompt === 'What do I need to do today?') {
        setAiResponse(
          '• 8 student assignments awaiting grading for MCA-201 (DBMS)\n• Roll call attendance pending for MCA-201 (Period 1, Room 204)\n• Next scheduled class: Cloud Computing Lab in 45 minutes (Computing Wing)\n• Exam duty confirmation required for May 15 morning session (Hall 302)\n• 1 mentee (Amit Verma) flagged with attendance < 75%'
        );
      } else if (prompt === 'Summarize attendance deficits') {
        setAiResponse(
          '• Mentee Amit Verma is at 71.4% attendance (below statutory 75% limit).\n• 3 students in MCA-201 require 2 consecutive lectures to achieve exam clearance.\n• Attendance correction request pending review from Rahul Sharma (22 Apr swipe).'
        );
      } else if (prompt === 'Check syllabus delivery status') {
        setAiResponse(
          '• MCA-201: Unit 1 & Unit 2 are 100% completed. Unit 3 (Query Optimization) is currently 65% in progress.\n• 14 total topics scheduled; 9 covered, 1 in progress, 4 pending. Target delivery is on schedule for May exams.'
        );
      } else {
        setAiResponse(
          '• Weekly allocated workload: 18 / 20 hours (10 hrs lectures, 4 hrs practical labs, 2 hrs mentorship, 2 hrs exam duties).\n• Status: 100% compliant with UGC 2026 Faculty Workload Norms.'
        );
      }
    }, 450);
  };

  useEffect(() => {
    // Initial run
    runAiPrompt('What do I need to do today?');
  }, []);

  const handleGrantCondonation = async (student: MenteeStudent) => {
    try {
      await classMentorshipService.grantMentorCondonation(student.id, 'Medical / Extracurricular verification endorsed by mentor');
      const updated = await classMentorshipService.getCohortSummary(profile?.full_name);
      setMentorshipSummary(updated.summary);
      setMentees(updated.mentees);

      setActionFeedback({
        type: 'success',
        message: `Attendance condonation granted for ${student.full_name} (${student.roll_number}). Student is now eligible for exam registration!`,
      });
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (e: any) {
      alert('Error granting condonation: ' + e.message);
    }
  };

  const upcomingInvigilations = [
    { date: '15 MAY 2026', time: '10:00 AM - 01:00 PM', hall: 'Hall 302', role: 'Chief Invigilator', status: 'Duty Order Confirmed' },
    { date: '19 MAY 2026', time: '02:00 PM - 05:00 PM', hall: 'Hall 201', role: 'Reliever Invigilator', status: 'Duty Order Confirmed' },
  ];

  const todaySchedule = [
    { time: '09:30 AM - 10:30 AM', subject: 'MCA-201: Advanced DBMS', room: 'Room 204', type: 'Lecture', status: 'Pending Roll Call', path: '/faculty/attendance' },
    { time: '11:30 AM - 01:00 PM', subject: 'MCA-202: Cloud Systems Lab', room: 'Computing Wing, Lab 3', type: 'Practical', status: 'Upcoming', path: '/faculty/attendance' },
    { time: '02:30 PM - 03:30 PM', subject: 'Class Mentorship Cohort', room: 'Faculty Cabin B-304', type: 'Mentoring', status: 'Upcoming', path: '/faculty/mentorship' },
  ];

  const userMeta = user?.user_metadata || {};
  const facultyEmpId = userMeta.employee_id || 'FAC-CSE-018';
  const facultyDept = userMeta.department_id ? `Department (${userMeta.department_id})` : 'Department of Computer Science & Engineering';
  const facultyDesig = userMeta.designation || 'Associate Professor & Class Mentor';

  const atRiskStudents = mentees.filter((m) => m.attendance_percentage < 75 || m.no_dues_status !== 'cleared');

  return (
    <div className="space-y-6">
      {/* Floating Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs font-bold text-[#0F2747]">
            <span className="text-base">👋</span>
            <span>Welcome, {profile?.full_name || 'Dr. Priya Nambiar'}!</span>
            <button
              onClick={() => setShowWelcomeToast(false)}
              className="text-slate-400 hover:text-slate-700 ml-2 p-0.5 cursor-pointer text-xs transition"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold">{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Faculty Hero Banner */}
      <div className="academic-hero text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-300" />
              <span className="text-xs text-emerald-200 font-medium">{facultyDesig} · {facultyEmpId}</span>
            </div>
            <h1 className="font-academic-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              Faculty Academic Console
            </h1>
            <p className="text-xs text-slate-300">{facultyDept} · AY 2025-26</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl text-center">
              <p className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">My Subjects</p>
              <div className="text-sm font-bold text-white mt-0.5">{allocations.length} Active Courses</div>
            </div>
            <UniversityCrest size="sm" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* Urgent Tasks & Priorities Banner (Research §3) */}
      <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
              <span>Urgent Faculty Priorities &amp; Action Items</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
            4 Actions Pending Today
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Link
            to="/faculty/assignments"
            className="p-3 bg-white/80 hover:bg-white rounded-xl border border-rose-200 transition shadow-2xs group flex items-start gap-2.5"
          >
            <span className="text-rose-600 font-extrabold text-base leading-none">🔴</span>
            <div>
              <div className="font-bold text-[#0F2747] group-hover:text-rose-700">8 Submissions</div>
              <div className="text-[11px] text-slate-600">Awaiting grading (MCA-201)</div>
            </div>
          </Link>

          <Link
            to="/faculty/attendance"
            className="p-3 bg-white/80 hover:bg-white rounded-xl border border-amber-200 transition shadow-2xs group flex items-start gap-2.5"
          >
            <span className="text-amber-600 font-extrabold text-base leading-none">🟠</span>
            <div>
              <div className="font-bold text-[#0F2747] group-hover:text-amber-700">Roll Call Pending</div>
              <div className="text-[11px] text-slate-600">MCA-201 Period 1 (Room 204)</div>
            </div>
          </Link>

          <Link
            to="/faculty/timetable"
            className="p-3 bg-white/80 hover:bg-white rounded-xl border border-blue-200 transition shadow-2xs group flex items-start gap-2.5"
          >
            <span className="text-blue-600 font-extrabold text-base leading-none">🔵</span>
            <div>
              <div className="font-bold text-[#0F2747] group-hover:text-blue-700">Next Class in 45m</div>
              <div className="text-[11px] text-slate-600">Cloud Computing Lab (Room 3)</div>
            </div>
          </Link>

          <Link
            to="/faculty/invigilation"
            className="p-3 bg-white/80 hover:bg-white rounded-xl border border-purple-200 transition shadow-2xs group flex items-start gap-2.5"
          >
            <span className="text-purple-600 font-extrabold text-base leading-none">🟣</span>
            <div>
              <div className="font-bold text-[#0F2747] group-hover:text-purple-700">Exam Duty Orders</div>
              <div className="text-[11px] text-slate-600">May 15 &bull; Hall 302 Confirmed</div>
            </div>
          </Link>
        </div>
      </div>

      {/* AI Faculty Assistant Card (Research §23) */}
      <div className="academic-card p-5 border-l-4 border-l-indigo-600 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <span>AI Faculty Academic Copilot</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  OBE Engine
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Autonomous aggregation of schedules, grading, syllabus, and NAAC compliance.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              'What do I need to do today?',
              'Summarize attendance deficits',
              'Check syllabus delivery status',
              'UGC Workload Audit'
            ].map((p) => (
              <button
                key={p}
                onClick={() => runAiPrompt(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  aiActivePrompt === p
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-800 leading-relaxed min-h-[60px] flex items-center">
          {isAiLoading ? (
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing academic repositories and compiling response...</span>
            </div>
          ) : (
            <div className="whitespace-pre-line text-slate-700 font-sans space-y-1">
              {aiResponse}
            </div>
          )}
        </div>
      </div>

      {/* Today's Teaching Schedule (Research §3) */}
      <div className="academic-card p-5 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E5AA8]" />
            <h3 className="font-academic-serif text-sm font-bold text-[#0F2747]">
              Today's Instructional Schedule &amp; Quick Actions
            </h3>
          </div>
          <Link to="/faculty/timetable" className="text-xs font-bold text-[#1E5AA8] hover:underline">
            Full Weekly Timetable &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {todaySchedule.map((slot, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#1E5AA8] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {slot.time}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {slot.type}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2747]">{slot.subject}</h4>
                <p className="text-[11px] text-slate-500">{slot.room}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">{slot.status}</span>
                <Link
                  to={slot.path}
                  className="px-2.5 py-1 bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
                >
                  {slot.type === 'Lecture' ? 'Take Attendance' : 'Open Desk'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Navigation Grid (10 Core Modules) */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#1E5AA8]" />
          <span>Faculty Operations &amp; Academic Services Hub</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/faculty/attendance"
            className="academic-card p-3.5 space-y-1.5 hover:border-emerald-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Attendance</div>
            <p className="text-[10px] text-slate-500">Roll call &amp; ledger</p>
          </Link>

          <Link
            to="/faculty/marks"
            className="academic-card p-3.5 space-y-1.5 hover:border-amber-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600 group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Marks Entry</div>
            <p className="text-[10px] text-slate-500">CIA &amp; sessional</p>
          </Link>

          <Link
            to="/faculty/lesson-plan"
            className="academic-card p-3.5 space-y-1.5 hover:border-blue-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Lesson Plan</div>
            <p className="text-[10px] text-slate-500">Syllabus tracking</p>
          </Link>

          <Link
            to="/faculty/question-paper"
            className="academic-card p-3.5 space-y-1.5 hover:border-purple-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 mx-auto flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Question Paper</div>
            <p className="text-[10px] text-slate-500">Blueprint authoring</p>
          </Link>

          <Link
            to="/faculty/co-attainment"
            className="academic-card p-3.5 space-y-1.5 hover:border-indigo-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 mx-auto flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">CO Attainment</div>
            <p className="text-[10px] text-slate-500">OBE &amp; NBA SAR</p>
          </Link>

          <Link
            to="/faculty/workload"
            className="academic-card p-3.5 space-y-1.5 hover:border-emerald-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Workload</div>
            <p className="text-[10px] text-slate-500">UGC compliance</p>
          </Link>

          <Link
            to="/faculty/announcements"
            className="academic-card p-3.5 space-y-1.5 hover:border-sky-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 mx-auto flex items-center justify-center text-sky-600 group-hover:scale-110 transition">
              <Send className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Broadcasts</div>
            <p className="text-[10px] text-slate-500">Class notices &amp; alerts</p>
          </Link>

          <Link
            to="/faculty/mentorship"
            className="academic-card p-3.5 space-y-1.5 hover:border-amber-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Mentorship</div>
            <p className="text-[10px] text-slate-500">Cohort &amp; interventions</p>
          </Link>

          <Link
            to="/faculty/research"
            className="academic-card p-3.5 space-y-1.5 hover:border-purple-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 mx-auto flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Research &amp; FDP</div>
            <p className="text-[10px] text-slate-500">CAS publications</p>
          </Link>

          <Link
            to="/faculty/accreditation"
            className="academic-card p-3.5 space-y-1.5 hover:border-indigo-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 mx-auto flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Accreditation</div>
            <p className="text-[10px] text-slate-500">SAR evidence package</p>
          </Link>

          <Link
            to="/faculty/materials"
            className="academic-card p-3.5 space-y-1.5 hover:border-blue-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Course Notes</div>
            <p className="text-[10px] text-slate-500">Slides &amp; PDFs</p>
          </Link>

          <Link
            to="/faculty/leave"
            className="academic-card p-3.5 space-y-1.5 hover:border-rose-500 transition group block text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-600 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#0F2747]">Leave Desk</div>
            <p className="text-[10px] text-slate-500">CL/EL &amp; proxy</p>
          </Link>
        </div>
      </div>

      {/* Class Mentorship Cohort At-Risk Scholars */}
      <div className="academic-card p-5 bg-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-academic-serif text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D97706]" />
              <span>Mentorship Cohort Alerts &bull; Attendance Shortages</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scholars flagged below the 75% UGC statutory threshold or pending account dues.
            </p>
          </div>
          <Link to="/faculty/mentorship" className="text-xs font-bold text-[#1E5AA8] hover:underline">
            Manage All {mentees.length} Mentees &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {atRiskStudents.slice(0, 4).map((student) => {
            const isShortage = student.attendance_percentage < 75;
            const isCondoned = student.mentor_approval_status === 'condoned';

            return (
              <div
                key={student.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-[#0F2747] text-xs">{student.full_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{student.roll_number}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isShortage ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {student.attendance_percentage}%
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {student.attended_lectures}/{student.total_lectures} classes
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  {isCondoned ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Condoned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleGrantCondonation(student)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Condonation</span>
                    </button>
                  )}

                  <Link
                    to="/faculty/mentorship"
                    className="text-[11px] text-[#1E5AA8] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Intervene &amp; Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
