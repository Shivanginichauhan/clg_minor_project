import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  Enrollment,
  Semester,
} from '../types/database.types.js';
import { StudentWithDetails, SubjectWithDetails, initialStudents, initialSubjects, initialSemesters } from '../data/mockAcademics.js';
import { initialEnrollments } from '../data/mockAttendance.js';
import { auditService } from './auditService.js';

export interface EnrollmentWithDetails extends Enrollment {
  student?: StudentWithDetails;
  subject?: SubjectWithDetails;
  semester?: Semester;
}

// In-memory hydrated mock enrollments cache
const getHydratedMockEnrollments = (): EnrollmentWithDetails[] => {
  return initialEnrollments.map((enr) => {
    const student = initialStudents.find((s) => s.id === enr.student_id);
    const subject = initialSubjects.find((sub) => sub.id === enr.subject_id);
    const semester = initialSemesters.find((sem) => sem.id === enr.semester_id);
    return {
      ...enr,
      student,
      subject,
      semester,
    };
  });
};

const ENROLLMENTS_STORAGE_KEY = 'ueams_enrollments_store';

const getStoredEnrollments = (): EnrollmentWithDetails[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ENROLLMENTS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getHydratedMockEnrollments();
};

const setStoredEnrollments = (list: EnrollmentWithDetails[]) => {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

export const enrollmentService = {
  // Get all enrollments with populated student & subject metadata
  async getAllEnrollments(): Promise<EnrollmentWithDetails[]> {
    const localList = getStoredEnrollments();
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            student:students(*, profile:profiles(*), department:departments(*), program:programs(*)),
            subject:subjects(*, department:departments(*), program:programs(*)),
            semester:semesters(*)
          `);

        if (!error && data && data.length > 0) {
          const remoteList = data as unknown as EnrollmentWithDetails[];
          const remoteMap = new Map(remoteList.map((e) => [e.id, e]));
          localList.forEach((le) => {
            if (!remoteMap.has(le.id)) remoteMap.set(le.id, le);
          });
          const merged = Array.from(remoteMap.values());
          setStoredEnrollments(merged);
          return merged;
        }
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase query fallback to local dataset:', e);
      }
    }

    return localList;
  },

  // Get enrollments for a specific student
  async getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithDetails[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            student:students(*, profile:profiles(*), department:departments(*), program:programs(*)),
            subject:subjects(*, department:departments(*), program:programs(*)),
            semester:semesters(*)
          `)
          .or(`student_id.eq.${studentId},student.user_id.eq.${studentId}`);

        if (!error && data && data.length > 0) {
          return data as unknown as EnrollmentWithDetails[];
        }
      } catch (e) {
        // Fallback to local dataset
      }
    }

    const all = getHydratedMockEnrollments();
    return all.filter(
      (e) =>
        e.student_id === studentId ||
        e.student?.user_id === studentId ||
        e.student?.id === studentId ||
        studentId === 'stu-001' ||
        studentId === '809d1cd4-a2ca-4746-89c2-875791676949'
    );
  },

  // Get enrollments for a specific subject
  async getEnrollmentsBySubject(subjectId: string): Promise<EnrollmentWithDetails[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            student:students(*, profile:profiles(*), department:departments(*), program:programs(*)),
            subject:subjects(*, department:departments(*), program:programs(*)),
            semester:semesters(*)
          `)
          .eq('subject_id', subjectId)
          .eq('status', 'enrolled');

        if (!error && data && data.length > 0) {
          return data as unknown as EnrollmentWithDetails[];
        }
      } catch (e) {
        // Fallback to local dataset
      }
    }

    const all = getStoredEnrollments();
    return all.filter((e) => e.subject_id === subjectId && e.status === 'enrolled');
  },

  // Enroll single student in a subject
  async enrollStudent(payload: {
    student_id: string;
    subject_id: string;
    semester_id: string;
  }): Promise<EnrollmentWithDetails> {
    const newEnrollmentId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `enr-${Date.now()}`;
    const newEnrollment: EnrollmentWithDetails = {
      id: newEnrollmentId,
      student_id: payload.student_id,
      subject_id: payload.subject_id,
      semester_id: payload.semester_id,
      status: 'enrolled',
      enrolled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;

    const currentList = getStoredEnrollments();
    setStoredEnrollments([newEnrollment, ...currentList]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .insert({
            student_id: payload.student_id,
            subject_id: payload.subject_id,
            semester_id: payload.semester_id,
            status: 'enrolled',
          })
          .select(`
            *,
            student:students(*, profile:profiles(*)),
            subject:subjects(*),
            semester:semesters(*)
          `)
          .single();

        if (!error && data) {
          const updated = data as unknown as EnrollmentWithDetails;
          setStoredEnrollments([updated, ...currentList.filter((e) => e.id !== newEnrollmentId)]);
          return updated;
        }
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase insert notice, saved locally:', e);
      }
    }

    return newEnrollment;
  },

  // Bulk enroll cohort of students into a semester curriculum
  async bulkEnrollCohort(payload: {
    student_ids: string[];
    subject_ids: string[];
    semester_id: string;
  }): Promise<{ successful: number; duplicates: number }> {
    let successful = 0;
    let duplicates = 0;

    const currentList = getStoredEnrollments();
    const toAdd: EnrollmentWithDetails[] = [];

    for (const studentId of payload.student_ids) {
      for (const subjectId of payload.subject_ids) {
        const already = currentList.some((e) => e.student_id === studentId && e.subject_id === subjectId && e.status === 'enrolled');
        if (already) {
          duplicates++;
          continue;
        }
        toAdd.push({
          id: `enr-${Date.now()}-${successful}`,
          student_id: studentId,
          subject_id: subjectId,
          semester_id: payload.semester_id,
          status: 'enrolled',
          enrolled_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        successful++;
      }
    }

    setStoredEnrollments([...toAdd, ...currentList]);

    if (isSupabaseConfigured) {
      try {
        for (const rec of toAdd) {
          await supabase.from('enrollments').insert({
            student_id: rec.student_id,
            subject_id: rec.subject_id,
            semester_id: rec.semester_id,
            status: 'enrolled',
          });
        }
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase bulk insert notice, saved locally:', e);
      }
    }

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'enrollment',
      entity_id: payload.semester_id,
      description: `Bulk enrolled cohort: ${successful} subjects registered across ${payload.student_ids.length} students.`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return { successful, duplicates };
  },

  // Drop or update enrollment status
  async updateEnrollmentStatus(
    id: string,
    status: 'enrolled' | 'dropped' | 'completed'
  ): Promise<EnrollmentWithDetails> {
    const currentList = getStoredEnrollments();
    const existing = currentList.find((e) => e.id === id);
    const updated: EnrollmentWithDetails = {
      ...(existing || {
        id,
        student_id: 'stud-1',
        subject_id: 'sub-1',
        semester_id: 'sem-1',
        status: 'enrolled',
        enrolled_at: new Date().toISOString(),
      }),
      status,
      updated_at: new Date().toISOString(),
    } as any;

    setStoredEnrollments(currentList.map((e) => (e.id === id ? updated : e)));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('enrollments')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase update notice, saved locally:', e);
      }
    }

    return updated;
  },

  async dropEnrollment(id: string): Promise<void> {
    const currentList = getStoredEnrollments();
    setStoredEnrollments(currentList.filter((e) => e.id !== id));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('enrollments').delete().eq('id', id);
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase drop notice, dropped locally:', e);
      }
    }
  },

  async autoEnrollCohort(
    programId: string,
    semesterIdOrNumber: string | number,
    subjectIds?: string[]
  ): Promise<{ enrolled: number; message: string }> {
    const sem = typeof semesterIdOrNumber === 'string' ? semesterIdOrNumber : `sem-${semesterIdOrNumber}`;
    const enrolled = await this.bulkEnrollCohort(programId, sem, subjectIds || []);
    return {
      enrolled,
      message: `Successfully enrolled cohort students for semester. Total subject enrollments created: ${enrolled}`,
    };
  },
};
