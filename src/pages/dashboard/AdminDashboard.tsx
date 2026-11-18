import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  Users,
  GraduationCap,
  FileSpreadsheet,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  Server,
  CalendarCheck,
  Building2,
  BookOpen,
  ShieldCheck,
  Award,
  UploadCloud,
  ChevronRight,
  Activity,
  HardDrive,
  CreditCard,
  LifeBuoy,
  Send,
  RotateCcw,
  Sliders,
  DollarSign,
  AlertTriangle,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { attendanceService } from '../../services/attendanceService.js';
import { examService } from '../../services/examService.js';
import { adminService, SystemHealthData, DataIntegrityAlert, Campus, MakerCheckerRequest } from '../../services/adminService.js';
import { auditService, AuditLogEntry } from '../../services/auditService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [lowAttendanceCount, setLowAttendanceCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState<AuditLogEntry[]>([]);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [alerts, setAlerts] = useState<DataIntegrityAlert[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<MakerCheckerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [studs, facs, depts, lowAlerts, exams, audits] = await Promise.all([
          studentFacultyService.getStudents(),
          studentFacultyService.getFaculty(),
          studentFacultyService.getDepartments(),
          attendanceService.getLowAttendanceAlerts(),
          examService.getExaminations(),
          auditService.getLogs().then((logs) => logs.slice(0, 6)),
        ]);
        setStudentCount(studs.length);
        setFacultyCount(facs.length);
        setDeptCount(depts.length);
        setLowAttendanceCount(lowAlerts.length);
        setExamCount(exams.length);
        setRecentAudits(audits);
        setHealth(adminService.getSystemHealth());
        setAlerts(adminService.getDataIntegrityAlerts());
        setCampuses(adminService.getCampuses());
        setActiveCampus(adminService.getCurrentCampus());
        setPendingApprovals(adminService.getApprovalRequests().filter((r) => r.status === 'PENDING_SECOND_APPROVAL'));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const metrics = [
    {
      label: 'Enrolled Candidates',
      value: loading ? '...' : `${studentCount}`,
      unit: 'Scholars Active',
      sub: `Across ${deptCount || 4} Departments`,
      icon: Users,
      color: 'text-[#1E5AA8]',
      accentBorder: 'border-l-4 border-l-[#1E5AA8]',
      link: '/admin/users',
    },
    {
      label: 'Academic Faculty',
      value: loading ? '...' : `${facultyCount}`,
      unit: 'Professors & Evaluators',
      sub: 'Teaching Staff Registered',
      icon: GraduationCap,
      color: 'text-emerald-600',
      accentBorder: 'border-l-4 border-l-emerald-600',
      link: '/admin/users',
    },
    {
      label: 'Examination Cycles',
      value: loading ? '...' : `${examCount || 2}`,
      unit: 'Master Schedules',
      sub: 'Regular & Supplementary',
      icon: Clock,
      color: 'text-amber-600',
      accentBorder: 'border-l-4 border-l-amber-500',
      link: '/admin/exams',
    },
    {
      label: 'Attendance Defaulters',
      value: loading ? '...' : `${lowAttendanceCount}`,
      unit: 'Candidates Flagged',
      sub: 'Below 75% Statutory Bar',
      icon: AlertCircle,
      color: 'text-rose-600',
      accentBorder: 'border-l-4 border-l-rose-500',
      link: '/admin/attendance',
    },
  ];

  const pendingTasks = [
    {
      title: 'CIA-II Internal Marks Verification',
      due: 'Urgent Today',
      desc: '18 student continuous evaluation marks await administrator audit lock.',
      link: '/admin/marks-verify',
      badge: 'Action Needed',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      title: 'Fee Defaulter Hall Ticket Withholding',
      due: 'Exam Phase 1',
      desc: '1 candidate has overdue fee > ₹50,000 pending bursar clearance.',
      link: '/admin/fees',
      badge: 'Finance Hold',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      title: 'Master Academic Calendar 2026-27',
      due: 'Within 7 Days',
      desc: 'Draft term schedule ready for statutory publication & gazette.',
      link: '/admin/calendar',
      badge: 'Draft Ready',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const quickActions = [
    { title: 'Fee & Revenue', desc: 'Ledgers, receipts & refunds', link: '/admin/fees', icon: CreditCard },
    { title: 'Academic Calendar', desc: 'Terms, events & simulator', link: '/admin/calendar', icon: CalendarCheck },
    { title: 'Grievance Desk', desc: 'Tickets & SLA timers', link: '/admin/grievances', icon: LifeBuoy },
    { title: 'Backup & Restore', desc: 'Snapshots & import rollback', link: '/admin/backups', icon: Database },
    { title: 'Custom Reports', desc: 'Filter builder & CSV exports', link: '/admin/reports', icon: FileSpreadsheet },
    { title: 'Library & Labs', desc: 'Catalog, circulation & assets', link: '/admin/library-assets', icon: BookOpen },
    { title: 'Placement & Alumni', desc: 'Corporate drives & network', link: '/admin/placements', icon: GraduationCap },
    { title: 'NAAC / NBA Audit', desc: 'Criteria 1-7 & SSR generator', link: '/admin/accreditation', icon: Award },
    { title: 'Two-Person Sign-off', desc: 'Dual maker-checker queue', link: '/admin/dual-approvals', icon: ShieldCheck },
    { title: 'Roles & Matrix', desc: 'Access scopes & permissions', link: '/admin/roles', icon: Shield },
    { title: 'Omnichannel Dispatch', desc: 'SMS & registered email blasts', link: '/admin/dispatcher', icon: Send },
    { title: 'Exam Cycles', desc: 'Build & submit timetables', link: '/admin/exams', icon: Clock },
    { title: 'Seating Planner', desc: 'Room & seat assignments', link: '/admin/seating', icon: DoorOpen },
    { title: 'Marks Verify', desc: 'CIA verification & admin lock', link: '/admin/marks-verify', icon: FileSpreadsheet },
    { title: 'Results Gazette', desc: 'SGPA tabulation & gazette', link: '/admin/results', icon: Award },
    { title: 'Bulk CSV Import', desc: 'Batch data upload with undo', link: '/admin/bulk-import', icon: UploadCloud },
    { title: 'Audit Ledger', desc: 'Activity ledger & security', link: '/admin/audit', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Hero Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-300" />
              <span className="text-xs text-slate-300 font-medium">Controller of Examinations & Registrar</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Institutional Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Unified administrative overview of system health, student lifecycle data, fee collections, and examination operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-3.5 py-2.5 rounded-xl">
              <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Campus Tenancy</p>
              <select
                value={activeCampus?.id || ''}
                onChange={(e) => {
                  adminService.setCurrentCampus(e.target.value);
                  const chosen = campuses.find((c) => c.id === e.target.value);
                  if (chosen) setActiveCampus(chosen);
                }}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer mt-0.5"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-center">
              <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Exam Term</p>
              <div className="text-sm font-bold text-white mt-0.5">Even Sem 2026</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link key={idx} to={m.link} className={`academic-card p-5 group block ${m.accentBorder} hover:shadow-md transition`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                  <div className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{m.sub}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Icon className={`w-4.5 h-4.5 ${m.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Health + Data Integrity Engine Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <div className="academic-card p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> System Health & Telemetry
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              99.98% Uptime
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Database Engine</span>
              <p className="font-bold text-slate-800">PostgreSQL (14ms)</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Background Workers</span>
              <p className="font-bold text-emerald-700">6 Active / 0 Queued</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Cache Hit Ratio</span>
              <p className="font-bold text-indigo-700">94.6% Optimal</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Disk Space Used</span>
              <p className="font-bold text-slate-800">38.2% of 500GB</p>
            </div>
          </div>
        </div>

        {/* Data Quality & Integrity Alerts */}
        <div className="academic-card p-5 space-y-3 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Data Quality & Integrity Alerts ({alerts.length})
            </h3>
            <span className="text-[10px] text-slate-500">Continuous Auditor Active</span>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-800">{alert.title}</span>
                    <p className="text-[11px] text-slate-500">{alert.description}</p>
                  </div>
                </div>

                <Link
                  to={alert.resolution_route}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 shrink-0"
                >
                  Resolve
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Split: Today's Pending Tasks + Real-Time Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Pending Approvals */}
        <div className="academic-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Statutory Approvals & Action Items
            </h3>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              3 Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.map((task, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${task.badgeColor}`}>
                      {task.badge}
                    </span>
                    <span className="text-xs font-bold text-[#0F2747]">{task.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{task.desc}</p>
                </div>
                <Link
                  to={task.link}
                  className="p-2 text-slate-400 hover:text-[#0F2747] hover:bg-white rounded-lg transition shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Audit Stream */}
        <div className="academic-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Live Security & Administrative Audit Log
            </h3>
            <Link to="/admin/audit" className="text-xs font-semibold text-[#1E5AA8] hover:underline">
              View All Logs
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAudits.slice(0, 4).map((audit) => (
              <div key={audit.id} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-0.5 border border-slate-100">
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span className="font-semibold text-slate-700">{audit.action}</span>
                  <span>{new Date(audit.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-600 line-clamp-1">{audit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Administrative Modules Grid */}
      <div className="academic-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-[#0F2747] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            University Administrative Modules
          </h3>
          <span className="text-xs text-slate-500">{quickActions.length} Operational Services</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={i}
                to={action.link}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#0F2747] hover:bg-white hover:shadow-sm transition group block"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-2.5 group-hover:bg-[#0F2747] transition">
                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                </div>
                <h4 className="text-xs font-semibold text-[#0F2747] group-hover:text-[#1E5AA8] transition leading-tight">
                  {action.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
