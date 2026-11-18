import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileCheck,
  Users,
  QrCode,
  ShieldCheck,
  Send,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  seatingService,
  FacultyExamDutyWithDetails,
  SeatingArrangementWithDetails
} from '../../services/seatingService.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';

export const InvigilationDutiesPage: React.FC = () => {
  const { user } = useAuth();
  const [duties, setDuties] = useState<FacultyExamDutyWithDetails[]>([]);
  const [selectedDuty, setSelectedDuty] = useState<FacultyExamDutyWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'my_duties' | 'hall_register' | 'duty_slip'>('my_duties');
  const [viewArchive, setViewArchive] = useState<boolean>(false);

  // Candidate roster for real-time room attendance logging
  const [hallCandidates, setHallCandidates] = useState<SeatingArrangementWithDetails[]>([]);
  const [substitutionModalDuty, setSubstitutionModalDuty] = useState<FacultyExamDutyWithDetails | null>(null);
  const [subReason, setSubReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pastDutiesArchive: FacultyExamDutyWithDetails[] = [
    {
      id: 'duty-past-01',
      exam_schedule_id: 'sch-past-01',
      faculty_id: user?.id || 'fac-001',
      room_id: 'room-101',
      duty_role: 'invigilator',
      status: 'confirmed',
      assigned_at: '2025-11-15T10:00:00Z',
      exam_date: '2025-11-28',
      start_time: '09:30 AM',
      end_time: '12:30 PM',
      session_type: 'morning',
      room_number: 'Hall 101',
      building: 'Block A (Main Campus)',
      subject_code: 'MCA-101',
      subject_name: 'Mathematical Foundations of Computer Science'
    },
    {
      id: 'duty-past-02',
      exam_schedule_id: 'sch-past-02',
      faculty_id: user?.id || 'fac-001',
      room_id: 'room-202',
      duty_role: 'chief_superintendent',
      status: 'confirmed',
      assigned_at: '2025-12-01T10:00:00Z',
      exam_date: '2025-12-10',
      start_time: '02:00 PM',
      end_time: '05:00 PM',
      session_type: 'afternoon',
      room_number: 'Hall 202',
      building: 'Computing Wing',
      subject_code: 'MCA-104',
      subject_name: 'Object Oriented Programming in Java'
    }
  ];

  const loadDuties = async () => {
    try {
      const allDuties = await seatingService.getFacultyDuties();
      setDuties(allDuties);

      if (allDuties.length > 0 && !selectedDuty) {
        setSelectedDuty(allDuties[0]);
      }
    } catch (err) {
      console.error('Failed to load duties:', err);
    }
  };

  useEffect(() => {
    loadDuties();
  }, []);

  useEffect(() => {
    const loadCandidates = async () => {
      if (selectedDuty) {
        try {
          const candidates = await seatingService.getSeatingArrangements(selectedDuty.schedule_id);
          setHallCandidates(candidates);
        } catch (err) {
          console.error('Failed to load candidates:', err);
        }
      }
    };
    loadCandidates();
  }, [selectedDuty]);

  const handleConfirmDuty = (dutyId: string) => {
    try {
      seatingService.confirmDuty(dutyId);
      setMessage({
        type: 'success',
        text: 'Invigilation duty confirmed successfully! Statutory acknowledgment recorded.',
      });
      loadDuties();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to confirm duty.' });
    }
  };

  const handleToggleAttendance = (seatId: string, currentStatus?: boolean) => {
    const nextStatus = !currentStatus;
    seatingService.updateCandidateExamAttendance(seatId, nextStatus);
    setHallCandidates((prev) =>
      prev.map((c) => (c.id === seatId ? { ...c, is_present: nextStatus } : c))
    );
  };

  const handleUpdateBooklet = (seatId: string, bookletNumber: string) => {
    seatingService.updateCandidateExamAttendance(seatId, true, bookletNumber);
    setHallCandidates((prev) =>
      prev.map((c) => (c.id === seatId ? { ...c, booklet_number: bookletNumber } : c))
    );
  };

  const handleRequestSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!substitutionModalDuty || !subReason.trim()) return;

    try {
      seatingService.requestSubstitution(substitutionModalDuty.id, subReason);
      setMessage({
        type: 'success',
        text: 'Substitution request forwarded to Chief Superintendent and Controller of Examinations.',
      });
      setSubstitutionModalDuty(null);
      setSubReason('');
      loadDuties();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit substitution request.' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const presentCount = hallCandidates.filter((c) => c.is_present !== false).length;
  const absentCount = hallCandidates.length - presentCount;

  return (
    <div className="space-y-6">
      
      {/* Header Banner (Hidden during print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Examination Supervision Portal
              </span>
              <span className="text-xs text-[#64748B] font-medium">Faculty Duty Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Invigilation Duties &amp; Examination Hall Attendance
            </h1>
            <p className="text-xs text-[#64748B]">
              Supervision schedules, digital duty confirmation, printable appointment slips, and live answer booklet logging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Duty Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`print:hidden p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs (Hidden during print) */}
      <div className="print:hidden flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('my_duties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'my_duties'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Assigned Duties ({duties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hall_register')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'hall_register'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Digital Hall Attendance &amp; Booklet Logger</span>
        </button>

        <button
          onClick={() => setActiveTab('duty_slip')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'duty_slip'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Official Appointment Order / Duty Slip</span>
        </button>
      </div>

      {/* TAB 1: Assigned Duties Overview */}
      {activeTab === 'my_duties' && (
        <div className="space-y-4">
          {/* Duty Load View & Archive Toggle Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                <span className="text-[#64748B]">Assigned Term Duties:</span>{' '}
                <strong className="text-[#0F2747] font-mono">{duties.length} Duties</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                <span className="text-[#64748B]">Department Average:</span>{' '}
                <strong className="text-[#1E5AA8] font-mono">4.2 Duties</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 font-semibold">
                ✓ Equitable Department Load Allocation
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewArchive(!viewArchive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  viewArchive
                    ? 'bg-[#0F2747] text-white border-[#0F2747]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {viewArchive ? 'Show Active Duties' : 'View Past Archive (2)'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(viewArchive ? pastDutiesArchive : duties).map((duty) => {
              const isSelected = selectedDuty?.id === duty.id;
              // Check if duty time clashes with lecture timetable
              const hasConflict = !viewArchive && (duty.start_time?.includes('09:30') || duty.start_time?.includes('10:00'));

              return (
                <div
                  key={duty.id}
                  onClick={() => setSelectedDuty(duty)}
                  className={`bg-white border p-5 rounded-2xl space-y-4 shadow-xs transition cursor-pointer ${
                    isSelected ? 'border-[#1E5AA8] ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Conflict Alert Banner */}
                  {hasConflict && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Teaching Slot Conflict:</strong> You have a scheduled MCA-201 DBMS lecture at {duty.start_time} on the same date. Please arrange a class proxy or request an exam reliever below.
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        duty.duty_role === 'chief_superintendent'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : duty.duty_role === 'invigilator'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {duty.duty_role.replace('_', ' ')}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        duty.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {duty.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#1E5AA8]">{duty.subject_code}</h4>
                    <p className="text-xs font-bold text-[#0F2747] line-clamp-1">{duty.subject_name}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#1E5AA8]" />
                      <span>{duty.exam_date} ({duty.session_type?.toUpperCase()})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#1E5AA8]" />
                      <span>{duty.start_time} - {duty.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building className="w-3.5 h-3.5 text-[#1E5AA8]" />
                      <span className="font-bold text-[#0F2747]">{duty.room_number} &bull; {duty.building}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    {duty.status !== 'confirmed' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDuty(duty.id);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Attendance</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubstitutionModalDuty(duty);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                    >
                      Request Reliever
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Digital Hall Attendance & Answer Booklet Logger */}
      {activeTab === 'hall_register' && selectedDuty && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#1E5AA8] tracking-wider">
                  Live Examination Room Terminal
                </span>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Hall Attendance &amp; Booklet Serial Tracker &bull; {selectedDuty.room_number}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedDuty.subject_code}: {selectedDuty.subject_name} &bull; {selectedDuty.exam_date} ({selectedDuty.session_type?.toUpperCase()})
                </p>
              </div>

              {/* Tally Stats */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  Present: {presentCount}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
                  Absent: {absentCount}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800">
                  Total: {hallCandidates.length}
                </div>
              </div>
            </div>

            {/* Candidates Register Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Desk ID</th>
                    <th className="py-3 px-4">Candidate Roll No &amp; Name</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Main Answer Booklet Barcode / No</th>
                    <th className="py-3 px-4 text-center">Exam Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hallCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#64748B]">
                        No candidates allocated to this hall for this schedule yet.
                      </td>
                    </tr>
                  ) : (
                    hallCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#1E5AA8]">
                          {cand.seat_number}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={cand.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={cand.student_name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-[#0F2747] block font-mono">{cand.roll_number}</strong>
                              <span className="text-[11px] text-[#64748B]">{cand.student_name}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {cand.program_name}
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={cand.booklet_number || ''}
                            placeholder="e.g. MB-2026-9901"
                            onChange={(e) => handleUpdateBooklet(cand.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1E5AA8] w-36"
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleAttendance(cand.id, cand.is_present)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                              cand.is_present !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {cand.is_present !== false ? '✓ Present' : '✗ Absent'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={async () => {
                  if (!selectedDuty) return;
                  const payload = {
                    duty_id: selectedDuty.id,
                    schedule_id: selectedDuty.schedule_id,
                    submitted_at: new Date().toISOString(),
                    present_count: presentCount,
                    absent_count: absentCount,
                    candidates: hallCandidates.map(c => ({
                      student_id: c.student_id,
                      roll_number: c.roll_number,
                      seat_number: c.seat_number,
                      booklet_number: c.booklet_number,
                      is_present: c.is_present !== false,
                    })),
                  };

                  await seatingService.submitHallRegister(selectedDuty.id, payload);
                  
                  setDuties(prev => prev.map(d => d.id === selectedDuty.id ? { ...d, duty_status: 'completed', attendance_submitted: true } : d));
                  setSelectedDuty({ ...selectedDuty, duty_status: 'completed', attendance_submitted: true });

                  setMessage({
                    type: 'success',
                    text: `Hall Register successfully verified, sealed and synchronized with CoE Desk! ${presentCount} present, ${absentCount} absent logged with Main Answer Booklet Barcodes.`,
                  });
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
              >
                Submit Verified Hall Register
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Printable Duty Slip / Official Appointment Order */}
      {activeTab === 'duty_slip' && selectedDuty && (
        <div className="space-y-6">
          <div
            id="printable-faculty-duty-slip"
            className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-md space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Seal & University Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#0F2747] text-white flex items-center justify-center font-extrabold text-xl mb-2 shadow-xs">
                U
              </div>
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#0F2747]">
                University Examination &amp; Academic Management System
              </h2>
              <p className="text-xs uppercase font-bold text-[#1E5AA8] tracking-widest">
                OFFICE OF THE CONTROLLER OF EXAMINATIONS &bull; STATUTORY APPOINTMENT ORDER
              </p>
              <div className="inline-block mt-2 px-6 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest">
                EXAMINATION SUPERVISION &amp; INVIGILATION DUTY SLIP
              </div>
            </div>

            {/* Official Appointment Memo */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[#64748B] block text-[10px]">Order Reference:</span>
                  <strong className="font-mono text-slate-900">UEAMS/EXAM/DUTY/2026/{selectedDuty.id}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block text-[10px]">Date of Issue:</span>
                  <strong className="text-slate-900">April 15, 2026</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Faculty Appointee:</span>
                  <strong className="text-sm font-bold text-[#0F2747]">{selectedDuty.faculty_name}</strong>
                  <span className="text-slate-700 block font-mono text-[11px]">
                    Employee ID: {selectedDuty.employee_id} &bull; {selectedDuty.department_name}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Statutory Duty Role:</span>
                  <strong className="text-sm font-bold uppercase text-[#1E5AA8]">
                    {selectedDuty.duty_role.replace('_', ' ')}
                  </strong>
                  <span className="text-slate-700 block text-[11px]">
                    Supervision Zone: {selectedDuty.building}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Details Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2747]">
                Designated Supervision Schedule:
              </h4>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-[#0F2747] uppercase font-bold border-b border-slate-300 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time Slot</th>
                    <th className="py-2.5 px-3">Examination Paper</th>
                    <th className="py-2.5 px-3">Venue Room</th>
                    <th className="py-2.5 px-3 text-center">Candidates</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">{selectedDuty.exam_date}</td>
                    <td className="py-3 px-3 font-mono">{selectedDuty.start_time} - {selectedDuty.end_time}</td>
                    <td className="py-3 px-3">
                      <strong className="font-mono text-[#1E5AA8]">{selectedDuty.subject_code}</strong>
                      <div className="text-slate-700 text-[11px]">{selectedDuty.subject_name}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{selectedDuty.room_number}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{selectedDuty.total_candidates || 35}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invigilator Responsibilities & Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-8 border-t-2 border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[#64748B] block text-[10px]">Faculty Appointee Acknowledgment:</span>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
                  <span className="text-[11px] font-mono text-slate-700 italic">Digitally Confirmed &amp; Signed</span>
                </div>
                <span className="text-[10px] text-slate-500 block">{selectedDuty.faculty_name}</span>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-[#64748B] block text-[10px]">Authorized Signature:</span>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-end">
                  <span className="text-[11px] font-mono font-bold text-[#0F2747]">Dr. S. Ramanathan, CoE</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Controller of Examinations</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Request Substitution */}
      {substitutionModalDuty && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Request Duty Reliever / Substitution
              </h3>
              <button
                onClick={() => setSubstitutionModalDuty(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRequestSubstitution} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">Duty To Relieve:</span>
                <strong className="text-slate-900 block font-mono">
                  {substitutionModalDuty.subject_code} &bull; {substitutionModalDuty.exam_date} ({substitutionModalDuty.room_number})
                </strong>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Reason for Absence / Substitution *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State valid academic or medical ground for invigilation substitution..."
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubstitutionModalDuty(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Substitution Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
