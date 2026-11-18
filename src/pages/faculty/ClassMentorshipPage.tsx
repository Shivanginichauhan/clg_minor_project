import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  ShieldCheck,
  Phone,
  Mail,
  UserCheck,
  FileText,
  Send,
  Download,
  Printer,
  ChevronRight,
  Sparkles,
  BookOpen,
  Award,
  Eye,
  Check,
  X,
  Clock,
  ArrowRight,
  ClipboardList,
  History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  classMentorshipService,
  MenteeStudent,
  MentorshipCohortSummary
} from '../../services/classMentorshipService.js';
import {
  facultyFeaturesService,
  StudentIntervention
} from '../../services/facultyFeaturesService.js';
import { Link } from 'react-router-dom';

export const ClassMentorshipPage: React.FC = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<MentorshipCohortSummary | null>(null);
  const [mentees, setMentees] = useState<MenteeStudent[]>([]);
  const [interventions, setInterventions] = useState<StudentIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'shortage' | 'backlogs' | 'pending'>('all');

  // Selected student for detailed modal/drawer
  const [selectedStudent, setSelectedStudent] = useState<MenteeStudent | null>(null);
  const [counselingNotes, setCounselingNotes] = useState('');
  const [condonationReason, setCondonationReason] = useState('Medical Grounds & Co-curricular Participation Verified');

  // Intervention Creation Modal State
  const [interventionModalStudent, setInterventionModalStudent] = useState<MenteeStudent | null>(null);
  const [interventionType, setInterventionType] = useState<StudentIntervention['intervention_type']>('Mentoring session');
  const [interventionDate, setInterventionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [followUpDate, setFollowUpDate] = useState<string>(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [interventionNotes, setInterventionNotes] = useState<string>('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  // Action status toast
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const loadCohortData = async () => {
    setLoading(true);
    try {
      const data = await classMentorshipService.getCohortSummary(profile?.full_name);
      setSummary(data.summary);
      setMentees(data.mentees);
      const allInterventions = facultyFeaturesService.getInterventions();
      setInterventions(allInterventions);
    } catch (err) {
      console.error('Failed to load mentorship cohort:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCohortData();
  }, [profile]);

  const handleOpenInterventionModal = (student: MenteeStudent) => {
    setInterventionModalStudent(student);
    const concerns: string[] = [];
    if (student.attendance_percentage < 75) concerns.push(`Attendance ${student.attendance_percentage}% (< 75% Statutory Minimum)`);
    if (student.backlog_count > 0) concerns.push(`${student.backlog_count} Active Academic Backlog(s)`);
    if (student.no_dues_status !== 'cleared') concerns.push(`Term Dues Pending: ${student.no_dues_status}`);
    if (concerns.length === 0) concerns.push('Routine Academic Progress Review');
    setSelectedConcerns(concerns);
    setInterventionNotes('');
  };

  const handleRecordInterventionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionModalStudent) return;
    try {
      const created = facultyFeaturesService.recordIntervention({
        student_id: interventionModalStudent.id,
        student_name: interventionModalStudent.full_name,
        roll_number: interventionModalStudent.roll_number,
        faculty_id: profile?.id || 'fac-001',
        faculty_name: profile?.full_name || 'Dr. Priya Nambiar',
        concerns: selectedConcerns,
        intervention_type: interventionType,
        scheduled_date: interventionDate,
        follow_up_date: followUpDate,
        notes: interventionNotes || 'Formal counseling session scheduled.',
        status: 'Open'
      });
      setInterventions(facultyFeaturesService.getInterventions());
      setInterventionModalStudent(null);
      setActionToast({
        type: 'success',
        message: `Structured academic intervention recorded for ${created.student_name}. Follow-up scheduled for ${created.follow_up_date}.`
      });
      setTimeout(() => setActionToast(null), 5000);
    } catch (err: any) {
      alert('Error recording intervention: ' + err.message);
    }
  };

  const handleUpdateStatus = (id: string, status: StudentIntervention['status'], followUpNotes?: string) => {
    try {
      facultyFeaturesService.updateInterventionStatus(id, status, followUpNotes);
      setInterventions(facultyFeaturesService.getInterventions());
      setActionToast({
        type: 'success',
        message: `Intervention status updated to "${status}".`
      });
      setTimeout(() => setActionToast(null), 5000);
    } catch (err: any) {
      alert('Error updating intervention status: ' + err.message);
    }
  };

  const handleGrantCondonation = async (student: MenteeStudent) => {
    if (!window.confirm(`Grant Faculty Mentor Condonation & Exam Clearance for ${student.full_name} (${student.roll_number})?`)) {
      return;
    }
    try {
      const updated = await classMentorshipService.grantMentorCondonation(student.id, condonationReason);
      await loadCohortData();
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(updated);
      }
      setActionToast({
        type: 'success',
        message: `Attendance condonation & exam sign-off granted to ${student.full_name}! Exam clearance is now marked Eligible.`,
      });
      setTimeout(() => setActionToast(null), 6000);
    } catch (err: any) {
      alert('Failed to grant condonation: ' + err.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedStudent) return;
    try {
      const updated = await classMentorshipService.updateMentorNotes(selectedStudent.id, counselingNotes);
      await loadCohortData();
      setSelectedStudent(updated);
      setActionToast({
        type: 'success',
        message: `Counseling notes saved for ${selectedStudent.full_name}.`,
      });
      setTimeout(() => setActionToast(null), 4000);
    } catch (err: any) {
      alert('Error updating notes: ' + err.message);
    }
  };

  const handleSendAlert = async (studentId: string, alertType: 'shortage' | 'dues' | 'counseling') => {
    try {
      const res = await classMentorshipService.sendGuardianAlert(studentId, alertType);
      setActionToast({ type: 'info', message: res.message });
      setTimeout(() => setActionToast(null), 6000);
    } catch (err: any) {
      alert('Alert dispatch failed: ' + err.message);
    }
  };

  // Filtered mentees
  const filteredMentees = mentees.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'shortage') return m.attendance_percentage < 75;
    if (activeTab === 'backlogs') return m.backlog_count > 0;
    if (activeTab === 'pending') return m.exam_clearance_status !== 'eligible';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {actionToast && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold">{actionToast.message}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-900/50 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-3d text-[11px] px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 font-bold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Class Mentorship Directorate &bull; Batch In-Charge</span>
              </span>
              <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Proctorial Authority &bull; AY 2025-26</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {summary?.cohortName || 'Master of Computer Applications (MCA) — Semester 2 (Section A)'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Mentor: <span className="text-white font-semibold">{profile?.full_name || 'Dr. Priya Nambiar'}</span>. Real-time class supervision roster, student contact records, cumulative attendance monitoring, backlog scrutiny, and statutory exam clearance condonations.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => window.print()}
              className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Cohort Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="academic-card p-4 space-y-1 border-l-4 border-l-[#1E5AA8]">
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Total Mentees</p>
            <div className="text-2xl font-academic-display font-extrabold text-[#0F2747]">{summary.totalMentees}</div>
            <p className="text-[10px] text-slate-500">Enrolled Scholars</p>
          </div>

          <div className="academic-card p-4 space-y-1 border-l-4 border-l-emerald-600">
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Avg Class Attendance</p>
            <div className="text-2xl font-academic-display font-extrabold text-emerald-700">{summary.averageAttendance}%</div>
            <p className="text-[10px] text-emerald-800 font-semibold">Benchmark: &ge;75%</p>
          </div>

          <div
            onClick={() => setActiveTab('shortage')}
            className="academic-card p-4 space-y-1 border-l-4 border-l-red-500 cursor-pointer hover:bg-red-50/20 transition"
          >
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Attendance Shortage</p>
            <div className="text-2xl font-academic-display font-extrabold text-red-600">{summary.attendanceShortageCount}</div>
            <p className="text-[10px] text-red-700 font-semibold">&lt; 75% At-Risk</p>
          </div>

          <div
            onClick={() => setActiveTab('backlogs')}
            className="academic-card p-4 space-y-1 border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50/20 transition"
          >
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Active Backlogs</p>
            <div className="text-2xl font-academic-display font-extrabold text-amber-700">{summary.activeBacklogsCount}</div>
            <p className="text-[10px] text-amber-800 font-semibold">Needs Academic Aid</p>
          </div>

          <div className="academic-card p-4 space-y-1 border-l-4 border-l-purple-600">
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Class Average CGPA</p>
            <div className="text-2xl font-academic-display font-extrabold text-purple-800">{summary.averageCgpa}</div>
            <p className="text-[10px] text-slate-500">Out of 10.0 Scale</p>
          </div>

          <div
            onClick={() => setActiveTab('pending')}
            className="academic-card p-4 space-y-1 border-l-4 border-l-blue-600 cursor-pointer hover:bg-blue-50/20 transition"
          >
            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Exam Cleared</p>
            <div className="text-2xl font-academic-display font-extrabold text-[#1E5AA8]">
              {summary.examEligibleCount} / {summary.totalMentees}
            </div>
            <p className="text-[10px] text-[#1E5AA8] font-semibold">
              {((summary.examEligibleCount / summary.totalMentees) * 100).toFixed(0)}% Cleared
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-[#0F2747] text-white border-[#0F2747]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>All Mentees</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {mentees.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shortage')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'shortage'
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Attendance Shortage (&lt;75%)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-red-200 text-red-900">
                {summary?.attendanceShortageCount || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('backlogs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'backlogs'
                  ? 'bg-amber-700 text-white border-amber-700'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>Active Backlogs</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900">
                {summary?.activeBacklogsCount || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'pending'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span>Clearance Flagged</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900">
                {mentees.length - (summary?.examEligibleCount || 0)}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scholar name, roll, email..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-slate-50 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Mentee Roster Table */}
      <div className="card-3d bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Class Mentee Roster ({filteredMentees.length} scholars)</span>
          </h2>
          <span className="text-xs text-slate-500 font-sans">
            Section A &bull; Batch 2025-26
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">Scholar Details</th>
                <th className="py-3 px-4">Roll / Enrollment</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">CGPA / Backlogs</th>
                <th className="py-3 px-4">Statutory Clearances</th>
                <th className="py-3 px-4">Exam Eligibility</th>
                <th className="py-3 px-4 text-right">Mentor Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentees.map((student) => {
                const attPercent = student.attendance_percentage;
                const isShortage = attPercent < 75;
                const isEligible = student.exam_clearance_status === 'eligible';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition group">
                    {/* Scholar Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar_url}
                          alt={student.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition text-sm">
                            {student.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{student.gender}</span>
                            <span>&bull;</span>
                            <span className="font-semibold text-slate-600">{student.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roll / Enrollment */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        {student.roll_number}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {student.enrollment_number}
                      </div>
                    </td>

                    {/* Attendance % */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-bold font-mono text-xs ${
                              attPercent >= 75
                                ? 'text-emerald-700'
                                : attPercent >= 70
                                ? 'text-amber-700'
                                : 'text-red-600'
                            }`}
                          >
                            {attPercent.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {student.attended_lectures}/{student.total_lectures}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              attPercent >= 75
                                ? 'bg-emerald-500'
                                : attPercent >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(attPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* CGPA / Backlogs */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{student.cgpa} CGPA</div>
                      <div className="text-[11px] mt-0.5">
                        {student.backlog_count === 0 ? (
                          <span className="text-emerald-700 font-semibold">0 Backlogs</span>
                        ) : (
                          <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            {student.backlog_count} Backlog{student.backlog_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Clearances */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500">Accounts:</span>
                          {student.no_dues_status === 'accounts_pending' ? (
                            <span className="text-red-700 font-bold bg-red-50 px-1.5 rounded">Pending ₹1,500</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Cleared</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500">Library:</span>
                          {student.no_dues_status === 'library_pending' ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-1.5 rounded">Book Due</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Cleared</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Exam Eligibility */}
                    <td className="py-3.5 px-4">
                      {isEligible ? (
                        <span className="badge-3d text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border-emerald-300 font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Eligible to Apply</span>
                        </span>
                      ) : student.exam_clearance_status === 'attendance_shortage' ? (
                        <span className="badge-3d text-[10px] px-2.5 py-1 bg-red-50 text-red-800 border-red-300 font-bold flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Attendance Shortage</span>
                        </span>
                      ) : (
                        <span className="badge-3d text-[10px] px-2.5 py-1 bg-amber-50 text-amber-800 border-amber-300 font-bold flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Dues Action Required</span>
                        </span>
                      )}
                      {student.mentor_approval_status === 'condoned' && (
                        <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                          ✓ Mentor Condoned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isShortage && student.mentor_approval_status !== 'condoned' && (
                          <button
                            onClick={() => handleGrantCondonation(student)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer flex items-center gap-1"
                            title="Grant attendance condonation & exam sign-off"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Condonation</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenInterventionModal(student)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-[11px] border border-blue-200 transition cursor-pointer flex items-center gap-1"
                          title="Record structured academic intervention"
                        >
                          <ClipboardList className="w-3 h-3 text-blue-600" />
                          <span>Intervene</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setCounselingNotes(student.mentor_notes || '');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detailed Dossier & Counseling Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedStudent.avatar_url}
                  alt={selectedStudent.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xs"
                />
                <div>
                  <h3 className="font-academic-serif text-lg font-bold text-[#0F2747]">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll: <span className="font-mono font-bold text-slate-700">{selectedStudent.roll_number}</span> &bull; Enrollment: <span className="font-mono font-bold text-slate-700">{selectedStudent.enrollment_number}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    {selectedStudent.program_name} &bull; {selectedStudent.section}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scholar Contact & Guardian Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Scholar Mobile: <span className="font-normal text-slate-700">{selectedStudent.phone}</span>
                </p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  Email: <span className="font-normal text-slate-700">{selectedStudent.email}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">
                  Guardian: <span className="font-normal text-slate-700">{selectedStudent.guardian_name}</span>
                </p>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  Guardian Contact: <span className="font-normal text-slate-700">{selectedStudent.guardian_phone}</span>
                </p>
              </div>
            </div>

            {/* Academic Standing Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Attendance</span>
                <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">
                  {selectedStudent.attendance_percentage}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedStudent.attended_lectures} / {selectedStudent.total_lectures} Classes
                </span>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <span className="text-[10px] text-[#1E5AA8] uppercase font-bold block">Cumulative CGPA</span>
                <span className="text-xl font-bold font-academic-display text-[#0F2747] mt-0.5 block">
                  {selectedStudent.cgpa}
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedStudent.backlog_count === 0 ? 'No Active Backlogs' : `${selectedStudent.backlog_count} Backlog(s)`}
                </span>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <span className="text-[10px] text-purple-800 uppercase font-bold block">Exam Eligibility</span>
                <span className="text-xs font-bold text-purple-900 mt-1.5 block uppercase">
                  {selectedStudent.exam_clearance_status.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-500">
                  Mentor: {selectedStudent.mentor_approval_status}
                </span>
              </div>
            </div>

            {/* Mentor Actions & Proctorial Condonation */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0F2747] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Mentor Proctorial Condonation &amp; Exam Clearance
                </h4>
                {selectedStudent.mentor_approval_status === 'condoned' && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Condonation Active
                  </span>
                )}
              </div>

              {selectedStudent.mentor_approval_status !== 'condoned' ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-amber-900">
                    Statutory Condonation Grounds &amp; Justification for {selectedStudent.full_name}:
                  </label>
                  <input
                    type="text"
                    value={condonationReason}
                    onChange={(e) => setCondonationReason(e.target.value)}
                    placeholder="e.g. Clinical hospitalization with verified certificate, University sports representation"
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleGrantCondonation(selectedStudent)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Grant Condonation &amp; Sign-off</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  Official Proctorial Condonation recorded: <strong>{selectedStudent.condonation_reason || condonationReason}</strong>
                </div>
              )}

              {/* Proctorial Counseling Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proctorial Counseling &amp; Observation Log
                </label>
                <textarea
                  rows={3}
                  value={counselingNotes}
                  onChange={(e) => setCounselingNotes(e.target.value)}
                  placeholder="Record counseling observations, medical certificates, or academic performance notes..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-white text-slate-900 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400">
                    Last counseled: {selectedStudent.last_counseled_date || 'None'}
                  </span>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1 bg-slate-800 hover:bg-[#0F2747] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Guardian Intimation Dispatches */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Direct Proctorial Alerts to Parent / Guardian:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSendAlert(selectedStudent.id, 'shortage')}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Send className="w-3 h-3 text-red-600" />
                    <span>Attendance Shortage SMS</span>
                  </button>
                  <button
                    onClick={() => handleSendAlert(selectedStudent.id, 'dues')}
                    className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Send className="w-3 h-3 text-amber-600" />
                    <span>Dues Notice Email</span>
                  </button>
                  <button
                    onClick={() => handleSendAlert(selectedStudent.id, 'counseling')}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Send className="w-3 h-3 text-blue-600" />
                    <span>Parent Meeting Invite</span>
                  </button>
                </div>
              </div>
            </div>

              {/* Structured Academic Interventions History */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Structured Academic Interventions ({interventions.filter(i => i.student_id === selectedStudent.id).length})
                  </span>
                  <button
                    onClick={() => handleOpenInterventionModal(selectedStudent)}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    + New Intervention
                  </button>
                </div>

                {interventions.filter(i => i.student_id === selectedStudent.id).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No formal academic interventions logged for this scholar.</p>
                ) : (
                  <div className="space-y-2.5">
                    {interventions.filter(i => i.student_id === selectedStudent.id).map(inv => (
                      <div key={inv.id} className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F2747]">{inv.intervention_type}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'Followed Up' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{inv.notes}</p>
                        <div className="space-y-1 pt-1 border-t border-blue-100 text-[10px] text-slate-500 font-mono">
                          {inv.timeline.map((evt, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-blue-600 font-bold">&bull;</span>
                              <span className="font-bold text-slate-700">{evt.date}:</span>
                              <span>{evt.event}</span>
                            </div>
                          ))}
                        </div>
                        {inv.status !== 'Resolved' && (
                          <div className="flex items-center gap-2 pt-1">
                            {inv.status === 'Open' && (
                              <button
                                onClick={() => handleUpdateStatus(inv.id, 'Contacted', 'Student counseled in cabin')}
                                className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {inv.status === 'Contacted' && (
                              <button
                                onClick={() => handleUpdateStatus(inv.id, 'Followed Up', 'Progress reviewed')}
                                className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]"
                              >
                                Mark Followed Up
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(inv.id, 'Resolved', 'Targets achieved')}
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              ✓ Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Academic Intervention Modal */}
      {interventionModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Research §12 Student Intervention</span>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Record Structured Intervention: {interventionModalStudent.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{interventionModalStudent.roll_number} &bull; {interventionModalStudent.program_name}</p>
              </div>
              <button
                onClick={() => setInterventionModalStudent(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordInterventionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Identified Academic Concerns:</label>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  {selectedConcerns.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="font-medium">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Intervention Type:</label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  <option value="Mentoring session">1-on-1 Faculty Mentoring Session</option>
                  <option value="Remedial class">Remedial Class / Makeup Lab Enrollment</option>
                  <option value="Parent meeting">Formal Parent-Teacher Academic Meeting</option>
                  <option value="Referral to counselor">Referral to Student Psychological Counselor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Scheduled Date:</label>
                  <input
                    type="date"
                    value={interventionDate}
                    onChange={(e) => setInterventionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Follow-up Milestone Date:</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Intervention Action Notes &amp; Target Goal:</label>
                <textarea
                  rows={3}
                  value={interventionNotes}
                  onChange={(e) => setInterventionNotes(e.target.value)}
                  placeholder="e.g., Student committed to attending morning tutorials, completing Assignment 2 by Friday, and improving attendance to >75%."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInterventionModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
                >
                  Record Structured Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
