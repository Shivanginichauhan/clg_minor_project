import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Paperclip,
  ShieldAlert,
  ChevronRight,
  Filter,
  Search,
  UserCheck,
  Building2,
  Timer
} from 'lucide-react';
import {
  grievanceService,
  GrievanceTicket,
  GrievanceCategory,
  GrievancePriority
} from '../../services/grievanceService.js';

export const GrievancePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<GrievanceTicket | null>(null);

  // New Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<GrievanceCategory>('attendance');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<GrievancePriority>('medium');
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment input state
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await grievanceService.getGrievances(user?.id, profile?.full_name);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await grievanceService.createGrievance({
        student_id: user?.id || 'stu-current',
        student_name: profile?.full_name || 'Enrolled Student',
        category,
        subject,
        description,
        priority,
        attachment_name: attachmentName
      });

      setTickets((prev) => [created, ...prev]);
      setSelectedTicket(created);
      setIsCreateModalOpen(false);
      setSubject('');
      setDescription('');
    } catch (err) {
      alert('Failed to register grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;

    setIsSendingComment(true);
    try {
      const updated = await grievanceService.addComment(
        selectedTicket.id,
        newComment.trim(),
        profile?.full_name || 'Enrolled Student',
        user?.id
      );
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setIsSendingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Statutory Student Redressal &amp; Ombudsman Desk
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Grievance &amp; Issue Tracking Portal
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Log discrepancy tickets for attendance rectification, missing CIA marks, examination slips, or fee accounting with guaranteed SLA timers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-3d-gold px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise New Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Ticket List on left, Selected Ticket Details & Chat on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">All Grievance Tickets ({tickets.length})</span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              UGC Ombudsman Compliant
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <LifeBuoy className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No grievance tickets filed</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click "Raise New Issue" above to file a request.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-blue-50/50 border-[#1E5AA8] shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-white px-2 py-0.5 rounded border border-blue-200">
                        {t.ticket_no}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F2747] line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100">
                      <span>{t.created_at}</span>
                      <span className="capitalize font-semibold text-slate-600">{t.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Detail & Thread (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedTicket.ticket_no}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Category: {selectedTicket.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        selectedTicket.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedTicket.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Priority: {selectedTicket.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                    <span>SLA: {selectedTicket.sla_days} Days Max</span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-[#0F2747]">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status Stepper Tracker */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resolution Status Tracker</p>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  <div className="p-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    1. Submitted ✓
                  </div>
                  <div
                    className={`p-1.5 rounded border ${
                      selectedTicket.status !== 'submitted'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2. Assigned {selectedTicket.status !== 'submitted' && '✓'}
                  </div>
                  <div
                    className={`p-1.5 rounded border ${
                      selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved'
                        ? 'bg-blue-100 text-[#1E5AA8] border-blue-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3. Under Review
                  </div>
                  <div
                    className={`p-1.5 rounded border ${
                      selectedTicket.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    4. Resolved
                  </div>
                </div>

                {selectedTicket.assigned_to && (
                  <p className="text-[11px] text-slate-600 pt-1">
                    Assigned Officer: <strong>{selectedTicket.assigned_to}</strong> ({selectedTicket.department})
                  </p>
                )}
              </div>

              {/* Resolution Note if present */}
              {selectedTicket.resolution_note && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Official Resolution Findings
                  </span>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {selectedTicket.resolution_note}
                  </p>
                </div>
              )}

              {/* Comments Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0F2747] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#1E5AA8]" />
                  Official Communication Thread
                </h4>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedTicket.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        c.role === 'student'
                          ? 'bg-blue-50/50 border-blue-200 ml-6'
                          : c.role === 'officer'
                          ? 'bg-amber-50/50 border-amber-200 mr-6'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-[#0F2747]">{c.sender}</span>
                        <span className="text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type follow-up response or clarification..."
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                  />
                  <button
                    type="submit"
                    disabled={isSendingComment || !newComment.trim()}
                    className="btn-3d-gold px-4 py-2 text-xs font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Select a ticket from the list to view tracking details.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Issue Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">File an Academic Grievance</h3>
                <p className="text-xs text-slate-500">UGC Student Redressal Cell &bull; Standard SLA Applies</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
                aria-label="Close lodge grievance modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="attendance">Attendance Discrepancy</option>
                    <option value="marks">Internal / CIA Marks Missing</option>
                    <option value="fee">Fee Ledger &amp; Scholarship</option>
                    <option value="hall_ticket">Hall Ticket &amp; Exam Room</option>
                    <option value="other">General Academic Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as GrievancePriority)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="low">Low (Standard 7-Day SLA)</option>
                    <option value="medium">Medium (5-Day SLA)</option>
                    <option value="high">High (3-Day SLA)</option>
                    <option value="urgent">Urgent (48-Hour Exam SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Absent mark on 18 April DBMS lecture despite physical presence"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description &amp; Evidence</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details: date, period, classroom number, faculty name, and context..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-3d-gold px-5 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Ticket...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
