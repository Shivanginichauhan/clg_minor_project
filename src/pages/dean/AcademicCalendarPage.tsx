import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Award,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  ShieldCheck,
  AlertCircle,
  Printer,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { deanService, CalendarEvent, INITIAL_CALENDAR_EVENTS } from '../../services/deanService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const AcademicCalendarPage: React.FC = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>(deanService.getCalendarEvents());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [amendedEndDate, setAmendedEndDate] = useState('');
  const [amendmentRationale, setAmendmentRationale] = useState('');
  const [deanPin, setDeanPin] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = events.filter((e) => {
    return selectedCategory === 'ALL' || e.category === selectedCategory;
  });

  const calculateCascade = (endDateStr: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return null;
    const resultsDeadline = new Date(end.getTime() + 15 * 86400000);
    const suppExamWindow = new Date(end.getTime() + 24 * 86400000);
    const nextSemStart = new Date(end.getTime() + 35 * 86400000);
    return {
      resultsDeadline: resultsDeadline.toISOString().split('T')[0],
      suppExamWindow: suppExamWindow.toISOString().split('T')[0],
      nextSemStart: nextSemStart.toISOString().split('T')[0],
    };
  };

  const handleOpenAmend = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setAmendedEndDate(evt.endDate);
    setAmendmentRationale('Scheduled date adjustment to accommodate statutory state election recess without shrinking 90-day instructional teaching mandate.');
    setDeanPin('');
    setIsAmendModalOpen(true);
  };

  const handleConfirmAmend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const pinCheck = deanService.verifyDeanPin(deanPin, profile?.id);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean PIN' });
      return;
    }

    const cascade = calculateCascade(amendedEndDate);

    try {
      const updatedEvent = deanService.amendCalendarEvent(
        selectedEvent.id,
        amendedEndDate,
        amendmentRationale,
        cascade || undefined,
        profile?.full_name || 'Dean of Academic Affairs',
        deanPin,
        profile?.id
      );

      setEvents(deanService.getCalendarEvents());

      setMessage({
        type: 'success',
        text: `Master calendar event "${selectedEvent.title}" updated and re-ratified! Downstream cascade: Results by ${cascade?.resultsDeadline || 'N/A'}, Next Sem by ${cascade?.nextSemStart || 'N/A'}.`
      });
      setIsAmendModalOpen(false);
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to amend calendar event.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Master Academic Calendar &amp; Cascade Impact Authority</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Master Academic Calendar Governance
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Ratify instructional term start/end dates, statutory examination windows, and summer/winter recesses. Model cascade impacts to ensure UGC 90-day teaching compliance before gazetting.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Instructional Days</span>
              <div className="text-2xl font-academic-display font-extrabold text-emerald-400 mt-0.5">
                92 Days
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">UGC 90-Day Mandate Met</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'instructional', 'examination', 'holiday', 'governance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border capitalize ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#1E5AA8]" />
          <span>Print Calendar Gazette</span>
        </button>
      </div>

      {/* Calendar Timeline List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-amber-400/80 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0F2747]">{item.title}</span>
                  <span className="badge-3d text-[10px] font-bold px-2 py-0.5 uppercase bg-blue-50 text-[#1E5AA8] border-blue-200">
                    {item.category}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {item.startDate} &rarr; {item.endDate}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge-3d text-[11px] font-bold px-2.5 py-1 ${
                  item.status === 'ratified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {item.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => handleOpenAmend(item)}
                  className="px-3 py-1 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Amend Dates
                </button>
              </div>
            </div>

            {/* Cascade Impact Notice */}
            {item.impactAnalysis && (
              <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-2xl border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Cascade Schedule Impact:</strong>
                  <span>{item.impactAnalysis}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── AMEND CALENDAR MODAL WITH PIN ── */}
      {isAmendModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Amend Master Academic Calendar
                </h3>
                <p className="text-xs text-slate-500">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setIsAmendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAmend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted End Date
                </label>
                <input
                  type="date"
                  value={amendedEndDate}
                  onChange={(e) => setAmendedEndDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Rationale for Shift
                </label>
                <textarea
                  value={amendmentRationale}
                  onChange={(e) => setAmendmentRationale(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-[#0F2747]"
                />
              </div>

              {/* Dynamic Automated Cascade Impact Preview */}
              {(() => {
                const cascade = calculateCascade(amendedEndDate);
                if (!cascade) return null;
                return (
                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 space-y-2">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Automated Downstream Cascade Modeling</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        <span className="font-medium">Results Gazette Signoff Deadline (+15d):</span>
                        <span className="font-mono font-bold text-amber-900">{cascade.resultsDeadline}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        <span className="font-medium">Supplementary Exam Window (+24d):</span>
                        <span className="font-mono font-bold text-amber-900">{cascade.suppExamWindow}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        <span className="font-medium">Next Sem Commencement &amp; Fees (+35d):</span>
                        <span className="font-mono font-bold text-amber-900">{cascade.nextSemStart}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-800 italic">
                      Downstream committee deadlines automatically recalibrated upon PIN authorization.
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Dean Authorization PIN
                </label>
                <input
                  type="password"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  required
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0F2747]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  Ratify &amp; Publish Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
