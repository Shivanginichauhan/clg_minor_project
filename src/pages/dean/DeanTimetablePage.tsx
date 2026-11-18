import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  MapPin,
  User,
  ShieldCheck,
  Printer,
  Sparkles,
  BookOpen,
  Filter,
  Users,
  Shield,
  X,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  ChevronRight,
  Flame,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { timetableService } from '../../services/timetableService.js';
import { deanService } from '../../services/deanService.js';
import { examService, ExamScheduleWithDetails } from '../../services/examService.js';
import { TimetableSlot } from '../../data/mockTimetable.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export interface ClashRecord {
  id: string;
  type: 'cohort' | 'room' | 'faculty' | 'capacity' | 'cohort_gap';
  title: string;
  message: string;
  severity: 'critical' | 'warning';
  cohort?: string;
  entities: string;
  resolution: string;
  slotIds: string[];
}

export const DeanTimetablePage: React.FC = () => {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamScheduleWithDetails[]>([]);
  const [viewMode, setViewMode] = useState<'academic' | 'exams'>('academic');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedClashFilter, setSelectedClashFilter] = useState<'ALL' | 'cohort' | 'room' | 'faculty' | 'cohort_gap'>('ALL');

  const [ratified, setRatified] = useState(false);
  const [ratifiedInfo, setRatifiedInfo] = useState<{ officer: string; timestamp: string; seal: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRatifyModalOpen, setIsRatifyModalOpen] = useState(false);
  const [deanPin, setDeanPin] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isWorkloadInspectorOpen, setIsWorkloadInspectorOpen] = useState(false);
  const [workloadAnomalyFilter, setWorkloadAnomalyFilter] = useState<'ALL' | 'overloaded' | 'fatigue' | 'underutilized'>('ALL');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [allSlots, allExamSchedules] = await Promise.all([
          timetableService.getAllSlots(),
          examService.getSchedules()
        ]);
        setSlots(allSlots);
        setExamSchedules(allExamSchedules);

        const stored = localStorage.getItem('ueams_dean_timetable_ratified');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRatified(true);
          setRatifiedInfo({
            officer: parsed.officer || 'Dean of Academic Affairs',
            timestamp: parsed.ratified_at || new Date().toISOString(),
            seal: parsed.seal || 'DEAN-TIMETABLE-SEAL-VERIFIED'
          });
        }
      } catch (err) {
        console.error('Failed to load slots for Dean:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // COMPREHENSIVE MULTI-DIMENSIONAL CLASH ENGINE
  // (Room + Faculty + Capacity + Cross-Department Cohort Clashes + 0-Gap Alerts)
  // ─────────────────────────────────────────────────────────────
  const clashes = useMemo<ClashRecord[]>(() => {
    const list: ClashRecord[] = [];

    // Room capacity lookup table
    const roomCapacities: Record<string, number> = {
      'Hall 204': 60,
      'Hall 205': 60,
      'Hall 206': 60,
      'Lab 3': 35,
      'Lab 4': 35,
      'Auditorium': 250,
      'Seminar Room 1': 45
    };

    // Helper to derive normalized Cohort Key
    const getCohortKey = (slot: TimetableSlot): string => {
      if (slot.program_id && slot.semester_number) {
        return `${slot.program_id}_sem${slot.semester_number}`;
      }
      const prefix = slot.subject_code ? slot.subject_code.split('-')[0].trim().toUpperCase() : 'UNKNOWN';
      const sem = slot.semester_number || 2;
      return `${prefix}_sem${sem}`;
    };

    const getCohortLabel = (slot: TimetableSlot): string => {
      const prefix = slot.subject_code ? slot.subject_code.split('-')[0].trim().toUpperCase() : 'Program';
      const sem = slot.semester_number || 2;
      return `${prefix} Semester ${sem}`;
    };

    // ── 1. ACADEMIC SLOTS AUDIT ──
    for (let i = 0; i < slots.length; i++) {
      const a = slots[i];

      // Capacity Risk Check
      const cap = roomCapacities[a.room_number] || 50;
      if (a.type === 'lecture' && cap < 40) {
        list.push({
          id: `cap-${a.id}`,
          type: 'capacity',
          title: `Hall Capacity Bottleneck`,
          message: `${a.room_number} (Seating Capacity: ${cap}) allocated for core lecture ${a.subject_code}. Estimated student cohort size exceeds 50.`,
          severity: 'warning',
          cohort: getCohortLabel(a),
          entities: `${a.room_number} &bull; ${a.subject_code}`,
          resolution: 'Reallocate to a 60+ capacity hall (e.g. Hall 204 or Auditorium).',
          slotIds: [a.id]
        });
      }

      // Pairwise checks across all remaining slots
      for (let j = i + 1; j < slots.length; j++) {
        const b = slots[j];

        // Only compare slots on the same day and overlapping period
        if (a.day.toLowerCase() === b.day.toLowerCase() && a.period_number === b.period_number) {
          // A) Room Double-Booking
          if (a.room_number === b.room_number) {
            list.push({
              id: `room-${a.id}-${b.id}`,
              type: 'room',
              title: `Double-Booked Lecture Hall`,
              message: `${a.room_number} is scheduled simultaneously for ${a.subject_code} (${a.subject_name}) and ${b.subject_code} (${b.subject_name}) on ${a.day} Period ${a.period_number}.`,
              severity: 'critical',
              entities: `${a.room_number} on ${a.day} P-${a.period_number}`,
              resolution: 'Assign one of the courses to an alternate open room.',
              slotIds: [a.id, b.id]
            });
          }

          // B) Faculty Concurrent Clash
          if (a.faculty_id && b.faculty_id && a.faculty_id === b.faculty_id) {
            list.push({
              id: `fac-${a.id}-${b.id}`,
              type: 'faculty',
              title: `Faculty Concurrent Conflict`,
              message: `Instructor ${a.faculty_name} is assigned simultaneously to teach ${a.subject_code} (in ${a.room_number}) and ${b.subject_code} (in ${b.room_number}) on ${a.day} Period ${a.period_number}.`,
              severity: 'critical',
              entities: `${a.faculty_name} (${a.day} P-${a.period_number})`,
              resolution: 'Reassign teaching hours or appoint co-instructor / teaching proxy.',
              slotIds: [a.id, b.id]
            });
          }

          // C) CROSS-DEPARTMENT COHORT CLASH (Same cohort double-booked in different rooms!)
          const cohortA = getCohortKey(a);
          const cohortB = getCohortKey(b);
          if (cohortA === cohortB) {
            // Check batch segregation: if both slots specify distinct non-overlapping batches (e.g. Lab Batch A vs Batch B), permitted.
            const isBatchSegregated =
              a.batch &&
              b.batch &&
              a.batch.toLowerCase() !== b.batch.toLowerCase() &&
              a.batch.toLowerCase() !== 'all' &&
              b.batch.toLowerCase() !== 'all';

            if (!isBatchSegregated) {
              list.push({
                id: `cohort-${a.id}-${b.id}`,
                type: 'cohort',
                title: `Cross-Department Cohort Clash`,
                message: `Students in ${getCohortLabel(a)} are scheduled simultaneously for ${a.subject_code} (${a.room_number}) and ${b.subject_code} (${b.room_number}) on ${a.day} Period ${a.period_number}. Students cannot attend both classes!`,
                severity: 'critical',
                cohort: getCohortLabel(a),
                entities: `${getCohortLabel(a)} (${a.subject_code} in ${a.room_number} vs ${b.subject_code} in ${b.room_number})`,
                resolution: `Reschedule one of the subject slots to a vacant period on ${a.day} or another weekday.`,
                slotIds: [a.id, b.id]
              });
            }
          }
        }
      }
    }

    // ── 2. CONSECUTIVE INSTRUCTIONAL STRETCHES (COHORT FATIGUE) ──
    const cohortDaySlots: Record<string, number[]> = {};
    slots.forEach((s) => {
      const key = `${getCohortKey(s)}_${s.day}`;
      if (!cohortDaySlots[key]) cohortDaySlots[key] = [];
      cohortDaySlots[key].push(s.period_number);
    });

    Object.entries(cohortDaySlots).forEach(([key, periods]) => {
      periods.sort((x, y) => x - y);
      let consecutive = 1;
      let maxConsecutive = 1;
      for (let k = 0; k < periods.length - 1; k++) {
        if (periods[k + 1] === periods[k] + 1) {
          consecutive++;
          if (consecutive > maxConsecutive) maxConsecutive = consecutive;
        } else {
          consecutive = 1;
        }
      }
      if (maxConsecutive >= 5) {
        const [cKey, day] = key.split('_');
        const cohortReadable = cKey.replace('_sem', ' Semester ').toUpperCase();
        list.push({
          id: `fatigue-${key}`,
          type: 'cohort_gap',
          title: `Strenuous Continuous Lecture Stretch`,
          message: `${cohortReadable} has ${maxConsecutive} consecutive back-to-back periods on ${day} with zero instructional recess, violating statutory student break norms.`,
          severity: 'warning',
          cohort: cohortReadable,
          entities: `${cohortReadable} on ${day}`,
          resolution: 'Insert a 1-hour recess/lunch break or self-study library slot between periods 3 and 4.',
          slotIds: []
        });
      }
    });

    // ── 3. EXAMINATION COHORT CLASHES & 0-DAY PREP GAPS (FROM EXAM SERVICE) ──
    if (examSchedules.length > 0) {
      const sortedExams = [...examSchedules].sort(
        (x, y) => new Date(x.exam_date).getTime() - new Date(y.exam_date).getTime()
      );

      for (let m = 0; m < sortedExams.length; m++) {
        const exA = sortedExams[m];
        for (let n = m + 1; n < sortedExams.length; n++) {
          const exB = sortedExams[n];
          const isSameCohort =
            exA.program_name === exB.program_name &&
            (exA.semester_number === exB.semester_number || exA.subject?.semester_id === exB.subject?.semester_id);

          if (isSameCohort) {
            // Same Date Collision
            if (exA.exam_date === exB.exam_date) {
              list.push({
                id: `exam-cohort-${exA.id}-${exB.id}`,
                type: 'cohort',
                title: `Critical Examination Same-Day Collision`,
                message: `Candidates in ${exA.program_name} Sem ${exA.semester_number || 2} have two papers (${exA.subject?.code || exA.subject_id} & ${exB.subject?.code || exB.subject_id}) scheduled on the same date (${exA.exam_date})!`,
                severity: 'critical',
                cohort: `${exA.program_name} Sem ${exA.semester_number || 2}`,
                entities: `${exA.subject?.code || ''} vs ${exB.subject?.code || ''} on ${exA.exam_date}`,
                resolution: 'Disperse papers across different calendar dates with minimum 2 days gap.',
                slotIds: [exA.id, exB.id]
              });
            } else {
              // 0-Day Prep Gap Check
              const diffMs = Math.abs(new Date(exB.exam_date).getTime() - new Date(exA.exam_date).getTime());
              const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                list.push({
                  id: `exam-gap-${exA.id}-${exB.id}`,
                  type: 'cohort_gap',
                  title: `Zero-Day Exam Prep Gap Warning`,
                  message: `Candidates in ${exA.program_name} Sem ${exA.semester_number || 2} have consecutive papers on ${exA.exam_date} (${exA.subject?.code || ''}) and ${exB.exam_date} (${exB.subject?.code || ''}) with 0 prep days.`,
                  severity: 'warning',
                  cohort: `${exA.program_name} Sem ${exA.semester_number || 2}`,
                  entities: `${exA.exam_date} &bull; ${exB.exam_date}`,
                  resolution: 'Introduce 1-2 prep revision days between major theory papers.',
                  slotIds: [exA.id, exB.id]
                });
              }
            }
          }
        }
      }
    }

    return list;
  }, [slots, examSchedules]);

  // Set of slot IDs with active conflicts for table highlighting
  const conflictedSlotIds = useMemo(() => {
    const s = new Set<string>();
    clashes.forEach((c) => {
      c.slotIds.forEach((id) => s.add(id));
    });
    return s;
  }, [clashes]);

  // Filtered clashes based on user badge selector
  const filteredClashes = useMemo(() => {
    if (selectedClashFilter === 'ALL') return clashes;
    return clashes.filter((c) => c.type === selectedClashFilter);
  }, [clashes, selectedClashFilter]);

  // Comprehensive Faculty Workload & Fatigue Anomaly Engine (UGC Limits Audit)
  const facultyWorkloadAnalysis = useMemo(() => {
    const map: Record<string, {
      name: string;
      totalHours: number;
      byDay: Record<string, number>;
      subjects: Set<string>;
      maxPeriodsInSingleDay: number;
      fatigueDays: string[];
    }> = {};

    slots.forEach((s) => {
      const name = s.faculty_name || 'Unassigned Instructor';
      if (!map[name]) {
        map[name] = {
          name,
          totalHours: 0,
          byDay: {},
          subjects: new Set<string>(),
          maxPeriodsInSingleDay: 0,
          fatigueDays: []
        };
      }

      const rec = map[name];
      rec.totalHours += 1;
      const day = s.day || 'Monday';
      rec.byDay[day] = (rec.byDay[day] || 0) + 1;
      if (s.subject_code) rec.subjects.add(s.subject_code);
    });

    // Check fatigue (>= 4 periods in a single day)
    Object.values(map).forEach((rec) => {
      let maxPeriods = 0;
      const fDays: string[] = [];
      Object.entries(rec.byDay).forEach(([day, count]) => {
        if (count > maxPeriods) maxPeriods = count;
        if (count >= 4) fDays.push(`${day} (${count} hrs)`);
      });
      rec.maxPeriodsInSingleDay = maxPeriods;
      rec.fatigueDays = fDays;
    });

    const anomalies: Array<{
      facultyName: string;
      totalHours: number;
      type: 'overloaded' | 'fatigue' | 'underutilized';
      severity: 'critical' | 'warning' | 'info';
      message: string;
      remedy: string;
      subjects: string[];
      fatigueDays: string[];
    }> = [];

    Object.values(map).forEach((rec) => {
      if (rec.totalHours > 16) {
        anomalies.push({
          facultyName: rec.name,
          totalHours: rec.totalHours,
          type: 'overloaded',
          severity: 'critical',
          message: `Exceeds UGC statutory teaching limit of 16 hrs/week (Allocated: ${rec.totalHours} hrs/wk across ${rec.subjects.size} subjects).`,
          remedy: 'Reassign elective section or appoint co-instructor / teaching assistant.',
          subjects: Array.from(rec.subjects),
          fatigueDays: rec.fatigueDays
        });
      } else if (rec.fatigueDays.length > 0) {
        anomalies.push({
          facultyName: rec.name,
          totalHours: rec.totalHours,
          type: 'fatigue',
          severity: 'warning',
          message: `Daily lecture fatigue risk: Continuous teaching load on ${rec.fatigueDays.join(', ')} without mandatory cognitive break.`,
          remedy: 'Spread teaching slots across alternating days (e.g. Tuesday/Thursday pairing).',
          subjects: Array.from(rec.subjects),
          fatigueDays: rec.fatigueDays
        });
      } else if (rec.totalHours < 8 && rec.name !== 'Unassigned Instructor' && !rec.name.toLowerCase().includes('lab')) {
        anomalies.push({
          facultyName: rec.name,
          totalHours: rec.totalHours,
          type: 'underutilized',
          severity: 'info',
          message: `Teaching load is underutilized at ${rec.totalHours} hrs/week (UGC statutory norm: 14-16 hrs for Assistant Professors).`,
          remedy: 'Assign department lab session, tutorial, or final-year capstone mentorship.',
          subjects: Array.from(rec.subjects),
          fatigueDays: []
        });
      }
    });

    return { map, anomalies };
  }, [slots]);

  const workloadAnomalies = facultyWorkloadAnalysis.anomalies;

  const facultyWorkload = useMemo(() => {
    const res: Record<string, number> = {};
    Object.entries(facultyWorkloadAnalysis.map).forEach(([k, v]) => {
      res[k] = (v as any)?.totalHours || 0;
    });
    return res;
  }, [facultyWorkloadAnalysis]);

  // Filter slots for table view
  const filteredSlots = slots.filter((s) => {
    const matchesDay = s.day.toLowerCase() === selectedDay.toLowerCase();
    const matchesDept = selectedDept === 'ALL' || (s.subject_code && s.subject_code.startsWith(selectedDept));
    const matchesType = selectedType === 'ALL' || s.type.toLowerCase() === selectedType.toLowerCase();
    return matchesDay && matchesDept && matchesType;
  });

  const uniqueRooms = Array.from(new Set(slots.map((s) => s.room_number)));
  const uniqueFaculty = Array.from(new Set(slots.map((s) => s.faculty_name)));

  // Ratification action handler
  const handleConfirmRatify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deanName = profile?.full_name || 'Prof. Dr. Rajesh K. Varma (Dean Academic Affairs)';
      await timetableService.ratifyTimetable(
        deanName,
        deanPin,
        'Master institutional timetable ratified conflict-free with cohort clash audit.',
        profile?.id
      );

      setRatified(true);
      setRatifiedInfo({
        officer: deanName,
        timestamp: new Date().toISOString(),
        seal: 'DEAN-TIMETABLE-SEAL-VERIFIED'
      });
      setIsRatifyModalOpen(false);
      setFeedbackMessage({
        type: 'success',
        text: 'Master University Timetable successfully ratified and sealed into statutory academic records!'
      });
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to ratify timetable.' });
    }
  };

  const handleRevokeRatify = () => {
    timetableService.revokeRatification(profile?.full_name || 'Dean of Academic Affairs');
    setRatified(false);
    setRatifiedInfo(null);
    setFeedbackMessage({
      type: 'success',
      text: 'Timetable ratification revoked. Schedules reverted to draft review mode.'
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const cohortClashCount = clashes.filter((c) => c.type === 'cohort').length;
  const roomClashCount = clashes.filter((c) => c.type === 'room').length;
  const facultyClashCount = clashes.filter((c) => c.type === 'faculty').length;
  const gapAlertCount = clashes.filter((c) => c.type === 'cohort_gap').length;
  const capacityRiskCount = clashes.filter((c) => c.type === 'capacity').length;

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. ACADEMIC COUNCIL HERO HEADER ── */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-Clash Statutory Master Timetable Authority</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Timetable &amp; Cohort Clash Governance
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Real-time multi-dimensional clash engine: room double-bookings, instructor concurrent conflicts, capacity bottlenecks, and <span className="text-amber-300 font-bold underline">cross-department student cohort double-bookings</span> with zero-day prep gap checks.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[170px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Clash Engine Audit</span>
              <div
                className={`text-xl font-academic-display font-extrabold mt-0.5 ${
                  clashes.length === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {clashes.length === 0 ? '0 Clashes Detected' : `${clashes.length} Active Conflict(s)`}
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">
                {cohortClashCount > 0 ? `${cohortClashCount} Cohort Collision(s)` : 'Cohort Independent'}
              </span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Ratification Badge Banner */}
      {ratified && ratifiedInfo && (
        <div className="card-3d bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>Institutional Master Timetable Officially Ratified by Dean</span>
                <span className="font-mono text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900">
                  {ratifiedInfo.seal}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                Signed by {ratifiedInfo.officer} on {new Date(ratifiedInfo.timestamp).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <button
            onClick={handleRevokeRatify}
            className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer self-start sm:self-auto"
          >
            Revoke Ratification
          </button>
        </div>
      )}

      {/* ── 2. ADVANCED MULTI-CATEGORY CLASH ALERT DESK ── */}
      {clashes.length > 0 && (
        <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-300 text-rose-900 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 pb-3">
            <div className="flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-rose-700" />
              <div>
                <h3 className="font-bold text-xs text-rose-950 uppercase tracking-wider">
                  Scheduling Anomalies &amp; Cohort Collisions ({clashes.length})
                </h3>
                <p className="text-[11px] text-rose-800">
                  Statutory council anti-clash audit requires all critical conflicts resolved prior to ratification.
                </p>
              </div>
            </div>

            {/* Clash Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setSelectedClashFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  selectedClashFilter === 'ALL'
                    ? 'bg-rose-800 text-white shadow-xs'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
              >
                All ({clashes.length})
              </button>
              {cohortClashCount > 0 && (
                <button
                  onClick={() => setSelectedClashFilter('cohort')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                    selectedClashFilter === 'cohort'
                      ? 'bg-rose-800 text-white shadow-xs'
                      : 'bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Cohort Clashes ({cohortClashCount})</span>
                </button>
              )}
              {roomClashCount > 0 && (
                <button
                  onClick={() => setSelectedClashFilter('room')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    selectedClashFilter === 'room'
                      ? 'bg-rose-800 text-white shadow-xs'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  Room Double-Bookings ({roomClashCount})
                </button>
              )}
              {facultyClashCount > 0 && (
                <button
                  onClick={() => setSelectedClashFilter('faculty')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    selectedClashFilter === 'faculty'
                      ? 'bg-rose-800 text-white shadow-xs'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  Faculty Clashes ({facultyClashCount})
                </button>
              )}
              {gapAlertCount > 0 && (
                <button
                  onClick={() => setSelectedClashFilter('cohort_gap')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    selectedClashFilter === 'cohort_gap'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  }`}
                >
                  Prep Gaps / Fatigue ({gapAlertCount})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredClashes.map((c) => (
              <div
                key={c.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                  c.severity === 'critical'
                    ? 'bg-white border-rose-300 shadow-2xs'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {c.type === 'cohort' && <Users className="w-3.5 h-3.5 text-rose-600" />}
                    {c.type === 'room' && <Building className="w-3.5 h-3.5 text-rose-600" />}
                    {c.type === 'faculty' && <User className="w-3.5 h-3.5 text-purple-600" />}
                    {c.type === 'cohort_gap' && <Flame className="w-3.5 h-3.5 text-amber-600" />}
                    {c.type === 'capacity' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    <span>{c.title}</span>
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      c.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {c.severity}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-[11px]">{c.message}</p>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">Recommended Action:</span>
                  <span className="text-slate-600 italic">{c.resolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. KPI AUDIT COUNTERS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Weekly Slots</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#0F2747]">{slots.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Active Instruction Slots</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Lecture Halls &amp; Labs</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#1E5AA8]">{uniqueRooms.length} Venues</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Campus Venues Audited</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Teaching Faculty Deployed</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#0F2747]">{uniqueFaculty.length} Instructors</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
            {workloadAnomalies.length === 0 ? 'All Within UGC Limits' : `${workloadAnomalies.length} Exceeds 16h Limit`}
          </span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-amber-800 font-bold uppercase block">Dean Ratification Status</span>
          <span
            className={`badge-3d text-[11px] font-bold inline-block mt-1 ${
              ratified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {ratified ? 'Council Ratified ✓' : 'Pending Ratification'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {ratified ? 'Live on Portal' : 'Draft Review Stage'}
          </span>
        </div>
      </div>

      {/* ── 3.1 FACULTY WORKLOAD ANOMALY INSPECTOR DESK ── */}
      {workloadAnomalies.length > 0 && (
        <div className="card-3d bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                  <span>Faculty Teaching Workload &amp; Fatigue Anomaly Audit</span>
                  <span className="badge-3d text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 border-rose-300">
                    {workloadAnomalies.length} Flagged Cases
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  UGC / AICTE Teaching Norms: 16 hrs/week statutory limit. Flagged for overload, continuous lecture fatigue (&ge;4 hrs/day), or underutilization.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWorkloadInspectorOpen(!isWorkloadInspectorOpen)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{isWorkloadInspectorOpen ? 'Collapse Workload Desk' : 'Inspect Workload Anomalies'}</span>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isWorkloadInspectorOpen ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Anomaly Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white/90 rounded-2xl border border-rose-200 shadow-xs">
              <div className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>Overloaded (&gt;16 hrs/wk)</span>
              </div>
              <div className="text-xl font-extrabold text-rose-950 font-mono mt-0.5">
                {workloadAnomalies.filter(a => a.type === 'overloaded').length} Instructors
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">Statutory compliance violation risk</div>
            </div>

            <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 shadow-xs">
              <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>Daily Lecture Fatigue (&ge;4h/day)</span>
              </div>
              <div className="text-xl font-extrabold text-amber-950 font-mono mt-0.5">
                {workloadAnomalies.filter(a => a.type === 'fatigue').length} Schedulings
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">Continuous teaching burnout hazard</div>
            </div>

            <div className="p-3 bg-white/90 rounded-2xl border border-blue-200 shadow-xs">
              <div className="text-[11px] font-bold text-[#1E5AA8] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1E5AA8]"></span>
                <span>Underutilized (&lt;8 hrs/wk)</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {workloadAnomalies.filter(a => a.type === 'underutilized').length} Instructors
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Capacity available for electives/labs</div>
            </div>
          </div>

          {/* Expandable Anomaly List */}
          {isWorkloadInspectorOpen && (
            <div className="space-y-3 pt-2 border-t border-amber-200/80 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950 flex-wrap gap-2">
                <span>Flagged Faculty Dossiers &amp; UGC Corrective Directives</span>
                <div className="flex items-center gap-1 text-[11px]">
                  {(['ALL', 'overloaded', 'fatigue', 'underutilized'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setWorkloadAnomalyFilter(tab)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold capitalize transition ${
                        workloadAnomalyFilter === tab ? 'bg-amber-900 text-white shadow-xs' : 'bg-white text-amber-900 border border-amber-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workloadAnomalies
                  .filter(a => workloadAnomalyFilter === 'ALL' || a.type === workloadAnomalyFilter)
                  .map((a, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0F2747]">{a.facultyName}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          a.type === 'overloaded' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                          a.type === 'fatigue' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}>
                          {a.type.toUpperCase()}: {a.totalHours} hrs/wk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700">{a.message}</p>
                      <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">Remedy:</span> {a.remedy}
                      </div>
                      {a.subjects.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Assigned Courses:</span>
                          {a.subjects.map(sub => (
                            <span key={sub} className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. TIMETABLE MODE & FILTER BAR ── */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedDay === day
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1E5AA8]" />
              <span>Print Master Schedule</span>
            </button>
            {!ratified && (
              <button
                onClick={() => setIsRatifyModalOpen(true)}
                className="btn-3d-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Ratify Timetable</span>
              </button>
            )}
          </div>
        </div>

        {/* Department & Type Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1 text-xs font-semibold text-[#0F2747]"
            >
              <option value="ALL">All Departments</option>
              <option value="MCA">Computer Applications (MCA/BCA)</option>
              <option value="CS">Computer Science &amp; Engineering</option>
              <option value="MBA">Management Studies</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Session Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1 text-xs font-semibold text-[#0F2747]"
            >
              <option value="ALL">All Sessions</option>
              <option value="lecture">Lectures Only</option>
              <option value="lab">Laboratories Only</option>
              <option value="tutorial">Tutorials Only</option>
            </select>
          </div>

          <span className="text-slate-400 ml-auto font-mono text-[11px]">
            Showing {filteredSlots.length} slots for {selectedDay}
          </span>
        </div>
      </div>

      {/* ── 5. SCHEDULE REGISTER TABLE WITH CONFLICT BADGING ── */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E5AA8]" />
            <span>Dean Timetable Register &ndash; {selectedDay}</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{filteredSlots.length} periods active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-4 w-14 text-center">Slot</th>
                <th className="py-3 px-4 w-36">Time Window</th>
                <th className="py-3 px-4">Subject &amp; Cohort</th>
                <th className="py-3 px-4">Faculty Instructor</th>
                <th className="py-3 px-4">Hall / Lab Venue</th>
                <th className="py-3 px-3 text-center">Session Type</th>
                <th className="py-3 px-4 text-center">Anti-Clash Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No timetable slots found for {selectedDay} matching the selected department/filter.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => {
                  const hasConflict = conflictedSlotIds.has(slot.id);
                  return (
                    <tr
                      key={slot.id}
                      className={`transition ${hasConflict ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#0F2747]">
                        P-{slot.period_number}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#0F2747] font-semibold">
                        {slot.start_time} - {slot.end_time}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {slot.subject_code}
                          </span>
                          <span className="font-semibold text-slate-800">{slot.subject_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Cohort: {slot.subject_code.split('-')[0]} Sem {slot.semester_number || 2}
                          {slot.batch && ` &bull; Batch: ${slot.batch}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F2747] flex items-center gap-1.5 flex-wrap">
                          <span>{slot.faculty_name}</span>
                          {(facultyWorkload[slot.faculty_name] || 0) > 16 && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              Overloaded
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Load: {facultyWorkload[slot.faculty_name] || 0} hrs/wk
                          {facultyWorkloadAnalysis.map[slot.faculty_name]?.fatigueDays.length > 0 && (
                            <span className="text-amber-700 ml-1.5 font-semibold">&bull; Fatigue Risk</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{slot.room_number}</div>
                        <div className="text-[10px] text-slate-400">{slot.building}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200">
                          {slot.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasConflict ? (
                          <span className="badge-3d text-[10px] bg-rose-50 text-rose-800 border-rose-300 font-bold inline-flex items-center gap-1 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Clash Active
                          </span>
                        ) : (
                          <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Conflict Free
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

      {/* ── 6. RATIFY MODAL (WITH DEAN PIN) ── */}
      {isRatifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747]">
                  Ratify Master University Timetable
                </h2>
                <p className="text-xs text-slate-500 font-mono">Academic Session Spring 2026</p>
              </div>
              <button
                onClick={() => setIsRatifyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRatify} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold">Statutory Academic Council Ratification</div>
                <div>
                  Ratifying confirms that cohort collisions, room double-bookings, and faculty overlaps have been audited. Timetable will become the legal institutional roster.
                </div>
              </div>

              {clashes.some((c) => c.severity === 'critical') && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Warning: {clashes.filter((c) => c.severity === 'critical').length} critical conflict(s) are active!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dean Security Authorization PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  required
                  placeholder="Enter 4-digit PIN (Default: 9901)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRatifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  Affix Seal &amp; Ratify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
