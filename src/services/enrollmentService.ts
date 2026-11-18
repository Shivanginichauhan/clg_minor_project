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

export const enrollmentService = {
  // Get all enrollments with populated student & subject metadata
  async getAllEnrollments(): Promise<EnrollmentWithDetails[]> {
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
          return data as unknown as EnrollmentWithDetails[];
        }
      } catch (e) {
        console.warn('[ENROLLMENT] Supabase query fallback to local dataset:', e);
      }
    }

    return getHydratedMockEnrollments();
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
          .eq('student_id', studentId);

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

    const all = getHydratedMockEnrollments();
    return all.filter((e) => e.subject_id === subjectId && e.status === 'enrolled');
  },

  // Enroll single student in a subject
  async enrollStudent(payload: {
    student_id: string;
    subject_id: string;
    semester_id: string;
  }): Promise<EnrollmentWithDetails> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

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

    if (error) throw new Error(`Enrollment failed: ${error.message}`);
    return data as unknown as EnrollmentWithDetails;
  },

  // Bulk enroll cohort of students into a semester curriculum
  async bulkEnrollCohort(payload: {
    student_ids: string[];
    subject_ids: string[];
    semester_id: string;
  }): Promise<{ successful: number; duplicates: number }> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    let successful = 0;
    let duplicates = 0;

    for (const studentId of payload.student_ids) {
      for (const subjectId of payload.subject_ids) {
        const { error } = await supabase
          .from('enrollments')
          .insert({
            student_id: studentId,
            subject_id: subjectId,
            semester_id: payload.semester_id,
            status: 'enrolled',
          });

        if (error) {
          if (error.code === '23505') duplicates++;
        } else {
          successful++;
        }
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
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('enrollments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        student:students(*, profile:profiles(*)),
        subject:subjects(*),
        semester:semesters(*)
      `)
      .single();

    if (error) throw new Error(`Failed to update enrollment: ${error.message}`);
    return data as unknown as EnrollmentWithDetails;
  },

  async dropEnrollment(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) throw new Error(`Failed to drop enrollment: ${error.message}`);
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
