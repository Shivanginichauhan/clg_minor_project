import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../contexts/AuthContext.js';

gsap.registerPlugin(ScrollTrigger, useGSAP);
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  Users,
  QrCode,
  Building2,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  ChevronRight,
  Bell,
  X,
  Zap,
  BookOpen,
  BarChart3,
  Lock,
  Star,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { INITIAL_MOCK_NOTICES, UniversityNotice } from '../../data/mockNotices.js';
import { initialResults, SemesterResultWithDetails } from '../../data/mockResults.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { Footer } from '../../components/common/Footer.js';
import { ThemeToggle } from '../../components/common/ThemeToggle.js';


/* ─────────────────────────────────────────────
   Keyframe animations injected once via <style>
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      33%      { transform: translateY(-18px) rotate(1deg); }
      66%      { transform: translateY(-8px) rotate(-1deg); }
    }
    @keyframes floatSlow {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-24px); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(0.9); opacity: 0.6; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes gradient-x {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes ticker {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes count-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .animate-float       { animation: float 6s ease-in-out infinite; }
    .animate-float-slow  { animation: floatSlow 8s ease-in-out infinite; }
    .animate-pulse-ring  { animation: pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite; }
    .animate-shimmer     {
      background: linear-gradient(90deg,#0F2747 25%,#1E5AA8 50%,#0F2747 75%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    .animate-gradient-x {
      background-size: 200% 200%;
      animation: gradient-x 6s ease infinite;
    }
    .animate-ticker { animation: ticker 30s linear infinite; }
    .animate-fade-in-up { animation: fade-in-up 0.6s ease both; }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }

    .hero-glow {
      background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(30,90,168,0.18) 0%, transparent 70%);
    }
    .card-glow:hover {
      box-shadow: 0 0 0 1px #1E5AA8, 0 8px 32px rgba(30,90,168,0.15), 0 2px 8px rgba(30,90,168,0.08);
    }
    .glass {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .glass-dark {
      background: rgba(15,39,71,0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .gradient-text {
      background: linear-gradient(135deg, #0F2747 0%, #1E5AA8 50%, #3B82F6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gradient-text-gold {
      background: linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .border-gradient {
      border-image: linear-gradient(135deg,#1E5AA8,#3B82F6) 1;
    }
    .role-card:hover .role-icon { transform: scale(1.15) rotate(-5deg); transition: transform 0.3s ease; }
    .role-icon { transition: transform 0.3s ease; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .notice-card:hover { transform: translateY(-3px); }
    .notice-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
    .step-card:hover { transform: translateY(-6px) scale(1.02); }
    .step-card { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease; }

    /* Orb backgrounds */
    .orb-1 {
      position: absolute; border-radius: 50%;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(30,90,168,0.12) 0%, transparent 70%);
      top: -120px; right: -100px;
      animation: floatSlow 10s ease-in-out infinite;
    }
    .orb-2 {
      position: absolute; border-radius: 50%;
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%);
      bottom: -80px; left: -80px;
      animation: floatSlow 13s ease-in-out infinite reverse;
    }
    .orb-3 {
      position: absolute; border-radius: 50%;
      width: 250px; height: 250px;
      background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
      top: 40%; left: 30%;
      animation: floatSlow 16s ease-in-out infinite;
    }
  `}</style>
);

export const HomePage: React.FC = () => {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();

  const [selectedRoleTab, setSelectedRoleTab] = useState<'student' | 'faculty' | 'admin' | 'dean'>('student');
  const [rollInput, setRollInput] = useState('2025-MCA-042');
  const [searchedResult, setSearchedResult] = useState<SemesterResultWithDetails | null>(initialResults[0]);
  const [activeSimulatorView, setActiveSimulatorView] = useState<'gradecard' | 'hallticket'>('gradecard');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<UniversityNotice | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroPreviewMode, setHeroPreviewMode] = useState<'hallticket' | 'gradecard'>('hallticket');
  const [countdown, setCountdown] = useState({ days: 14, hours: 8, minutes: 42, seconds: 15 });
  const [visibleStats, setVisibleStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Hero Entrance Timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.gsap-hero-badge', { y: -25, autoAlpha: 0, duration: 0.6, clearProps: 'all' })
      .from('.gsap-hero-title', { y: 35, autoAlpha: 0, duration: 0.8, clearProps: 'all' }, '-=0.35')
      .from('.gsap-hero-desc', { y: 20, autoAlpha: 0, duration: 0.6, clearProps: 'all' }, '-=0.4')
      .from('.gsap-hero-cta', { scale: 0.92, y: 15, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.6)', clearProps: 'all' }, '-=0.3')
      .from('.gsap-hero-pill', { y: 15, autoAlpha: 0, stagger: 0.05, duration: 0.4, clearProps: 'all' }, '-=0.2')
      .from('.gsap-hero-card', { y: 40, scale: 0.94, autoAlpha: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity,visibility' }, '-=0.5');

    // 2. Ambient Floating Motion on Hero Card
    gsap.to('.gsap-hero-float', {
      y: -10,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // 3. Stats Strip with ScrollTrigger (once: true, clearProps: 'all')
    gsap.from('.gsap-stat-card', {
      scrollTrigger: {
        trigger: '.gsap-stats-container',
        start: 'top 92%',
        once: true,
      },
      y: 35,
      autoAlpha: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: 'back.out(1.4)',
      clearProps: 'all',
    });

    // 4. Role Portals Section (once: true, clearProps: 'all')
    gsap.from('.gsap-portals-header', {
      scrollTrigger: { trigger: '#portals', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-portal-tab', {
      scrollTrigger: { trigger: '#portals', start: 'top 92%', once: true },
      scale: 0.95, opacity: 0, stagger: 0.05, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'all'
    });

    // 5. Exam Lifecycle Steps & Connecting Line (once: true, clearProps: 'all')
    gsap.from('.gsap-lifecycle-header', {
      scrollTrigger: { trigger: '#lifecycle', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-lifecycle-line', {
      scrollTrigger: { trigger: '#lifecycle', start: 'top 92%', once: true },
      scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'power2.inOut', clearProps: 'all'
    });
    gsap.from('.gsap-step-card', {
      scrollTrigger: { trigger: '#lifecycle', start: 'top 92%', once: true },
      y: 25, opacity: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out', clearProps: 'all'
    });

    // 6. Notices Cards (once: true, clearProps: 'all')
    gsap.from('.gsap-notices-header', {
      scrollTrigger: { trigger: '#notices', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-notice-card', {
      scrollTrigger: { trigger: '#notices', start: 'top 92%', once: true },
      y: 25, opacity: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out', clearProps: 'all'
    });

    // 7. Verify Section (once: true, clearProps: 'all')
    gsap.from('.gsap-verify-header', {
      scrollTrigger: { trigger: '#verify', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-verify-search', {
      scrollTrigger: { trigger: '#verify', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-verify-card', {
      scrollTrigger: { trigger: '#verify', start: 'top 92%', once: true },
      y: 25, opacity: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all'
    });

    // 8. FAQ Accordion Items (once: true, clearProps: 'all')
    gsap.from('.gsap-faq-header', {
      scrollTrigger: { trigger: '#faqs', start: 'top 92%', once: true },
      y: 20, opacity: 0, duration: 0.5, clearProps: 'all'
    });
    gsap.from('.gsap-faq-item', {
      scrollTrigger: { trigger: '#faqs', start: 'top 92%', once: true },
      y: 20, opacity: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out', clearProps: 'all'
    });

    // 9. CTA Banner (once: true, clearProps: 'all')
    gsap.from('.gsap-cta-banner', {
      scrollTrigger: {
        trigger: '.gsap-cta-banner',
        start: 'top 92%',
        once: true,
      },
      scale: 0.96,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
      clearProps: 'all',
    });

    // Refresh ScrollTrigger calculations after initial paint
    ScrollTrigger.refresh();
  }, { scope: mainContainerRef });

  // Role Tab Switching Transition
  useGSAP(() => {
    gsap.fromTo(
      '.gsap-portal-card',
      { autoAlpha: 0, y: 16, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
    );
  }, { dependencies: [selectedRoleTab], scope: mainContainerRef });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { ...prev, days: Math.max(0, prev.days - 1), hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleStats(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const cleaned = rollInput.trim().toUpperCase();
    const found = initialResults.find(
      r => r.roll_number.toUpperCase() === cleaned || r.enrollment_number.toUpperCase() === cleaned
    );
    if (found) {
      setSearchedResult(found);
    } else {
      setSearchedResult({
        ...initialResults[0],
        roll_number: cleaned || '2025-GEN-099',
        student_name: 'Candidate ' + cleaned,
        sgpa: 8.85, cgpa: 8.92,
        academic_standing: 'First Class with Distinction',
        overall_status: 'PASS',
        subjects: initialResults[0].subjects.map(s => ({
          ...s,
          internal_marks: Math.min(s.max_internal, Math.floor(s.max_internal * 0.9)),
          external_marks: Math.min(s.max_external, Math.floor(s.max_external * 0.88)),
          total_marks: Math.floor(s.max_total * 0.88),
          letter_grade: 'A+' as const, grade_point: 9, credit_points: s.credits * 9
        }))
      });
    }
  };

  const handleQuickPreset = (roll: string) => {
    setRollInput(roll);
    setSearchError(null);
    const found = initialResults.find(r => r.roll_number.toUpperCase() === roll.toUpperCase());
    if (found) { setSearchedResult(found); return; }
    setSearchedResult({
      ...initialResults[0], roll_number: roll,
      student_name: roll.includes('BTECH') ? 'Priya Patel' : 'Amit Verma',
      program_name: roll.includes('BTECH') ? 'B.Tech Computer Science' : 'Master of Business Administration',
      sgpa: roll.includes('BTECH') ? 8.95 : 9.15, cgpa: roll.includes('BTECH') ? 8.88 : 9.10
    });
  };

  const getDashboardLink = () => {
    if (!role) return '/login';
    const map: Record<string, string> = { student: '/student/dashboard', faculty: '/faculty/dashboard', administrator: '/admin/dashboard', dean: '/dean/dashboard' };
    return map[role] ?? '/login';
  };

  const roleConfig = {
    student: {
      icon: GraduationCap, color: 'blue', gradient: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
      label: '🎓 Student Portal', title: 'Complete Academic Lifecycle',
      desc: 'Access course enrollments, 75% attendance tracker, digital hall tickets, SGPA/CGPA grade cards, and revaluation applications.',
      features: ['QR-Secured Digital Hall Tickets', '75% Attendance Safeguard Alerts', 'Semester Results & SGPA/CGPA', 'Online Revaluation & Script Copy'],
      snap: [['Overall Attendance', '89.4% (Safe ✓)', 'text-emerald-700'], ['Current CGPA', '9.14 / 10.0', 'text-[#0F2747]'], ['Hall Ticket', 'Generated & Dean Signed', 'text-blue-700'], ['Fee Dues', 'Clear (₹ 0.00)', 'text-emerald-700']],
      cta: 'Launch Student Portal'
    },
    faculty: {
      icon: Users, color: 'emerald', gradient: 'from-emerald-600 to-teal-600',
      bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
      label: '👨‍🏫 Faculty Portal', title: 'Teaching, Assessment & Invigilation',
      desc: 'One-click bulk lecture attendance marking, continuous internal evaluation (CIE) score entries, and real-time invigilation duty schedules.',
      features: ['Bulk Daily Attendance Register', 'CIE Internal Marks Entry (Lockable)', 'Invigilation Duty Roster & Reporting', 'Assigned Cohort & Syllabus Tracking'],
      snap: [['Assigned Courses', '3 Subjects (164 Students)', 'text-[#0F2747]'], ['Next Invigilation', '12 Oct • Hall A-101', 'text-blue-700'], ['Internal Marks Lock', 'Pending Submission', 'text-amber-700'], ['CIE Completion', '94% Entered', 'text-emerald-700']],
      cta: 'Faculty Log In'
    },
    admin: {
      icon: Building2, color: 'indigo', gradient: 'from-indigo-600 to-violet-600',
      bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700',
      label: '🏛️ Controller & Admin', title: 'Complete Academic Infrastructure',
      desc: 'Total control over curriculum setup, anti-cheating seating algorithms, exam timetable creation, marks ledger freezing, and immutable audit logs.',
      features: ['Anti-Malpractice Seating Algorithm', 'Multi-Session Timetable Engine', 'Cryptographic Marks Ledger Lock', 'Immutable Audit Trail with IP Logging'],
      snap: [['Active Exam Cycle', 'End-Sem Winter 2026', 'text-[#0F2747]'], ['Seating Allocated', '100% (24 Halls)', 'text-emerald-700'], ['Invigilators Assigned', '148 of 150', 'text-blue-700'], ['Audit Anomalies', 'Zero Detected', 'text-emerald-700']],
      cta: 'Admin Control Center'
    },
    dean: {
      icon: Award, color: 'amber', gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
      label: '📜 Dean & Executive', title: 'Statutory Sign-Off & Analytics',
      desc: 'Review examination datesheets before gazette release, moderate grade curves, authorize official publication, and inspect institution-wide analytics.',
      features: ['Multi-Level Timetable Statutory Approval', 'Grade Curve Moderation & Normalization', 'University-Wide Pass/Fail Analytics', 'Official Gazette Cryptographic Seal'],
      snap: [['Pending Approvals', '1 Schedule (Faculty of IT)', 'text-blue-700'], ['Overall Pass Rate', '92.4% Across Faculties', 'text-emerald-700'], ['Gazette Authorized', 'Yes • Spring 2026 TR', 'text-[#0F2747]'], ['Result Moderation', 'Complete', 'text-emerald-700']],
      cta: 'Executive Sign-Off Hub'
    }
  };

  const activeRole = roleConfig[selectedRoleTab];

  return (
    <div ref={mainContainerRef} className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col selection:bg-[#1E5AA8] selection:text-white font-sans antialiased overflow-x-clip">
      <GlobalStyles />

      {/* ── TOP STATUS BAR ─────────────────── */}
      <div className="bg-[#070F1C] text-slate-300 text-xs px-6 sm:px-8 lg:px-12 py-1.5 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Session 2026-27 Active
            </span>
            <span className="text-slate-700">•</span>
            <span className="hidden sm:block text-slate-400">NAAC Grade A++ (CGPA 3.82/4.00)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> ISO 27001:2022 Certified
            </span>
            <span className="hidden md:block">COE Helpline: <span className="text-blue-300 font-semibold">+91 (011) 2874-5500</span></span>
          </div>
        </div>
      </div>

      {/* ── STICKY NAVBAR ──────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-2.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <UniversityCrest size="sm" variant="gold" className="transition-transform group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-academic-serif font-black text-base sm:text-lg tracking-tight text-[#0F2747]">
                  ITM University
                </span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-900 border border-amber-300/80">
                  COE PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Office of the Controller of Examinations &bull; UEAMS</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            {[['#overview', 'Overview'], ['#portals', 'Portals'], ['#verify', 'Verify'], ['#lifecycle', 'Lifecycle'], ['#notices', 'Notices'], ['#faqs', 'FAQs']].map(([href, label]) => (
              <a key={href} href={href} className="px-3.5 py-1.5 rounded-xl hover:text-[#0F2747] hover:bg-slate-100/90 transition-all duration-150">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Theme toggle — always visible */}
            <ThemeToggle />

            {user || profile ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-[#0F2747]">{profile?.full_name || user?.email}</div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1E5AA8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{role}</span>
                </div>
                <Link to={getDashboardLink()} className="btn-3d-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold">
                  <span>Dashboard</span><ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-3d-secondary px-4 py-2 text-xs font-bold">Sign In</Link>
                <Link to="/signup" className="btn-3d-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold">
                  <span>Get Access</span><ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : (
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="h-0.5 w-full bg-slate-700 rounded" /><span className="h-0.5 w-full bg-slate-700 rounded" /><span className="h-0.5 w-full bg-slate-700 rounded" />
              </div>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
            {[['#overview', 'Overview'], ['#portals', 'Role Portals'], ['#verify', 'Instant Verify'], ['#notices', 'Circulars'], ['#faqs', 'FAQs']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100">{label}</a>
            ))}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link to="/login" className="text-center py-2 text-xs font-bold text-[#0F2747] border border-slate-200 rounded-lg hover:bg-slate-50">Sign In</Link>
              <Link to="/signup" className="text-center py-2 text-xs font-bold text-white bg-[#0F2747] rounded-lg">Register</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── ANIMATED NOTICE TICKER ──────────── */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0F2747] to-[#162B4A] border-b border-slate-800/60 py-2 overflow-hidden">
        <div className="flex items-center gap-0 whitespace-nowrap">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 z-10 bg-gradient-to-r from-[#0A192F] via-[#0A192F] to-transparent pr-6">
            <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-900 font-extrabold text-[10px] tracking-widest uppercase flex items-center gap-1 shadow-sm shadow-amber-400/30">
              <Bell className="w-3 h-3" /> LIVE
            </span>
          </div>
          <div className="flex animate-ticker gap-16 text-xs text-slate-300 font-medium">
            {[...INITIAL_MOCK_NOTICES, ...INITIAL_MOCK_NOTICES].slice(0, 8).map((n, i) => (
              <button key={i} onClick={() => setActiveNotice(n)} className="inline-flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.priority === 'urgent' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <span className="truncate max-w-xs">{n.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ───────────────────── */}
      <section id="overview" className="relative overflow-hidden pt-5 pb-12 lg:pt-7 lg:pb-16">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30" />
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />

        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#1E5AA8 1px,transparent 1px),linear-gradient(90deg,#1E5AA8 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">

            {/* ── LEFT: Hero Copy ── */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              {/* Badge */}
              <div className="gsap-hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200/80 text-[#1E5AA8] text-xs font-bold shadow-md shadow-blue-100/50">
                <div className="relative w-4 h-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40" />
                  <Building2 className="relative w-4 h-4 text-[#1E5AA8]" />
                </div>
                <span>Office of the Controller of Examinations &bull; ITM University</span>
              </div>

              {/* Headline */}
              <h1 className="gsap-hero-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]">
                <span className="text-[#0F2747]">Precision &</span>
                <br />
                <span className="animate-shimmer">Integrity in</span>
                <br />
                <span className="text-[#0F2747]">University</span>{' '}
                <span className="gradient-text">Exams</span>
              </h1>

              <p className="gsap-hero-desc text-base text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                The unified digital backbone for ITM University. Centralizing course allocation, <span className="font-semibold text-[#0F2747]">75% attendance threshold</span> tracking, anti-malpractice seating, digital hall tickets, marks entry, and Dean-authorized official gazettes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
                <Link to={user ? getDashboardLink() : "/login"} className="gsap-hero-cta group btn-3d-primary w-full sm:w-auto px-7 py-3.5 text-sm font-bold flex items-center justify-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>{user ? 'Go to My Dashboard' : 'Access University Portal'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#verify" className="gsap-hero-cta group btn-3d-secondary w-full sm:w-auto px-6 py-3.5 text-sm font-bold flex items-center justify-center gap-2">
                  <Search className="w-4 h-4 text-[#1E5AA8]" />
                  <span>Verify Result / Hall Ticket</span>
                </a>
              </div>

              {/* Accreditation pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                {['NAAC A++', 'UGC Autonomous', 'ISO 27001', '100% QR Verified', 'UGC 10-Point Scale'].map(tag => (
                  <span key={tag} className="gsap-hero-pill badge-3d bg-white border border-slate-200 text-slate-700 hover:border-blue-300 transition-all py-1 px-3 shadow-xs">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Floating Interactive Card ── */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md gsap-hero-card gsap-hero-float">
                {/* Glowing ring behind card */}
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-800 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#1E5AA8] to-indigo-600 rounded-3xl blur-lg opacity-15" />

                {/* Card */}
                <div className="relative card-3d rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">

                  {/* Card header */}
                  <div className="bg-gradient-to-r from-[#0F2747] to-[#1A3F72] p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <UniversityCrest size="sm" variant="gold" />
                      <div>
                        <div className="text-xs font-bold text-white">ITM University COE</div>
                        <div className="text-[10px] text-blue-200">Live Credential Engine</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[10px] font-bold">
                      {(['hallticket', 'gradecard'] as const).map(mode => (
                        <button key={mode} onClick={() => setHeroPreviewMode(mode)}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${heroPreviewMode === mode ? 'btn-3d-primary text-white text-[10px]' : 'text-slate-300 hover:text-white'}`}>
                          {mode === 'hallticket' ? 'Hall Ticket' : 'Grade Sheet'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Countdown bar */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" style={{ animation: 'spin-slow 6s linear infinite' }} />
                      Exam commences in:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                      {[`${countdown.days}d`, `${countdown.hours}h`, `${countdown.minutes}m`, `${countdown.seconds}s`].map((t, i) => (
                        <span key={i} className="stat-box-3d text-amber-900 px-2 py-0.5 rounded-md shadow-xs">{t}</span>
                      ))}
                    </div>
                  </div>

                  {heroPreviewMode === 'hallticket' ? (
                    <div className="p-5 space-y-4 bg-gradient-to-b from-white to-slate-50/50">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                        <div>
                          <span className="badge-3d text-[10px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-[#0F2747] to-[#1E5AA8]">
                            OFFICIAL ADMIT CARD
                          </span>
                          <h4 className="text-sm font-bold text-[#0F2747] mt-2">Rahul Sharma</h4>
                          <p className="text-[11px] text-slate-500">Roll: 2025-MCA-042 · MCA Semester II</p>
                        </div>
                        <div className="w-12 h-12 bg-slate-800 rounded-xl p-1.5 flex items-center justify-center shadow-md">
                          <QrCode className="w-full h-full text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="stat-box-3d p-2.5 bg-blue-50/60 border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">Exam Centre</div>
                          <div className="font-bold text-[#0F2747] text-xs mt-0.5">Science Block · Hall 204</div>
                        </div>
                        <div className="stat-box-3d p-2.5 bg-indigo-50/60 border border-indigo-100">
                          <div className="text-[10px] text-slate-500 font-medium">Assigned Seat</div>
                          <div className="font-bold text-[#1E5AA8] text-xs mt-0.5">Bench B-18 (Anti-Copy)</div>
                        </div>
                      </div>
                      <div className="stat-box-3d p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">Advanced Database Systems</div>
                          <div className="text-[10px] text-slate-500">MCA-201 · 10:00 AM – 01:00 PM</div>
                        </div>
                        <span className="badge-3d bg-emerald-500 text-white">ELIGIBLE ✓</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Dean Approved & Signed</span>
                        <span className="font-mono text-slate-400 text-[10px]">HT-2026-9841</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4 bg-gradient-to-b from-white to-slate-50/50">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-0.5 rounded-md">GAZETTE RESULT</span>
                          <h4 className="text-sm font-bold text-[#0F2747] mt-2">Rahul Sharma</h4>
                          <p className="text-[11px] text-slate-500">Master of Computer Applications</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black gradient-text">9.47</div>
                          <div className="text-[10px] font-bold text-slate-500">SGPA · Distinction</div>
                        </div>
                      </div>
                      {[['Data Structures & Algorithms', 'O (10.0)', 'emerald'], ['Database Management Systems', 'A+ (9.0)', 'blue'], ['OS & System Architecture', 'A+ (9.0)', 'blue']].map(([sub, grade, color]) => (
                        <div key={sub} className={`p-2.5 rounded-xl bg-${color}-50/70 border border-${color}-100/80 flex items-center justify-between text-xs`}>
                          <span className="font-medium text-slate-700">{sub}</span>
                          <span className={`font-extrabold text-${color}-700`}>Grade {grade}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-600">Rank #1 in Department</span>
                        <a href="#verify" className="text-[#1E5AA8] font-bold hover:underline">Full Transcript →</a>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Access your portal now</span>
                    <Link to="/login" className="font-bold text-[#1E5AA8] hover:text-[#0F2747] flex items-center gap-1 transition-colors">
                      Institutional Login <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── ANIMATED STATS STRIP ── */}
          <div ref={statsRef} className="gsap-stats-container mt-16 lg:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users, val: '48,500+', label: 'Students Enrolled', color: 'blue', gradient: 'from-blue-600 to-indigo-600' },
              { icon: TrendingUp, val: '99.98%', label: 'On-Time Gazette', color: 'emerald', gradient: 'from-emerald-600 to-teal-600' },
              { icon: BookOpen, val: '1,240+', label: 'Faculty Members', color: 'indigo', gradient: 'from-indigo-600 to-violet-600' },
              { icon: ShieldCheck, val: '100%', label: 'QR Verifiable', color: 'amber', gradient: 'from-amber-500 to-orange-500' }
            ].map(({ icon: Icon, val, label, gradient }, i) => (
              <div key={label} className="gsap-stat-card stat-card stat-box-3d card-3d-interactive p-5">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} shadow-md mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-black text-[#0F2747]">{val}</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE PORTALS ───────────────────── */}
      <section id="portals" className="py-20 sm:py-24 bg-white border-y border-slate-200/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #0F2747 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gsap-portals-header text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold text-[#1E5AA8] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
              Role-Based Unified Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight">
              Tailored for Every <span className="gradient-text">Stakeholder</span>
            </h2>
            <p className="text-sm text-slate-600">
              Granular RLS permissions backed by Supabase Row-Level Security — students, professors, exam controllers, and Deans each get precision-tuned tools.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="gsap-portal-tab-container flex items-center justify-center gap-2.5 flex-wrap mb-8">
            {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((key, i) => {
              const cfg = roleConfig[key];
              const RIcon = cfg.icon;
              const isActive = selectedRoleTab === key;
              return (
                <button key={key} onClick={() => setSelectedRoleTab(key)}
                  className={`gsap-portal-tab px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer ${isActive
                    ? 'btn-3d-primary scale-[1.03]'
                    : 'btn-3d-secondary text-slate-700 hover:text-[#0F2747]'
                    }`}>
                  <RIcon className="w-4 h-4" />
                  <span>{cfg.label.split(' ').slice(1).join(' ')}</span>
                </button>
              );
            })}
          </div>

          {/* Active Role Panel */}
          <div className={`gsap-portal-card card-3d rounded-3xl border-2 ${activeRole.border} bg-gradient-to-br from-white to-slate-50/80 shadow-2xl overflow-hidden transition-all duration-300`}>
            <div className={`h-1.5 bg-gradient-to-r ${activeRole.gradient}`} />
            <div className="p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-7 space-y-5">
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${activeRole.bg} ${activeRole.text} font-bold text-xs border ${activeRole.border}`}>
                    <activeRole.icon className="w-4 h-4 role-icon" />
                    {activeRole.label}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0F2747]">{activeRole.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeRole.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeRole.features.map(feat => (
                      <div key={feat} className="stat-box-3d flex items-start gap-2.5 p-3.5 bg-white border border-slate-200">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${activeRole.text}`} />
                        <span className="text-xs font-semibold text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={user ? getDashboardLink() : "/login"} className="btn-3d-primary inline-flex items-center gap-2 px-6 py-3.5 text-xs font-bold">
                    <span>{user ? 'Open Dashboard' : activeRole.cta}</span><ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="lg:col-span-5">
                  <div className="card-3d bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md">
                    <div className={`px-4 py-3 bg-gradient-to-r ${activeRole.gradient} flex items-center justify-between`}>
                      <span className="text-xs font-bold text-white">Live Dashboard Snapshot</span>
                      <span className="badge-3d text-[10px] font-bold px-2 py-0.5 bg-white/20 text-white border border-white/30">ACTIVE TERM</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activeRole.snap.map(([label, value, cls]) => (
                        <div key={label} className="flex justify-between items-center px-4 py-3 text-xs hover:bg-slate-50 transition-colors">
                          <span className="text-slate-500 font-medium">{label}</span>
                          <span className={`font-bold ${cls}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSTANT VERIFY TOOL ────────────── */}
      <section id="verify" className="py-20 sm:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border-b border-slate-200/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gsap-verify-header text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold text-[#1E5AA8] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
              Direct Verification Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight">
              Instant <span className="gradient-text">Result & Hall Ticket</span> Lookup
            </h2>
            <p className="text-sm text-slate-600">Enter a roll number or click a preset below to see a live, authenticated academic credential.</p>
          </div>

          {/* Search */}
          <div className="gsap-verify-search max-w-2xl mx-auto">
            <form onSubmit={handleRollSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input type="text" value={rollInput} onChange={e => setRollInput(e.target.value)}
                  placeholder="Enter Roll No. e.g. 2025-MCA-042"
                  className="w-full bg-white border-2 border-slate-200 focus:border-[#1E5AA8] rounded-2xl px-4 py-3.5 pl-11 text-xs sm:text-sm text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-sm uppercase tracking-wider font-semibold transition-all" />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              <button type="submit" className="btn-3d-primary px-6 py-3.5 text-sm font-bold flex items-center gap-2 flex-shrink-0">
                <span>Search</span><ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">Quick demo:</span>
              {[['2025-MCA-042', 'Rahul Sharma'], ['2024-BTECH-118', 'Priya Patel'], ['2023-MBA-007', 'Amit Verma']].map(([roll, name]) => (
                <button key={roll} type="button" onClick={() => handleQuickPreset(roll)}
                  className="btn-3d-secondary px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer shadow-xs">
                  {roll} · {name}
                </button>
              ))}
            </div>
          </div>

          {/* Result Doc Display */}
          {searchedResult && (
            <div className="gsap-verify-card mt-8 max-w-5xl mx-auto card-3d bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
              {/* Toolbar */}
              <div className="bg-slate-50/80 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['gradecard', 'hallticket'] as const).map(view => (
                    <button key={view} onClick={() => setActiveSimulatorView(view)}
                      className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeSimulatorView === view ? 'btn-3d-primary' : 'btn-3d-secondary text-slate-700'}`}>
                      {view === 'gradecard' ? '📋 Statement of Marks' : '🎫 Admit Card'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="badge-3d gap-1 font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authenticity Verified
                  </span>
                  <button onClick={() => window.print()} className="btn-3d-secondary p-2 rounded-xl text-slate-600 cursor-pointer">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {activeSimulatorView === 'gradecard' ? (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Doc Header */}
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="flex justify-center mb-2">
                      <UniversityCrest size="md" variant="gold" />
                    </div>
                    <h3 className="text-lg font-black text-[#0F2747] uppercase tracking-tight">ITM University · Office of the Controller of Examinations</h3>
                    <p className="text-xs text-slate-500 font-semibold tracking-widest mt-0.5">OFFICIAL TABULATION REGISTER · SEMESTER GRADE CARD</p>
                  </div>

                  {/* Candidate info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 text-xs">
                    {[['Candidate', searchedResult.student_name], ['Roll No.', searchedResult.roll_number], ['Program', searchedResult.program_name], ['Department', searchedResult.department_name]].map(([l, v]) => (
                      <div key={l}><span className="text-[10px] text-slate-400 font-medium block">{l}</span><span className="font-bold text-[#0F2747]">{v}</span></div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#0F2747] to-[#1A3F72] text-white text-[11px] font-bold">
                          {['Code', 'Course Title', 'Credits', 'Internal', 'External', 'Total', 'Grade', 'Status'].map(h => (
                            <th key={h} className="py-3 px-3 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {searchedResult.subjects.map((s, i) => (
                          <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">{s.subject_code}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{s.subject_name}</td>
                            <td className="py-3 px-3 text-center font-bold">{s.credits}</td>
                            <td className="py-3 px-3 text-center text-slate-600">{s.internal_marks}</td>
                            <td className="py-3 px-3 text-center text-slate-600">{s.external_marks}</td>
                            <td className="py-3 px-3 text-center font-black text-[#0F2747]">{s.total_marks}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded-lg font-black text-[11px] bg-gradient-to-r from-blue-100 to-indigo-100 text-[#1E5AA8] border border-blue-200">{s.letter_grade}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* SGPA row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                    {[['SGPA', String(searchedResult.sgpa)], ['CGPA', String(searchedResult.cgpa)], ['Classification', searchedResult.academic_standing], ['Status', 'OFFICIALLY GAZETTED']].map(([l, v]) => (
                      <div key={l}><div className="text-[10px] text-blue-200 font-medium">{l}</div><div className="font-black text-xl mt-0.5">{v}</div></div>
                    ))}
                  </div>

                  {/* Sig */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-12 h-12 text-slate-800" />
                      <div className="text-[10px] text-slate-500">
                        <div>Verify: <span className="font-mono font-bold text-slate-700">{searchedResult.qr_verification_code}</span></div>
                        <div>Signed: {searchedResult.approved_by_dean_name}</div>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="font-serif italic font-bold text-slate-700 text-sm">Dr. Rajeshwari Raman</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Controller of Examinations</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="flex justify-center mb-2">
                      <UniversityCrest size="md" variant="gold" />
                    </div>
                    <h3 className="text-lg font-black text-[#0F2747] uppercase tracking-tight">ITM University · Examination Cell</h3>
                    <p className="text-xs text-slate-500 font-semibold tracking-widest mt-0.5">EXAMINATION ADMIT CARD / HALL TICKET · SPRING 2026</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    {[['Candidate', searchedResult.student_name], ['Roll No.', searchedResult.roll_number], ['Exam Centre', 'Campus Science Block 2'], ['Eligibility', 'Eligible (88.6% ✓)']].map(([l, v]) => (
                      <div key={l}><span className="text-[10px] text-slate-400 font-medium block">{l}</span><span className="font-bold text-[#0F2747]">{v}</span></div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#0F2747] to-[#1A3F72] text-white">
                          {['Subject Code', 'Paper Title', 'Date', 'Timing', 'Room & Seat', 'Invigilator Sign'].map(h => (
                            <th key={h} className="py-3 px-3 font-semibold text-[11px] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {searchedResult.subjects.map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-500">{s.subject_code}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{s.subject_name}</td>
                            <td className="py-3 px-3 text-slate-600">May {18 + i * 3}, 2026</td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">10:00 – 01:00 PM</td>
                            <td className="py-3 px-3 font-bold text-[#1E5AA8]">Hall 204 · #{12 + i * 2}</td>
                            <td className="py-3 px-3 text-slate-300 font-mono text-[10px]">[ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 mb-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" /> Important Candidate Instructions
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>Present this admit card with original university photo ID at the gate.</li>
                      <li>Report 30 minutes before paper commencement. Late entry not permitted.</li>
                      <li>Electronic devices, watches, and notes are strictly prohibited inside the hall.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── EXAM LIFECYCLE STEPS ───────────── */}
      <section id="lifecycle" className="py-20 sm:py-24 bg-white border-b border-slate-200/60 relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gsap-lifecycle-header text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-[#1E5AA8] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
              Institutional Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight">
              5-Stage <span className="gradient-text">Examination Lifecycle</span>
            </h2>
          </div>

          <div className="gsap-lifecycle-grid relative grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Connecting line */}
            <div className="gsap-lifecycle-line hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200 z-0" />

            {[
              { n: '01', title: 'Course & Attendance', desc: 'Semester enrollment with continuous 75% attendance auditing. Auto-alerts for shortage.', icon: BookOpen, color: 'from-blue-600 to-blue-700' },
              { n: '02', title: 'Anti-Malpractice Seating', desc: 'Heuristic algorithm randomizes cohorts — adjacent seats never share the same question paper.', icon: ShieldCheck, color: 'from-indigo-600 to-indigo-700' },
              { n: '03', title: 'QR Digital Hall Tickets', desc: 'Cryptographically signed admit cards released to eligible students. Barcoded entry verification.', icon: QrCode, color: 'from-violet-600 to-violet-700' },
              { n: '04', title: 'Secure CIE & Marks Entry', desc: 'Faculty enter internal marks with dual-verification. Ledger auto-locks past submission deadline.', icon: Lock, color: 'from-purple-600 to-purple-700' },
              { n: '05', title: 'Dean Gazette & Transcripts', desc: "Dean council signs off. Official e-transcripts publish with UGC 10-point scale compliance.", icon: FileCheck, color: 'from-emerald-600 to-emerald-700' }
            ].map(({ n, title, desc, icon: Icon, color }) => (
              <div key={n} className="gsap-step-card step-card card-3d card-3d-interactive relative z-10 p-5 bg-white border border-slate-200">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white shadow-md mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-extrabold tracking-widest text-slate-400 mb-1">STEP {n}</div>
                <h4 className="font-bold text-sm text-[#0F2747] mb-1.5">{title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTICES GRID ───────────────────── */}
      <section id="notices" className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gsap-notices-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#1E5AA8] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">Official Gazette</span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight mt-3">University Circulars</h2>
              <p className="text-sm text-slate-500 mt-1">Statutory announcements from the Controller of Examinations.</p>
            </div>
            <Link to="/login" className="text-xs font-bold text-[#1E5AA8] hover:text-[#0F2747] inline-flex items-center gap-1 transition-colors">
              <span>Notice Archive in Portal</span><ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INITIAL_MOCK_NOTICES.slice(0, 3).map(notice => (
              <div key={notice.id} onClick={() => setActiveNotice(notice)}
                className="gsap-notice-card notice-card card-3d card-3d-interactive bg-white p-6 cursor-pointer flex flex-col gap-4 group">
                <div className="flex items-center justify-between">
                  <span className="badge-3d bg-blue-50 text-[#1E5AA8] border border-blue-200">{notice.category}</span>
                  {notice.priority === 'urgent' && (
                    <span className="badge-3d gap-1 bg-red-50 text-red-700 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> URGENT
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#0F2747] line-clamp-2 leading-snug group-hover:text-[#1E5AA8] transition-colors">{notice.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed flex-1">{notice.content}</p>
                <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-3">
                  <span className="text-slate-400">Ref: {notice.circular_number.split('/').slice(-1)[0]}</span>
                  <span className="text-[#1E5AA8] font-bold group-hover:underline">Read Details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ────────────────────── */}
      <section id="faqs" className="py-20 sm:py-24 bg-white border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gsap-faq-header text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-[#1E5AA8] uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">Helpdesk</span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight">Frequently Asked <span className="gradient-text">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How do I download my digital Hall Ticket?', a: 'Sign in to Student Portal. If overall attendance ≥75% and all fee clearances are validated, "Download Admit Card" activates under the Examinations tab. The card is cryptographically signed and QR-verifiable.' },
              { q: 'What if my attendance is below 75%?', a: 'Students between 65–74.9% may apply for Dean\'s Medical/Extenuating Condonation. Students below 65% are automatically withheld from writing that course paper and must reappear next cycle.' },
              { q: 'How does the anti-malpractice seating algorithm work?', a: 'UEAMS distributes students so adjacent desks belong to different programs or carry different question papers — preventing unauthorized collaboration with full provable auditability.' },
              { q: 'What is the revaluation timeline and fee?', a: 'Revaluation requests open within 7 calendar days of gazette publication. Scrutiny reports publish within 15 working days after re-checking by an independent evaluator appointed by the COE.' },
              { q: 'How do faculty submit CIE marks?', a: 'Faculty navigate to their Portal → Assigned Subject → Marks Entry. Scores for quizzes, labs, and mid-terms are entered and locked before the university deadline for integration into the final grade sheet.' }
            ].map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className={`gsap-faq-item card-3d overflow-hidden transition-[border-color,box-shadow,background-color] duration-200 ${isOpen ? 'border-[#1E5AA8] shadow-md shadow-blue-100/50' : 'border-slate-200 bg-slate-50/60'}`}>
                  <button onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#0F2747] cursor-pointer hover:bg-blue-50/30 transition-colors">
                    <span>{faq.q}</span>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isOpen ? 'btn-3d-primary text-white' : 'btn-3d-secondary text-slate-500'}`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-blue-100 pt-4 bg-white animate-fade-in-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ──────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070F1C] via-[#0F2747] to-[#1E5AA8] animate-gradient-x" />
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 animate-spin-slow" />

        <div className="gsap-cta-banner relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            ITM University · Academic Session 2026-27
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Ready to access your portal?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">Students, faculty, and controllers sign in with institutional credentials or request departmental onboarding.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to={user ? getDashboardLink() : "/login"} className="group btn-3d-gold px-8 py-4 text-sm font-bold flex items-center gap-2">
              <span>{user ? 'Go to Your Dashboard' : 'Sign In to Your Account'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/signup" className="btn-3d-secondary px-8 py-4 text-sm font-bold">
              Register New Profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────── */}
      <Footer variant="homepage" />

      {/* ── NOTICE MODAL ───────────────────── */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveNotice(null)}>
          <div className="card-3d bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {/* Modal gradient header */}
            <div className="bg-gradient-to-r from-[#0F2747] to-[#1E5AA8] p-6 rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-3d text-[10px] font-extrabold uppercase px-2.5 py-1 bg-white/20 text-white border border-white/20">{activeNotice.category}</span>
                    {activeNotice.priority === 'urgent' && (
                      <span className="badge-3d text-[10px] font-extrabold uppercase px-2.5 py-1 bg-red-500/80 text-white border border-red-400/30">🚨 URGENT</span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{activeNotice.title}</h3>
                </div>
                <button onClick={() => setActiveNotice(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-blue-200 mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3">
                <span>Circular: <strong className="text-white">{activeNotice.circular_number}</strong></span>
                <span>Date: {new Date(activeNotice.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{activeNotice.content}</div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{activeNotice.author_name}</div>
                  <div className="text-[11px] text-slate-500">{activeNotice.author_role}</div>
                </div>
                <button onClick={() => setActiveNotice(null)} className="btn-3d-primary px-5 py-2.5 text-xs font-bold">
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LandingPage = HomePage;

