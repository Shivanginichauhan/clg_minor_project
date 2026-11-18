import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../contexts/AuthContext.js';
import { UserRole } from '../../types/database.types.js';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Footer } from '../../components/common/Footer.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const LoginPage: React.FC = () => {
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginContainerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.gsap-login-badge', { y: -20, autoAlpha: 0, duration: 0.5, clearProps: 'all' })
      .from('.gsap-login-crest', { scale: 0.85, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.6)', clearProps: 'all' }, '-=0.25')
      .from('.gsap-login-title', { y: 20, autoAlpha: 0, duration: 0.5, clearProps: 'all' }, '-=0.3')
      .from('.gsap-login-bullet', { x: -20, autoAlpha: 0, stagger: 0.08, duration: 0.4, clearProps: 'all' }, '-=0.2')
      .from('.gsap-login-form-card', { y: 25, autoAlpha: 0, duration: 0.6, ease: 'power2.out', clearProps: 'all' }, '-=0.4')
      .from('.gsap-login-quickfill', { scale: 0.92, autoAlpha: 0, stagger: 0.06, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'all' }, '-=0.2');

    // Subtle gentle breathing on institutional seal
    gsap.to('.gsap-login-crest', {
      scale: 1.04,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, { scope: loginContainerRef });

  const from = (location.state as any)?.from?.pathname;
  const loggedOut = (location.state as any)?.loggedOut;

  // Clear credentials whenever landing on login page
  React.useEffect(() => {
    setEmail('');
    setPassword('');
  }, [location.pathname, location.key]);

  const getDashboardPath = (userRole: UserRole): string => {
    return userRole === 'administrator' ? '/admin/dashboard' : `/${userRole}/dashboard`;
  };

  // Auto-redirect if user is already authenticated
  React.useEffect(() => {
    if (!authLoading && user && role && !loggedOut) {
      navigate(getDashboardPath(role), { replace: true });
    }
  }, [user, role, authLoading, loggedOut, navigate]);

  const handleRedirect = (userRole: UserRole) => {
    const rolePrefix = userRole === 'administrator' ? '/admin' : `/${userRole}`;
    if (
      from &&
      from !== '/' &&
      from !== '/home' &&
      from !== '/login' &&
      from !== '/signup' &&
      !from.includes('/student/profile') &&
      from.startsWith(rolePrefix)
    ) {
      navigate(from, { replace: true });
    } else {
      navigate(getDashboardPath(userRole), { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err, role: resolvedRole } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err.message || 'Email or password is incorrect.');
    } else {
      const targetRole = resolvedRole || role || 'administrator';
      handleRedirect(targetRole);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePwd: string = 'Password123!') => {
    setEmail(roleEmail);
    setPassword(rolePwd);
  };

  return (
    <div className="min-h-screen bg-[#071326] text-[#0F172A] flex flex-col justify-between selection:bg-[#C59B27] selection:text-[#071326]">

      {/* Top University Brand Bar */}
      <header className="border-b border-slate-800/80 bg-[#071326]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between text-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <UniversityCrest size="sm" variant="gold" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-academic-serif font-extrabold text-sm sm:text-base tracking-wide text-white">
                ITM University
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                UGC A++
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Statutory Examination &amp; Academic Governance Portal &bull; AY 2025-2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <span className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <Link
            to="/signup"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-[#071326] border border-amber-500/40 transition cursor-pointer"
          >
            Student / Faculty Registration
          </Link>
        </div>
      </header>

      {/* Main Authentication Center: Split Hero Layout */}
      <main ref={loginContainerRef} className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">

        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-white z-10">

          {/* Left Hero Column: Institutional Heritage */}
          <div className="lg:col-span-5 academic-hero p-8 sm:p-10 text-white flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="space-y-6">
              <div className="gsap-login-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory Examination System</span>
              </div>

              <div className="gsap-login-title space-y-2">
                <UniversityCrest size="xl" variant="gold" className="my-2 seal-glow gsap-login-crest" />
                <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Office of the Controller of Examinations
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Autonomous Centralized Academic Council, Moderation Authority &amp; UGC-CBCS Result Publication Center.
                </p>
              </div>

              {/* Institutional Bullet Points */}
              <div className="space-y-2.5 pt-2">
                <div className="gsap-login-bullet flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Conflict-free timetable scheduling &amp; room allotment</span>
                </div>
                <div className="gsap-login-bullet flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>CBCS 10-Point SGPA/CGPA grade tabulation</span>
                </div>
                <div className="gsap-login-bullet flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Statutory Dean &amp; Academic Council digital gazette</span>
                </div>
              </div>
            </div>

            {/* University Motto at Bottom */}
            <div className="pt-8 border-t border-slate-700/60 mt-6">
              <p className="font-academic-serif italic text-amber-300/90 text-xs">
                &ldquo;Omnia Vincit Scientia &bull; Knowledge Illuminates All&rdquo;
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">ITM University Charter &bull; Estd. 1984</p>
            </div>
          </div>

          {/* Right Column: Portal Login Form */}
          <div className="gsap-login-form-card lg:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">

              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-academic-serif text-2xl font-extrabold text-[#0F2747]">
                    Portal Sign In
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    SSO v4.2
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1 font-medium">
                  Enter your registered institutional credentials to access your academic dashboard.
                </p>
              </div>

              {/* Safe Logout Notice */}
              {loggedOut && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>You have been safely signed out. Please enter your credentials to log in again.</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <input type="text" name="fake_username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <input type="password" name="fake_password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1.5 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="inst_portal_email"
                      id="inst_portal_email"
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. virat@university.edu or student@university.edu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-medium text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2747] focus:ring-2 focus:ring-[#0F2747]/20 pl-10 transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0F2747] uppercase tracking-wider">
                      Security Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-[#1E5AA8] hover:text-[#0F2747] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="inst_portal_pwd"
                      id="inst_portal_pwd"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-medium text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2747] focus:ring-2 focus:ring-[#0F2747]/20 pl-10 pr-10 transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#0F2747] focus:ring-[#0F2747] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Keep institutional session active</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-3d-primary w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Institutional Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Fill Demo Credentials */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Demo Credentials
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Pre-Configured
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('student@university.edu', 'Password123!')}
                    className="gsap-login-quickfill p-2 rounded-xl text-left border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 transition cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                      <span>🎓</span> Student
                    </div>
                    <div className="text-[9px] text-blue-700/80 truncate mt-0.5">student@univ...</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('faculty@university.edu', 'Password123!')}
                    className="gsap-login-quickfill p-2 rounded-xl text-left border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <span>👨‍🏫</span> Faculty
                    </div>
                    <div className="text-[9px] text-emerald-700/80 truncate mt-0.5">faculty@univ...</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@university.edu', 'Password123!')}
                    className="gsap-login-quickfill p-2 rounded-xl text-left border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 transition cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                      <span>🛡️</span> Admin
                    </div>
                    <div className="text-[9px] text-purple-700/80 truncate mt-0.5">admin@univ...</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('dean@university.edu', 'Password123!')}
                    className="gsap-login-quickfill p-2 rounded-xl text-left border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 transition cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <span>👑</span> Dean
                    </div>
                    <div className="text-[9px] text-amber-700/80 truncate mt-0.5">dean@univ...</div>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Password for all demo accounts: <code className="font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded">Password123!</code>
                </p>
              </div>

            </div>

            {/* Footer Registration Link */}
            <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500 mt-2">
              <p>
                New student or faculty member?{' '}
                <Link to="/signup" className="font-bold text-[#0F2747] hover:text-[#1E5AA8] underline">
                  Create University Account
                </Link>
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Global University Footer */}
      <Footer variant="auth" />

    </div>
  );
};
