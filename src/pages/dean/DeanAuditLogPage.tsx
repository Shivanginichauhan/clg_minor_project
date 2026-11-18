import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  Sparkles,
  Award,
  Layers,
  Lock,
  FileText
} from 'lucide-react';
import { deanService, DeanAuditEntry } from '../../services/deanService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const DeanAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<DeanAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    setLogs(deanService.getAuditLog());
  }, []);

  const filtered = logs.filter((entry) => {
    const matchesSearch =
      entry.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.deanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.digitalSealToken.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || entry.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Academic Council Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Office of the Dean &bull; Statutory Audit &amp; RTI Desk</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Immutable Cryptographic Governance Ledger</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Statutory Audit &amp; Governance Ledger
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Immutable ledger of all Dean statutory determinations: scholarship sanctions, gazetted result signatures, timetable ratifications, and grievance adjudications with IP address, device fingerprints, and SHA-256 seal tokens.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Ledger Integrity</span>
              <div className="text-xl font-academic-display font-extrabold text-emerald-400 mt-0.5">
                100% Cryptographic
              </div>
              <span className="text-[9px] text-amber-200 font-medium block mt-1">{logs.length} Signed Transactions</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, officer, seal token, or entity..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pl-9 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747]"
          >
            <option value="ALL">All Statutory Actions</option>
            <option value="SCHOLARSHIP_SANCTION">Scholarship Sanctions</option>
            <option value="RESULTS_RATIFICATION">Results Ratifications</option>
            <option value="TIMETABLE_APPROVAL">Timetable Approvals</option>
            <option value="EXAM_SCHEDULE_SIGNOFF">Exam Schedule Approvals</option>
            <option value="FACULTY_LEAVE_SIGNOFF">Faculty Leave &amp; CAS</option>
            <option value="CURRICULUM_RATIFICATION">Curriculum Approvals</option>
            <option value="GRIEVANCE_RESOLUTION">Grievance Resolutions</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1E5AA8]" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Statutory Council Transactions ({filtered.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Tamper-evident Audit Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-3 px-4">Timestamp &amp; IP</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Signing Officer</th>
                <th className="py-3 px-4">Cryptographic Seal Token</th>
                <th className="py-3 px-4">Directive Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono text-[#0F2747] font-semibold">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-3d text-[10px] font-bold px-2 py-0.5 uppercase bg-amber-50 text-amber-800 border-amber-200">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0F2747]">
                      {log.entityName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.deanName}</div>
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PIN Verified
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700 border border-slate-200">
                        {log.digitalSealToken}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
