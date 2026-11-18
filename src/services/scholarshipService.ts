import {
  ScholarshipScheme,
  ScholarshipApplication,
  initialScholarshipSchemes,
  initialScholarshipApplications,
} from '../data/mockScholarships.js';

export type { ScholarshipScheme, ScholarshipApplication };
import { auditService } from './auditService.js';
import { deanService } from './deanService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const STORAGE_KEY_SCHEMES = 'ueams_scholarship_schemes';
const STORAGE_KEY_APPS = 'ueams_scholarship_apps';

export class ScholarshipService {
  private getStoredSchemes(): ScholarshipScheme[] {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEMES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SCHEMES, JSON.stringify(initialScholarshipSchemes));
      return initialScholarshipSchemes;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialScholarshipSchemes;
    }
  }

  private getStoredApps(): ScholarshipApplication[] {
    const raw = localStorage.getItem(STORAGE_KEY_APPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(initialScholarshipApplications));
      return initialScholarshipApplications;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialScholarshipApplications;
    }
  }

  private saveApps(apps: ScholarshipApplication[]): void {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
  }

  async getSchemes(): Promise<ScholarshipScheme[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('scholarship_schemes')
          .select('*')
          .eq('status', 'active');
        if (!error && data && data.length > 0) {
          return data as ScholarshipScheme[];
        }
      } catch (err) {
        console.warn('[SCHOLARSHIP] Supabase fetch schemes fallback:', err);
      }
    }
    return this.getStoredSchemes();
  }

  async getApplications(filters?: { studentId?: string; status?: string }): Promise<ScholarshipApplication[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('scholarship_applications').select(`
          *,
          scheme:scholarship_schemes(*),
          student:students(*, profile:profiles(*))
        `);
        if (filters?.status) query = query.eq('status', filters.status);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            application_no: d.application_no,
            scheme_id: d.scheme_id,
            scheme_name: d.scheme?.name || 'Academic Scholarship',
            student_id: d.student_id,
            student_name: d.student?.profile?.full_name || 'Student Scholar',
            student_roll: d.student?.roll_number || '2025-MCA-042',
            department_name: 'Department of Computer Science',
            program_name: 'Master of Computer Applications',
            current_semester: 2,
            cgpa: d.cgpa,
            annual_family_income: d.annual_family_income,
            category: d.category,
            bank_name: d.bank_name,
            account_number: d.account_number,
            ifsc_code: d.ifsc_code,
            applied_amount: d.applied_amount,
            sanctioned_amount: d.sanctioned_amount,
            status: d.status,
            dean_remarks: d.dean_remarks,
            dean_pin_signed: d.dean_pin_signed,
            sanctioned_at: d.sanctioned_at,
            disbursement_date: d.disbursement_date,
            utr_number: d.utr_number,
            documents: [
              { name: 'Income / Category Certificate', type: 'PDF', verified: true },
              { name: 'Semester Marksheet / CGPA', type: 'PDF', verified: true }
            ],
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('[SCHOLARSHIP] Supabase fetch apps fallback:', err);
      }
    }

    let apps = this.getStoredApps();
    if (filters?.studentId) {
      apps = apps.filter((a) => a.student_id === filters.studentId || a.student_id.toLowerCase().includes(filters.studentId.toLowerCase()));
    }
    if (filters?.status) {
      apps = apps.filter((a) => a.status === filters.status);
    }
    return apps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getApplicationById(id: string): Promise<ScholarshipApplication | null> {
    const apps = this.getStoredApps();
    return apps.find((a) => a.id === id) || null;
  }

  async submitApplication(data: {
    scheme_id: string;
    scheme_name: string;
    student_id: string;
    student_name: string;
    student_roll: string;
    department_name: string;
    program_name: string;
    current_semester: number;
    cgpa: number;
    annual_family_income: number;
    category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    applied_amount: number;
    documents?: Array<{ name: string; type: string; verified: boolean }>;
  }): Promise<ScholarshipApplication> {
    const apps = this.getStoredApps();
    const appNo = `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp: ScholarshipApplication = {
      ...data,
      id: `app-sch-${Date.now()}`,
      application_no: appNo,
      status: 'submitted',
      documents: data.documents || [
        { name: 'Semester Marksheet / CGPA Proof', type: 'PDF', verified: false },
        { name: 'Income / Category Certificate', type: 'PDF', verified: false },
        { name: 'Bank Details (Passbook / Cheque)', type: 'JPEG', verified: false },
      ],
      created_at: new Date().toISOString(),
    };

    apps.unshift(newApp);
    this.saveApps(apps);

    await auditService.logAction({
      action: 'SUBMIT_SCHOLARSHIP_APPLICATION',
      entity_type: 'scholarship_application',
      entity_id: newApp.id,
      entity_name: newApp.application_no,
      description: `Student ${newApp.student_name} (${newApp.student_roll}) applied for ${newApp.scheme_name} (Requested: ₹${newApp.applied_amount.toLocaleString()})`,
      severity: 'info',
    });

    return newApp;
  }

  async deanSanctionApplication(
    id: string,
    sanctionedAmount: number,
    remarks: string,
    deanName: string = 'Dean of Academic Affairs',
    deanPin?: string,
    userId?: string
  ): Promise<ScholarshipApplication> {
    if (!deanPin) {
      throw new Error('Statutory Sign-Off Rejected: Dean Security Authorization PIN is required.');
    }
    const check = deanService.verifyDeanPin(deanPin, userId);
    if (!check.valid) {
      throw new Error(`Statutory Sign-Off Rejected: ${check.error || 'Invalid Dean Security Authorization PIN.'}`);
    }

    const apps = this.getStoredApps();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Scholarship application not found');

    const app = apps[index];
    const utr = `UTR-${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`;

    apps[index] = {
      ...app,
      sanctioned_amount: sanctionedAmount,
      status: 'sanctioned_by_dean',
      dean_remarks: remarks || `Endorsed and sanctioned under Dean Statutory Authority by ${deanName}.`,
      dean_pin_signed: true,
      sanctioned_at: new Date().toISOString(),
      disbursement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      utr_number: utr,
    };

    this.saveApps(apps);

    await auditService.logAction({
      action: 'DEAN_SANCTION_SCHOLARSHIP',
      entity_type: 'scholarship_application',
      entity_id: app.id,
      entity_name: app.application_no,
      description: `Dean ${deanName} approved and sanctioned ₹${sanctionedAmount.toLocaleString()} for student ${app.student_name} under scheme ${app.scheme_name}`,
      severity: 'security',
    });

    return apps[index];
  }

  async queueForVcApproval(
    id: string,
    proposedAmount: number,
    remarks: string,
    deanName: string = 'Dean of Academic Affairs',
    deanPin?: string,
    userId?: string
  ): Promise<ScholarshipApplication> {
    if (!deanPin) {
      throw new Error('Statutory Sign-Off Rejected: Dean Security Authorization PIN is required.');
    }
    const check = deanService.verifyDeanPin(deanPin, userId);
    if (!check.valid) {
      throw new Error(`Statutory Sign-Off Rejected: ${check.error || 'Invalid Dean Security Authorization PIN.'}`);
    }

    const apps = this.getStoredApps();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Scholarship application not found');

    const app = apps[index];
    apps[index] = {
      ...app,
      sanctioned_amount: proposedAmount,
      status: 'pending_vc_approval',
      dean_remarks: remarks || `Amount ₹${proposedAmount.toLocaleString()} exceeds Dean threshold limit of ₹75,000. Endorsed by Dean ${deanName} and queued for Vice-Chancellor co-signature.`,
      dean_pin_signed: true,
      sanctioned_at: new Date().toISOString(),
    };

    this.saveApps(apps);

    await auditService.logAction({
      action: 'DEAN_FORWARD_SCHOLARSHIP_TO_VC',
      entity_type: 'scholarship_application',
      entity_id: app.id,
      entity_name: app.application_no,
      description: `Dean ${deanName} endorsed high-value scholarship of ₹${proposedAmount.toLocaleString()} (> ₹75k) for ${app.student_name}. Queued for Vice-Chancellor co-signature.`,
      severity: 'security',
    });

    return apps[index];
  }

  async deanRejectApplication(id: string, reason: string, deanName: string = 'Dean of Academic Affairs'): Promise<ScholarshipApplication> {
    const apps = this.getStoredApps();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Scholarship application not found');

    const app = apps[index];
    apps[index] = {
      ...app,
      status: 'rejected',
      dean_remarks: reason || 'Application does not meet required statutory eligibility criteria.',
      dean_pin_signed: true,
      sanctioned_at: new Date().toISOString(),
    };

    this.saveApps(apps);

    await auditService.logAction({
      action: 'DEAN_REJECT_SCHOLARSHIP',
      entity_type: 'scholarship_application',
      entity_id: app.id,
      entity_name: app.application_no,
      description: `Dean ${deanName} rejected scholarship application ${app.application_no}: ${reason}`,
      severity: 'warning',
    });

    return apps[index];
  }

  async markDisbursed(id: string, utrNumber?: string): Promise<ScholarshipApplication> {
    const apps = this.getStoredApps();
    const index = apps.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Scholarship application not found');

    const app = apps[index];
    apps[index] = {
      ...app,
      status: 'disbursed',
      utr_number: utrNumber || app.utr_number || `DBT-${Math.floor(100000000 + Math.random() * 900000000)}`,
      disbursement_date: new Date().toISOString().split('T')[0],
    };

    this.saveApps(apps);
    return apps[index];
  }
}

export const scholarshipService = new ScholarshipService();
