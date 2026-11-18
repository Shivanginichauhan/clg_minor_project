import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  CalendarDays,
  ListFilter,
  CheckCircle2,
  Building,
  GraduationCap,
  Layers,
  Info,
  ExternalLink
} from 'lucide-react';
import { timetableService } from '../../services/timetableService.js';
import { TimetableSlot, AcademicCalendarEvent } from '../../data/mockTimetable.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { assignmentService } from '../../services/assignmentService.js';
import { attendanceService } from '../../services/attendanceService.js';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const StudentTimetablePage: React.FC = () => {
  const { profile, user } = useAuth();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [dailySlots, setDailySlots] = useState<TimetableSlot[]>([]);
  const [monthlyEvents, setMonthlyEvents] = useState<AcademicCalendarEvent[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dueAssignments, setDueAssignments] = useState<{ [subjectCode: string]: string }>({});
  const [lowAttendanceSubjects, setLowAttendanceSubjects] = useState<{ [subjectCode: string]: number }>({});

  // Determine current day of week on mount
  useEffect(() => {
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
    if (todayIndex >= 1 && todayIndex <= 6) {
      setSelectedDay(DAYS_OF_WEEK[todayIndex - 1]);
    } else {
      setSelectedDay('Monday');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Derive semester ID from user metadata; fall back to service default when not available
        const semesterId = (user?.user_metadata?.current_semester_id as string | undefined) || 'sem-mca-2';

        // Derive the calendar month from the current real date (format: YYYY-MM)
        const now = new Date();
        const calendarMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [slots, events] = await Promise.all([
          timetableService.getSlotsBySemester(semesterId),
          timetableService.getMonthlyCalendar(calendarMonth, user?.id),
        ]);
        setAllSlots(slots);
        setMonthlyEvents(events);

        // Dynamically fetch student's upcoming assignment deadlines and low attendance subjects
        if (user?.id) {
          try {
            const [assignments, attOverview] = await Promise.all([
              assignmentService.getAssignments(user.id),
              attendanceService.getStudentAttendanceOverview(user.id),
            ]);

            const dueMap: { [code: string]: string } = {};
            const now = new Date();
            assignments.forEach((a) => {
              const diffDays = (new Date(a.due_date).getTime() - now.getTime()) / (1000 * 3600 * 24);
              if (diffDays >= -0.5 && diffDays <= 2.5 && a.status !== 'submitted' && a.status !== 'graded') {
                dueMap[a.subject_code] = a.title;
              }
            });
            setDueAssignments(dueMap);

            const lowMap: { [code: string]: number } = {};
            attOverview.subjectReports.forEach((sr) => {
              if (sr.percentage < 78) {
                lowMap[sr.subject.code] = sr.percentage;
              }
            });
            setLowAttendanceSubjects(lowMap);
          } catch (fetchErr) {
            console.error('Failed to load personalized student timetable overlays:', fetchErr);
          }
        }
      } catch (err) {
        console.error('Failed to load timetable data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const filtered = allSlots.filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase());
    setDailySlots(filtered);
  }, [selectedDay, allSlots]);

  const filteredDailySlots = dailySlots.filter((slot) => {
    if (selectedTypeFilter === 'all') return true;
    return slot.type === selectedTypeFilter;
  });

  const handlePrint = () => {
    window.print();
  };

  const getTypeBadgeClass = (type: TimetableSlot['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-50 text-[#1E5AA8] border-blue-200';
      case 'lab':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tutorial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'seminar':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getEventBadgeClass = (cat: AcademicCalendarEvent['category']) => {
    switch (cat) {
      case 'holiday':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'exam':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'deadline':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/60 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[11px] px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>Class Timetable &amp; Schedule &bull; Semester {(profile as any)?.current_semester || user?.user_metadata?.current_semester || 2} (2025-26)</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active UGC-CBCS Timetable</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Academic Lecture Timetable &amp; Schedule
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Official institutional lecture schedule for {(profile as any)?.program_name || user?.user_metadata?.program_name || 'Master of Computer Applications (MCA)'} Semester {(profile as any)?.current_semester || user?.user_metadata?.current_semester || 2}. Track daily theory lectures, hands-on lab sessions, faculty slots, and monthly university academic events.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="btn-3d-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Schedule</span>
            </button>
            <Link
              to="/student/enrollments"
              className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Course Syllabus</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar: View Mode Selector & Day Tabs */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Weekly Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly Academic Calendar</span>
            </button>
          </div>

          {/* Quick Filter by Type */}
          {viewMode === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Filter:
              </span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#1E5AA8]"
              >
                <option value="all">All Sessions ({dailySlots.length})</option>
                <option value="lecture">Lectures Only</option>
                <option value="lab">Laboratories Only</option>
                <option value="tutorial">Tutorials Only</option>
                <option value="seminar">Colloquium / Seminars</option>
              </select>
            </div>
          )}
        </div>

        {/* Day Selector Buttons (for Daily View) */}
        {viewMode === 'daily' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            {DAYS_OF_WEEK.map((day) => {
              const count = allSlots.filter((s) => s.day.toLowerCase() === day.toLowerCase()).length;
              const isSelected = selectedDay.toLowerCase() === day.toLowerCase();
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1E5AA8] text-white border-[#1E5AA8] shadow-sm'
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
                    {count} classes
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── VIEW 1: DAILY TIMELINE VIEW ── */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1E5AA8]" />
              <span>Schedule for {selectedDay}</span>
              <span className="text-xs font-normal text-slate-500 font-sans">
                ({filteredDailySlots.length} lecture &amp; lab slots scheduled)
              </span>
            </h2>
            <span className="badge-3d text-[11px] bg-blue-50 text-[#1E5AA8] border-blue-200">
              MCA Semester 2 &bull; Term 2026
            </span>
          </div>

          {filteredDailySlots.length === 0 ? (
            <div className="card-3d bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#0F2747]">No classes scheduled for {selectedDay}</h3>
              <p className="text-xs text-slate-500 mt-1">
                There are no scheduled lectures or practicals matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDailySlots.map((slot, index) => {
                const isFirstPeriod = index === 0;
                return (
                  <div
                    key={slot.id}
                    className="academic-card p-5 sm:p-6 transition group relative hover:border-[#1E5AA8] border-l-4 border-l-[#1E5AA8]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Time & Period */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-[#1E5AA8] shrink-0 shadow-2xs">
                          <span className="text-[10px] uppercase font-bold tracking-wider">Slot</span>
                          <span className="text-lg font-extrabold font-academic-display">P-{slot.period_number}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold font-mono text-[#0F2747] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#1E5AA8]" />
                              {slot.start_time} &ndash; {slot.end_time}
                            </span>
                            <span className={`badge-3d text-[10px] uppercase px-2 py-0.5 font-bold ${getTypeBadgeClass(slot.type)}`}>
                              {slot.type}
                            </span>
                            {isFirstPeriod && (
                              <span className="badge-3d text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Today&apos;s Opening Session
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">
                            <span className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 mr-2 border border-slate-200">
                              {slot.subject_code}
                            </span>
                            {slot.subject_name}
                          </h3>

                          {slot.batch && (
                            <p className="text-xs text-purple-700 font-semibold">
                              Batch: {slot.batch}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Venue & Faculty Details */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-[160px]">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3 text-[#1E5AA8]" />
                            <span>Venue / Hall</span>
                          </div>
                          <div className="text-xs font-bold text-[#0F2747]">{slot.room_number}</div>
                          <div className="text-[10px] text-slate-500 truncate">{slot.building}</div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-[180px]">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1 mb-1">
                            <User className="w-3 h-3 text-emerald-600" />
                            <span>Faculty Instructor</span>
                          </div>
                          <div className="text-xs font-bold text-[#0F2747] truncate">{slot.faculty_name}</div>
                          <div className="text-[10px] text-slate-500">Department of CSE</div>
                        </div>

                        <Link
                          to={`/student/attendance?subjectId=${slot.subject_id || slot.subject_code}`}
                          className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1 shrink-0"
                          title="View Attendance in this Subject"
                        >
                          <span>Attendance</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Slot Enhancements: Dynamic Assignment Overlay, Real Attendance Warnings & Learning Materials */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        {dueAssignments[slot.subject_code] && (
                          <Link
                            to="/student/assignments"
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>Assignment Due Soon: {dueAssignments[slot.subject_code]} &rarr;</span>
                          </Link>
                        )}
                        {lowAttendanceSubjects[slot.subject_code] !== undefined && (
                          <Link
                            to={`/student/attendance?subjectId=${slot.subject_id || slot.subject_code}`}
                            className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5"
                          >
                            <span>⚠️ Attendance {lowAttendanceSubjects[slot.subject_code].toFixed(1)}% &bull; Mandatory Lecture &rarr;</span>
                          </Link>
                        )}
                        <a
                          href={`https://meet.google.com/itm-${slot.subject_code.toLowerCase().replace(/[^a-z0-9]/g, '')}-live`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 hover:bg-sky-100 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Hybrid Live Stream</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span>Office Hours: <strong>03:00 - 05:00 PM</strong></span>
                        <Link to={`/student/materials?subject=${slot.subject_code}`} className="text-[#1E5AA8] font-bold hover:underline">
                          Class Notes &amp; Slides &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: WEEKLY MATRIX GRID ── */}
      {viewMode === 'weekly' && (
        <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Master Weekly Schedule Matrix</h2>
              <p className="text-xs text-slate-500">Comprehensive Monday to Saturday slot breakdown</p>
            </div>
            <span className="badge-3d text-xs bg-slate-100 text-slate-700">6 Days &bull; 26 Hours/Week</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4 w-28">Day</th>
                  <th className="py-3 px-3">09:00 - 10:00</th>
                  <th className="py-3 px-3">10:00 - 11:00</th>
                  <th className="py-3 px-3">11:15 - 12:15</th>
                  <th className="py-3 px-3">01:15 - 03:15</th>
                  <th className="py-3 px-3">03:30 - 04:30</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = allSlots.filter((s) => s.day.toLowerCase() === day.toLowerCase());
                  return (
                    <tr key={day} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4 font-bold text-[#0F2747] bg-slate-50/50 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1E5AA8]" />
                          <span>{day}</span>
                        </div>
                      </td>

                      {[1, 2, 3, 4, 5].map((period) => {
                        const slot = daySlots.find((s) => s.period_number === period);
                        return (
                          <td key={period} className="py-3 px-3 align-top">
                            {slot ? (
                              <div className={`p-2.5 rounded-xl border transition space-y-1 shadow-2xs ${
                                dueAssignments[slot.subject_code]
                                  ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                                  : lowAttendanceSubjects[slot.subject_code] !== undefined
                                  ? 'bg-rose-50/60 border-rose-300 hover:border-rose-500'
                                  : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-[#1E5AA8]'
                              }`}>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-bold text-[#0F2747] text-[11px] flex items-center gap-1">
                                    {slot.subject_code}
                                    {dueAssignments[slot.subject_code] && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 inline-block animate-pulse" title={`Assignment due: ${dueAssignments[slot.subject_code]}`} />
                                    )}
                                    {lowAttendanceSubjects[slot.subject_code] !== undefined && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 inline-block" title={`Attendance Alert: ${lowAttendanceSubjects[slot.subject_code]}%`} />
                                    )}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${getTypeBadgeClass(slot.type)}`}>
                                    {slot.type}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-700 truncate line-clamp-1" title={slot.subject_name}>
                                  {slot.subject_name}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                  <span className="truncate">{slot.room_number}</span>
                                  <span className="text-[9px] text-[#1E5AA8] font-medium">{slot.faculty_name.split(' ')[0]}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl border border-dashed border-slate-200 text-center text-slate-300 text-[10px]">
                                Free Slot
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: MONTHLY ACADEMIC CALENDAR ── */}
      {viewMode === 'monthly' && (
        <div className="space-y-4">
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#1E5AA8]" />
                  <span>Institutional Academic Calendar &bull; May 2026</span>
                </h2>
                <p className="text-xs text-slate-500">Official statutory exam dates, term deadlines, and university gazetted holidays</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="badge-3d text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border-rose-200">
                  ● Gazetted Holiday
                </span>
                <span className="badge-3d text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                  ● Examination
                </span>
                <span className="badge-3d text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                  ● Academic Deadline
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {monthlyEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#1E5AA8] transition space-y-2 group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-[#0F2747] font-bold shadow-2xs">
                        <span className="text-[9px] uppercase font-bold text-[#1E5AA8]">{evt.day.slice(0, 3)}</span>
                        <span className="text-base font-mono font-extrabold">{evt.date.slice(-2)}</span>
                      </div>
                      <div>
                        <span className={`badge-3d text-[9px] uppercase px-1.5 py-0.2 font-bold ${getEventBadgeClass(evt.category)}`}>
                          {evt.category}
                        </span>
                        <h4 className="text-sm font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition mt-0.5">
                          {evt.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 pl-14">
                    {evt.description}
                  </p>

                  {(evt.time || evt.venue) && (
                    <div className="pl-14 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      {evt.time && <span>⏰ {evt.time}</span>}
                      {evt.venue && <span>📍 {evt.venue}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Helpful Student Advisory Note */}
      <div className="card-3d bg-blue-50/50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#1E5AA8] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#0F2747]">Notice regarding Lecture Regularity:</span> As per UGC-CBCS University Examination Regulations, a minimum of 75% lecture and laboratory attendance is mandatory in each subject to be eligible to apply for end-semester examinations. Check your ongoing attendance in the{' '}
          <Link to="/student/attendance" className="text-[#1E5AA8] underline font-bold hover:text-blue-800">
            Attendance Ledger Desk &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
