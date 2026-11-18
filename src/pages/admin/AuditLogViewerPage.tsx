import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Activity,
  FileCode,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Eye,
  KeyRound,
  FileSpreadsheet,
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { auditService, AuditFilters } from '../../services/auditService.js';
import { AuditLogEntry, AuditSeverity, AuditActionType, AuditEntityType } from '../../data/mockAuditLogs.js';

export const AuditLogViewerPage: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<AuditEntityType | 'all'>('all');
  const [selectedAction, setSelectedAction] = useState<AuditActionType | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const loadLogsAndMetrics = async () => {
    const filters: AuditFilters = {
      search: searchQuery,
      entity_type: selectedEntity,
      action: selectedAction,
      severity: selectedSeverity,
      role: selectedRole,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
    try {
      const [data, metricsData] = await Promise.all([
        auditService.getLogs(filters),
        auditService.getMetrics()
      ]);
      setLogs(data || []);
      setMetrics(metricsData);
    } catch (e) {
      console.error('Error loading audit logs and metrics:', e);
      setLogs([]);
    }
  };

  useEffect(() => {
    loadLogsAndMetrics();
  }, [searchQuery, selectedEntity, selectedAction, selectedSeverity, selectedRole, startDate, endDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCSV = () => {
    const csvContent = auditService.exportToCSV(logs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `UEAMS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit trail CSV report successfully.');
  };

  const handleSimulateSecurityEvent = (type: 'escalation' | 'dean_override' | 'marks_tamper') => {
    setIsSimulating(true);

    setTimeout(() => {
      if (type === 'escalation') {
        auditService.logEvent({
          user_id: 'stu-sim-09',
          user_name: 'Simulated Student Account',
          role: 'student',
          action: 'SECURITY_ALERT',
          entity_type: 'security',
          entity_id: 'SEC-RLS-GUARD-99',
          entity_name: 'PostgreSQL Trigger: trg_protect_profile_role',
          description: 'Blocked unauthorized privilege escalation attempt on profile user_id: stu-sim-09 (attempted mutation from student to administrator).',
          severity: 'security',
          changes_payload: {
            before: { role: 'student' },
            after: { role: 'administrator' },
            meta: {
              rejection_code: '42501_INSUFFICIENT_PRIVILEGE',
              trigger: 'trg_protect_profile_role()',
              status: 'BLOCKED_BY_RLS'
            }
          }
        });
        showToast('Simulated RLS security trigger event recorded in immutable trail.');
      } else if (type === 'dean_override') {
        auditService.logEvent({
          user_id: user?.id || 'dean-001',
          user_name: profile?.full_name || 'Dean of Academic Affairs',
          role: 'dean',
          action: 'APPROVE',
          entity_type: 'results',
          entity_id: 'RES-OVERRIDE-2026',
          entity_name: 'Supplementary Tabulation Ledger',
          description: 'Executed executive emergency Dean approval for 4 special scrutiny candidates.',
          severity: 'critical',
          changes_payload: {
            after: { status: 'approved_by_dean', digital_signature_verified: true }
          }
        });
        showToast('Dean statutory sign-off event recorded in audit logs.');
      } else {
        auditService.logEvent({
          user_id: 'fac-002',
          user_name: 'Dr. Suresh Varma',
          role: 'faculty',
          action: 'UPDATE',
          entity_type: 'marks',
          entity_id: 'MRK-AUDIT-SIM',
          entity_name: 'Database Lab (MCA-102)',
          description: 'Updated practical marks batch for 30 candidates after departmental moderation review.',
          severity: 'info',
          changes_payload: {
            before: { average_score: 31.4 },
            after: { average_score: 34.2 }
          }
        });
        showToast('Faculty marks revision event recorded in audit trail.');
      }

      setIsSimulating(false);
      loadLogsAndMetrics();
    }, 600);
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'security':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold animate-pulse';
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'info':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionBadge = (act: AuditActionType) => {
    switch (act) {
      case 'PUBLISH':
      case 'APPROVE':
      case 'VERIFY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CREATE':
        return 'bg-blue-50 text-[#1E5AA8] border-blue-200';
      case 'UPDATE':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'WITHHOLD':
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SECURITY_ALERT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LOGIN':
      case 'LOGOUT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2747] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
              System Audit Trail &amp; Security Inspector
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Audit Stream
            </span>
          </div>
          <p className="text-sm text-[#64748B] max-w-3xl">
            Tamper-evident, immutable activity ledger recording all grade entries, statutory approvals, gazette publications, security triggers, and administrative sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadLogsAndMetrics}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
              <span>Total Recorded Events</span>
              <Activity className="w-4 h-4 text-[#1E5AA8]" />
            </div>
            <div className="text-2xl font-bold text-[#0F2747] mt-1">{metrics.totalLogs}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Immutable audit event records</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
              <span>Security &amp; Policy Triggers</span>
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{metrics.securityAlerts}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated policy enforcement events</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
              <span>Critical Approvals &amp; Signoffs</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {metrics.bySeverity.critical || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Dean gazette &amp; timetable authorizations</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
              <span>Unique Active Actors</span>
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-[#0F2747] mt-1">{metrics.totalUsersActive}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Admins, Deans, Faculty &amp; System</p>
          </div>
        </div>
      )}

      {/* Interactive Audit Simulation Bar (Demonstrating Real-Time Event Logging in DEV mode only) */}
      {import.meta.env.DEV && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Audit &amp; Event Logging Sandbox (Dev Mode)</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Simulate administrative actions to observe real-time tamper-evident audit logging, security level elevation, and JSON diff capture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateSecurityEvent('escalation')}
              className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Simulate Policy Block Event
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateSecurityEvent('dean_override')}
              className="px-3 py-2 bg-amber-900/60 hover:bg-amber-800 border border-amber-500/50 text-amber-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Simulate Dean Gazette Sign-off
            </button>
            <button
              disabled={isSimulating}
              onClick={() => handleSimulateSecurityEvent('marks_tamper')}
              className="px-3 py-2 bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Simulate Faculty Marks Revision
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, actor name, IP, target ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8] transition"
            />
          </div>

          {/* Module / Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Modules</option>
            <option value="marks">Marks &amp; CIA</option>
            <option value="results">Results &amp; Gazette</option>
            <option value="examination">Examinations</option>
            <option value="seating">Seating &amp; Rooms</option>
            <option value="attendance">Attendance &amp; Condonation</option>
            <option value="security">Security &amp; Auth</option>
            <option value="notice">Notices &amp; Circulars</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Actions</option>
            <option value="APPROVE">APPROVE</option>
            <option value="VERIFY">VERIFY</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="WITHHOLD">WITHHOLD</option>
            <option value="SECURITY_ALERT">SECURITY_ALERT</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Severities</option>
            <option value="security">Security Alerts</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Actor Role */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Roles</option>
            <option value="administrator">Administrators</option>
            <option value="dean">Deans</option>
            <option value="faculty">Faculty</option>
            <option value="student">Students</option>
            <option value="system">System / Engine</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Immutable Audit Trail Stream ({logs.length} entries)
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Table: public.audit_logs
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Shield className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm text-slate-700">No audit logs matching current criteria</p>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or search parameters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-5 hover:bg-slate-50/60 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {log.id}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {log.entity_type}
                      </span>

                      {log.entity_name && (
                        <span className="text-xs font-medium text-[#0F2747] hidden md:inline">
                          &bull; {log.entity_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {log.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                    <div className="flex items-center gap-3">
                      <span>Actor: <strong className="text-slate-700">{log.user_name}</strong> (<span className="capitalize font-medium">{log.role}</span>)</span>
                      <span>•</span>
                      <span className="font-mono">IP: {log.ip_address}</span>
                    </div>

                    {log.changes_payload && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1E5AA8] hover:text-[#0F2747] cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide Payload Diff' : 'View Payload Diff'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON Diff Viewer */}
                  {isExpanded && log.changes_payload && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2 mt-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                        <span>Payload Parameters &amp; Transition Diff</span>
                        <span>Format: JSON</span>
                      </div>
                      <pre className="text-[11px] leading-relaxed text-emerald-400">
                        {JSON.stringify(log.changes_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
