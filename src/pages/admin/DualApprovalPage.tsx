import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  FileText,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Hash
} from 'lucide-react';
import { adminService, MakerCheckerRequest } from '../../services/adminService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DualApprovalPage: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MakerCheckerRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReq, setSelectedReq] = useState<MakerCheckerRequest | null>(null);

  // Authorize Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [checkerPin, setCheckerPin] = useState('');
  const [authNotes, setAuthNotes] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Create Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOpType, setNewOpType] = useState<MakerCheckerRequest['operation_type']>('EXAM_SCHEDULE_UNLOCK');
  const [newTargetEntity, setNewTargetEntity] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadRequests = () => {
    setRequests(adminService.getApprovalRequests());
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'PENDING_SECOND_APPROVAL').length;
  const authorizedCount = requests.filter((r) => r.status === 'AUTHORIZED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target_entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requested_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.operation_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenAuthorize = (req: MakerCheckerRequest) => {
    setSelectedReq(req);
    setCheckerPin('');
    setAuthNotes('');
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const handleExecuteAuthorize = () => {
    if (!selectedReq) return;
    setAuthError(null);

    const approverName = profile?.full_name || 'Controller of Examinations (Checker)';
    const result = adminService.authorizeRequest(selectedReq.id, approverName, checkerPin, authNotes);

    if (!result.success) {
      setAuthError(result.message);
      return;
    }

    setAuthSuccess(`Operation "${selectedReq.title}" authorized successfully.`);
    setIsAuthModalOpen(false);
    loadRequests();
    setTimeout(() => setAuthSuccess(null), 5000);
  };

  const handleOpenReject = (req: MakerCheckerRequest) => {
    setSelectedReq(req);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleExecuteReject = () => {
    if (!selectedReq) return;
    if (!rejectReason.trim()) {
      setAuthError('Please provide a reason for statutory rejection.');
      return;
    }

    const approverName = profile?.full_name || 'Controller of Examinations (Checker)';
    adminService.rejectRequest(selectedReq.id, approverName, rejectReason);

    setAuthSuccess(`Operation "${selectedReq.title}" rejected and logged to audit.`);
    setIsRejectModalOpen(false);
    loadRequests();
    setTimeout(() => setAuthSuccess(null), 5000);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTargetEntity.trim()) return;

    adminService.submitApprovalRequest({
      operation_type: newOpType,
      title: newTitle,
      description: newDescription,
      target_entity: newTargetEntity,
      requested_by: profile?.full_name || 'Administrative Maker',
      payload: { created_via: 'Admin Dual Approval Portal', initiated_at: new Date().toISOString() }
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewTargetEntity('');
    setNewDescription('');
    setAuthSuccess('Dual-authorization request created and queued for second sign-off.');
    loadRequests();
    setTimeout(() => setAuthSuccess(null), 5000);
  };

  const getOpBadge = (op: MakerCheckerRequest['operation_type']) => {
    switch (op) {
      case 'DB_HARD_RESET':
      case 'DEPARTMENT_PURGE':
      case 'DEGREE_PROGRAM_PURGE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RESULT_GAZETTE_PUBLISH':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'HIGH_VALUE_REFUND':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EXAM_SCHEDULE_UNLOCK':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Statutory Dual Governance Desk</span>
              </span>
              <span className="text-[11px] text-slate-300 font-semibold">
                Maker-Checker Separation of Duties (Four-Eyes Principle)
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Two-Person Approval &amp; Authorization Matrix
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              High-impact university operations—such as timetable unfreezes, gazette releases, institutional purges, and high-value refund settlements—require secondary statutory checker verification with cryptographic SHA-256 ledger chaining.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-amber-300 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate High-Impact Operation</span>
            </button>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {authSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{authSuccess}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Awaiting Second Sign-off</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending Statutory Checker</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Authorized &amp; Executed</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{authorizedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Dual-Validated Operations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Vetoed / Rejected</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{rejectedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Checker Declined with Notes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-indigo-600">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Cryptographic Chaining</span>
          <div className="text-sm font-extrabold text-indigo-700 mt-2 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>SHA-256 Ledger Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Immutable Audit Trail</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'PENDING_SECOND_APPROVAL', 'AUTHORIZED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === tab
                  ? 'bg-[#0F2747] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL'
                ? 'All Ledger Requests'
                : tab === 'PENDING_SECOND_APPROVAL'
                ? `Pending Sign-off (${pendingCount})`
                : tab === 'AUTHORIZED'
                ? 'Authorized'
                : 'Rejected'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entity, maker or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747] w-64"
            />
          </div>
          <button
            onClick={loadRequests}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Requests Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Operation &amp; Title</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Maker (Initiator)</th>
                <th className="py-3 px-4">Security Hash</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No dual-approval requests found matching filters</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getOpBadge(req.operation_type)}`}>
                          {req.operation_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-bold text-[#0F2747] mt-1">{req.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{req.description}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {req.target_entity}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{req.requested_by}</div>
                      <div className="text-[10px] text-slate-400">{req.requested_at}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded max-w-[150px] truncate" title={req.security_hash}>
                        <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{req.security_hash}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border uppercase ${
                          req.status === 'AUTHORIZED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {req.status === 'PENDING_SECOND_APPROVAL' ? 'Pending Checker' : req.status}
                      </span>
                      {req.authorized_by && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          By: {req.authorized_by}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING_SECOND_APPROVAL' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAuthorize(req)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sign-off</span>
                          </button>
                          <button
                            onClick={() => handleOpenReject(req)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Concluded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorize (Sign-off) Modal */}
      {isAuthModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Checker Statutory Dual Sign-off</h3>
                <p className="text-xs text-slate-500">Provide authorization PIN to validate high-impact execution</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Operation:</span>
                <span className="font-bold text-slate-800">{selectedReq.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Entity:</span>
                <span className="font-mono font-semibold text-slate-700">{selectedReq.target_entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maker:</span>
                <span className="font-semibold text-slate-700">{selectedReq.requested_by} ({selectedReq.requested_at})</span>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Checker Security PIN <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-normal text-slate-400 ml-2">(Default sandbox PIN: 7729 or 1234)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={checkerPin}
                  onChange={(e) => setCheckerPin(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statutory Authorization Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Reviewed statutory compliance and approved timetable unlock for subject codes..."
                  value={authNotes}
                  onChange={(e) => setAuthNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAuthorize}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Grant Dual Authorization</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Reject Operation</h3>
                <p className="text-xs text-slate-500">Provide official rationale for declining statutory execution</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Veto / Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="State statutory reason for refusal..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReject}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Record Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Initiate Dual-Signoff Request</h3>
                <p className="text-xs text-slate-500">Queue a sensitive operation for statutory checker authorization</p>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operation Classification</label>
                <select
                  value={newOpType}
                  onChange={(e) => setNewOpType(e.target.value as MakerCheckerRequest['operation_type'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                >
                  <option value="EXAM_SCHEDULE_UNLOCK">EXAM_SCHEDULE_UNLOCK — Post-Publish Timetable Revision</option>
                  <option value="RESULT_GAZETTE_PUBLISH">RESULT_GAZETTE_PUBLISH — Official Result Gazette Publication</option>
                  <option value="HIGH_VALUE_REFUND">HIGH_VALUE_REFUND — Fee Refund Settlement &gt; ₹25,000</option>
                  <option value="DEPARTMENT_PURGE">DEPARTMENT_PURGE — Academic Department Archive/Purge</option>
                  <option value="DEGREE_PROGRAM_PURGE">DEGREE_PROGRAM_PURGE — Degree Program Decommission</option>
                  <option value="DB_HARD_RESET">DB_HARD_RESET — Database Partition Reset</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operation Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Unlock MCA Sem-2 Master Timetable for Hall Relocation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Entity / Ref Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., EXAM-CYCLE-EVEN-2026 or MCA-201"
                  value={newTargetEntity}
                  onChange={(e) => setNewTargetEntity(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justification &amp; Impact Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this operation is warranted and what safety measures were verified..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Queue for Second Sign-off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
