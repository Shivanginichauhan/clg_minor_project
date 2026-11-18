import {
  Enrollment,
  Attendance,
  AttendanceStatus
} from '../types/database.types.js';
import { initialStudents, initialSubjects } from './mockAcademics.js';

export interface LectureSession {
  id: string;
  subject_id: string;
  faculty_id: string;
  date: string;
  period_slot: string; // e.g. "10:00 AM - 11:00 AM"
  topic_covered: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  excused_count: number;
  created_at: string;
}

export interface MedicalCondonation {
  id: string;
  student_id: string;
  subject_id: string;
  session_id: string;
  reason: string;
  medical_doc_url?: string;
  from_date: string;
  to_date: string;
  missed_classes_count: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceSummary {
  student_id: string;
  subject_id: string;
  total_lectures: number;
  attended_lectures: number;
  excused_lectures: number;
  percentage: number;
  is_eligible_for_exam: boolean; // >= 75% or condoned
  condonation_status?: 'none' | 'pending' | 'approved' | 'rejected';
}

// Generate realistic mock enrollments for MCA Sem 2 and B.Tech CSE Sem 4
export const initialEnrollments: Enrollment[] = [
  // Student 1 (Rahul Sharma) -> MCA Sem 2 subjects
  { id: 'enr-001', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-201', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-002', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-202', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-003', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-203', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-004', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-204', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-005', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-205', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-006', student_id: 'stu-001', semester_id: 'sem-mca-2', subject_id: 'sub-mca-207', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },

  // Student 2 (Sneha Patel) -> MCA Sem 2 subjects
  { id: 'enr-007', student_id: 'stu-002', semester_id: 'sem-mca-2', subject_id: 'sub-mca-201', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-008', student_id: 'stu-002', semester_id: 'sem-mca-2', subject_id: 'sub-mca-202', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-009', student_id: 'stu-002', semester_id: 'sem-mca-2', subject_id: 'sub-mca-203', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-010', student_id: 'stu-002', semester_id: 'sem-mca-2', subject_id: 'sub-mca-204', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-011', student_id: 'stu-002', semester_id: 'sem-mca-2', subject_id: 'sub-mca-205', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },

  // Student 3 (Amit Verma) -> MCA Sem 2 subjects (Critical Attendance Case)
  { id: 'enr-012', student_id: 'stu-003', semester_id: 'sem-mca-2', subject_id: 'sub-mca-201', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-013', student_id: 'stu-003', semester_id: 'sem-mca-2', subject_id: 'sub-mca-202', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-014', student_id: 'stu-003', semester_id: 'sem-mca-2', subject_id: 'sub-mca-203', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-015', student_id: 'stu-003', semester_id: 'sem-mca-2', subject_id: 'sub-mca-204', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },

  // Student 4 (Pooja Nair) -> MCA Sem 2
  { id: 'enr-016', student_id: 'stu-004', semester_id: 'sem-mca-2', subject_id: 'sub-mca-201', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-017', student_id: 'stu-004', semester_id: 'sem-mca-2', subject_id: 'sub-mca-202', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-018', student_id: 'stu-004', semester_id: 'sem-mca-2', subject_id: 'sub-mca-203', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-019', student_id: 'stu-004', semester_id: 'sem-mca-2', subject_id: 'sub-mca-204', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },

  // Student 5 (Vikram Malhotra) -> B.Tech CSE Sem 4
  { id: 'enr-020', student_id: 'stu-005', semester_id: 'sem-btech-4', subject_id: 'sub-cs-401', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-021', student_id: 'stu-005', semester_id: 'sem-btech-4', subject_id: 'sub-cs-402', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-022', student_id: 'stu-005', semester_id: 'sem-btech-4', subject_id: 'sub-cs-403', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
  { id: 'enr-023', student_id: 'stu-005', semester_id: 'sem-btech-4', subject_id: 'sub-cs-404', enrolled_at: '2026-01-10T10:00:00Z', status: 'enrolled' },
];

export const initialLectureSessions: LectureSession[] = [
  {
    id: 'lec-201-01',
    subject_id: 'sub-mca-201',
    faculty_id: 'fac-001',
    date: '2026-04-01',
    period_slot: '09:30 AM - 10:30 AM',
    topic_covered: 'Relational Algebra, Query Parsing & Relational Tree Optimization',
    total_students: 4,
    present_count: 4,
    absent_count: 0,
    excused_count: 0,
    created_at: '2026-04-01T10:35:00Z',
  },
  {
    id: 'lec-201-02',
    subject_id: 'sub-mca-201',
    faculty_id: 'fac-001',
    date: '2026-04-03',
    period_slot: '09:30 AM - 10:30 AM',
    topic_covered: 'Cost-Based Query Optimization & Join Order Algorithms',
    total_students: 4,
    present_count: 3,
    absent_count: 1,
    excused_count: 0,
    created_at: '2026-04-03T10:35:00Z',
  },
  {
    id: 'lec-201-03',
    subject_id: 'sub-mca-201',
    faculty_id: 'fac-001',
    date: '2026-04-08',
    period_slot: '09:30 AM - 10:30 AM',
    topic_covered: 'Multi-version Concurrency Control (MVCC) and Snapshot Isolation',
    total_students: 4,
    present_count: 3,
    absent_count: 0,
    excused_count: 1,
    created_at: '2026-04-08T10:35:00Z',
  },
  {
    id: 'lec-201-04',
    subject_id: 'sub-mca-201',
    faculty_id: 'fac-001',
    date: '2026-04-10',
    period_slot: '09:30 AM - 10:30 AM',
    topic_covered: 'WAL (Write-Ahead Logging) and ARIES Recovery Protocol',
    total_students: 4,
    present_count: 4,
    absent_count: 0,
    excused_count: 0,
    created_at: '2026-04-10T10:35:00Z',
  },
  {
    id: 'lec-201-05',
    subject_id: 'sub-mca-201',
    faculty_id: 'fac-001',
    date: '2026-04-15',
    period_slot: '09:30 AM - 10:30 AM',
    topic_covered: 'Distributed Database Partitioning, 2PC (Two-Phase Commit)',
    total_students: 4,
    present_count: 3,
    absent_count: 1,
    excused_count: 0,
    created_at: '2026-04-15T10:35:00Z',
  },
  {
    id: 'lec-202-01',
    subject_id: 'sub-mca-202',
    faculty_id: 'fac-002',
    date: '2026-04-02',
    period_slot: '11:00 AM - 12:00 PM',
    topic_covered: 'Cloud Native Microservices Architecture & Containerization with Docker',
    total_students: 4,
    present_count: 4,
    absent_count: 0,
    excused_count: 0,
    created_at: '2026-04-02T12:05:00Z',
  },
  {
    id: 'lec-202-02',
    subject_id: 'sub-mca-202',
    faculty_id: 'fac-002',
    date: '2026-04-07',
    period_slot: '11:00 AM - 12:00 PM',
    topic_covered: 'Kubernetes Pod Scheduling, ReplicaSets, and Ingress Routing',
    total_students: 4,
    present_count: 3,
    absent_count: 1,
    excused_count: 0,
    created_at: '2026-04-07T12:05:00Z',
  },
  {
    id: 'lec-203-01',
    subject_id: 'sub-mca-203',
    faculty_id: 'fac-003',
    date: '2026-04-04',
    period_slot: '01:30 PM - 02:30 PM',
    topic_covered: 'Public Key Cryptography, RSA Mathematical Proofs & Elliptic Curves',
    total_students: 4,
    present_count: 4,
    absent_count: 0,
    excused_count: 0,
    created_at: '2026-04-04T14:35:00Z',
  }
];

export const initialAttendanceRecords: Attendance[] = [
  // Session lec-201-01 (2026-04-01)
  { id: 'att-001', subject_id: 'sub-mca-201', student_id: 'stu-001', faculty_id: 'fac-001', date: '2026-04-01', status: 'present', created_at: '2026-04-01T10:35:00Z' },
  { id: 'att-002', subject_id: 'sub-mca-201', student_id: 'stu-002', faculty_id: 'fac-001', date: '2026-04-01', status: 'present', created_at: '2026-04-01T10:35:00Z' },
  { id: 'att-003', subject_id: 'sub-mca-201', student_id: 'stu-003', faculty_id: 'fac-001', date: '2026-04-01', status: 'present', created_at: '2026-04-01T10:35:00Z' },
  { id: 'att-004', subject_id: 'sub-mca-201', student_id: 'stu-004', faculty_id: 'fac-001', date: '2026-04-01', status: 'present', created_at: '2026-04-01T10:35:00Z' },

  // Session lec-201-02 (2026-04-03)
  { id: 'att-005', subject_id: 'sub-mca-201', student_id: 'stu-001', faculty_id: 'fac-001', date: '2026-04-03', status: 'present', created_at: '2026-04-03T10:35:00Z' },
  { id: 'att-006', subject_id: 'sub-mca-201', student_id: 'stu-002', faculty_id: 'fac-001', date: '2026-04-03', status: 'present', created_at: '2026-04-03T10:35:00Z' },
  { id: 'att-007', subject_id: 'sub-mca-201', student_id: 'stu-003', faculty_id: 'fac-001', date: '2026-04-03', status: 'absent', remarks: 'Uninformed absence', created_at: '2026-04-03T10:35:00Z' },
  { id: 'att-008', subject_id: 'sub-mca-201', student_id: 'stu-004', faculty_id: 'fac-001', date: '2026-04-03', status: 'present', created_at: '2026-04-03T10:35:00Z' },

  // Session lec-201-03 (2026-04-08)
  { id: 'att-009', subject_id: 'sub-mca-201', student_id: 'stu-001', faculty_id: 'fac-001', date: '2026-04-08', status: 'present', created_at: '2026-04-08T10:35:00Z' },
  { id: 'att-010', subject_id: 'sub-mca-201', student_id: 'stu-002', faculty_id: 'fac-001', date: '2026-04-08', status: 'present', created_at: '2026-04-08T10:35:00Z' },
  { id: 'att-011', subject_id: 'sub-mca-201', student_id: 'stu-003', faculty_id: 'fac-001', date: '2026-04-08', status: 'excused', remarks: 'Hospitalization / Medical Leave', created_at: '2026-04-08T10:35:00Z' },
  { id: 'att-012', subject_id: 'sub-mca-201', student_id: 'stu-004', faculty_id: 'fac-001', date: '2026-04-08', status: 'present', created_at: '2026-04-08T10:35:00Z' },

  // Session lec-201-04 (2026-04-10)
  { id: 'att-013', subject_id: 'sub-mca-201', student_id: 'stu-001', faculty_id: 'fac-001', date: '2026-04-10', status: 'present', created_at: '2026-04-10T10:35:00Z' },
  { id: 'att-014', subject_id: 'sub-mca-201', student_id: 'stu-002', faculty_id: 'fac-001', date: '2026-04-10', status: 'present', created_at: '2026-04-10T10:35:00Z' },
  { id: 'att-015', subject_id: 'sub-mca-201', student_id: 'stu-003', faculty_id: 'fac-001', date: '2026-04-10', status: 'present', created_at: '2026-04-10T10:35:00Z' },
  { id: 'att-016', subject_id: 'sub-mca-201', student_id: 'stu-004', faculty_id: 'fac-001', date: '2026-04-10', status: 'present', created_at: '2026-04-10T10:35:00Z' },

  // Session lec-201-05 (2026-04-15)
  { id: 'att-017', subject_id: 'sub-mca-201', student_id: 'stu-001', faculty_id: 'fac-001', date: '2026-04-15', status: 'present', created_at: '2026-04-15T10:35:00Z' },
  { id: 'att-018', subject_id: 'sub-mca-201', student_id: 'stu-002', faculty_id: 'fac-001', date: '2026-04-15', status: 'present', created_at: '2026-04-15T10:35:00Z' },
  { id: 'att-019', subject_id: 'sub-mca-201', student_id: 'stu-003', faculty_id: 'fac-001', date: '2026-04-15', status: 'absent', created_at: '2026-04-15T10:35:00Z' },
  { id: 'att-020', subject_id: 'sub-mca-201', student_id: 'stu-004', faculty_id: 'fac-001', date: '2026-04-15', status: 'present', created_at: '2026-04-15T10:35:00Z' },

  // Session lec-202-01 (2026-04-02)
  { id: 'att-021', subject_id: 'sub-mca-202', student_id: 'stu-001', faculty_id: 'fac-002', date: '2026-04-02', status: 'present', created_at: '2026-04-02T12:05:00Z' },
  { id: 'att-022', subject_id: 'sub-mca-202', student_id: 'stu-002', faculty_id: 'fac-002', date: '2026-04-02', status: 'present', created_at: '2026-04-02T12:05:00Z' },
  { id: 'att-023', subject_id: 'sub-mca-202', student_id: 'stu-003', faculty_id: 'fac-002', date: '2026-04-02', status: 'present', created_at: '2026-04-02T12:05:00Z' },
  { id: 'att-024', subject_id: 'sub-mca-202', student_id: 'stu-004', faculty_id: 'fac-002', date: '2026-04-02', status: 'present', created_at: '2026-04-02T12:05:00Z' },

  // Session lec-202-02 (2026-04-07)
  { id: 'att-025', subject_id: 'sub-mca-202', student_id: 'stu-001', faculty_id: 'fac-002', date: '2026-04-07', status: 'present', created_at: '2026-04-07T12:05:00Z' },
  { id: 'att-026', subject_id: 'sub-mca-202', student_id: 'stu-002', faculty_id: 'fac-002', date: '2026-04-07', status: 'present', created_at: '2026-04-07T12:05:00Z' },
  { id: 'att-027', subject_id: 'sub-mca-202', student_id: 'stu-003', faculty_id: 'fac-002', date: '2026-04-07', status: 'absent', created_at: '2026-04-07T12:05:00Z' },
  { id: 'att-028', subject_id: 'sub-mca-202', student_id: 'stu-004', faculty_id: 'fac-002', date: '2026-04-07', status: 'present', created_at: '2026-04-07T12:05:00Z' },
];

export const initialCondonations: MedicalCondonation[] = [
  {
    id: 'cond-001',
    student_id: 'stu-003',
    subject_id: 'sub-mca-201',
    session_id: 'session-2025-26',
    reason: 'Acute Viral Fever and Clinical Inpatient Hospitalization at City Apollo Hospital',
    medical_doc_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    from_date: '2026-04-03',
    to_date: '2026-04-09',
    missed_classes_count: 2,
    status: 'pending',
    created_at: '2026-04-10T11:00:00Z',
    updated_at: '2026-04-10T11:00:00Z',
  }
];
