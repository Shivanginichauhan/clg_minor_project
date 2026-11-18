import {
  Examination,
  ExamSchedule,
  Room
} from '../types/database.types.js';
import { initialSubjects, initialSessions } from './mockAcademics.js';

export interface ExamScheduleWithDetails extends ExamSchedule {
  subject_code?: string;
  subject_name?: string;
  subject_type?: 'theory' | 'practical' | 'elective' | 'project';
  credits?: number;
  program_name?: string;
  semester_number?: number;
  room_number?: string;
  building?: string;
  session_type?: 'morning' | 'afternoon';
  max_marks?: number;
}

export interface ExamCycleWithDetails extends Examination {
  session_name?: string;
  total_schedules?: number;
  approval_status?: 'draft' | 'submitted' | 'approved' | 'published';
  dean_remarks?: string;
  reviewed_by_dean_name?: string;
  approved_at?: string;
}

export interface StudentHallTicket {
  id: string;
  hall_ticket_number: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  enrollment_number: string;
  program_name: string;
  department_name: string;
  semester_number: number;
  examination_name: string;
  academic_session: string;
  exam_centre: string;
  centre_code: string;
  issue_date: string;
  overall_attendance: number;
  is_eligible: boolean;
  detention_reason?: string;
  papers: {
    schedule_id: string;
    subject_code: string;
    subject_name: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    session_type: 'morning' | 'afternoon';
    room_number: string;
    building: string;
    attendance_percentage: number;
    is_paper_eligible: boolean;
  }[];
  qr_data: string;
}

export const initialExaminationRooms: Room[] = [
  {
    id: 'room-lh-101',
    room_number: 'LH-101',
    building: 'APJ Abdul Kalam Academic Block',
    floor: 1,
    capacity: 60,
    is_available: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'room-lh-102',
    room_number: 'LH-102',
    building: 'APJ Abdul Kalam Academic Block',
    floor: 1,
    capacity: 60,
    is_available: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'room-lh-201',
    room_number: 'LH-201',
    building: 'Aryabhata Computing Centre',
    floor: 2,
    capacity: 80,
    is_available: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'room-audi-01',
    room_number: 'AUDI-HALL-A',
    building: 'Central Examination Complex',
    floor: 1,
    capacity: 250,
    is_available: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const initialExaminations: ExamCycleWithDetails[] = [
  {
    id: 'exam-2026-endsem',
    session_id: 'session-2025-26',
    semester_id: 'sem-mca-2',
    name: 'Even Semester End-Term Theory & Practical Examinations 2026',
    exam_type: 'regular',
    start_date: '2026-05-18',
    end_date: '2026-06-05',
    is_active: true,
    session_name: 'Academic Year 2025 - 2026',
    total_schedules: 10,
    approval_status: 'published',
    dean_remarks: 'Approved by Academic Council & Controller of Examinations. Timetable ratified without scheduling conflicts.',
    reviewed_by_dean_name: 'Prof. (Dr.) S. Ramanathan, Dean of Academic Affairs',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'exam-2026-midterm',
    session_id: 'session-2025-26',
    semester_id: 'sem-mca-2',
    name: 'Mid-Semester Continuous Internal Assessment Exam 2026',
    exam_type: 'regular',
    start_date: '2026-03-23',
    end_date: '2026-03-30',
    is_active: false,
    session_name: 'Academic Year 2025 - 2026',
    total_schedules: 8,
    approval_status: 'published',
    dean_remarks: 'Approved for mid-term continuous assessment grading.',
    reviewed_by_dean_name: 'Prof. (Dr.) S. Ramanathan, Dean of Academic Affairs',
    approved_at: '2026-03-10T14:00:00Z',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-03-10T14:00:00Z',
  },
  {
    id: 'exam-2026-suppl',
    session_id: 'session-2025-26',
    semester_id: 'sem-mca-2',
    name: 'Supplementary & Special Arrear Examinations 2026',
    exam_type: 'supplementary',
    start_date: '2026-06-15',
    end_date: '2026-06-25',
    is_active: true,
    session_name: 'Academic Year 2025 - 2026',
    total_schedules: 4,
    approval_status: 'submitted',
    dean_remarks: 'Awaiting Dean review and room allotment signoff.',
    created_at: '2026-04-01T09:00:00Z',
    updated_at: '2026-04-12T10:00:00Z',
  },
];

export const initialExamSchedules: ExamScheduleWithDetails[] = [
  // MCA Semester 2 Schedules (End Sem 2026)
  {
    id: 'sched-mca-201',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-201',
    exam_date: '2026-05-18',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'MCA-201',
    subject_name: 'Data Structures & Advanced Algorithms',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-101',
    building: 'APJ Abdul Kalam Academic Block',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-mca-202',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-202',
    exam_date: '2026-05-21',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'MCA-202',
    subject_name: 'Relational Database Management Systems',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-101',
    building: 'APJ Abdul Kalam Academic Block',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-mca-203',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-203',
    exam_date: '2026-05-24',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'MCA-203',
    subject_name: 'Computer Networks & Distributed Systems',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-102',
    building: 'APJ Abdul Kalam Academic Block',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-mca-204',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-204',
    exam_date: '2026-05-27',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'MCA-204',
    subject_name: 'Software Engineering & Enterprise Architecture',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-102',
    building: 'APJ Abdul Kalam Academic Block',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-mca-205',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-205',
    exam_date: '2026-05-30',
    start_time: '10:00',
    end_time: '13:00',
    status: 'published',
    subject_code: 'MCA-205',
    subject_name: 'Data Structures Laboratory',
    subject_type: 'practical',
    credits: 2,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-201',
    building: 'Aryabhata Computing Centre',
    session_type: 'morning',
    max_marks: 50,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-mca-206',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-mca-206',
    exam_date: '2026-06-02',
    start_time: '14:00',
    end_time: '17:00',
    status: 'published',
    subject_code: 'MCA-206',
    subject_name: 'Database Applications Laboratory',
    subject_type: 'practical',
    credits: 2,
    program_name: 'Master of Computer Applications',
    semester_number: 2,
    room_number: 'LH-201',
    building: 'Aryabhata Computing Centre',
    session_type: 'afternoon',
    max_marks: 50,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },

  // B.Tech CSE Semester 4 Schedules (End Sem 2026)
  {
    id: 'sched-cs-401',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-cs-401',
    exam_date: '2026-05-19',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'CS-401',
    subject_name: 'Operating Systems & System Programming',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Bachelor of Technology (CSE)',
    semester_number: 4,
    room_number: 'AUDI-HALL-A',
    building: 'Central Examination Complex',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-cs-402',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-cs-402',
    exam_date: '2026-05-22',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'CS-402',
    subject_name: 'Design & Analysis of Algorithms',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Bachelor of Technology (CSE)',
    semester_number: 4,
    room_number: 'AUDI-HALL-A',
    building: 'Central Examination Complex',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-cs-403',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-cs-403',
    exam_date: '2026-05-25',
    start_time: '09:30',
    end_time: '12:30',
    status: 'published',
    subject_code: 'CS-403',
    subject_name: 'Formal Languages & Automata Theory',
    subject_type: 'theory',
    credits: 4,
    program_name: 'Bachelor of Technology (CSE)',
    semester_number: 4,
    room_number: 'AUDI-HALL-A',
    building: 'Central Examination Complex',
    session_type: 'morning',
    max_marks: 100,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
  {
    id: 'sched-cs-404',
    examination_id: 'exam-2026-endsem',
    subject_id: 'sub-cs-404',
    exam_date: '2026-05-28',
    start_time: '14:00',
    end_time: '17:00',
    status: 'published',
    subject_code: 'CS-404',
    subject_name: 'Operating Systems System Call Lab',
    subject_type: 'practical',
    credits: 2,
    program_name: 'Bachelor of Technology (CSE)',
    semester_number: 4,
    room_number: 'LH-201',
    building: 'Aryabhata Computing Centre',
    session_type: 'afternoon',
    max_marks: 50,
    reviewed_by_dean_id: 'dean-001',
    approved_at: '2026-04-10T11:30:00Z',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-04-10T11:30:00Z',
  },
];
