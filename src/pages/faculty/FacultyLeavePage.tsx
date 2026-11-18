import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { facultyLeaveService, LeaveBalance, LeaveApplication, LeaveType } from '../../services/facultyLeaveService.js';
import { timetableService, TimetableSlot } from '../../services/timetableService.js';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  PlusCircle,
  ShieldCheck,
  X,
  Printer,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyLeavePage: React.FC = () => {
  const { profile, user } = useAuth();
  const facultyId = user?.id || '';
  const facultyName = profile?.full_name || user?.user_metadata?.full_name || 'Faculty Member';

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'balances' | 'apply' | 'history'>('balances');
  
  // Application form state
  const [leaveType, setLeaveType] = useState<LeaveType>('CL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [proxyFaculty, setProxyFaculty] = useState<string>('Prof. Rajesh Sharma');
  const [proxyArranged, setProxyArranged] = useState<boolean>(true);
  const [affectedSlots, setAffectedSlots] = useState<TimetableSlot[]>([]);
  
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, [facultyId]);

  const loadData = () => {
    setBalances(facultyLeaveService.getBalances(facultyId));
    setApplications(facultyLeaveService.getApplications(facultyId));
  };

  // Compute total days
  const computeDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  // Detect affected lecture slots when date changes
  useEffect(() => {
    if (!startDate) {
      setAffectedSlots([]);
      return;
    }
    const dayOfWeek = new Date(startDate).toLocaleDateString('en-US', { weekday: 'long' });
    timetableService.getAllSlots().then((slots) => {
      const match = slots.filter(
        (s) =>
          s.day.toLowerCase() === dayOfWeek.toLowerCase() &&
          (s.faculty_id === facultyId || s.faculty_name.toLowerCase().includes(facultyName.toLowerCase().split(' ')[0]))
      );
      setAffectedSlots(match);
    });
  }, [startDate, facultyId, facultyName]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setToastMessage({ text: 'Please complete all required fields.', type: 'error' });
      return;
    }

    if (!facultyId) {
      setToastMessage({ text: 'Session expired. Please log in again.', type: 'error' });
      return;
    }

    const totalDays = computeDays();
    const balance = balances.find((b) => b.type === leaveType);
    if (balance && totalDays > balance.remaining) {
      setToastMessage({
        text: `Requested ${totalDays} days exceeds your available ${leaveType} balance (${balance.remaining} days).`,
        type: 'error',
      });
      return;
    }

    const proxyNotes = proxyArranged
      ? `Proxy arranged with ${proxyFaculty} for ${affectedSlots.length} lecture period(s)`
      : 'No proxy required (Independent study / Exam day)';

    await facultyLeaveService.applyLeave({
      faculty_id: facultyId,
      faculty_name: facultyName,
      department: 'Department of Computer Science & Engineering',
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
      proxy_arranged: proxyArranged,
      proxy_details: proxyNotes,
    });

    setToastMessage({
      text: `Leave application for ${totalDays} day(s) submitted successfully for HOD recommendation and Dean sanction!`,
      type: 'success',
    });
    setReason('');
    setStartDate('');
    setEndDate('');
    setActiveTab('history');
    loadData();
  };

  const handleCancel = (id: string) => {
    if (window.confirm('Withdraw this pending leave application?')) {
      facultyLeaveService.cancelApplication(id);
      loadData();
      setToastMessage({ text: 'Leave application withdrawn.', type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss alert">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[11px] px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>Statutory Faculty Service Ledger</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UGC Regulation &bull; Leave Rules 2026</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Faculty Leave Management &amp; Class Proxy Linkage
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Track your statutory Casual, Earned, Duty, and Medical leave quotas. File digital leave applications, attach class substitution proxies, and receive Dean sanction order sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('apply')}
              className="btn-3d-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white text-emerald-900 hover:bg-emerald-50"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Apply New Leave</span>
            </button>
            <Link
              to="/faculty/timetable"
              className="btn-3d-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 border-white/20"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Teaching Schedule</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Leave Quota Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const pct = Math.round((b.availed / b.total) * 100);
          return (
            <div key={b.type} className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {b.title}
                </span>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-[#0F2747]">
                  {b.remaining} Left
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-[#0F2747]">
                  {b.remaining} <span className="text-xs font-normal text-slate-400">/ {b.total} Days</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{b.availed} Availed</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    b.type === 'CL'
                      ? 'bg-emerald-500'
                      : b.type === 'EL'
                      ? 'bg-blue-500'
                      : b.type === 'ML'
                      ? 'bg-rose-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="card-3d bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'balances' ? 'bg-white text-[#1E5AA8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leave Policy &amp; Rules
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'apply' ? 'bg-white text-[#1E5AA8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Apply for Leave Form
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-[#1E5AA8] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leave History &amp; Orders ({applications.length})
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-3d-secondary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 text-slate-700 bg-slate-50 border-slate-200"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* TAB 1: Leave Rules & Policy */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Statutory Leave Categories &amp; Guidelines</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">Casual Leave (CL) &ndash; 12 Days/Year</strong>
                <p>Intended for unforeseen personal urgencies. Cannot be combined with vacation or joined for more than 4 consecutive working days without Special Dean sanction.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">Earned Leave (EL) &ndash; 15 Days/Year</strong>
                <p>Credited on 1st January and 1st July. Un-availed EL accumulates up to a maximum statutory ceiling of 300 days for encashment upon superannuation.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">On Duty / Duty Leave (OD) &ndash; 15 Days/Year</strong>
                <p>Granted for attending national/international conferences, BoS academic council meetings, peer evaluation, and government university committee meetings.</p>
              </div>
            </div>
          </div>

          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#1E5AA8]" />
              <span>Class Substitution &amp; Proxy Mandate</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under University Regulation 24, no teaching faculty member may proceed on leave without ensuring that all allocated lecture and practical laboratory sessions are handed over to a designated departmental colleague.
            </p>
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Automatic Timetable Linkage:</span>
              </span>
              <p>
                When you apply for leave on this portal, the system cross-references your teaching timetable, identifies the affected lecture slots, and generates an official proxy notice for your substitute colleague and registered students.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('apply')}
                className="btn-3d-primary w-full py-2.5 text-xs font-bold text-center block"
              >
                Proceed to Apply for Leave &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Apply Form */}
      {activeTab === 'apply' && (
        <div className="card-3d bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xs max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#0F2747] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Digital Faculty Leave Application Form</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Submit your request for statutory HOD verification and Dean of Academic Affairs sanction.
            </p>
          </div>

          <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
            {/* Leave Type */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Select Leave Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['CL', 'EL', 'ML', 'OD'] as LeaveType[]).map((type) => {
                  const b = balances.find((bal) => bal.type === type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        leaveType === type
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm block">{type}</span>
                      <span className="text-[10px] text-slate-500">{b?.remaining ?? 0} days remaining</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 font-semibold">
                <span>Duration Requested:</span>
                <span className="font-mono font-bold text-sm">{computeDays()} Calendar Working Day(s)</span>
              </div>
            )}

            {/* Affected Lecture Classes Detection */}
            {affectedSlots.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Affected Lecture Classes on {new Date(startDate).toLocaleDateString('en-US', { weekday: 'long' })}:</span>
                </span>
                <div className="space-y-1.5">
                  {affectedSlots.map((s) => (
                    <div key={s.id} className="p-2 bg-white rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                      <span className="font-bold text-slate-800">{s.subject_code} &bull; {s.subject_name}</span>
                      <span className="font-mono text-slate-600">Period {s.period_number} ({s.start_time} - {s.end_time}) &bull; Room {s.room_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proxy Arrangement Linkage */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Teaching Proxy / Class Substitution Arrangement</span>
                </label>
                <input
                  type="checkbox"
                  checked={proxyArranged}
                  onChange={(e) => setProxyArranged(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {proxyArranged && (
                <div>
                  <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                    Substitute Faculty Member:
                  </label>
                  <select
                    value={proxyFaculty}
                    onChange={(e) => setProxyFaculty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Prof. Rajesh Sharma">Prof. Rajesh Sharma (Assistant Professor - Systems)</option>
                    <option value="Dr. Ananya Sen">Dr. Ananya Sen (Associate Professor - Networks)</option>
                    <option value="Prof. Vikramaditya Rao">Prof. Vikramaditya Rao (Professor - AI/ML)</option>
                    <option value="Dr. Sneha Roy">Dr. Sneha Roy (Assistant Professor - Databases)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Detailed Reason &amp; Official Purpose</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify clinical sickness, conference presentation details, or personal urgency..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-600 resize-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('balances')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-3d-primary px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Statutory Leave Application</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Leave Application Registry &amp; Sanction Status</h2>
              <p className="text-xs text-slate-500">Official log of submitted leave applications with multi-tier statutory approval trail</p>
            </div>
            <span className="badge-3d text-xs font-bold bg-slate-100 text-slate-700">
              {applications.length} Records
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No leave applications recorded in your service registry.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Leave Ref &amp; Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason &amp; Proxy</th>
                    <th className="py-3 px-4">Status &amp; Sanctions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <strong className="text-slate-800 block text-xs">{app.id}</strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {app.leave_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div>{app.start_date} to {app.end_date}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {app.total_days} Day(s)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 line-clamp-1 font-medium">{app.reason}</div>
                        {app.proxy_details && (
                          <div className="text-[10px] text-emerald-700 truncate mt-0.5">
                            {app.proxy_details}
                          </div>
                        )}
                        {app.hod_remarks && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">
                            HOD: {app.hod_remarks}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`badge-3d text-[10px] font-bold ${
                            app.status === 'approved_dean'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'pending_hod'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {app.status === 'approved_dean'
                            ? '✓ Dean Sanctioned'
                            : app.status === 'pending_hod'
                            ? '⏳ Pending HOD Review'
                            : app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {app.status === 'pending_hod' && (
                          <button
                            onClick={() => handleCancel(app.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] hover:underline cursor-pointer"
                          >
                            Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
