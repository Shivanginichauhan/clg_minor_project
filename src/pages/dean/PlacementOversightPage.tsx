import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Building,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Printer,
  Sparkles,
  FileCheck,
  ShieldCheck,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { adminService } from '../../services/adminService.js';

interface ProgramPlacementStat {
  programCode: string;
  programName: string;
  totalEligible: number;
  placedStudents: number;
  placementPct: number;
  highestPackageLPA: number;
  averagePackageLPA: number;
  topRecruiters: string[];
}

const INITIAL_PLACEMENT_STATS: ProgramPlacementStat[] = [
  {
    programCode: 'MCA',
    programName: 'Master of Computer Applications',
    totalEligible: 78,
    placedStudents: 72,
    placementPct: 92.3,
    highestPackageLPA: 24.5,
    averagePackageLPA: 8.8,
    topRecruiters: ['Amazon AWS', 'TCS Digital', 'Infosys Finacle', 'Oracle India']
  },
  {
    programCode: 'B.Tech-CSE',
    programName: 'B.Tech in Computer Science & Engineering',
    totalEligible: 120,
    placedStudents: 108,
    placementPct: 90.0,
    highestPackageLPA: 32.0,
    averagePackageLPA: 9.4,
    topRecruiters: ['Microsoft', 'Cisco', 'Cognizant GenC Next', 'L&T Infotech']
  },
  {
    programCode: 'MBA',
    programName: 'Master of Business Administration',
    totalEligible: 60,
    placedStudents: 54,
    placementPct: 90.0,
    highestPackageLPA: 16.0,
    averagePackageLPA: 7.2,
    topRecruiters: ['Deloitte USI', 'HDFC Bank', 'ICICI Securities', 'KPMG']
  }
];

export const PlacementOversightPage: React.FC = () => {
  const [stats, setStats] = useState<ProgramPlacementStat[]>(INITIAL_PLACEMENT_STATS);
  const [searchQuery, setSearchQuery] = useState('');
  const [placementDrives, setPlacementDrives] = useState<any[]>([]);

  useEffect(() => {
    try {
      const drives = adminService.getPlacementDrives();
      setPlacementDrives(drives);
    } catch (err) {
      console.error('Failed to load placement drives:', err);
    }
  }, []);

  const totalEligible = stats.reduce((s, p) => s + p.totalEligible, 0);
  const totalPlaced = stats.reduce((s, p) => s + p.placedStudents, 0);
  const overallPct = totalEligible > 0 ? Math.round((totalPlaced / totalEligible) * 100) : 0;
  const maxLPA = stats.length > 0 ? Math.max(...stats.map((p) => p.highestPackageLPA)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Corporate Relations</span>
              </span>
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-400/40 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span>Sample Data &bull; Placement Cell Integration Pending</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Institutional Placement &amp; Industry Advisory Board Desk</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Placement &amp; Corporate Engagement Oversight
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Monitor university-wide campus placements, recruiter partnerships, student eligibility criteria, salary distributions, and mandatory industry internship certifications.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Placement Rate</span>
              <div className="text-2xl font-academic-display font-extrabold text-emerald-400 mt-0.5">
                {overallPct}% Placed
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">{totalPlaced} of {totalEligible} Students</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Eligible Cohort</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#0F2747] font-mono">{totalEligible} Students</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Graduating Class of 2026</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Highest Package</span>
          <span className="text-2xl font-academic-display font-extrabold text-emerald-700 font-mono">{maxLPA} LPA</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">Tier 1 Cloud Architecture</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Recruiter Partnerships</span>
          <span className="text-2xl font-academic-display font-extrabold text-[#1E5AA8] font-mono">48 Companies</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Active Campus Drives</span>
        </div>

        <div className="stat-box-3d p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Industry Advisory Board</span>
          <span className="badge-3d text-[11px] font-bold inline-block mt-1 bg-emerald-50 text-emerald-800 border-emerald-300">
            Convened Q1 ✓
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Curriculum Aligned</span>
        </div>
      </div>

      {/* Program Placement Table */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Program-Wise Placement &amp; Package Distribution</span>
          </h2>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1E5AA8]" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-3 text-center">Eligible / Placed</th>
                <th className="py-3 px-3 text-center">Placement %</th>
                <th className="py-3 px-4 text-right">Avg Package</th>
                <th className="py-3 px-4 text-right">Max Package</th>
                <th className="py-3 px-4">Prominent Corporate Recruiters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((prog) => (
                <tr key={prog.programCode} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-[#0F2747]">
                    <div>{prog.programName}</div>
                    <span className="font-mono text-[10px] text-slate-400">{prog.programCode}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {prog.placedStudents} / {prog.totalEligible}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {prog.placementPct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0F2747]">
                    ₹{prog.averagePackageLPA} LPA
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ₹{prog.highestPackageLPA} LPA
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {prog.topRecruiters.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Campus Placement Drives Registered */}
      {placementDrives && placementDrives.length > 0 && (
        <div className="card-3d bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1E5AA8]" />
              <span>Institutional Campus Placement Drives (Training &amp; Placement Directorate)</span>
            </h2>
            <span className="text-[11px] font-bold text-[#1E5AA8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {placementDrives.length} Drives Registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {placementDrives.map((d: any) => (
              <div key={d.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0F2747]">{d.company_name}</span>
                  <span className="font-mono font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ₹{d.package_ctc_lpa} LPA
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium">{d.role}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Drive: {d.drive_date}</span>
                  <span className="font-semibold text-slate-700">{d.selected_count || 0} Offers Given</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
