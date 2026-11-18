import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface ClearanceStage {
  id: 'accounts' | 'library' | 'attendance' | 'mentor' | 'academic_standing';
  title: string;
  department: string;
  status: 'cleared' | 'pending' | 'rejected';
  details: string;
  actionRequired?: string;
  clearedAt?: string;
  officer?: string;
}

export interface StudentClearanceRecord {
  studentId: string;
  canApplyForExam: boolean;
  overallStatus: 'cleared' | 'action_required';
  stages: ClearanceStage[];
  attendancePercentage: number;
  mentorApproval: boolean;
  noDuesCleared: boolean;
  failedStagesCount: number;
  pendingReasons: string[];
  nocReference: string;
  clearedDate?: string;
}

const STORAGE_KEY = 'ueams_student_clearance_status';

export const defaultClearedState: StudentClearanceRecord = {
  studentId: 'stu-001',
  canApplyForExam: true,
  overallStatus: 'cleared',
  attendancePercentage: 88,
  mentorApproval: true,
  noDuesCleared: true,
  failedStagesCount: 0,
  pendingReasons: [],
  nocReference: 'NOC-REG-2026-MCA-0819',
  clearedDate: '2026-03-28T11:40:00Z',
  stages: [
    {
      id: 'accounts',
      title: 'Tuition & Semester Accounts No-Dues',
      department: 'Finance & Accounts Division',
      status: 'cleared',
      details: 'All academic term dues, lab fees & development fund cleared (Receipt Ref: REC-2026-8812).',
      clearedAt: '28 Mar 2026',
      officer: 'Finance Officer (Accounts Desk)',
    },
    {
      id: 'library',
      title: 'Central University Library Clearance',
      department: 'University Central Library',
      status: 'cleared',
      details: 'Zero book overdue; all borrowed reference books returned. No fine pending.',
      clearedAt: '27 Mar 2026',
      officer: 'Chief Librarian',
    },
    {
      id: 'attendance',
      title: 'Statutory Class Attendance Benchmark',
      department: 'Department Academic Council',
      status: 'cleared',
      details: 'Current attendance is 88.0% (Exceeds UGC-CBCS minimum statutory 75.0% threshold).',
      clearedAt: '30 Mar 2026',
      officer: 'Head of Department',
    },
    {
      id: 'mentor',
      title: 'Faculty Mentor Attendance & Conduct Clearance',
      department: 'Student Mentorship Directorate',
      status: 'cleared',
      details: 'Faculty Mentor Dr. Vikram Rao reviewed and signed off conduct & academic eligibility.',
      clearedAt: '29 Mar 2026',
      officer: 'Dr. Vikram Rao (Faculty Mentor)',
    },
    {
      id: 'academic_standing',
      title: 'Matriculation & Enrolled Semester Standing',
      department: 'Office of the Registrar',
      status: 'cleared',
      details: 'Active regular matriculated candidate for MCA Semester 2 (Term 2025-26).',
      clearedAt: '26 Mar 2026',
      officer: 'Deputy Registrar (Academics)',
    },
  ],
};

export const defaultBlockedState: StudentClearanceRecord = {
  studentId: 'stu-001',
  canApplyForExam: false,
  overallStatus: 'action_required',
  attendancePercentage: 68,
  mentorApproval: false,
  noDuesCleared: false,
  failedStagesCount: 2,
  pendingReasons: [
    'Finance & Accounts: Semester Lab & Activity fee pending (₹1,500)',
    'Class Attendance: 68.0% is below the mandatory 75.0% benchmark; Mentor Condonation approval required',
  ],
  nocReference: 'NOC-PENDING-ACCOUNTS-ATTENDANCE',
  stages: [
    {
      id: 'accounts',
      title: 'Tuition & Semester Accounts No-Dues',
      department: 'Finance & Accounts Division',
      status: 'pending',
      details: 'Lab & Activity fee of ₹1,500 is unpaid for Term 2025-26.',
      actionRequired: 'Pay pending ₹1,500 online or visit Accounts Counter Block-A before 30 April.',
      officer: 'Finance Officer (Accounts Desk)',
    },
    {
      id: 'library',
      title: 'Central University Library Clearance',
      department: 'University Central Library',
      status: 'cleared',
      details: 'All library books returned and catalog verified. No dues pending.',
      clearedAt: '27 Mar 2026',
      officer: 'Chief Librarian',
    },
    {
      id: 'attendance',
      title: 'Statutory Class Attendance Benchmark',
      department: 'Department Academic Council',
      status: 'pending',
      details: 'Current attendance is 68.0% (Mandatory minimum required is 75.0%).',
      actionRequired: 'Submit attendance condonation appeal on medical/extracurricular grounds to Faculty Mentor.',
      officer: 'Head of Department',
    },
    {
      id: 'mentor',
      title: 'Faculty Mentor Attendance & Conduct Clearance',
      department: 'Student Mentorship Directorate',
      status: 'pending',
      details: 'Pending mentor sign-off due to attendance shortage (<75%).',
      actionRequired: 'Meet Mentor Dr. Vikram Rao for condonation endorsement.',
      officer: 'Dr. Vikram Rao (Faculty Mentor)',
    },
    {
      id: 'academic_standing',
      title: 'Matriculation & Enrolled Semester Standing',
      department: 'Office of the Registrar',
      status: 'cleared',
      details: 'Active regular matriculated candidate for MCA Semester 2.',
      clearedAt: '26 Mar 2026',
      officer: 'Deputy Registrar (Academics)',
    },
  ],
};

class StudentClearanceService {
  private getStored(studentId: string): StudentClearanceRecord {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${studentId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse stored clearance:', e);
    }
    return defaultClearedState;
  }

  private save(studentId: string, record: StudentClearanceRecord): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${studentId}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to save clearance record:', e);
    }

    if (isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('student_clearances')
          .upsert({
            student_id: studentId,
            semester_id: 'sem-mca-2',
            accounts_cleared: record.noDuesCleared,
            library_cleared: record.noDuesCleared,
            attendance_percentage: record.attendancePercentage,
            attendance_cleared: record.attendancePercentage >= 75,
            mentor_approval: record.mentorApproval,
            can_apply_for_exam: record.canApplyForExam,
            overall_status: record.overallStatus,
            noc_reference: record.nocReference,
            cleared_date: record.clearedDate,
          })
      )
        .then(() => {})
        .catch((err: any) => console.warn('[CLEARANCE] Supabase sync:', err));
    }
  }

  async getStudentClearance(studentId: string): Promise<StudentClearanceRecord> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('student_clearances')
          .select('*')
          .eq('student_id', studentId)
          .maybeSingle();

        if (!error && data) {
          const isCleared = data.can_apply_for_exam;
          return {
            studentId,
            canApplyForExam: isCleared,
            overallStatus: data.overall_status,
            attendancePercentage: data.attendance_percentage,
            mentorApproval: data.mentor_approval,
            noDuesCleared: data.accounts_cleared && data.library_cleared,
            failedStagesCount: isCleared ? 0 : 2,
            pendingReasons: isCleared ? [] : ['Statutory clearance verification action required.'],
            nocReference: data.noc_reference || 'NOC-REG-2026-MCA-0819',
            clearedDate: data.cleared_date,
            stages: defaultClearedState.stages,
          };
        }
      } catch (err) {
        console.warn('[CLEARANCE] Supabase query fallback:', err);
      }
    }
    return this.getStored(studentId);
  }

  async toggleDemoClearance(studentId: string, forceTarget?: 'cleared' | 'blocked'): Promise<StudentClearanceRecord> {
    const current = this.getStored(studentId);
    let updated: StudentClearanceRecord;
    if (forceTarget === 'cleared' || (!forceTarget && !current.canApplyForExam)) {
      updated = { ...defaultClearedState, studentId };
    } else {
      updated = { ...defaultBlockedState, studentId };
    }
    this.save(studentId, updated);
    return updated;
  }

  async clearDues(studentId: string, stageId: 'accounts' | 'library'): Promise<StudentClearanceRecord> {
    const current = this.getStored(studentId);
    const updatedStages = current.stages.map((st) =>
      st.id === stageId
        ? {
            ...st,
            status: 'cleared' as const,
            details: 'Cleared by department administrator via digital verification.',
            clearedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            actionRequired: undefined,
          }
        : st
    );

    const pendingStages = updatedStages.filter((s) => s.status === 'pending');
    const noDuesOk = !updatedStages.some((s) => (s.id === 'accounts' || s.id === 'library') && s.status === 'pending');
    const attOk = !updatedStages.some((s) => (s.id === 'attendance' || s.id === 'mentor') && s.status === 'pending');
    const canApply = noDuesOk && attOk;

    const updated: StudentClearanceRecord = {
      ...current,
      stages: updatedStages,
      noDuesCleared: noDuesOk,
      canApplyForExam: canApply,
      overallStatus: canApply ? 'cleared' : 'action_required',
      failedStagesCount: pendingStages.length,
      pendingReasons: pendingStages.map((s) => `${s.department}: ${s.actionRequired || s.details}`),
    };

    this.save(studentId, updated);
    return updated;
  }

  async approveMentorClearance(studentId: string): Promise<StudentClearanceRecord> {
    const current = this.getStored(studentId);
    const updatedStages = current.stages.map((st) => {
      if (st.id === 'attendance' || st.id === 'mentor') {
        return {
          ...st,
          status: 'cleared' as const,
          details: 'Attendance condonation granted & endorsed by Faculty Mentor Dr. Vikram Rao on special academic review.',
          clearedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          actionRequired: undefined,
        };
      }
      return st;
    });

    const pendingStages = updatedStages.filter((s) => s.status === 'pending');
    const noDuesOk = !updatedStages.some((s) => (s.id === 'accounts' || s.id === 'library') && s.status === 'pending');
    const canApply = noDuesOk;

    const updated: StudentClearanceRecord = {
      ...current,
      mentorApproval: true,
      stages: updatedStages,
      canApplyForExam: canApply,
      overallStatus: canApply ? 'cleared' : 'action_required',
      failedStagesCount: pendingStages.length,
      pendingReasons: pendingStages.map((s) => `${s.department}: ${s.actionRequired || s.details}`),
    };

    this.save(studentId, updated);
    return updated;
  }
}

export const studentClearanceService = new StudentClearanceService();
