import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { Home, ArrowLeft } from 'lucide-react';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const NotFoundPage: React.FC = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (!user || !role) return '/login';
    const map: Record<string, string> = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      administrator: '/admin/dashboard',
      dean: '/dean/dashboard',
    };
    return map[role] ?? '/login';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 font-sans antialiased overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <UniversityCrest size="md" variant="gold" />
        </div>

        <div className="relative mb-4">
          <p
            className="text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{ WebkitTextStroke: '2px #CBD5E1', color: 'transparent' }}
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl border border-slate-200 shadow-lg">
              <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">Page Not Found</p>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0F2747] mb-3 tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          The page you&apos;re looking for may have been moved, deleted, or the URL may be incorrect.
          Please check the address and try again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to={user ? getDashboardLink() : '/'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F2747] to-[#1E5AA8] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <Home className="w-4 h-4" />
            {user ? 'Go to Dashboard' : 'Go to Homepage'}
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-[11px] text-slate-400 font-medium">
            ITM University &bull; Office of the Controller of Examinations &bull; UEAMS v1.0
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Need help?{' '}
            <a href="tel:+910112874500" className="text-[#1E5AA8] font-semibold hover:underline">
              +91 (011) 2874-5500
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
