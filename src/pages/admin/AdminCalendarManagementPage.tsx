import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Shield,
  Layers,
  Sparkles,
  Sliders
} from 'lucide-react';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { auditService } from '../../services/auditService.js';

interface TermSchedule {
  id: string;
  name: string;
  type: 'ODD_SEM' | 'EVEN_SEM' | 'SUMMER_TERM';
  academicYear: string;
  startDate: string;
  endDate: string;
  instructionalDays: number;
  examStartDate: string;
  examEndDate: string;
  resultsGazetteDate: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  gazetted: boolean;
}

interface UniversityEvent {
  id: string;
  title: string;
  category: 'HOLIDAY' | 'EXAM_WINDOW' | 'ACADEMIC_EVENT' | 'STATUTORY_MEETING';
  startDate: string;
  endDate: string;
  affectsInstruction: boolean;
  notes: string;
}

const INITIAL_TERMS: TermSchedule[] = [
  {
    id: 'term-even-2026',
    name: 'Even Semester AY 2025-26',
    type: 'EVEN_SEM',
    academicYear: '2025-2026',
    startDate: '2026-01-05',
    endDate: '2026-04-30',
    instructionalDays: 92,
    examStartDate: '2026-05-08',
    examEndDate: '2026-05-28',
    resultsGazetteDate: '2026-06-15',
    status: 'PUBLISHED',
    gazetted: true,
  },
  {
    id: 'term-odd-2026',
    name: 'Odd Semester AY 2026-27',
    type: 'ODD_SEM',
    academicYear: '2026-2027',
    startDate: '2026-07-20',
    endDate: '2026-11-20',
    instructionalDays: 94,
    examStartDate: '2026-11-25',
    examEndDate: '2026-12-15',
    resultsGazetteDate: '2027-01-10',
    status: 'DRAFT',
    gazetted: false,
  },
];

const INITIAL_EVENTS: UniversityEvent[] = [
  {
    id: 'ev-01',
    title: 'End-Semester Theory Examinations (Even Sem)',
    category: 'EXAM_WINDOW',
    startDate: '2026-05-08',
    endDate: '2026-05-28',
    affectsInstruction: true,
    notes: 'Centralized valuation centers active across Block B & C.',
  },
  {
    id: 'ev-02',
    title: 'Summer Recess & Industry Internship Window',
    category: 'ACADEMIC_EVENT',
    startDate: '2026-06-01',
    endDate: '2026-07-15',
    affectsInstruction: false,
    notes: 'Mandatory 6-week corporate internships for B.Tech & MCA scholars.',
  },
  {
    id: 'ev-03',
    title: 'Statutory Academic Council & BoS Convocation',
    category: 'STATUTORY_MEETING',
    startDate: '2026-06-25',
    endDate: '2026-06-25',
    affectsInstruction: false,
    notes: 'Ratification of final degree cohorts and NAAC SSR validation.',
  },
  {
    id: 'ev-04',
    title: 'Independence Day Institutional Observance',
    category: 'HOLIDAY',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    affectsInstruction: true,
    notes: 'National Holiday.',
  },
];

export const AdminCalendarManagementPage: React.FC = () => {
  const [terms, setTerms] = useState<TermSchedule[]>(() => {
    const raw = localStorage.getItem('ueams_admin_calendar_terms');
    return raw ? JSON.parse(raw) : INITIAL_TERMS;
  });

  const [events, setEvents] = useState<UniversityEvent[]>(() => {
    const raw = localStorage.getItem('ueams_admin_calendar_events');
    return raw ? JSON.parse(raw) : INITIAL_EVENTS;
  });

  const [shiftDays, setShiftDays] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'TERMS' | 'EVENTS' | 'SIMULATOR'>('TERMS');

  // New Term Modal
  const [isNewTermOpen, setIsNewTermOpen] = useState(false);
  const [newTerm, setNewTerm] = useState<Partial<TermSchedule>>({
    name: 'Summer Term 2026',
    type: 'SUMMER_TERM',
    academicYear: '2025-2026',
    startDate: '2026-06-05',
    endDate: '2026-07-15',
    instructionalDays: 35,
    examStartDate: '2026-07-18',
    examEndDate: '2026-07-24',
    resultsGazetteDate: '2026-07-30',
  });

  // Save to LocalStorage
  const persistTerms = (list: TermSchedule[]) => {
    setTerms(list);
    localStorage.setItem('ueams_admin_calendar_terms', JSON.stringify(list));
  };

  const persistEvents = (list: UniversityEvent[]) => {
    setEvents(list);
    localStorage.setItem('ueams_admin_calendar_events', JSON.stringify(list));
  };

  const handleGazetteTerm = (id: string) => {
    const updated = terms.map((t) => (t.id === id ? { ...t, status: 'PUBLISHED' as const, gazetted: true } : t));
    persistTerms(updated);
    auditService.logAction({
      action: 'ACADEMIC_CALENDAR_GAZETTED',
      entity_type: 'academic_calendar',
      entity_id: id,
      entity_name: 'Academic Master Calendar',
      description: `Administrator gazetted master schedule for ${terms.find((t) => t.id === id)?.name}`,
      severity: 'security',
    });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    const item: TermSchedule = {
      id: `term-${Date.now()}`,
      name: newTerm.name || 'Term',
      type: newTerm.type || 'EVEN_SEM',
      academicYear: newTerm.academicYear || '2025-2026',
      startDate: newTerm.startDate || '2026-01-01',
      endDate: newTerm.endDate || '2026-04-30',
      instructionalDays: Number(newTerm.instructionalDays || 90),
      examStartDate: newTerm.examStartDate || '2026-05-01',
      examEndDate: newTerm.examEndDate || '2026-05-20',
      resultsGazetteDate: newTerm.resultsGazetteDate || '2026-06-01',
      status: 'DRAFT',
      gazetted: false,
    };
    persistTerms([...terms, item]);
    setIsNewTermOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Master Governance</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Academic Calendar & Event Governance
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Gazette statutory terms, enforce UGC 90-day instructional compliance, configure holiday recesses, and run cascade impact simulations.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-medium">UGC Compliance</p>
              <div className="text-xl font-bold text-white mt-0.5">92 Days (Active)</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('TERMS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'TERMS' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Instructional Terms & Semesters
        </button>
        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'EVENTS' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          University Events & Holidays ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'SIMULATOR' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Cascade Impact Analysis Simulator
        </button>
      </div>

      {/* TAB 1: TERMS */}
      {activeTab === 'TERMS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Statutory Academic Terms</h3>
              <p className="text-xs text-slate-500">Each semester requires a minimum of 90 working teaching days under UGC Guidelines.</p>
            </div>
            <button
              onClick={() => setIsNewTermOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Define New Academic Term
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {terms.map((t) => (
              <div key={t.id} className="academic-card p-5 space-y-4 border-l-4 border-l-[#0F2747]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-semibold bg-blue-50 text-[#1E5AA8] px-2 py-0.5 rounded">
                      AY {t.academicYear} · {t.type}
                    </span>
                    <h4 className="text-base font-bold text-[#0F2747] mt-1">{t.name}</h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      t.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-500">Teaching Start:</span>
                    <p className="font-semibold text-slate-800">{t.startDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Teaching Conclude:</span>
                    <p className="font-semibold text-slate-800">{t.endDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">UGC Working Days:</span>
                    <p className="font-bold text-emerald-700">{t.instructionalDays} Days (Compliant)</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Exam Window:</span>
                    <p className="font-semibold text-slate-800">{t.examStartDate} to {t.examEndDate}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Gazette Target: {t.resultsGazetteDate}</span>
                  {t.status === 'DRAFT' ? (
                    <button
                      onClick={() => handleGazetteTerm(t.id)}
                      className="px-3 py-1.5 bg-[#0F2747] text-white font-semibold rounded hover:bg-[#1E5AA8]"
                    >
                      Publish & Gazette
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Live on Portals
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS & HOLIDAYS */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-4">
          <div className="academic-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Impact on Instruction</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-semibold text-[#0F2747]">{ev.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                      {ev.startDate} {ev.endDate !== ev.startDate && `→ ${ev.endDate}`}
                    </td>
                    <td className="py-3.5 px-4">
                      {ev.affectsInstruction ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Classes Suspended
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Non-Disruptive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">{ev.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CASCADE IMPACT ANALYSIS SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="academic-card p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Dynamic Calendar Cascade Simulation Engine
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulate operational impact if examination schedules or term end dates shift due to unforeseen closures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Shift End-Semester Exam Start Date by:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-10"
                  max="20"
                  value={shiftDays}
                  onChange={(e) => setShiftDays(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <span className="font-bold text-base font-mono w-16 text-center bg-white py-1 rounded border border-slate-300">
                  {shiftDays > 0 ? `+${shiftDays}` : shiftDays} Days
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Simulates real-time downstream impacts on valuation centers, grade gazette deadlines, and subsequent semester admissions.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">Projected Downstream Ripple Effects</h4>
              
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">UGC 90-Day Instructional Buffer</span>
                    <p className="text-slate-500">Current teaching days: 92 days</p>
                  </div>
                  <span className={`font-bold px-2.5 py-1 rounded ${92 + shiftDays >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {92 + shiftDays >= 90 ? `Compliant (${92 + shiftDays} Days)` : `VIOLATION (${92 + shiftDays} Days < 90)`}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">Central Evaluation & Scrutiny Window</span>
                    <p className="text-slate-500">Estimated valuation wrap-up shifts from June 05 to:</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">
                    {shiftDays >= 0 ? `June ${5 + shiftDays}, 2026` : `May ${31 + shiftDays}, 2026`}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">Summer Internship Cohort Window</span>
                    <p className="text-slate-500">Industry internships starting June 01:</p>
                  </div>
                  <span className={`font-bold px-2.5 py-1 rounded ${shiftDays > 7 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {shiftDays > 7 ? 'Overlap Warning (1-week compression)' : 'Zero Conflict'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW TERM */}
      {isNewTermOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747]">Configure Academic Term Schedule</h3>
              <button onClick={() => setIsNewTermOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Term Title</label>
                <input
                  type="text"
                  value={newTerm.name}
                  onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teaching Start</label>
                  <input
                    type="date"
                    value={newTerm.startDate}
                    onChange={(e) => setNewTerm({ ...newTerm, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teaching End</label>
                  <input
                    type="date"
                    value={newTerm.endDate}
                    onChange={(e) => setNewTerm({ ...newTerm, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam Start</label>
                  <input
                    type="date"
                    value={newTerm.examStartDate}
                    onChange={(e) => setNewTerm({ ...newTerm, examStartDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam End</label>
                  <input
                    type="date"
                    value={newTerm.examEndDate}
                    onChange={(e) => setNewTerm({ ...newTerm, examEndDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTermOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2747] text-white rounded font-semibold hover:bg-[#1E5AA8]"
                >
                  Save Draft Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
