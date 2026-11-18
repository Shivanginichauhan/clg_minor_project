import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Award,
  Bell,
  FileText,
  Shield,
  Layers,
  Clock,
  DoorOpen,
  UserCheck,
  UserPlus,
  User,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  CreditCard,
  Archive,
  TrendingUp,
  LifeBuoy,
  FolderDown,
  FileCheck,
  IndianRupee,
  Briefcase,
  Calendar,
  Database,
  Send,
  KeyRound
} from 'lucide-react';
import { UniversityCrest } from './UniversityCrest.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, profile } = useAuth();

  const getNavSections = (): NavSection[] => {
    switch (role) {
      case 'student':
        return [
          {
            title: 'ACADEMIC LIFE & COURSES',
            items: [
              { label: 'Student Console', path: '/student/dashboard', icon: LayoutDashboard },
              { label: 'Class Timetable & Schedule', path: '/student/timetable', icon: Clock, badge: 'Daily/Monthly' },
              { label: 'Assignments & Coursework', path: '/student/assignments', icon: FileText, badge: 'Active' },
              { label: 'Attendance Ledger', path: '/student/attendance', icon: CalendarCheck, badge: '75%' },
              { label: 'Course Enrollments', path: '/student/enrollments', icon: BookOpen },
              { label: 'Course Notes & Syllabus', path: '/student/materials', icon: FolderDown, badge: 'Notes' },
              { label: 'Degree Progress & What-If', path: '/student/degree-progress', icon: Layers, badge: 'CBCS' },
            ],
          },
          {
            title: 'EXAMINATIONS & EVALUATION',
            items: [
              { label: 'Apply for Examination', path: '/student/exam-apply', icon: FileText, badge: 'May 2026' },
              { label: 'Exam Hall Ticket & Dates', path: '/student/examinations', icon: ShieldCheck },
              { label: 'Grade Cards & Transcripts', path: '/student/results', icon: Award, badge: 'UGC' },
              { label: 'Performance Analytics', path: '/student/analytics', icon: TrendingUp, badge: 'Trends' },
            ],
          },
          {
            title: 'SERVICES & DOSSIER',
            items: [
              { label: 'Fee Status & Payments', path: '/student/fees', icon: CreditCard },
              { label: 'Scholarships & Grants', path: '/student/scholarships', icon: Award, badge: 'DBT' },
              { label: 'Consolidated My Requests', path: '/student/requests', icon: FileCheck, badge: 'Track' },
              { label: 'My Documents Vault', path: '/student/documents', icon: Archive },
              { label: 'Notifications Hub', path: '/student/notifications', icon: Bell },
              { label: 'Grievance & Helpdesk', path: '/student/grievance', icon: LifeBuoy },
              { label: 'Circular Notices', path: '/student/notices', icon: Bell },
              { label: 'Personal & Academic Dossier', path: '/student/profile', icon: User, badge: 'Smart ID' },
            ],
          },
        ];

      case 'faculty':
        return [
          {
            title: 'TEACHING & CLASSES',
            items: [
              { label: 'Faculty Console', path: '/faculty/dashboard', icon: LayoutDashboard },
              { label: 'Teaching Lecture Schedule', path: '/faculty/timetable', icon: Clock, badge: 'Live Roster' },
              { label: 'Assigned Teaching Subjects', path: '/faculty/subjects', icon: BookOpen },
              { label: 'Lesson Plan & Syllabus', path: '/faculty/lesson-plan', icon: Layers, badge: 'OBE' },
              { label: 'Course Study Materials', path: '/faculty/materials', icon: FolderDown, badge: 'Upload' },
              { label: 'Assignments & Grading', path: '/faculty/assignments', icon: FileText, badge: 'Assess' },
              { label: 'Lecture Attendance Register', path: '/faculty/attendance', icon: CalendarCheck },
              { label: 'Class Mentorship Cohort', path: '/faculty/mentorship', icon: Users, badge: 'Mentor' },
              { label: 'Announcements Center', path: '/faculty/announcements', icon: Bell, badge: 'Broadcast' },
            ],
          },
          {
            title: 'EVALUATION, OBE & DUTIES',
            items: [
              { label: 'Marks Entry Portal', path: '/faculty/marks', icon: FileSpreadsheet, badge: 'CIA' },
              { label: 'CO Attainment & OBE', path: '/faculty/co-attainment', icon: Award, badge: 'NBA' },
              { label: 'Question Paper Authoring', path: '/faculty/question-paper', icon: FileCheck, badge: 'CoE' },
              { label: 'Invigilation Duties', path: '/faculty/invigilation', icon: DoorOpen },
              { label: 'Workload & UGC Compliance', path: '/faculty/workload', icon: Clock, badge: 'UGC' },
              { label: 'Research & Publications', path: '/faculty/research', icon: Sparkles, badge: 'CAS' },
              { label: 'Accreditation Repository', path: '/faculty/accreditation', icon: ShieldCheck, badge: 'NAAC' },
              { label: 'Leave & Class Proxy', path: '/faculty/leave', icon: CalendarCheck, badge: 'CL/EL' },
              { label: 'Faculty Dossier', path: '/faculty/profile', icon: User },
            ],
          },
        ];

      case 'administrator':
        return [
          {
            title: 'EXAMINATION CONTROLLER',
            items: [
              { label: 'Admin Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
              { label: 'Exam Cycles & Master Timetable', path: '/admin/exams', icon: Clock },
              { label: 'Automated Seating Generator', path: '/admin/seating', icon: DoorOpen },
              { label: 'Marks Verification Desk', path: '/admin/marks-verify', icon: FileSpreadsheet, badge: 'CIA-II' },
              { label: 'Results Tabulation & Gazette', path: '/admin/results', icon: Award, badge: 'CBCS' },
              { label: 'Re-evaluation & Scrutiny', path: '/admin/revaluation', icon: FileSpreadsheet },
            ],
          },
          {
            title: 'ACADEMIC & INSTITUTIONAL REGISTRY',
            items: [
              { label: 'User Account Provisioning', path: '/admin/accounts', icon: UserPlus },
              { label: 'Students & Faculty Records', path: '/admin/users', icon: Users },
              { label: 'Departments & Programs', path: '/admin/academics', icon: GraduationCap },
              { label: 'Attendance & Cohorts', path: '/admin/attendance', icon: CalendarCheck },
              { label: 'Master Academic Calendar', path: '/admin/calendar', icon: Calendar, badge: 'UGC 90' },
              { label: 'Placements & Alumni Network', path: '/admin/placements', icon: Briefcase, badge: 'Career' },
              { label: 'NAAC / NBA Accreditation', path: '/admin/accreditation', icon: Award, badge: 'SSR' },
              { label: 'Library & Laboratory Assets', path: '/admin/library-assets', icon: BookOpen },
            ],
          },
          {
            title: 'FINANCE, SERVICES & COMMUNICATIONS',
            items: [
              { label: 'Fee & Revenue Management', path: '/admin/fees', icon: CreditCard, badge: 'Ledger' },
              { label: 'Grievance & Redressal Desk', path: '/admin/grievances', icon: LifeBuoy, badge: 'SLA' },
              { label: 'Omnichannel Dispatcher', path: '/admin/dispatcher', icon: Send, badge: 'Broadcast' },
              { label: 'Custom Report Builder', path: '/admin/reports', icon: FileText, badge: 'Ad-Hoc' },
            ],
          },
          {
            title: 'SYSTEM SECURITY & DATA RESILIENCY',
            items: [
              { label: 'Two-Person Dual Sign-off', path: '/admin/dual-approvals', icon: KeyRound, badge: '4-Eyes' },
              { label: 'Role & Permission Matrix', path: '/admin/roles', icon: ShieldCheck, badge: 'RBAC' },
              { label: 'Backup, Restore & Rollback', path: '/admin/backups', icon: Database, badge: 'Snapshot' },
              { label: 'Bulk CSV Data Importer', path: '/admin/bulk-import', icon: UploadCloud },
              { label: 'Notice Publisher', path: '/admin/notices', icon: Bell },
              { label: 'System Audit Ledger', path: '/admin/audit', icon: Shield, badge: 'SHA-256' },
              { label: 'Administrator Profile', path: '/admin/profile', icon: User },
            ],
          },
        ];

      case 'dean':
        return [
          {
            title: 'ACADEMIC COUNCIL OVERSIGHT',
            items: [
              { label: 'Dean Command Center', path: '/dean/dashboard', icon: LayoutDashboard },
              { label: 'Scholarship Sanctions Desk', path: '/dean/scholarships', icon: Award, badge: 'Statutory' },
              { label: 'Master Timetable Governance', path: '/dean/timetables', icon: Clock, badge: 'Audited' },
              { label: 'Exam Schedule Approvals', path: '/dean/exam-approvals', icon: ShieldCheck, badge: 'Required' },
              { label: 'Results Signoff & Gazette', path: '/dean/results-approval', icon: Award, badge: 'Statutory' },
              { label: 'Curriculum & Syllabus (BoS)', path: '/dean/curriculum', icon: BookOpen, badge: 'NEP 2020' },
              { label: 'Academic Calendar Governance', path: '/dean/academic-calendar', icon: Calendar },
            ],
          },
          {
            title: 'FACULTY & STUDENT AFFAIRS',
            items: [
              { label: 'Faculty Leave & CAS Appraisal', path: '/dean/faculty-leave', icon: Briefcase, badge: 'API Review' },
              { label: 'Student Grievance Ombudsman', path: '/dean/grievances', icon: LifeBuoy, badge: 'Escalated' },
              { label: 'Research & Faculty Performance', path: '/dean/research', icon: TrendingUp, badge: 'Scopus' },
              { label: 'Placement & Industry Board', path: '/dean/placements', icon: Users, badge: 'Corporate' },
            ],
          },
          {
            title: 'INSTITUTIONAL GOVERNANCE & AUDIT',
            items: [
              { label: 'Institutional Budget Pool', path: '/dean/budget', icon: IndianRupee, badge: 'FY 25-26' },
              { label: 'Accreditation & NAAC Radar', path: '/dean/compliance', icon: ShieldCheck, badge: 'A++' },
              { label: 'Institutional Reports', path: '/dean/reports', icon: FileText },
              { label: 'Official Circulars', path: '/dean/notices', icon: Bell },
              { label: 'Dean Statutory Audit Ledger', path: '/dean/audit-log', icon: Shield, badge: 'SHA-256' },
              { label: 'Dean Dossier', path: '/dean/profile', icon: User },
            ],
          },
        ];

      default:
        return [
          {
            title: 'PORTAL',
            items: [{ label: 'Sign In', path: '/login', icon: LayoutDashboard }],
          },
        ];
    }
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        id="ueams-sidebar"
        className={`fixed top-[58px] md:top-[85px] bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200/90 px-3.5 pt-4 pb-4 overflow-y-auto transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between shadow-xs ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          
          {/* Institutional Portal Subtitle Badge */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/40 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F2747]">
                {role ? `${role.toUpperCase()} CONSOLE` : 'ACADEMIC PORTAL'}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              v4.2
            </span>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-4">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 pt-1">
                  {section.title}
                </h4>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 768) onClose();
                        }}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#0F2747] to-[#1E3A8A] text-white shadow-xs border-l-[3px] border-amber-400 font-bold pl-2.5'
                              : 'text-slate-700 hover:text-[#0F2747] hover:bg-slate-100/90'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-700 group-[.bg-gradient-to-r]:bg-amber-400 group-[.bg-gradient-to-r]:text-[#0F2747]">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

        </div>

        {/* Institutional Assurance Badge at bottom */}
        <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <UniversityCrest size="sm" variant="navy" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-[#0F2747] leading-tight truncate">ITM University</p>
              <p className="text-[9px] text-[#64748B] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" />
                <span>UGC &bull; ISO 9001:2015</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
