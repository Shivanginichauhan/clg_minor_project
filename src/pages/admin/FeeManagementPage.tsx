import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Download,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Printer,
  XCircle,
  FileText,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  Clock,
  Send
} from 'lucide-react';
import { adminService, StudentFeeRecord, FeeStructure, FeeReceipt, RefundApplication } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const FeeManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'STRUCTURES' | 'RECEIPTS' | 'REFUNDS'>('LEDGER');
  const [studentFees, setStudentFees] = useState<StudentFeeRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [receipts, setReceipts] = useState<FeeReceipt[]>([]);
  const [refunds, setRefunds] = useState<RefundApplication[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);

  // New Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<StudentFeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<FeeReceipt['payment_mode']>('NetBanking');
  const [paymentRef, setPaymentRef] = useState('');
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);

  // New Structure Modal State
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [newStruct, setNewStruct] = useState<Partial<FeeStructure>>({
    program_code: 'MCA',
    program_name: 'Master of Computer Applications',
    semester: 3,
    academic_year: '2026-2027',
    tuition_fee: 50000,
    lab_fee: 8500,
    library_fee: 4500,
    exam_fee: 3000,
    development_fee: 2500,
    due_date: '2026-08-15',
  });

  const reloadData = () => {
    setStudentFees(adminService.getStudentFees());
    setFeeStructures(adminService.getFeeStructures());
    setReceipts(adminService.getReceipts());
    setRefunds(adminService.getRefunds());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Compute Overview Metrics
  const totalBilled = studentFees.reduce((acc, curr) => acc + curr.total_billed, 0);
  const totalCollected = studentFees.reduce((acc, curr) => acc + curr.total_paid, 0);
  const totalScholarship = studentFees.reduce((acc, curr) => acc + curr.scholarship_offset, 0);
  const totalOutstanding = studentFees.reduce((acc, curr) => acc + curr.balance_due, 0);
  const collectionRate = totalBilled > 0 ? ((totalCollected + totalScholarship) / totalBilled) * 100 : 0;
  const defaulterCount = studentFees.filter((s) => s.status === 'OVERDUE' || s.balance_due > 0).length;

  const filteredStudents = studentFees.filter((s) => {
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.program.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDispatchFeeNotices = () => {
    setIsDispatching(true);
    const defaulters = studentFees.filter((s) => s.status === 'OVERDUE' || s.balance_due > 0);
    const campaign = adminService.dispatchCampaign({
      campaign_name: `Statutory Fee Dues & Hall-Ticket Clearance Notice [${new Date().toLocaleDateString('en-IN')}]`,
      channel: 'OMNICHANNEL',
      target_audience: 'DEFAULTERS_ONLY',
      subject: 'URGENT: Outstanding Semester Fee Clearance Notice',
      body_template: 'URGENT NOTICE: Outstanding semester fee balance must be cleared within 7 statutory working days to prevent examination hall ticket debarment. Please login to portal to remit balance.',
      total_recipients: defaulters.length,
      sent_count: defaulters.length,
      delivered_count: Math.floor(defaulters.length * 0.98),
      opened_count: Math.floor(defaulters.length * 0.76),
      bounced_count: Math.ceil(defaulters.length * 0.02),
      dispatched_by: 'Office of the Finance Registrar',
    });
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchStatus(`Successfully dispatched fee reminders to ${campaign.sent_count} students via SMS & Email portal.`);
      setTimeout(() => setDispatchStatus(null), 6000);
    }, 600);
  };

  const handleOpenPaymentModal = (student: StudentFeeRecord) => {
    setSelectedStudentForPayment(student);
    setPaymentAmount(student.balance_due || 5000);
    setPaymentRef(`TXN-${Date.now().toString().slice(-6)}`);
    setIsReceiptModalOpen(true);
  };

  const handleIssueReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;

    const receipt = adminService.issueFeeReceipt({
      student_id: selectedStudentForPayment.student_id,
      roll_number: selectedStudentForPayment.roll_number,
      student_name: selectedStudentForPayment.student_name,
      program: selectedStudentForPayment.program,
      semester: selectedStudentForPayment.semester,
      amount: Number(paymentAmount),
      payment_mode: paymentMode,
      transaction_ref: paymentRef,
      heads: [{ name: 'Institutional Tuition & Term Fee', amount: Number(paymentAmount) }],
      cashier: 'CoE Central Cashier Desk',
    });

    reloadData();
    setIsReceiptModalOpen(false);
    setSelectedReceipt(receipt);
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    const total =
      Number(newStruct.tuition_fee || 0) +
      Number(newStruct.lab_fee || 0) +
      Number(newStruct.library_fee || 0) +
      Number(newStruct.exam_fee || 0) +
      Number(newStruct.development_fee || 0);

    const struct: FeeStructure = {
      id: `fs-${Date.now()}`,
      program_code: newStruct.program_code || 'MCA',
      program_name: newStruct.program_name || 'MCA',
      semester: Number(newStruct.semester || 1),
      academic_year: newStruct.academic_year || '2026-2027',
      tuition_fee: Number(newStruct.tuition_fee || 0),
      lab_fee: Number(newStruct.lab_fee || 0),
      library_fee: Number(newStruct.library_fee || 0),
      exam_fee: Number(newStruct.exam_fee || 0),
      development_fee: Number(newStruct.development_fee || 0),
      total_fee: total,
      due_date: newStruct.due_date || '2026-08-15',
    };

    adminService.saveFeeStructure(struct);
    reloadData();
    setIsStructureModalOpen(false);
  };

  const handleRefundAction = (id: string, amount: number, status: 'APPROVED' | 'REJECTED') => {
    adminService.processRefund(id, amount, 'Finance Administrator', status);
    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Institutional Accounts & Bursar</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              University Fee & Revenue Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Configure program fee structures, reconcile real-time student ledgers, issue statutory payment receipts, and enforce clearance rules.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-medium">Collection Efficiency</p>
              <div className="text-xl font-bold text-white mt-0.5">{collectionRate.toFixed(1)}%</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="academic-card p-5 border-l-4 border-l-[#1E5AA8]">
          <p className="text-xs text-slate-500 font-medium">Total Billed Dues</p>
          <div className="text-2xl font-bold text-[#0F2747] mt-1">₹{totalBilled.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500 mt-0.5">AY 2025-26 Active Cohorts</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs text-slate-500 font-medium">Collected Revenue</p>
          <div className="text-2xl font-bold text-emerald-700 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">+₹{totalScholarship.toLocaleString('en-IN')} via Scholarship Offset</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-rose-600">
          <p className="text-xs text-slate-500 font-medium">Outstanding Dues</p>
          <div className="text-2xl font-bold text-rose-700 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</div>
          <p className="text-xs text-rose-600 mt-0.5 font-medium">{defaulterCount} Candidates Pending</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-medium">Refund / Dispute Requests</p>
          <div className="text-2xl font-bold text-amber-600 mt-1">{refunds.filter(r => r.status === 'PENDING_APPROVAL').length} Pending</div>
          <p className="text-xs text-slate-500 mt-0.5">Dean/Bursar Approval Queue</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'LEDGER'
              ? 'border-[#0F2747] text-[#0F2747] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Student Fee Ledger & Defaulters
        </button>

        <button
          onClick={() => setActiveTab('STRUCTURES')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'STRUCTURES'
              ? 'border-[#0F2747] text-[#0F2747] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          Fee Head Structures ({feeStructures.length})
        </button>

        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'RECEIPTS'
              ? 'border-[#0F2747] text-[#0F2747] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Receipt Repository ({receipts.length})
        </button>

        <button
          onClick={() => setActiveTab('REFUNDS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'REFUNDS'
              ? 'border-[#0F2747] text-[#0F2747] font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Fee Refunds & Disputes ({refunds.length})
        </button>
      </div>

      {/* ── TAB 1: STUDENT FEE LEDGER ── */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, roll number, or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDispatchFeeNotices}
                disabled={isDispatching || defaulterCount === 0}
                className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                title="Send SMS and email alerts to all students with outstanding balances"
              >
                <Send className="w-3.5 h-3.5" />
                {isDispatching ? 'Dispatching...' : `Dispatch Due Notices (${defaulterCount})`}
              </button>
              <button
                onClick={() => {
                  const csv = [
                    'Roll No,Student Name,Program,Sem,Billed,Paid,Scholarship,Balance,Status',
                    ...filteredStudents.map(
                      (s) =>
                        `${s.roll_number},"${s.student_name}",${s.program},${s.semester},${s.total_billed},${s.total_paid},${s.scholarship_offset},${s.balance_due},${s.status}`
                    ),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ITM_Fee_Ledger_${new Date().toISOString().substring(0, 10)}.csv`;
                  a.click();
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 text-slate-700"
              >
                <Download className="w-4 h-4" />
                Export Ledger CSV
              </button>
            </div>
          </div>

          {dispatchStatus && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{dispatchStatus}</span>
            </div>
          )}

          <div className="academic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Scholar Details</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4 text-right">Billed</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Scholarship</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Hall Ticket</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F2747]">{s.student_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{s.roll_number}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {s.program} · Sem {s.semester}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        ₹{s.total_billed.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                        ₹{s.total_paid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-indigo-700">
                        {s.scholarship_offset > 0 ? `₹${s.scholarship_offset.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                        ₹{s.balance_due.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.hall_ticket_blocked ? (
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            CLEAR
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.balance_due > 0 ? (
                          <button
                            onClick={() => handleOpenPaymentModal(s)}
                            className="px-3 py-1.5 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] transition"
                          >
                            Collect Fee
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const r = receipts.find((x) => x.student_id === s.student_id || x.roll_number === s.roll_number);
                              if (r) setSelectedReceipt(r);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                          >
                            View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FEE STRUCTURE CONFIGURATION ── */}
      {activeTab === 'STRUCTURES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Statutory Academic Fee Schedules</h3>
              <p className="text-xs text-slate-500">Board of Management approved fees broken down per semester and heads.</p>
            </div>
            <button
              onClick={() => setIsStructureModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Configure New Term Fee
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {feeStructures.map((fs) => (
              <div key={fs.id} className="academic-card p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono bg-blue-50 text-[#1E5AA8] px-2 py-0.5 rounded font-semibold">
                      {fs.program_code} · Sem {fs.semester}
                    </span>
                    <h4 className="text-sm font-bold text-[#0F2747] mt-1">{fs.program_name}</h4>
                    <p className="text-xs text-slate-500">Academic Year: {fs.academic_year}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tuition Fee</span>
                    <span className="font-semibold text-slate-800">₹{fs.tuition_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Lab / Sandbox</span>
                    <span className="font-semibold text-slate-800">₹{fs.lab_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Library & Journals</span>
                    <span className="font-semibold text-slate-800">₹{fs.library_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Examination Fee</span>
                    <span className="font-semibold text-slate-800">₹{fs.exam_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Development Fund</span>
                    <span className="font-semibold text-slate-800">₹{fs.development_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-[#0F2747] text-sm">
                    <span>Total Billed Per Student</span>
                    <span className="text-emerald-700">₹{fs.total_fee.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 flex justify-between items-center">
                  <span>Due Date: {fs.due_date}</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Term
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: RECEIPT REPOSITORY ── */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Statutory Fee Receipts</h3>
              <p className="text-xs text-slate-500">Official university-signed receipts for all fee collections.</p>
            </div>
          </div>

          <div className="academic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Scholar</th>
                    <th className="py-3 px-4">Payment Channel</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-[#0F2747]">{r.receipt_no}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{r.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0F2747]">{r.student_name}</div>
                        <div className="text-xs text-slate-500">{r.roll_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {r.payment_mode}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{r.transaction_ref}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{r.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            r.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(r)}
                          className="px-3 py-1 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 text-[#0F2747]"
                        >
                          Print / View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: REFUNDS & DISPUTES ── */}
      {activeTab === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Fee Refund & Duplicate Payment Scrutiny</h3>
              <p className="text-xs text-slate-500">Formal refund requests vetted for gateway reconciliation and Dean signoff.</p>
            </div>
          </div>

          <div className="space-y-3">
            {refunds.map((ref) => (
              <div key={ref.id} className="academic-card p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      REF-ID: {ref.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        ref.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ref.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ref.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F2747]">
                    {ref.student_name} ({ref.roll_number})
                  </h4>
                  <p className="text-xs text-slate-600">{ref.reason}</p>
                  <div className="text-xs text-slate-500">
                    Bank: {ref.bank_details.bank_name} · A/C: {ref.bank_details.account_no} · IFSC: {ref.bank_details.ifsc}
                  </div>
                  <div className="text-xs text-slate-400">Applied on: {ref.applied_date}</div>
                </div>

                <div className="flex flex-col md:items-end justify-between shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Requested Amount</p>
                    <div className="text-xl font-bold text-rose-700">₹{ref.amount_requested.toLocaleString('en-IN')}</div>
                    {ref.approver && (
                      <p className="text-[11px] text-slate-500 mt-0.5">Approved by: {ref.approver}</p>
                    )}
                  </div>

                  {ref.status === 'PENDING_APPROVAL' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleRefundAction(ref.id, ref.amount_requested, 'APPROVED')}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => handleRefundAction(ref.id, 0, 'REJECTED')}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: COLLECT FEE & ISSUE RECEIPT ── */}
      {isReceiptModalOpen && selectedStudentForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Collect Fee & Issue Statutory Receipt
              </h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800 text-sm">
                <span>{selectedStudentForPayment.student_name}</span>
                <span>{selectedStudentForPayment.roll_number}</span>
              </div>
              <div className="text-slate-500">
                {selectedStudentForPayment.program} · Semester {selectedStudentForPayment.semester}
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span>Current Outstanding Dues:</span>
                <span className="font-bold text-rose-700">₹{selectedStudentForPayment.balance_due.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleIssueReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Collect (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={selectedStudentForPayment.balance_due}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-base text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="NetBanking">Net Banking</option>
                    <option value="UPI">UPI</option>
                    <option value="Demand Draft">Demand Draft</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Challan">Bank Challan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gateway / Challan Ref #</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Confirm & Affix Digital Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIGURE NEW FEE SCHEDULE ── */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747]">Define New Academic Term Fee</h3>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Code</label>
                  <input
                    type="text"
                    value={newStruct.program_code}
                    onChange={(e) => setNewStruct({ ...newStruct, program_code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    value={newStruct.semester}
                    onChange={(e) => setNewStruct({ ...newStruct, semester: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Program Title</label>
                <input
                  type="text"
                  value={newStruct.program_name}
                  onChange={(e) => setNewStruct({ ...newStruct, program_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={newStruct.tuition_fee}
                    onChange={(e) => setNewStruct({ ...newStruct, tuition_fee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lab / Sandbox (₹)</label>
                  <input
                    type="number"
                    value={newStruct.lab_fee}
                    onChange={(e) => setNewStruct({ ...newStruct, lab_fee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Library Fee (₹)</label>
                  <input
                    type="number"
                    value={newStruct.library_fee}
                    onChange={(e) => setNewStruct({ ...newStruct, library_fee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Fee (₹)</label>
                  <input
                    type="number"
                    value={newStruct.exam_fee}
                    onChange={(e) => setNewStruct({ ...newStruct, exam_fee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={newStruct.due_date}
                  onChange={(e) => setNewStruct({ ...newStruct, due_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2747] text-white rounded font-semibold hover:bg-[#1E5AA8]"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFICIAL PRINTABLE RECEIPT ── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 border-4 border-double border-[#0F2747]">
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <UniversityCrest size="md" variant="navy" />
                <div>
                  <h2 className="text-lg font-bold text-[#0F2747] font-academic-serif">ITM UNIVERSITY</h2>
                  <p className="text-xs text-slate-500">Office of the Registrar & Finance Comptroller</p>
                  <p className="text-[11px] text-slate-400">Statutory Fee Receipt (Official Copy)</p>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-500">Receipt No:</span>
                <p className="font-mono font-bold text-[#0F2747] text-sm">{selectedReceipt.receipt_no}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Date Issued:</span>
                <p className="font-semibold text-slate-800">{selectedReceipt.date}</p>
              </div>
              <div>
                <span className="text-slate-500">Student Name:</span>
                <p className="font-bold text-slate-800">{selectedReceipt.student_name}</p>
                <p className="font-mono text-slate-500">{selectedReceipt.roll_number}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Program / Semester:</span>
                <p className="font-semibold text-slate-800">{selectedReceipt.program} · Sem {selectedReceipt.semester}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700">Payment Breakdown:</div>
              {selectedReceipt.heads.map((h, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{h.name}</span>
                  <span className="font-semibold text-slate-800">₹{h.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-base text-[#0F2747]">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">₹{selectedReceipt.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-900">Payment Mode:</span> {selectedReceipt.payment_mode}
                <div className="font-mono text-emerald-800 text-[10px]">Ref: {selectedReceipt.transaction_ref}</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Digitally Authenticated
                </span>
                <span className="text-[10px] text-emerald-600">Seal: ITM-FIN-2026-OK</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Cashier: {selectedReceipt.cashier}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
