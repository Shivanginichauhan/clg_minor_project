import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  Student,
  Faculty,
  Department,
  Program,
  AcademicSession,
  Semester,
  Profile,
} from '../types/database.types.js';
import {
  StudentWithDetails,
  FacultyWithDetails,
  initialDepartments,
  initialPrograms,
  initialSessions,
  initialSemesters,
  initialStudents,
  initialFaculty,
} from '../data/mockAcademics.js';
export type { StudentWithDetails, FacultyWithDetails };
import { auditService } from './auditService.js';

export interface StudentFormData {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  enrollmentNumber: string;
  rollNumber: string;
  departmentId: string;
  programId: string;
  sessionId: string;
  semesterId?: string;
  admissionDate?: string;
  gender?: string;
  dateOfBirth?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  avatarUrl?: string;
}

export interface FacultyFormData {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  employeeId?: string;
  departmentId?: string;
  designation?: string;
  qualification?: string;
  joiningDate?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'suspended';
  avatarUrl?: string;
}

export const studentFacultyService = {
  // ==========================================
  // DEPARTMENTS & PROGRAMS REFERENCE
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    if (!isSupabaseConfigured) return initialDepartments;
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error || !data || data.length === 0) {
        return initialDepartments;
      }
      return data as Department[];
    } catch (e) {
      return initialDepartments;
    }
  },

  getPrograms: async (departmentId?: string): Promise<Program[]> => {
    if (!isSupabaseConfigured) {
      if (departmentId && departmentId !== 'all') {
        return initialPrograms.filter((p) => p.department_id === departmentId);
      }
      return initialPrograms;
    }
    try {
      let query = supabase.from('programs').select('*').order('name');
      if (departmentId && departmentId !== 'all') {
        query = query.eq('department_id', departmentId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (departmentId && departmentId !== 'all') {
          return initialPrograms.filter((p) => p.department_id === departmentId);
        }
        return initialPrograms;
      }
      return data as Program[];
    } catch (e) {
      return initialPrograms;
    }
  },

  getSessions: async (): Promise<AcademicSession[]> => {
    if (!isSupabaseConfigured) return initialSessions;
    try {
      const { data, error } = await supabase.from('academic_sessions').select('*').order('start_date', { ascending: false });
      if (error || !data || data.length === 0) return initialSessions;
      return data as AcademicSession[];
    } catch (e) {
      return initialSessions;
    }
  },

  getSemesters: async (programId?: string): Promise<Semester[]> => {
    if (!isSupabaseConfigured) {
      if (programId && programId !== 'all') {
        return initialSemesters.filter((s) => s.program_id === programId);
      }
      return initialSemesters;
    }
    try {
      let query = supabase.from('semesters').select('*').order('semester_number');
      if (programId && programId !== 'all') {
        query = query.eq('program_id', programId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (programId && programId !== 'all') {
          return initialSemesters.filter((s) => s.program_id === programId);
        }
        return initialSemesters;
      }
      return data as Semester[];
    } catch (e) {
      return initialSemesters;
    }
  },

  // ==========================================
  // STUDENTS MANAGEMENT
  // ==========================================
  getStudents: async (filters?: {
    departmentId?: string;
    programId?: string;
    semesterId?: string;
    status?: string;
    search?: string;
  }): Promise<StudentWithDetails[]> => {
    let list: StudentWithDetails[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('students')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*),
            program:programs(*),
            session:academic_sessions(*),
            current_semester:semesters(*)
          `)
          .order('roll_number', { ascending: true });

        if (filters?.departmentId && filters.departmentId !== 'all') {
          query = query.eq('department_id', filters.departmentId);
        }
        if (filters?.programId && filters.programId !== 'all') {
          query = query.eq('program_id', filters.programId);
        }
        if (filters?.semesterId && filters.semesterId !== 'all') {
          query = query.eq('current_semester_id', filters.semesterId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data as StudentWithDetails[];
        }
      } catch (e) {
        console.warn('[STUDENT_FACULTY] Query students fallback to mock:', e);
      }
    }

    if (list.length === 0) {
      list = [...initialStudents];
      if (filters?.departmentId && filters.departmentId !== 'all') {
        list = list.filter((s) => s.department_id === filters.departmentId);
      }
      if (filters?.programId && filters.programId !== 'all') {
        list = list.filter((s) => s.program_id === filters.programId);
      }
      if (filters?.semesterId && filters.semesterId !== 'all') {
        list = list.filter((s) => s.current_semester_id === filters.semesterId);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((s) => s.status === filters.status);
      }
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.profile?.full_name?.toLowerCase().includes(q) ||
          s.roll_number?.toLowerCase().includes(q) ||
          s.enrollment_number?.toLowerCase().includes(q) ||
          s.profile?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getStudentById: async (id: string): Promise<StudentWithDetails | undefined> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*),
            program:programs(*),
            session:academic_sessions(*),
            current_semester:semesters(*)
          `)
          .eq('id', id)
          .single();

        if (!error && data) return data as StudentWithDetails;
      } catch (e) {
        // fallback
      }
    }
    return initialStudents.find((s) => s.id === id || s.user_id === id);
  },

  getStudentByUserId: async (userId: string): Promise<StudentWithDetails | undefined> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*),
            program:programs(*),
            session:academic_sessions(*),
            current_semester:semesters(*)
          `)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) return data as StudentWithDetails;
      } catch (e) {
        // fallback
      }
    }
    return initialStudents.find((s) => s.user_id === userId || s.id === userId || s.profile?.id === userId);
  },

  createStudent: async (data: StudentFormData): Promise<StudentWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const cleanEmail = data.email.toLowerCase().trim();
    let profileId: string | null = null;

    // 1. Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      // Create user in Supabase Auth using isolated client so admin session is never modified
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (supabaseUrl && supabaseAnonKey) {
        const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const defaultPassword = data.password || 'Student@123';
        const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
          email: cleanEmail,
          password: defaultPassword,
          options: {
            data: {
              full_name: data.fullName,
              role: 'student',
            },
          },
        });

        if (authError) {
          throw new Error(`Failed to create student account: ${authError.message}`);
        }

        if (authData?.user?.id) {
          profileId = authData.user.id;
        }
      }

      if (profileId) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            status: data.status === 'active' ? 'active' : 'inactive',
            avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          })
          .eq('id', profileId);
      }
    }

    if (!profileId) {
      throw new Error('Unable to establish student profile identifier. Please verify the email address.');
    }

    // 2. Insert student record
    const { data: studentData, error: studentErr } = await supabase
      .from('students')
      .insert({
        user_id: profileId,
        enrollment_number: data.enrollmentNumber,
        roll_number: data.rollNumber,
        department_id: data.departmentId,
        program_id: data.programId,
        admission_session_id: data.sessionId,
        current_semester_id: data.semesterId || null,
        status: data.status,
      })
      .select(`
        *,
        profile:profiles(*),
        department:departments(*),
        program:programs(*),
        session:academic_sessions(*),
        current_semester:semesters(*)
      `)
      .single();

    if (studentErr) {
      throw new Error(`Failed to create student record: ${studentErr.message}`);
    }

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: studentData.id,
      entity_name: data.fullName,
      description: `Registered student ${data.fullName} (Roll: ${data.rollNumber}).`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return studentData as StudentWithDetails;
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>): Promise<StudentWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    // 1. Fetch current student
    const current = await studentFacultyService.getStudentById(id);
    if (!current) throw new Error('Student not found');

    // 2. Update profile if full_name, email, or phone changed
    if (current.user_id && (data.fullName || data.email || data.phone !== undefined || data.avatarUrl)) {
      await supabase
        .from('profiles')
        .update({
          ...(data.fullName && { full_name: data.fullName }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.user_id);
    }

    // 3. Update student table
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.enrollmentNumber) updatePayload.enrollment_number = data.enrollmentNumber;
    if (data.rollNumber) updatePayload.roll_number = data.rollNumber;
    if (data.departmentId) updatePayload.department_id = data.departmentId;
    if (data.programId) updatePayload.program_id = data.programId;
    if (data.sessionId) updatePayload.admission_session_id = data.sessionId;
    if (data.semesterId !== undefined) updatePayload.current_semester_id = data.semesterId;
    if (data.status) updatePayload.status = data.status;

    const { data: updatedData, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        profile:profiles(*),
        department:departments(*),
        program:programs(*),
        session:academic_sessions(*),
        current_semester:semesters(*)
      `)
      .single();

    if (error) throw new Error(`Failed to update student: ${error.message}`);
    return updatedData as StudentWithDetails;
  },

  deleteStudent: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete student: ${error.message}`);
    return true;
  },

  // ==========================================
  // FACULTY MANAGEMENT
  // ==========================================
  getFaculty: async (filters?: {
    departmentId?: string;
    designation?: string;
    status?: string;
    search?: string;
  }): Promise<FacultyWithDetails[]> => {
    let list: FacultyWithDetails[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('faculty')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*)
          `)
          .order('employee_id', { ascending: true });

        if (filters?.departmentId && filters.departmentId !== 'all') {
          query = query.eq('department_id', filters.departmentId);
        }
        if (filters?.designation && filters.designation !== 'all') {
          query = query.eq('designation', filters.designation);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data as FacultyWithDetails[];
        }
      } catch (e) {
        // fallback
      }
    }

    if (list.length === 0) {
      list = [...initialFaculty];
      if (filters?.departmentId && filters.departmentId !== 'all') {
        list = list.filter((f) => f.department_id === filters.departmentId);
      }
      if (filters?.designation && filters.designation !== 'all') {
        list = list.filter((f) => f.designation === filters.designation);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((f) => f.status === filters.status);
      }
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.profile?.full_name?.toLowerCase().includes(q) ||
          f.employee_id?.toLowerCase().includes(q) ||
          f.designation?.toLowerCase().includes(q) ||
          f.profile?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getFacultyById: async (id: string): Promise<FacultyWithDetails | undefined> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('faculty')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*)
          `)
          .eq('id', id)
          .single();

        if (!error && data) return data as FacultyWithDetails;
      } catch (e) {
        // fallback
      }
    }
    return initialFaculty.find((f) => f.id === id || f.user_id === id);
  },

  createFaculty: async (data: FacultyFormData): Promise<FacultyWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const cleanEmail = (data.email || '').toLowerCase().trim();
    let profileId: string | null = null;

    // 1. Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (supabaseUrl && supabaseAnonKey) {
        const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const defaultPassword = data.password || 'Faculty@123';
        const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
          email: cleanEmail,
          password: defaultPassword,
          options: {
            data: {
              full_name: data.fullName || 'Faculty Member',
              role: 'faculty',
            },
          },
        });

        if (authError) {
          throw new Error(`Failed to create faculty account: ${authError.message}`);
        }

        if (authData?.user?.id) {
          profileId = authData.user.id;
        }
      }

      if (profileId) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            status: data.status === 'active' ? 'active' : 'inactive',
            avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          })
          .eq('id', profileId);
      }
    }

    if (!profileId) {
      throw new Error('Unable to establish faculty profile identifier. Please verify the email address.');
    }

    // 2. Insert faculty record
    const { data: facultyData, error: facultyErr } = await supabase
      .from('faculty')
      .insert({
        user_id: profileId,
        employee_id: data.employeeId,
        department_id: data.departmentId,
        designation: data.designation,
        specialization: data.qualification,
        joining_date: data.joiningDate,
        status: data.status,
      })
      .select(`
        *,
        profile:profiles(*),
        department:departments(*)
      `)
      .single();

    if (facultyErr) {
      throw new Error(`Failed to create faculty record: ${facultyErr.message}`);
    }

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: facultyData.id,
      entity_name: data.fullName,
      description: `Registered faculty ${data.fullName} (${data.employeeId}).`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return facultyData as FacultyWithDetails;
  },

  updateFaculty: async (id: string, data: Partial<FacultyFormData>): Promise<FacultyWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const current = await studentFacultyService.getFacultyById(id);
    if (!current) throw new Error('Faculty member not found');

    if (current.user_id && (data.fullName || data.email || data.phone !== undefined || data.avatarUrl)) {
      await supabase
        .from('profiles')
        .update({
          ...(data.fullName && { full_name: data.fullName }),
          ...(data.email && { email: data.email.toLowerCase().trim() }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.user_id);
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.employeeId) updatePayload.employee_id = data.employeeId;
    if (data.departmentId) updatePayload.department_id = data.departmentId;
    if (data.designation) updatePayload.designation = data.designation;
    if (data.qualification !== undefined) updatePayload.specialization = data.qualification;
    if (data.joiningDate) updatePayload.joining_date = data.joiningDate;
    if (data.status) updatePayload.status = data.status;

    const { data: updatedData, error } = await supabase
      .from('faculty')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        profile:profiles(*),
        department:departments(*)
      `)
      .single();

    if (error) throw new Error(`Failed to update faculty: ${error.message}`);
    return updatedData as FacultyWithDetails;
  },

  deleteFaculty: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('faculty').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete faculty: ${error.message}`);
    return true;
  },

  bulkImportStudents: async (students: StudentFormData[]): Promise<{ imported: number; errors: string[]; count: number }> => {
    let imported = 0;
    const errors: string[] = [];
    for (const st of students) {
      try {
        await studentFacultyService.createStudent(st);
        imported++;
      } catch (e: any) {
        console.error('Failed to import student:', st.fullName, e);
        errors.push(`${st.fullName} (${st.rollNumber}): ${e?.message || 'Failed to insert'}`);
      }
    }
    return { imported, errors, count: imported };
  },

  bulkImportFaculty: async (facultyList: FacultyFormData[]): Promise<{ imported: number; errors: string[]; count: number }> => {
    let imported = 0;
    const errors: string[] = [];
    for (const fac of facultyList) {
      try {
        await studentFacultyService.createFaculty(fac);
        imported++;
      } catch (e: any) {
        console.error('Failed to import faculty:', fac.fullName, e);
        errors.push(`${fac.fullName || fac.email} (${fac.employeeId || 'No ID'}): ${e?.message || 'Failed to insert'}`);
      }
    }
    return { imported, errors, count: imported };
  },

  resetDemoData: () => {
    // Reset demo state or cache
  },
};
