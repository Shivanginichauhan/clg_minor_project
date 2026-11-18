import React, { useState } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  ShieldCheck,
  Building,
  TrendingUp,
  Download,
  Printer,
  Search,
  Filter,
  Check,
  X,
  Lock,
  Layers,
  Sparkles,
  PieChart
} from 'lucide-react';
import { deanService, InstitutionalBudget } from '../../services/deanService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DeanBudgetPage: React.FC = () => {
  const [budget, setBudget] = useState<InstitutionalBudget>(deanService.getBudget());
  const [selectedFY, setSelectedFY] = useState('FY 2025-26');

  const remainingBudget = Math.max(0, budget.totalScholarshipAllocated - budget.totalScholarshipSanctioned);
  const utilizationPct = Math.min(100, Math.round((budget.totalScholarshipSanctioned / budget.totalScholarshipAllocated) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Academic Finance</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Institutional Scholarship Pool &amp; Departmental Budget Oversight</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Budget &amp; Academic Grant Oversight
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Track multi-department academic allocations, scholarship disbursement velocity, Vice-Chancellor co-signature thresholds (&gt; ₹75,000), and treasury fund transfers.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Available Pool</span>
              <div className="text-2xl font-academic-display font-extrabold text-emerald-400 mt-0.5">
                ₹{(remainingBudget / 100000).toFixed(1)}L
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">Uncommitted Ceiling</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Annual Pool</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#0F2747] font-mono">
            ₹{(budget.totalScholarshipAllocated / 100000).toFixed(1)} Lakhs
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{budget.fiscalYear} Academic Council</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned Grants</span>
          <span className="text-2xl font-academic-display font-extrabold text-amber-800 font-mono">
            ₹{(budget.totalScholarshipSanctioned / 100000).toFixed(1)} Lakhs
          </span>
          <span className="text-[10px] text-amber-700 block mt-0.5 font-semibold">{utilizationPct}% Pool Committed</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Balance</span>
          <span className="text-2xl font-academic-display font-extrabold text-emerald-700 font-mono">
            ₹{(remainingBudget / 100000).toFixed(1)} Lakhs
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">Available for Sanction</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Treasury DBT Disbursed</span>
          <span className="text-2xl font-academic-display font-extrabold text-blue-700 font-mono">
            ₹{(budget.totalScholarshipDisbursed / 100000).toFixed(1)} Lakhs
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Bank Disbursed to Students</span>
        </div>
      </div>

      {/* Statutory Rules Card */}
      <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <div className="font-bold">Statutory Approval Limit &amp; VC Concurrence Threshold</div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              The Dean of Academic Affairs holds statutory sanction authority up to <strong>₹75,000</strong> per scholar. Sanctions exceeding ₹75,000 automatically require Vice-Chancellor joint digital signature.
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Breakdown Table */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-[#1E5AA8]" />
            <span>Department-Wise Scholarship &amp; Academic Expenditure ({budget.fiscalYear})</span>
          </h2>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1E5AA8]" />
            <span>Export Statement</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Academic Department</th>
                <th className="py-3 px-4 text-right">Allocated Budget</th>
                <th className="py-3 px-4 text-right">Utilized / Sanctioned</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4">Utilization %</th>
                <th className="py-3 px-3 text-center">Pending Requisitions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budget.departmentBudgets.map((dept) => {
                const rem = dept.allocated - dept.utilized;
                const pct = Math.round((dept.utilized / dept.allocated) * 100);

                return (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-[#0F2747]">
                      {dept.departmentName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      ₹{dept.allocated.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                      ₹{dept.utilized.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{rem.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600 font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`badge-3d text-[10px] font-bold px-2 py-0.5 ${
                        dept.pendingRequisitions > 0 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {dept.pendingRequisitions} Pending
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
