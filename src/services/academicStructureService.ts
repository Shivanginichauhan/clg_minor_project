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
  FacultyWithDetails,
  initialDepartments,
  initialPrograms,
  initialSessions,
  initialSemesters,
  initialSubjects,
  initialAllocations,
  initialFaculty,
} from '../data/mockAcademics.js';
import { auditService } from './auditService.js';

export interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  head_of_department_id?: string;
}

export interface ProgramFormData {
  department_id: string;
  name: string;
  code: string;
  degree_level: string;
  duration_years?: number;
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
  semester_number?: number;
  lecture_hours?: number;
  tutorial_hours?: number;
  practical_hours?: number;
  max_internal_marks?: number;
  max_external_marks?: number;
  pass_percentage?: number;
}

export interface AllocationFormData {
  faculty_id: string;
  subject_id: string;
  session_id: string;
  semester_id?: string;
  role?: 'primary_instructor' | 'co_instructor' | 'lab_incharge';
  weekly_hours?: number;
}

// Helper to determine if a string is a standard UUID (PostgreSQL uuid compatibility guard)
export const isValidUUID = (id: any): boolean =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// Local Storage Persistent Stores
const STORAGE_KEYS = {
  DEPARTMENTS: 'ueams_academic_departments',
  PROGRAMS: 'ueams_academic_programs',
  SESSIONS: 'ueams_academic_sessions',
  SEMESTERS: 'ueams_academic_semesters',
  SUBJECTS: 'ueams_academic_subjects',
  ALLOCATIONS: 'ueams_academic_allocations',
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

export const academicStructureService = {
  // ==========================================
  // DEPARTMENTS
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    let localDepts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('departments').select('*').order('name');
        if (!error && data && data.length > 0) {
          // Merge remote with local store to preserve local modifications
          const remoteMap = new Map((data as Department[]).map((d) => [d.id, d]));
          localDepts.forEach((ld) => {
            if (!remoteMap.has(ld.id)) {
              remoteMap.set(ld.id, ld);
            }
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.DEPARTMENTS, merged);
          return merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase departments fetch fallback:', e);
      }
    }

    return localDepts;
  },

  createDepartment: async (dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> => {
    const code = dept.code.toUpperCase().trim();
    let dbData: any = null;

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {
          name: dept.name,
          code: code,
        };
        if (dept.description) payload.description = dept.description;
        if (dept.head_of_department_id && isValidUUID(dept.head_of_department_id)) {
          payload.head_of_department_id = dept.head_of_department_id;
        }

        const { data, error } = await supabase
          .from('departments')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          dbData = data;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createDepartment warning:', e);
      }
    }

    const newDept: Department = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dept-${code.toLowerCase()}-${Date.now()}`),
      name: dept.name,
      code: code,
      description: dept.description || '',
      head_of_department_id: dept.head_of_department_id || null,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
    };

    const currentList = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const updatedList = [newDept, ...currentList.filter((d) => d.id !== newDept.id && d.code !== newDept.code)];
    setStored(STORAGE_KEYS.DEPARTMENTS, updatedList);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'course',
      entity_id: newDept.id,
      entity_name: newDept.name,
      description: `Created new department: ${newDept.name} (${newDept.code})`,
      severity: 'info',
      user_id: 'system',
      user_name: 'Admin',
      role: 'administrator',
    });

    return newDept;
  },

  updateDepartment: async (id: string, updates: Partial<Department>): Promise<Department> => {
    const currentList = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const existing = currentList.find((d) => d.id === id);

    let dbData: any = null;
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const supabaseUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) supabaseUpdates.name = updates.name;
        if (updates.code !== undefined) supabaseUpdates.code = updates.code.toUpperCase();
        if (updates.description !== undefined) supabaseUpdates.description = updates.description;
        // Only pass head_of_department_id to Supabase if it's a valid UUID; otherwise null to avoid Postgres syntax error
        if (updates.head_of_department_id !== undefined) {
          supabaseUpdates.head_of_department_id = isValidUUID(updates.head_of_department_id)
            ? updates.head_of_department_id
            : null;
        }

        const { data, error } = await supabase
          .from('departments')
          .update(supabaseUpdates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase updateDepartment warning:', e);
      }
    }

    const updatedDept: Department = {
      ...(existing || {
        id,
        code: updates.code || 'DEPT',
        name: updates.name || 'Department',
        created_at: new Date().toISOString(),
      }),
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.map((d) => (d.id === id ? updatedDept : d));
    if (!nextList.some((d) => d.id === id)) {
      nextList.unshift(updatedDept);
    }
    setStored(STORAGE_KEYS.DEPARTMENTS, nextList);

    return updatedDept;
  },

  deleteDepartment: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('departments').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteDepartment warning:', e);
      }
    }
    const currentList = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    setStored(STORAGE_KEYS.DEPARTMENTS, currentList.filter((d) => d.id !== id));
    return true;
  },

  // ==========================================
  // PROGRAMS
  // ==========================================
  getPrograms: async (departmentId?: string): Promise<Program[]> => {
    let localProgs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const deptMap = new Map(depts.map((d) => [d.id, d]));

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('programs').select('*, department:departments(*)').order('name');
        if (departmentId && departmentId !== 'all') {
          query = query.eq('department_id', departmentId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const remoteMap = new Map((data as Program[]).map((p) => [p.id, p]));
          localProgs.forEach((lp) => {
            if (!remoteMap.has(lp.id)) remoteMap.set(lp.id, lp);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.PROGRAMS, merged);
          localProgs = merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase programs fetch fallback:', e);
      }
    }

    // Attach department reference if missing
    localProgs = localProgs.map((p) => ({
      ...p,
      department: (p as any).department || deptMap.get(p.department_id),
    }));

    if (departmentId && departmentId !== 'all') {
      return localProgs.filter((p) => p.department_id === departmentId);
    }
    return localProgs;
  },

  createProgram: async (prog: Omit<Program, 'id' | 'created_at' | 'updated_at'>): Promise<Program> => {
    let dbData: any = null;

    if (isSupabaseConfigured && isValidUUID(prog.department_id)) {
      try {
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

        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createProgram warning:', e);
      }
    }

    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const dept = depts.find((d) => d.id === prog.department_id);

    const newProg: Program = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prog-${prog.code.toLowerCase()}-${Date.now()}`),
      department_id: prog.department_id,
      name: prog.name,
      code: prog.code.toUpperCase(),
      degree_level: prog.degree_level || 'undergraduate',
      total_semesters: prog.total_semesters || 8,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
      department: dept,
    } as any;

    const currentList = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const updatedList = [newProg, ...currentList.filter((p) => p.id !== newProg.id)];
    setStored(STORAGE_KEYS.PROGRAMS, updatedList);

    return newProg;
  },

  updateProgram: async (id: string, updates: Partial<Program>): Promise<Program> => {
    const currentList = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const existing = currentList.find((p) => p.id === id);

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.code !== undefined) payload.code = updates.code.toUpperCase();
        if (updates.degree_level !== undefined) payload.degree_level = updates.degree_level;
        if (updates.total_semesters !== undefined) payload.total_semesters = updates.total_semesters;
        if (updates.department_id && isValidUUID(updates.department_id)) {
          payload.department_id = updates.department_id;
        }

        await supabase
          .from('programs')
          .update(payload)
          .eq('id', id)
          .select();
      } catch (e) {
        console.warn('[ACADEMICS] Supabase updateProgram warning:', e);
      }
    }

    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const targetDeptId = updates.department_id || existing?.department_id;
    const dept = depts.find((d) => d.id === targetDeptId);

    const updatedProg: Program = {
      ...(existing || {
        id,
        name: updates.name || 'Program',
        code: updates.code || 'PROG',
        department_id: targetDeptId || 'dept-cse-01',
        degree_level: 'undergraduate',
        total_semesters: 8,
        created_at: new Date().toISOString(),
      }),
      ...updates,
      id,
      department: dept || (existing as any)?.department,
      updated_at: new Date().toISOString(),
    } as any;

    const nextList = currentList.map((p) => (p.id === id ? updatedProg : p));
    if (!nextList.some((p) => p.id === id)) nextList.unshift(updatedProg);
    setStored(STORAGE_KEYS.PROGRAMS, nextList);

    return updatedProg;
  },

  deleteProgram: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('programs').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteProgram warning:', e);
      }
    }
    const currentList = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    setStored(STORAGE_KEYS.PROGRAMS, currentList.filter((p) => p.id !== id));
    return true;
  },

  // ==========================================
  // ACADEMIC SESSIONS
  // ==========================================
  getSessions: async (): Promise<AcademicSession[]> => {
    let localSessions = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('academic_sessions')
          .select('*')
          .order('start_date', { ascending: false });
        if (!error && data && data.length > 0) {
          const remoteMap = new Map((data as AcademicSession[]).map((s) => [s.id, s]));
          localSessions.forEach((ls) => {
            if (!remoteMap.has(ls.id)) remoteMap.set(ls.id, ls);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.SESSIONS, merged);
          return merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase sessions fallback:', e);
      }
    }

    return localSessions;
  },

  createSession: async (session: Omit<AcademicSession, 'id' | 'created_at' | 'updated_at'>): Promise<AcademicSession> => {
    let dbData: any = null;
    if (isSupabaseConfigured) {
      try {
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
        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createSession warning:', e);
      }
    }

    const newSession: AcademicSession = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`),
      name: session.name,
      start_date: session.start_date,
      end_date: session.end_date,
      is_current: Boolean(session.is_current),
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
    };

    const currentList = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const updatedList = [newSession, ...currentList.filter((s) => s.id !== newSession.id)];
    setStored(STORAGE_KEYS.SESSIONS, updatedList);
    return newSession;
  },

  updateSession: async (id: string, updates: Partial<AcademicSession>): Promise<AcademicSession> => {
    const currentList = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const existing = currentList.find((s) => s.id === id);

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase
          .from('academic_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase updateSession warning:', e);
      }
    }

    const updatedSession: AcademicSession = {
      ...(existing || {
        id,
        name: updates.name || 'Academic Session',
        start_date: '2025-07-01',
        end_date: '2026-06-30',
        is_current: true,
        created_at: new Date().toISOString(),
      }),
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    const nextList = currentList.map((s) => (s.id === id ? updatedSession : s));
    setStored(STORAGE_KEYS.SESSIONS, nextList);
    return updatedSession;
  },

  deleteSession: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('academic_sessions').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteSession warning:', e);
      }
    }
    const currentList = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    setStored(STORAGE_KEYS.SESSIONS, currentList.filter((s) => s.id !== id));
    return true;
  },

  // ==========================================
  // SEMESTERS
  // ==========================================
  getSemesters: async (programId?: string, sessionId?: string): Promise<Semester[]> => {
    let localSemesters = getStored<Semester>(STORAGE_KEYS.SEMESTERS, initialSemesters);
    const progs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const sessions = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const progMap = new Map(progs.map((p) => [p.id, p]));
    const sessMap = new Map(sessions.map((s) => [s.id, s]));

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('semesters')
          .select('*, program:programs(*), session:academic_sessions(*)')
          .order('semester_number', { ascending: true });

        if (programId && programId !== 'all') query = query.eq('program_id', programId);
        if (sessionId && sessionId !== 'all') query = query.eq('session_id', sessionId);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const remoteMap = new Map((data as Semester[]).map((s) => [s.id, s]));
          localSemesters.forEach((ls) => {
            if (!remoteMap.has(ls.id)) remoteMap.set(ls.id, ls);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.SEMESTERS, merged);
          localSemesters = merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase semesters fallback:', e);
      }
    }

    localSemesters = localSemesters.map((s) => ({
      ...s,
      program: (s as any).program || progMap.get(s.program_id),
      session: (s as any).session || sessMap.get(s.session_id),
    }));

    if (programId && programId !== 'all') {
      localSemesters = localSemesters.filter((s) => s.program_id === programId);
    }
    if (sessionId && sessionId !== 'all') {
      localSemesters = localSemesters.filter((s) => s.session_id === sessionId);
    }

    return localSemesters;
  },

  createSemester: async (sem: SemesterFormData): Promise<Semester> => {
    const semNumber = Number(sem.semester_number) || 1;
    const termType = sem.term_type || (semNumber % 2 === 1 ? 'odd' : 'even');
    const startDate = sem.start_date || new Date().toISOString().split('T')[0];
    let endDate = sem.end_date;
    if (!endDate || endDate <= startDate) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 6);
      endDate = d.toISOString().split('T')[0];
    }

    let dbData: any = null;
    if (isSupabaseConfigured && isValidUUID(sem.program_id) && isValidUUID(sem.session_id)) {
      try {
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
        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createSemester warning:', e);
      }
    }

    const progs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const sessions = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const prog = progs.find((p) => p.id === sem.program_id);
    const sess = sessions.find((s) => s.id === sem.session_id);

    const newSemester: Semester = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sem-${semNumber}-${Date.now()}`),
      program_id: sem.program_id,
      session_id: sem.session_id,
      semester_number: semNumber,
      term_type: termType,
      is_active: sem.is_active !== undefined ? Boolean(sem.is_active) : true,
      start_date: startDate,
      end_date: endDate,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
      program: prog,
      session: sess,
    } as any;

    const currentList = getStored<Semester>(STORAGE_KEYS.SEMESTERS, initialSemesters);
    const updatedList = [newSemester, ...currentList.filter((s) => s.id !== newSemester.id)];
    setStored(STORAGE_KEYS.SEMESTERS, updatedList);

    return newSemester;
  },

  updateSemester: async (id: string, updates: Partial<SemesterFormData>): Promise<Semester> => {
    const currentList = getStored<Semester>(STORAGE_KEYS.SEMESTERS, initialSemesters);
    const existing = currentList.find((s) => s.id === id);

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.program_id && isValidUUID(updates.program_id)) updatePayload.program_id = updates.program_id;
        if (updates.session_id && isValidUUID(updates.session_id)) updatePayload.session_id = updates.session_id;
        if (updates.semester_number !== undefined) updatePayload.semester_number = Number(updates.semester_number);
        if (updates.term_type !== undefined) updatePayload.term_type = updates.term_type;
        if (updates.start_date !== undefined) updatePayload.start_date = updates.start_date;
        if (updates.end_date !== undefined) updatePayload.end_date = updates.end_date;
        if (updates.is_active !== undefined) updatePayload.is_active = Boolean(updates.is_active);

        await supabase.from('semesters').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase updateSemester warning:', e);
      }
    }

    const updatedSemester: Semester = {
      ...(existing || {
        id,
        program_id: updates.program_id || 'prog-mca',
        session_id: updates.session_id || 'session-2025-26',
        semester_number: Number(updates.semester_number) || 1,
        term_type: updates.term_type || 'odd',
        is_active: true,
        start_date: '2025-07-01',
        end_date: '2025-12-31',
        created_at: new Date().toISOString(),
      }),
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    } as any;

    const nextList = currentList.map((s) => (s.id === id ? updatedSemester : s));
    setStored(STORAGE_KEYS.SEMESTERS, nextList);
    return updatedSemester;
  },

  deleteSemester: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('semesters').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteSemester warning:', e);
      }
    }
    const currentList = getStored<Semester>(STORAGE_KEYS.SEMESTERS, initialSemesters);
    setStored(STORAGE_KEYS.SEMESTERS, currentList.filter((s) => s.id !== id));
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
    let localSubjects = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const progs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const deptMap = new Map(depts.map((d) => [d.id, d]));
    const progMap = new Map(progs.map((p) => [p.id, p]));

    if (isSupabaseConfigured) {
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
        if (!error && data && data.length > 0) {
          const remoteMap = new Map((data as SubjectWithDetails[]).map((s) => [s.id, s]));
          localSubjects.forEach((ls) => {
            if (!remoteMap.has(ls.id)) remoteMap.set(ls.id, ls);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.SUBJECTS, merged);
          localSubjects = merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase subjects fallback:', e);
      }
    }

    localSubjects = localSubjects.map((s) => ({
      ...s,
      department: s.department || deptMap.get(s.department_id) || initialDepartments[0],
      program: s.program || progMap.get(s.program_id) || initialPrograms[0],
    }));

    let list = localSubjects;
    if (filters?.departmentId && filters.departmentId !== 'all') {
      list = list.filter((s) => s.department_id === filters.departmentId);
    }
    if (filters?.programId && filters.programId !== 'all') {
      list = list.filter((s) => s.program_id === filters.programId);
    }
    if (filters?.type && filters.type !== 'all') {
      list = list.filter((s) => s.type === filters.type);
    }
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
  },

  createSubject: async (subj: Omit<Subject, 'id' | 'created_at' | 'updated_at'>): Promise<SubjectWithDetails> => {
    let dbData: any = null;

    if (
      isSupabaseConfigured &&
      isValidUUID(subj.department_id) &&
      isValidUUID(subj.program_id)
    ) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            department_id: subj.department_id,
            program_id: subj.program_id,
            code: subj.code.toUpperCase(),
            name: subj.name,
            type: subj.type,
            credits: subj.credits,
            semester_number: (subj as any).semester_number || 1,
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

        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createSubject warning:', e);
      }
    }

    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const progs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const dept = depts.find((d) => d.id === subj.department_id) || depts[0];
    const prog = progs.find((p) => p.id === subj.program_id) || progs[0];

    const newSubject: SubjectWithDetails = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub-${subj.code.toLowerCase()}-${Date.now()}`),
      department_id: subj.department_id || dept?.id || 'dept-cse-01',
      program_id: subj.program_id || prog?.id || 'prog-mca-01',
      code: subj.code.toUpperCase(),
      name: subj.name,
      type: subj.type,
      credits: subj.credits,
      semester_number: (subj as any).semester_number || 1,
      max_internal_marks: subj.max_internal_marks || 30,
      max_external_marks: subj.max_external_marks || 70,
      pass_percentage: subj.pass_percentage || 40,
      created_at: dbData?.created_at || new Date().toISOString(),
      updated_at: dbData?.updated_at || new Date().toISOString(),
      department: dept,
      program: prog,
    };

    const currentList = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    const updatedList = [newSubject, ...currentList.filter((s) => s.id !== newSubject.id)];
    setStored(STORAGE_KEYS.SUBJECTS, updatedList);

    return newSubject;
  },

  updateSubject: async (id: string, updates: Partial<Subject>): Promise<SubjectWithDetails> => {
    const currentList = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    const existing = currentList.find((s) => s.id === id);

    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.code !== undefined) payload.code = updates.code.toUpperCase();
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.credits !== undefined) payload.credits = updates.credits;
        if ((updates as any).semester_number !== undefined) payload.semester_number = (updates as any).semester_number;
        if (updates.max_internal_marks !== undefined) payload.max_internal_marks = updates.max_internal_marks;
        if (updates.max_external_marks !== undefined) payload.max_external_marks = updates.max_external_marks;
        if (updates.pass_percentage !== undefined) payload.pass_percentage = updates.pass_percentage;
        if (updates.department_id && isValidUUID(updates.department_id)) payload.department_id = updates.department_id;
        if (updates.program_id && isValidUUID(updates.program_id)) payload.program_id = updates.program_id;

        await supabase.from('subjects').update(payload).eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase updateSubject warning:', e);
      }
    }

    const depts = getStored<Department>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    const progs = getStored<Program>(STORAGE_KEYS.PROGRAMS, initialPrograms);
    const deptId = updates.department_id || existing?.department_id;
    const progId = updates.program_id || existing?.program_id;

    const updatedSubj: SubjectWithDetails = {
      ...(existing || {
        id,
        department_id: deptId || 'dept-cse-01',
        program_id: progId || 'prog-mca-01',
        code: updates.code || 'SUBJ',
        name: updates.name || 'Subject',
        credits: updates.credits || 4,
        type: updates.type || 'theory',
        semester_number: 1,
        max_internal_marks: updates.max_internal_marks ?? 40,
        max_external_marks: updates.max_external_marks ?? 60,
        pass_percentage: updates.pass_percentage ?? 40,
        created_at: new Date().toISOString(),
      }),
      ...updates,
      id,
      department: depts.find((d) => d.id === deptId) || existing?.department || initialDepartments[0],
      program: progs.find((p) => p.id === progId) || existing?.program || initialPrograms[0],
      updated_at: new Date().toISOString(),
    } as SubjectWithDetails;

    const nextList = currentList.map((s) => (s.id === id ? updatedSubj : s));
    if (!nextList.some((s) => s.id === id)) nextList.unshift(updatedSubj);
    setStored(STORAGE_KEYS.SUBJECTS, nextList);

    return updatedSubj;
  },

  deleteSubject: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('subjects').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteSubject warning:', e);
      }
    }
    const currentList = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    setStored(STORAGE_KEYS.SUBJECTS, currentList.filter((s) => s.id !== id));
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
    let localAllocations = getStored<FacultyAllocationWithDetails>(STORAGE_KEYS.ALLOCATIONS, initialAllocations);
    const subjects = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    const sessions = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const subMap = new Map(subjects.map((s) => [s.id, s]));
    const sessMap = new Map(sessions.map((s) => [s.id, s]));

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('faculty_subject_allocations')
          .select(`
            *,
            faculty:faculty(*, profile:profiles(*), department:departments(*)),
            subject:subjects(*, department:departments(*), program:programs(*)),
            session:academic_sessions(*),
            semester:semesters(*)
          `);

        if (filters?.facultyId) query = query.eq('faculty_id', filters.facultyId);
        if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
        if (filters?.sessionId) query = query.eq('session_id', filters.sessionId);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const remoteMap = new Map((data as FacultyAllocationWithDetails[]).map((a) => [a.id, a]));
          localAllocations.forEach((la) => {
            if (!remoteMap.has(la.id)) remoteMap.set(la.id, la);
          });
          const merged = Array.from(remoteMap.values());
          setStored(STORAGE_KEYS.ALLOCATIONS, merged);
          localAllocations = merged;
        }
      } catch (e) {
        console.warn('[ACADEMICS] Supabase allocations fallback:', e);
      }
    }

    // Hydrate missing relations from local stores
    localAllocations = localAllocations.map((alloc) => {
      let faculty = alloc.faculty;
      if (!faculty) {
        const storedFac = getStored<FacultyWithDetails>('ueams_faculty_records', initialFaculty);
        faculty = storedFac.find((f) => f.id === alloc.faculty_id || f.user_id === alloc.faculty_id) || initialFaculty[0];
      }
      const subject = alloc.subject || subMap.get(alloc.subject_id) || initialSubjects[0];
      const session = alloc.session || sessMap.get(alloc.session_id) || initialSessions[0];

      return {
        ...alloc,
        faculty,
        subject,
        session,
      };
    });

    let list = localAllocations;
    if (filters?.facultyId && filters.facultyId !== 'all') {
      list = list.filter((a) => a.faculty_id === filters.facultyId);
    }
    if (filters?.subjectId && filters.subjectId !== 'all') {
      list = list.filter((a) => a.subject_id === filters.subjectId);
    }
    if (filters?.sessionId && filters.sessionId !== 'all') {
      list = list.filter((a) => a.session_id === filters.sessionId);
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
    let dbData: any = null;

    if (
      isSupabaseConfigured &&
      isValidUUID(alloc.faculty_id) &&
      isValidUUID(alloc.subject_id) &&
      isValidUUID(alloc.session_id)
    ) {
      try {
        const { data, error } = await supabase
          .from('faculty_subject_allocations')
          .insert({
            faculty_id: alloc.faculty_id,
            subject_id: alloc.subject_id,
            session_id: alloc.session_id,
            semester_id: alloc.semester_id && isValidUUID(alloc.semester_id) ? alloc.semester_id : null,
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

        if (!error && data) dbData = data;
      } catch (e) {
        console.warn('[ACADEMICS] Supabase createAllocation warning:', e);
      }
    }

    // Resolve entities for complete UI presentation
    const storedFaculty = getStored<FacultyWithDetails>('ueams_faculty_records', initialFaculty);
    const facultyObj =
      storedFaculty.find((f) => f.id === alloc.faculty_id || f.user_id === alloc.faculty_id) ||
      initialFaculty.find((f) => f.id === alloc.faculty_id || f.user_id === alloc.faculty_id) ||
      initialFaculty[0];

    const storedSubjects = getStored<SubjectWithDetails>(STORAGE_KEYS.SUBJECTS, initialSubjects);
    const subjectObj = storedSubjects.find((s) => s.id === alloc.subject_id) || initialSubjects[0];

    const storedSessions = getStored<AcademicSession>(STORAGE_KEYS.SESSIONS, initialSessions);
    const sessionObj = storedSessions.find((s) => s.id === alloc.session_id) || initialSessions[0];

    const newAllocation: FacultyAllocationWithDetails = {
      id: dbData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `alloc-${Date.now()}`),
      faculty_id: alloc.faculty_id,
      subject_id: alloc.subject_id,
      session_id: alloc.session_id,
      semester_id: alloc.semester_id,
      role: alloc.role || 'primary_instructor',
      weekly_hours: alloc.weekly_hours || 4,
      assigned_at: new Date().toISOString(),
      faculty: facultyObj,
      subject: subjectObj,
      session: sessionObj,
    };

    const currentList = getStored<FacultyAllocationWithDetails>(STORAGE_KEYS.ALLOCATIONS, initialAllocations);
    const updatedList = [newAllocation, ...currentList.filter((a) => a.id !== newAllocation.id)];
    setStored(STORAGE_KEYS.ALLOCATIONS, updatedList);

    return newAllocation;
  },

  deleteAllocation: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured && isValidUUID(id)) {
      try {
        await supabase.from('faculty_subject_allocations').delete().eq('id', id);
      } catch (e) {
        console.warn('[ACADEMICS] Supabase deleteAllocation warning:', e);
      }
    }
    const currentList = getStored<FacultyAllocationWithDetails>(STORAGE_KEYS.ALLOCATIONS, initialAllocations);
    setStored(STORAGE_KEYS.ALLOCATIONS, currentList.filter((a) => a.id !== id));
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
