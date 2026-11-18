import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Timer,
  RefreshCw,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { Footer } from '../../components/common/Footer.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { rateLimitService } from '../../services/rateLimitService.js';
import { captchaService } from '../../services/captchaService.js';
import { DynamicCaptcha } from '../../components/common/DynamicCaptcha.js';
import { redis } from '../../lib/redisCache.js';

// ─── Rate-limiting constants ────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;       // 5 attempts per sliding window
const LOCKOUT_SECONDS = 300;  // 5-minute lockout

// ─── Component ───────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // rate-limiting state
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0); // seconds remaining

  // Dynamic CAPTCHA state
  const [challengeId, setChallengeId] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

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

  // ── Initialise rate-limit state from Redis store ─────────────────────────
  useEffect(() => {
    const status = rateLimitService.checkLimit('auth:login', email || 'client_global');
    if (status.isLocked) {
      setIsLocked(true);
      setLockCountdown(status.lockRemainingSeconds);
      setAttemptCount(status.currentAttempts);
    } else {
      setAttemptCount(status.currentAttempts);
    }
  }, [email]);

  // ── Countdown ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked || lockCountdown <= 0) return;
    const id = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsLocked(false);
          setAttemptCount(0);
          rateLimitService.resetLimit('auth:login', email || 'client_global');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isLocked, lockCountdown, email]);

  // ── Clear email/pass on page visit ─────────────────────────────────────────
  useEffect(() => {
    setEmail('');
    setPassword('');
    setPasswordTouched(false);
    setCaptchaInput('');
    setCaptchaError(false);
  }, [location.pathname, location.key]);

  // ── Auto-redirect if already authenticated ─────────────────────────────────
  const getDashboardPath = (userRole: UserRole): string =>
    userRole === 'administrator' ? '/admin/dashboard' : `/${userRole}/dashboard`;

  useEffect(() => {
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

  // ── Format mm:ss countdown ─────────────────────────────────────────────────
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Submit handler with rate limiting + CAPTCHA ────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Check Rate Limit
    const rateStatus = rateLimitService.checkLimit('auth:login', email || 'client_global');
    if (rateStatus.isLocked) {
      setIsLocked(true);
      setLockCountdown(rateStatus.lockRemainingSeconds);
      setError(`Account temporarily locked due to excessive failed attempts. Please wait ${formatCountdown(rateStatus.lockRemainingSeconds)}.`);
      return;
    }

    // 2. Validate password
    if (!password) {
      setPasswordTouched(true);
      setError('Please enter your security password.');
      return;
    }

    // 3. Validate CAPTCHA with Redis TTL
    if (captchaInput.trim() === '') {
      setPasswordTouched(true);
      setCaptchaError(true);
      setError('Please solve the security verification challenge before signing in.');
      return;
    }

    if (challengeId) {
      const validation = captchaService.validate(challengeId, captchaInput);
      if (!validation.isValid) {
        setPasswordTouched(true);
        setCaptchaError(true);
        setError(validation.error || 'Incorrect security verification answer. Please try again.');
        // Increment attempts on wrong captcha
        const updated = rateLimitService.recordAttempt('auth:login', email || 'client_global');
        if (updated.isLocked) {
          setIsLocked(true);
          setLockCountdown(updated.lockRemainingSeconds);
          setAttemptCount(updated.currentAttempts);
        } else {
          setAttemptCount(updated.currentAttempts);
        }
        return;
      }
    }

    // 4. Authenticate
    setLoading(true);
    const { error: err, role: resolvedRole } = await signIn(email, password);
    setLoading(false);

    if (err) {
      const updated = rateLimitService.recordAttempt('auth:login', email || 'client_global');
      if (updated.isLocked) {
        setIsLocked(true);
        setLockCountdown(updated.lockRemainingSeconds);
        setAttemptCount(updated.currentAttempts);
        setError(`Too many failed attempts. Account locked for ${Math.round(updated.lockRemainingSeconds / 60)} minutes.`);
      } else {
        setAttemptCount(updated.currentAttempts);
        const rem = updated.remainingAttempts;
        setError(
          rem > 0
            ? `Incorrect credentials. ${rem} attempt${rem > 1 ? 's' : ''} remaining before temporary lockout.`
            : 'Incorrect credentials.'
        );
      }
    } else {
      rateLimitService.resetLimit('auth:login', email || 'client_global');
      const targetRole = resolvedRole || role || 'administrator';
      handleRedirect(targetRole);
    }
  };

  const handleQuickFill = (roleEmail: string, rolePwd: string = 'Password123!') => {
    setEmail(roleEmail);
    setPassword(rolePwd);
    setPasswordTouched(true);

    // Retrieve active challenge answer from Redis for quick demo login
    if (challengeId) {
      const stored = redis.get<{ answer: string }>(`captcha:${challengeId}`);
      if (stored?.answer) {
        setCaptchaInput(stored.answer);
      }
    }
    setCaptchaError(false);
  };

  const showCaptcha = Boolean(password.length > 0 || passwordTouched) && !isLocked;

  // ─── Attempt indicator dots ────────────────────────────────────────────────
  const AttemptDots = () => (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < attemptCount ? 'bg-red-500 scale-110' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

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
            <div className="space-y-5">

              {/* Header + Attempt indicators */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-academic-serif text-2xl font-extrabold text-[#0F2747]">
                    Portal Sign In
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    Enter your registered institutional credentials to access your academic dashboard.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                    SSO v4.2
                  </span>
                  {attemptCount > 0 && !isLocked && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Attempts</span>
                      <AttemptDots />
                    </div>
                  )}
                </div>
              </div>

              {/* Safe Logout Notice */}
              {loggedOut && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>You have been safely signed out. Please enter your credentials to log in again.</span>
                </div>
              )}

              {/* ── LOCKOUT Banner ─────────────────────────────────────── */}
              {isLocked && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-[#991B1B] flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <Ban className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Account Access Temporarily Suspended</p>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        {MAX_ATTEMPTS} consecutive failed login attempts detected. Your access has been
                        blocked as an automated security measure.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-red-100 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
                      <Timer className="w-4 h-4" />
                      <span>Lockout expires in</span>
                    </div>
                    <span className="font-mono text-lg font-extrabold text-red-700 tracking-widest">
                      {formatCountdown(lockCountdown)}
                    </span>
                  </div>
                  <p className="text-[10px] text-red-500 text-center">
                    Contact <span className="font-semibold">support@university.edu</span> if this was not you.
                  </p>
                </div>
              )}

              {/* Error Alert (non-lockout) */}
              {error && !isLocked && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    attemptCount >= MAX_ATTEMPTS - 1
                      ? 'bg-orange-50 border-orange-300 text-orange-800'
                      : 'bg-red-50 border-red-200 text-[#DC2626]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Form (hidden during lockout) ───────────────────────── */}
              {!isLocked && (
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* Honeypot fields against bot autocomplete */}
                  <input type="text" name="fake_username" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly />
                  <input type="password" name="fake_password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly />

                  <div>
                    <label className="block text-xs font-bold text-[#0F2747] mb-1.5 uppercase tracking-wider">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="inst_email_field"
                        name="inst_email_field"
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLocked}
                        placeholder="name@university.edu"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-medium text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2747] focus:ring-2 focus:ring-[#0F2747]/20 pl-10 transition disabled:opacity-50"
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
                        id="inst_pwd_field"
                        name="inst_pwd_field"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (e.target.value) setPasswordTouched(true);
                        }}
                        required
                        disabled={isLocked}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-medium text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F2747] focus:ring-2 focus:ring-[#0F2747]/20 pl-10 pr-10 transition disabled:opacity-50"
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

                  {/* ── Dynamic Multi-Mode CAPTCHA with Redis TTL ────────── */}
                  {showCaptcha && (
                    <DynamicCaptcha
                      onChallengeChange={(id) => setChallengeId(id)}
                      value={captchaInput}
                      onChange={(val) => {
                        setCaptchaInput(val);
                        setCaptchaError(false);
                      }}
                      hasError={captchaError}
                    />
                  )}

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
                    disabled={loading || isLocked}
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
              )}

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
