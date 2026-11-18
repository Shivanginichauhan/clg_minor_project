import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { attendanceService } from '../../services/attendanceService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { FacultyAllocationWithDetails, SubjectWithDetails, StudentWithDetails } from '../../data/mockAcademics.js';
import { LectureSession } from '../../data/mockAttendance.js';
import { AttendanceStatus } from '../../types/database.types.js';
import { facultyFeaturesService, AttendanceCorrectionRequest } from '../../services/facultyFeaturesService.js';
import {
  CalendarCheck,
  BookOpen,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  Trash2,
  Search,
  Filter,
  Check,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  MessageSquare
} from 'lucide-react';

export const AttendanceRegisterPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithDetails | null>(null);

  const [enrolledStudents, setEnrolledStudents] = useState<StudentWithDetails[]>([]);
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [subjectRecords, setSubjectRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Lecture Session Modal / Drawer State
  const [isMarkingOpen, setIsMarkingOpen] = useState<boolean>(false);
  const [lectureDate, setLectureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodSlot, setPeriodSlot] = useState<string>('09:30 AM - 10:30 AM');
  const [topicCovered, setTopicCovered] = useState<string>('');
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<{
    [studentId: string]: { status: AttendanceStatus; remarks: string };
  }>({});

  const [activeTab, setActiveTab] = useState<'roster' | 'sessions' | 'corrections'>('roster');
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [reviewRemark, setReviewRemark] = useState<{ [id: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load faculty allocations on mount
  useEffect(() => {
    loadFacultyData();
  }, [user]);

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      const allAllocs = await academicStructureService.getAllocations();
      // Role-based filter: Dean/Admin see all, Faculty see strictly their own allocations
      const facultyAllocs = allAllocs.filter((a) => {
        if (!user) return false;
        if (user.role === 'administrator' || user.role === 'dean') return true;
        return (
          a.faculty_id === user.id ||
          a.faculty?.id === user.id ||
          a.faculty?.profile?.id === user.id ||
          a.faculty?.user_id === user.id
        );
      });

      setAllocations(facultyAllocs);
      if (facultyAllocs.length > 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const paramSubId = urlParams.get('subjectId');
        const initialSubId = (paramSubId && facultyAllocs.some(a => a.subject_id === paramSubId))
          ? paramSubId
          : facultyAllocs[0].subject_id;
        setSelectedSubjectId(initialSubId);
        const match = facultyAllocs.find(a => a.subject_id === initialSubId);
        setSelectedSubject(match?.subject || null);
        await loadSubjectAttendance(initialSubId);
      }
    } catch (err) {
      console.error('Failed to load faculty allocations', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectAttendance = async (subjectId: string) => {
    try {
      const [enrollments, lectureSessions, subjects, records] = await Promise.all([
        enrollmentService.getEnrollmentsBySubject(subjectId),
        attendanceService.getLectureSessionsBySubject(subjectId),
        academicStructureService.getSubjects(),
        attendanceService.getAllAttendance({ subjectId }),
      ]);

      const curSub = subjects.find((s) => s.id === subjectId) || null;
      setSelectedSubject(curSub);

      const students = enrollments.map((e) => e.student).filter(Boolean) as StudentWithDetails[];
      setEnrolledStudents(students);
      setSessions(lectureSessions);
      setSubjectRecords(records);

      // Initialize default attendance map for roll call
      const initMap: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};
      students.forEach((s) => {
        initMap[s.id] = { status: 'present', remarks: '' };
      });
      setStudentAttendanceMap(initMap);

      // Load corrections for subject
      const allCorrections = facultyFeaturesService.getCorrections();
      setCorrections(allCorrections);
    } catch (err) {
      console.error('Failed to load subject attendance data', err);
    }
  };

  const handleReviewCorrection = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const remark = reviewRemark[id] || (action === 'approved' ? 'Approved upon verification of records' : 'Insufficient justification or absence verified');
      const updated = await facultyFeaturesService.reviewCorrection(id, action, remark, profile?.full_name || 'Dr. Priya Nambiar');
      setCorrections(facultyFeaturesService.getCorrections());
      setMessage({
        type: 'success',
        text: `Attendance correction request for ${updated.student_name} (${updated.session_date}) has been ${action}.`,
      });
      // Reload attendance records so recalculation reflects immediately
      if (selectedSubjectId) {
        await loadSubjectAttendance(selectedSubjectId);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update correction request' });
    }
  };

  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubId = e.target.value;
    setSelectedSubjectId(newSubId);
    await loadSubjectAttendance(newSubId);
  };

  const handleStatusToggle = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setStudentAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: { [studentId: string]: { status: AttendanceStatus; remarks: string } } = {};
    enrolledStudents.forEach((s) => {
      updated[s.id] = {
        status,
        remarks: studentAttendanceMap[s.id]?.remarks || '',
      };
    });
    setStudentAttendanceMap(updated);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topicCovered.trim()) {
      setMessage({ type: 'error', text: 'Please specify the lecture topic covered.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const studentStatuses = enrolledStudents.map((s) => ({
        student_id: s.id,
        status: studentAttendanceMap[s.id]?.status || 'present',
        remarks: studentAttendanceMap[s.id]?.remarks || undefined,
      }));

      if (!user?.id) {
        setMessage({ type: 'error', text: 'Authentication session expired. Please log in again.' });
        return;
      }

      await attendanceService.recordLectureSession(
        {
          subject_id: selectedSubjectId,
          faculty_id: user.id,
          date: lectureDate,
          period_slot: periodSlot,
          topic_covered: topicCovered.trim(),
        },
        studentStatuses
      );

      setMessage({ type: 'success', text: `Lecture attendance successfully registered for ${lectureDate}!` });
      setIsMarkingOpen(false);
      setTopicCovered('');
      await loadSubjectAttendance(selectedSubjectId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this lecture attendance session?')) return;
    try {
      await attendanceService.deleteLectureSession(sessionId);
      setMessage({ type: 'success', text: 'Lecture session deleted successfully.' });
      await loadSubjectAttendance(selectedSubjectId);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete lecture session.' });
    }
  };

  const exportAttendanceCSV = () => {
    if (!selectedSubject || enrolledStudents.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Subject Code,${selectedSubject.code}\n`;
    csvContent += `Subject Name,${selectedSubject.name}\n`;
    csvContent += `Generated On,${new Date().toLocaleDateString()}\n\n`;

    csvContent += 'Roll Number,Enrollment Number,Student Name,Total Classes,Attended Classes,Attendance Percentage,Eligibility Status\n';

    enrolledStudents.forEach((student) => {
      // Calculate genuine statistics from recorded sessions
      const studentRecs = subjectRecords.filter((r) => r.student_id === student.id);
      const attended = studentRecs.filter((r) => r.status === 'present').length;
      const excused = studentRecs.filter((r) => r.status === 'excused').length;
      const total = studentRecs.length > 0 ? studentRecs.length : (sessions.length > 0 ? sessions.length : 1);
      const effectiveAttended = attended + excused;
      const pctNum = total > 0 ? (effectiveAttended / total) * 100 : 100.0;
      const pct = pctNum.toFixed(1);
      const eligibility = pctNum >= 75 ? 'Eligible' : pctNum >= 65 ? 'Condonation Required' : 'Detained';

      csvContent += `"${student.roll_number}","${student.enrollment_number}","${student.profile?.full_name}",${total},${effectiveAttended},${pct}%,${eligibility}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedSubject.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = enrolledStudents.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.profile?.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.enrollment_number?.toLowerCase().includes(q)
    );
  });

  const mapValues = Object.values(studentAttendanceMap) as Array<{ status: AttendanceStatus; remarks: string }>;
  const presentCount = mapValues.filter((v) => v.status === 'present').length;
  const absentCount = mapValues.filter((v) => v.status === 'absent').length;
  const excusedCount = mapValues.filter((v) => v.status === 'excused').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                Faculty Attendance Register
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Faculty Attendance Register &amp; Roll Call
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Class Attendance Register
            </h1>
            <p className="text-xs text-[#64748B]">
              Record daily lecture attendance, monitor real-time class averages, and track 75% statutory eligibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="export-attendance-csv-btn"
              onClick={exportAttendanceCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              id="open-mark-attendance-btn"
              onClick={() => setIsMarkingOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Take Attendance</span>
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
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
        </div>
      )}

      {/* Subject Selector & Quick Stats Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-semibold text-[#64748B] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
            <span>Select Assigned Course:</span>
          </label>
          <select
            id="faculty-subject-select"
            value={selectedSubjectId}
            onChange={handleSubjectChange}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          >
            {allocations.map((alloc) => (
              <option key={alloc.id} value={alloc.subject_id}>
                {alloc.subject?.code} - {alloc.subject?.name} ({alloc.role.replace('_', ' ').toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {selectedSubject && (
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
              <span className="text-[#64748B]">Total Enrolled:</span> <strong className="text-[#0F2747]">{enrolledStudents.length}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
              <span className="text-[#64748B]">Classes Conducted:</span> <strong className="text-[#1E5AA8]">{sessions.length}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
              <span className="text-[#64748B]">Credits:</span> <strong className="text-indigo-600">{selectedSubject.credits}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            id="tab-roster-btn"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0F2747] border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Students Roster ({enrolledStudents.length})</span>
          </button>
          <button
            id="tab-sessions-btn"
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0F2747] border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lecture History &amp; Topics ({sessions.length})</span>
          </button>
          <button
            id="tab-corrections-btn"
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'corrections'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-[#0F2747] border border-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-500" />
            <span>Correction Requests</span>
            {corrections.filter((c) => c.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold animate-pulse">
                {corrections.filter((c) => c.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'roster' && (
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Enrolled Student Roster & Summary */}
      {activeTab === 'roster' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Student Attendance Ledger &bull; {selectedSubject?.code}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Statutory threshold: 75% required for Hall Ticket
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name &amp; Details</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4 text-center">Classes Conducted</th>
                  <th className="py-3 px-4 text-center">Cumulative Attendance</th>
                  <th className="py-3 px-4 text-center">Exam Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B]">
                      No enrolled students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentRecs = subjectRecords.filter((r) => r.student_id === student.id);
                    const attended = studentRecs.filter((r) => r.status === 'present').length;
                    const excused = studentRecs.filter((r) => r.status === 'excused').length;
                    const totalSessions = studentRecs.length > 0 ? studentRecs.length : sessions.length;
                    const pct = totalSessions > 0 ? ((attended + excused) / totalSessions) * 100 : 88.0;
                    const isEligible = pct >= 75;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={student.profile?.full_name}
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                            />
                            <div>
                              <div className="font-bold text-[#172033]">{student.profile?.full_name}</div>
                              <div className="text-[11px] text-[#64748B]">{student.profile?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#1E5AA8]">
                          {student.roll_number}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#64748B]">
                          {student.enrollment_number}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">
                          {sessions.length} Lectures
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`font-extrabold ${pct >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {pct.toFixed(1)}%
                            </span>
                            <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Low Attendance
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Lecture Session History */}
      {activeTab === 'sessions' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Conducted Lecture Timeline &amp; Curriculum Topics
            </h3>
            <span className="text-[11px] text-[#1E5AA8] font-medium">
              {sessions.length} Recorded Sessions
            </span>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] text-xs">
                No lecture attendance sessions recorded yet. Click "Take Attendance" above to log your first class.
              </div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-mono text-[11px] font-bold border border-sky-200">
                        {sess.date}
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {sess.period_slot}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#172033]">{sess.topic_covered}</h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {sess.present_count} Present
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {sess.absent_count} Absent
                      </span>
                      {sess.excused_count > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                          {sess.excused_count} Excused
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      title="Delete Session"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Correction Workflow */}
      {activeTab === 'corrections' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                <span>Attendance Dispute &amp; Correction Requests</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review student-initiated roll call corrections. Every approved change updates the attendance ledger with an audit trail.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                {corrections.filter((c) => c.status === 'pending').length} Pending Action
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {corrections.length === 0 ? (
              <div className="text-center py-10 text-[#64748B] text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">No attendance disputes submitted.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Students can report missed swipes or sanctioned duties from their portal.</p>
              </div>
            ) : (
              corrections.map((corr) => (
                <div
                  key={corr.id}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                    corr.status === 'pending'
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : corr.status === 'approved'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-rose-50/20 border-rose-200'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-[#0F2747]">{corr.student_name}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {corr.roll_number}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        &bull; Lecture Date: <strong>{corr.session_date}</strong> {corr.period_slot && `(${corr.period_slot})`}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          corr.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : corr.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {corr.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[#64748B]">Disputed Entry:</span>
                      <span className="line-through text-rose-600 font-bold uppercase text-[11px]">{corr.old_status}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="text-emerald-700 font-bold uppercase text-[11px]">Requested: {corr.requested_status}</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Student's Justification:</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-5">{corr.reason}</p>
                      {corr.proof_url && (
                        <div className="pl-5 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#1E5AA8] font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            📎 Attached Sanction Letter: {corr.proof_url}
                          </span>
                        </div>
                      )}
                    </div>

                    {corr.faculty_remarks && (
                      <div className="text-[11px] text-slate-600 pl-2 border-l-2 border-slate-300">
                        <span className="font-bold text-slate-700">Faculty Endorsement:</span> {corr.faculty_remarks}{' '}
                        <span className="text-slate-400 font-mono">({corr.approved_by} on {new Date(corr.approved_at || '').toLocaleDateString()})</span>
                      </div>
                    )}
                  </div>

                  {corr.status === 'pending' && (
                    <div className="flex flex-col sm:w-64 gap-2 pt-1 shrink-0">
                      <input
                        type="text"
                        placeholder="Faculty remark / note..."
                        value={reviewRemark[corr.id] || ''}
                        onChange={(e) => setReviewRemark({ ...reviewRemark, [corr.id]: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewCorrection(corr.id, 'approved')}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReviewCorrection(corr.id, 'rejected')}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Take Attendance / New Lecture Session */}
      {isMarkingOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-[#1E5AA8]" />
                  Take Lecture Attendance: {selectedSubject?.code}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selectedSubject?.name} &bull; {enrolledStudents.length} Students
                </p>
              </div>
              <button
                onClick={() => setIsMarkingOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitAttendance} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Lecture Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B]">Lecture Date</label>
                  <input
                    type="date"
                    required
                    value={lectureDate}
                    onChange={(e) => setLectureDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B]">Period Slot</label>
                  <input
                    type="text"
                    required
                    value={periodSlot}
                    onChange={(e) => setPeriodSlot(e.target.value)}
                    placeholder="e.g. 09:30 AM - 10:30 AM"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B]">Curriculum Topic / Unit Covered</label>
                  <input
                    type="text"
                    required
                    value={topicCovered}
                    onChange={(e) => setTopicCovered(e.target.value)}
                    placeholder="e.g. Module 3: Distributed Concurrency Control and 2PC Protocols"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              {/* Quick Actions & Live Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748B] font-semibold">Quick Actions:</span>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 cursor-pointer"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 cursor-pointer"
                  >
                    All Absent
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-emerald-700">{presentCount} Present</span>
                  <span className="text-rose-700">{absentCount} Absent</span>
                  <span className="text-amber-700">{excusedCount} Excused</span>
                </div>
              </div>

              {/* Roll Call Student Rows */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Student Roll-Call Roster ({enrolledStudents.length})
                </p>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {enrolledStudents.map((student) => {
                    const curStatus = studentAttendanceMap[student.id]?.status || 'present';
                    const curRemark = studentAttendanceMap[student.id]?.remarks || '';

                    return (
                      <div
                        key={student.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-[#1E5AA8] font-bold border border-slate-200">
                            {student.roll_number.slice(-3)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#172033]">{student.profile?.full_name}</div>
                            <div className="text-[10px] text-[#64748B] font-mono">{student.roll_number}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-lg bg-slate-100 border border-slate-200 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(student.id, 'present')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                curStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(student.id, 'absent')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                curStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(student.id, 'excused')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                curStatus === 'excused'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Excused
                            </button>
                          </div>

                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={curRemark}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            className="w-32 sm:w-40 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMarkingOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-lecture-attendance-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Save & Publish Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
