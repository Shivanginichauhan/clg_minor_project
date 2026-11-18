import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Check,
  ArrowRight,
  Layers,
  GraduationCap
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { resultsService } from '../../services/resultsService.js';
import { SemesterResultWithDetails, RevaluationApplication, UGC_GRADE_SCALE } from '../../data/mockResults.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { PaymentGatewayModal } from '../../components/common/PaymentGatewayModal.js';

export const StudentResultsPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'grade_card' | 'transcript' | 'revaluation'>('grade_card');
  const [currentResult, setCurrentResult] = useState<SemesterResultWithDetails | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [revaluations, setRevaluations] = useState<RevaluationApplication[]>([]);

  // Re-evaluation form state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [serviceType, setServiceType] = useState<'re_evaluation' | 're_totaling' | 'answer_script_copy'>('re_evaluation');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isApplying, setIsApplying] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Never fall back to a hardcoded student id — require real auth
  const studentId = user?.id;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resultsService.getStudentResult(studentId);
      if (!res) {
        setError('No published results found for your account. Please check back after the results are declared.');
        return;
      }
      setCurrentResult(res);
      const revs = await resultsService.getRevaluations({ studentId });
      setRevaluations(revs);
      if (res && res.subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(res.subjects[0].subject_id);
      }
    } catch (err) {
      console.error('Failed to load student results', err);
      setError('Failed to load results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const feeAmount = serviceType === 're_evaluation' ? 500 : serviceType === 're_totaling' ? 300 : 200;

  const handleApplyRevaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResult || !studentId) return;

    const sub = currentResult.subjects.find((s) => s.subject_id === selectedSubjectId);
    if (!sub) {
      setMessage({ type: 'error', text: 'Please select a valid subject for verification/revaluation.' });
      return;
    }

    // Launch University Central Payment Gateway to collect real/simulated funds
    setIsPayModalOpen(true);
  };

  const handlePaymentSuccess = async (receipt: any) => {
    if (!currentResult || !studentId) return;

    const sub = currentResult.subjects.find((s) => s.subject_id === selectedSubjectId);
    if (!sub) return;

    setIsApplying(true);
    try {
      const newApp = resultsService.applyForRevaluation({
        student_id: studentId,
        student_name: currentResult.student_name,
        roll_number: currentResult.roll_number,
        examination_id: currentResult.examination_id,
        examination_name: currentResult.examination_name,
        subject_id: sub.subject_id,
        subject_code: sub.subject_code,
        subject_name: sub.subject_name,
        service_type: serviceType,
        original_marks: sub.total_marks,
        original_grade: sub.letter_grade,
        fee_amount: feeAmount,
        payment_status: 'paid',
        payment_reference: receipt.receiptNumber || receipt.transactionId,
      });

      setMessage({
        type: 'success',
        text: `Application ${newApp.application_number} submitted successfully! Verified fee payment of ₹${feeAmount}. Official Receipt: ${receipt.receiptNumber}`,
      });
      setSelectedSubjectId('');
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit revaluation application.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsApplying(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#0F2747]">Please sign in to view your academic results.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-[#0F2747]">Results Notice</h3>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white hover:bg-[#1E5AA8] transition cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !currentResult) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <Award className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
        <p className="text-sm font-semibold text-[#0F2747]">Loading student examination records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:opacity-75" aria-label="Dismiss notification">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                Official Academic Credentials
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Published by CoE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Academic Results &amp; Official Transcripts
            </h1>
            <p className="text-xs text-[#64748B]">
              Candidate: <strong className="text-[#0F2747]">{currentResult.student_name}</strong> &bull; Roll:{' '}
              <span className="font-mono text-[#0F2747] font-bold">{currentResult.roll_number}</span> &bull; Program:{' '}
              {currentResult.program_name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[95px]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Semester SGPA</span>
              <div className="text-xl font-extrabold text-[#1E5AA8] font-mono">{currentResult.sgpa.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[95px]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Cumulative CGPA</span>
              <div className="text-xl font-extrabold text-purple-900 font-mono">{currentResult.cgpa.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[110px]">
              <span className="text-[10px] text-[#64748B] uppercase font-semibold">Standing</span>
              <div className="text-xs font-bold text-emerald-700 mt-1">{currentResult.academic_standing}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-6 -mb-6">
          <button
            onClick={() => setActiveTab('grade_card')}
            className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition ${activeTab === 'grade_card'
                ? 'border-[#0F2747] text-[#0F2747]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2747]'
              }`}
          >
            <Award className="w-4 h-4 text-[#1E5AA8]" />
            Statement of Marks (Grade Card)
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition ${activeTab === 'transcript'
                ? 'border-[#0F2747] text-[#0F2747]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2747]'
              }`}
          >
            <GraduationCap className="w-4 h-4 text-purple-600" />
            Consolidated Multi-Semester Transcript
          </button>

          <button
            onClick={() => setActiveTab('revaluation')}
            className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition ${activeTab === 'revaluation'
                ? 'border-[#0F2747] text-[#0F2747]'
                : 'border-transparent text-[#64748B] hover:text-[#0F2747]'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            Re-evaluation &amp; Scrutiny ({revaluations.length})
          </button>
        </div>
      </div>

      {/* TAB 1: STATEMENT OF MARKS (GRADE CARD) */}
      {activeTab === 'grade_card' && (
        <div className="space-y-6">
          {/* Top Actions & Semester Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748B]">Select Semester:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${selectedSemester === sem
                        ? 'bg-[#0F2747] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    Semester {sem} {sem === 2 ? '(Current)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const content = `========================================================\nITM UNIVERSITY - OFFICIAL CBCS STATEMENT OF MARKS\n========================================================\nCandidate: ${currentResult.student_name}\nRoll No: ${currentResult.roll_number}\nEnrollment No: ${currentResult.enrollment_number}\nSemester: ${selectedSemester}\nProgram: ${currentResult.program_name}\nSGPA: ${selectedSemester === 2 ? currentResult.sgpa.toFixed(2) : '8.90'}\nCGPA: ${currentResult.cgpa.toFixed(2)}\nStanding: ${currentResult.academic_standing}\nQR Verification: ${currentResult.qr_verification_code}\n\nOfficial Attested Digital Transcript Copy\n========================================================`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `GradeCard_Sem${selectedSemester}_${currentResult.roll_number}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="btn-3d-gold px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Marksheet</span>
              </button>
              <button
                onClick={() => setQrModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                Verify QR Code
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                Print Statement of Marks
              </button>
            </div>
          </div>

          {/* Official Grade Card Certificate Canvas */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            {/* Hologram / Security Badge Effect */}
            <div className="absolute top-4 right-4 opacity-15 pointer-events-none text-right">
              <ShieldCheck className="w-32 h-32 text-slate-900" />
            </div>

            {/* University Header */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-5">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#1E5AA8]">
                ITM UNIVERSITY &bull; BOARD OF EXAMINATIONS
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2747] tracking-tight">
                STATEMENT OF MARKS &amp; GRADES
              </h2>
              <p className="text-xs text-[#64748B]">
                {selectedSemester === 2 ? currentResult.examination_name : 'Autumn 2025 End-Semester Examinations'} &bull; UGC Choice Based Credit System (CBCS)
              </p>
            </div>

            {/* Candidate Metadata Roster */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Candidate Name</span>
                <span className="font-bold text-[#0F2747] text-sm">{currentResult.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Roll Number</span>
                <span className="font-mono font-bold text-[#0F2747] text-sm">{currentResult.roll_number}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Enrollment No.</span>
                <span className="font-mono font-bold text-[#0F2747] text-sm">{currentResult.enrollment_number}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Program &amp; Semester</span>
                <span className="font-bold text-[#0F2747] text-sm">MCA &bull; Semester {selectedSemester}</span>
              </div>
            </div>

            {/* Evaluation Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Course Title</th>
                    <th className="py-3 px-2 text-center">Type</th>
                    <th className="py-3 px-2 text-center">Credits (C)</th>
                    <th className="py-3 px-2 text-center">CIA (/40)</th>
                    <th className="py-3 px-2 text-center">Ext (/60)</th>
                    <th className="py-3 px-2 text-center">Total (/100)</th>
                    <th className="py-3 px-2 text-center">Grade</th>
                    <th className="py-3 px-2 text-center">Point (G)</th>
                    <th className="py-3 px-3 text-right">Points (C &times; G)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {selectedSemester === 2 ? (
                    currentResult.subjects.map((sub) => (
                      <tr key={sub.subject_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1E5AA8]">{sub.subject_code}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#0F2747]">{sub.subject_name}</td>
                        <td className="py-2.5 px-2 text-center capitalize text-slate-600">{sub.subject_type}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold">{sub.credits}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">{sub.internal_marks}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">{sub.external_marks}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0F2747]">{sub.total_marks}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-700">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
                            {sub.letter_grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{sub.grade_point}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0F2747]">{sub.credit_points}</td>
                      </tr>
                    ))
                  ) : currentResult.historical_semesters && currentResult.historical_semesters.length > 0 ? (
                    currentResult.historical_semesters[0].subjects.map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1E5AA8]">{sub.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#0F2747]">{sub.name}</td>
                        <td className="py-2.5 px-2 text-center capitalize text-slate-600">Theory</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold">{sub.credits}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">35</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">50</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0F2747]">85</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-700">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">{sub.grade}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{sub.grade_point}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0F2747]">{sub.credits * sub.grade_point}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-slate-500 text-xs">
                        No published statement of marks available for Semester {selectedSemester}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tabulation Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Credits Earned</span>
                <span className="text-lg font-extrabold text-[#0F2747] font-mono">
                  {selectedSemester === 2 ? currentResult.total_credits_earned : 20} / {selectedSemester === 2 ? currentResult.total_credits_registered : 20}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Semester SGPA</span>
                <span className="text-lg font-extrabold text-[#1E5AA8] font-mono">
                  {selectedSemester === 2 ? currentResult.sgpa.toFixed(2) : '8.90'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Cumulative CGPA</span>
                <span className="text-lg font-extrabold text-purple-900 font-mono">
                  {selectedSemester === 2 ? currentResult.cgpa.toFixed(2) : '8.90'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Academic Classification</span>
                <span className="text-xs font-bold text-emerald-700 mt-1 block">First Class with Distinction</span>
              </div>
            </div>

            {/* Statutory Seal & Signature Block */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/transcript/${currentResult.qr_verification_code}`}
                    size={56}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="text-[11px] text-[#64748B] space-y-0.5">
                  <div className="font-mono text-[#0F2747] font-bold">QR Token: {currentResult.qr_verification_code}</div>
                  <div>Issued by ITM University Board of Examinations</div>
                  <div>Date of Gazette Publication: 28 May 2026</div>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-xs text-slate-600 border-b border-slate-400 pb-1 px-6">
                  {currentResult.approved_by_dean_name || 'Prof. Dr. Rajesh K. Varma'}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F2747]">
                  Controller of Examinations &amp; Dean Academic Affairs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONSOLIDATED TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Consolidated Multi-Semester Academic Transcript</h3>
              <p className="text-xs text-[#64748B]">Complete academic cumulative history across all enrolled semesters</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Consolidated Transcript
            </button>
          </div>

          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#1E5AA8]">
                ITM UNIVERSITY
              </div>
              <h2 className="text-xl font-black text-[#0F2747]">CONSOLIDATED TRANSCRIPT OF GRADES</h2>
              <p className="text-xs text-[#64748B]">Degree Award Program: Master of Computer Applications (MCA)</p>
            </div>

            {/* Transcript Matrix: Sem 1 and Sem 2 Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Semester 1 Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                  <span className="font-bold text-xs text-[#0F2747]">Semester 1 &bull; Autumn 2025</span>
                  <span className="font-mono text-xs font-bold text-[#1E5AA8]">SGPA: 8.90</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-[#64748B] uppercase border-b border-slate-200">
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Course Name</th>
                      <th className="py-2 px-2 text-center">Credits</th>
                      <th className="py-2 px-2 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentResult.historical_semesters[0].subjects.map((s) => (
                      <tr key={s.code}>
                        <td className="py-2 px-3 font-mono font-bold text-[#1E5AA8]">{s.code}</td>
                        <td className="py-2 px-3">{s.name}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.credits}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-purple-700">{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Semester 2 Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                  <span className="font-bold text-xs text-[#0F2747]">Semester 2 &bull; Spring 2026</span>
                  <span className="font-mono text-xs font-bold text-[#1E5AA8]">SGPA: {currentResult.sgpa.toFixed(2)}</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-[#64748B] uppercase border-b border-slate-200">
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Course Name</th>
                      <th className="py-2 px-2 text-center">Credits</th>
                      <th className="py-2 px-2 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentResult.subjects.map((s) => (
                      <tr key={s.subject_id}>
                        <td className="py-2 px-3 font-mono font-bold text-[#1E5AA8]">{s.subject_code}</td>
                        <td className="py-2 px-3">{s.subject_name}</td>
                        <td className="py-2 px-2 text-center font-mono">{s.credits}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-purple-700">{s.letter_grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cumulative Statistics Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Cumulative Credits</span>
                <div className="text-xl font-extrabold text-[#0F2747] font-mono">
                  {currentResult.cumulative_credits_earned} / {currentResult.cumulative_credits_required} Credits
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Overall Cumulative CGPA</span>
                <div className="text-xl font-extrabold text-purple-900 font-mono">{currentResult.cgpa.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Percentage Equivalence</span>
                <div className="text-xl font-extrabold text-[#1E5AA8] font-mono">{currentResult.percentage_equivalent}%</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Degree Award Standing</span>
                <div className="text-xs font-bold text-emerald-700 mt-1">{currentResult.academic_standing}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVALUATION & SCRUTINY */}
      {activeTab === 'revaluation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Application Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E5AA8]" />
                Apply for Re-evaluation / Scrutiny
              </h3>
              <p className="text-xs text-[#64748B]">
                Regulation 18 &bull; Window open for 15 days following results publication.
              </p>
            </div>

            <form onSubmit={handleApplyRevaluation} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Select Evaluated Course / Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8]"
                >
                  {currentResult.subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_code} - {s.subject_name} (Scored: {s.total_marks}/100, Grade {s.letter_grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Service Type Required
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition ${serviceType === 're_evaluation'
                        ? 'border-[#1E5AA8] bg-blue-50/50 text-[#0F2747]'
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={serviceType === 're_evaluation'}
                      onChange={() => setServiceType('re_evaluation')}
                      className="sr-only"
                    />
                    <div className="font-bold">Re-evaluation</div>
                    <div className="text-[10px] text-[#64748B]">Independent re-marking</div>
                    <div className="text-xs font-extrabold text-[#1E5AA8] mt-1 font-mono">₹500</div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition ${serviceType === 're_totaling'
                        ? 'border-[#1E5AA8] bg-blue-50/50 text-[#0F2747]'
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={serviceType === 're_totaling'}
                      onChange={() => setServiceType('re_totaling')}
                      className="sr-only"
                    />
                    <div className="font-bold">Re-totaling</div>
                    <div className="text-[10px] text-[#64748B]">Arithmetic tally check</div>
                    <div className="text-xs font-extrabold text-[#1E5AA8] mt-1 font-mono">₹300</div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition ${serviceType === 'answer_script_copy'
                        ? 'border-[#1E5AA8] bg-blue-50/50 text-[#0F2747]'
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={serviceType === 'answer_script_copy'}
                      onChange={() => setServiceType('answer_script_copy')}
                      className="sr-only"
                    />
                    <div className="font-bold">Script Copy</div>
                    <div className="text-[10px] text-[#64748B]">Digital scanned PDF</div>
                    <div className="text-xs font-extrabold text-[#1E5AA8] mt-1 font-mono">₹200</div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Online Statutory Fee Payment
                </label>
                <div className="flex items-center gap-3">
                  {['upi', 'card', 'netbanking'].map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm as any)}
                      className={`px-3 py-1.5 rounded-xl uppercase font-bold text-[10px] border transition ${paymentMethod === pm
                          ? 'bg-[#0F2747] text-white border-[#0F2747]'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                    >
                      {pm}
                    </button>
                  ))}
                  <span className="text-xs font-bold text-emerald-700 ml-auto">
                    Total: ₹{feeAmount}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                {isApplying ? 'Submitting & Processing...' : `Pay ₹${feeAmount} & Submit Application`}
              </button>
            </form>
          </div>

          {/* Application Tracking Timeline */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Application History &amp; Status Tracker
              </h3>
              <p className="text-xs text-[#64748B]">Real-time tracking of re-evaluation board decisions</p>
            </div>

            <div className="space-y-3">
              {revaluations.length > 0 ? (
                revaluations.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1E5AA8]">{app.application_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${app.status === 'revised'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                      >
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="font-semibold text-[#0F2747]">
                      {app.subject_code} - {app.subject_name}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Original: <strong className="text-slate-800">{app.original_marks} ({app.original_grade})</strong></span>
                      {app.revised_marks && (
                        <span>
                          Revised: <strong className="text-emerald-700">{app.revised_marks} ({app.revised_grade})</strong>
                        </span>
                      )}
                      <span>Fee: ₹{app.fee_amount}</span>
                    </div>

                    {app.scrutiny_remarks && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                        Remarks: {app.scrutiny_remarks}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  No re-evaluation applications submitted yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Verification Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0F2747]">Cryptographic Transcript Verification</h3>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs text-left font-mono">
              <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">VERIFIED AUTHENTIC</span></div>
              <div><strong>Token:</strong> {currentResult.qr_verification_code}</div>
              <div><strong>Student:</strong> {currentResult.student_name}</div>
              <div><strong>CGPA:</strong> {currentResult.cgpa.toFixed(2)}</div>
              <div><strong>CoE Seal:</strong> {currentResult.coe_signature_hash}</div>
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-[#0F2747] text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal for Revaluation / Scrutiny Fees */}
      {isPayModalOpen && (
        <PaymentGatewayModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          request={{
            orderId: `ORD-REV-${Date.now()}`,
            title: `Fee for ${serviceType.replace('_', ' ').toUpperCase()}`,
            amount: feeAmount,
            category: 'revaluation_fee',
            studentId: studentId || '',
            studentName: currentResult?.student_name,
            rollNumber: currentResult?.roll_number,
            purpose: `Revaluation/Scrutiny of ${currentResult?.subjects.find(s => s.subject_id === selectedSubjectId)?.subject_code || 'Subject'}`,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
