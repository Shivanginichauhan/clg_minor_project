export type LeaveType = 'CL' | 'EL' | 'ML' | 'OD' | 'Sabbatical';

export interface LeaveBalance {
  type: LeaveType;
  title: string;
  total: number;
  availed: number;
  remaining: number;
  color: string;
}

export interface LeaveApplication {
  id: string;
  faculty_id: string;
  faculty_name: string;
  department: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending_hod' | 'approved_dean' | 'rejected' | 'cancelled';
  applied_at: string;
  proxy_arranged: boolean;
  proxy_details?: string;
  hod_remarks?: string;
}

const STORAGE_KEY = 'ueams_faculty_leave_applications';

const INITIAL_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'leave-app-001',
    faculty_id: 'fac-001',
    faculty_name: 'Dr. Priya Nambiar',
    department: 'Department of Computer Science & Engineering',
    leave_type: 'OD',
    start_date: '2026-05-12',
    end_date: '2026-05-13',
    total_days: 2,
    reason: 'Presenting research paper on Microservices Consensus at IEEE ICAC 2026 conference',
    status: 'approved_dean',
    applied_at: '2026-04-28T10:00:00.000Z',
    proxy_arranged: true,
    proxy_details: 'Prof. Rajesh Sharma taking Period 2 & 4 classes',
    hod_remarks: 'Recommended for Dean statutory sanction. Class substitution verified.',
  },
  {
    id: 'leave-app-002',
    faculty_id: 'fac-001',
    faculty_name: 'Dr. Priya Nambiar',
    department: 'Department of Computer Science & Engineering',
    leave_type: 'CL',
    start_date: '2026-05-20',
    end_date: '2026-05-20',
    total_days: 1,
    reason: 'Personal family engagement',
    status: 'pending_hod',
    applied_at: '2026-05-02T09:30:00.000Z',
    proxy_arranged: true,
    proxy_details: 'Dr. Ananya Sen taking Period 3 lab session',
  },
];

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export const facultyLeaveService = {
  getBalances(facultyId: string): LeaveBalance[] {
    const apps = this.getApplications(facultyId).filter((a) => a.status === 'approved_dean');
    const availedCL = apps.filter((a) => a.leave_type === 'CL').reduce((s, a) => s + a.total_days, 0);
    const availedEL = apps.filter((a) => a.leave_type === 'EL').reduce((s, a) => s + a.total_days, 0);
    const availedML = apps.filter((a) => a.leave_type === 'ML').reduce((s, a) => s + a.total_days, 0);
    const availedOD = apps.filter((a) => a.leave_type === 'OD').reduce((s, a) => s + a.total_days, 0);

    return [
      { type: 'CL', title: 'Casual Leave (CL)', total: 12, availed: availedCL, remaining: Math.max(0, 12 - availedCL), color: 'emerald' },
      { type: 'EL', title: 'Earned Leave (EL)', total: 15, availed: availedEL, remaining: Math.max(0, 15 - availedEL), color: 'blue' },
      { type: 'ML', title: 'Medical Leave (ML)', total: 10, availed: availedML, remaining: Math.max(0, 10 - availedML), color: 'rose' },
      { type: 'OD', title: 'On Duty / Duty Leave (OD)', total: 15, availed: availedOD, remaining: Math.max(0, 15 - availedOD), color: 'purple' },
    ];
  },

  getApplications(facultyId?: string): LeaveApplication[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: LeaveApplication[] = raw ? JSON.parse(raw) : INITIAL_APPLICATIONS;
    if (facultyId) {
      list = list.filter((a) => a.faculty_id === facultyId);
    }
    return list;
  },

  async applyLeave(payload: Omit<LeaveApplication, 'id' | 'applied_at' | 'status'>): Promise<LeaveApplication> {
    const current = this.getApplications();
    const newApp: LeaveApplication = {
      ...payload,
      id: `leave-app-${Date.now()}`,
      status: 'pending_hod',
      applied_at: new Date().toISOString(),
    };
    const updated = [newApp, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('faculty_leaves').insert([newApp]);
      } catch (err) {
        console.warn('[FACULTY_LEAVE] Supabase insert warning:', err);
      }
    }

    return newApp;
  },

  async updateApplicationStatus(id: string, status: LeaveApplication['status'], remarks?: string): Promise<void> {
    const current = this.getApplications();
    const updated = current.map((a) =>
      a.id === id ? { ...a, status, ...(remarks && { hod_remarks: remarks }) } : a
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('faculty_leaves').update({ status, ...(remarks && { hod_remarks: remarks }) }).eq('id', id);
      } catch (err) {
        console.warn('[FACULTY_LEAVE] Supabase update warning:', err);
      }
    }
  },

  cancelApplication(id: string): void {
    const current = this.getApplications();
    const updated = current.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
};
