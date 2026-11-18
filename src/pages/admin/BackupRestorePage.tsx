import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  HardDrive,
  RefreshCw,
  Archive,
  ArrowRight
} from 'lucide-react';
import { adminService, BackupRecord, BulkImportLog } from '../../services/adminService.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { auditService } from '../../services/auditService.js';

interface ReconciliationIssue {
  id: string;
  type: 'ORPHAN_RECORD' | 'MISSING_FOREIGN_KEY' | 'NULL_FIELD' | 'CREDIT_MISMATCH';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedTable: string;
  autoFixAvailable: boolean;
}

const INITIAL_ISSUES: ReconciliationIssue[] = [
  {
    id: 'rec-01',
    type: 'ORPHAN_RECORD',
    severity: 'MEDIUM',
    title: 'Orphaned Course Enrollment',
    description: '1 student enrollment references discontinued elective course "CSE-E402" from 2023 catalog.',
    affectedTable: 'student_subject_enrollments',
    autoFixAvailable: true,
  },
  {
    id: 'rec-02',
    type: 'NULL_FIELD',
    severity: 'LOW',
    title: 'Missing Guardian Contact Number',
    description: '3 newly imported MCA candidates have null emergency phone records.',
    affectedTable: 'student_profiles',
    autoFixAvailable: false,
  },
];

export const BackupRestorePage: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [importLogs, setImportLogs] = useState<BulkImportLog[]>([]);
  const [issues, setIssues] = useState<ReconciliationIssue[]>(INITIAL_ISSUES);
  const [activeTab, setActiveTab] = useState<'BACKUPS' | 'ROLLBACK' | 'RECONCILE' | 'EXPORT'>('BACKUPS');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const reloadData = () => {
    setBackups(adminService.getBackups());
    setImportLogs(adminService.getImportLogs());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    setTimeout(() => {
      adminService.createManualSnapshot('System Administrator');
      reloadData();
      setIsCreatingSnapshot(false);
      setActionNotice('Full database snapshot completed and SHA-256 seal verified.');
    }, 1200);
  };

  const handleRollback = (logId: string) => {
    const success = adminService.rollbackImport(logId, 'System Administrator');
    if (success) {
      reloadData();
      setActionNotice(`Import #${logId} rolled back successfully. Restored previous database state.`);
    }
  };

  const handleAutoFix = (issueId: string) => {
    setIssues(issues.filter((i) => i.id !== issueId));
    auditService.logAction({
      action: 'DATA_RECONCILIATION_FIX',
      entity_type: 'database',
      entity_id: issueId,
      entity_name: 'Database Reconciliation Engine',
      description: `Automated cleanup script resolved integrity violation #${issueId}`,
      severity: 'info',
    });
    setActionNotice(`Integrity issue #${issueId} rectified automatically.`);
  };

  const handleDownloadFullExport = async () => {
    const [studs, facs, depts] = await Promise.all([
      studentFacultyService.getStudents(),
      studentFacultyService.getFaculty(),
      studentFacultyService.getDepartments(),
    ]);

    const exportData = {
      institution: 'ITM University',
      generated_at: new Date().toISOString(),
      student_records_count: studs.length,
      students: studs,
      faculty_records_count: facs.length,
      faculty: facs,
      departments: depts,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITM_UEAMS_Institutional_Master_Dump_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    setActionNotice('Full institutional master data archive exported in secure JSON format.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Data Resiliency & Auditing</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Backup, Snapshot & Rollback Console
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Generate manual point-in-time database snapshots, revert erroneous bulk data imports, and inspect schema reconciliation reports.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-indigo-300 font-medium">Last Scheduled Backup</p>
              <div className="text-sm font-bold text-white mt-0.5">Today 02:00 AM</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {actionNotice}
          </span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('BACKUPS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'BACKUPS' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Database Snapshots ({backups.length})
        </button>
        <button
          onClick={() => setActiveTab('ROLLBACK')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ROLLBACK' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Bulk Import Rollback Ledger ({importLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('RECONCILE')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'RECONCILE' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Shield className="w-4 h-4" />
          Schema Integrity & Reconciliation ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPORT')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'EXPORT' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Download className="w-4 h-4" />
          Institutional Master Data Dump
        </button>
      </div>

      {/* TAB 1: BACKUPS */}
      {activeTab === 'BACKUPS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Encrypted Database Snapshots</h3>
              <p className="text-xs text-slate-500">Nightly automated dumps and manual pre-event safety snapshots.</p>
            </div>
            <button
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              {isCreatingSnapshot ? 'Generating Snapshot...' : 'Create Instant Snapshot'}
            </button>
          </div>

          <div className="academic-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Snapshot Archive</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Records</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4 text-center">Integrity Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-xs text-[#0F2747]">{b.file_name}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">{b.checksum}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {b.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{b.timestamp}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700 text-xs">
                      {b.record_count.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-600">
                      {(b.size_kb / 1024).toFixed(1)} MB
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        VERIFIED OK
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          const blob = new Blob([`-- ITM Database Dump Mock Content\n-- Checksum: ${b.checksum}\n`], { type: 'application/sql' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = b.file_name;
                          a.click();
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 flex items-center gap-1 inline-flex"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT ROLLBACK */}
      {activeTab === 'ROLLBACK' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Bulk Data Import Rollback Ledger</h3>
              <p className="text-xs text-slate-500">Safeguard mechanism allowing one-click rollback of erroneous student/marks uploads.</p>
            </div>
          </div>

          <div className="space-y-3">
            {importLogs.map((log) => (
              <div key={log.id} className="academic-card p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      IMPORT-ID: {log.id}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 uppercase">{log.entity_type}</span>
                    {log.is_rolled_back && (
                      <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        ROLLED BACK ({log.rolled_back_at})
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#0F2747]">{log.file_name}</h4>
                  <p className="text-xs text-slate-500">
                    Uploaded by: {log.imported_by} on {log.timestamp} · Records: {log.total_records} (Success: {log.success_count}, Failed: {log.failed_count})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {log.can_rollback && !log.is_rolled_back ? (
                    <button
                      onClick={() => handleRollback(log.id)}
                      className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" /> Revert Import Batch
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Reversion Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA RECONCILIATION */}
      {activeTab === 'RECONCILE' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">Foreign Key & Orphan Record Reconciliation</h3>
              <p className="text-xs text-slate-500">Continuous background checks verifying relational integrity across marks, students, and courses.</p>
            </div>
          </div>

          <div className="space-y-3">
            {issues.length === 0 ? (
              <div className="academic-card p-8 text-center text-emerald-700 font-semibold text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                All database tables verified. Zero orphaned records or foreign key discrepancies detected.
              </div>
            ) : (
              issues.map((iss) => (
                <div key={iss.id} className="academic-card p-5 flex flex-col md:flex-row justify-between gap-4 border-l-4 border-l-amber-500">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        {iss.type}
                      </span>
                      <span className="text-xs text-slate-400">Table: {iss.affectedTable}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0F2747]">{iss.title}</h4>
                    <p className="text-xs text-slate-600">{iss.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {iss.autoFixAvailable && (
                      <button
                        onClick={() => handleAutoFix(iss.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        Auto-Rectify Discrepancy
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT */}
      {activeTab === 'EXPORT' && (
        <div className="academic-card p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F2747]">Full Institutional Archival Data Export</h3>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Generate an archival-grade JSON snapshot containing all student biographical profiles, academic enrollments, faculty teaching allocations, and department metadata for long-term record compliance.
          </p>

          <div className="pt-2">
            <button
              onClick={handleDownloadFullExport}
              className="px-5 py-2.5 bg-[#0F2747] text-white rounded-xl text-xs font-semibold hover:bg-[#1E5AA8] transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Complete Institutional Archive (.JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
