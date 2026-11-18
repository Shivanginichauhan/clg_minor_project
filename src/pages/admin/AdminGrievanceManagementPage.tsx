import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  MessageSquare,
  ArrowUpRight,
  Shield,
  User,
  Building,
  Send,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { grievanceService, GrievanceTicket, GrievanceStatus, GrievancePriority } from '../../services/grievanceService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { auditService } from '../../services/auditService.js';

export const AdminGrievanceManagementPage: React.FC = () => {
  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<GrievanceTicket | null>(null);

  // Response Form
  const [responseMsg, setResponseMsg] = useState('');
  const [resolutionAction, setResolutionAction] = useState<GrievanceStatus>('resolved');
  const [escalateTo, setEscalateTo] = useState<'HOD' | 'DEAN' | 'REGISTRAR' | 'NONE'>('NONE');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getGrievances();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !responseMsg.trim()) return;

    try {
      if (escalateTo !== 'NONE') {
        await grievanceService.escalateTicket(
          selectedTicket.id,
          `Escalated by Admin Desk to ${escalateTo}: ${responseMsg}`
        );
      } else {
        await grievanceService.addComment(selectedTicket.id, responseMsg, 'Admin Grievance Desk', 'officer');
        if (resolutionAction === 'resolved' || resolutionAction === 'rejected') {
          await grievanceService.updateStatus(selectedTicket.id, resolutionAction, responseMsg);
        }
      }

      auditService.logAction({
        action: 'GRIEVANCE_DESK_ACTION',
        entity_type: 'grievance',
        entity_id: selectedTicket.id,
        entity_name: selectedTicket.ticket_no,
        description: `Admin processed ticket #${selectedTicket.ticket_no} (Status: ${resolutionAction}, Escalated: ${escalateTo})`,
        severity: 'info',
      });

      setResponseMsg('');
      setEscalateTo('NONE');
      await loadTickets();
      const updated = (await grievanceService.getGrievances()).find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    } catch (err) {
      console.error('Failed to process response:', err);
    }
  };

  // Metrics
  const openCount = tickets.filter((t) => t.status === 'submitted' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const escalatedCount = tickets.filter((t) => t.is_escalated).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Institutional Ombudsman</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Grievance & Redressal Helpdesk
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Monitor student and faculty appeals across attendance, evaluations, fee concessions, and hall ticket disputes with statutory SLA timers.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-medium">SLA Resolution Rate</p>
              <div className="text-xl font-bold text-white mt-0.5">
                {tickets.length > 0 ? ((resolvedCount / tickets.length) * 100).toFixed(0) : 100}%
              </div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="academic-card p-5 border-l-4 border-l-[#1E5AA8]">
          <p className="text-xs text-slate-500 font-medium">Total Docketed Appeals</p>
          <div className="text-2xl font-bold text-[#0F2747] mt-1">{tickets.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Academic Year 2025-26</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-medium">Active / In-Review</p>
          <div className="text-2xl font-bold text-amber-600 mt-1">{openCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting Department Redressal</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-rose-600">
          <p className="text-xs text-slate-500 font-medium">Escalated to Dean/Registrar</p>
          <div className="text-2xl font-bold text-rose-700 mt-1">{escalatedCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">SLA Escalation Triggered</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs text-slate-500 font-medium">Satisfactorily Resolved</p>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{resolvedCount}</div>
          <p className="text-xs text-slate-500 mt-0.5">Closure Confirmed with Scholar</p>
        </div>
      </div>

      {/* Main Grid: Ticket List + Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, scholar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedTicket?.id === t.id
                    ? 'bg-blue-50/80 border-[#1E5AA8] shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-bold text-[#0F2747]">{t.ticket_no}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      t.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t.student_name} · <span className="font-semibold">{t.category}</span>
                </p>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>{t.created_at}</span>
                  {t.is_escalated && (
                    <span className="text-rose-600 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> ESCALATED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details & Action Panel */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="academic-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {selectedTicket.ticket_no}
                    </span>
                    <span className="text-xs font-semibold uppercase text-slate-500">
                      Category: {selectedTicket.category}
                    </span>
                    {selectedTicket.is_escalated && (
                      <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        High Priority Escalation
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#0F2747] mt-1.5">{selectedTicket.subject}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">Statutory SLA Window:</span>
                  <div className="font-bold text-sm text-[#0F2747]">{selectedTicket.sla_days} Days Maximum</div>
                </div>
              </div>

              {/* Scholar Dossier Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500">Scholar:</span>
                  <p className="font-semibold text-slate-800">{selectedTicket.student_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Assigned Department:</span>
                  <p className="font-semibold text-slate-800">{selectedTicket.department}</p>
                </div>
                <div>
                  <span className="text-slate-500">Current Assigned Officer:</span>
                  <p className="font-semibold text-slate-800">{selectedTicket.assigned_to || 'Admin General Desk'}</p>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statement of Grievance:</span>
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Redressal History & Discussion Feed */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Audit Trail & Redressal Notes ({selectedTicket.comments.length})
                </span>

                <div className="space-y-2">
                  {selectedTicket.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span className="font-semibold text-slate-800">{c.sender}</span>
                        <span>{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700">{c.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form */}
              <form onSubmit={handleSendResponse} className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">Add Redressal Note / Action:</label>
                <textarea
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  placeholder="Enter administrative directive, investigation findings, or student resolution notice..."
                  rows={3}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
                  required
                />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-600">Status:</span>
                      <select
                        value={resolutionAction}
                        onChange={(e) => setResolutionAction(e.target.value as any)}
                        className="p-1.5 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="in_progress">Mark In-Progress</option>
                        <option value="resolved">Mark Resolved</option>
                        <option value="rejected">Reject Appeal</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-600">Escalate:</span>
                      <select
                        value={escalateTo}
                        onChange={(e) => setEscalateTo(e.target.value as any)}
                        className="p-1.5 border border-slate-300 rounded text-xs bg-white text-rose-700 font-semibold"
                      >
                        <option value="NONE">Do Not Escalate</option>
                        <option value="HOD">Escalate to HOD</option>
                        <option value="DEAN">Escalate to Dean Academic</option>
                        <option value="REGISTRAR">Escalate to Registrar</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F2747] text-white text-xs font-semibold rounded-lg hover:bg-[#1E5AA8] transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Decision
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="academic-card p-12 text-center text-slate-400 text-sm">
              Select an appeal from the list to review evidence and dispatch redressal.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
