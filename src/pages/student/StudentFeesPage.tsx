import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Award,
  Wallet,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  feeService,
  StudentFeeSummary,
  FeeTransaction,
  FeeHead
} from '../../services/feeService.js';
import { PaymentGatewayModal } from '../../components/common/PaymentGatewayModal.js';
import { PaymentReceipt } from '../../services/paymentService.js';

export const StudentFeesPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentFeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(3000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadFeeSummary();
  }, [user]);

  const loadFeeSummary = async () => {
    setLoading(true);
    try {
      const data = await feeService.getFeeSummary(user?.id);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (receipt: PaymentReceipt) => {
    try {
      const mode = receipt.paymentMode === 'DebitCard' ? 'CreditCard' : receipt.paymentMode;
      const txn = await feeService.payFee(payAmount, mode, user?.id);
      setToastMessage(`Payment of ₹${payAmount.toLocaleString('en-IN')} successful! Receipt No: ${txn.receipt_no}`);
      setIsPayModalOpen(false);
      await loadFeeSummary();
      setTimeout(() => setToastMessage(null), 5000);
    } catch {
      alert('Fee ledger reconciliation failed.');
    }
  };

  const handleDownloadReceipt = (txn: FeeTransaction) => {
    const text = `========================================================\nITM UNIVERSITY - OFFICIAL STATUTORY FEE RECEIPT\n========================================================\nReceipt Number: ${txn.receipt_no}\nTransaction Reference: ${txn.id}\nGateway Reference: ${txn.gateway_ref}\nDate: ${txn.date}\nAmount Paid: ₹${txn.amount.toLocaleString('en-IN')}\nPayment Mode: ${txn.payment_mode}\nParticulars Covered: ${txn.heads_covered}\nStatus: ${txn.status}\n\nAccounts & Finance Division, ITM University\n========================================================`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${txn.receipt_no.replace(/\//g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || !summary) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading Student Fee Ledger &amp; Reconciliation Record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Accounts &amp; Bursar Division
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Fee Status &amp; Payment Ledger
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {summary.semesterName} ({summary.academicYear}) &bull; Reconciled with Direct Benefit Transfer (DBT) Scholarships.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPayAmount(summary.outstandingBalance > 0 ? summary.outstandingBalance : 3000);
                setIsPayModalOpen(true);
              }}
              className="btn-3d-gold px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{summary.outstandingBalance > 0 ? 'Pay Outstanding Due' : 'Advance Payment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Billed Fees</p>
          <p className="text-2xl font-extrabold text-[#0F2747] mt-0.5">₹{summary.totalBilled.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-1">Full Academic Year Structure</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid by Student</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Reconciled via Bank &amp; Gateway</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scholarship Offset</p>
          <p className="text-2xl font-extrabold text-[#1E5AA8] mt-0.5">₹{summary.scholarshipOffset.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-700 font-semibold mt-1">Chancellor Merit 50% Waiver</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
          <p className={`text-2xl font-extrabold mt-0.5 ${summary.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            ₹{summary.outstandingBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {summary.outstandingBalance === 0 ? 'No Dues &bull; Clearance Active' : `Due by ${summary.nextDueDate}`}
          </p>
        </div>
      </div>

      {/* Scholarship Adjustment Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-emerald-50/40 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E5AA8] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100 text-[#0F2747] border border-blue-300">
                Grant Credited
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">₹25,000 Credited</span>
            </div>
            <h3 className="text-sm font-bold text-[#0F2747] mt-1">Chancellor Merit Scholarship 50% Tuition Remission</h3>
            <p className="text-xs text-slate-600">
              Sanction Order Ref: <strong>SCHOL-ORD-2025-091</strong> adjusted automatically towards Tuition Fee.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className="badge-3d text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Offset Complete
          </span>
        </div>
      </div>

      {/* Fee Breakdown by Head */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Receipt className="w-4 h-4 text-[#1E5AA8]" />
          Statutory Breakdown of Semester Heads
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Particulars / Head</th>
                <th className="py-2.5 px-3">Billed</th>
                <th className="py-2.5 px-3">Scholarship</th>
                <th className="py-2.5 px-3">Paid</th>
                <th className="py-2.5 px-3">Balance</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summary.feeHeads.map((head, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-bold text-[#0F2747]">{head.name}</td>
                  <td className="py-3 px-3 text-slate-700">₹{head.billed.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-blue-700">₹{head.scholarship_offset.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-emerald-700 font-bold">₹{head.paid.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-slate-700">₹{head.balance.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Settled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Ledger */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-[#1E5AA8]" />
          Payment Transactions &amp; Receipts History
        </h3>

        <div className="space-y-3">
          {summary.transactions.map((txn) => (
            <div
              key={txn.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {txn.receipt_no}
                  </span>
                  <span className="font-bold text-[#0F2747]">{txn.heads_covered}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {txn.date} &bull; Mode: <strong>{txn.payment_mode}</strong> &bull; Ref: {txn.gateway_ref}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#0F2747]">₹{txn.amount.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] font-bold text-emerald-700">SUCCESS</span>
                </div>
                <button
                  onClick={() => handleDownloadReceipt(txn)}
                  className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        request={{
          purpose: 'Semester Tuition & Institutional Dues',
          amount: payAmount,
          referenceId: `FEE-${Date.now().toString().slice(-6)}`,
          studentId: user?.id || 'stu-current',
          studentName: user?.user_metadata?.full_name || 'Student',
          rollNumber: (user?.user_metadata?.roll_number as string) || 'ENR-2026',
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
