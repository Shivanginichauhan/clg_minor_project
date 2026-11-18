import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { ShieldAlert, ArrowLeft, GraduationCap, LayoutDashboard } from 'lucide-react';
import { Footer } from '../../components/common/Footer.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const UnauthorizedPage: React.FC = () => {
  const { role, user, profile } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!role) return '/login';
    return `/${role}/dashboard`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col justify-between selection:bg-[#1E5AA8] selection:text-white">

      {/* Top Header */}
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

        {role && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Active Session:</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
              {role}
            </span>
          </div>
        )}
      </header>

      {/* Main Error View */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md text-center space-y-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
                403 — Access Denied
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F2747] tracking-tight">
                Restricted Resource
              </h1>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-xs mx-auto">
                You do not have permission to access this page. This module is restricted to authorized personnel according to institutional governance policies.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>

              <Link
                to={getDashboardPath()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            If you believe this is an error, please contact your university system administrator.
          </p>

        </div>
      </main>

      <Footer variant="auth" />
    </div>
  );
};
