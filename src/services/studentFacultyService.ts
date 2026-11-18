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
import { academicStructureService, isValidUUID } from './academicStructureService.js';

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

const STORAGE_KEYS = {
  FACULTY: 'ueams_faculty_records',
  STUDENTS: 'ueams_students_records',
};

const getStored = <T>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return [...fallback];
};

const setStored = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const studentFacultyService = {
  // ==========================================
  // DEPARTMENTS & PROGRAMS REFERENCE
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    return academicStructureService.getDepartments();
  },

  getPrograms: async (departmentId?: string): Promise<Program[]> => {
    return academicStructureService.getPrograms(departmentId);
  },

  getSessions: async (): Promise<AcademicSession[]> => {
    return academicStructureService.getSessions();
  },

  getSemesters: async (programId?: string): Promise<Semester[]> => {
    return academicStructureService.getSemesters(programId);
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
    let localStudents = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);

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
          const remoteMap = new Map((data as StudentWithDetails[]).map((s) => [s.id, s]));
          localStudents.forEach((ls) => {
            if (!remoteMap.has(ls.id)) remoteMap.set(ls.id, ls);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.STUDENTS, merged);
          localStudents = merged;
        }
      } catch (e) {
        console.warn('[STUDENT_FACULTY] Query students fallback to mock:', e);
      }
    }

    let list = localStudents;
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
    const list = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);
    const found = list.find((s) => s.id === id || s.user_id === id);
    if (found) return found;

    if (isSupabaseConfigured && isValidUUID(id)) {
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
    const list = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);
    const found = list.find((s) => s.user_id === userId || s.id === userId || s.profile?.id === userId);
    if (found) return found;

    if (isSupabaseConfigured && isValidUUID(userId)) {
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
    const cleanEmail = (data.email || '').toLowerCase().trim();
    let profileId: string | null = null;
    let authUserCreated = false;

    // 1. Try finding existing profile or creating via auth client
    if (isSupabaseConfigured) {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingProfile?.id) {
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

            if (!authError && authData?.user?.id) {
              profileId = authData.user.id;
              authUserCreated = true;
            }
          }
        }
      } catch (e) {
        console.warn('[STUDENT] Auth sign up exception, proceeding with resilient profile ID:', e);
      }
    }

    // Resilient Fallback Profile ID
    if (!profileId) {
      profileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stud-usr-${Date.now()}`;
    }

    if (authUserCreated && isValidUUID(profileId)) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            status: data.status === 'active' ? 'active' : 'inactive',
            avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          })
          .eq('id', profileId);
      } catch (e) {
        console.warn('[STUDENT] Profile update warning:', e);
      }
    }

    // 2. Insert student in DB if UUIDs are valid
    let dbData: any = null;
    if (
      isSupabaseConfigured &&
      isValidUUID(profileId) &&
      isValidUUID(data.departmentId) &&
      isValidUUID(data.programId) &&
      isValidUUID(data.sessionId)
    ) {
      try {
        const { data: studentData, error: studentErr } = await supabase
          .from('students')
          .insert({
            user_id: profileId,
            enrollment_number: data.enrollmentNumber,
            roll_number: data.rollNumber,
            department_id: data.departmentId,
            program_id: data.programId,
            admission_session_id: data.sessionId,
            current_semester_id: data.semesterId && isValidUUID(data.semesterId) ? data.semesterId : null,
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

        if (!studentErr && studentData) dbData = studentData;
      } catch (e) {
        console.warn('[STUDENT] Remote DB insert failed, using persistent local store:', e);
      }
    }

    // 3. Resolve reference models for UI completeness
    const depts = await academicStructureService.getDepartments();
    const progs = await academicStructureService.getPrograms();
    const sessions = await academicStructureService.getSessions();
    const semesters = await academicStructureService.getSemesters();

    const deptObj = depts.find((d) => d.id === data.departmentId) || depts[0];
    const progObj = progs.find((p) => p.id === data.programId) || progs[0];
    const sessionObj = sessions.find((s) => s.id === data.sessionId) || sessions[0];
    const semObj = semesters.find((s) => s.id === data.semesterId);

    const newStudent: StudentWithDetails = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stud-${Date.now()}`),
      user_id: profileId,
      enrollment_number: data.enrollmentNumber,
      roll_number: data.rollNumber,
      department_id: data.departmentId || deptObj?.id || 'dept-cse-01',
      program_id: data.programId || progObj?.id || 'prog-mca-01',
      admission_session_id: data.sessionId || sessionObj?.id || 'session-2025-26',
      current_semester_id: data.semesterId || null,
      status: data.status,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
      profile: {
        id: profileId,
        full_name: data.fullName,
        email: cleanEmail,
        role: 'student',
        phone: data.phone || null,
        status: data.status === 'active' ? 'active' : 'inactive',
        avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      department: deptObj,
      program: progObj,
      session: sessionObj,
      current_semester: semObj,
      cgpa: 8.5,
      attendance_avg: 92,
    };

    const currentList = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);
    const updatedList = [newStudent, ...currentList.filter((s) => s.id !== newStudent.id && s.roll_number !== newStudent.roll_number)];
    setStored(STORAGE_KEYS.STUDENTS, updatedList);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: newStudent.id,
      entity_name: data.fullName,
      description: `Registered student ${data.fullName} (Roll: ${data.rollNumber}).`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return newStudent;
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>): Promise<StudentWithDetails> => {
    const current = await studentFacultyService.getStudentById(id);
    if (!current) throw new Error('Student not found');

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        if (current.user_id && isValidUUID(current.user_id) && (data.fullName || data.email || data.phone !== undefined || data.avatarUrl)) {
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
        if (data.enrollmentNumber) updatePayload.enrollment_number = data.enrollmentNumber;
        if (data.rollNumber) updatePayload.roll_number = data.rollNumber;
        if (data.departmentId && isValidUUID(data.departmentId)) updatePayload.department_id = data.departmentId;
        if (data.programId && isValidUUID(data.programId)) updatePayload.program_id = data.programId;
        if (data.sessionId && isValidUUID(data.sessionId)) updatePayload.admission_session_id = data.sessionId;
        if (data.semesterId !== undefined && isValidUUID(data.semesterId)) updatePayload.current_semester_id = data.semesterId;
        if (data.status) updatePayload.status = data.status;

        await supabase.from('students').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('[STUDENT] Remote DB update warning:', e);
      }
    }

    const currentList = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);
    const updatedStudent: StudentWithDetails = {
      ...current,
      ...(data.enrollmentNumber && { enrollment_number: data.enrollmentNumber }),
      ...(data.rollNumber && { roll_number: data.rollNumber }),
      ...(data.departmentId && { department_id: data.departmentId }),
      ...(data.programId && { program_id: data.programId }),
      ...(data.sessionId && { admission_session_id: data.sessionId }),
      ...(data.semesterId !== undefined && { current_semester_id: data.semesterId }),
      ...(data.status && { status: data.status }),
      profile: {
        ...current.profile,
        ...(data.fullName && { full_name: data.fullName }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
      },
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.map((s) => (s.id === id ? updatedStudent : s));
    setStored(STORAGE_KEYS.STUDENTS, nextList);
    return updatedStudent;
  },

  deleteStudent: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('students').delete().eq('id', id);
      } catch (e) {
        console.warn('[STUDENT] Remote DB delete warning:', e);
      }
    }
    const currentList = getStored<StudentWithDetails>(STORAGE_KEYS.STUDENTS, initialStudents);
    setStored(STORAGE_KEYS.STUDENTS, currentList.filter((s) => s.id !== id));
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
    let localFaculty = getStored<FacultyWithDetails>(STORAGE_KEYS.FACULTY, initialFaculty);

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('faculty')
          .select(`
            *,
            profile:profiles(*),
            department:departments(*)
          `)
          .order('created_at', { ascending: false });

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
          const remoteMap = new Map((data as FacultyWithDetails[]).map((f) => [f.id, f]));
          localFaculty.forEach((lf) => {
            if (!remoteMap.has(lf.id)) remoteMap.set(lf.id, lf);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.FACULTY, merged);
          localFaculty = merged;
        }
      } catch (e) {
        console.warn('[FACULTY] Query faculty fallback to mock:', e);
      }
    }

    let list = localFaculty;
    if (filters?.departmentId && filters.departmentId !== 'all') {
      list = list.filter((f) => f.department_id === filters.departmentId);
    }
    if (filters?.designation && filters.designation !== 'all') {
      list = list.filter((f) => f.designation === filters.designation);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((f) => f.status === filters.status);
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
    const list = getStored<FacultyWithDetails>(STORAGE_KEYS.FACULTY, initialFaculty);
    const found = list.find((f) => f.id === id || f.user_id === id);
    if (found) return found;

    if (isSupabaseConfigured && isValidUUID(id)) {
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
    const cleanEmail = (data.email || '').toLowerCase().trim();
    let profileId: string | null = null;
    let authUserCreated = false;

    // 1. Try finding existing profile or creating via auth client
    if (isSupabaseConfigured) {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingProfile?.id) {
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

            if (!authError && authData?.user?.id) {
              profileId = authData.user.id;
              authUserCreated = true;
            }
          }
        }
      } catch (e) {
        console.warn('[FACULTY] Auth signup exception, using resilient identifier:', e);
      }
    }

    // Resilient Fallback Profile ID
    if (!profileId) {
      profileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fac-usr-${Date.now()}`;
    }

    if (authUserCreated && isValidUUID(profileId)) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            status: data.status === 'active' ? 'active' : 'inactive',
            avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          })
          .eq('id', profileId);
      } catch (e) {
        console.warn('[FACULTY] Profile update warning:', e);
      }
    }

    // 2. Insert into DB if UUIDs are valid
    let dbData: any = null;
    if (isSupabaseConfigured && isValidUUID(profileId) && isValidUUID(data.departmentId)) {
      try {
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

        if (!facultyErr && facultyData) dbData = facultyData;
      } catch (e) {
        console.warn('[FACULTY] Remote DB insert failed, using persistent local store:', e);
      }
    }

    // 3. Resolve department details
    const depts = await academicStructureService.getDepartments();
    const deptObj = depts.find((d) => d.id === data.departmentId) || depts[0];

    const newFaculty: FacultyWithDetails = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fac-${Date.now()}`),
      user_id: profileId,
      employee_id: data.employeeId || `FAC-${Date.now().toString().slice(-4)}`,
      department_id: data.departmentId || deptObj?.id || 'dept-cse-01',
      designation: data.designation || 'Assistant Professor',
      specialization: data.qualification || 'Computer Science',
      joining_date: data.joiningDate || new Date().toISOString().split('T')[0],
      status: data.status || 'active',
      assigned_subject_count: 0,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
      profile: {
        id: profileId,
        full_name: data.fullName || 'Faculty Member',
        email: cleanEmail,
        role: 'faculty',
        phone: data.phone || null,
        status: data.status === 'active' ? 'active' : 'inactive',
        avatar_url: data.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      department: deptObj,
    };

    const currentList = getStored<FacultyWithDetails>(STORAGE_KEYS.FACULTY, initialFaculty);
    const updatedList = [newFaculty, ...currentList.filter((f) => f.id !== newFaculty.id && f.employee_id !== newFaculty.employee_id)];
    setStored(STORAGE_KEYS.FACULTY, updatedList);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'user',
      entity_id: newFaculty.id,
      entity_name: data.fullName || 'Faculty Member',
      description: `Registered faculty ${data.fullName} (${data.employeeId}).`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return newFaculty;
  },

  updateFaculty: async (id: string, data: Partial<FacultyFormData>): Promise<FacultyWithDetails> => {
    const current = await studentFacultyService.getFacultyById(id);
    if (!current) throw new Error('Faculty member not found');

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        if (current.user_id && isValidUUID(current.user_id) && (data.fullName || data.email || data.phone !== undefined || data.avatarUrl)) {
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
        if (data.departmentId && isValidUUID(data.departmentId)) updatePayload.department_id = data.departmentId;
        if (data.designation) updatePayload.designation = data.designation;
        if (data.qualification !== undefined) updatePayload.specialization = data.qualification;
        if (data.joiningDate) updatePayload.joining_date = data.joiningDate;
        if (data.status) updatePayload.status = data.status;

        await supabase.from('faculty').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('[FACULTY] Remote DB update warning:', e);
      }
    }

    const currentList = getStored<FacultyWithDetails>(STORAGE_KEYS.FACULTY, initialFaculty);
    const updatedFaculty: FacultyWithDetails = {
      ...current,
      ...(data.employeeId && { employee_id: data.employeeId }),
      ...(data.departmentId && { department_id: data.departmentId }),
      ...(data.designation && { designation: data.designation }),
      ...(data.qualification !== undefined && { specialization: data.qualification }),
      ...(data.joiningDate && { joining_date: data.joiningDate }),
      ...(data.status && { status: data.status }),
      profile: {
        ...current.profile,
        ...(data.fullName && { full_name: data.fullName }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl && { avatar_url: data.avatarUrl }),
      },
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.map((f) => (f.id === id ? updatedFaculty : f));
    setStored(STORAGE_KEYS.FACULTY, nextList);
    return updatedFaculty;
  },

  deleteFaculty: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('faculty').delete().eq('id', id);
      } catch (e) {
        console.warn('[FACULTY] Remote DB delete warning:', e);
      }
    }
    const currentList = getStored<FacultyWithDetails>(STORAGE_KEYS.FACULTY, initialFaculty);
    setStored(STORAGE_KEYS.FACULTY, currentList.filter((f) => f.id !== id));
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
    try {
      localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(initialFaculty));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    } catch (e) {
      // ignore
    }
  },
};
