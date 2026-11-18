import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  ShieldCheck,
  Award,
  CalendarCheck,
  FileSpreadsheet,
  BookOpen,
  Briefcase,
  LifeBuoy,
  IndianRupee,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  KeyRound,
  ChevronRight,
  GraduationCap,
  Users,
  TrendingUp,
  Sparkles,
  Shield,
  FileText,
  Check,
  X,
  ExternalLink,
  Eye,
  AlertCircle,
  Calendar,
  Building2,
  RefreshCw,
  BadgeAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService.js';
import { examService } from '../../services/examService.js';
import { resultsService } from '../../services/resultsService.js';
import { scholarshipService, ScholarshipApplication } from '../../services/scholarshipService.js';
import {
  deanService,
  InstitutionalBudget,
  FacultyDeanApproval,
  DeanGrievanceTicket,
  CurriculumProposal,
  AccreditationMetric
} from '../../services/deanService.js';
import { adminService, AccreditationCriterion } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export interface UnifiedActionItem {
  id: string;
  category: 'scholarship' | 'exam' | 'result' | 'curriculum' | 'faculty' | 'grievance' | 'budget' | 'accreditation';
  categoryLabel: string;
  title: string;
  departmentOrCohort: string;
  requestedBy: string;
  dateOrDeadline: string;
  priority: 'urgent' | 'high' | 'normal';
  financialOrCandidateImpact: string;
  routeLink: string;
  statusText: string;
}

export const DeanDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Raw State Loaded from Sub-systems
  const [scholarships, setScholarships] = useState<ScholarshipApplication[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [draftResults, setDraftResults] = useState<any[]>([]);
  const [curriculumProposals, setCurriculumProposals] = useState<CurriculumProposal[]>([]);
  const [facultyApprovals, setFacultyApprovals] = useState<FacultyDeanApproval[]>([]);
  const [grievances, setGrievances] = useState<DeanGrievanceTicket[]>([]);
  const [budget, setBudget] = useState<InstitutionalBudget>(deanService.getBudget());
  const [accreditationMetrics, setAccreditationMetrics] = useState<AccreditationMetric[]>([]);
  const [accreditationCriteria, setAccreditationCriteria] = useState<AccreditationCriterion[]>([]);
  const [condonationsCount, setCondonationsCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'academics' | 'faculty' | 'finance' | 'grievance'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Action Signoff Modal State
  const [selectedActionItem, setSelectedActionItem] = useState<UnifiedActionItem | null>(null);
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [deanPin, setDeanPin] = useState('');
  const [signoffRemarks, setSignoffRemarks] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [signoffSuccess, setSignoffSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conds, schedules, results, schs] = await Promise.all([
        attendanceService.getAllCondonations(),
        examService.getSchedules(),
        resultsService.getResults({ status: 'draft' }),
        scholarshipService.getApplications()
      ]);

      setCondonationsCount(conds.filter((c) => c.status === 'pending').length);
      setExamSchedules(schedules);
      setDraftResults(results);
      setScholarships(schs);
      setCurriculumProposals(deanService.getCurriculumProposals());
      setFacultyApprovals(deanService.getFacultyApprovals());
      setGrievances(deanService.getDeanGrievances());
      setBudget(deanService.getBudget());
      setAccreditationMetrics(deanService.getAccreditationMetrics());
      setAccreditationCriteria(adminService.getAccreditationCriteria());
    } catch (err) {
      console.error('Failed to load Dean Executive Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute 8 Executive Dimension Pending Counts & Details
  const pendingScholarships = useMemo(
    () => scholarships.filter((s) => s.status === 'submitted' || s.status === 'verified_by_advisor'),
    [scholarships]
  );
  const pendingExamSchedules = useMemo(
    () => examSchedules.filter((s) => s.status === 'submitted'),
    [examSchedules]
  );
  const pendingResults = useMemo(
    () => draftResults.filter((r) => r.result_status === 'draft' || r.result_status === 'submitted'),
    [draftResults]
  );
  const pendingCurriculum = useMemo(
    () => curriculumProposals.filter((c) => c.status === 'pending_dean'),
    [curriculumProposals]
  );
  const pendingFaculty = useMemo(
    () => facultyApprovals.filter((f) => f.status === 'pending_dean'),
    [facultyApprovals]
  );
  const pendingGrievances = useMemo(
    () => grievances.filter((g) => g.status === 'escalated_to_dean'),
    [grievances]
  );
  const nonCompliantAccreditation = useMemo(
    () => accreditationMetrics.filter((m) => m.status === 'attention_required' || m.status === 'critical_gap'),
    [accreditationMetrics]
  );

  // Total Action Items requiring Dean Sign-off Today
  const totalActionCount =
    pendingScholarships.length +
    pendingExamSchedules.length +
    pendingResults.length +
    pendingCurriculum.length +
    pendingFaculty.length +
    pendingGrievances.length;

  // Build the Unified Attention Stream combining items from all 8 pages
  const unifiedActionStream = useMemo<UnifiedActionItem[]>(() => {
    const stream: UnifiedActionItem[] = [];

    // 1. Scholarships
    pendingScholarships.forEach((s) => {
      stream.push({
        id: `sch-${s.id}`,
        category: 'scholarship',
        categoryLabel: 'Scholarship Sanction',
        title: `${s.scheme_name} — DBT Grant Sanction`,
        departmentOrCohort: `${s.student_name} (${s.student_roll || s.student_id})`,
        requestedBy: 'Faculty Advisor Endorsed',
        dateOrDeadline: s.cgpa ? `CGPA: ${s.cgpa} / 10.0` : 'Applied this term',
        priority: 'high',
        financialOrCandidateImpact: `₹${(s.applied_amount || 25000).toLocaleString()}`,
        routeLink: '/dean/scholarships',
        statusText: 'Pending Dean Seal & PIN'
      });
    });

    // 2. Exam Timetables
    if (pendingExamSchedules.length > 0) {
      stream.push({
        id: 'exam-cycle-active',
        category: 'exam',
        categoryLabel: 'Examination Timetable',
        title: 'Even Semester 2026 Examination Master Timetable',
        departmentOrCohort: 'University-wide (MCA, B.Tech, MBA Cohorts)',
        requestedBy: 'Controller of Examinations (CoE)',
        dateOrDeadline: 'Gazetting Deadline: May 10, 2026',
        priority: 'urgent',
        financialOrCandidateImpact: `${pendingExamSchedules.length} Papers Scheduled`,
        routeLink: '/dean/exam-approvals',
        statusText: 'Submitted for Dean Ratification'
      });
    }

    // 3. Results Sign-offs
    if (pendingResults.length > 0) {
      stream.push({
        id: 'res-gazette-even26',
        category: 'result',
        categoryLabel: 'Results Gazette',
        title: 'MCA Semester 2 & B.Tech Semester 4 Tabulated Gazette',
        departmentOrCohort: 'Department of Computer Science & Applications',
        requestedBy: 'Tabulation Committee / CoE',
        dateOrDeadline: 'Statutory Gazette Window',
        priority: 'urgent',
        financialOrCandidateImpact: `${pendingResults.length} Candidate Transcripts`,
        routeLink: '/dean/results-approval',
        statusText: 'Awaiting Official Publication'
      });
    }

    // 4. Curriculum Proposals
    pendingCurriculum.forEach((c) => {
      stream.push({
        id: `cur-${c.id}`,
        category: 'curriculum',
        categoryLabel: 'BoS Curriculum Proposal',
        title: `${c.proposalCode}: ${c.title}`,
        departmentOrCohort: `${c.departmentName} (${c.programCode})`,
        requestedBy: `Board of Studies (${c.bosMeetingDate})`,
        dateOrDeadline: `Effective Academic Year: ${c.academicYearEffective}`,
        priority: 'normal',
        financialOrCandidateImpact: `Industry Rating: ${c.industryFeedbackScore} / 5.0`,
        routeLink: '/dean/curriculum',
        statusText: 'Council Concurrence Required'
      });
    });

    // 5. Faculty Leaves & CAS
    pendingFaculty.forEach((f) => {
      stream.push({
        id: `fac-${f.id}`,
        category: 'faculty',
        categoryLabel: 'Faculty Leave / CAS',
        title: `${f.title} — ${f.facultyName}`,
        departmentOrCohort: `${f.departmentName} (${f.designation})`,
        requestedBy: `Endorsed by HOD (${f.hodRemarks})`,
        dateOrDeadline: f.datesRequested || f.submittedAt?.slice(0, 10) || 'Active Semester',
        priority: f.classesImpactedCount && f.classesImpactedCount > 2 ? 'high' : 'normal',
        financialOrCandidateImpact: f.proxyArrangedByHod
          ? `Proxy Arranged (${f.proxyFacultyName || 'Dept Faculty'})`
          : 'Pending Proxy Confirmation',
        routeLink: '/dean/faculty-leave',
        statusText: 'HOD Approved, Awaiting Dean'
      });
    });

    // 6. Grievance Escalations
    pendingGrievances.forEach((g) => {
      stream.push({
        id: `grv-${g.id}`,
        category: 'grievance',
        categoryLabel: 'Grievance Escalation',
        title: `Ticket ${g.ticketNumber}: ${g.subject}`,
        departmentOrCohort: `${g.studentName} (${g.rollNumber})`,
        requestedBy: `Escalated from ${g.escalatedFrom}`,
        dateOrDeadline: `Open ${g.daysOpen} days (${g.slaBreached ? 'SLA BREACHED' : 'Within SLA'})`,
        priority: g.slaBreached ? 'urgent' : 'high',
        financialOrCandidateImpact: g.category,
        routeLink: '/dean/grievances',
        statusText: 'Requires Dean Sanction / Waiver'
      });
    });

    return stream;
  }, [pendingScholarships, pendingExamSchedules, pendingResults, pendingCurriculum, pendingFaculty, pendingGrievances]);

  // Filtered stream based on selected tab and search
  const filteredStream = useMemo(() => {
    return unifiedActionStream.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.departmentOrCohort.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'urgent') return item.priority === 'urgent';
      if (activeTab === 'academics') return item.category === 'exam' || item.category === 'result' || item.category === 'curriculum';
      if (activeTab === 'faculty') return item.category === 'faculty';
      if (activeTab === 'finance') return item.category === 'scholarship';
      if (activeTab === 'grievance') return item.category === 'grievance';
      return true;
    });
  }, [unifiedActionStream, activeTab, searchQuery]);

  // Handle Quick Signoff from Dashboard
  const handleQuickSignoff = (item: UnifiedActionItem) => {
    setSelectedActionItem(item);
    setDeanPin('');
    setSignoffRemarks('');
    setPinError(null);
    setSignoffSuccess(null);
    setIsSignoffModalOpen(true);
  };

  const submitSignoff = () => {
    if (!deanPin || deanPin.trim().length === 0) {
      setPinError('Please enter your 4-digit Dean Security PIN.');
      return;
    }

    const verification = deanService.verifyDeanPin(deanPin, profile?.id);
    if (!verification.valid) {
      setPinError(verification.error || 'Invalid Dean Security PIN.');
      return;
    }

    if (!selectedActionItem) return;

    try {
      if (selectedActionItem.category === 'faculty') {
        const rawId = selectedActionItem.id.replace('fac-', '');
        deanService.reviewFacultyApproval(
          rawId,
          'approved',
          signoffRemarks || 'Ratified under Dean Executive Prerogative.',
          profile?.full_name || 'Dean of Academic Affairs'
        );
      } else if (selectedActionItem.category === 'curriculum') {
        const rawId = selectedActionItem.id.replace('cur-', '');
        deanService.approveCurriculumProposal(rawId, profile?.full_name || 'Dean of Academic Affairs');
      } else if (selectedActionItem.category === 'grievance') {
        const rawId = selectedActionItem.id.replace('grv-', '');
        deanService.resolveGrievance(
          rawId,
          signoffRemarks || 'Dean humanitarian intervention sanctioned.',
          profile?.full_name || 'Dean of Academic Affairs'
        );
      }

      setSignoffSuccess('Statutory approval recorded into unified audit log with digital seal token.');
      setTimeout(() => {
        setIsSignoffModalOpen(false);
        loadData();
      }, 1200);
    } catch (e: any) {
      setPinError(e.message || 'Approval signoff failed.');
    }
  };

  // Institutional Risk Heatmap
  const deptHealthHeatmap = [
    {
      dept: 'Computer Applications (MCA/BCA)',
      avgAttendance: 76.4,
      passRate: 94.2,
      facultyShortage: 'Adequate (1:14 SFR)',
      riskLevel: 'moderate',
      alert: 'MCA Sem 2 attendance dropped to 76.4% this week; 4 medical condonation requests pending'
    },
    {
      dept: 'Computer Science & Engineering (B.Tech)',
      avgAttendance: 84.1,
      passRate: 91.5,
      facultyShortage: '2 Senior Vacancies',
      riskLevel: 'low',
      alert: 'Dr. Ramesh Verma contact hours (18h) close to UGC instructional limit'
    },
    {
      dept: 'Management Studies (MBA)',
      avgAttendance: 88.0,
      passRate: 96.8,
      facultyShortage: 'Adequate (1:12 SFR)',
      riskLevel: 'low',
      alert: 'Summer Corporate Internship evaluation scheduled next Tuesday'
    },
    {
      dept: 'Basic Sciences & Humanities',
      avgAttendance: 79.2,
      passRate: 86.4,
      facultyShortage: '1 Physics Faculty Required',
      riskLevel: 'moderate',
      alert: 'First year Mathematics tutorial batch requires splitting to maintain 1:30 ratio'
    }
  ];

  const statutoryDeadlines = [
    { title: 'End-Sem Exam Timetable Gazetting', deadline: 'May 10, 2026', daysLeft: 4, authority: 'Dean / COE', status: 'urgent' },
    { title: 'UGC Scholarship DBT Sanction Closure', deadline: 'May 15, 2026', daysLeft: 9, authority: 'Dean Affairs', status: 'urgent' },
    { title: 'AICTE / NIRF Mandatory Data Submission', deadline: 'May 20, 2026', daysLeft: 14, authority: 'IQAC / Dean', status: 'normal' },
    { title: 'Academic Council Curriculum Ratification', deadline: 'June 25, 2026', daysLeft: 50, authority: 'Academic Council', status: 'normal' }
  ];

  return (
    <div className="space-y-7 pb-16">
      {/* ── 1. UNIFIED EXECUTIVE COMMAND HERO ── */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-amber-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Office of the Dean &bull; Academic Affairs &amp; Governance</span>
              </span>
              <span className="text-[11px] text-amber-200 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory 8-Sector Unified Executive Landing Page</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Institutional Executive Command Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-3xl">
              Welcome, <span className="text-amber-300 font-bold">{profile?.full_name || 'Dean of Academic Governance'}</span>. Single unified cockpit consolidating pending scholarship sanctions, timetable ratifications, result sign-offs, curriculum proposals, faculty requests, escalated grievances, budget pool, and NAAC/NBA compliance across all university departments.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/30 p-4 rounded-2xl text-center min-w-[190px] shadow-inner">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-bold block">Action Radar</span>
              <div className="text-3xl font-academic-display font-extrabold text-amber-400 mt-0.5">
                {loading ? '...' : totalActionCount}
              </div>
              <span className="text-[10px] text-amber-200 font-medium block mt-1">Pending Dean Sign-Offs Today</span>
            </div>
            <UniversityCrest size="lg" variant="gold" className="hidden sm:inline-flex seal-glow" />
          </div>
        </div>
      </div>

      {/* ── 2. THE 8 EXECUTIVE DIMENSIONS RADAR (CARDS LINKING TO ALL 8 DEDICATED PAGES) ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-800" />
            <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
              8 Statutory Executive Sectors Overview
            </h2>
          </div>
          <span className="text-xs text-slate-500">Instant KPI Pulse &bull; 1-Click Access</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Sector 1: Scholarships */}
          <Link
            to="/dean/scholarships"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">1. Scholarships</span>
              <Award className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingScholarships.length}
            </div>
            <span className="text-[9px] text-amber-800 font-semibold block mt-0.5">DBT Sanctions</span>
          </Link>

          {/* Sector 2: Exam Timetables */}
          <Link
            to="/dean/exam-approvals"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">2. Timetables</span>
              <CalendarCheck className="w-3.5 h-3.5 text-[#1E5AA8] group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingExamSchedules.length}
            </div>
            <span className="text-[9px] text-[#1E5AA8] font-semibold block mt-0.5">Schedules Pending</span>
          </Link>

          {/* Sector 3: Results Gazette */}
          <Link
            to="/dean/results-approval"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">3. Results</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingResults.length}
            </div>
            <span className="text-[9px] text-purple-800 font-semibold block mt-0.5">Gazettes Draft</span>
          </Link>

          {/* Sector 4: Curriculum BoS */}
          <Link
            to="/dean/curriculum"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">4. Curriculum</span>
              <BookOpen className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingCurriculum.length}
            </div>
            <span className="text-[9px] text-blue-800 font-semibold block mt-0.5">BoS Proposals</span>
          </Link>

          {/* Sector 5: Faculty Leave & CAS */}
          <Link
            to="/dean/faculty-leave"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">5. Faculty CAS</span>
              <Briefcase className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingFaculty.length}
            </div>
            <span className="text-[9px] text-emerald-800 font-semibold block mt-0.5">Leave / Promotion</span>
          </Link>

          {/* Sector 6: Grievance Escalations */}
          <Link
            to="/dean/grievances"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">6. Grievances</span>
              <LifeBuoy className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {pendingGrievances.length}
            </div>
            <span className="text-[9px] text-rose-800 font-semibold block mt-0.5">Escalated HOD</span>
          </Link>

          {/* Sector 7: Budget Pool */}
          <Link
            to="/dean/budget"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">7. Budget Pool</span>
              <IndianRupee className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-lg font-academic-display font-extrabold text-[#0F2747] mt-1 font-mono">
              ₹{(budget.totalScholarshipAllocated - budget.totalScholarshipSanctioned) / 100000}L
            </div>
            <span className="text-[9px] text-teal-800 font-semibold block mt-0.5">Remaining Pool</span>
          </Link>

          {/* Sector 8: Accreditation Compliance */}
          <Link
            to="/dean/compliance"
            className="stat-box-3d p-3.5 bg-white border border-slate-200 rounded-2xl hover:border-amber-400 hover:shadow-md transition group block"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[9px] uppercase font-bold tracking-tight">8. NAAC / NBA</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition" />
            </div>
            <div className="text-xl font-academic-display font-extrabold text-[#0F2747] mt-1">
              {nonCompliantAccreditation.length === 0 ? 'Compliant' : `${nonCompliantAccreditation.length} Watch`}
            </div>
            <span className="text-[9px] text-indigo-800 font-semibold block mt-0.5">3.48 CGPA Track</span>
          </Link>
        </div>
      </div>

      {/* ── STATUTORY SLA BREACH ALERTS (URGENT OVERDUE COMPLIANCE) ── */}
      {grievances.some(g => g.slaBreached && g.status !== 'resolved') && (
        <div className="card-3d bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h2 className="text-sm font-extrabold text-rose-900 tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Statutory UGC SLA Overdue Alerts ({grievances.filter(g => g.slaBreached && g.status !== 'resolved').length} Overdue Grievance{grievances.filter(g => g.slaBreached && g.status !== 'resolved').length > 1 ? 's' : ''})</span>
              </h2>
            </div>
            <Link
              to="/dean/grievances"
              className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 hover:underline"
            >
              <span>View Ombudsman Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {grievances
              .filter(g => g.slaBreached && g.status !== 'resolved')
              .map(g => (
                <div key={g.id} className="p-3.5 bg-white border border-rose-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <span className="text-xs">🔴</span>
                      <span>{g.ticketNumber} &bull; {g.studentName}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{g.subject}</div>
                    <div className="text-[10px] text-rose-700 font-semibold mt-1">
                      {g.daysOpen} days open &bull; UGC 7-day SLA breached &bull; Dept: {g.departmentName}
                    </div>
                  </div>
                  <Link
                    to="/dean/grievances"
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 shrink-0 transition"
                  >
                    Resolve / Nudge
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── 3. THE UNIFIED DAILY ACTION QUEUE / DECISION STREAM (SOLUTION TO 8-PAGE PROBLEM) ── */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-amber-700" />
              <h2 className="text-sm font-bold text-[#0F2747] uppercase tracking-wider">
                Consolidated Action Stream &bull; What Needs Attention Today
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Items aggregated from all 8 statutory sectors. Review and authorize directly here, or click to open full dossier.
            </p>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search actions, students, schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-56 transition"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Actions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              {unifiedActionStream.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'urgent'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Urgent Deadlines</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'finance'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Scholarships ({pendingScholarships.length})
          </button>

          <button
            onClick={() => setActiveTab('academics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'academics'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Exams, Results &amp; BoS ({pendingExamSchedules.length > 0 ? 1 : 0 + pendingResults.length + pendingCurriculum.length})
          </button>

          <button
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'faculty'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Faculty CAS &amp; Leave ({pendingFaculty.length})
          </button>

          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'grievance'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Grievances ({pendingGrievances.length})
          </button>
        </div>

        {/* Action Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sector / Item</th>
                <th className="py-3 px-4">Subject &amp; Cohort</th>
                <th className="py-3 px-4">Origin / Endorser</th>
                <th className="py-3 px-4">Impact / Financials</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStream.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-sm text-[#0F2747]">Queue is Clear!</div>
                    <div className="text-xs text-slate-400 mt-1">No pending actions found under this filter.</div>
                  </td>
                </tr>
              ) : (
                filteredStream.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    {/* Sector */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.category === 'scholarship' && (
                          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.category === 'exam' && (
                          <div className="p-1.5 rounded-lg bg-blue-50 text-[#1E5AA8] border border-blue-200">
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.category === 'result' && (
                          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.category === 'curriculum' && (
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.category === 'faculty' && (
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {item.category === 'grievance' && (
                          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            <LifeBuoy className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#0F2747] text-[11px]">{item.categoryLabel}</div>
                          <div className="text-[10px] text-slate-400">{item.statusText}</div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.departmentOrCohort}</div>
                    </td>

                    {/* Origin */}
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">{item.requestedBy}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.dateOrDeadline}</div>
                    </td>

                    {/* Impact */}
                    <td className="py-3 px-4">
                      <span className="font-bold font-mono text-[#0F2747] bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.financialOrCandidateImpact}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      {item.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          Urgent
                        </span>
                      )}
                      {item.priority === 'high' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 w-fit block">
                          High
                        </span>
                      )}
                      {item.priority === 'normal' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit block">
                          Standard
                        </span>
                      )}
                    </td>

                    {/* Direct Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {['faculty', 'curriculum', 'grievance'].includes(item.category) && (
                          <button
                            onClick={() => handleQuickSignoff(item)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-300 hover:bg-amber-500 hover:text-white transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Quick Sign</span>
                          </button>
                        )}

                        <Link
                          to={item.routeLink}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-[#0F2747] hover:text-white transition text-[11px] font-bold flex items-center gap-1 border border-slate-200"
                        >
                          <span>Open Dossier</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. TWO-COLUMN EXECUTIVE AUDIT: INSTITUTIONAL HEATMAP & DEADLINES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Health Risk Heatmap (2 Cols) */}
        <div className="lg:col-span-2 card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1E5AA8]" />
              <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                Institutional Risk Heatmap &bull; Departmental Health Pulse
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Daily Roster Velocity</span>
          </div>

          <div className="space-y-3">
            {deptHealthHeatmap.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-xs text-[#0F2747]">{item.dept}</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono font-bold text-slate-700">
                      Att: <span className={item.avgAttendance < 75 ? 'text-rose-600' : 'text-emerald-700'}>{item.avgAttendance}%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      Pass: <span className="text-[#1E5AA8]">{item.passRate}%</span>
                    </span>
                    <span className="badge-3d text-[10px] font-bold px-2 py-0.5 bg-white text-slate-700 border-slate-300">
                      {item.facultyShortage}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/80">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{item.alert}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Deadlines & NAAC / NBA Quality Indicator (1 Col) */}
        <div className="card-3d bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                  Statutory University Deadlines
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {statutoryDeadlines.map((dl, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-[#0F2747]">{dl.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        dl.daysLeft <= 7 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {dl.daysLeft}d left
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Due: {dl.deadline}</span>
                    <span className="font-medium text-slate-700">{dl.authority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>NAAC / NBA Accreditation Watch</span>
              </div>
              <div className="text-[10px] text-indigo-800 mt-0.5">
                Criteria 1-7 compliant (3.48 CGPA Track). FDP training gap: 1.8 days.
              </div>
            </div>
            <Link to="/dean/compliance" className="text-indigo-900 font-bold underline text-[11px] shrink-0 ml-2">
              View SSR Metrics
            </Link>
          </div>
        </div>
      </div>

      {/* ── 5. BUDGET & SCHOLARSHIP FUND UTILIZATION SNAPSHOT ── */}
      <div className="card-3d bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
              Scholarship &amp; Academic Budget Utilization &bull; {budget.fiscalYear}
            </h3>
          </div>
          <Link to="/dean/budget" className="text-xs font-bold text-[#1E5AA8] hover:underline flex items-center gap-1">
            <span>Detailed Financial Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Grant Pool</span>
            <span className="text-xl font-extrabold text-[#0F2747] font-mono">
              ₹{budget.totalScholarshipAllocated.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Academic Council Approved</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Dean Sanctioned</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono">
              ₹{budget.totalScholarshipSanctioned.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-800 block mt-0.5">
              {Math.round((budget.totalScholarshipSanctioned / budget.totalScholarshipAllocated) * 100)}% Pool Sanctioned
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Remaining Ceiling</span>
            <span className="text-xl font-extrabold text-emerald-700 font-mono">
              ₹{(budget.totalScholarshipAllocated - budget.totalScholarshipSanctioned).toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-800 block mt-0.5">Available for Deserving Students</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Disbursed by Treasury</span>
            <span className="text-xl font-extrabold text-blue-700 font-mono">
              ₹{budget.totalScholarshipDisbursed.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-800 block mt-0.5">Transferred to Student Accounts</span>
          </div>
        </div>
      </div>

      {/* ── 6. COMPLETE 14-MODULE QUICK LAUNCH DIRECTORY ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F2747]" />
            <h2 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider">
              Comprehensive Dean Governance Directory &bull; All 14 Dedicated Portals
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dean/scholarships"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Scholarships &amp; Grants</div>
                <div className="text-[10px] text-slate-400">DBT Merit Sanctions</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/exam-approvals"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-blue-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-[#1E5AA8]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Exam Timetables</div>
                <div className="text-[10px] text-slate-400">Schedule Ratifications</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/results-approval"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-purple-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Results Gazette</div>
                <div className="text-[10px] text-slate-400">SGPA &amp; CGPA Sign-offs</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/curriculum"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Curriculum &amp; BoS</div>
                <div className="text-[10px] text-slate-400">Syllabus &amp; NEP Alignments</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/faculty-leave"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Faculty Leave &amp; CAS</div>
                <div className="text-[10px] text-slate-400">Promotions &amp; Sabbaticals</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/grievances"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-rose-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Grievance Redressal</div>
                <div className="text-[10px] text-slate-400">HOD Escalations &amp; SLA</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/budget"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-teal-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Institutional Budget</div>
                <div className="text-[10px] text-slate-400">Department Grant Pools</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/compliance"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">NAAC / NBA Accreditations</div>
                <div className="text-[10px] text-slate-400">SSR Criteria &amp; Benchmarks</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/academic-calendar"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Academic Calendar</div>
                <div className="text-[10px] text-slate-400">Term Windows &amp; Recess</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/research"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1E5AA8]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Research &amp; Faculty</div>
                <div className="text-[10px] text-slate-400">Scopus &amp; API Scores</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/placements"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Placement Oversight</div>
                <div className="text-[10px] text-slate-400">Corporate Drives &amp; CTC</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            to="/dean/audit-log"
            className="academic-card p-4 rounded-2xl flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">Unified Audit Trail</div>
                <div className="text-[10px] text-slate-400">SHA-256 Statutory Log</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>

      {/* ── 7. QUICK ACTION SIGNOFF DIALOG (STATUTORY PIN VERIFICATION) ── */}
      {isSignoffModalOpen && selectedActionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedActionItem.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-[#0F2747] mt-1">Dean Statutory Sign-off Desk</h3>
              </div>
              <button
                onClick={() => setIsSignoffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900">{selectedActionItem.title}</div>
              <div className="text-slate-600">Target: {selectedActionItem.departmentOrCohort}</div>
              <div className="text-slate-500 text-[11px]">Requested: {selectedActionItem.requestedBy}</div>
              <div className="font-mono font-bold text-amber-900">
                Impact: {selectedActionItem.financialOrCandidateImpact}
              </div>
            </div>

            {signoffSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{signoffSuccess}</span>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dean Executive Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={signoffRemarks}
                    onChange={(e) => setSignoffRemarks(e.target.value)}
                    placeholder="e.g. Endorsed under statutory Academic Governance authority."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enter Dean Authorization PIN <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      maxLength={6}
                      value={deanPin}
                      onChange={(e) => {
                        setDeanPin(e.target.value);
                        setPinError(null);
                      }}
                      placeholder="Enter 4-digit PIN (Default: 9901)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center tracking-widest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  {pinError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{pinError}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignoffModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitSignoff}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Authorize &amp; Sign</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
