import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  Users,
  Sparkles,
  Award,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  X,
  FileText,
  Check,
  Info
} from 'lucide-react';
import { timetableService } from '../../services/timetableService.js';
import { TimetableSlot } from '../../data/mockTimetable.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Link } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface AvailableFaculty {
  id: string;
  name: string;
  department: string;
  designation: string;
  isAvailable: boolean;
  conflictReason?: string;
}

export const FacultyTimetablePage: React.FC = () => {
  const { profile, user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [facultySlots, setFacultySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Substitute modal state
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [activeSlotForProxy, setActiveSlotForProxy] = useState<TimetableSlot | null>(null);
  const [availableFacultyList, setAvailableFacultyList] = useState<AvailableFaculty[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Form fields for proxy
  const [proxyDate, setProxyDate] = useState<string>('');
  const [proxyReason, setProxyReason] = useState<string>('Casual Leave (CL)');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [proxyNotes, setProxyNotes] = useState<string>('');
  const [submittingProxy, setSubmittingProxy] = useState(false);
  const [proxyFeedback, setProxyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Set today on mount
  useEffect(() => {
    const todayIndex = new Date().getDay();
    if (todayIndex >= 1 && todayIndex <= 6) {
      setSelectedDay(DAYS[todayIndex - 1]);
    } else {
      setSelectedDay('Monday');
    }
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const facultyName = profile?.full_name || '';
      const all = await timetableService.getAllSlots();
      // Match by faculty id or full name, or show all for admin/dean
      const mySlots = all.filter((s) => {
        if (!user) return false;
        if (user.role === 'administrator' || user.role === 'dean') return true;
        return (
          s.faculty_id === user.id ||
          s.faculty_id === profile?.id ||
          (facultyName && s.faculty_name.toLowerCase().includes(facultyName.toLowerCase()))
        );
      });
      setFacultySlots(mySlots);
    } catch (err) {
      console.error('Failed to load faculty schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [profile]);

  const openProxyModal = async (slot: TimetableSlot) => {
    setActiveSlotForProxy(slot);
    // Set default date to next occurrence or today
    const today = new Date().toISOString().split('T')[0];
    setProxyDate(today);
    setProxyReason('Casual Leave (CL)');
    setSelectedFacultyId('');
    setProxyNotes(`Please cover the ongoing syllabus unit for ${slot.subject_code} and supervise practical exercises.`);
    setProxyModalOpen(true);
    setLoadingFaculty(true);

    try {
      const facList = await timetableService.getFacultyAvailabilityForSlot(
        slot.day,
        slot.period_number,
        slot.faculty_id
      );
      setAvailableFacultyList(facList);
      // Auto-select first available faculty
      const firstFree = facList.find((f) => f.isAvailable);
      if (firstFree) {
        setSelectedFacultyId(firstFree.id);
      }
    } catch (e) {
      console.error('Failed to load available faculty:', e);
    } finally {
      setLoadingFaculty(false);
    }
  };

  const handleConfirmProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlotForProxy) return;

    const chosenFaculty = availableFacultyList.find((f) => f.id === selectedFacultyId);
    if (!chosenFaculty) {
      alert('Please select a free faculty member to assign the proxy lecture.');
      return;
    }

    setSubmittingProxy(true);
    try {
      await timetableService.assignSubstitute(activeSlotForProxy.id, {
        facultyId: chosenFaculty.id,
        facultyName: chosenFaculty.name,
        date: proxyDate || new Date().toISOString().split('T')[0],
        reason: proxyReason,
        notes: proxyNotes,
      });

      await loadSchedule();
      setProxyModalOpen(false);
      setProxyFeedback({
        type: 'success',
        message: `Proxy successfully scheduled: ${chosenFaculty.name} will handle ${activeSlotForProxy.subject_code} on ${proxyDate || 'selected date'}!`,
      });
      setTimeout(() => setProxyFeedback(null), 6000);
    } catch (err: any) {
      console.error('Failed to assign proxy:', err);
      alert('Error arranging proxy: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmittingProxy(false);
    }
  };

  const handleRevokeProxy = async (slotId: string, subjectCode: string) => {
    if (!window.confirm(`Revoke proxy arrangement for ${subjectCode} and resume your scheduled lecture?`)) {
      return;
    }
    try {
      await timetableService.revokeSubstitute(slotId);
      await loadSchedule();
      setProxyFeedback({
        type: 'success',
        message: `Proxy revoked. You are re-instated as the active instructor for ${subjectCode}.`,
      });
      setTimeout(() => setProxyFeedback(null), 5000);
    } catch (err: any) {
      console.error('Failed to revoke proxy:', err);
      alert('Error revoking proxy: ' + err.message);
    }
  };

  const daySchedule = facultySlots
    .filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase())
    .sort((a, b) => a.period_number - b.period_number);

  const totalWeeklyTeachingHours = facultySlots.length * 1.5;
  const activeProxiesCount = facultySlots.filter((s) => s.substitute_status === 'arranged').length;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {proxyFeedback && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold">{proxyFeedback.message}</span>
          </div>
          <button
            onClick={() => setProxyFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Faculty Hero Banner */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-900/50 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-3d text-[11px] px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Faculty Teaching Timetable &bull; Lecture Schedule</span>
              </span>
              <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Department of Computer Science &bull; AY 2025-26</span>
              </span>
              {activeProxiesCount > 0 && (
                <span className="badge-3d text-[11px] px-3 py-1 bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 font-bold">
                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>{activeProxiesCount} Substitute / Proxy Arranged</span>
                </span>
              )}
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Instructor Teaching Schedule &amp; Lecture Roster
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Personalized instructional timetable for {profile?.full_name || 'Prof. Priya Nambiar'}. Access scheduled class halls, take instantaneous lecture attendance, and arrange substitute proxy faculty during planned leave or holidays.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[150px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Weekly Teaching Load</span>
              <div className="text-xl font-academic-display font-extrabold text-white mt-0.5">
                {facultySlots.length} Classes
              </div>
              <span className="text-[9px] text-emerald-300 font-semibold block mt-1">
                ~{totalWeeklyTeachingHours} Contact Hours
              </span>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector & Quick Actions */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DAYS.map((day) => {
              const count = facultySlots.filter((s) => s.day.toLowerCase() === day.toLowerCase()).length;
              const hasProxy = facultySlots.some(
                (s) => s.day.toLowerCase() === day.toLowerCase() && s.substitute_status === 'arranged'
              );
              const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                  {hasProxy && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Has proxy assigned" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/faculty/attendance"
              className="btn-3d-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Open Attendance Register</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Teaching Schedule for Selected Day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Assigned Teaching Sessions for {selectedDay}</span>
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({daySchedule.length} sessions)
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Regular Slot
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Proxy Assigned
            </span>
          </div>
        </div>

        {daySchedule.length === 0 ? (
          <div className="card-3d bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0F2747]">No Teaching Sessions Assigned on {selectedDay}</h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any lecture or lab classes scheduled on this day. Use this time for research, office hours, or evaluation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {daySchedule.map((slot) => {
              const hasProxy = slot.substitute_status === 'arranged';

              return (
                <div
                  key={slot.id}
                  className={`academic-card p-5 sm:p-6 transition group relative ${
                    hasProxy
                      ? 'border-2 border-amber-400 bg-amber-50/20'
                      : 'hover:border-emerald-600 border-l-4 border-l-emerald-600'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-2xs ${
                          hasProxy
                            ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">Slot</span>
                        <span className="text-lg font-extrabold font-academic-display">P-{slot.period_number}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold font-mono text-[#0F2747] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {slot.start_time} &ndash; {slot.end_time}
                          </span>
                          <span className="badge-3d text-[10px] uppercase px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200 font-bold">
                            {slot.type}
                          </span>
                          <span className="badge-3d text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700">
                            MCA Sem 2 (Batch 2025-26)
                          </span>
                          {hasProxy && (
                            <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 text-amber-700" />
                              <span>Proxy Active</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-[#0F2747] group-hover:text-emerald-700 transition">
                          <span className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 mr-2 border border-slate-200">
                            {slot.subject_code}
                          </span>
                          {slot.subject_name}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {slot.room_number}, {slot.building}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            60 Enrolled Scholars
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      {hasProxy ? (
                        <button
                          onClick={() => handleRevokeProxy(slot.id, slot.subject_code)}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Revoke Proxy</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openProxyModal(slot)}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="If on leave/holiday, reassign lecture to a free colleague"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                          <span>Arrange Proxy / Substitute</span>
                        </button>
                      )}

                      <Link
                        to="/faculty/attendance"
                        className="btn-3d-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Attendance &rarr;</span>
                      </Link>

                      <Link
                        to="/faculty/marks"
                        className="btn-3d-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>CIA</span>
                      </Link>
                    </div>
                  </div>

                  {/* Active Proxy Details Box */}
                  {hasProxy && (
                    <div className="mt-4 pt-3.5 border-t border-amber-200/80 bg-amber-50/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Substitute Faculty: <span className="underline decoration-amber-400">{slot.substitute_faculty_name}</span></span>
                          <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                            Date: {slot.substitute_date || 'Upcoming'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Leave Reason: <span className="font-semibold">{slot.substitute_reason}</span> &bull; Instructions: {slot.substitute_notes || 'Handed over ongoing unit'}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg shrink-0">
                        ✓ Faculty Accepted Duty
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Substitute / Proxy Assignment Modal */}
      {proxyModalOpen && activeSlotForProxy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-amber-50 text-amber-800 border-amber-200 font-bold flex items-center gap-1.5 w-fit">
                  <RefreshCw className="w-3 h-3 text-amber-600" />
                  Leave Adjustment &bull; Substitute Faculty Proxy
                </span>
                <h3 className="font-academic-serif text-lg font-bold text-[#0F2747] mt-1.5">
                  Arrange Lecture Proxy for {activeSlotForProxy.subject_code}
                </h3>
                <p className="text-xs text-slate-500">
                  Slot P-{activeSlotForProxy.period_number} &bull; {activeSlotForProxy.day} ({activeSlotForProxy.start_time} - {activeSlotForProxy.end_time}) &bull; {activeSlotForProxy.room_number}
                </p>
              </div>
              <button
                onClick={() => setProxyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmProxy} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Absence / Holiday <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={proxyDate}
                    onChange={(e) => setProxyDate(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Absence <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={proxyReason}
                    onChange={(e) => setProxyReason(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-white text-slate-900"
                  >
                    <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                    <option value="Academic / Conference Duty (OD)">Academic / Conference Duty (OD)</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Official University Deputation">Official University Deputation</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                  </select>
                </div>
              </div>

              {/* Handover lesson notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic / Handover Instructions for Proxy Faculty
                </label>
                <textarea
                  rows={2}
                  value={proxyNotes}
                  onChange={(e) => setProxyNotes(e.target.value)}
                  placeholder="e.g. Please conduct Chapter 4 practical problem set and verify lab submissions..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-white text-slate-900 resize-none"
                />
              </div>

              {/* Auto-detected Free Department Faculty */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Available Faculty in Department (Slot Period {activeSlotForProxy.period_number})
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    Clash-Free Auto Detection
                  </span>
                </div>

                {loadingFaculty ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-600" />
                    Checking department faculty timetables for clashes...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {availableFacultyList.map((fac) => {
                      const isSelected = selectedFacultyId === fac.id;
                      return (
                        <label
                          key={fac.id}
                          className={`flex items-start justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                            !fac.isAvailable
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50/80 border-emerald-600 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="selectedFaculty"
                              disabled={!fac.isAvailable}
                              checked={isSelected}
                              onChange={() => setSelectedFacultyId(fac.id)}
                              className="mt-0.5 text-emerald-600 focus:ring-emerald-600"
                            />
                            <div>
                              <div className="font-bold text-[#0F2747] flex items-center gap-1.5">
                                <span>{fac.name}</span>
                                <span className="text-[10px] font-normal text-slate-500">({fac.designation})</span>
                              </div>
                              <p className="text-[11px] text-slate-500">{fac.department}</p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {fac.isAvailable ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Free this Slot
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Busy (Class Clashing)
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Once confirmed, an automated substitute intimation will be delivered to the appointed faculty, and the Department HOD will be notified. Attendance taking rights for this slot will be transferred for the designated date.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProxyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProxy || !selectedFacultyId}
                  className="btn-3d-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingProxy ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Arranging Proxy...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Proxy Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
