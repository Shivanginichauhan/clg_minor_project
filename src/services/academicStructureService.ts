import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  Department,
  Program,
  AcademicSession,
  Semester,
  Subject,
} from '../types/database.types.js';
import {
  SubjectWithDetails,
  FacultyAllocationWithDetails,
  initialAllocations,
} from '../data/mockAcademics.js';
import { auditService } from './auditService.js';

export interface DepartmentFormData {
  name: string;
  code: string;
}

export interface ProgramFormData {
  department_id: string;
  name: string;
  code: string;
  degree_level: string;
  duration_years: number;
  total_semesters: number;
}

export interface SemesterFormData {
  program_id: string;
  session_id: string;
  semester_number: number;
  term_type?: 'odd' | 'even' | 'summer';
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface SubjectFormData {
  program_id: string;
  department_id?: string;
  name: string;
  code: string;
  credits: number;
  type: string;
  lecture_hours?: number;
  tutorial_hours?: number;
  practical_hours?: number;
  max_internal_marks?: number;
  max_external_marks?: number;
  pass_marks?: number;
}

export interface AllocationFormData {
  faculty_id: string;
  subject_id: string;
  session_id: string;
  semester_id?: string;
  role?: 'primary_instructor' | 'co_instructor' | 'lab_incharge';
  weekly_hours?: number;
}

export const academicStructureService = {
  // ==========================================
  // DEPARTMENTS
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) {
        console.error('[ACADEMICS] Error fetching departments:', error.message);
        return [];
      }
      return (data || []) as Department[];
    } catch (e) {
      console.error('[ACADEMICS] Exception fetching departments:', e);
      return [];
    }
  },

  createDepartment: async (dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: dept.name,
        code: dept.code.toUpperCase(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create department: ${error.message}`);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'course',
      entity_id: data.id,
      entity_name: data.name,
      description: `Created new department: ${data.name} (${data.code})`,
      severity: 'info',
      user_id: 'system',
      user_name: 'Admin',
      role: 'administrator',
    });

    return data as Department;
  },

  updateDepartment: async (id: string, updates: Partial<Department>): Promise<Department> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('departments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update department: ${error.message}`);
    return data as Department;
  },

  deleteDepartment: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete department: ${error.message}`);
    return true;
  },

  // ==========================================
  // PROGRAMS
  // ==========================================
  getPrograms: async (departmentId?: string): Promise<Program[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase.from('programs').select('*, department:departments(*)').order('name');
      if (departmentId && departmentId !== 'all') {
        query = query.eq('department_id', departmentId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[ACADEMICS] Error fetching programs:', error.message);
        return [];
      }
      return (data || []) as Program[];
    } catch (e) {
      console.error('[ACADEMICS] Exception fetching programs:', e);
      return [];
    }
  },

  createProgram: async (prog: Omit<Program, 'id' | 'created_at' | 'updated_at'>): Promise<Program> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('programs')
      .insert({
        department_id: prog.department_id,
        name: prog.name,
        code: prog.code.toUpperCase(),
        degree_level: prog.degree_level || 'undergraduate',
        total_semesters: prog.total_semesters || 8,
      })
      .select('*, department:departments(*)')
      .single();

    if (error) throw new Error(`Failed to create program: ${error.message}`);
    return data as Program;
  },

  updateProgram: async (id: string, updates: Partial<Program>): Promise<Program> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('programs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, department:departments(*)')
      .single();

    if (error) throw new Error(`Failed to update program: ${error.message}`);
    return data as Program;
  },

  deleteProgram: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete program: ${error.message}`);
    return true;
  },

  // ==========================================
  // ACADEMIC SESSIONS
  // ==========================================
  getSessions: async (): Promise<AcademicSession[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) {
        console.error('[ACADEMICS] Error fetching sessions:', error.message);
        return [];
      }
      return (data || []) as AcademicSession[];
    } catch (e) {
      console.error('[ACADEMICS] Exception fetching sessions:', e);
      return [];
    }
  },

  createSession: async (session: Omit<AcademicSession, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicSession> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('academic_sessions')
      .insert({
        name: session.name,
        start_date: session.start_date,
        end_date: session.end_date,
        is_current: Boolean(session.is_current),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create academic session: ${error.message}`);
    return data as AcademicSession;
  },

  updateSession: async (id: string, updates: Partial<AcademicSession>): Promise<AcademicSession> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('academic_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update academic session: ${error.message}`);
    return data as AcademicSession;
  },

  deleteSession: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('academic_sessions').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete session: ${error.message}`);
    return true;
  },

  // ==========================================
  // SEMESTERS
  // ==========================================
  getSemesters: async (programId?: string, sessionId?: string): Promise<Semester[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase
        .from('semesters')
        .select('*, program:programs(*), session:academic_sessions(*)')
        .order('semester_number', { ascending: true });

      if (programId && programId !== 'all') {
        query = query.eq('program_id', programId);
      }
      if (sessionId && sessionId !== 'all') {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[ACADEMICS] Error fetching semesters:', error.message);
        return [];
      }
      return (data || []) as Semester[];
    } catch (e) {
      console.error('[ACADEMICS] Exception fetching semesters:', e);
      return [];
    }
  },

  createSemester: async (sem: SemesterFormData): Promise<Semester> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const semNumber = Number(sem.semester_number) || 1;
    const termType = sem.term_type || (semNumber % 2 === 1 ? 'odd' : 'even');
    const startDate = sem.start_date || new Date().toISOString().split('T')[0];
    let endDate = sem.end_date;
    if (!endDate || endDate <= startDate) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 6);
      endDate = d.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('semesters')
      .insert({
        program_id: sem.program_id,
        session_id: sem.session_id,
        semester_number: semNumber,
        term_type: termType,
        is_active: sem.is_active !== undefined ? Boolean(sem.is_active) : true,
        start_date: startDate,
        end_date: endDate,
      })
      .select('*, program:programs(*), session:academic_sessions(*)')
      .single();

    if (error) throw new Error(`Failed to create semester: ${error.message}`);

    auditService.logAction({
      action: 'CREATE',
      entity_type: 'course',
      entity_id: (data as any)?.id || '',
      entity_name: `Semester ${semNumber}`,
      description: `Created Semester ${semNumber} (${termType})`,
      severity: 'info',
    });

    return data as Semester;
  },

  updateSemester: async (id: string, updates: Partial<SemesterFormData>): Promise<Semester> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.program_id !== undefined) updatePayload.program_id = updates.program_id;
    if (updates.session_id !== undefined) updatePayload.session_id = updates.session_id;
    if (updates.semester_number !== undefined) updatePayload.semester_number = Number(updates.semester_number);
    if (updates.term_type !== undefined) updatePayload.term_type = updates.term_type;
    if (updates.start_date !== undefined) updatePayload.start_date = updates.start_date;
    if (updates.end_date !== undefined) updatePayload.end_date = updates.end_date;
    if (updates.is_active !== undefined) updatePayload.is_active = Boolean(updates.is_active);

    const { data, error } = await supabase
      .from('semesters')
      .update(updatePayload)
      .eq('id', id)
      .select('*, program:programs(*), session:academic_sessions(*)')
      .single();

    if (error) throw new Error(`Failed to update semester: ${error.message}`);
    return data as Semester;
  },

  deleteSemester: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('semesters').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete semester: ${error.message}`);
    return true;
  },

  // ==========================================
  // SUBJECTS
  // ==========================================
  getSubjects: async (filters?: {
    departmentId?: string;
    programId?: string;
    type?: string;
    search?: string;
  }): Promise<SubjectWithDetails[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          department:departments(*),
          program:programs(*)
        `)
        .order('code', { ascending: true });

      if (filters?.departmentId && filters.departmentId !== 'all') {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.programId && filters.programId !== 'all') {
        query = query.eq('program_id', filters.programId);
      }
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[ACADEMICS] Error fetching subjects:', error.message);
        return [];
      }

      let list = (data || []) as SubjectWithDetails[];
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.department?.name?.toLowerCase().includes(q) ||
            s.program?.name?.toLowerCase().includes(q)
        );
      }
      return list;
    } catch (e) {
      console.error('[ACADEMICS] Exception fetching subjects:', e);
      return [];
    }
  },

  createSubject: async (subj: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<SubjectWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        department_id: subj.department_id,
        program_id: subj.program_id,
        code: subj.code.toUpperCase(),
        name: subj.name,
        type: subj.type,
        credits: subj.credits,
        semester_number: subj.semester_number || 1,
        max_internal_marks: subj.max_internal_marks || 30,
        max_external_marks: subj.max_external_marks || 70,
        pass_percentage: subj.pass_percentage || 40,
      })
      .select(`
        *,
        department:departments(*),
        program:programs(*)
      `)
      .single();

    if (error) throw new Error(`Failed to create subject: ${error.message}`);
    return data as SubjectWithDetails;
  },

  updateSubject: async (id: string, updates: Partial<Subject>): Promise<SubjectWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('subjects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        department:departments(*),
        program:programs(*)
      `)
      .single();

    if (error) throw new Error(`Failed to update subject: ${error.message}`);
    return data as SubjectWithDetails;
  },

  deleteSubject: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete subject: ${error.message}`);
    return true;
  },

  // ==========================================
  // FACULTY ALLOCATIONS
  // ==========================================
  getAllocations: async (filters?: {
    facultyId?: string;
    subjectId?: string;
    sessionId?: string;
  }): Promise<FacultyAllocationWithDetails[]> => {
    let list: FacultyAllocationWithDetails[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('faculty_subject_allocations')
          .select(`
            *,
            faculty:faculty(*, department:departments(*)),
            subject:subjects(*, department:departments(*), program:programs(*)),
            session:academic_sessions(*),
            semester:semesters(*)
          `);

        if (filters?.facultyId) {
          query = query.eq('faculty_id', filters.facultyId);
        }
        if (filters?.subjectId) {
          query = query.eq('subject_id', filters.subjectId);
        }
        if (filters?.sessionId) {
          query = query.eq('session_id', filters.sessionId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data as FacultyAllocationWithDetails[];
        } else if (error) {
          console.warn('[ACADEMICS] Supabase allocations notice (falling back to mock):', error.message);
        }
      } catch (e) {
        console.warn('[ACADEMICS] Exception fetching allocations, falling back to mock:', e);
      }
    }

    if (list.length === 0) {
      list = [...initialAllocations];
      if (filters?.facultyId) {
        list = list.filter((a) => a.faculty_id === filters.facultyId || a.faculty_id === 'fac-001');
      }
      if (filters?.subjectId) {
        list = list.filter((a) => a.subject_id === filters.subjectId);
      }
      if (filters?.sessionId) {
        list = list.filter((a) => a.session_id === filters.sessionId);
      }
    }

    return list;
  },

  createAllocation: async (alloc: {
    faculty_id: string;
    subject_id: string;
    session_id: string;
    semester_id?: string;
    role?: 'primary_instructor' | 'co_instructor' | 'lab_incharge';
    weekly_hours?: number;
  }): Promise<FacultyAllocationWithDetails> => {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');
    const { data, error } = await supabase
      .from('faculty_subject_allocations')
      .insert({
        faculty_id: alloc.faculty_id,
        subject_id: alloc.subject_id,
        session_id: alloc.session_id,
        semester_id: alloc.semester_id || null,
        role: alloc.role || 'primary_instructor',
        weekly_hours: alloc.weekly_hours || 4,
      })
      .select(`
        *,
        faculty:faculty(*, profile:profiles(*)),
        subject:subjects(*),
        session:academic_sessions(*)
      `)
      .single();

    if (error) throw new Error(`Failed to assign faculty: ${error.message}`);
    return data as FacultyAllocationWithDetails;
  },

  deleteAllocation: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('faculty_subject_allocations').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete allocation: ${error.message}`);
    return true;
  },

  getProgramCurriculumSummary: async (programId: string): Promise<any> => {
    const subjects = await academicStructureService.getSubjects({ programId });
    let totalCredits = 0;
    let theoryCredits = 0;
    let practicalCredits = 0;
    let electiveCredits = 0;
    let projectCredits = 0;
    let maxTotalMarks = 0;
    const semesters: Record<number, any[]> = {};

    subjects.forEach((s) => {
      const cr = s.credits || 0;
      totalCredits += cr;
      if (s.type === 'theory') theoryCredits += cr;
      else if (s.type === 'practical') practicalCredits += cr;
      else if (s.type === 'elective') electiveCredits += cr;
      else if (s.type === 'project') projectCredits += cr;
      else theoryCredits += cr;

      maxTotalMarks += (s.max_internal_marks || 0) + (s.max_external_marks || 0);

      const semNum = (s as any).semester_number || 1;
      if (!semesters[semNum]) semesters[semNum] = [];
      semesters[semNum].push(s);
    });

    return {
      totalCredits,
      theoryCredits,
      practicalCredits,
      electiveCredits,
      projectCredits,
      totalSubjects: subjects.length,
      maxTotalMarks: maxTotalMarks || subjects.length * 100,
      semesters,
    };
  },

  saveDepartment: async (idOrData: string | null | any, data?: any): Promise<any> => {
    if (typeof idOrData === 'string') {
      return academicStructureService.updateDepartment(idOrData, data);
    }
    const payload = data || idOrData;
    if (payload?.id) {
      return academicStructureService.updateDepartment(payload.id, payload);
    }
    return academicStructureService.createDepartment(payload);
  },

  saveProgram: async (idOrData: string | null | any, data?: any): Promise<any> => {
    if (typeof idOrData === 'string') {
      return academicStructureService.updateProgram(idOrData, data);
    }
    const payload = data || idOrData;
    if (payload?.id) {
      return academicStructureService.updateProgram(payload.id, payload);
    }
    return academicStructureService.createProgram(payload);
  },

  saveSession: async (idOrData: string | null | any, data?: any): Promise<any> => {
    const payload = data || idOrData;
    return academicStructureService.createSession(payload);
  },

  saveSubject: async (idOrData: string | null | any, data?: any): Promise<any> => {
    if (typeof idOrData === 'string') {
      return academicStructureService.updateSubject(idOrData, data);
    }
    const payload = data || idOrData;
    if (payload?.id) {
      return academicStructureService.updateSubject(payload.id, payload);
    }
    return academicStructureService.createSubject(payload);
  },

  saveAllocation: async (alloc: any): Promise<any> => {
    return academicStructureService.createAllocation(alloc);
  },
};
