import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  GraduationCap,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Building2,
  Timer,
  Ban
} from 'lucide-react';
import { Footer } from '../../components/common/Footer.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { rateLimitService } from '../../services/rateLimitService.js';
import { captchaService } from '../../services/captchaService.js';
import { DynamicCaptcha } from '../../components/common/DynamicCaptcha.js';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Dynamic CAPTCHA & Rate Limiting state
  const [challengeId, setChallengeId] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Check Rate Limit
    const rateStatus = rateLimitService.checkLimit('auth:forgot-password', email || 'client_global');
    if (rateStatus.isLocked) {
      setError(`Password reset requests temporarily suspended due to rate limiting. Please retry in ${rateStatus.lockRemainingSeconds} seconds.`);
      return;
    }

    // 2. Validate CAPTCHA with Redis TTL
    if (challengeId) {
      const validation = captchaService.validate(challengeId, captchaInput);
      if (!validation.isValid) {
        setCaptchaError(true);
        setError(validation.error || 'Incorrect security verification challenge answer.');
        rateLimitService.recordAttempt('auth:forgot-password', email || 'client_global');
        return;
      }
    }

    setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);

    if (err) {
      rateLimitService.recordAttempt('auth:forgot-password', email || 'client_global');
      setError(err.message || 'Unable to process password reset request. Please check your email address.');
    } else {
      rateLimitService.resetLimit('auth:forgot-password', email || 'client_global');
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col justify-between selection:bg-[#1E5AA8] selection:text-white">

      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3">
          <UniversityCrest size="sm" variant="gold" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-academic-serif font-bold text-base tracking-tight text-[#0F2747]">ITM University</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                PORTAL
              </span>
            </div>
            <p className="text-[10px] text-[#64748B]">University Examination &amp; Academic Management System</p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Credential Recovery Service</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center mx-auto shadow-2xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#0F2747]">Forgot Password</h1>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                Enter your institutional email address and we will dispatch a secure password reset link to your inbox.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submitted State */}
            {submitted ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reset Link Dispatched</span>
                  </div>
                  <p className="leading-relaxed">
                    A password recovery link has been sent to <span className="font-semibold">{email}</span>. Please check your inbox and follow the instructions to set your new password.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Institutional Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="e.g. student@university.edu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] pl-10"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Dynamic CAPTCHA with Redis TTL */}
                <DynamicCaptcha
                  onChallengeChange={(id) => setChallengeId(id)}
                  value={captchaInput}
                  onChange={(val) => {
                    setCaptchaInput(val);
                    setCaptchaError(false);
                  }}
                  hasError={captchaError}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Dispatching Reset Link...' : 'Send Password Reset Link'}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5AA8] hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>

      <Footer variant="auth" />
    </div>
  );
};
