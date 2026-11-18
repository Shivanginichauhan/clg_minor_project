import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  LogOut,
  User,
  KeyRound,
  ChevronDown,
  Menu,
  X,
  Bell,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
  Building
} from 'lucide-react';
import { ProfileModal } from '../auth/ProfileModal.js';
import { ChangePasswordModal } from '../auth/ChangePasswordModal.js';
import { UniversityCrest } from './UniversityCrest.js';
import { ThemeToggle } from './ThemeToggle.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { profile, role, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) + ' • ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true, state: { loggedOut: true, clearCredentials: true } });
  };

  const getRoleBadgeStyle = (userRole?: string | null) => {
    switch (userRole) {
      case 'administrator':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'dean':
        return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
      case 'faculty':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'student':
      default:
        return 'bg-blue-50 text-[#1E5AA8] border-blue-200';
    }
  };

  // Human-readable path name for breadcrumbs
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Executive Dashboard';
    if (path.includes('/users') || path.includes('/students') || path.includes('/faculty')) return 'Student & Faculty Dossier';
    if (path.includes('/academics') || path.includes('/academic-structure')) return 'Curriculum & Credit Framework';
    if (path.includes('/attendance')) return 'Attendance Governance & Cohorts';
    if (path.includes('/enrollments')) return 'Course Enrollments';
    if (path.includes('/subjects')) return 'Teaching Allocations';
    if (path.includes('/exams') || path.includes('/exam-approvals')) return 'Examination Governance';
    if (path.includes('/results')) return 'Result Tabulation & Gazette';
    if (path.includes('/notices')) return 'University Circulars';
    if (path.includes('/audit')) return 'Institutional Audit Ledger';
    if (path.includes('/accounts')) return 'Account Provisioning';
    return 'Examination Portal';
  };

  return (
    <>
      <header
        id="ueams-global-header"
        className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs"
      >
        {/* Top Institutional Strip */}
        <div className="bg-[#071326] text-slate-300 text-[11px] px-4 sm:px-6 lg:px-8 xl:px-10 py-1 hidden md:flex items-center justify-between border-b border-slate-800/60 font-medium w-full">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide uppercase text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>NAAC Accredited Grade A++ &bull; UGC Autonomous</span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300 font-sans">ITM University Statutory Examination System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{currentTime || 'Synchronized Server Time'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Portal Active &bull; SSL Secured</span>
            </span>
          </div>
        </div>

        {/* Main Navbar: Left and Right Corner Distribution */}
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 flex items-center justify-between gap-4">
          
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                id="sidebar-toggle-btn"
                type="button"
                aria-label="Toggle Navigation Menu"
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition cursor-pointer"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <UniversityCrest size="md" variant="gold" className="transition-transform group-hover:scale-105" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-academic-serif text-base sm:text-lg font-bold tracking-tight text-[#0F2747] leading-none">
                    ITM University
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                    UEAMS
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] font-medium mt-0.5 hidden sm:block">
                  Office of the Controller of Examinations &amp; Academic Affairs
                </p>
              </div>
            </Link>

            {/* Breadcrumb divider */}
            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 text-xs text-slate-500">
              <span className="text-slate-400 capitalize font-medium">{role || 'Academic'} Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-[#0F2747]">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Right Section: Session Pill + Circulars + User Profile */}
          <div className="flex items-center gap-3">
            {/* Active Academic Session Badge */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[#64748B] font-medium">Session:</span>
              <strong className="text-[#0F2747] font-bold">Even Sem 2026</strong>
            </div>

            {/* Dark / Light Theme Mode Toggle */}
            <ThemeToggle />

            {/* Notice / Circulars Shortcut */}
            <Link
              to={role ? `/${role}/notices` : '/login'}
              title="Official Circulars & Notices"
              className="p-2 rounded-xl text-slate-600 hover:text-[#0F2747] hover:bg-slate-100 border border-slate-200/80 transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
            </Link>

            {profile ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/70 hover:border-slate-300 transition cursor-pointer bg-white"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0F2747] border border-slate-200 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      profile.full_name.charAt(0)
                    )}
                  </div>

                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-[#0F2747] leading-tight flex items-center gap-1.5">
                      <span>{profile.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${getRoleBadgeStyle(role)}`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1 bg-slate-50/70 rounded-xl">
                        <p className="text-xs font-bold text-[#0F2747]">{profile.full_name}</p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">{profile.email}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getRoleBadgeStyle(role)}`}>
                            {role} Account
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0F2747] hover:bg-slate-100 transition text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#1E5AA8]" />
                        <span>My Institutional Dossier</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0F2747] hover:bg-slate-100 transition text-left cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Security &amp; Password</span>
                      </button>


                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out of Portal</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
              >
                <span>Portal Login</span>
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
