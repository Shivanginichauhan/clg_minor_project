import { TimetableSlot, AcademicCalendarEvent, initialTimetableSlots, initialMonthlyEvents } from '../data/mockTimetable.js';
export type { TimetableSlot, AcademicCalendarEvent } from '../data/mockTimetable.js';
import { initialFaculty } from '../data/mockAcademics.js';
import { auditService } from './auditService.js';
import { deanService } from './deanService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { assignmentService } from './assignmentService.js';

const STORAGE_KEY_SLOTS = 'ueams_timetable_slots';
const STORAGE_KEY_EVENTS = 'ueams_calendar_events';

export class TimetableService {
  private getStoredSlots(): TimetableSlot[] {
    const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(initialTimetableSlots));
      return initialTimetableSlots;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTimetableSlots;
    }
  }

  private saveSlots(slots: TimetableSlot[]): void {
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slots));
  }

  private getStoredEvents(): AcademicCalendarEvent[] {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(initialMonthlyEvents));
      return initialMonthlyEvents;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialMonthlyEvents;
    }
  }

  async getAllSlots(): Promise<TimetableSlot[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('timetable_slots')
          .select(`
            *,
            subject:subjects(id, code, name),
            faculty:faculty(id, employee_id, profile:profiles(full_name))
          `);
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            day: d.day_of_week,
            period_number: d.period_number,
            start_time: d.start_time,
            end_time: d.end_time,
            subject_code: d.subject?.code || 'MCA-201',
            subject_name: d.subject?.name || 'Advanced Subject',
            faculty_id: d.faculty_id || 'fac-001',
            faculty_name: d.faculty?.profile?.full_name || 'Dr. Priya Nambiar',
            room_number: d.room_number,
            building: d.building,
            program_id: 'prog-mca-01',
            semester_id: d.semester_id,
            semester_number: 2,
            type: d.type,
            batch: d.batch,
          }));
        }
      } catch (err) {
        console.warn('[TIMETABLE] Supabase fetch fallback to local storage:', err);
      }
    }
    return this.getStoredSlots();
  }

  async getSlotsBySemester(semesterId: string = 'sem-mca-2'): Promise<TimetableSlot[]> {
    const slots = await this.getAllSlots();
    return slots.filter((s) => !semesterId || s.semester_id === semesterId);
  }

  async getDailySchedule(day: string, semesterId?: string): Promise<TimetableSlot[]> {
    const slots = this.getStoredSlots();
    return slots
      .filter((s) => s.day.toLowerCase() === day.toLowerCase() && (!semesterId || s.semester_id === semesterId))
      .sort((a, b) => a.period_number - b.period_number);
  }

  async getFacultySchedule(facultyId?: string, day?: string): Promise<TimetableSlot[]> {
    const slots = this.getStoredSlots();
    return slots
      .filter((s) => {
        const matchesFac = !facultyId || s.faculty_id === facultyId || s.faculty_name.toLowerCase().includes(facultyId.toLowerCase());
        const matchesDay = !day || s.day.toLowerCase() === day.toLowerCase();
        return matchesFac && matchesDay;
      })
      .sort((a, b) => a.period_number - b.period_number);
  }

  async getMonthlyCalendar(monthYear: string = '2026-05', studentId?: string): Promise<AcademicCalendarEvent[]> {
    const events = this.getStoredEvents();
    let monthEvents = events.filter((e) => e.date.startsWith(monthYear));

    if (studentId) {
      try {
        const assignments = await assignmentService.getAssignments(studentId);
        const asgEvents: AcademicCalendarEvent[] = assignments
          .filter((a) => a.due_date.startsWith(monthYear))
          .map((a) => ({
            id: `cal-asg-${a.id}`,
            date: a.due_date.slice(0, 10),
            day: new Date(a.due_date).toLocaleDateString('en-US', { weekday: 'long' }),
            title: `Assignment Due: ${a.title} (${a.subject_code})`,
            category: 'deadline',
            description: `Continuous Internal Assessment submission due by 11:59 PM. Max Marks: ${a.total_marks} (${a.weightage_percent}% Weightage).`,
            target_audience: 'all',
            is_mandatory: true,
          }));

        monthEvents = [...monthEvents, ...asgEvents];
      } catch (err) {
        console.warn('[TIMETABLE] Failed to load student assignments for calendar:', err);
      }
    }

    return monthEvents.sort((a, b) => a.date.localeCompare(b.date));
  }

  async addSlot(slotData: Omit<TimetableSlot, 'id'>, performedBy?: string): Promise<TimetableSlot> {
    const slots = this.getStoredSlots();
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `tt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    slots.push(newSlot);
    this.saveSlots(slots);

    await auditService.logAction({
      action: 'CREATE_TIMETABLE_SLOT',
      entity_type: 'timetable_slot',
      entity_id: newSlot.id,
      entity_name: `${newSlot.subject_code} - ${newSlot.day}`,
      description: `Class scheduled for ${newSlot.subject_code} on ${newSlot.day} ${newSlot.start_time} in ${newSlot.room_number}`,
      severity: 'info',
    });

    return newSlot;
  }

  async updateSlot(id: string, updates: Partial<TimetableSlot>): Promise<TimetableSlot> {
    const slots = this.getStoredSlots();
    const index = slots.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Timetable slot not found');

    slots[index] = { ...slots[index], ...updates };
    this.saveSlots(slots);
    return slots[index];
  }

  async deleteSlot(id: string): Promise<void> {
    const slots = this.getStoredSlots();
    const filtered = slots.filter((s) => s.id !== id);
    this.saveSlots(filtered);
  }

  async getRoomOccupancy(day: string = 'Monday'): Promise<Array<{ room: string; building: string; slots: TimetableSlot[] }>> {
    const slots = await this.getDailySchedule(day);
    const roomMap = new Map<string, { room: string; building: string; slots: TimetableSlot[] }>();

    for (const slot of slots) {
      if (!roomMap.has(slot.room_number)) {
        roomMap.set(slot.room_number, {
          room: slot.room_number,
          building: slot.building,
          slots: [],
        });
      }
      roomMap.get(slot.room_number)!.slots.push(slot);
    }

    return Array.from(roomMap.values());
  }

  async getFacultyAvailabilityForSlot(
    day: string,
    periodNumber: number,
    excludeFacultyId?: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      department: string;
      designation: string;
      isAvailable: boolean;
      conflictReason?: string;
    }>
  > {
    const slots = this.getStoredSlots();
    // Slots on this day and period
    const dayPeriodSlots = slots.filter(
      (s) => s.day.toLowerCase() === day.toLowerCase() && s.period_number === periodNumber
    );

    return initialFaculty
      .filter((f) => f.id !== excludeFacultyId && f.profile?.id !== excludeFacultyId)
      .map((f) => {
        const facName = f.profile?.full_name || 'Faculty Member';
        const busySlot = dayPeriodSlots.find(
          (s) =>
            s.faculty_id === f.id ||
            s.faculty_name.toLowerCase().includes(facName.toLowerCase().split(' ')[0]) ||
            s.substitute_faculty_id === f.id
        );

        return {
          id: f.id,
          name: facName,
          department: f.department?.name || 'Computer Science & Engineering',
          designation: f.designation || 'Assistant Professor',
          isAvailable: !busySlot,
          conflictReason: busySlot
            ? `Teaching ${busySlot.subject_code} (${busySlot.subject_name.slice(0, 24)}...) in ${busySlot.room_number}`
            : undefined,
        };
      });
  }

  async assignSubstitute(
    slotId: string,
    substituteData: {
      facultyId: string;
      facultyName: string;
      date: string;
      reason: string;
      notes?: string;
    }
  ): Promise<TimetableSlot> {
    const slots = this.getStoredSlots();
    const index = slots.findIndex((s) => s.id === slotId);
    if (index === -1) throw new Error('Teaching session not found');

    const target = slots[index];
    slots[index] = {
      ...target,
      substitute_faculty_id: substituteData.facultyId,
      substitute_faculty_name: substituteData.facultyName,
      substitute_date: substituteData.date,
      substitute_reason: substituteData.reason,
      substitute_notes: substituteData.notes,
      substitute_status: 'arranged',
    };

    this.saveSlots(slots);

    if (isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('faculty_leave_proxies')
          .insert({
            slot_id: slotId,
            original_faculty_id: target.faculty_id || 'fac-001',
            substitute_faculty_id: substituteData.facultyId,
            leave_date: substituteData.date,
            leave_type: substituteData.reason,
            handover_notes: substituteData.notes,
            status: 'arranged',
          })
      )
        .then(() => {})
        .catch((e: any) => console.warn('[TIMETABLE] Proxy DB log:', e));
    }

    await auditService.logAction({
      action: 'ARRANGE_PROXY_LECTURE',
      entity_type: 'timetable_proxy',
      entity_id: slotId,
      entity_name: `${target.subject_code} - ${target.day} (Period ${target.period_number})`,
      description: `Proxy arrangement: ${target.faculty_name} on leave (${substituteData.reason}) re-assigned lecture to ${substituteData.facultyName} on ${substituteData.date}`,
      severity: 'info',
    });

    return slots[index];
  }

  async revokeSubstitute(slotId: string): Promise<TimetableSlot> {
    const slots = this.getStoredSlots();
    const index = slots.findIndex((s) => s.id === slotId);
    if (index === -1) throw new Error('Teaching session not found');

    const target = slots[index];
    const prevSub = target.substitute_faculty_name;
    slots[index] = {
      ...target,
      substitute_faculty_id: undefined,
      substitute_faculty_name: undefined,
      substitute_date: undefined,
      substitute_reason: undefined,
      substitute_notes: undefined,
      substitute_status: undefined,
    };

    this.saveSlots(slots);

    await auditService.logAction({
      action: 'REVOKE_PROXY_LECTURE',
      entity_type: 'timetable_proxy',
      entity_id: slotId,
      entity_name: `${target.subject_code} - ${target.day}`,
      description: `Revoked proxy lecture assignment originally delegated to ${prevSub}`,
      severity: 'info',
    });

    return slots[index];
  }

  async ratifyTimetable(
    deanName: string,
    deanPin: string,
    notes?: string,
    userId?: string
  ): Promise<{ ratified: boolean; timestamp: string; seal: string; officer: string }> {
    const pinCheck = deanService.verifyDeanPin(deanPin, userId);
    if (!pinCheck.valid) {
      throw new Error(`Statutory Ratification Rejected: ${pinCheck.error || 'Invalid Dean Security Authorization PIN.'}`);
    }

    const seal = `SEAL-TIMETABLE-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const payload = {
      ratified: true,
      timestamp,
      ratified_at: timestamp,
      officer: deanName,
      seal,
      notes: notes || 'Master institutional timetable verified conflict-free and ratified.'
    };

    localStorage.setItem('ueams_dean_timetable_ratified', JSON.stringify(payload));

    await auditService.logAction({
      action: 'DEAN_RATIFY_TIMETABLE',
      entity_type: 'timetable',
      entity_id: 'master-timetable',
      entity_name: 'Master Curricular Timetable',
      description: `Dean ${deanName} verified and ratified institutional master timetable with seal ${seal}`,
      severity: 'security'
    });

    return payload;
  }

  async revokeRatification(deanName: string): Promise<void> {
    localStorage.removeItem('ueams_dean_timetable_ratified');
    await auditService.logAction({
      action: 'DEAN_REVOKE_TIMETABLE_RATIFICATION',
      entity_type: 'timetable',
      entity_id: 'master-timetable',
      entity_name: 'Master Curricular Timetable',
      description: `Dean ${deanName} revoked master timetable ratification for curriculum committee revisions`,
      severity: 'security'
    });
  }
}

export const timetableService = new TimetableService();
