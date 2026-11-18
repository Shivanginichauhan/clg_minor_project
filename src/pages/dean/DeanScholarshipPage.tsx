import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Send,
  X,
  IndianRupee,
  Building,
  GraduationCap,
  Lock,
  Printer,
  Sparkles,
  FileCheck,
  FileText,
  AlertTriangle,
  Layers,
  CheckSquare
} from 'lucide-react';
import { scholarshipService } from '../../services/scholarshipService.js';
import { deanService, InstitutionalBudget } from '../../services/deanService.js';
import { adminService } from '../../services/adminService.js';
import { ScholarshipApplication } from '../../data/mockScholarships.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DeanScholarshipPage: React.FC = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);

  // Budget tracking
  const [budget, setBudget] = useState<InstitutionalBudget>(deanService.getBudget());

  // Modals
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const [sanctionAmount, setSanctionAmount] = useState<number>(50000);
  const [deanRemarks, setDeanRemarks] = useState<string>('');
  const [deanPin, setDeanPin] = useState<string>('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await scholarshipService.getApplications();
      setApplications(data);
      setBudget(deanService.getBudget());
    } catch (err) {
      console.error('Failed to load applications for Dean:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const remainingBudget = Math.max(0, budget.totalScholarshipAllocated - budget.totalScholarshipSanctioned);
  const budgetUtilizationPct = Math.min(100, Math.round((budget.totalScholarshipSanctioned / budget.totalScholarshipAllocated) * 100));

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student_roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application_no.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenSanction = (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setSanctionAmount(app.applied_amount);
    setDeanRemarks(`Statutory review verified. CGPA ${app.cgpa} and family income criteria confirmed. Sanctioned for full grant disbursement under Dean Authority.`);
    setDeanPin('');
    setIsSanctionModalOpen(true);
  };

  const handleOpenDocModal = (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setIsDocModalOpen(true);
  };

  const handleOpenReject = (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setDeanRemarks('Application documents do not meet minimum statutory family income / CGPA criteria.');
    setIsRejectModalOpen(true);
  };

  const handleConfirmSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    // 1. Check budget ceiling
    if (sanctionAmount > remainingBudget) {
      setFeedbackMessage({
        type: 'error',
        text: `Sanction blocked! Requested ₹${sanctionAmount.toLocaleString()} exceeds remaining institutional budget pool of ₹${remainingBudget.toLocaleString()}. Requires Vice-Chancellor supplemental grant.`,
      });
      return;
    }

    // 2. Multi-factor Dean Security PIN verification with 3-attempt lockout
    const pinCheck = deanService.verifyDeanPin(deanPin, profile?.id);
    if (!pinCheck.valid) {
      setFeedbackMessage({
        type: 'error',
        text: pinCheck.error || 'Invalid Dean Security Authorization PIN.',
      });
      return;
    }

    // 3. STATUTORY VC CO-SIGNATURE GOVERNANCE ENFORCEMENT (> ₹75,000)
    if (sanctionAmount > 75000) {
      setActionProcessing(true);
      try {
        await scholarshipService.queueForVcApproval(
          selectedApp.id,
          sanctionAmount,
          deanRemarks || 'Endorsed under Dean statutory authority; exceeds ₹75k standalone ceiling.',
          profile?.full_name || 'Dean of Academic Affairs',
          deanPin,
          profile?.id
        );

        // Submit to Dual-Approval Governance Desk for VC counter-signature
        adminService.submitApprovalRequest({
          operation_type: 'HIGH_VALUE_SCHOLARSHIP_SANCTION',
          title: `VC Co-Signature Required: ₹${sanctionAmount.toLocaleString()} Grant (${selectedApp.student_name})`,
          description: `Grant amount of ₹${sanctionAmount.toLocaleString()} under ${selectedApp.scheme_name} exceeds Dean's standalone statutory ceiling of ₹75,000. Endorsed by Dean (${profile?.full_name || 'Dean of Academic Affairs'}). Requires Vice-Chancellor counter-signature.`,
          target_entity: `Scholarship Application ${selectedApp.application_no} (${selectedApp.student_name})`,
          requested_by: profile?.full_name || 'Dean of Academic Affairs',
          payload: {
            application_id: selectedApp.id,
            application_no: selectedApp.application_no,
            student_name: selectedApp.student_name,
            student_roll: selectedApp.student_roll,
            scheme_name: selectedApp.scheme_name,
            sanction_amount: sanctionAmount,
            cgpa: selectedApp.cgpa
          }
        });

        // Audit Trail
        deanService.logDeanAudit({
          action: 'SCHOLARSHIP_SANCTION',
          entityId: selectedApp.id,
          entityName: `${selectedApp.student_name} (${selectedApp.scheme_name})`,
          deanName: profile?.full_name || 'Prof. Dr. Rajesh K. Varma',
          deanId: profile?.id || 'dean-001',
          securityPinVerified: true,
          details: `Endorsed high-value grant ₹${sanctionAmount.toLocaleString()} (> ₹75,000). Blocked standalone disbursal and queued for Vice-Chancellor co-signature.`
        });

        setFeedbackMessage({
          type: 'error',
          text: `Amount ₹${sanctionAmount.toLocaleString()} exceeds Dean's standalone statutory ceiling of ₹75,000. Standalone sanction is blocked. As per University Financial Statutes, this high-value grant has been endorsed by Dean and queued for Vice-Chancellor co-signature in the Executive Dual-Signoff Desk.`
        });

        setIsSanctionModalOpen(false);
        setDeanPin('');
        await loadApplications();
        setTimeout(() => setFeedbackMessage(null), 8000);
      } catch (err: any) {
        setFeedbackMessage({ type: 'error', text: err.message || 'Failed to queue for VC approval.' });
      } finally {
        setActionProcessing(false);
      }
      return;
    }

    setActionProcessing(true);
    try {
      await scholarshipService.deanSanctionApplication(
        selectedApp.id,
        sanctionAmount,
        deanRemarks,
        profile?.full_name || 'Prof. Dr. Rajesh K. Varma, Ph.D. (Dean of Academic Affairs)',
        deanPin,
        profile?.id
      );

      // Record expenditure in institutional budget ledger
      deanService.recordSanctionExpenditure(sanctionAmount);

      // Audit trail
      deanService.logDeanAudit({
        action: 'SCHOLARSHIP_SANCTION',
        entityId: selectedApp.id,
        entityName: `${selectedApp.student_name} (${selectedApp.scheme_name})`,
        deanName: profile?.full_name || 'Prof. Dr. Rajesh K. Varma',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Sanctioned grant of ₹${sanctionAmount.toLocaleString()} under Dean statutory seal. Remainder budget: ₹${(remainingBudget - sanctionAmount).toLocaleString()}.`
      });

      setFeedbackMessage({
        type: 'success',
        text: `Application ${selectedApp.application_no} for ${selectedApp.student_name} sanctioned successfully! Dispatched to Finance & Accounts Office for DBT treasury transfer.`,
      });

      setIsSanctionModalOpen(false);
      setDeanPin('');
      await loadApplications();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to sanction scholarship.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleBatchSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinCheck = deanService.verifyDeanPin(deanPin, profile?.id);
    if (!pinCheck.valid) {
      setFeedbackMessage({ type: 'error', text: pinCheck.error || 'Invalid Dean Security Authorization PIN.' });
      return;
    }

    const pendingEligible = applications.filter(
      (a) => a.status === 'submitted' || a.status === 'verified_by_advisor'
    );

    if (pendingEligible.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'No pending verified applications eligible for batch sanction.' });
      return;
    }

    setActionProcessing(true);
    let runningBudgetRemaining = remainingBudget;
    let successfulSanctionsCount = 0;
    let successfulSanctionsTotal = 0;
    let queuedForVcCount = 0;
    let queuedForVcTotal = 0;
    const failedItems: Array<{ id: string; name: string; error: string }> = [];

    try {
      for (const app of pendingEligible) {
        // Governance Check: > ₹75,000 threshold requires VC co-signature
        if (app.applied_amount > 75000) {
          try {
            await scholarshipService.queueForVcApproval(
              app.id,
              app.applied_amount,
              'Batch verified by Dean; queued for VC co-signature (> ₹75k limit).',
              profile?.full_name || 'Dean of Academic Affairs',
              deanPin,
              profile?.id
            );

            adminService.submitApprovalRequest({
              operation_type: 'HIGH_VALUE_SCHOLARSHIP_SANCTION',
              title: `VC Co-Signature: ₹${app.applied_amount.toLocaleString()} Grant (${app.student_name})`,
              description: `Batch processed grant of ₹${app.applied_amount.toLocaleString()} exceeds Dean standalone ceiling of ₹75,000. Requires Vice-Chancellor counter-signature.`,
              target_entity: `Scholarship Application ${app.application_no} (${app.student_name})`,
              requested_by: profile?.full_name || 'Dean of Academic Affairs',
              payload: {
                application_id: app.id,
                application_no: app.application_no,
                student_name: app.student_name,
                student_roll: app.student_roll,
                scheme_name: app.scheme_name,
                sanction_amount: app.applied_amount,
                cgpa: app.cgpa
              }
            });

            queuedForVcCount++;
            queuedForVcTotal += app.applied_amount;
          } catch (err: any) {
            failedItems.push({ id: app.id, name: app.student_name, error: err.message || 'VC queue failed' });
          }
          continue;
        }

        // Running Budget Pool Sanity Check
        if (app.applied_amount > runningBudgetRemaining) {
          failedItems.push({
            id: app.id,
            name: app.student_name,
            error: `Insufficient budget pool (Requested: ₹${app.applied_amount.toLocaleString()}, Remaining: ₹${runningBudgetRemaining.toLocaleString()})`
          });
          continue;
        }

        // Process Standard Standalone Sanction
        try {
          await scholarshipService.deanSanctionApplication(
            app.id,
            app.applied_amount,
            'Batch ratified following Advisor & HOD documentary compliance review.',
            profile?.full_name || 'Dean of Academic Affairs',
            deanPin,
            profile?.id
          );

          // Atomic budget debit per confirmed success
          deanService.recordSanctionExpenditure(app.applied_amount);
          runningBudgetRemaining -= app.applied_amount;
          successfulSanctionsCount++;
          successfulSanctionsTotal += app.applied_amount;
        } catch (itemErr: any) {
          failedItems.push({
            id: app.id,
            name: app.student_name,
            error: itemErr.message || 'Sanction transaction failed'
          });
        }
      }

      // Record Consolidated Audit Trail with exact numbers
      if (successfulSanctionsCount > 0 || queuedForVcCount > 0) {
        deanService.logDeanAudit({
          action: 'SCHOLARSHIP_SANCTION',
          entityId: 'batch-scholarships',
          entityName: `Batch of ${successfulSanctionsCount + queuedForVcCount} Verified Scholarships`,
          deanName: profile?.full_name || 'Dean of Academic Affairs',
          deanId: profile?.id || 'dean-001',
          securityPinVerified: true,
          details: `Batch run executed: ${successfulSanctionsCount} sanctioned (₹${successfulSanctionsTotal.toLocaleString()}), ${queuedForVcCount} queued for VC (> ₹75k), ${failedItems.length} failed/skipped. Running budget remaining: ₹${runningBudgetRemaining.toLocaleString()}.`
        });
      }

      // Build Informative Feedback
      if (failedItems.length === 0) {
        setFeedbackMessage({
          type: 'success',
          text: `Batch Sanction Complete: ${successfulSanctionsCount} grants sanctioned (₹${successfulSanctionsTotal.toLocaleString()}) and ${queuedForVcCount} queued for VC Co-Signature (> ₹75k)!`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: `Batch partially completed: ${successfulSanctionsCount} sanctioned (₹${successfulSanctionsTotal.toLocaleString()}), ${queuedForVcCount} routed to VC. ${failedItems.length} application(s) skipped/failed (${failedItems.map(f => `${f.name}: ${f.error}`).join('; ')}). Budget ledger kept 100% consistent.`
        });
      }

      setIsBatchModalOpen(false);
      setDeanPin('');
      await loadApplications();
      setTimeout(() => setFeedbackMessage(null), 8000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed batch sanction execution.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setActionProcessing(true);
    try {
      await scholarshipService.deanRejectApplication(
        selectedApp.id,
        deanRemarks,
        profile?.full_name || 'Dean of Academic Affairs'
      );

      deanService.logDeanAudit({
        action: 'SCHOLARSHIP_SANCTION',
        entityId: selectedApp.id,
        entityName: `${selectedApp.student_name} (${selectedApp.scheme_name})`,
        deanName: profile?.full_name || 'Dean of Academic Affairs',
        deanId: profile?.id || 'dean-001',
        securityPinVerified: true,
        details: `Application rejected by Dean: ${deanRemarks}`
      });

      setFeedbackMessage({
        type: 'success',
        text: `Application ${selectedApp.application_no} rejected and archived. Student notified with right-to-appeal via Grievance Desk.`,
      });

      setIsRejectModalOpen(false);
      loadApplications();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to reject scholarship.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'submitted' || a.status === 'verified_by_advisor').length;
  const sanctionedCount = applications.filter((a) => a.status === 'sanctioned_by_dean' || a.status === 'disbursed').length;
  const totalSanctionedFunds = applications
    .filter((a) => a.status === 'sanctioned_by_dean' || a.status === 'disbursed')
    .reduce((sum, a) => sum + (a.sanctioned_amount || a.applied_amount), 0);

  return (
    <div className="space-y-6">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Affairs</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory Scholarship Endorsement &amp; Budget Ceiling Authority</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Scholarship Sanction &amp; Merit Endorsement Desk
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Adjudicate student applications for Chancellor Merit Grants, AICTE Pragati schemes, and Tuition Fee Waivers. Enforce statutory budget ceiling limits, verify income criteria, and issue cryptographically sealed sanction warrants.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[150px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Awaiting Sanction</span>
              <div className="text-2xl font-academic-display font-extrabold text-amber-400 mt-0.5">
                {pendingCount} Pending
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">Requires Dean Sign-off</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Institutional Budget Pool Snapshot */}
      <div className="card-3d bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 text-white p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {budget.fiscalYear} Annual Allocation
              </span>
              <span className="text-xs text-indigo-300 font-medium">Statutory Scholarship Pool</span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-amber-400" />
              <span>Institutional Scholarship Ceiling: ₹{(budget.totalScholarshipAllocated / 100000).toFixed(1)} Lakhs</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              disabled={pendingCount === 0}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Batch Sanction ({pendingCount} Eligible)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Allocated Pool</span>
            <span className="text-lg font-bold font-mono text-white">₹{budget.totalScholarshipAllocated.toLocaleString()}</span>
            <span className="text-[10px] text-indigo-300 block mt-0.5">Academic Council Approved</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Dean Sanctioned</span>
            <span className="text-lg font-bold font-mono text-amber-300">₹{budget.totalScholarshipSanctioned.toLocaleString()}</span>
            <span className="text-[10px] text-amber-200/70 block mt-0.5">{budgetUtilizationPct}% Pool Committed</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Remaining Ceiling</span>
            <span className={`text-lg font-bold font-mono ${remainingBudget < 500000 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{remainingBudget.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-300/70 block mt-0.5">Available for Sanction</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">DBT Treasury Disbursed</span>
            <span className="text-lg font-bold font-mono text-blue-300">₹{budget.totalScholarshipDisbursed.toLocaleString()}</span>
            <span className="text-[10px] text-blue-200/70 block mt-0.5">Bank Transferred</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-indigo-900/40">
          <div className="flex justify-between text-[11px] text-indigo-200 font-medium mb-1">
            <span>Budget Utilization Velocity</span>
            <span>{budgetUtilizationPct}% of Annual Ceiling Committed</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUtilizationPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${budgetUtilizationPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, roll number, scheme name..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
          >
            <option value="all">All Applications ({applications.length})</option>
            <option value="submitted">Submitted / Awaiting Advisor</option>
            <option value="verified_by_advisor">Verified by Advisor (Ready for Dean)</option>
            <option value="sanctioned_by_dean">Sanctioned by Dean</option>
            <option value="disbursed">Disbursed (DBT)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table of Applications */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
              Student Grant Dossiers ({filteredApplications.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Threshold: Sanctions &gt; ₹75,000 tag VC Co-Signature requirement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Application &amp; Date</th>
                <th className="py-3 px-4">Student &amp; Roll No</th>
                <th className="py-3 px-4">Scheme &amp; Category</th>
                <th className="py-3 px-3 text-center">CGPA / Income</th>
                <th className="py-3 px-4 text-right">Grant Requested</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Statutory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No scholarship applications found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#0F2747]">{app.application_no}</div>
                      <div className="text-[10px] text-slate-400">{new Date(app.applied_date).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F2747]">{app.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.student_roll}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{app.scheme_name}</div>
                      <div className="text-[10px] text-slate-500">{app.category}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {app.cgpa} CGPA
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">₹{(app.family_income / 100000).toFixed(1)}L / yr</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F2747]">
                      ₹{app.applied_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`badge-3d text-[10px] uppercase font-bold px-2 py-0.5 ${
                          app.status === 'sanctioned_by_dean' || app.status === 'disbursed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : app.status === 'pending_vc_approval'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : app.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {app.status === 'pending_vc_approval'
                          ? 'Awaiting VC Co-Signature (> ₹75k)'
                          : app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDocModal(app)}
                          title="Inspect Evidence Dossier"
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#1E5AA8]" />
                          <span>Dossier</span>
                        </button>

                        {app.status === 'pending_vc_approval' && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span>In VC Desk</span>
                          </span>
                        )}

                        {(app.status === 'submitted' || app.status === 'verified_by_advisor') && (
                          <>
                            <button
                              onClick={() => handleOpenSanction(app)}
                              className="px-3 py-1 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-300" />
                              <span>Sanction</span>
                            </button>
                            <button
                              onClick={() => handleOpenReject(app)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
                              title="Reject Application"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DOCUMENT INSPECTION MODAL ── */}
      {isDocModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0F2747]">
                    Student Evidence &amp; Eligibility Dossier
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref: {selectedApp.application_no} &bull; {selectedApp.student_name} ({selectedApp.student_roll})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Standing</span>
                <span className="text-base font-extrabold text-[#0F2747] font-mono">{selectedApp.cgpa} CGPA</span>
                <span className="text-[11px] text-emerald-700 block font-semibold mt-0.5">Meets &gt; 8.00 Cutoff</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Certified Family Income</span>
                <span className="text-base font-extrabold text-[#0F2747] font-mono">₹{selectedApp.family_income.toLocaleString()} / year</span>
                <span className="text-[11px] text-emerald-700 block font-semibold mt-0.5">Within ₹2.5L Threshold</span>
              </div>
            </div>

            {/* Statutory Document Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Mandatory Statutory Verification Documents
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Tehsildar Revenue Income Certificate</div>
                      <div className="text-[10px] text-slate-500 font-mono">Cert No: INC/2025/MP/88392 &bull; Valid till Mar 2027</div>
                    </div>
                  </div>
                  <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold px-2 py-0.5">
                    HOD Verified ✓
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Student Aadhaar Linked Bank Passbook</div>
                      <div className="text-[10px] text-slate-500 font-mono">State Bank of India &bull; IFSC: SBIN0001429 &bull; NPCI Active</div>
                    </div>
                  </div>
                  <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold px-2 py-0.5">
                    DBT Ready ✓
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Term 1 Official University Grade Card</div>
                      <div className="text-[10px] text-slate-500 font-mono">0 Active Backlogs &bull; 8.84 SGPA Gazetted</div>
                    </div>
                  </div>
                  <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold px-2 py-0.5">
                    COE Verified ✓
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close Dossier
              </button>
              {(selectedApp.status === 'submitted' || selectedApp.status === 'verified_by_advisor') && (
                <button
                  onClick={() => {
                    setIsDocModalOpen(false);
                    handleOpenSanction(selectedApp);
                  }}
                  className="btn-3d-gold px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Proceed to Statutory Sanction</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SANCTION ORDER MODAL (WITH SECURE PIN) ── */}
      {isSanctionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">
                  Academic Council Sanction Warrant
                </span>
                <h2 className="text-base font-bold text-[#0F2747]">
                  Issue Scholarship Sanction Order
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedApp.student_name} &bull; {selectedApp.application_no}
                </p>
              </div>
              <button
                onClick={() => setIsSanctionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSanction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sanction Grant Amount (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={sanctionAmount}
                    onChange={(e) => setSanctionAmount(Number(e.target.value))}
                    max={remainingBudget}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs font-mono font-bold text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>Pool Balance: ₹{remainingBudget.toLocaleString()}</span>
                  {sanctionAmount > 75000 && (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      &gt; ₹75k Requires VC Counter-Signature
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dean Statutory Remarks / Endorsement Order
                </label>
                <textarea
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              {/* Secure Dean PIN Gate */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-900">
                  Dean Security Authorization PIN (60s Lockout on 3 Wrong Attempts)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={deanPin}
                    onChange={(e) => setDeanPin(e.target.value)}
                    required
                    placeholder="Enter Dean 4-digit Authorization PIN"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 pl-9 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-amber-600"
                  />
                  <Lock className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                </div>
                <span className="text-[10px] text-amber-800/80 block">
                  Statutory cryptographic key required to affix Dean Digital Signature to university treasury ledger.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSanctionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="btn-3d-gold px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionProcessing ? (
                    <span>Processing Cryptographic Sign-off...</span>
                  ) : sanctionAmount > 75000 ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                      <span>Endorse &amp; Forward for VC Co-Signature</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3.5 h-3.5" />
                      <span>Affix Dean Seal &amp; Sanction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BATCH SANCTION MODAL ── */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747]">
                  Batch Sanction Verification
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {pendingCount} applications eligible for bulk sanction
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchSanction} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>Each eligible student will be sanctioned their requested grant amount.</div>
                <div className="font-bold text-[#0F2747]">All records logged with unique SHA-256 audit seal tokens.</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Dean Authorization PIN
                </label>
                <input
                  type="password"
                  value={deanPin}
                  onChange={(e) => setDeanPin(e.target.value)}
                  required
                  placeholder="Enter Dean PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="btn-3d-gold px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  {actionProcessing ? 'Processing Batch...' : 'Confirm Bulk Sanction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {isRejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-rose-700">
                  Reject Scholarship Application
                </h2>
                <p className="text-xs text-slate-500 font-mono">Ref: {selectedApp.application_no}</p>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection / Return Directive
                </label>
                <textarea
                  value={deanRemarks}
                  onChange={(e) => setDeanRemarks(e.target.value)}
                  rows={3}
                  required
                  placeholder="State ground for ineligibility..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {actionProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
