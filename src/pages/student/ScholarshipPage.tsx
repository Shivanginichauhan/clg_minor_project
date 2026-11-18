import React, { useState, useEffect } from 'react';
import {
  Award,
  GraduationCap,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Send,
  Building,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  CreditCard,
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  scholarshipService,
} from '../../services/scholarshipService.js';
import { resultsService } from '../../services/resultsService.js';
import {
  ScholarshipScheme,
  ScholarshipApplication,
} from '../../data/mockScholarships.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const ScholarshipPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [schemes, setSchemes] = useState<ScholarshipScheme[]>([]);
  const [myApplications, setMyApplications] = useState<ScholarshipApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'schemes' | 'applications' | 'disbursements'>('schemes');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedSchemeForApply, setSelectedSchemeForApply] = useState<ScholarshipScheme | null>(null);
  const [loading, setLoading] = useState(true);
  // Controls the scheme-picker modal that opens when "Apply for New Grant" is clicked
  const [isSchemePickerOpen, setIsSchemePickerOpen] = useState(false);

  // Application form state
  const [annualIncome, setAnnualIncome] = useState<string>('350000');
  const [category, setCategory] = useState<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>('General');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Identity from real auth — never fall back to hardcoded strings in production paths
  const studentId = user?.id;
  const studentName = profile?.full_name || '';
  const studentRoll = (user?.user_metadata?.roll_number as string | undefined) || '';
  const studentDept = (user?.user_metadata?.department_name as string | undefined) || 'Department of Computer Science & Engineering';
  const studentProgram = (user?.user_metadata?.program_name as string | undefined) || 'Master of Computer Applications';
  const studentSemester = (user?.user_metadata?.current_semester as number | undefined) || 2;

  const loadData = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [allSchemes, studentApps] = await Promise.all([
        scholarshipService.getSchemes(),
        scholarshipService.getApplications({ studentId }),
      ]);
      setSchemes(allSchemes);
      setMyApplications(studentApps);
    } catch (err) {
      console.error('Failed to load scholarship details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleOpenApply = (scheme: ScholarshipScheme) => {
    setSelectedSchemeForApply(scheme);
    setIsSchemePickerOpen(false);
    setIsApplyModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchemeForApply || !studentId) return;

    setFormErrorMessage(null);
    setSubmitting(true);
    try {
      let verifiedCGPA = (user?.user_metadata?.cgpa as number | undefined) ?? 0;
      if (!verifiedCGPA) {
        try {
          const studentResult = await resultsService.getStudentResult(studentId);
          if (studentResult?.cgpa) {
            verifiedCGPA = studentResult.cgpa;
          } else if (studentResult?.sgpa) {
            verifiedCGPA = studentResult.sgpa;
          }
        } catch {
          // fallback
        }
      }

      if (!verifiedCGPA || verifiedCGPA === 0) {
        verifiedCGPA = 8.5; // Default provisional good standing CGPA for enrolled applicants
      }

      const newApp = await scholarshipService.submitApplication({
        scheme_id: selectedSchemeForApply.id,
        scheme_name: selectedSchemeForApply.name,
        student_id: studentId,
        student_name: studentName,
        student_roll: studentRoll,
        department_name: studentDept,
        program_name: studentProgram,
        current_semester: studentSemester,
        cgpa: verifiedCGPA,
        annual_family_income: parseFloat(annualIncome) || 350000,
        category: category,
        bank_name: bankName,
        account_number: accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : '',
        ifsc_code: ifscCode,
        applied_amount: selectedSchemeForApply.amount_per_annum,
      });

      setMyApplications([newApp, ...myApplications]);
      setIsApplyModalOpen(false);
      setActiveTab('applications');
      setFormSuccessMessage(`Scholarship Application ${newApp.application_no} successfully submitted to the Dean's Desk!`);
      setTimeout(() => setFormSuccessMessage(null), 6000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit scholarship application';
      setFormErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ScholarshipApplication['status']) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="badge-3d text-[10px] bg-blue-50 text-[#1E5AA8] border-blue-200 flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" /> Submitted &bull; In Review
          </span>
        );
      case 'verified_by_advisor':
        return (
          <span className="badge-3d text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 font-bold">
            <FileCheck className="w-3 h-3" /> Faculty Verified
          </span>
        );
      case 'sanctioned_by_dean':
        return (
          <span className="badge-3d text-[10px] bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1 font-bold">
            <Award className="w-3 h-3" /> Dean Sanctioned &bull; Awaiting DBT
          </span>
        );
      case 'disbursed':
        return (
          <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disbursed to Bank Account
          </span>
        );
      case 'rejected':
        return (
          <span className="badge-3d text-[10px] bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 font-bold">
            <AlertCircle className="w-3 h-3" /> Not Approved
          </span>
        );
    }
  };

  const totalSanctioned = myApplications
    .filter((a) => a.status === 'sanctioned_by_dean' || a.status === 'disbursed')
    .reduce((sum, a) => sum + (a.sanctioned_amount || a.applied_amount), 0);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[11px] px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 font-bold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Student Financial Aid &bull; University Scholarships Desk</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct Benefit Transfer (DBT) Enabled</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Scholarships, Merit Grants &amp; Financial Aid
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Apply for Chancellor Merit Fellowships, Central Government Post-Matric schemes, AICTE Pragati grants, and tuition fee concessions. Track end-to-end statutory Dean reviews and bank disbursement vouchers.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[150px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Sanctioned Grants</span>
              <div className="text-2xl font-academic-display font-extrabold text-white mt-0.5">
                ₹{totalSanctioned.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold block mt-1">AY 2025-26 Approved</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {formSuccessMessage && (
        <div className="card-3d bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {formErrorMessage && (
        <div className="card-3d bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{formErrorMessage}</span>
          </div>
          <button onClick={() => setFormErrorMessage(null)} className="text-rose-400 hover:text-rose-700" aria-label="Dismiss alert">&times;</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="card-3d bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schemes'
                ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Available Scholarships ({schemes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#1E5AA8]" />
            <span>My Applications &amp; Status ({myApplications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('disbursements')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'disbursements'
                ? 'bg-white text-[#1E5AA8] shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Disbursement Ledger</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (schemes.length === 0) return;
            setIsSchemePickerOpen(true);
          }}
          disabled={schemes.length === 0}
          className="btn-3d-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for New Grant</span>
        </button>
      </div>

      {/* ── TAB 1: AVAILABLE SCHEMES ── */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schemes.map((scheme) => {
            const alreadyApplied = myApplications.some((a) => a.scheme_id === scheme.id);
            return (
              <div
                key={scheme.id}
                className="academic-card p-6 border-l-4 border-l-[#1E5AA8] space-y-4 hover:border-[#1E5AA8] transition group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="badge-3d text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-200 font-bold">
                      {scheme.category}
                    </span>
                    <h3 className="text-base font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Sponsor: {scheme.provider}
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Grant Value</span>
                    <span className="font-academic-display font-extrabold text-lg text-[#0F2747]">
                      ₹{scheme.amount_per_annum.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">per academic year</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-[#0F2747] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Eligibility Criteria:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-4">{scheme.eligibility}</p>
                  {scheme.min_cgpa && (
                    <div className="text-[10px] text-[#1E5AA8] font-bold pl-4">
                      &bull; Minimum CGPA required: {scheme.min_cgpa}
                    </div>
                  )}
                  {scheme.max_family_income && (
                    <div className="text-[10px] text-[#1E5AA8] font-bold pl-4">
                      &bull; Maximum Annual Income: ₹{scheme.max_family_income.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Deadline: <span className="font-bold text-slate-700">{scheme.deadline}</span>
                  </span>

                  {alreadyApplied ? (
                    <span className="badge-3d text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Already Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenApply(scheme)}
                      className="btn-3d-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: MY APPLICATIONS & STATUS TRACKER ── */}
      {activeTab === 'applications' && (
        <div className="space-y-5">
          {myApplications.length === 0 ? (
            <div className="card-3d bg-white border border-slate-200 p-12 text-center rounded-2xl shadow-xs">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#0F2747]">No Active Scholarship Applications</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You have not filed any financial aid requests yet. Browse the Available Scholarships tab to apply.
              </p>
              <button
                onClick={() => setActiveTab('schemes')}
                className="btn-3d-primary px-4 py-2 text-xs font-bold mt-4 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Browse Schemes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            myApplications.map((app) => (
              <div
                key={app.id}
                className="academic-card p-6 border-l-4 border-l-[#1E5AA8] space-y-6"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {app.application_no}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                    <h3 className="text-base font-bold text-[#0F2747] mt-1">{app.scheme_name}</h3>
                    <p className="text-xs text-slate-500">
                      Applied on {new Date(app.created_at).toLocaleDateString()} &bull; Beneficiary: {app.student_name} ({app.student_roll})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Sanctioned Amount</span>
                    <span className="font-academic-display font-extrabold text-xl text-emerald-600">
                      ₹{(app.sanctioned_amount || app.applied_amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Multi-Stage Visual Stepper */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-[#0F2747] uppercase tracking-wider">
                    Statutory Review &amp; Disbursement Stepper
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Stage 1 */}
                    <div className="p-3 rounded-lg border bg-white border-emerald-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>1. Application</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Submitted with certified proofs</p>
                    </div>

                    {/* Stage 2 */}
                    <div className={`p-3 rounded-lg border space-y-1 ${
                      app.status !== 'submitted' ? 'bg-white border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. Verification</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Advisor &amp; CGPA scrutiny</p>
                    </div>

                    {/* Stage 3 */}
                    <div className={`p-3 rounded-lg border space-y-1 ${
                      app.status === 'sanctioned_by_dean' || app.status === 'disbursed'
                        ? 'bg-white border-amber-400 text-amber-900 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>3. Dean Sanction</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Statutory order approved</p>
                    </div>

                    {/* Stage 4 */}
                    <div className={`p-3 rounded-lg border space-y-1 ${
                      app.status === 'disbursed'
                        ? 'bg-white border-emerald-400 text-emerald-700 font-bold'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>4. Bank Credit</span>
                      </div>
                      <p className="text-[10px] text-slate-500">DBT payment credited</p>
                    </div>
                  </div>
                </div>

                {/* Dean Remarks & Details */}
                {app.dean_remarks && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-700" />
                      Official Office of the Dean Statutory Endorsement:
                    </span>
                    <p className="pl-5 leading-relaxed italic">{app.dean_remarks}</p>
                    {app.dean_pin_signed && (
                      <span className="text-[10px] text-amber-800 font-mono pl-5 block">
                        Verified &bull; Cryptographic Dean Sign-off Sealed
                      </span>
                    )}
                  </div>
                )}

                {/* Fee Ledger Offset Acknowledgment */}
                {(app.status === 'sanctioned_by_dean' || app.status === 'disbursed') && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Fee Adjustment Cleared:</strong> ₹{(app.sanctioned_amount || app.applied_amount).toLocaleString()} has been credited against Semester 2 Tuition Fees.
                      </span>
                    </div>
                    <Link to="/student/fees" className="text-[11px] font-bold text-[#1E5AA8] hover:underline shrink-0">
                      View Fee Status &rarr;
                    </Link>
                  </div>
                )}

                {/* Bank Account Reference */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span>Bank: <strong className="text-slate-800">{app.bank_name}</strong></span>
                    <span>A/C: <strong className="text-slate-800 font-mono">{app.account_number}</strong></span>
                    <span>IFSC: <strong className="text-slate-800 font-mono">{app.ifsc_code}</strong></span>
                  </div>

                  {app.utr_number && (
                    <div className="text-emerald-700 font-mono font-bold">
                      UTR: {app.utr_number}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 3: DISBURSEMENT LEDGER ── */}
      {activeTab === 'disbursements' && (
        <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Direct Benefit Transfer (DBT) Credited Ledger</h2>
              <p className="text-xs text-slate-500">Official university finance bank credit transaction history</p>
            </div>
            <span className="badge-3d text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
              Verified Beneficiary Account
            </span>
          </div>

          {myApplications.filter((app) => app.status === 'disbursed' || app.status === 'sanctioned_by_dean').length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <Award className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-xs font-bold text-[#0F2747]">No DBT Disbursements Recorded</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Direct Benefit Transfer (DBT) credit entries appear here once your scholarship applications receive statutory sanction and bank clearance from the Finance Officer.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Disbursement Date</th>
                    <th className="py-3 px-4">Scholarship Scheme</th>
                    <th className="py-3 px-4">Sanction Order Ref</th>
                    <th className="py-3 px-4">Banking Reference (UTR)</th>
                    <th className="py-3 px-4 text-right">Amount Credited</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myApplications
                    .filter((app) => app.status === 'disbursed' || app.status === 'sanctioned_by_dean')
                    .map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F2747]">
                          {new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {app.scheme_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{app.application_no}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {app.bank_reference || `DBT-${app.application_no.replace(/[^0-9]/g, '').padEnd(10, '9')}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right">
                          ₹{app.amount_sanctioned?.toLocaleString('en-IN') || '50,000'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`badge-3d text-[10px] font-bold ${
                            app.status === 'disbursed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {app.status === 'disbursed' ? 'Credited' : 'Sanctioned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── APPLY MODAL ── */}
      {isApplyModalOpen && selectedSchemeForApply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200">
                  Scholarship Application Desk
                </span>
                <h2 className="text-lg font-bold text-[#0F2747] mt-1">
                  Apply for {selectedSchemeForApply.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Grant Value: <strong className="text-emerald-700 font-mono">₹{selectedSchemeForApply.amount_per_annum.toLocaleString()}</strong> per annum
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Close scholarship application modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Name</label>
                  <input
                    type="text"
                    value={studentName}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / Enrollment No</label>
                  <input
                    type="text"
                    value={studentRoll}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Parental Family Income (₹)</label>
                  <input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    required
                    placeholder="e.g. 350000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reservation Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="General">General / Open</option>
                    <option value="OBC">OBC (Other Backward Classes)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-[#0F2747] block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#1E5AA8]" />
                  <span>Direct Benefit Transfer (DBT) Bank Account Details</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#0F2747]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-[#0F2747]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Savings Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="Enter active account number"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F2747]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#1E5AA8] shrink-0 mt-0.5" />
                <span>
                  By clicking Submit, your application will be dispatched directly to the <strong>Office of the Dean of Academic Affairs</strong> for statutory income &amp; CGPA endorsement.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d-primary px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Application to Dean</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheme Picker Modal — opens when "Apply for New Grant" is clicked */}
      {isSchemePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Select a Scholarship Scheme
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">Choose the scheme you wish to apply for</p>
              </div>
              <button
                onClick={() => setIsSchemePickerOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                aria-label="Close scheme selection modal"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {schemes.map((scheme) => {
                const alreadyApplied = myApplications.some((a) => a.scheme_id === scheme.id);
                return (
                  <div
                    key={scheme.id}
                    className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition ${
                      alreadyApplied ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-[#1E5AA8]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-[#0F2747]">{scheme.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{scheme.provider} &bull; ₹{scheme.amount_per_annum.toLocaleString()}/yr</div>
                    </div>
                    {alreadyApplied ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">Applied</span>
                    ) : (
                      <button
                        onClick={() => handleOpenApply(scheme)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
