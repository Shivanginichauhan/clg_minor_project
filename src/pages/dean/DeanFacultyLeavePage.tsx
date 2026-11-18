import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  Award,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  ShieldCheck,
  AlertCircle,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { deanService, FacultyDeanApproval } from '../../services/deanService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DeanFacultyLeavePage: React.FC = () => {
  const { profile } = useAuth();
  const [approvals, setApprovals] = useState<FacultyDeanApproval[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedApproval, setSelectedApproval] = useState<FacultyDeanApproval | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'referred_back'>('approved');
  const [deanRemarks, setDeanRemarks] = useState('');
  const [deanPin, setDeanPin] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setApprovals(deanService.getFacultyApprovals());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = approvals.filter((a) => {
    const matchesSearch =
      a.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenReview = (app: FacultyDeanApproval, action: 'approved' | 'rejected' | 'referred_back') => {
    setSelectedApproval(app);
    setReviewAction(action);
    setDeanRemarks(
      action === 'approved'
        ? 'Approved by Dean. Proxy class arrangements verified and institutional service endorsed.'
        : 'Referred back to Department HOD for schedule realignment.'
    );
    setDeanPin('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean PIN' });
      return;
    }

    try {
      deanService.reviewFacultyApproval(
        selectedApproval.id,
        reviewAction,
        deanRemarks,
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma (Dean Academic Affairs)',
        deanPin,
        profile?.id
      );

      setMessage({
        type: 'success',
        text: `Faculty case for ${selectedApproval.facultyName} has been ${reviewAction.replace(/_/g, ' ')}!`
      });
      setIsReviewModalOpen(false);
      loadData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to review request.' });
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending_dean').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Faculty Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory Leave, CAS Promotion &amp; FDP Approval Desk</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Faculty Leave, Appraisal &amp; Deputation Governance
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Adjudicate faculty leave escalations with lecture calendar impact assessment, verify UGC Career Advancement Scheme (CAS) API scores, and approve national conference/FDP sponsorships.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Awaiting Dean</span>
              <div className="text-2xl font-academic-display font-extrabold text-amber-400 mt-0.5">
                {pendingCount} Cases
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">HOD Endorsed</span>
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

      {/* Filter Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty name, department, or case title..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747]"
          >
            <option value="ALL">All Categories ({approvals.length})</option>
            <option value="leave">Medical / Academic Leave</option>
            <option value="cas_promotion">UGC CAS Promotion (API Verification)</option>
            <option value="fdp_sabbatical">FDP / Conference Deputation</option>
            <option value="probation_confirmation">Probation Confirmations</option>
          </select>
        </div>
      </div>

      {/* Case Dossier Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-amber-400/80 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0F2747]">{item.facultyName}</span>
                  <span className="text-xs text-slate-500 font-medium">({item.designation})</span>
                  <span className={`badge-3d text-[10px] font-bold px-2 py-0.5 uppercase ${
                    item.type === 'cas_promotion' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    item.type === 'leave' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-blue-50 text-[#1E5AA8] border-blue-200'
                  }`}>
                    {item.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{item.departmentName}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge-3d text-[11px] font-bold px-2.5 py-1 ${
                  item.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  item.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                  'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {item.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Case Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-slate-900">{item.title}</h3>

              {item.type === 'leave' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Requested Dates</span>
                    <span className="font-bold text-[#0F2747]">{item.datesRequested}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Lecture Impact</span>
                    <span className="font-bold text-amber-800">{item.classesImpactedCount} Classes Scheduled</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Proxy Arrangement</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.proxyFacultyName}
                    </span>
                  </div>
                </div>
              )}

              {item.type === 'cas_promotion' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs">
                  <div>
                    <span className="text-purple-600 text-[10px] uppercase font-bold block">UGC Category Claimed</span>
                    <span className="font-bold text-purple-950">{item.apiScoreClaimed} API Points</span>
                  </div>
                  <div>
                    <span className="text-purple-600 text-[10px] uppercase font-bold block">IQAC Verified Score</span>
                    <span className="font-bold text-purple-950 font-mono">{item.apiScoreVerified} Points (Pass: 110)</span>
                  </div>
                  <div>
                    <span className="text-purple-600 text-[10px] uppercase font-bold block">Screening Committee</span>
                    <span className="font-bold text-emerald-700">Recommended for Selection</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800">HOD Recommendation:</span> {item.hodRemarks}
              </div>

              {item.deanRemarks && (
                <div className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="font-bold">Dean Directive:</span> {item.deanRemarks}
                </div>
              )}
            </div>

            {/* Actions */}
            {item.status === 'pending_dean' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenReview(item, 'referred_back')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Refer Back to HOD
                </button>
                <button
                  onClick={() => handleOpenReview(item, 'rejected')}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleOpenReview(item, 'approved')}
                  className="btn-3d-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Sanction Approval</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── REVIEW MODAL WITH DEAN PIN ── */}
      {isReviewModalOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] capitalize">
                  {reviewAction.replace(/_/g, ' ')} Faculty Request
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedApproval.facultyName} &bull; {selectedApproval.departmentName}
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dean Statutory Remarks / Endorsement
                </label>
                <textarea
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  rows={3}
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
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  Confirm &amp; Log Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
