import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Check,
  X,
  Send,
  Eye,
  UserCheck,
  Sparkles,
  ArrowRight,
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { resultsService } from '../../services/resultsService.js';
import { RevaluationApplication } from '../../data/mockResults.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { studentNotificationService } from '../../services/studentNotificationService.js';

export const RevaluationManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<RevaluationApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scrutiny modal
  const [selectedApp, setSelectedApp] = useState<RevaluationApplication | null>(null);
  const [revisedMarks, setRevisedMarks] = useState<number>(0);
  const [scrutinyRemarks, setScrutinyRemarks] = useState<string>('');
  const [assignedEvaluator, setAssignedEvaluator] = useState<string>('External Valuation Board #2');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const list = resultsService.getRevaluations();
    setApplications(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenScrutiny = (app: RevaluationApplication) => {
    setSelectedApp(app);
    setRevisedMarks(app.revised_marks ?? app.original_marks);
    setScrutinyRemarks(app.scrutiny_remarks || '');
    setAssignedEvaluator(app.assigned_evaluator_name || 'Prof. K. N. Rao, Senior External Examiner');
  };

  const handleSaveScrutiny = () => {
    if (!selectedApp) return;

    if (revisedMarks < 0 || revisedMarks > 100) {
      setMessage({ type: 'error', text: 'Revised marks must be between 0 and 100.' });
      return;
    }

    const resolved = resultsService.resolveRevaluation(
      selectedApp.id,
      revisedMarks,
      scrutinyRemarks || 'Re-evaluation completed following re-assessment by external examiner.',
      assignedEvaluator || profile?.full_name || 'Controller of Examinations'
    );

    // Dispatch official notification to candidate
    studentNotificationService.addNotification({
      title: `Re-evaluation Resolved: ${selectedApp.subject_code}`,
      message: `Your re-evaluation petition (${selectedApp.application_number}) for ${selectedApp.subject_name} has been resolved with score ${revisedMarks} / 100 (${resolved?.revised_grade || 'Updated'}). Your SGPA and grade sheet have been synchronized.`,
      category: 'exam',
      priority: 'success',
      action_label: 'View Updated Grade Card',
      action_url: '/student/results'
    }, selectedApp.student_id);

    setSelectedApp(null);
    setMessage({
      type: 'success',
      text: `Application ${selectedApp.application_number} processed. Revised marks (${revisedMarks}) updated in student grade card and notification dispatched.`,
    });
    loadData();
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.application_number.toLowerCase().includes(q) ||
        app.student_name.toLowerCase().includes(q) ||
        app.roll_number.toLowerCase().includes(q) ||
        app.subject_code.toLowerCase().includes(q) ||
        app.subject_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              Examination Cell Scrutiny Unit
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Re-evaluation &amp; Re-totaling Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Answer Script Re-evaluation &amp; Scrutiny Management
          </h1>
          <p className="text-xs text-[#64748B]">
            Process student requests for re-evaluation, re-totaling, and certified answer script photocopies with automatic grade card updates.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs">
          <div>
            <span className="text-[#64748B] text-[10px] uppercase font-bold block">Total Applications</span>
            <span className="text-sm font-extrabold text-[#0F2747]">{applications.length} Received</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-[#64748B] text-[10px] uppercase font-bold block">Pending Valuation</span>
            <span className="text-sm font-extrabold text-amber-600">
              {applications.filter((a) => a.status === 'applied' || a.status === 'under_scrutiny').length} Cases
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'applied', 'under_scrutiny', 'revised', 'no_change'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-[#0F2747] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search app no, roll, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F2747] focus:outline-none focus:ring-1 focus:ring-[#1E5AA8]"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-[#64748B] uppercase">
                <th className="py-3 px-4">App Number</th>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">Subject &amp; Service</th>
                <th className="py-3 px-4 text-center">Original Marks</th>
                <th className="py-3 px-4 text-center">Revised Marks</th>
                <th className="py-3 px-4 text-center">Fee Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => {
                  const isRevised = app.status === 'revised';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#1E5AA8]">{app.application_number}</div>
                        <div className="text-[10px] text-[#64748B]">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </div>
                        {(() => {
                          const elapsedDays = Math.max(1, Math.floor((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 3600 * 24)));
                          const isBreached = elapsedDays > 15;
                          const isClose = elapsedDays >= 10;
                          return (
                            <span
                              className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${
                                app.status === 'revised' || app.status === 'no_change'
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : isBreached
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isClose
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              SLA: {elapsedDays}/15d {isBreached && app.status !== 'revised' ? '⚠️' : ''}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F2747]">{app.student_name}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">Roll: {app.roll_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F2747]">
                          <span className="font-mono text-[#1E5AA8]">{app.subject_code}</span> &bull; {app.subject_name}
                        </div>
                        <div className="text-[10px] text-purple-700 font-bold uppercase mt-0.5">
                          {app.service_type.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-700">
                          {app.original_marks} <span className="text-slate-400">({app.original_grade})</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {app.revised_marks !== undefined ? (
                          <span
                            className={`font-mono font-extrabold px-2 py-0.5 rounded ${
                              isRevised ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-600'
                            }`}
                          >
                            {app.revised_marks} ({app.revised_grade})
                            {app.marks_difference && app.marks_difference > 0 && (
                              <span className="text-emerald-600 text-[10px] ml-1">+{app.marks_difference}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> ₹{app.fee_amount} Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            app.status === 'revised'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'under_scrutiny'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : app.status === 'applied'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenScrutiny(app)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition shadow-xs"
                        >
                          {app.status === 'revised' || app.status === 'no_change' ? 'View / Edit' : 'Evaluate &amp; Enter Marks'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No re-evaluation applications found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scrutiny / Valuation Resolution Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F2747]">Evaluate &amp; Record Revised Marks</h3>
                  <p className="text-[11px] text-[#64748B]">App: {selectedApp.application_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Candidate:</span>
                <span className="font-bold text-[#0F2747]">{selectedApp.student_name} ({selectedApp.roll_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Subject:</span>
                <span className="font-bold text-[#0F2747]">{selectedApp.subject_code} - {selectedApp.subject_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Service Type:</span>
                <span className="font-bold text-purple-700 uppercase">{selectedApp.service_type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Original Score:</span>
                <span className="font-bold font-mono text-slate-800">{selectedApp.original_marks} / 100 (Grade {selectedApp.original_grade})</span>
              </div>
              {selectedApp.digitized_copy_available && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-[#64748B]">Digitized Answer Script:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    Verified Scanned Copy Attached
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Assigned External Evaluator / Scrutiny Committee
                </label>
                <input
                  type="text"
                  value={assignedEvaluator}
                  onChange={(e) => setAssignedEvaluator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Revised Total Marks (out of 100)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={revisedMarks}
                    onChange={(e) => setRevisedMarks(Number(e.target.value))}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-mono font-bold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                  />
                  <div className="text-xs text-slate-600">
                    Difference: <strong className={revisedMarks > selectedApp.original_marks ? 'text-emerald-600' : 'text-slate-600'}>
                      {revisedMarks - selectedApp.original_marks > 0 ? `+${revisedMarks - selectedApp.original_marks}` : revisedMarks - selectedApp.original_marks} Marks
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Scrutiny Committee Observations &amp; Minutes
                </label>
                <textarea
                  rows={2}
                  placeholder="Note any questions re-evaluated or re-totaling corrections made..."
                  value={scrutinyRemarks}
                  onChange={(e) => setScrutinyRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScrutiny}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Commit Revised Grade &amp; Update Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
