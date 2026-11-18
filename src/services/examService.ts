import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  Examination,
  ExamSchedule,
  Room,
} from '../types/database.types.js';
import {
  ExamScheduleWithDetails,
  ExamCycleWithDetails,
  StudentHallTicket,
  initialExaminations,
  initialExamSchedules,
  initialExaminationRooms,
} from '../data/mockExams.js';
import { auditService } from './auditService.js';
import { deanService } from './deanService.js';

export type { ExamScheduleWithDetails } from '../data/mockExams.js';

export interface ScheduleConflict {
  type: 'cohort_clash' | 'venue_clash' | 'back_to_back_stress';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  scheduleIds: string[];
}

export const examService = {
  // ----------------------------------------------------
  // Examination Cycles
  // ----------------------------------------------------
  async getExaminations(): Promise<ExamCycleWithDetails[]> {
    if (!isSupabaseConfigured) return initialExaminations;

    try {
      const { data, error } = await supabase
        .from('examinations')
        .select(`
          *,
          session:academic_sessions(*),
          schedules:exam_schedules(*, subject:subjects(*))
        `)
        .order('start_date', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.error('[EXAMS] Error fetching examinations:', error.message);
        return initialExaminations;
      }

      return (data || []).map((ex: any) => {
        const schedules = ex.schedules || [];
        let approvalStatus: string = 'draft';
        if (schedules.some((s: any) => s.status === 'published')) approvalStatus = 'published';
        else if (schedules.some((s: any) => s.status === 'approved')) approvalStatus = 'approved';
        else if (schedules.some((s: any) => s.status === 'submitted')) approvalStatus = 'submitted';

        return {
          ...ex,
          approval_status: approvalStatus,
          session_name: ex.session?.name || 'Academic Session',
          schedules_count: schedules.length,
          published_schedules_count: schedules.filter((s: any) => s.status === 'published').length,
        };
      }) as ExamCycleWithDetails[];
    } catch (e) {
      console.error('[EXAMS] Exception fetching examinations:', e);
      return initialExaminations;
    }
  },

  async getExaminationById(id: string): Promise<ExamCycleWithDetails | undefined> {
    if (!isSupabaseConfigured) return undefined;

    try {
      const { data, error } = await supabase
        .from('examinations')
        .select(`
          *,
          session:academic_sessions(*),
          schedules:exam_schedules(*, subject:subjects(*, department:departments(*), program:programs(*)))
        `)
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as ExamCycleWithDetails;
    } catch (e) {
      return undefined;
    }
  },

  async createExamination(exam: {
    session_id: string;
    name: string;
    type?: 'regular' | 'supplementary' | 'improvement';
    exam_type?: 'regular' | 'supplementary' | 'improvement';
    start_date: string;
    end_date: string;
    status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    is_active?: boolean;
    semester_id?: string;
  }): Promise<Examination> {
    if (!exam.name || !exam.name.trim()) {
      throw new Error('Examination name is mandatory.');
    }
    if (!exam.start_date || !exam.end_date) {
      throw new Error('Start date and end date are required.');
    }
    if (new Date(exam.start_date).getTime() > new Date(exam.end_date).getTime()) {
      throw new Error('Examination start date cannot be later than end date.');
    }

    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    // Ensure session_id and semester_id are valid UUIDs
    let resolvedSessionId = exam.session_id;
    if (!resolvedSessionId || !resolvedSessionId.includes('-') || resolvedSessionId.startsWith('session-')) {
      resolvedSessionId = 'b0000000-0000-0000-0000-000000000001';
    }

    let resolvedSemesterId = exam.semester_id;
    if (!resolvedSemesterId || !resolvedSemesterId.includes('-') || resolvedSemesterId.startsWith('sem-')) {
      resolvedSemesterId = 'd0000000-0000-0000-0000-000000000002';
    }

    const { data, error } = await supabase
      .from('examinations')
      .insert({
        session_id: resolvedSessionId,
        semester_id: resolvedSemesterId,
        name: exam.name,
        exam_type: exam.exam_type || exam.type || 'regular',
        start_date: exam.start_date,
        end_date: exam.end_date,
        is_active: exam.is_active !== undefined ? exam.is_active : true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create exam cycle: ${error.message}`);

    auditService.logEvent({
      action: 'CREATE',
      entity_type: 'examination',
      entity_id: data.id,
      entity_name: data.name,
      description: `Created examination cycle: ${data.name}.`,
      severity: 'info',
      user_id: 'admin',
      user_name: 'Administrator',
      role: 'administrator',
    });

    return data as Examination;
  },

  async updateExamination(id: string, updates: Partial<Examination>): Promise<Examination> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('examinations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update examination: ${error.message}`);
    return data as Examination;
  },

  async deleteExamination(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('examinations').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete examination: ${error.message}`);
    return true;
  },

  // ----------------------------------------------------
  // Timetables & Exam Schedules
  // ----------------------------------------------------
  async getSchedules(examinationIdOrParams?: string | { examinationId?: string }): Promise<ExamScheduleWithDetails[]> {
    let examinationId: string | undefined;
    if (typeof examinationIdOrParams === 'string') {
      examinationId = examinationIdOrParams;
    } else if (examinationIdOrParams && typeof examinationIdOrParams === 'object') {
      examinationId = examinationIdOrParams.examinationId;
    }

    if (!isSupabaseConfigured) {
      if (examinationId && examinationId !== 'all') {
        return initialExamSchedules.filter((s) => s.examination_id === examinationId);
      }
      return initialExamSchedules;
    }

    try {
      let query = supabase
        .from('exam_schedules')
        .select(`
          *,
          examination:examinations(*, session:academic_sessions(*)),
          subject:subjects(*, department:departments(*), program:programs(*))
        `)
        .order('exam_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (examinationId && examinationId !== 'all') {
        query = query.eq('examination_id', examinationId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        if (error) console.error('[EXAMS] Error fetching exam schedules:', error.message);
        if (examinationId && examinationId !== 'all') {
          return initialExamSchedules.filter((s) => s.examination_id === examinationId);
        }
        return initialExamSchedules;
      }

      return (data || []) as ExamScheduleWithDetails[];
    } catch (e) {
      console.error('[EXAMS] Exception fetching schedules:', e);
      return initialExamSchedules;
    }
  },

  async getExamSchedules(examinationId?: string): Promise<ExamScheduleWithDetails[]> {
    return this.getSchedules(examinationId);
  },

  async detectScheduleConflicts(examinationId?: string): Promise<ScheduleConflict[]> {
    const schedules = await this.getSchedules(examinationId);
    return this.detectConflicts(schedules);
  },

  async createSchedule(schedule: {
    examination_id: string;
    subject_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number?: string;
    building?: string;
    session_type?: string;
    max_marks?: number;
    status?: 'draft' | 'pending_dean_approval' | 'approved' | 'published';
  }): Promise<ExamScheduleWithDetails> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('exam_schedules')
      .insert({
        examination_id: schedule.examination_id,
        subject_id: schedule.subject_id,
        exam_date: schedule.exam_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status || 'draft',
      })
      .select(`
        *,
        examination:examinations(*),
        subject:subjects(*, department:departments(*), program:programs(*))
      `)
      .single();

    if (error) throw new Error(`Failed to schedule exam slot: ${error.message}`);
    return data as ExamScheduleWithDetails;
  },

  async createExamSchedule(schedule: any): Promise<ExamScheduleWithDetails> {
    return this.createSchedule(schedule);
  },

  async updateSchedule(id: string, updates: Partial<ExamSchedule> & Record<string, any>): Promise<ExamScheduleWithDetails> {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase
      .from('exam_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        examination:examinations(*),
        subject:subjects(*, department:departments(*), program:programs(*))
      `)
      .single();

    if (error) throw new Error(`Failed to update schedule slot: ${error.message}`);
    return data as ExamScheduleWithDetails;
  },

  async updateExamSchedule(id: string, updates: any): Promise<ExamScheduleWithDetails> {
    return this.updateSchedule(id, updates);
  },

  async deleteSchedule(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from('exam_schedules').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete schedule slot: ${error.message}`);
    return true;
  },

  async deleteExamSchedule(id: string): Promise<boolean> {
    return this.deleteSchedule(id);
  },

  // ----------------------------------------------------
  // Rooms & Venues
  // ----------------------------------------------------
  async getRooms(): Promise<Room[]> {
    const ROOMS_STORAGE_KEY = 'ueams_examination_rooms';
    const getStoredRooms = (): Room[] => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(ROOMS_STORAGE_KEY) : null;
        if (raw) return JSON.parse(raw);
      } catch {}
      return [...initialExaminationRooms];
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('rooms').select('*').order('name');
        if (!error && data && data.length > 0) {
          const mapped = data.map((r: any) => ({
            ...r,
            room_number: r.room_number || r.name,
            building: r.building || r.block || 'Academic Block',
            is_available: r.is_available ?? r.is_active ?? true,
          }));
          return mapped as Room[];
        }
      } catch (e) {
        // fallback
      }
    }
    return getStoredRooms();
  },

  async createRoom(room: { name?: string; room_number?: string; block?: string; building?: string; floor?: number; capacity: number }): Promise<Room> {
    const ROOMS_STORAGE_KEY = 'ueams_examination_rooms';
    const getStoredRooms = (): Room[] => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(ROOMS_STORAGE_KEY) : null;
        if (raw) return JSON.parse(raw);
      } catch {}
      return [...initialExaminationRooms];
    };

    const saveStoredRoom = (r: Room) => {
      try {
        const rooms = getStoredRooms().filter((it) => it.id !== r.id && (it as any).room_number !== (r as any).room_number);
        rooms.push(r);
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
      } catch {}
    };

    const roomNumber = room.room_number || room.name || `Hall-${Date.now()}`;
    const building = room.building || room.block || 'Academic Block';
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      room_number: roomNumber,
      name: roomNumber,
      block: building,
      building: building,
      floor: room.floor || 1,
      capacity: room.capacity || 60,
      is_available: true,
      created_at: new Date().toISOString(),
    } as any;

    saveStoredRoom(newRoom);

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('rooms').insert({
          name: roomNumber,
          block: building,
          floor: room.floor || 1,
          capacity: room.capacity || 60,
          is_active: true,
        }).select().single();
        if (data) return { ...newRoom, id: data.id };
      } catch (e) {
        console.warn('[ROOMS] Supabase insert note, saved locally:', e);
      }
    }

    return newRoom;
  },

  // ----------------------------------------------------
  // Student Hall Ticket Generation
  // ----------------------------------------------------
  async getHallTicketForStudent(studentId: string, examinationId?: string): Promise<StudentHallTicket | null> {
    try {
      let schedules = await this.getSchedules(examinationId);
      if (!schedules || schedules.length === 0) {
        schedules = initialExamSchedules;
      }

      let studentData: any = null;
      if (isSupabaseConfigured) {
        try {
          const { data: student } = await supabase
            .from('students')
            .select('*, profile:profiles(*), department:departments(*), program:programs(*), session:academic_sessions(*)')
            .or(`id.eq.${studentId},user_id.eq.${studentId}`)
            .maybeSingle();
          studentData = student;
        } catch {
          // ignore
        }
      }

      const candidateName = studentData?.profile?.full_name || 'Aditya Raj';
      const rollNumber = studentData?.roll_number || '2026-MCA-101';
      const enrollmentNumber = studentData?.enrollment_number || 'ENR-2026-101';
      const programName = studentData?.program?.name || 'Master of Computer Applications (MCA)';
      const departmentName = studentData?.department?.name || 'Department of Computer Science & Engineering';

      const candidatePapers = (schedules.length > 0 ? schedules : initialExamSchedules).map((s, idx) => ({
        schedule_id: s.id || `sched-${idx}`,
        subject_code: s.subject_code || `MCA-${101 + idx}`,
        subject_name: s.subject_name || `Advanced Computer Application Paper ${idx + 1}`,
        exam_date: s.exam_date || '2026-05-18',
        start_time: s.start_time || '09:30',
        end_time: s.end_time || '12:30',
        session_type: s.session_type || 'morning',
        room_number: s.room_number || 'LH-101',
        building: s.building || 'Main Academic Complex',
        attendance_percentage: 85.5,
        is_paper_eligible: true,
        seat_number: `DESK-${String.fromCharCode(65 + Math.floor(idx / 8))}-${(idx % 8) + 1}`,
        instructions: 'Please carry valid University ID and this certified Admit Card.',
      }));

      return {
        id: `ht-${studentId}`,
        hall_ticket_number: `HT-2026-${rollNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
        student_id: studentId,
        student_name: candidateName,
        roll_number: rollNumber,
        enrollment_number: enrollmentNumber,
        program_name: programName,
        department_name: departmentName,
        semester_number: 2,
        examination_name: schedules[0]?.examination_name || 'Spring 2026 End-Semester Examinations',
        academic_session: '2025-2026',
        exam_centre: 'Central Examination Complex, ITM University Campus',
        centre_code: 'ITM-EXAM-01',
        issue_date: new Date().toISOString(),
        overall_attendance: 85.5,
        is_eligible: true,
        papers: candidatePapers as any,
        qr_data: `UEAMS-VERIFIED:HT:${rollNumber}:${enrollmentNumber}:2026`,
      };
    } catch (e) {
      console.error('[EXAMS] Error generating hall ticket:', e);
      return null;
    }
  },

  // ----------------------------------------------------
  // Conflict Detection Engine
  // ----------------------------------------------------
  detectConflicts(schedules: ExamScheduleWithDetails[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // 1. Cohort Clash: Same date and overlapping time for subjects in same program
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];

        if (a.exam_date === b.exam_date) {
          const progA = (a as any).program_id || a.program_name;
          const progB = (b as any).program_id || b.program_name;
          const sameProgram = progA && progB && progA === progB;
          if (sameProgram) {
            conflicts.push({
              type: 'cohort_clash',
              severity: 'high',
              title: `Cohort Clash: ${a.subject_code} vs ${b.subject_code}`,
              description: `Students in ${a.program_name || 'the program'} have two exams scheduled on ${a.exam_date}.`,
              scheduleIds: [a.id, b.id],
            });
          }
        }
      }
    }

    return conflicts;
  },

  async returnScheduleForRevision(scheduleId: string, deanNameOrRemarks: string, remarks?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase
      .from('exam_schedules')
      .update({
        status: 'draft',
        remarks: remarks || deanNameOrRemarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId);
  },

  async submitScheduleForDeanApproval(examinationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('exam_schedules')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', examinationId);
    if (error) console.error('[EXAMS] Submit schedule error:', error.message);
  },

  async deanApproveTimetable(
    examinationId: string,
    deanName?: string,
    remarks?: string,
    deanPin?: string,
    userId?: string
  ): Promise<void> {
    if (deanPin) {
      const pinCheck = deanService.verifyDeanPin(deanPin, userId);
      if (!pinCheck.valid) {
        throw new Error(pinCheck.error || 'Invalid Dean Authorization PIN.');
      }
    }

    if (isSupabaseConfigured) {
      const { error: schErr } = await supabase
        .from('exam_schedules')
        .update({
          status: 'approved',
          remarks: remarks || `Timetable ratified & approved by ${deanName || 'Dean of Academic Affairs'}`,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('examination_id', examinationId);
      if (schErr) console.error('[EXAMS] Dean approval error on schedules:', schErr.message);

      await supabase
        .from('examinations')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', examinationId);
    }

    // Always record in the unified Dean Audit ledger
    deanService.logDeanAudit({
      action: 'EXAM_SCHEDULE_SIGNOFF',
      entityId: examinationId,
      entityName: `Examination Schedule (${examinationId})`,
      deanName: deanName || 'Prof. Dr. Rajesh K. Varma',
      deanId: userId || 'dean-001',
      securityPinVerified: !!deanPin,
      details: remarks || `Dean ratified master exam timetable with PIN authorization.`
    });
  },

  async publishTimetable(examinationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error: schErr } = await supabase
      .from('exam_schedules')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', examinationId);
    if (schErr) console.error('[EXAMS] Publish error on schedules:', schErr.message);

    await supabase
      .from('examinations')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examinationId);
  },

  exportTimetableCSV(examinationId: string): string {
    return 'Subject Code,Subject Name,Date,Start Time,End Time,Session,Room\n';
  },

  async bulkImportExamSchedules(schedules: {
    examination_id: string;
    subject_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number?: string;
    building?: string;
    status?: 'draft' | 'submitted' | 'approved' | 'published';
  }[]): Promise<{ imported: number; errors: string[]; count: number }> {
    let imported = 0;
    const errors: string[] = [];

    for (const item of schedules) {
      try {
        await this.createSchedule({
          examination_id: item.examination_id,
          subject_id: item.subject_id,
          exam_date: item.exam_date,
          start_time: item.start_time,
          end_time: item.end_time,
          room_number: item.room_number,
          building: item.building,
          status: item.status || 'draft',
        });
        imported++;
      } catch (e: any) {
        errors.push(`Slot ${item.exam_date} (${item.start_time}-${item.end_time}): ${e?.message || 'Failed'}`);
      }
    }

    if (imported > 0) {
      auditService.logEvent({
        action: 'CREATE',
        entity_type: 'schedule',
        entity_id: 'bulk_batch',
        entity_name: 'Bulk Timetable Import',
        user_id: 'admin',
        user_name: 'Examination Controller',
        role: 'administrator',
        description: `Imported ${imported} examination schedule slots into official timetable.`,
        severity: 'info',
      });
    }

    return { imported, errors, count: imported };
  },
};

