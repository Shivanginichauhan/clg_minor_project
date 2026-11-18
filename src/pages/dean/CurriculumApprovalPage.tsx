import React, { useState, useEffect } from 'react';
import {
  BookOpen,
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
  GraduationCap,
  Sparkles,
  Lock,
  Calendar,
  Building
} from 'lucide-react';
import { deanService, CurriculumProposal } from '../../services/deanService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const CurriculumApprovalPage: React.FC = () => {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<CurriculumProposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState<CurriculumProposal | null>(null);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [deanPin, setDeanPin] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setProposals(deanService.getCurriculumProposals());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.proposalCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenApprove = (prop: CurriculumProposal) => {
    setSelectedProposal(prop);
    setDeanPin('');
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    const pinCheck = deanService.verifyDeanPin(deanPin);
    if (!pinCheck.valid) {
      setMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean PIN' });
      return;
    }

    try {
      const approved = deanService.approveCurriculumProposal(
        selectedProposal.id,
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma (Dean Academic Affairs)',
        deanPin,
        profile?.id
      );

      setMessage({
        type: 'success',
        text: `BoS Proposal ${selectedProposal.proposalCode} officially ratified under Academic Council Seal: ${approved.deanSignatureToken}!`
      });
      setIsApproveModalOpen(false);
      loadData();
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve proposal.' });
    }
  };

  const pendingCount = proposals.filter(p => p.status === 'pending_dean').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Board of Studies (BoS) Curriculum Governance Authority</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Curriculum &amp; Syllabus Governance Desk
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Ratify Board of Studies syllabus revisions, elective introductions, NEP 2020 credit restructuring, and course learning outcomes before publishing to student registration catalogs.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Awaiting Council</span>
              <div className="text-2xl font-academic-display font-extrabold text-amber-400 mt-0.5">
                {pendingCount} Proposals
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">BoS Recommended</span>
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
            placeholder="Search proposal code, program, or subject..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Change Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747]"
          >
            <option value="ALL">All Proposals ({proposals.length})</option>
            <option value="new_elective">New Elective Introductions</option>
            <option value="credit_restructuring">NEP 2020 Credit Restructuring</option>
            <option value="syllabus_revision">Course Syllabus Updates</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
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
                    {item.proposalCode}
                  </span>
                  <span className="font-bold text-sm text-[#0F2747]">{item.programName}</span>
                  <span className="badge-3d text-[10px] font-bold px-2 py-0.5 uppercase bg-blue-50 text-[#1E5AA8] border-blue-200">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Effective: {item.academicYearEffective}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  {item.departmentName} &bull; BoS Meeting: {item.bosMeetingDate}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge-3d text-[11px] font-bold px-2.5 py-1 ${
                  item.status === 'council_approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {item.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-xs text-[#0F2747]">{item.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800">BoS Rationale:</span> {item.rationale}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Credit Structure</span>
                  <span className="font-bold text-[#0F2747]">
                    {item.creditsBefore} Credits &rarr; {item.creditsAfter} Credits
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Industry Advisory Score</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {item.industryFeedbackScore} / 5.0 (High Alignment)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">NEP 2020 Compliance</span>
                  <span className="font-bold text-[#1E5AA8]">Verified CBCS Framework</span>
                </div>
              </div>

              {item.deanSignatureToken && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold">Ratified by Dean of Academic Affairs:</span>
                    <span className="font-mono text-[11px] ml-2 font-bold text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded">
                      {item.deanSignatureToken}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-semibold">Published to Catalog</span>
                </div>
              )}
            </div>

            {item.status === 'pending_dean' && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenApprove(item)}
                  className="btn-3d-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Ratify Curriculum Revision</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── RATIFY MODAL WITH DEAN PIN ── */}
      {isApproveModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">
                  Ratify Board of Studies Syllabus
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedProposal.proposalCode}</p>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                Ratifying will append this course into the university academic syllabus master. A unique cryptographic token will be published on student portals.
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
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
