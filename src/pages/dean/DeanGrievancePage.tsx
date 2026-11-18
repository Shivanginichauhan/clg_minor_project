import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Lock,
  Calendar,
  Send,
  Building,
  ArrowRight,
  Award
} from 'lucide-react';
import { deanService, DeanGrievanceTicket } from '../../services/deanService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DeanGrievancePage: React.FC = () => {
  const { profile } = useAuth();
  const [grievances, setGrievances] = useState<DeanGrievanceTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<DeanGrievanceTicket | null>(null);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [deanPin, setDeanPin] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setGrievances(deanService.getDeanGrievances());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSlaSweep = () => {
    try {
      const res = deanService.runSlaEscalationSweep(profile?.full_name, profile?.id);
      loadData();
      if (res.escalatedCount > 0) {
        setMessage({
          type: 'success',
          text: `Statutory SLA Engine executed: ${res.escalatedCount} overdue cases auto-escalated to Dean Appellate Jurisdiction under Section 14(b).`
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Statutory SLA Engine verified: All pending cases evaluated against UGC 5-day SLA.'
        });
      }
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to execute SLA sweep.' });
    }
  };

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCat = true;
    if (categoryFilter === 'AUTO_ESCALATED') {
      matchesCat = !!g.autoEscalated && g.status !== 'resolved';
    } else if (categoryFilter !== 'ALL') {
      matchesCat = g.category === categoryFilter;
    }
    return matchesSearch && matchesCat;
  });

  const handleOpenResolve = (g: DeanGrievanceTicket) => {
    setSelectedTicket(g);
    setResolutionText(
      g.category === 'Evaluation & Re-evaluation'
        ? 'Statutory re-scrutiny permitted by Dean order. Controller of Examinations directed to conduct physical marks recount in candidate presence.'
        : 'Emergency relief sanctioned under Dean Special Discretionary Fund. Surcharge waived.'
    );
    setDeanPin('');
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean PIN' });
      return;
    }

    try {
      deanService.resolveGrievance(
        selectedTicket.id,
        resolutionText,
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma (Dean Academic Affairs)',
        deanPin,
        profile?.id
      );

      setMessage({
        type: 'success',
        text: `Grievance ${selectedTicket.ticketNumber} resolved with formal Dean Statutory Order! Student and HOD notified.`
      });
      setIsResolveModalOpen(false);
      loadData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resolve grievance.' });
    }
  };

  const handleNudgeHod = (ticket: DeanGrievanceTicket) => {
    try {
      deanService.nudgeHod(
        ticket.id,
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma (Dean Academic Affairs)',
        profile?.id
      );
      setMessage({
        type: 'success',
        text: `Statutory compliance reminder & priority nudge dispatched to Head of ${ticket.departmentName} for ticket ${ticket.ticketNumber}!`
      });
      loadData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to dispatch nudge to HOD.' });
    }
  };

  const slaBreachedCount = grievances.filter(g => g.slaBreached && g.status !== 'resolved').length;
  const pendingCount = grievances.filter(g => g.status === 'escalated_to_dean').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Student Welfare</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory Appellate &amp; Escalation Ombudsman Desk</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Student Grievance Escalation &amp; Ombudsman Desk
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Hear and adjudicate student academic grievances unresolved at department or HOD desks. Enforce UGC mandatory grievance response SLAs, conduct re-scrutiny inquiries, and issue legally binding Dean directives.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">SLA Breaches</span>
              <div className={`text-2xl font-academic-display font-extrabold mt-0.5 ${slaBreachedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {slaBreachedCount} Critical
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">UGC 7-Day Window</span>
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

      {/* Statutory SLA Breach Alert Banner */}
      {grievances.some(g => g.slaBreached && g.status !== 'resolved') && (
        <div className="card-3d bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 space-y-3 shadow-md animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h2 className="text-sm font-extrabold text-rose-900 tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Statutory UGC SLA Breach Alert ({slaBreachedCount} Grievance{slaBreachedCount > 1 ? 's' : ''} Overdue)</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                Auto-Escalated to Urgent Priority
              </span>
              <button
                type="button"
                onClick={handleRunSlaSweep}
                className="px-3 py-1 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1 cursor-pointer transition"
              >
                <span>Run Statutory Escalation Sweep</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {grievances
              .filter(g => g.slaBreached && g.status !== 'resolved')
              .map(g => (
                <div key={g.id} className="bg-white border border-rose-200 rounded-2xl p-3.5 flex flex-col justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100/70 px-2 py-0.5 rounded">
                        {g.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        🔴 {g.daysOpen} days open ({Math.max(1, g.daysOpen - 5)}d past SLA)
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-2">
                      {g.studentName} <span className="font-normal text-slate-500 font-mono">({g.rollNumber})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                      {g.subject}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Dept: <span className="font-semibold text-slate-700">{g.departmentName}</span>
                      {g.lastNudgedAt && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          &bull; Nudged: {new Date(g.lastNudgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleNudgeHod(g)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Nudge to HOD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenResolve(g)}
                      className="btn-3d-gold px-3 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3 h-3" />
                      <span>Adjudicate</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket number, student, roll no, or subject..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747]"
          >
            <option value="ALL">All Grievances ({grievances.length})</option>
            <option value="AUTO_ESCALATED">⚡ Auto-Escalated (UGC SLA)</option>
            <option value="Evaluation & Re-evaluation">Evaluation &amp; Re-evaluation</option>
            <option value="Fee & Financial Relief">Fee &amp; Financial Relief</option>
            <option value="Faculty Conduct">Faculty Conduct &amp; Attendance</option>
            <option value="Facility & Infrastructure">Facility &amp; Infrastructure</option>
          </select>
        </div>
      </div>

      {/* Grievance Ticket Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-amber-400/80 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-800 border border-slate-200">
                    {item.ticketNumber}
                  </span>
                  <span className="font-bold text-sm text-[#0F2747]">{item.studentName}</span>
                  <span className="text-xs text-slate-500 font-mono">({item.rollNumber})</span>
                  <span className="badge-3d text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200">
                    {item.category}
                  </span>
                  {item.autoEscalated && (
                    <span className="badge-3d text-[10px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-900 border-rose-300 flex items-center gap-1 shadow-xs">
                      ⚡ AUTO-ESCALATED (UGC SLA)
                    </span>
                  )}
                  {item.priority === 'urgent' && !item.autoEscalated && (
                    <span className="badge-3d text-[10px] font-extrabold px-2 py-0.5 bg-rose-600 text-white border-rose-700 animate-pulse flex items-center gap-1 shadow-xs">
                      🔥 URGENT PRIORITY
                    </span>
                  )}
                  {item.slaBreached && item.status !== 'resolved' && (
                    <span className="badge-3d text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      SLA Overdue ({item.daysOpen} days)
                    </span>
                  )}
                  {item.lastNudgedAt && (
                    <span className="badge-3d text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-300">
                      HOD Nudged ({new Date(item.lastNudgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  {item.departmentName} &bull; Escalated from: {item.escalatedFrom}
                </div>
              </div>

              <span className={`badge-3d text-[11px] font-bold px-2.5 py-1 ${
                item.status === 'resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {item.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Subject and Description */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-[#0F2747]">{item.subject}</h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {item.description}
              </p>

              {item.statutoryNotice && (
                <div className="text-xs text-rose-950 bg-rose-50/90 p-3 rounded-2xl border border-rose-300 flex items-start gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wide">Statutory UGC Section 14(b) Automatic Escalation Directive</span>
                    <span className="text-[11px] text-rose-800 leading-relaxed mt-0.5 block">{item.statutoryNotice}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-2xl border border-amber-200">
                <span className="font-bold text-amber-900">Department HOD Note:</span> {item.hodRemarks}
              </div>

              {item.deanResolution && (
                <div className="text-xs text-emerald-950 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dean Statutory Resolution Order</span>
                  </div>
                  <div>{item.deanResolution}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {item.status !== 'resolved' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleNudgeHod(item)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nudge HOD</span>
                </button>
                <button
                  onClick={() => handleOpenResolve(item)}
                  className="btn-3d-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Adjudicate &amp; Resolve Grievance</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── RESOLVE MODAL WITH DEAN PIN ── */}
      {isResolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Dean Appellate Grievance Resolution
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ref: {selectedTicket.ticketNumber} &bull; {selectedTicket.studentName}
                </p>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dean Statutory Resolution Order
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-[#0F2747]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Dean Security Authorization PIN
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
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  Issue Formal Resolution Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
