import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { UserRole, Department, Program } from '../../types/database.types.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { splitFullName } from '../../utils/nameParser.js';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  Info,
  BookOpen,
  Award,
  Shield,
  Briefcase,
  IdCard,
  Hash
} from 'lucide-react';
import { Footer } from '../../components/common/Footer.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

interface RoleOption {
  id: UserRole;
  label: string;
  subLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    subLabel: 'Academic Portal',
    badge: 'Undergraduate / Postgraduate',
    icon: GraduationCap,
    description: 'Access exam timetables, hall tickets, attendance percentages, continuous assessment scores, and semester grade cards.',
    accentBg: 'bg-blue-50/80',
    accentBorder: 'border-blue-500',
    accentText: 'text-blue-700',
  },
  {
    id: 'faculty',
    label: 'Faculty / Teacher',
    subLabel: 'Teaching & Assessment',
    badge: 'Professor / Lecturer',
    icon: BookOpen,
    description: 'Manage allocated courses, record daily lecture attendance, enter internal assessment marks, and view invigilation duties.',
    accentBg: 'bg-emerald-50/80',
    accentBorder: 'border-emerald-500',
    accentText: 'text-emerald-700',
  },
  {
    id: 'dean',
    label: 'Dean',
    subLabel: 'Academic Affairs',
    badge: 'Statutory Authority',
    icon: Award,
    description: 'Review and approve examination schedules, manage moderation rules, and grant final sign-off for gazetted tabulation registers.',
    accentBg: 'bg-purple-50/80',
    accentBorder: 'border-purple-500',
    accentText: 'text-purple-700',
  },
  {
    id: 'administrator',
    label: 'Administrator',
    subLabel: 'Controller of Exams',
    badge: 'Institutional Administration',
    icon: Shield,
    description: 'Full administrative control over academic structure, user directory, exam cycles, seating plans, invigilation, and tabulation.',
    accentBg: 'bg-amber-50/80',
    accentBorder: 'border-amber-500',
    accentText: 'text-amber-700',
  },
];

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Role Selection State
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // Common Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Role-Specific Fields
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');

  // Department & Program Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    academicStructureService.getDepartments().then((depts) => {
      setDepartments(depts);
      if (depts.length > 0 && !departmentId) {
        setDepartmentId(depts[0].id);
      }
    });

    academicStructureService.getPrograms().then((progs) => {
      setPrograms(progs);
      if (progs.length > 0 && !programId) {
        setProgramId(progs[0].id);
      }
    });
  }, []);

  // Update default designation and ensure passwords are cleared when role changes
  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    if (selectedRole === 'faculty' && !designation) {
      setDesignation('Assistant Professor');
    } else if (selectedRole === 'dean' && !designation) {
      setDesignation('Dean of Academic Affairs');
    } else if (selectedRole === 'administrator' && !designation) {
      setDesignation('Controller of Examinations');
    }
  }, [selectedRole]);

  // Ensure passwords are clear on initial mount to defeat browser autofill from other accounts
  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
  }, []);

  const activeRoleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedName = splitFullName(fullName);
    if (!parsedName.fullName || parsedName.fullName.length < 2) {
      setError('Please provide your full legal name (minimum 2 characters).');
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8 || !hasUpper || !hasNumber || !hasSpecial) {
      setError('Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);

    const metadata: Record<string, string | undefined> = {
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      phone: phone || undefined,
      departmentId: departmentId || undefined,
      programId: programId || undefined,
      enrollmentNumber: enrollmentNumber || undefined,
      rollNumber: rollNumber || undefined,
      employeeId: employeeId || undefined,
      designation: designation || undefined,
      qualification: qualification || undefined,
    };

    const { error: err, needsEmailVerification, role: createdRole } = await signUp(
      email,
      password,
      parsedName.fullName,
      selectedRole,
      metadata
    );

    setLoading(false);

    if (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } else if (needsEmailVerification) {
      setNeedsVerification(true);
    } else {
      setSuccess(true);
      const targetRole = createdRole || selectedRole;
      const targetPath = targetRole === 'administrator' ? '/admin/dashboard' : `/${targetRole}/dashboard`;
      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col justify-between selection:bg-[#1E5AA8] selection:text-white">
      {/* Top University Header */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3">
          <UniversityCrest size="sm" variant="gold" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-academic-serif font-bold text-[#0F2747] text-base sm:text-lg tracking-tight block leading-tight">
                ITM University
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                Self-Registration
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] block font-medium">
              Statutory Examination &amp; Academic Governance Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B] hidden sm:inline">Already registered?</span>
          <Link
            to="/login"
            className="text-xs font-bold text-[#0F2747] hover:text-white bg-slate-100 hover:bg-[#0F2747] border border-slate-200 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Registration Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl card-3d bg-white border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E5AA8] text-xs font-semibold border border-blue-100">
              <Building2 className="w-4 h-4" />
              Institutional Self-Registration Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2747] tracking-tight">
              Create University Account
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto">
              Select your academic role below to register your institutional credentials for access to the university portal.
            </p>
          </div>

          {/* Role Selector Tabs (Grid of 4 roles) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0F2747] uppercase tracking-wider block">
              1. Select Your University Role:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id);
                      setError(null);
                    }}
                    className={`stat-box-3d card-3d-interactive relative p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${isSelected
                      ? `${role.accentBg} ${role.accentBorder} ring-2 ring-[#1E5AA8]/30 shadow-md scale-[1.02]`
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#0F2747] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#1E5AA8]" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-[#0F2747]' : 'text-slate-800'}`}>
                        {role.label}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{role.subLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Role Description Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-[#1E5AA8] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#0F2747]">
                  {activeRoleConfig.label} Access:
                </span>{' '}
                {activeRoleConfig.description}
              </div>
            </div>
          </div>

          {/* Verification Notification */}
          {needsVerification && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Confirmation Email Sent</p>
                <p>
                  Please verify your email address by clicking the activation link sent to <strong>{email}</strong>. Once confirmed, you can sign in directly to your {activeRoleConfig.label} portal.
                </p>
                <Link to="/login" className="inline-block mt-2 font-bold text-amber-800 underline">
                  Proceed to Sign In &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">{activeRoleConfig.label} Account Registered Successfully!</p>
                <p className="text-emerald-700">Redirecting to your {activeRoleConfig.label} dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!needsVerification && !success && (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Hidden honeypot traps to prevent aggressive browser autofill */}
              <input type="text" name="signup_trap_username" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="signup_trap_password" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              <label className="text-xs font-bold text-[#0F2747] uppercase tracking-wider block">
                2. Account &amp; Profile Details:
              </label>

              {/* Full Name & Institutional Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#0F2747] block">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    {fullName.trim() && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {splitFullName(fullName).firstName} {splitFullName(fullName).lastName ? `| Last: ${splitFullName(fullName).lastName}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="user_full_legal_name"
                      id="user_full_legal_name"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={selectedRole === 'student' ? 'e.g. Rahul Sharma' : 'e.g. Dr. Ramesh Gupta'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    />
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F2747] block">
                    Institutional Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRole === 'student'
                          ? 'student@university.edu'
                          : selectedRole === 'faculty'
                            ? 'faculty@university.edu'
                            : selectedRole === 'dean'
                              ? 'dean.academic@university.edu'
                              : 'admin@university.edu'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Phone & Role Specific Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F2747] block">Contact Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Role Specific ID Field */}
                {selectedRole === 'student' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0F2747] block">Enrollment / Registration No.</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={enrollmentNumber}
                        onChange={(e) => setEnrollmentNumber(e.target.value)}
                        placeholder="e.g. ENR-2025-014"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'faculty' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0F2747] block">Faculty Employee ID</label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. FAC-CSE-2025"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'dean' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0F2747] block">Office / Staff ID</label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. DEAN-ACAD-01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'administrator' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0F2747] block">Controller / Admin Staff Code</label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="e.g. ADM-COE-01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Department & Program Dropdown or Designation */}
              {(selectedRole === 'student' || selectedRole === 'faculty') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#0F2747] block">Academic Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    >
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="dept-cse">Computer Science &amp; Engineering</option>
                          <option value="dept-ece">Electronics &amp; Communication Engineering</option>
                          <option value="dept-me">Mechanical Engineering</option>
                          <option value="dept-mgmt">Management Studies &amp; Commerce</option>
                        </>
                      )}
                    </select>
                  </div>

                  {selectedRole === 'student' ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#0F2747] block">Degree Program</label>
                      <select
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      >
                        {programs.length > 0 ? (
                          programs.map((prog) => (
                            <option key={prog.id} value={prog.id}>
                              {prog.name} ({prog.code})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="prog-btech-cse">B.Tech Computer Science (4 Yrs)</option>
                            <option value="prog-btech-ece">B.Tech Electronics (4 Yrs)</option>
                            <option value="prog-mtech-cse">M.Tech AI &amp; Data Science (2 Yrs)</option>
                            <option value="prog-mba">Master of Business Administration (2 Yrs)</option>
                          </>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#0F2747] block">Academic Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Assistant Professor / Associate Professor"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                      />
                    </div>
                  )}
                </div>
              )}

              {(selectedRole === 'dean' || selectedRole === 'administrator') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F2747] block">Official Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder={
                      selectedRole === 'dean'
                        ? 'Dean of Academic Affairs'
                        : 'Controller of Examinations / Exam Superintendent'
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                  />
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F2747] block">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_account_registration_password"
                      id="new_account_registration_password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0F2747] block">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_account_registration_password"
                      id="confirm_account_registration_password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F2747] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5AA8] focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-3d-primary w-full py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register as {activeRoleConfig.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role-Based Access Control (RBAC) secured with Supabase Auth &amp; Row-Level Security
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
