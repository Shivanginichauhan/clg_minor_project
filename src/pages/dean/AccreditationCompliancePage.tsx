import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
  Printer,
  BarChart3,
  TrendingUp,
  BookOpen,
  Users,
  Search,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { INITIAL_ACCREDITATION_METRICS, AccreditationMetric } from '../../services/deanService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const AccreditationCompliancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<AccreditationMetric[]>(INITIAL_ACCREDITATION_METRICS);
  const [selectedFramework, setSelectedFramework] = useState<'ALL' | 'NAAC' | 'NBA' | 'NIRF'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = metrics.filter((m) => {
    const matchesFw = selectedFramework === 'ALL' || m.framework === selectedFramework;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFw && matchesSearch;
  });

  const compliantCount = metrics.filter((m) => m.status === 'compliant').length;
  const attentionCount = metrics.filter((m) => m.status === 'attention_required').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Quality Assurance</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>NAAC &bull; NBA &bull; UGC &bull; NIRF Statutory Accreditation Desk</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Accreditation &amp; Compliance Radar
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Map institutional pass rates, student-to-faculty ratios, doctoral credentials, and curriculum outcomes directly against NAAC Criteria 1–7, NBA Outcome Benchmarks, and UGC statutory thresholds.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">NAAC Projected Grade</span>
              <div className="text-2xl font-academic-display font-extrabold text-emerald-400 mt-0.5">
                A++ (3.52)
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">Institutional SSR Track</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* KPI Benchmarks Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Accreditation Metrics</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#0F2747]">{metrics.length} Benchmarks</span>
          <span className="text-[10px] text-emerald-700 block mt-0.5 font-semibold">100% Tracked Live</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Benchmark Compliant</span>
          <span className="text-2xl font-academic-display font-extrabold text-emerald-700">{compliantCount} Passed</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Above Target Threshold</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Attention Required</span>
          <span className="text-2xl font-academic-display font-extrabold text-amber-700">{attentionCount} Gaps</span>
          <span className="text-[10px] text-amber-800 block mt-0.5 font-semibold">FDP Hours Deficit</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Institutional SSR Status</span>
          <span className="badge-3d text-[11px] font-bold inline-block mt-1 bg-emerald-50 text-emerald-800 border-emerald-300">
            Audit Ready ✓
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Self Study Report</span>
        </div>
      </div>

      {/* Filter and Framework Selector */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search criterion, metric code, or benchmark detail..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'NAAC', 'NBA', 'NIRF'] as const).map((fw) => (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedFramework === fw
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1E5AA8]" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Benchmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isCompliant = item.status === 'compliant';
          const progressPct = Math.min(100, Math.round((item.institutionalActual / item.targetBenchmark) * 100));

          return (
            <div
              key={item.criterionId}
              className="card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 hover:border-amber-400/80 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-800 border border-slate-200">
                      {item.code}
                    </span>
                    <span className="badge-3d text-[10px] font-bold px-2 py-0.5 uppercase bg-blue-50 text-[#1E5AA8] border-blue-200">
                      {item.framework}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#0F2747] mt-1.5">{item.name}</h3>
                </div>

                <span
                  className={`badge-3d text-[10px] font-bold px-2.5 py-1 uppercase ${
                    isCompliant
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {isCompliant ? 'Compliant ✓' : 'Attention Required'}
                </span>
              </div>

              {/* Progress Bar & Numerical Metrics */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Benchmark Target: <strong className="text-[#0F2747] font-mono">{item.targetBenchmark} {item.unit}</strong></span>
                  <span className="text-slate-500">Actual: <strong className="text-emerald-700 font-mono">{item.institutionalActual} {item.unit}</strong></span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompliant ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
