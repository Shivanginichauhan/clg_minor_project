import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { paymentService, PaymentRequest, PaymentReceipt } from '../../services/paymentService.js';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PaymentRequest;
  onSuccess: (receipt: PaymentReceipt) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NetBanking' | 'DebitCard'>('UPI');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8912');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('321');
  const [processing, setProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<PaymentReceipt | null>(null);

  if (!isOpen) return null;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const receipt = await paymentService.processPayment(request, paymentMode, {
        upiId: paymentMode === 'UPI' ? upiId : undefined,
        bankName: paymentMode === 'NetBanking' ? selectedBank : undefined,
        cardNumber: paymentMode === 'DebitCard' ? cardNumber : undefined,
      });
      setCompletedReceipt(receipt);
      setTimeout(() => {
        onSuccess(receipt);
        onClose();
      }, 1500);
    } catch (err) {
      alert('Payment processing failed. Please retry.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#0F2747] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">ITM Secure Payment Gateway</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-mono">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-300">{request.title} &bull; Ref: {request.orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {completedReceipt ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Payment Successfully Authorized!</h4>
            <p className="text-xs text-slate-500">
              ₹{completedReceipt.amount.toLocaleString('en-IN')} received. Official Receipt: <strong className="text-slate-800">{completedReceipt.receiptNumber}</strong>
            </p>
            <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 border border-slate-200">
              Bank Ref: {completedReceipt.bankReference}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePayNow} className="p-6 space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Total Payable Amount</span>
                <span className="text-2xl font-black text-[#0F2747]">₹{request.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span className="font-semibold block text-slate-700">{request.studentName}</span>
                <span className="font-mono">{request.rollNumber || 'Enrolled Student'}</span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  paymentMode === 'UPI'
                    ? 'border-[#1E5AA8] bg-blue-50/60 text-[#1E5AA8] font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <QrCode className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('NetBanking')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  paymentMode === 'NetBanking'
                    ? 'border-[#1E5AA8] bg-blue-50/60 text-[#1E5AA8] font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('DebitCard')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                  paymentMode === 'DebitCard'
                    ? 'border-[#1E5AA8] bg-blue-50/60 text-[#1E5AA8] font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Debit Card</span>
              </button>
            </div>

            {/* Mode Specific Inputs */}
            {paymentMode === 'UPI' && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 w-fit mx-auto shadow-2xs">
                  <QRCodeSVG
                    value={`upi://pay?pa=itm.university@icici&pn=ITM%20University&am=${request.amount}&cu=INR&tn=${request.orderId}`}
                    size={110}
                    level="M"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Scan with GPay / PhonePe / Paytm or enter VPA</span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="mt-2 w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#1E5AA8] font-mono text-center"
                    required
                  />
                </div>
              </div>
            )}

            {paymentMode === 'NetBanking' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Authorized University Banker</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1E5AA8] font-medium"
                >
                  <option value="State Bank of India">State Bank of India (Integrated Campus Branch)</option>
                  <option value="HDFC Bank">HDFC Bank SmartHub</option>
                  <option value="ICICI Bank">ICICI Institutional Pay</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                </select>
                <p className="text-[11px] text-slate-500">You will simulate instant university institutional portal clearance.</p>
              </div>
            )}

            {paymentMode === 'DebitCard' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={3}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>PCI-DSS Level 1 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-3d-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{request.amount.toLocaleString('en-IN')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
