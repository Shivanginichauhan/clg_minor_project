import { Marks, MarksStatus } from '../types/database.types.js';
import { initialStudents, initialFaculty, initialSubjects } from './mockAcademics.js';
import { initialExaminations } from './mockExams.js';

export interface InternalAssessmentBreakdown {
  test1_marks: number;       // Out of 30 or 50 (e.g. Mid-term 1)
  test1_max: number;
  test2_marks: number;       // Out of 30 or 50 (e.g. Mid-term 2)
  test2_max: number;
  assignment_marks: number;  // Out of 10
  assignment_max: number;
  seminar_quiz_marks: number;// Out of 10
  seminar_quiz_max: number;
  attendance_score: number;  // Out of 5 (Calculated from attendance %)
  attendance_max: number;
}

export interface StudentMarksWithDetails extends Marks {
  student_name: string;
  roll_number: string;
  enrollment_number: string;
  avatar_url?: string;
  program_name: string;
  subject_code: string;
  subject_name: string;
  subject_credits: number;
  subject_type: 'theory' | 'practical' | 'combined' | 'elective';
  exam_name: string;
  faculty_name: string;
  
  // Granular Continuous Internal Assessment (CIA)
  cia_breakdown: InternalAssessmentBreakdown;
  max_internal: number;
  
  // External
  external_theory_marks?: number;
  external_theory_max: number;
  external_practical_marks?: number;
  external_practical_max: number;
  dummy_barcode_no?: string; // Anonymous evaluation barcode

  // Moderation & Evaluation
  moderation_grace_marks: number;
  moderation_reason?: string;
  
  // Calculated Grading
  grade_letter: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'AB';
  grade_point: number;
  is_passed: boolean;
  remarks?: string;
}

export interface ModerationRule {
  rule_type: 'borderline_grace' | 'flat_curve' | 'proportional_scale';
  grace_marks: number;
  target_range_min?: number;
  target_range_max?: number;
  resolution_reference: string;
  moderated_by: string;
  reason: string;
}

export interface SubjectMarksSummary {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  department_name: string;
  examination_id: string;
  examination_name: string;
  faculty_id: string;
  faculty_name: string;
  total_students: number;
  submitted_count: number;
  status: MarksStatus | 'moderated' | 'locked';
  average_marks: number;
  pass_percentage: number;
  highest_marks: number;
  lowest_marks: number;
  last_updated: string;
}

export const calculateGrade = (
  total: number,
  maxTotal: number,
  isAbsent = false
): { grade_letter: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'AB'; grade_point: number; is_passed: boolean } => {
  if (isAbsent) {
    return { grade_letter: 'AB', grade_point: 0, is_passed: false };
  }

  const percentage = (total / maxTotal) * 100;

  if (percentage >= 90) return { grade_letter: 'O', grade_point: 10, is_passed: true };
  if (percentage >= 80) return { grade_letter: 'A+', grade_point: 9, is_passed: true };
  if (percentage >= 70) return { grade_letter: 'A', grade_point: 8, is_passed: true };
  if (percentage >= 60) return { grade_letter: 'B+', grade_point: 7, is_passed: true };
  if (percentage >= 50) return { grade_letter: 'B', grade_point: 6, is_passed: true };
  if (percentage >= 45) return { grade_letter: 'C', grade_point: 5, is_passed: true };
  if (percentage >= 40) return { grade_letter: 'P', grade_point: 4, is_passed: true };
  return { grade_letter: 'F', grade_point: 0, is_passed: false };
};

// Seed Marks for CS-201, CS-202, CS-203 across students
export const initialMarksList: StudentMarksWithDetails[] = [
  // Subject 1: CS-201 (Data Structures & Algorithms)
  {
    id: 'mrk-cs201-stu01',
    student_id: 'stu-001',
    subject_id: 'subj-001',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-001',
    internal_marks: 36,
    external_marks: 54,
    practical_marks: 0,
    total_marks: 90,
    status: 'submitted',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-14T14:30:00Z',
    student_name: 'Aarav Sharma',
    roll_number: '2026-CS-0101',
    enrollment_number: 'ENR-2026-9081',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-201',
    subject_name: 'Data Structures & Algorithms',
    subject_credits: 4,
    subject_type: 'theory',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Dr. Anand Ramanathan',
    cia_breakdown: {
      test1_marks: 27,
      test1_max: 30,
      test2_marks: 28,
      test2_max: 30,
      assignment_marks: 9,
      assignment_max: 10,
      seminar_quiz_marks: 9,
      seminar_quiz_max: 10,
      attendance_score: 5,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 54,
    external_theory_max: 60,
    external_practical_marks: 0,
    external_practical_max: 0,
    dummy_barcode_no: 'DUMMY-CS201-8819',
    moderation_grace_marks: 0,
    grade_letter: 'O',
    grade_point: 10,
    is_passed: true,
    remarks: 'Outstanding algorithmic grasp and analytical precision.'
  },
  {
    id: 'mrk-cs201-stu02',
    student_id: 'stu-002',
    subject_id: 'subj-001',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-001',
    internal_marks: 32,
    external_marks: 48,
    practical_marks: 0,
    total_marks: 80,
    status: 'submitted',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-14T14:30:00Z',
    student_name: 'Diya Patel',
    roll_number: '2026-CS-0102',
    enrollment_number: 'ENR-2026-9082',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-201',
    subject_name: 'Data Structures & Algorithms',
    subject_credits: 4,
    subject_type: 'theory',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Dr. Anand Ramanathan',
    cia_breakdown: {
      test1_marks: 24,
      test1_max: 30,
      test2_marks: 25,
      test2_max: 30,
      assignment_marks: 8,
      assignment_max: 10,
      seminar_quiz_marks: 8,
      seminar_quiz_max: 10,
      attendance_score: 4,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 48,
    external_theory_max: 60,
    external_practical_marks: 0,
    external_practical_max: 0,
    dummy_barcode_no: 'DUMMY-CS201-8820',
    moderation_grace_marks: 0,
    grade_letter: 'A+',
    grade_point: 9,
    is_passed: true,
    remarks: 'Consistent problem solving throughout tests.'
  },
  {
    id: 'mrk-cs201-stu03',
    student_id: 'stu-003',
    subject_id: 'subj-001',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-001',
    internal_marks: 28,
    external_marks: 44,
    practical_marks: 0,
    total_marks: 72,
    status: 'submitted',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-14T14:30:00Z',
    student_name: 'Rohan Gupta',
    roll_number: '2026-CS-0103',
    enrollment_number: 'ENR-2026-9083',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-201',
    subject_name: 'Data Structures & Algorithms',
    subject_credits: 4,
    subject_type: 'theory',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Dr. Anand Ramanathan',
    cia_breakdown: {
      test1_marks: 20,
      test1_max: 30,
      test2_marks: 22,
      test2_max: 30,
      assignment_marks: 7,
      assignment_max: 10,
      seminar_quiz_marks: 7,
      seminar_quiz_max: 10,
      attendance_score: 4,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 44,
    external_theory_max: 60,
    external_practical_marks: 0,
    external_practical_max: 0,
    dummy_barcode_no: 'DUMMY-CS201-8821',
    moderation_grace_marks: 0,
    grade_letter: 'A',
    grade_point: 8,
    is_passed: true,
    remarks: 'Good effort in assignments and theory.'
  },
  {
    id: 'mrk-cs201-stu04',
    student_id: 'stu-004',
    subject_id: 'subj-001',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-001',
    internal_marks: 18,
    external_marks: 21,
    practical_marks: 0,
    total_marks: 39,
    status: 'submitted',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-04-14T14:30:00Z',
    student_name: 'Ananya Deshmukh',
    roll_number: '2026-CS-0104',
    enrollment_number: 'ENR-2026-9084',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-201',
    subject_name: 'Data Structures & Algorithms',
    subject_credits: 4,
    subject_type: 'theory',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Dr. Anand Ramanathan',
    cia_breakdown: {
      test1_marks: 14,
      test1_max: 30,
      test2_marks: 13,
      test2_max: 30,
      assignment_marks: 5,
      assignment_max: 10,
      seminar_quiz_marks: 5,
      seminar_quiz_max: 10,
      attendance_score: 2,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 21,
    external_theory_max: 60,
    external_practical_marks: 0,
    external_practical_max: 0,
    dummy_barcode_no: 'DUMMY-CS201-8822',
    moderation_grace_marks: 1, // Awarded 1 grace mark to reach 40 (Pass)
    moderation_reason: 'Borderline moderation rule 14(b)',
    grade_letter: 'P',
    grade_point: 4,
    is_passed: true,
    remarks: 'Passed on borderline moderation adjustment.'
  },

  // Subject 2: CS-202 (Database Management Systems - Combined with Lab)
  {
    id: 'mrk-cs202-stu01',
    student_id: 'stu-001',
    subject_id: 'subj-002',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-002',
    internal_marks: 38,
    external_marks: 38,
    practical_marks: 19,
    total_marks: 95,
    status: 'verified',
    created_at: '2026-04-10T09:00:00Z',
    updated_at: '2026-04-15T11:00:00Z',
    verified_by_admin_id: 'usr-admin-01',
    verified_at: '2026-04-15T11:00:00Z',
    student_name: 'Aarav Sharma',
    roll_number: '2026-CS-0101',
    enrollment_number: 'ENR-2026-9081',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-202',
    subject_name: 'Database Management Systems',
    subject_credits: 4,
    subject_type: 'combined',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Prof. Priya Sundaram',
    cia_breakdown: {
      test1_marks: 29,
      test1_max: 30,
      test2_marks: 29,
      test2_max: 30,
      assignment_marks: 10,
      assignment_max: 10,
      seminar_quiz_marks: 9,
      seminar_quiz_max: 10,
      attendance_score: 5,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 38,
    external_theory_max: 40,
    external_practical_marks: 19,
    external_practical_max: 20,
    dummy_barcode_no: 'DUMMY-CS202-9901',
    moderation_grace_marks: 0,
    grade_letter: 'O',
    grade_point: 10,
    is_passed: true,
    remarks: 'Exemplary database normalization and SQL query optimization.'
  },
  {
    id: 'mrk-cs202-stu02',
    student_id: 'stu-002',
    subject_id: 'subj-002',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-002',
    internal_marks: 34,
    external_marks: 34,
    practical_marks: 18,
    total_marks: 86,
    status: 'verified',
    created_at: '2026-04-10T09:00:00Z',
    updated_at: '2026-04-15T11:00:00Z',
    verified_by_admin_id: 'usr-admin-01',
    verified_at: '2026-04-15T11:00:00Z',
    student_name: 'Diya Patel',
    roll_number: '2026-CS-0102',
    enrollment_number: 'ENR-2026-9082',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-202',
    subject_name: 'Database Management Systems',
    subject_credits: 4,
    subject_type: 'combined',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Prof. Priya Sundaram',
    cia_breakdown: {
      test1_marks: 26,
      test1_max: 30,
      test2_marks: 26,
      test2_max: 30,
      assignment_marks: 9,
      assignment_max: 10,
      seminar_quiz_marks: 8,
      seminar_quiz_max: 10,
      attendance_score: 4,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 34,
    external_theory_max: 40,
    external_practical_marks: 18,
    external_practical_max: 20,
    dummy_barcode_no: 'DUMMY-CS202-9902',
    moderation_grace_marks: 0,
    grade_letter: 'A+',
    grade_point: 9,
    is_passed: true,
    remarks: 'Strong relational modeling and transaction ACID compliance understanding.'
  },

  // Subject 3: CS-203 (Computer Organization & Architecture)
  {
    id: 'mrk-cs203-stu01',
    student_id: 'stu-001',
    subject_id: 'subj-003',
    examination_id: 'exam-2026-spring-01',
    entered_by_faculty_id: 'fac-003',
    internal_marks: 35,
    external_marks: 52,
    practical_marks: 0,
    total_marks: 87,
    status: 'draft',
    created_at: '2026-04-14T11:00:00Z',
    updated_at: '2026-04-15T09:15:00Z',
    student_name: 'Aarav Sharma',
    roll_number: '2026-CS-0101',
    enrollment_number: 'ENR-2026-9081',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    program_name: 'B.Tech Computer Science & Engineering',
    subject_code: 'CS-203',
    subject_name: 'Computer Organization & Architecture',
    subject_credits: 3,
    subject_type: 'theory',
    exam_name: 'Spring 2026 End-Semester Examinations',
    faculty_name: 'Dr. Rajesh Deshmukh',
    cia_breakdown: {
      test1_marks: 26,
      test1_max: 30,
      test2_marks: 27,
      test2_max: 30,
      assignment_marks: 9,
      assignment_max: 10,
      seminar_quiz_marks: 8,
      seminar_quiz_max: 10,
      attendance_score: 5,
      attendance_max: 5
    },
    max_internal: 40,
    external_theory_marks: 52,
    external_theory_max: 60,
    external_practical_marks: 0,
    external_practical_max: 0,
    dummy_barcode_no: 'DUMMY-CS203-7701',
    moderation_grace_marks: 0,
    grade_letter: 'A+',
    grade_point: 9,
    is_passed: true
  }
];
