import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Building2,
  Lock,
  RefreshCw,
  MoreVertical,
  KeyRound,
  Eye,
  Trash2,
  X,
  Check,
  Send,
  UserCheck
} from 'lucide-react';
import { Profile, UserRole, UserStatus, Department } from '../../types/database.types.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { auditService } from '../../services/auditService.js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.js';

// Initial sample accounts representing all institutional roles
const INITIAL_ACCOUNTS: Profile[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Rajesh Verma',
    email: 'admin@university.edu',
    role: 'administrator',
    phone: '+91 98765 67890',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T08:00:00.000Z',
    updated_at: '2026-01-10T12:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'Prof. K. R. Ramanathan',
    email: 'dean@university.edu',
    role: 'dean',
    phone: '+91 98765 99999',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2023-11-20T11:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Dr. Priya Nambiar',
    email: 'faculty@university.edu',
    role: 'faculty',
    phone: '+91 98765 12345',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-06-10T10:30:00.000Z',
    updated_at: '2026-02-15T09:30:00.000Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Aditya Sharma',
    email: 'student@university.edu',
    role: 'student',
    phone: '+91 98765 43210',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-01-15T09:00:00.000Z',
    updated_at: '2026-02-20T14:00:00.000Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    full_name: 'Dr. Ananya Sengupta',
    email: 'ananya.sengupta@university.edu',
    role: 'faculty',
    phone: '+91 98765 23456',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-07-01T09:00:00.000Z',
    updated_at: '2026-02-10T11:00:00.000Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    full_name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@university.edu',
    role: 'student',
    phone: '+91 98765 34567',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-01-18T10:00:00.000Z',
    updated_at: '2026-02-18T16:00:00.000Z',
  },
];

const ACCOUNTS_STORAGE_KEY = 'ueams_system_user_accounts';

export const AccountManagementPage: React.FC = () => {
  const { profile: currentAdmin } = useAuth();
  const [accounts, setAccounts] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showInviteFacultyModal, setShowInviteFacultyModal] = useState(false);
  const [showInviteDeanModal, setShowInviteDeanModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Profile | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for Faculty invite
  const [facultyForm, setFacultyForm] = useState({
    fullName: '',
    email: '',
    departmentId: '',
    employeeId: '',
    designation: 'Assistant Professor',
    phone: '',
    status: 'active' as UserStatus,
  });

  // Form states for Dean invite
  const [deanForm, setDeanForm] = useState({
    fullName: '',
    email: '',
    designation: 'Dean of Academic Affairs',
    phone: '',
    status: 'active' as UserStatus,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load accounts
  const loadAccounts = async () => {
    setLoading(true);
    let loaded: Profile[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          loaded = data as Profile[];
        }
      } catch (err) {
        console.warn('[ACCOUNTS] Failed to fetch from Supabase:', err);
      }
    }

    if (loaded.length === 0) {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        try {
          loaded = JSON.parse(stored);
        } catch {
          loaded = INITIAL_ACCOUNTS;
        }
      } else {
        loaded = INITIAL_ACCOUNTS;
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      }
    }

    const depts = await studentFacultyService.getDepartments();
    setDepartments(depts);
    if (depts.length > 0 && !facultyForm.departmentId) {
      setFacultyForm((prev) => ({ ...prev, departmentId: depts[0].id }));
    }

    setAccounts(loaded);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const saveAccountsState = (newAccounts: Profile[]) => {
    setAccounts(newAccounts);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts));
    
    // Sync into custom profiles mapping so signIn finds them immediately
    try {
      const customMap = JSON.parse(localStorage.getItem('ueams_custom_profiles') || '{}');
      newAccounts.forEach((acc) => {
        if (acc.email) {
          customMap[acc.email.toLowerCase().trim()] = acc;
        }
      });
      localStorage.setItem('ueams_custom_profiles', JSON.stringify(customMap));
    } catch (e) {
      console.warn('Error syncing custom profiles:', e);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.phone && acc.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchStatus = statusFilter === 'all' || acc.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [accounts, searchTerm, roleFilter, statusFilter]);

  // Account Counters
  const counts = useMemo(() => {
    return {
      total: accounts.length,
      students: accounts.filter((a) => a.role === 'student').length,
      faculty: accounts.filter((a) => a.role === 'faculty').length,
      deans: accounts.filter((a) => a.role === 'dean').length,
      admins: accounts.filter((a) => a.role === 'administrator').length,
      active: accounts.filter((a) => a.status === 'active').length,
      inactive: accounts.filter((a) => a.status === 'inactive' || a.status === 'suspended').length,
    };
  }, [accounts]);

  // Provision / Invite Faculty
  const handleProvisionFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyForm.fullName.trim() || !facultyForm.email.trim()) {
      showToast('Please provide faculty name and email address.', 'error');
      return;
    }

    setSubmitting(true);
    const newUid = crypto.randomUUID();
    const newProfile: Profile = {
      id: newUid,
      full_name: facultyForm.fullName.trim(),
      email: facultyForm.email.trim().toLowerCase(),
      role: 'faculty',
      phone: facultyForm.phone || undefined,
      status: facultyForm.status,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const tempPassword = `P@ss-${Math.random().toString(36).slice(-6)}${Math.floor(10 + Math.random() * 90)}!`;
        const { data: signUpData } = await supabase.auth.signUp({
          email: facultyForm.email.trim().toLowerCase(),
          password: tempPassword,
          options: {
            data: {
              full_name: facultyForm.fullName.trim(),
              role: 'faculty',
              must_change_password: true,
            },
          },
        });

        const authUserId = signUpData?.user?.id || newUid;
        newProfile.id = authUserId;

        await supabase.from('profiles').upsert([newProfile]);
        await supabase.from('faculty').insert([
          {
            id: crypto.randomUUID(),
            user_id: authUserId,
            employee_id: facultyForm.employeeId || `FAC-${Date.now().toString().slice(-4)}`,
            department_id: facultyForm.departmentId,
            designation: facultyForm.designation,
            specialization: 'General',
            status: facultyForm.status,
          },
        ]);
      } catch (err) {
        console.warn('[ACCOUNTS] Supabase insert warning:', err);
      }
    }

    // Save to local storage state
    const updated = [newProfile, ...accounts];
    saveAccountsState(updated);

    // Audit Logging
    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: newProfile.id,
      entity_name: newProfile.full_name,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator provisioned new Faculty account for ${newProfile.full_name} (${newProfile.email}) with designation ${facultyForm.designation}.`,
      severity: 'security',
    });

    setSubmitting(false);
    setShowInviteFacultyModal(false);
    setFacultyForm({
      fullName: '',
      email: '',
      departmentId: departments[0]?.id || '',
      employeeId: '',
      designation: 'Assistant Professor',
      phone: '',
      status: 'active',
    });
    showToast(`Faculty account provisioned successfully for ${newProfile.full_name}.`);
  };

  // Provision / Invite Dean
  const handleProvisionDean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deanForm.fullName.trim() || !deanForm.email.trim()) {
      showToast('Please provide Dean name and email address.', 'error');
      return;
    }

    setSubmitting(true);
    const newUid = crypto.randomUUID();
    const newProfile: Profile = {
      id: newUid,
      full_name: deanForm.fullName.trim(),
      email: deanForm.email.trim().toLowerCase(),
      role: 'dean',
      phone: deanForm.phone || undefined,
      status: deanForm.status,
      avatar_url: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const tempPassword = `P@ss-${Math.random().toString(36).slice(-6)}${Math.floor(10 + Math.random() * 90)}!`;
        const { data: signUpData } = await supabase.auth.signUp({
          email: deanForm.email.trim().toLowerCase(),
          password: tempPassword,
          options: {
            data: {
              full_name: deanForm.fullName.trim(),
              role: 'dean',
              must_change_password: true,
            },
          },
        });

        const authUserId = signUpData?.user?.id || newUid;
        newProfile.id = authUserId;

        await supabase.from('profiles').upsert([newProfile]);
      } catch (err) {
        console.warn('[ACCOUNTS] Supabase dean insert warning:', err);
      }
    }

    const updated = [newProfile, ...accounts];
    saveAccountsState(updated);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: newUid,
      entity_name: newProfile.full_name,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator provisioned new Executive Dean account for ${newProfile.full_name} (${newProfile.email}).`,
      severity: 'security',
    });

    setSubmitting(false);
    setShowInviteDeanModal(false);
    setDeanForm({
      fullName: '',
      email: '',
      designation: 'Dean of Academic Affairs',
      phone: '',
      status: 'active',
    });
    showToast(`Dean account provisioned successfully for ${newProfile.full_name}.`);
  };

    // Update Account Status (Active / Inactive / Suspended)
  const handleToggleStatus = async (account: Profile, newStatus: UserStatus) => {
    const isSelf =
      account.id === currentAdmin?.id ||
      account.email.toLowerCase() === currentAdmin?.email?.toLowerCase();
    if (isSelf) {
      showToast('You cannot alter the status of your currently active administrative session.', 'error');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', account.id);
      } catch (err) {
        console.warn('[ACCOUNTS] Supabase status update error:', err);
      }
    }

    const updated = accounts.map((a) =>
      a.id === account.id ? { ...a, status: newStatus, updated_at: new Date().toISOString() } : a
    );
    saveAccountsState(updated);

    auditService.logEvent({
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: account.id,
      entity_name: account.full_name,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator changed account status of ${account.full_name} (${account.email}) to ${newStatus.toUpperCase()}.`,
      severity: newStatus === 'active' ? 'info' : 'warning',
    });

    showToast(`Account status for ${account.full_name} updated to ${newStatus.toUpperCase()}.`);
  };

  // Role Promotion / Demotion Workflow
  const handleRoleChange = async (account: Profile, newRole: UserRole) => {
    const isSelf =
      account.id === currentAdmin?.id ||
      account.email.toLowerCase() === currentAdmin?.email?.toLowerCase();
    if (isSelf) {
      showToast('You cannot alter the role of your currently active administrative session.', 'error');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', account.id);
      } catch (err) {
        console.warn('[ACCOUNTS] Supabase role update error:', err);
      }
    }

    const updated = accounts.map((a) =>
      a.id === account.id ? { ...a, role: newRole, updated_at: new Date().toISOString() } : a
    );
    saveAccountsState(updated);

    auditService.logEvent({
      action: 'UPDATE',
      entity_type: 'user',
      entity_id: account.id,
      entity_name: account.full_name,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator transitioned statutory role for ${account.full_name} (${account.email}) to ${newRole.toUpperCase()}.`,
      severity: 'security',
    });

    showToast(`Role for ${account.full_name} updated to ${newRole.toUpperCase()}.`);
  };

  // MFA Enforcement Toggle
  const [mfaEnforced, setMfaEnforced] = useState<Record<string, boolean>>(() => {
    const raw = localStorage.getItem('ueams_mfa_enforced_accounts');
    return raw ? JSON.parse(raw) : { '33333333-3333-3333-3333-333333333333': true, '44444444-4444-4444-4444-444444444444': true };
  });

  const handleToggleMFA = (accountId: string, userName: string) => {
    const next = !mfaEnforced[accountId];
    const updated = { ...mfaEnforced, [accountId]: next };
    setMfaEnforced(updated);
    localStorage.setItem('ueams_mfa_enforced_accounts', JSON.stringify(updated));

    auditService.logEvent({
      action: 'UPDATE',
      entity_type: 'security',
      entity_id: accountId,
      entity_name: userName,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator ${next ? 'enforced' : 'waived'} statutory Multi-Factor Authentication (MFA) for ${userName}.`,
      severity: 'security',
    });

    showToast(`MFA requirement ${next ? 'enforced' : 'deactivated'} for ${userName}.`);
  };

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBulkAction = (action: 'suspend' | 'activate' | 'export') => {
    if (selectedIds.length === 0) {
      showToast('No accounts selected for bulk action.', 'error');
      return;
    }

    if (action === 'export') {
      const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
      const csv = [
        'ID,Full Name,Email,Role,Status,Phone,Created At',
        ...selectedAccounts.map((a) => `"${a.id}","${a.full_name}","${a.email}","${a.role}","${a.status}","${a.phone || ''}","${a.created_at}"`),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Selected_Accounts_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      showToast(`Exported ${selectedIds.length} accounts to CSV.`);
      return;
    }

    const newStatus: UserStatus = action === 'suspend' ? 'suspended' : 'active';
    const updated = accounts.map((a) => {
      if (selectedIds.includes(a.id)) {
        if (a.id === currentAdmin?.id || a.email.toLowerCase() === currentAdmin?.email?.toLowerCase()) {
          return a; // Skip self
        }
        return { ...a, status: newStatus, updated_at: new Date().toISOString() };
      }
      return a;
    });

    saveAccountsState(updated);
    showToast(`Bulk updated ${selectedIds.length} accounts to ${newStatus.toUpperCase()}.`);
    setSelectedIds([]);
  };

  // Trigger Password Reset Dispatch for a User
  const handleTriggerPasswordReset = async (account: Profile) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(account.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch (err) {
        console.warn('[ACCOUNTS] Password reset dispatch error:', err);
      }
    }

    auditService.logEvent({
      action: 'UPDATE',
      entity_type: 'security',
      entity_id: account.id,
      entity_name: account.full_name,
      user_id: currentAdmin?.id || 'admin-system',
      user_name: currentAdmin?.full_name || 'System Administrator',
      role: 'administrator',
      description: `Administrator dispatched institutional password reset link to ${account.email}.`,
      severity: 'warning',
    });

    showToast(`Password reset link dispatched to ${account.email}.`);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">Admin</span>;
      case 'dean':
        return <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">Dean</span>;
      case 'faculty':
        return <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">Faculty</span>;
      case 'student':
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">Student</span>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Inactive</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Suspended</span>;
    }
  };

  if (currentAdmin && currentAdmin.role !== 'administrator') {
    return (
      <div className="academic-card p-12 text-center text-rose-600 font-bold space-y-2">
        <ShieldCheck className="w-10 h-10 mx-auto text-rose-500" />
        <h2 className="text-lg">Administrative Access Restricted</h2>
        <p className="text-xs text-slate-500">Only authorized University Administrators can access the user provisioning ledger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-lg flex items-center gap-3 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Identity &amp; Access Governance
            </span>
            <span className="text-xs text-slate-500 font-medium">Administrator Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            User Account Management &amp; Provisioning
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl">
            Provision faculty and executive dean appointments, govern user account lifecycles, enforce security statuses, and inspect trusted identity profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowInviteFacultyModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Faculty</span>
          </button>

          <button
            onClick={() => setShowInviteDeanModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Provision Dean</span>
          </button>
        </div>
      </div>

      {/* Statistical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Total Accounts</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.total}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">{counts.active} Active</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-600">Students</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.students}</p>
          <p className="text-[10px] text-slate-400 mt-1">Self-Registered</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-sky-600">Faculty</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.faculty}</p>
          <p className="text-[10px] text-slate-400 mt-1">Admin Provisioned</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-700">Deans</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.deans}</p>
          <p className="text-[10px] text-slate-400 mt-1">Executive Access</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-purple-700">Administrators</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.admins}</p>
          <p className="text-[10px] text-slate-400 mt-1">System Authority</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <p className="text-[11px] font-semibold text-rose-600">Suspended / Inactive</p>
          <p className="text-xl font-bold text-[#0F2747] mt-1">{counts.inactive}</p>
          <p className="text-[10px] text-rose-500 mt-1">Blocked Access</p>
        </div>
      </div>

      {/* Account Directory & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/50">
          
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or UID..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder-slate-400 focus:outline-none focus:border-[#1E5AA8] pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
              >
                <option value="all">All Roles ({accounts.length})</option>
                <option value="student">Student ({counts.students})</option>
                <option value="faculty">Faculty ({counts.faculty})</option>
                <option value="dean">Dean ({counts.deans})</option>
                <option value="administrator">Administrator ({counts.admins})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active ({counts.active})</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <button
              onClick={loadAccounts}
              className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Refresh Accounts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Account Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-[#0F2747] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No user accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-[#0F2747]">
                          {acc.avatar_url ? (
                            <img src={acc.avatar_url} alt={acc.full_name} className="w-full h-full object-cover" />
                          ) : (
                            acc.full_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#0F2747]">{acc.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{acc.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getRoleBadge(acc.role)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(acc.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{acc.phone || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(acc.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setSelectedAccount(acc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="View Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleTriggerPasswordReset(acc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                          title="Send Password Reset Link"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        </button>

                        {acc.status === 'active' ? (
                          <button
                            onClick={() => handleToggleStatus(acc, 'suspended')}
                            className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(acc, 'active')}
                            className="px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Faculty Modal */}
      {showInviteFacultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative text-[#172033]">
            <button
              onClick={() => setShowInviteFacultyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Provision Faculty Account</h3>
                <p className="text-xs text-[#64748B]">Administrator appointment for academic teaching faculty</p>
              </div>
            </div>

            <form onSubmit={handleProvisionFaculty} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={facultyForm.fullName}
                  onChange={(e) => setFacultyForm({ ...facultyForm, fullName: e.target.value })}
                  required
                  placeholder="e.g. Dr. Rajeshwari Sundaram"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    required
                    placeholder="r.sundaram@university.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={facultyForm.employeeId}
                    onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                    placeholder="FAC-2026-089"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Assigned Department</label>
                  <select
                    value={facultyForm.departmentId}
                    onChange={(e) => setFacultyForm({ ...facultyForm, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Academic Designation</label>
                  <select
                    value={facultyForm.designation}
                    onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department">Head of Department (HOD)</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={facultyForm.phone}
                    onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Account Status</label>
                  <select
                    value={facultyForm.status}
                    onChange={(e) => setFacultyForm({ ...facultyForm, status: e.target.value as UserStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteFacultyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submitting ? 'Provisioning...' : 'Provision Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Dean Modal */}
      {showInviteDeanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative text-[#172033]">
            <button
              onClick={() => setShowInviteDeanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Provision Executive Dean Account</h3>
                <p className="text-xs text-[#64748B]">Assign academic governance and examination oversight authority</p>
              </div>
            </div>

            <form onSubmit={handleProvisionDean} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={deanForm.fullName}
                  onChange={(e) => setDeanForm({ ...deanForm, fullName: e.target.value })}
                  required
                  placeholder="e.g. Prof. Arvind Subramaniam"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  value={deanForm.email}
                  onChange={(e) => setDeanForm({ ...deanForm, email: e.target.value })}
                  required
                  placeholder="dean.academics@university.edu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Executive Title</label>
                  <select
                    value={deanForm.designation}
                    onChange={(e) => setDeanForm({ ...deanForm, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="Dean of Academic Affairs">Dean of Academic Affairs</option>
                    <option value="Dean of Examinations">Dean of Examinations</option>
                    <option value="Dean of Student Welfare">Dean of Student Welfare</option>
                    <option value="Dean of Engineering & Technology">Dean of Engineering &amp; Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={deanForm.phone}
                    onChange={(e) => setDeanForm({ ...deanForm, phone: e.target.value })}
                    placeholder="+91 98765 99999"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteDeanModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Provisioning...' : 'Provision Dean Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Dossier Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-[#172033]">
            <button
              onClick={() => setSelectedAccount(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-lg text-[#0F2747]">
                {selectedAccount.avatar_url ? (
                  <img src={selectedAccount.avatar_url} alt={selectedAccount.full_name} className="w-full h-full object-cover" />
                ) : (
                  selectedAccount.full_name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">{selectedAccount.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(selectedAccount.role)}
                  {getStatusBadge(selectedAccount.status)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-semibold text-slate-800">{selectedAccount.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phone Contact:</span>
                <span className="text-slate-800">{selectedAccount.phone || 'Not registered'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Unique Identity UID:</span>
                <span className="font-mono text-[11px] text-slate-600">{selectedAccount.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Enrolled:</span>
                <span className="text-slate-800">{new Date(selectedAccount.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
