import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Printer,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Building,
  User,
  BookOpen,
  Award,
  AlertCircle,
  DoorOpen,
  MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext.js';
import { examService } from '../../services/examService.js';
import { StudentHallTicket, ExamCycleWithDetails } from '../../data/mockExams.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { seatingService, SeatingArrangementWithDetails } from '../../services/seatingService.js';
import { marksService } from '../../services/marksService.js';
import { StudentMarksWithDetails } from '../../data/mockMarks.js';

export const StudentExaminationsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [exams, setExams] = useState<ExamCycleWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [hallTicket, setHallTicket] = useState<StudentHallTicket | null>(null);
  const [activeTab, setActiveTab] = useState<'hall_ticket' | 'timetable' | 'seating_plan' | 'cia_marks'>('hall_ticket');
  const [studentSeating, setStudentSeating] = useState<SeatingArrangementWithDetails[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMarksWithDetails[]>([]);
  const [student, setStudent] = useState<any>(null);

  // Exam Incident Reporting State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState('Lab System / Computer Crash');
  const [incidentSubject, setIncidentSubject] = useState('');
  const [incidentRoom, setIncidentRoom] = useState('');
  const [incidentDesk, setIncidentDesk] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentList, setIncidentList] = useState<any[]>([]);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchInitialData = async () => {
      try {
        const students = await studentFacultyService.getStudents();
        const foundStudent = students.find((s) => s.user_id === user.id || s.id === user.id);
        setStudent(foundStudent || null);

        const allExams = await examService.getExaminations();
        setExams(allExams);

        const activeOrFirst = allExams.find((e) => e.is_active && e.approval_status === 'published') || allExams[0];
        const examId = activeOrFirst ? activeOrFirst.id : '';
        setSelectedExamId(examId);

        const studentId = foundStudent?.id || user.id;
        const ht = await examService.getHallTicketForStudent(studentId, examId);
        setHallTicket(ht);

        const allSeating = await seatingService.getSeatingArrangements();
        setStudentSeating(allSeating.filter((s) => s.student_id === studentId));

        const marks = await marksService.getAllMarks({ studentId: studentId, examinationId: examId });
        setStudentMarks(marks);

        const savedIncidents = localStorage.getItem(`itm_exam_incidents_${studentId}`);
        if (savedIncidents) {
          setIncidentList(JSON.parse(savedIncidents));
        }
      } catch (e) {
        console.error('Failed to load exam data for student:', e);
      }
    };

    fetchInitialData();
  }, [user]);

  const handleExamChange = async (examId: string) => {
    if (!user?.id) return;
    setSelectedExamId(examId);
    const studentId = student?.id || user.id;
    const ht = await examService.getHallTicketForStudent(studentId, examId);
    setHallTicket(ht);
    const allSeating = await seatingService.getSeatingArrangements();
    setStudentSeating(allSeating.filter((s) => s.student_id === studentId));
    const marks = await marksService.getAllMarks({ studentId: studentId, examinationId: examId });
    setStudentMarks(marks);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = () => {
    if (!hallTicket) return;
    const content = `========================================================\nITM UNIVERSITY - ADMIT CARD & EXAMINATION DOCKET\n========================================================\nCandidate Name: ${hallTicket.student_name}\nRoll No: ${hallTicket.roll_number}\nEnrollment No: ${hallTicket.enrollment_number}\nHall Ticket No: ${hallTicket.hall_ticket_number}\nExamination: ${selectedExam?.name || 'May 2026 Term End Examinations'}\nStatutory Reporting Protocol: 09:15 AM (Gate strictly closes at 09:45 AM)\n\nPapers:\n` +
      hallTicket.papers.map(p => `• [${p.exam_date} ${p.start_time}-${p.end_time}] ${p.subject_code} - ${p.subject_name} (Venue: ${p.room_number}, ${p.building})`).join('\n') +
      `\n\nOnline Verification: ${window.location.origin}/verify/hall-ticket/${hallTicket.hall_ticket_number}\nOffice of Controller of Examinations\n========================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AdmitCard_${hallTicket.hall_ticket_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  if (!user?.id) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
        <p className="text-sm font-semibold text-slate-700">Please sign in to view exam records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                Examination Portal
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Schedules, Hall Tickets &amp; Examination Verification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Examination Schedules &amp; Hall Ticket
            </h1>
            <p className="text-xs text-[#64748B]">
              Access university examination dates, verify paper timings, and print your statutory admit card.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Report Exam Incident</span>
            </button>
            {hallTicket && hallTicket.is_eligible && (
              <>
                <button
                  onClick={handleDownloadFile}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download Slip</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Hall Ticket</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {incidentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{incidentSuccessMsg}</span>
        </div>
      )}

      {incidentList.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#0F2747]">
            <span className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Reported Exam Incidents ({incidentList.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">Monitored by Centre Superintendent &amp; CoE</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {incidentList.map((inc) => (
              <div key={inc.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0F2747]">{inc.incident_number}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    {inc.status}
                  </span>
                </div>
                <div className="text-slate-700 font-semibold">{inc.incident_type} &bull; {inc.subject_name || 'General'}</div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{inc.description}</p>
                <div className="text-[10px] text-slate-400">Venue: Room {inc.room_number || 'N/A'}, Desk {inc.desk_number || 'N/A'} &bull; {new Date(inc.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cycle Selector & Eligibility Banner (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-[#0F2747] whitespace-nowrap">Examination Term:</label>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#1E5AA8] min-w-[280px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} [{ex.approval_status?.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        {hallTicket && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#64748B]">
              Cumulative Attendance:{' '}
              <strong
                className={`font-mono text-sm ${
                  hallTicket.overall_attendance >= 75 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {hallTicket.overall_attendance.toFixed(1)}%
              </strong>
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider flex items-center gap-1.5 ${
                hallTicket.is_eligible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {hallTicket.is_eligible ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admit Card Generated</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Detained / Ineligible</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Ineligibility Warning if below threshold */}
      {hallTicket && !hallTicket.is_eligible && (
        <div className="print:hidden p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Statutory Detention Warning: Attendance Below 75%</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Your recorded lecture attendance is below the mandatory 75.0% examination eligibility threshold.
            Under University Regulations, your admit card is provisionally withheld. If you have valid medical grounds,
            please submit an official <strong>Medical Condonation Exemption</strong> via the attendance portal for Dean adjudication.
          </p>
          <div>
            <Link
              to="/student/attendance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Apply for Medical Condonation Exemption &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tabs Navigation (Hidden during print) */}
      <div className="print:hidden flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('hall_ticket')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'hall_ticket'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Official Hall Ticket / Admit Card</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'timetable'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Course Examination Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('seating_plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'seating_plan'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Allocated Hall &amp; Desk Locator</span>
        </button>

        <button
          onClick={() => setActiveTab('cia_marks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'cia_marks'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Continuous Assessment (CIA) &amp; Marks</span>
        </button>
      </div>

      {/* Tab 1: Official Printable Hall Ticket */}
      {activeTab === 'hall_ticket' && hallTicket && (
        <div className="space-y-4">
          
          {/* Printable Hall Ticket Document Canvas */}
          <div
            id="printable-hall-ticket"
            className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Watermark Logo simulation */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-black text-slate-900 tracking-widest">UEAMS</span>
            </div>

            {/* University Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-[#0F2747]">
                  University Examination &amp; Academic Management System
                </span>
              </div>
              <p className="text-xs uppercase font-bold text-[#1E5AA8] tracking-wider">
                Office of the Controller of Examinations &bull; Academic Year {hallTicket.academic_session}
              </p>
              <div className="inline-block mt-1 px-4 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest">
                OFFICIAL EXAMINATION HALL TICKET / ADMIT CARD
              </div>
            </div>

            {/* Candidate Credentials Grid & Photo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Candidate Full Name:</span>
                  <strong className="text-sm font-bold text-[#0F2747]">{hallTicket.student_name}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Hall Ticket Number:</span>
                  <strong className="text-sm font-mono font-bold text-[#1E5AA8]">{hallTicket.hall_ticket_number}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">University Roll Number:</span>
                  <strong className="font-mono text-slate-900">{hallTicket.roll_number}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Enrollment Number:</span>
                  <strong className="font-mono text-slate-900">{hallTicket.enrollment_number}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Degree Program:</span>
                  <strong className="text-slate-900">{hallTicket.program_name} (Sem {hallTicket.semester_number})</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Academic Department:</span>
                  <strong className="text-slate-900">{hallTicket.department_name}</strong>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-[#64748B] block text-[11px]">Allotted Examination Centre:</span>
                  <strong className="text-[#0F2747]">{hallTicket.exam_centre} ({hallTicket.centre_code})</strong>
                </div>
              </div>

              {/* Photo & Secure QR Verification Box */}
              <div className="flex flex-col items-center justify-between p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 overflow-hidden shadow-xs">
                  {student?.avatar_url ? (
                    <img src={student.avatar_url} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <User className="w-10 h-10 text-slate-400" />
                      <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Photo</span>
                    </>
                  )}
                </div>

                {/* Scan-Ready Cryptographic QR Code Block */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center space-y-1 text-center w-full">
                  <div className="w-16 h-16 bg-white border border-slate-300 rounded p-1 flex items-center justify-center shadow-xs">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/hall-ticket/${hallTicket.hall_ticket_number}`}
                      size={56}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[#1E5AA8]">SECURE-QR VERIFIED</span>
                  <span className="text-[8px] font-mono text-slate-400 truncate max-w-[100px]">
                    SHA: {hallTicket.hall_ticket_number.slice(0, 10)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scheduled Exam Papers Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2747] flex items-center justify-between">
                <span>Certified Examination Timetable &amp; Seat Allotment</span>
                <span className="text-[10px] font-mono text-[#64748B]">Total Papers: {hallTicket.papers.length}</span>
              </h4>

              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[#0F2747] uppercase font-bold border-b border-slate-300 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Slot / Timings</th>
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3">Venue Room</th>
                      <th className="py-2.5 px-3 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {hallTicket.papers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#64748B]">
                          No active papers mapped for this candidate.
                        </td>
                      </tr>
                    ) : (
                      hallTicket.papers.map((paper, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-[#0F2747] whitespace-nowrap">
                            {paper.exam_date}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {paper.start_time} - {paper.end_time}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1E5AA8]">
                            {paper.subject_code}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {paper.subject_name}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
                            {paper.room_number} ({paper.building})
                          </td>
                          <td className="py-2.5 px-3 text-center border-l border-slate-200">
                            <div className="h-6 w-20 border-b border-dotted border-slate-400 mx-auto" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Candidate Undertaking & Instructions */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] text-slate-700">
              <h5 className="font-bold uppercase text-[#0F2747] text-[11px]">Important Instructions to Candidate:</h5>
              <ul className="list-disc pl-4 space-y-1 text-[#64748B]">
                <li>Candidate must occupy allotted seat in the examination hall 15 minutes prior to the commencement of the exam.</li>
                <li>Possession of mobile phones, smartwatches, programmable calculators, or unauthorized study material is strictly prohibited under the University Anti-Malpractice Act.</li>
                <li>This official admit card and a valid University Photo Identity Card must be produced on demand to the room invigilator.</li>
              </ul>
            </div>

            {/* Signatures Footer */}
            <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs font-semibold text-[#0F2747] border-t border-slate-200">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] text-slate-400 italic">Signed Digitally</span>
                </div>
                <span>Candidate Signature</span>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                </div>
                <span>Exam Superintendent Seal</span>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 max-w-[160px] mx-auto flex items-end justify-center pb-1">
                  <span className="font-mono text-[10px] text-[#1E5AA8] font-bold">Prof. Dr. Ramanathan</span>
                </div>
                <span>Controller of Examinations</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Detailed Course Timetable */}
      {activeTab === 'timetable' && hallTicket && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F2747]">
              Upcoming Paper Timetable &bull; {selectedExam?.name}
            </h3>
            <span className="text-xs text-[#1E5AA8] font-mono">
              {hallTicket.papers.length} Papers Registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hallTicket.papers.map((paper, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1E5AA8]">{paper.subject_code}</span>
                    <h4 className="text-sm font-bold text-[#0F2747]">{paper.subject_name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-[#1E5AA8] border border-blue-200">
                    {paper.session_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    <span className="font-bold text-[#172033]">{paper.exam_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    <span>{paper.start_time} - {paper.end_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Building className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    <span>{paper.room_number} &bull; {paper.building}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">
                    Attendance: <strong className="text-emerald-700">{paper.attendance_percentage.toFixed(1)}%</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Eligible
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Allocated Hall & Desk Locator */}
      {activeTab === 'seating_plan' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1E5AA8]" />
                <span>Assigned Examination Halls &amp; Desk Allocation</span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Your statutory seat assignments generated by the automated anti-malpractice seating engine.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1E5AA8] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
              Candidate Roll No: {student?.roll_number}
            </span>
          </div>

          {studentSeating.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <DoorOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-[#0F2747]">Seating Plan Under Preparation</h4>
              <p className="text-xs text-[#64748B]">
                The Controller of Examinations is finalizing the room assignments and desk matrix for this cycle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentSeating.map((seat) => (
                <div
                  key={seat.id}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1E5AA8] block">{seat.subject_code}</span>
                      <h4 className="text-sm font-bold text-[#0F2747]">{seat.subject_name}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-[#0F2747] text-white">
                      Desk: {seat.seat_number}
                    </span>
                  </div>

                  {/* Seat Coordinates & Venue Details */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Examination Venue:</span>
                      <strong className="text-slate-900 font-bold block">{seat.room_number}</strong>
                      <span className="text-[10px] text-[#64748B]">{seat.building}</span>
                    </div>

                    <div>
                      <span className="text-[#64748B] block text-[11px]">Grid Coordinates:</span>
                      <strong className="font-mono text-[#1E5AA8] text-sm block">
                        Row {seat.row_index || 1} &bull; Column {seat.col_index || 1}
                      </strong>
                      <span className="text-[10px] text-emerald-700 font-medium">Anti-Malpractice Interleaved</span>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-700 text-[11px]">
                      <span>Date: <strong>{seat.exam_date}</strong> ({seat.session_type?.toUpperCase()})</span>
                      <span>Timing: <strong>{seat.start_time} - {seat.end_time}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Please occupy your allotted seat at least 15 minutes before the exam commences.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tab 4: Continuous Assessment (CIA) & Marks View */}
      {activeTab === 'cia_marks' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F2747]">
                Continuous Internal Assessment (CIA) Breakdown &amp; Subject Grades
              </h3>
              <p className="text-xs text-[#64748B]">
                Review your mid-term test scores, assignment evaluations, quiz results, attendance weightage, and end-semester provisional grades.
              </p>
            </div>

            {studentMarks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No evaluation marks published for this examination cycle yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentMarks.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#1E5AA8] block">{m.subject_code}</span>
                        <h4 className="text-sm font-bold text-[#0F2747]">{m.subject_name}</h4>
                        <span className="text-[11px] text-slate-500">{m.subject_credits} Credits &bull; {m.subject_type?.toUpperCase()}</span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full font-bold font-mono text-xs inline-block ${
                            m.grade_letter === 'O'
                              ? 'bg-purple-100 text-purple-800'
                              : m.grade_letter === 'A+' || m.grade_letter === 'A'
                              ? 'bg-blue-100 text-blue-800'
                              : m.grade_letter === 'B+' || m.grade_letter === 'B'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.grade_letter === 'P'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Grade: {m.grade_letter} ({m.grade_point} GP)
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Status: {m.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Internal Breakdown Table */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[#0F2747] font-bold pb-1 border-b border-slate-100">
                        <span>CIA Component</span>
                        <span>Marks Awarded</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Mid-Term Test 1 (30 max)</span>
                        <span className="font-mono font-bold text-slate-900">{m.cia_breakdown.test1_marks} / 30</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Mid-Term Test 2 (30 max)</span>
                        <span className="font-mono font-bold text-slate-900">{m.cia_breakdown.test2_marks} / 30</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Academic Assignments (10 max)</span>
                        <span className="font-mono font-bold text-slate-900">{m.cia_breakdown.assignment_marks} / 10</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Seminars &amp; Quizzes (10 max)</span>
                        <span className="font-mono font-bold text-slate-900">{m.cia_breakdown.seminar_quiz_marks} / 10</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Attendance Weightage Bonus (5 max)</span>
                        <span className="font-mono font-bold text-emerald-700">{m.cia_breakdown.attendance_score} / 5</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-[#0F2747]">
                        <span>Total Internal Assessment</span>
                        <span className="font-mono text-[#1E5AA8]">{m.internal_marks} / 40</span>
                      </div>
                    </div>

                    {/* External & Total Score Card */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">External Score:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {(m.external_theory_marks || 0) + (m.external_practical_marks || 0)} / 60
                        </span>
                      </div>

                      {m.moderation_grace_marks > 0 && (
                        <div>
                          <span className="text-[10px] text-amber-700 block">Moderation Grace:</span>
                          <span className="font-mono font-bold text-amber-800">+{m.moderation_grace_marks}</span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] block">Aggregate Marks:</span>
                        <span className="font-mono text-sm font-extrabold text-[#0F2747]">
                          {m.total_marks} / 100
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Incident Report Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0F2747]">Report Examination Problem / Incident</h3>
              </div>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                aria-label="Close incident report modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you experienced a technical crash, power outage, illegible question paper, or invigilator issue during an active examination session, lodge an official docket below.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const studentId = student?.id || user?.id || 'stu-001';
                const newIncident = {
                  id: `inc-${Date.now()}`,
                  incident_number: `INC-EXAM-${Date.now().toString().slice(-6)}`,
                  student_id: studentId,
                  student_name: hallTicket?.student_name || profile?.full_name || 'Candidate',
                  roll_number: hallTicket?.roll_number || '2025-MCA-042',
                  examination_id: selectedExamId,
                  subject_name: incidentSubject || (hallTicket?.papers[0]?.subject_name) || 'Examination Paper',
                  incident_type: incidentType,
                  room_number: incidentRoom || (hallTicket?.papers[0]?.room_number) || 'Lab-102',
                  desk_number: incidentDesk || 'Desk-14',
                  description: incidentDescription,
                  status: 'lodged',
                  reported_at: new Date().toISOString(),
                };

                const updated = [newIncident, ...incidentList];
                setIncidentList(updated);
                localStorage.setItem(`itm_exam_incidents_${studentId}`, JSON.stringify(updated));
                setIsIncidentModalOpen(false);
                setIncidentDescription('');
                setIncidentSuccessMsg(`Incident #${newIncident.incident_number} registered! Transmitted to Chief Invigilator and Centre Control.`);
                setTimeout(() => setIncidentSuccessMsg(null), 8000);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Issue Category *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-700"
                >
                  <option value="Lab System / Computer Crash">Lab System / Computer Crash</option>
                  <option value="Incorrect / Missing Question Paper">Incorrect / Missing Question Paper</option>
                  <option value="Power / Network Interruption">Power / Network Interruption</option>
                  <option value="Dispute / Invigilator Query">Dispute / Invigilator Query</option>
                  <option value="Medical Emergency in Examination Hall">Medical Emergency in Examination Hall</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#0F2747] block mb-1">Room / Hall</label>
                  <input
                    type="text"
                    value={incidentRoom}
                    onChange={(e) => setIncidentRoom(e.target.value)}
                    placeholder="e.g. Lab-302"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#0F2747] block mb-1">Desk Number</label>
                  <input
                    type="text"
                    value={incidentDesk}
                    onChange={(e) => setIncidentDesk(e.target.value)}
                    placeholder="e.g. B-14"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Subject / Paper</label>
                <input
                  type="text"
                  value={incidentSubject}
                  onChange={(e) => setIncidentSubject(e.target.value)}
                  placeholder="e.g. Advanced Database Management Systems"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-[#0F2747] block mb-1">Describe Incident in Detail *</label>
                <textarea
                  required
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Explain exactly what happened, timestamps, and how it affected your examination..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Submit Official Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
