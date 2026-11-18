import { auditService } from './auditService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface ExamRegistrationPaper {
  code: string;
  name: string;
  credits: number;
  type: 'regular' | 'backlog' | 'improvement';
  fee: number;
}

export interface ExamRegistrationApplication {
  id: string;
  application_no: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  enrollment_number: string;
  department_name: string;
  program_name: string;
  semester_number: number;
  academic_session: string;
  examination_name: string;
  candidate_type?: 'regular' | 'ex_student' | 'improvement';
  email?: string;
  phone?: string;
  guardian_name?: string;
  address?: string;
  category?: string;
  regular_papers: ExamRegistrationPaper[];
  backlog_papers: ExamRegistrationPaper[];
  total_papers_count: number;
  total_credits: number;
  examination_fee: number;
  backlog_fee: number;
  marksheet_fee: number;
  total_amount_paid: number;
  payment_status: 'paid' | 'pending';
  payment_transaction_id: string;
  attendance_percentage: number;
  is_eligible: boolean;
  approval_status: 'approved' | 'pending_dean_review' | 'rejected';
  admit_card_available: boolean;
  exam_center: string;
  submitted_at: string;
}

const STORAGE_KEY_EXAM_APPS = 'ueams_exam_registration_apps';

export const initialExamRegistrations: ExamRegistrationApplication[] = [
  {
    id: 'exam-reg-001',
    application_no: 'EXAM-REG-2026-MCA-089',
    student_id: 'stu-001',
    student_name: 'Rahul Sharma',
    roll_number: '2025-MCA-042',
    enrollment_number: 'ENR-2025-MCA-001',
    department_name: 'Computer Science & Engineering',
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    academic_session: 'Academic Year 2025 - 2026',
    examination_name: 'End-Semester Theory & Practical Examinations May 2026',
    regular_papers: [
      { code: 'MCA-201', name: 'Advanced Database Systems & Distributed NoSQL', credits: 4, type: 'regular', fee: 350 },
      { code: 'MCA-202', name: 'Cloud Architecture & Distributed Microservices', credits: 4, type: 'regular', fee: 350 },
      { code: 'MCA-203', name: 'Cryptography, Cyber Security & Blockchain', credits: 4, type: 'regular', fee: 350 },
      { code: 'MCA-204', name: 'Full-Stack Web Engineering & Modern Frameworks', credits: 3, type: 'regular', fee: 350 },
      { code: 'MCA-205', name: 'Advanced DBMS Laboratory', credits: 2, type: 'regular', fee: 200 },
      { code: 'MCA-206', name: 'Cloud Infrastructure & DevOps Lab', credits: 2, type: 'regular', fee: 200 },
    ],
    backlog_papers: [],
    total_papers_count: 6,
    total_credits: 19,
    examination_fee: 1800,
    backlog_fee: 0,
    marksheet_fee: 250,
    total_amount_paid: 2050,
    payment_status: 'paid',
    payment_transaction_id: 'TXN-UEAMS-202604018892',
    attendance_percentage: 90.0,
    is_eligible: true,
    approval_status: 'approved',
    admit_card_available: true,
    exam_center: 'Center 01 - University Main Examination Complex, North Block',
    submitted_at: '2026-04-01T10:30:00Z',
  }
];

export class ExamRegistrationService {
  private getStoredApps(): ExamRegistrationApplication[] {
    const raw = localStorage.getItem(STORAGE_KEY_EXAM_APPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EXAM_APPS, JSON.stringify(initialExamRegistrations));
      return initialExamRegistrations;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialExamRegistrations;
    }
  }

  private saveApps(apps: ExamRegistrationApplication[]): void {
    localStorage.setItem(STORAGE_KEY_EXAM_APPS, JSON.stringify(apps));
  }

  async getAllApplications(): Promise<ExamRegistrationApplication[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('exam_registrations')
          .select(`
            *,
            student:students(*, profile:profiles(*)),
            examination:examinations(*),
            papers:exam_registration_papers(*, subject:subjects(*))
          `);
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            application_no: d.application_no,
            student_id: d.student_id,
            student_name: d.student?.profile?.full_name || 'Scholar Student',
            roll_number: d.student?.roll_number || '2025-MCA-042',
            enrollment_number: d.student?.enrollment_number || 'ENR-2025-MCA-001',
            department_name: 'Department of Computer Science & Engineering',
            program_name: 'Master of Computer Applications',
            semester_number: 2,
            academic_session: 'Academic Year 2025 - 2026',
            examination_name: d.examination?.name || 'End-Semester May 2026',
            regular_papers: (d.papers || []).filter((p: any) => p.paper_type === 'regular').map((p: any) => ({
              code: p.subject?.code || 'MCA-201',
              name: p.subject?.name || 'Theory Paper',
              credits: p.credits || 4,
              type: 'regular',
              fee: p.fee || 350,
            })),
            backlog_papers: (d.papers || []).filter((p: any) => p.paper_type === 'backlog').map((p: any) => ({
              code: p.subject?.code || 'MCA-102',
              name: p.subject?.name || 'Backlog Paper',
              credits: p.credits || 4,
              type: 'backlog',
              fee: p.fee || 400,
            })),
            total_papers_count: d.total_papers_count,
            total_credits: d.total_credits,
            examination_fee: d.examination_fee,
            backlog_fee: d.backlog_fee,
            marksheet_fee: d.marksheet_fee,
            total_amount_paid: d.total_amount_paid,
            payment_status: d.payment_status,
            payment_transaction_id: d.payment_transaction_id,
            attendance_percentage: d.attendance_percentage,
            is_eligible: d.is_eligible,
            approval_status: d.approval_status,
            admit_card_available: d.admit_card_available,
            exam_center: d.exam_center,
            submitted_at: d.submitted_at,
          }));
        }
      } catch (err) {
        console.warn('[EXAM_REG] Supabase query fallback:', err);
      }
    }
    return this.getStoredApps();
  }

  async getStudentApplication(studentId: string): Promise<ExamRegistrationApplication | null> {
    const apps = await this.getAllApplications();
    return apps.find((a) => a.student_id === studentId || a.student_id.toLowerCase().includes(studentId.toLowerCase())) || null;
  }

  async submitRegistration(data: {
    student_id: string;
    student_name: string;
    roll_number: string;
    enrollment_number: string;
    department_name: string;
    program_name: string;
    semester_number: number;
    academic_session: string;
    examination_name: string;
    candidate_type?: 'regular' | 'ex_student' | 'improvement';
    email?: string;
    phone?: string;
    guardian_name?: string;
    address?: string;
    category?: string;
    examination_fee?: number;
    backlog_fee?: number;
    marksheet_fee?: number;
    total_amount_paid?: number;
    regular_papers: ExamRegistrationPaper[];
    backlog_papers: ExamRegistrationPaper[];
    attendance_percentage: number;
    payment_mode?: string;
  }): Promise<ExamRegistrationApplication> {
    const apps = this.getStoredApps();
    const appNo = `EXAM-REG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const examFee = data.examination_fee ?? (data.candidate_type === 'ex_student' ? 500 : 1800);
    const backlogFee = data.backlog_fee ?? data.backlog_papers.length * 400;
    const marksheetFee = data.marksheet_fee ?? 250;
    const totalPaid = data.total_amount_paid ?? (examFee + backlogFee + marksheetFee);

    const totalCredits =
      data.regular_papers.reduce((s, p) => s + p.credits, 0) +
      data.backlog_papers.reduce((s, p) => s + p.credits, 0);

    const isEligible = data.attendance_percentage >= 75 || data.candidate_type === 'ex_student';

    const newApp: ExamRegistrationApplication = {
      id: `exam-reg-${Date.now()}`,
      application_no: appNo,
      student_id: data.student_id,
      student_name: data.student_name,
      roll_number: data.roll_number,
      enrollment_number: data.enrollment_number,
      department_name: data.department_name,
      program_name: data.program_name,
      semester_number: data.semester_number,
      academic_session: data.academic_session,
      examination_name: data.examination_name,
      candidate_type: data.candidate_type || 'regular',
      email: data.email,
      phone: data.phone,
      guardian_name: data.guardian_name,
      address: data.address,
      category: data.category,
      regular_papers: data.regular_papers,
      backlog_papers: data.backlog_papers,
      total_papers_count: data.regular_papers.length + data.backlog_papers.length,
      total_credits: totalCredits,
      examination_fee: examFee,
      backlog_fee: backlogFee,
      marksheet_fee: marksheetFee,
      total_amount_paid: totalPaid,
      payment_status: 'paid',
      payment_transaction_id: `TXN-UEAMS-${Date.now().toString().slice(-8)}`,
      attendance_percentage: data.attendance_percentage,
      is_eligible: isEligible,
      approval_status: isEligible ? 'approved' : 'pending_dean_review',
      admit_card_available: isEligible,
      exam_center: 'Center 01 - University Main Examination Complex, North Block',
      submitted_at: new Date().toISOString(),
    };

    // Remove existing app for same student if any, then prepend
    const filtered = apps.filter((a) => a.student_id !== data.student_id);
    filtered.unshift(newApp);
    this.saveApps(filtered);

    await auditService.logAction({
      action: 'EXAM_REGISTRATION_SUBMITTED',
      entity_type: 'exam_registration',
      entity_id: newApp.id,
      entity_name: newApp.application_no,
      description: `Student ${newApp.student_name} (${newApp.roll_number}) registered for ${newApp.total_papers_count} papers in ${newApp.examination_name}. Fee paid: ₹${newApp.total_amount_paid}`,
      severity: 'info',
    });

    return newApp;
  }
}

export const examRegistrationService = new ExamRegistrationService();
