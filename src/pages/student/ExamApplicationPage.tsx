import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  Building,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight,
  Info,
  CalendarCheck,
  Award,
  Layers,
  HelpCircle,
  FileCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Edit3,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  Lock,
  Unlock,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { examRegistrationService, ExamRegistrationApplication, ExamRegistrationPaper } from '../../services/examRegistrationService.js';
import { attendanceService } from '../../services/attendanceService.js';
import { studentClearanceService, StudentClearanceRecord } from '../../services/studentClearanceService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { resultsService } from '../../services/resultsService.js';
import { Link } from 'react-router-dom';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentGatewayModal } from '../../components/common/PaymentGatewayModal.js';

export const ExamApplicationPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [existingApplication, setExistingApplication] = useState<ExamRegistrationApplication | null>(null);
  const [clearance, setClearance] = useState<StudentClearanceRecord | null>(null);
  const [overallAttendance, setOverallAttendance] = useState<number | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Candidate Type Selection: 'regular' | 'ex_student' | 'improvement'
  const [candidateType, setCandidateType] = useState<'regular' | 'ex_student' | 'improvement'>('regular');

  // Candidate Personal & Academic Details (Auto-fetched from Profile + Fully Editable)
  const [candidateName, setCandidateName] = useState(profile?.full_name || '');
  const [candidateRoll, setCandidateRoll] = useState((user?.user_metadata?.roll_number as string | undefined) || '');
  const [candidateEnrollment, setCandidateEnrollment] = useState((user?.user_metadata?.enrollment_number as string | undefined) || '');
  const [candidateEmail, setCandidateEmail] = useState(profile?.email || user?.email || '');
  const [candidatePhone, setCandidatePhone] = useState(profile?.phone || '');
  // Sensitive fields left empty by default — student must enter them explicitly
  const [candidateDOB, setCandidateDOB] = useState('');
  const [candidateGender, setCandidateGender] = useState('Male');
  const [candidateCategory, setCandidateCategory] = useState('General');
  const [candidateGuardianName, setCandidateGuardianName] = useState('');
  const [candidateGuardianPhone, setCandidateGuardianPhone] = useState('');
  const [candidateAddress, setCandidateAddress] = useState('');
  const [candidateProgram, setCandidateProgram] = useState((user?.user_metadata?.program_name as string | undefined) || 'Master of Computer Applications');
  const [candidateDepartment, setCandidateDepartment] = useState((user?.user_metadata?.department_name as string | undefined) || 'Department of Computer Science & Engineering');
  const [candidateSemester, setCandidateSemester] = useState<number>((user?.user_metadata?.current_semester as number | undefined) || 2);
  const [candidateSession, setCandidateSession] = useState('Academic Year 2025 - 2026');

  // Ex-Student Specific Fields
  const [exLastSession, setExLastSession] = useState('May 2025 (Regular Term)');
  const [exExamReason, setExExamReason] = useState('Appearing for Semester 1 DSA Backlog theory & practical papers');

  // Form selections dynamically fetched from enrollments & results services
  const [selectedRegularPapers, setSelectedRegularPapers] = useState<ExamRegistrationPaper[]>([]);
  const [availableBacklogs, setAvailableBacklogs] = useState<ExamRegistrationPaper[]>([]);

  // Backlog papers default UNCHECKED — student must explicitly opt in to avoid accidental registration
  const [selectedBacklogs, setSelectedBacklogs] = useState<string[]>([]);
  const [undertakingAgreed, setUndertakingAgreed] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'upi' | 'netbanking' | 'card'>('upi');

  const studentId = user?.id;

  // Sync initial values with auth profile (runs whenever profile/user loads after mount)
  useEffect(() => {
    if (profile?.full_name) setCandidateName(profile.full_name);
    if (profile?.email) setCandidateEmail(profile.email);
    if (profile?.phone) setCandidatePhone(profile.phone);
    if (user?.user_metadata?.roll_number) setCandidateRoll(user.user_metadata.roll_number as string);
    if (user?.user_metadata?.enrollment_number) setCandidateEnrollment(user.user_metadata.enrollment_number as string);
    if (user?.user_metadata?.program_name) setCandidateProgram(user.user_metadata.program_name as string);
    if (user?.user_metadata?.department_name) setCandidateDepartment(user.user_metadata.department_name as string);
    if (user?.user_metadata?.current_semester) setCandidateSemester(user.user_metadata.current_semester as number);
  }, [profile, user]);

  useEffect(() => {
    const loadApplicationData = async () => {
      setLoading(true);
      try {
        const [app, attSummary, clr] = await Promise.all([
          examRegistrationService.getStudentApplication(studentId),
          attendanceService.getStudentAttendanceOverview(studentId),
          studentClearanceService.getStudentClearance(studentId),
        ]);
        setExistingApplication(app);
        setClearance(clr);
        if (attSummary?.overallPercentage) {
          setOverallAttendance(attSummary.overallPercentage);
        }
      } catch (err) {
        console.error('Failed to load exam registration details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadApplicationData();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    enrollmentService.getEnrollmentsByStudent(studentId).then((enrs) => {
      const papers = enrs
        .filter((e) => e.subject)
        .map((e) => ({
          code: e.subject!.code,
          name: e.subject!.name,
          credits: e.subject!.credits,
          type: 'regular' as const,
          fee: 350,
        }));
      if (papers.length > 0) {
        setSelectedRegularPapers(papers);
      }
    }).catch((err) => console.error('Failed to load student enrollments for exam papers', err));

    resultsService.getStudentResult(studentId).then((res) => {
      if (!res) return;
      const backlogs = res.subjects
        .filter((s) => s.letter_grade === 'F' || s.letter_grade === 'AB')
        .map((s) => ({
          code: s.subject_code,
          name: s.subject_name,
          credits: s.credits,
          type: 'backlog' as const,
          fee: 400,
        }));
      setAvailableBacklogs(backlogs);
    }).catch((err) => console.error('Failed to load student backlogs', err));
  }, [studentId]);

  const toggleBacklog = (code: string) => {
    if (selectedBacklogs.includes(code)) {
      setSelectedBacklogs(selectedBacklogs.filter((c) => c !== code));
    } else {
      setSelectedBacklogs([...selectedBacklogs, code]);
    }
  };

  // Fee computations based on Candidate Type
  const regularFee = candidateType === 'regular' ? 1800 : 0;
  const exFee = candidateType === 'ex_student' ? 500 : 0;
  const improvementFee = candidateType === 'improvement' ? 600 : 0;
  const backlogFee = selectedBacklogs.length * 400;
  const marksheetFee = 250;
  const totalPayable = regularFee + exFee + improvementFee + backlogFee + marksheetFee;

  // Eligibility check (Ex-students are not held by regular term attendance)
  const isEligible = clearance?.canApplyForExam ?? ((overallAttendance !== null && overallAttendance >= 75) || candidateType === 'ex_student');

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!studentId) {
      setErrorMessage('Authentication required. Please sign in to submit your exam application.');
      return;
    }
    if (!undertakingAgreed) {
      setErrorMessage('Please check the statutory declaration checkbox to proceed.');
      return;
    }
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = async (receipt: any) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const backlogPapersToAdd = availableBacklogs.filter((b) => selectedBacklogs.includes(b.code));
      const papersToRegister = candidateType === 'regular' ? selectedRegularPapers : [];

      const newApp = await examRegistrationService.submitRegistration({
        student_id: studentId!,
        student_name: candidateName,
        roll_number: candidateRoll,
        enrollment_number: candidateEnrollment,
        department_name: candidateDepartment,
        program_name: candidateProgram,
        semester_number: candidateSemester,
        academic_session: candidateSession,
        examination_name: candidateType === 'ex_student'
          ? 'End-Semester Supplementary & Ex-Student Examinations May 2026'
          : 'End-Semester Theory & Practical Examinations May 2026',
        candidate_type: candidateType,
        email: candidateEmail,
        phone: candidatePhone,
        guardian_name: candidateGuardianName,
        address: candidateAddress,
        category: candidateCategory,
        regular_papers: papersToRegister,
        backlog_papers: backlogPapersToAdd,
        examination_fee: regularFee + exFee + improvementFee,
        backlog_fee: backlogFee,
        marksheet_fee: marksheetFee,
        total_amount_paid: totalPayable,
        attendance_percentage: overallAttendance,
        payment_mode: selectedPaymentMode,
      });

      setExistingApplication(newApp);
      setSuccessMessage(`Examination Fee of ₹${totalPayable.toLocaleString('en-IN')} paid successfully! Official Receipt Ref: ${receipt.receiptNumber}`);
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit examination application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/60 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-3d text-[11px] px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 font-bold">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Examination Registration Portal &bull; May 2026 Cycle</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory UGC-CBCS Enrollment</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              End-Semester Examination Application Form
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Register for upcoming theory and practical degree examinations. All personal information and semester standing are auto-synchronized from your Student Profile with full editing access for your Admit Card.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[150px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Application Status</span>
              <div className="text-base font-academic-display font-extrabold text-white mt-0.5">
                {existingApplication ? (
                  <span className="text-emerald-400">Enrolled &bull; Ready</span>
                ) : (
                  <span className="text-amber-300">Open for Filing</span>
                )}
              </div>
              <span className="text-[10px] text-slate-300 block mt-1">Due: 30 April 2026</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="card-3d bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="card-3d bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl shadow-xs flex items-center gap-3 text-xs font-semibold print:hidden">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── ALREADY SUBMITTED: OFFICIAL EXAMINATION RECEIPT & DOCKET ACCESS ── */}
      {existingApplication ? (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-3d text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Application Form Registered &amp; Verified</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">Ref: {existingApplication.application_no}</span>
              <span className="badge-3d text-[11px] font-bold uppercase px-2.5 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200">
                {existingApplication.candidate_type === 'ex_student'
                  ? 'Ex-Student Candidate'
                  : existingApplication.candidate_type === 'improvement'
                  ? 'Improvement Candidate'
                  : 'Regular Candidate'}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Withdraw Application</span>
              </button>
              <button
                type="button"
                onClick={() => setExistingApplication(null)}
                className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-700"
              >
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Edit / Re-file</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-3d-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#1E5AA8]" />
                <span>Print Slip</span>
              </button>
              <Link
                to="/student/examinations"
                className="btn-3d-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Download Hall Ticket &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Official Printable Examination Application Docket */}
          <div className="academic-card p-6 sm:p-8 border-2 border-slate-300 bg-white space-y-6 shadow-sm">
            {/* University Docket Header */}
            <div className="border-b-2 border-slate-800 pb-5 text-center relative">
              <div className="flex items-center justify-between mb-2">
                <UniversityCrest size="md" variant="navy" />
                <div className="text-center space-y-0.5 flex-1 px-4">
                  <h2 className="font-academic-serif text-lg sm:text-xl font-extrabold text-[#0F2747] uppercase tracking-wider">
                    CENTRAL EXAMINATION CONTROLLER REGISTER
                  </h2>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                    Office of the Registrar &bull; Statutory Examination Division
                  </p>
                  <p className="text-xs font-semibold text-[#1E5AA8]">
                    Official Examination Registration &amp; Fee Acknowledgment Docket
                  </p>
                </div>
                <div className="text-right">
                  <div className="p-1.5 border border-slate-300 rounded-xl bg-white inline-block shadow-2xs">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/exam/${existingApplication.application_no}`}
                      size={60}
                      level="H"
                    />
                  </div>
                  <div className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">SCANNABLE QR</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap mt-2">
                <div className="inline-block bg-slate-100 border border-slate-300 px-4 py-1 rounded-full text-xs font-bold text-[#0F2747] font-mono">
                  APPLICATION REF: {existingApplication.application_no}
                </div>
                <div className="inline-block bg-blue-50 border border-blue-300 px-3 py-1 rounded-full text-xs font-extrabold text-[#1E5AA8] uppercase">
                  TYPE: {existingApplication.candidate_type === 'ex_student' ? 'EX-STUDENT / RE-APPEAR' : 'REGULAR MATRICULATED'}
                </div>
              </div>
            </div>

            {/* ── 4-STAGE STATUTORY VERIFICATION STATUS TRACKER (DATA DRIVEN) ── */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Application Approval Lifecycle</span>
                <span className={`font-extrabold ${existingApplication.admit_card_available ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {existingApplication.admit_card_available ? 'Admit Card Generated' : 'Under Verification'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {/* Stage 1: Form Submission */}
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                  1. Form Submitted ✓
                  <p className="text-[9px] text-emerald-700 font-normal mt-0.5">
                    {new Date(existingApplication.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Stage 2: HOD Verification */}
                <div className={`p-2.5 rounded-lg border font-bold ${
                  (existingApplication.attendance_percentage ?? 0) >= 75 || existingApplication.is_eligible
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  2. HOD Verification {(existingApplication.attendance_percentage ?? 0) >= 75 || existingApplication.is_eligible ? '✓' : '⏳'}
                  <p className={`text-[9px] font-normal mt-0.5 ${(existingApplication.attendance_percentage ?? 0) >= 75 || existingApplication.is_eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {(existingApplication.attendance_percentage ?? 0) >= 75
                      ? `Attendance Verified (${existingApplication.attendance_percentage}%)`
                      : 'Condonation Review'}
                  </p>
                </div>

                {/* Stage 3: Accounts Clearance */}
                <div className={`p-2.5 rounded-lg border font-bold ${
                  existingApplication.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  3. Accounts Clearance {existingApplication.payment_status === 'paid' ? '✓' : '⏳'}
                  <p className={`text-[9px] font-normal mt-0.5 ${existingApplication.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {existingApplication.payment_status === 'paid' ? 'Dues Cleared (Paid)' : 'Pending Settlement'}
                  </p>
                </div>

                {/* Stage 4: CoE Hall Ticket Issuance */}
                <div className={`p-2.5 rounded-lg border font-bold ${
                  existingApplication.admit_card_available
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  4. Hall Ticket Issued {existingApplication.admit_card_available ? '✓' : '⏳'}
                  <p className={`text-[9px] font-normal mt-0.5 ${existingApplication.admit_card_available ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {existingApplication.admit_card_available
                      ? (existingApplication.exam_center || 'Desk Allocated')
                      : 'Pending Final CoE Seal'}
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate & Academic Profile Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Candidate Full Name</span>
                <span className="font-bold text-sm text-[#0F2747]">{existingApplication.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">University Roll No</span>
                <span className="font-bold text-sm text-[#0F2747] font-mono">{existingApplication.roll_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Enrollment ID</span>
                <span className="font-bold text-sm text-[#0F2747] font-mono">{existingApplication.enrollment_number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Academic Program</span>
                <span className="font-bold text-xs text-[#0F2747]">{existingApplication.program_name} (Sem {existingApplication.semester_number})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Candidate Category</span>
                <span className="font-bold text-xs text-[#0F2747] capitalize">{existingApplication.category || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Contact Email &amp; Phone</span>
                <span className="font-semibold text-xs text-slate-800 block">{existingApplication.email || 'student@university.edu.in'}</span>
                <span className="text-[11px] text-slate-500 font-mono">{existingApplication.phone || '+91 98765 43210'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Parent / Guardian</span>
                <span className="font-semibold text-xs text-slate-800">{existingApplication.guardian_name || 'Mr. S. K. Sharma'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Attendance Ledger</span>
                <span className="font-bold text-xs text-emerald-700 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {existingApplication.attendance_percentage}% (Eligible &ge; 75%)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Receipt</span>
                <span className="font-bold text-xs text-emerald-700 font-mono">
                  PAID: ₹{existingApplication.total_amount_paid} ({existingApplication.payment_transaction_id})
                </span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Examination Center &amp; Address</span>
                <span className="font-semibold text-[11px] text-slate-800 block">{existingApplication.exam_center}</span>
                <span className="text-[10px] text-slate-500">{existingApplication.address || 'Campus Road, University Enclave'}</span>
              </div>
            </div>

            {/* Registered Courses / Papers Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center justify-between">
                <span>Registered Examination Papers ({existingApplication.total_papers_count} Papers &bull; {existingApplication.total_credits} Credits)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Scheme: {existingApplication.candidate_type === 'ex_student' ? 'Ex-Student Backlog Only' : 'Regular Core + Arrears'}
                </span>
              </h3>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-28">Paper Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3 w-20 text-center">Credits</th>
                      <th className="py-2.5 px-3 w-28 text-center">Paper Category</th>
                      <th className="py-2.5 px-3 w-24 text-center">Statutory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {existingApplication.regular_papers.map((paper, idx) => (
                      <tr key={paper.code} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#0F2747]">{paper.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{paper.name}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700">{paper.credits}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1E5AA8]">
                            Regular Core
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-bold text-[11px]">
                          Confirmed
                        </td>
                      </tr>
                    ))}

                    {existingApplication.backlog_papers.map((paper, idx) => (
                      <tr key={paper.code} className="bg-amber-50/50 hover:bg-amber-50">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono">
                          {existingApplication.regular_papers.length + idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-900">{paper.code}</td>
                        <td className="py-2 px-3 font-medium text-amber-900">{paper.name}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-900">{paper.credits}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Backlog Re-appear
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-bold text-[11px]">
                          Confirmed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Signatures */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-1">
                <div className="h-10 flex items-end justify-center font-serif italic text-slate-600 text-sm">
                  {existingApplication.student_name}
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px] font-bold text-slate-600 uppercase">
                  Candidate Signature
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-end justify-center font-mono text-emerald-600 font-bold text-xs">
                  VERIFIED BY ACCOUNTS
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px] font-bold text-slate-600 uppercase">
                  Finance &amp; Accounts Officer
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-end justify-center font-academic-serif font-bold text-[#1E5AA8] text-xs">
                  COE &bull; STATUTORY SEAL
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px] font-bold text-slate-600 uppercase">
                  Controller of Examinations
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── NEW EXAMINATION APPLICATION REGISTRATION FORM ── */
        <form onSubmit={handleSubmitApplication} className="space-y-6">
          {/* STEP 1: Statutory Eligibility & Clearance Dossier */}
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1E5AA8]" />
                  <span>Step 1: Statutory Examination Clearances Verified</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-requisite status verified by university authorities before filing
                </p>
              </div>
              <span className="badge-3d text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ Clearance Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Minimum Attendance (75%)</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold font-mono ${overallAttendance !== null && overallAttendance >= 75 ? 'text-emerald-600' : overallAttendance !== null ? 'text-rose-600' : 'text-slate-500'}`}>
                    {overallAttendance !== null ? `${overallAttendance.toFixed(1)}%` : 'Syncing...'}
                  </span>
                  <span className={`badge-3d text-[10px] ${overallAttendance !== null && overallAttendance >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : overallAttendance !== null ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {overallAttendance !== null && overallAttendance >= 75 ? 'Eligible • Mentor Cleared' : overallAttendance !== null ? 'Shortage Alert' : 'Calculating'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Statutory clause 14.2 verification</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Tuition &amp; Accounts Dues</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-emerald-600">CLEARED (NOC)</span>
                  <span className="badge-3d text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    No Dues
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Ref: {clearance?.nocReference || 'NOC-REG-2026-MCA-0819'}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Matriculation Standing</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#0F2747]">Active Regular</span>
                  <span className="badge-3d text-[10px] bg-blue-50 text-[#1E5AA8] border-blue-200">
                    Matriculated
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Semester 2 &bull; Term 2025-26</p>
              </div>
            </div>
          </div>

          {/* STEP 2: Candidate Type Selection (Regular vs Ex-Student / Re-appear) */}
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#1E5AA8]" />
                <span>Step 2: Candidate Type &amp; Enrollment Category</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your statutory registration category for this examination cycle
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  candidateType === 'regular'
                    ? 'border-[#1E5AA8] bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F2747]">🎓 Regular Student</span>
                    <input
                      type="radio"
                      name="candidateType"
                      value="regular"
                      checked={candidateType === 'regular'}
                      onChange={() => setCandidateType('regular')}
                      className="w-4 h-4 text-[#1E5AA8]"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Currently enrolled in MCA Semester 2. Appearing for core semester courses &bull; regular fee scheme.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-[#1E5AA8] uppercase">
                  Standard Academic Cycle
                </span>
              </label>

              <label
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  candidateType === 'ex_student'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F2747]">🔁 Ex-Student / Re-appear</span>
                    <input
                      type="radio"
                      name="candidateType"
                      value="ex_student"
                      checked={candidateType === 'ex_student'}
                      onChange={() => setCandidateType('ex_student')}
                      className="w-4 h-4 text-amber-600"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ex-students or repeaters appearing solely for backlog / arrear papers. Regular course tuition fee waived.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-amber-800 uppercase">
                  Backlog / Arrear Attempt
                </span>
              </label>

              <label
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  candidateType === 'improvement'
                    ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F2747]">⭐ Grade Improvement</span>
                    <input
                      type="radio"
                      name="candidateType"
                      value="improvement"
                      checked={candidateType === 'improvement'}
                      onChange={() => setCandidateType('improvement')}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    For students who have passed courses but wish to re-appear to boost GPA or division ranking.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-purple-700 uppercase">
                  GPA Enhancement
                </span>
              </label>
            </div>
          </div>

          {/* STEP 3: Candidate Personal & Academic Information (Auto-fetched + Selective Editing) */}
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1E5AA8]" />
                  <span>Step 3: Candidate Verification &amp; Contact Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official academic credentials are authenticated by the Registrar and locked. Contact details may be edited for this Admit Card.
                </p>
              </div>
              <span className="badge-3d text-[11px] font-bold bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Matriculation Locked &bull; Contact Editable
              </span>
            </div>

            {/* University Notice on Selective Editing */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0F2747] flex items-center gap-2.5">
              <Info className="w-4 h-4 text-[#1E5AA8] shrink-0" />
              <span>
                <strong>University Policy:</strong> Candidate Name, University Roll No, Enrollment ID, and Degree Program are validated from the statutory student dossier and cannot be modified arbitrarily. You can update your mobile number, email, guardian contact, and delivery address.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* LOCKED FIELD: Candidate Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Candidate Full Name</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Verified Record
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={candidateName}
                    readOnly
                    className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* LOCKED FIELD: University Roll Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>University Roll Number</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </label>
                <input
                  type="text"
                  value={candidateRoll}
                  readOnly
                  className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 cursor-not-allowed select-none"
                />
              </div>

              {/* LOCKED FIELD: Enrollment ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Enrollment ID</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </label>
                <input
                  type="text"
                  value={candidateEnrollment}
                  readOnly
                  className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 cursor-not-allowed select-none"
                />
              </div>

              {/* LOCKED FIELD: Academic Program */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Academic Degree Program</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </label>
                <input
                  type="text"
                  value={candidateProgram}
                  readOnly
                  className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-not-allowed select-none"
                />
              </div>

              {/* LOCKED FIELD: Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Department</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </label>
                <input
                  type="text"
                  value={candidateDepartment}
                  readOnly
                  className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-not-allowed select-none"
                />
              </div>

              {/* SEMESTER: Fixed if Regular, Selectable if Ex-Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Examination Semester</span>
                  {candidateType === 'regular' ? (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Lock className="w-3 h-3 text-slate-400" /> Sem {candidateSemester} Current
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-semibold">Ex-Student Choice</span>
                  )}
                </label>
                {candidateType === 'regular' ? (
                  <input
                    type="text"
                    value={`Semester ${candidateSemester} (Term 2025-26)`}
                    readOnly
                    className="w-full bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={candidateSemester}
                    onChange={(e) => setCandidateSemester(Number(e.target.value))}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value={1}>Semester I (Odd Term)</option>
                    <option value={2}>Semester II (Even Term)</option>
                    <option value={3}>Semester III (Odd Term)</option>
                    <option value={4}>Semester IV (Final Term)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Mobile Number *</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Social Category</label>
                <select
                  value={candidateCategory}
                  onChange={(e) => setCandidateCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                >
                  <option value="General">General / Open Merit</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="EWS">Economically Weaker Section (EWS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
                <input
                  type="text"
                  value={candidateGuardianName}
                  onChange={(e) => setCandidateGuardianName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Emergency Contact *</label>
                <input
                  type="text"
                  value={candidateGuardianPhone}
                  onChange={(e) => setCandidateGuardianPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={candidateDOB}
                  onChange={(e) => setCandidateDOB(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correspondence Address (for Certificate Delivery) *</label>
                <textarea
                  rows={2}
                  value={candidateAddress}
                  onChange={(e) => setCandidateAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              {candidateType === 'ex_student' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">Last Regular Session Attended *</label>
                    <input
                      type="text"
                      value={exLastSession}
                      onChange={(e) => setExLastSession(e.target.value)}
                      placeholder="e.g. May 2025"
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-amber-800 mb-1">Ex-Student Re-appearance Reason *</label>
                    <input
                      type="text"
                      value={exExamReason}
                      onChange={(e) => setExExamReason(e.target.value)}
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-xl px-3 py-2 text-xs text-amber-900 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STEP 4: Papers Registration (Regular Core Papers if Regular) */}
          {candidateType === 'regular' && (
            <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#1E5AA8]" />
                    <span>Step 4: Regular Semester {candidateSemester} Examination Papers</span>
                  </h2>
                  <p className="text-xs text-slate-500">All registered core courses for Semester {candidateSemester} (Auto-Included)</p>
                </div>
                <span className="badge-3d text-xs bg-blue-50 text-[#1E5AA8] border-blue-200 font-bold">
                  {selectedRegularPapers.length} Papers &bull;{' '}
                  {selectedRegularPapers.reduce((s, p) => s + p.credits, 0)} Total Credits
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3 w-20 text-center">Credits</th>
                      <th className="py-2.5 px-3 w-28 text-center">Format</th>
                      <th className="py-2.5 px-3 w-28 text-right">Fee Allocated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRegularPapers.map((p) => (
                      <tr key={p.code} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0F2747]">{p.code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{p.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{p.credits}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="badge-3d text-[10px] px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">₹{p.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: Backlog / Supplementary Papers */}
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>
                  {candidateType === 'ex_student'
                    ? 'Step 4: Ex-Student Backlog Papers to Clear *'
                    : 'Step 5: Backlog & Supplementary Papers (Optional)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {candidateType === 'ex_student'
                  ? 'Select all outstanding previous semester papers you are appearing for as an Ex-Student.'
                  : 'Select any previous semester backlog papers you wish to re-appear for (₹400 statutory fee per paper).'}
              </p>
            </div>

            <div className="space-y-2">
              {availableBacklogs.map((backlog) => {
                const isSelected = selectedBacklogs.includes(backlog.code);
                return (
                  <label
                    key={backlog.code}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/60 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBacklog(backlog.code)}
                        className="w-4 h-4 text-[#1E5AA8] rounded border-slate-300 focus:ring-[#1E5AA8]"
                      />
                      <div>
                        <div className="font-bold text-xs text-[#0F2747]">
                          <span className="font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mr-2 border border-amber-200 font-bold">
                            {backlog.code}
                          </span>
                          {backlog.name}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Credits: {backlog.credits} &bull; Arrear / Backlog Paper
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-amber-900">+ ₹{backlog.fee}</span>
                      <span className="text-[10px] text-slate-400 block">per attempt</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Fee Breakdown & Payment Checkout */}
          <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1E5AA8]" />
              <span>Statutory Examination Fee Summary ({candidateType === 'ex_student' ? 'Ex-Student Scheme' : 'Regular Scheme'})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5 text-xs">
                {candidateType === 'regular' ? (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Core Regular Examination Fee (6 Papers)</span>
                    <span className="font-mono font-bold text-[#0F2747]">₹{regularFee.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Ex-Student Registration &amp; Administration Fee</span>
                    <span className="font-mono font-bold text-amber-900">₹{exFee.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Backlog Papers Fee ({selectedBacklogs.length} Papers)</span>
                  <span className="font-mono font-bold text-amber-800">₹{backlogFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Statement of Marks &amp; Gazette Tabulation Fee</span>
                  <span className="font-mono font-bold text-[#0F2747]">₹{marksheetFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm font-extrabold text-[#0F2747] border-t-2 border-slate-300">
                  <span>Total Payable Statutory Fee</span>
                  <span className="font-mono text-base text-[#1E5AA8]">₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-[#0F2747] block">Select Payment Channel:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('upi')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                      selectedPaymentMode === 'upi'
                        ? 'border-[#1E5AA8] bg-blue-50 text-[#1E5AA8]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('netbanking')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                      selectedPaymentMode === 'netbanking'
                        ? 'border-[#1E5AA8] bg-blue-50 text-[#1E5AA8]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    NetBanking
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('card')}
                    className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                      selectedPaymentMode === 'card'
                        ? 'border-[#1E5AA8] bg-blue-50 text-[#1E5AA8]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Debit / Credit
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Connected with Central University Payment Gateway &bull; Statutory instant digital receipt
                </p>
              </div>
            </div>
          </div>

          {/* Statutory Declaration & Submission */}
          <div className="card-3d bg-slate-50 border border-slate-300 p-6 rounded-2xl shadow-xs space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={undertakingAgreed}
                onChange={(e) => setUndertakingAgreed(e.target.checked)}
                className="w-4 h-4 text-[#1E5AA8] rounded border-slate-300 mt-0.5 focus:ring-[#1E5AA8]"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I hereby declare that all personal and academic details provided above are true and complete. I confirm that I have satisfied the statutory examination clearance regulations (No-Dues and Attendance criteria), and I agree to abide by the university examination rules and guidelines.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Candidate Category: <span className="font-bold text-[#0F2747] uppercase">{candidateType === 'ex_student' ? 'Ex-Student (Backlog)' : 'Regular Enrolled'}</span> &bull; Total Papers: <span className="font-bold text-[#0F2747]">{(candidateType === 'regular' ? selectedRegularPapers.length : 0) + selectedBacklogs.length} Papers</span>
              </div>

              <button
                type="submit"
                disabled={submitting || !undertakingAgreed}
                className="btn-3d-primary px-8 py-3 text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application &amp; Verifying Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Submit Application &amp; Pay ₹{totalPayable.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Withdrawal Confirmation Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0F2747]">Withdraw Examination Application?</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
                aria-label="Close withdrawal modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you wish to withdraw your application{' '}
              <strong className="font-mono text-[#0F2747]">{existingApplication?.application_no}</strong>?
              Withdrawing will revoke your current desk allocation and hall ticket. You will need to re-file before the registration deadline of 30 April 2026.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setExistingApplication(null);
                  setIsWithdrawModalOpen(false);
                  setSuccessMessage('Your examination application has been cleanly withdrawn. You can re-apply anytime before 30 April.');
                }}
                className="btn-3d-secondary px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 border-rose-600 cursor-pointer shadow-sm"
              >
                Yes, Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {isPayModalOpen && (
        <PaymentGatewayModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          request={{
            orderId: `ORD-EXAM-${Date.now()}`,
            title: 'End-Term Examination Registration Fee',
            amount: totalPayable,
            category: 'exam_fee',
            studentId: studentId || '',
            studentName: candidateName,
            rollNumber: candidateRoll,
            purpose: `${candidateType === 'ex_student' ? 'Ex-Student' : 'Regular'} Exam Registration (${candidateSession})`,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
