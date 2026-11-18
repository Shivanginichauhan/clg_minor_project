import { Result, ResultStatus } from '../types/database.types.js';

export interface SubjectResultItem {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  subject_type: 'theory' | 'practical' | 'project' | 'elective' | 'combined';
  credits: number;
  internal_marks: number;
  max_internal: number;
  external_marks: number;
  max_external: number;
  total_marks: number;
  max_total: number;
  grace_marks: number;
  letter_grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'AB';
  grade_point: number;
  credit_points: number; // credits * grade_point
  status: 'PASS' | 'FAIL' | 'ARREAR' | 'ABSENT';
}

export interface HistoricalSemesterRecord {
  semester_number: number;
  session_name: string;
  total_credits: number;
  earned_credits: number;
  total_credit_points: number;
  sgpa: number;
  subjects: {
    code: string;
    name: string;
    credits: number;
    grade: string;
    grade_point: number;
    status: string;
  }[];
}

export interface SemesterResultWithDetails extends Omit<Result, 'total_credits'> {
  total_credits?: number;
  student_name: string;
  roll_number: string;
  enrollment_number: string;
  avatar_url?: string;
  program_id: string;
  program_name: string;
  department_id: string;
  department_name: string;
  semester_number: number;
  academic_session: string;
  examination_name: string;
  examination_type: 'regular' | 'supplementary' | 'improvement';
  
  // Subject level breakdown
  subjects: SubjectResultItem[];
  
  // Multi-semester aggregations
  total_credits_registered: number;
  total_credits_earned: number;
  total_credit_points: number;
  sgpa: number;
  cgpa: number;
  percentage_equivalent: number; // CGPA * 9.5
  
  // Historical Semesters for Consolidated Transcript
  historical_semesters: HistoricalSemesterRecord[];
  cumulative_credits_earned: number;
  cumulative_credits_required: number;
  
  // Overall Academic Status & Standing
  overall_status: 'PASS' | 'FAIL' | 'PROMOTED_WITH_ARREARS' | 'WITHHELD';
  withheld_reason?: string;
  academic_standing: 'First Class with Distinction' | 'First Class' | 'Second Class' | 'Pass Class' | 'Needs Improvement' | 'Withheld';
  
  // Rankings
  rank_in_class: number;
  total_students_in_class: number;
  rank_in_department: number;

  // Governance & Statutory Signing
  approved_by_dean_name?: string;
  coe_signature_hash?: string;
  qr_verification_code: string;
  remarks?: string;
}

export interface RevaluationApplication {
  id: string;
  application_number: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  examination_id: string;
  examination_name: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  service_type: 're_evaluation' | 're_totaling' | 'answer_script_copy';
  original_marks: number;
  original_grade: string;
  revised_marks?: number;
  revised_grade?: string;
  marks_difference?: number;
  fee_amount: number;
  payment_status: 'paid' | 'pending' | 'exempted';
  payment_reference: string;
  status: 'applied' | 'under_scrutiny' | 'revised' | 'no_change' | 'rejected';
  assigned_evaluator_name?: string;
  scrutiny_remarks?: string;
  applied_at: string;
  resolved_at?: string;
  resolved_by?: string;
  answer_script_url?: string;
  digitized_copy_available?: boolean;
}

export interface GradeScaleDefinition {
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'AB';
  range: string;
  min_pct: number;
  max_pct: number;
  grade_point: number;
  description: string;
  color_badge: string;
}

export const UGC_GRADE_SCALE: GradeScaleDefinition[] = [
  { grade: 'O', range: '90 - 100', min_pct: 90, max_pct: 100, grade_point: 10, description: 'Outstanding', color_badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { grade: 'A+', range: '80 - 89', min_pct: 80, max_pct: 89, grade_point: 9, description: 'Excellent', color_badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { grade: 'A', range: '70 - 79', min_pct: 70, max_pct: 79, grade_point: 8, description: 'Very Good', color_badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { grade: 'B+', range: '60 - 69', min_pct: 60, max_pct: 69, grade_point: 7, description: 'Good', color_badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { grade: 'B', range: '50 - 59', min_pct: 50, max_pct: 59, grade_point: 6, description: 'Above Average', color_badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { grade: 'C', range: '45 - 49', min_pct: 45, max_pct: 49, grade_point: 5, description: 'Average', color_badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  { grade: 'P', range: '40 - 44', min_pct: 40, max_pct: 44, grade_point: 4, description: 'Pass Threshold', color_badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  { grade: 'F', range: '0 - 39', min_pct: 0, max_pct: 39, grade_point: 0, description: 'Fail / Re-appear', color_badge: 'bg-red-50 text-red-700 border-red-200' },
  { grade: 'AB', range: 'Absent', min_pct: 0, max_pct: 0, grade_point: 0, description: 'Absent in Examination', color_badge: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const initialResults: SemesterResultWithDetails[] = [
  {
    id: 'res-stu-001-sem2',
    student_id: 'stu-001',
    examination_id: 'exam-spring-2026',
    semester_id: 'sem-mca-2',
    semester_number: 2,
    program_id: 'prog-mca-01',
    program_name: 'Master of Computer Applications (MCA)',
    department_id: 'dept-cse-01',
    department_name: 'Department of Computer Science & Applications',
    student_name: 'Sivangini',
    roll_number: 'MCANICA25017',
    enrollment_number: 'MCANICA25017',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    academic_session: '2025-26',
    examination_name: 'Spring 2026 End-Semester Examinations',
    examination_type: 'regular',
    result_status: 'published',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T14:30:00Z',
    approved_by_dean_id: 'prof-dean-01',
    approved_by_dean_name: 'Prof. Dr. Rajesh K. Varma, Ph.D.',
    approved_at: '2026-05-28T12:00:00Z',
    published_at: '2026-05-28T14:00:00Z',
    coe_signature_hash: 'COE-SIG-2026-9941-VERIFIED',
    qr_verification_code: 'UEAMS-VERIFY-2025-MCA-042-S2-892',
    subjects: [
      {
        subject_id: 'sub-mca-201',
        subject_code: 'MCA-201',
        subject_name: 'Data Structures and Algorithms',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 37,
        max_internal: 40,
        external_marks: 54,
        max_external: 60,
        total_marks: 91,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'O',
        grade_point: 10,
        credit_points: 40,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-202',
        subject_code: 'MCA-202',
        subject_name: 'Database Management Systems',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 35,
        max_internal: 40,
        external_marks: 49,
        max_external: 60,
        total_marks: 84,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A+',
        grade_point: 9,
        credit_points: 36,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-203',
        subject_code: 'MCA-203',
        subject_name: 'Operating Systems & System Architecture',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 34,
        max_internal: 40,
        external_marks: 48,
        max_external: 60,
        total_marks: 82,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A+',
        grade_point: 9,
        credit_points: 36,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-204',
        subject_code: 'MCA-204',
        subject_name: 'Advanced Programming Lab (C++ / Java)',
        subject_type: 'practical',
        credits: 3,
        internal_marks: 38,
        max_internal: 40,
        external_marks: 56,
        max_external: 60,
        total_marks: 94,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'O',
        grade_point: 10,
        credit_points: 30,
        status: 'PASS',
      },
    ],
    total_credits_registered: 15,
    total_credits_earned: 15,
    total_credit_points: 142,
    sgpa: 9.47,
    cgpa: 9.19,
    percentage_equivalent: 87.3,
    overall_status: 'PASS',
    academic_standing: 'First Class with Distinction',
    rank_in_class: 1,
    total_students_in_class: 4,
    rank_in_department: 2,
    cumulative_credits_earned: 35,
    cumulative_credits_required: 80,
    historical_semesters: [
      {
        semester_number: 1,
        session_name: 'Autumn 2025',
        total_credits: 20,
        earned_credits: 20,
        total_credit_points: 178,
        sgpa: 8.90,
        subjects: [
          { code: 'MCA-101', name: 'Mathematical Foundations of Computer Science', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
          { code: 'MCA-102', name: 'Object-Oriented Programming with C++', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
          { code: 'MCA-103', name: 'Computer Organization & Architecture', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
          { code: 'MCA-104', name: 'Software Engineering & Agile Methodologies', credits: 4, grade: 'O', grade_point: 10, status: 'PASS' },
          { code: 'MCA-105', name: 'Data Structures Lab in C', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
        ],
      },
    ],
    remarks: 'Candidate successfully completed all registered subjects in 1st attempt.',
  },
  {
    id: 'res-stu-002-sem2',
    student_id: 'stu-002',
    examination_id: 'exam-spring-2026',
    semester_id: 'sem-mca-2',
    semester_number: 2,
    program_id: 'prog-mca-01',
    program_name: 'Master of Computer Applications (MCA)',
    department_id: 'dept-cse-01',
    department_name: 'Department of Computer Science & Applications',
    student_name: 'Pooja Iyer',
    roll_number: 'MCANICA25026',
    enrollment_number: 'MCANICA25026',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    academic_session: '2025-26',
    examination_name: 'Spring 2026 End-Semester Examinations',
    examination_type: 'regular',
    result_status: 'published',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T14:30:00Z',
    approved_by_dean_id: 'prof-dean-01',
    approved_by_dean_name: 'Prof. Dr. Rajesh K. Varma, Ph.D.',
    approved_at: '2026-05-28T12:00:00Z',
    published_at: '2026-05-28T14:00:00Z',
    coe_signature_hash: 'COE-SIG-2026-9942-VERIFIED',
    qr_verification_code: 'UEAMS-VERIFY-2025-MCA-015-S2-860',
    subjects: [
      {
        subject_id: 'sub-mca-201',
        subject_code: 'MCA-201',
        subject_name: 'Data Structures and Algorithms',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 33,
        max_internal: 40,
        external_marks: 47,
        max_external: 60,
        total_marks: 80,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A+',
        grade_point: 9,
        credit_points: 36,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-202',
        subject_code: 'MCA-202',
        subject_name: 'Database Management Systems',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 36,
        max_internal: 40,
        external_marks: 52,
        max_external: 60,
        total_marks: 88,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A+',
        grade_point: 9,
        credit_points: 36,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-203',
        subject_code: 'MCA-203',
        subject_name: 'Operating Systems & System Architecture',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 32,
        max_internal: 40,
        external_marks: 44,
        max_external: 60,
        total_marks: 76,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A',
        grade_point: 8,
        credit_points: 32,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-204',
        subject_code: 'MCA-204',
        subject_name: 'Advanced Programming Lab (C++ / Java)',
        subject_type: 'practical',
        credits: 3,
        internal_marks: 36,
        max_internal: 40,
        external_marks: 53,
        max_external: 60,
        total_marks: 89,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A+',
        grade_point: 9,
        credit_points: 27,
        status: 'PASS',
      },
    ],
    total_credits_registered: 15,
    total_credits_earned: 15,
    total_credit_points: 131,
    sgpa: 8.73,
    cgpa: 8.65,
    percentage_equivalent: 82.2,
    overall_status: 'PASS',
    academic_standing: 'First Class with Distinction',
    rank_in_class: 2,
    total_students_in_class: 4,
    rank_in_department: 4,
    cumulative_credits_earned: 35,
    cumulative_credits_required: 80,
    historical_semesters: [
      {
        semester_number: 1,
        session_name: 'Autumn 2025',
        total_credits: 20,
        earned_credits: 20,
        total_credit_points: 172,
        sgpa: 8.60,
        subjects: [
          { code: 'MCA-101', name: 'Mathematical Foundations of Computer Science', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
          { code: 'MCA-102', name: 'Object-Oriented Programming with C++', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
          { code: 'MCA-103', name: 'Computer Organization & Architecture', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
          { code: 'MCA-104', name: 'Software Engineering & Agile Methodologies', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
          { code: 'MCA-105', name: 'Data Structures Lab in C', credits: 4, grade: 'A+', grade_point: 9, status: 'PASS' },
        ],
      },
    ],
    remarks: 'Candidate eligible for distinction honors.',
  },
  {
    id: 'res-stu-003-sem2',
    student_id: 'stu-003',
    examination_id: 'exam-spring-2026',
    semester_id: 'sem-mca-2',
    semester_number: 2,
    program_id: 'prog-mca-01',
    program_name: 'Master of Computer Applications (MCA)',
    department_id: 'dept-cse-01',
    department_name: 'Department of Computer Science & Applications',
    student_name: 'Vikram Aditya Verma',
    roll_number: '2025-MCA-028',
    enrollment_number: 'MCANICA25029',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    academic_session: '2025-26',
    examination_name: 'Spring 2026 End-Semester Examinations',
    examination_type: 'regular',
    result_status: 'published',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T14:30:00Z',
    approved_by_dean_id: 'prof-dean-01',
    approved_by_dean_name: 'Prof. Dr. Rajesh K. Varma, Ph.D.',
    approved_at: '2026-05-28T12:00:00Z',
    published_at: '2026-05-28T14:00:00Z',
    coe_signature_hash: 'COE-SIG-2026-9943-VERIFIED',
    qr_verification_code: 'UEAMS-VERIFY-2025-MCA-028-S2-740',
    subjects: [
      {
        subject_id: 'sub-mca-201',
        subject_code: 'MCA-201',
        subject_name: 'Data Structures and Algorithms',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 28,
        max_internal: 40,
        external_marks: 40,
        max_external: 60,
        total_marks: 68,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'B+',
        grade_point: 7,
        credit_points: 28,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-202',
        subject_code: 'MCA-202',
        subject_name: 'Database Management Systems',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 30,
        max_internal: 40,
        external_marks: 42,
        max_external: 60,
        total_marks: 72,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A',
        grade_point: 8,
        credit_points: 32,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-203',
        subject_code: 'MCA-203',
        subject_name: 'Operating Systems & System Architecture',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 26,
        max_internal: 40,
        external_marks: 37,
        max_external: 60,
        total_marks: 63,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'B+',
        grade_point: 7,
        credit_points: 28,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-204',
        subject_code: 'MCA-204',
        subject_name: 'Advanced Programming Lab (C++ / Java)',
        subject_type: 'practical',
        credits: 3,
        internal_marks: 32,
        max_internal: 40,
        external_marks: 46,
        max_external: 60,
        total_marks: 78,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'A',
        grade_point: 8,
        credit_points: 24,
        status: 'PASS',
      },
    ],
    total_credits_registered: 15,
    total_credits_earned: 15,
    total_credit_points: 112,
    sgpa: 7.47,
    cgpa: 7.42,
    percentage_equivalent: 70.5,
    overall_status: 'PASS',
    academic_standing: 'First Class',
    rank_in_class: 3,
    total_students_in_class: 4,
    rank_in_department: 7,
    cumulative_credits_earned: 35,
    cumulative_credits_required: 80,
    historical_semesters: [
      {
        semester_number: 1,
        session_name: 'Autumn 2025',
        total_credits: 20,
        earned_credits: 20,
        total_credit_points: 148,
        sgpa: 7.40,
        subjects: [
          { code: 'MCA-101', name: 'Mathematical Foundations of Computer Science', credits: 4, grade: 'B+', grade_point: 7, status: 'PASS' },
          { code: 'MCA-102', name: 'Object-Oriented Programming with C++', credits: 4, grade: 'B+', grade_point: 7, status: 'PASS' },
          { code: 'MCA-103', name: 'Computer Organization & Architecture', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
          { code: 'MCA-104', name: 'Software Engineering & Agile Methodologies', credits: 4, grade: 'B+', grade_point: 7, status: 'PASS' },
          { code: 'MCA-105', name: 'Data Structures Lab in C', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
        ],
      },
    ],
    remarks: 'Promoted to Semester 3 without any backlogs.',
  },
  {
    id: 'res-stu-004-sem2',
    student_id: 'stu-004',
    examination_id: 'exam-spring-2026',
    semester_id: 'sem-mca-2',
    semester_number: 2,
    program_id: 'prog-mca-01',
    program_name: 'Master of Computer Applications (MCA)',
    department_id: 'dept-cse-01',
    department_name: 'Department of Computer Science & Applications',
    student_name: 'Neha Roy',
    roll_number: '2025-MCA-009',
    enrollment_number: 'ENR-2025-MCA-004',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    academic_session: '2025-26',
    examination_name: 'Spring 2026 End-Semester Examinations',
    examination_type: 'regular',
    result_status: 'published',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T14:30:00Z',
    approved_by_dean_id: 'prof-dean-01',
    approved_by_dean_name: 'Prof. Dr. Rajesh K. Varma, Ph.D.',
    approved_at: '2026-05-28T12:00:00Z',
    published_at: '2026-05-28T14:00:00Z',
    coe_signature_hash: 'COE-SIG-2026-9944-VERIFIED',
    qr_verification_code: 'UEAMS-VERIFY-2025-MCA-009-S2-560',
    subjects: [
      {
        subject_id: 'sub-mca-201',
        subject_code: 'MCA-201',
        subject_name: 'Data Structures and Algorithms',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 18,
        max_internal: 40,
        external_marks: 21,
        max_external: 60,
        total_marks: 39,
        max_total: 100,
        grace_marks: 2,
        letter_grade: 'P',
        grade_point: 4,
        credit_points: 16,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-202',
        subject_code: 'MCA-202',
        subject_name: 'Database Management Systems',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 22,
        max_internal: 40,
        external_marks: 32,
        max_external: 60,
        total_marks: 54,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'B',
        grade_point: 6,
        credit_points: 24,
        status: 'PASS',
      },
      {
        subject_id: 'sub-mca-203',
        subject_code: 'MCA-203',
        subject_name: 'Operating Systems & System Architecture',
        subject_type: 'theory',
        credits: 4,
        internal_marks: 19,
        max_internal: 40,
        external_marks: 17,
        max_external: 60,
        total_marks: 36,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'F',
        grade_point: 0,
        credit_points: 0,
        status: 'ARREAR',
      },
      {
        subject_id: 'sub-mca-204',
        subject_code: 'MCA-204',
        subject_name: 'Advanced Programming Lab (C++ / Java)',
        subject_type: 'practical',
        credits: 3,
        internal_marks: 25,
        max_internal: 40,
        external_marks: 35,
        max_external: 60,
        total_marks: 60,
        max_total: 100,
        grace_marks: 0,
        letter_grade: 'B+',
        grade_point: 7,
        credit_points: 21,
        status: 'PASS',
      },
    ],
    total_credits_registered: 15,
    total_credits_earned: 11,
    total_credit_points: 61,
    sgpa: 4.07,
    cgpa: 5.65,
    percentage_equivalent: 53.6,
    overall_status: 'PROMOTED_WITH_ARREARS',
    academic_standing: 'Needs Improvement',
    rank_in_class: 4,
    total_students_in_class: 4,
    rank_in_department: 12,
    cumulative_credits_earned: 31,
    cumulative_credits_required: 80,
    historical_semesters: [
      {
        semester_number: 1,
        session_name: 'Autumn 2025',
        total_credits: 20,
        earned_credits: 20,
        total_credit_points: 137,
        sgpa: 6.85,
        subjects: [
          { code: 'MCA-101', name: 'Mathematical Foundations of Computer Science', credits: 4, grade: 'B', grade_point: 6, status: 'PASS' },
          { code: 'MCA-102', name: 'Object-Oriented Programming with C++', credits: 4, grade: 'B+', grade_point: 7, status: 'PASS' },
          { code: 'MCA-103', name: 'Computer Organization & Architecture', credits: 4, grade: 'B', grade_point: 6, status: 'PASS' },
          { code: 'MCA-104', name: 'Software Engineering & Agile Methodologies', credits: 4, grade: 'B+', grade_point: 7, status: 'PASS' },
          { code: 'MCA-105', name: 'Data Structures Lab in C', credits: 4, grade: 'A', grade_point: 8, status: 'PASS' },
        ],
      },
    ],
    remarks: 'Promoted with 1 Arrear backlog in MCA-203. Supplementary exam registration required.',
  },
];

export const initialRevaluations: RevaluationApplication[] = [
  {
    id: 'rev-001',
    application_number: 'REV-2026-0841',
    student_id: 'stu-004',
    student_name: 'Neha Roy',
    roll_number: '2025-MCA-009',
    examination_id: 'exam-spring-2026',
    examination_name: 'Spring 2026 End-Semester Examinations',
    subject_id: 'sub-mca-203',
    subject_code: 'MCA-203',
    subject_name: 'Operating Systems & System Architecture',
    service_type: 're_evaluation',
    original_marks: 36,
    original_grade: 'F',
    fee_amount: 500,
    payment_status: 'paid',
    payment_reference: 'UPI-TXN-908123984',
    status: 'under_scrutiny',
    assigned_evaluator_name: 'Dr. Suresh Chandra, External Board',
    scrutiny_remarks: 'Script dispatched to external evaluator for re-assessment under sealed envelope.',
    applied_at: '2026-05-30T09:15:00Z',
  },
  {
    id: 'rev-002',
    application_number: 'REV-2026-0729',
    student_id: 'stu-003',
    student_name: 'Vikram Aditya Verma',
    roll_number: '2025-MCA-028',
    examination_id: 'exam-spring-2026',
    examination_name: 'Spring 2026 End-Semester Examinations',
    subject_id: 'sub-mca-201',
    subject_code: 'MCA-201',
    subject_name: 'Data Structures and Algorithms',
    service_type: 're_totaling',
    original_marks: 68,
    original_grade: 'B+',
    revised_marks: 71,
    revised_grade: 'A',
    marks_difference: 3,
    fee_amount: 300,
    payment_status: 'paid',
    payment_reference: 'NETBANK-SBI-772911',
    status: 'revised',
    assigned_evaluator_name: 'Scrutiny Committee Cell',
    scrutiny_remarks: 'Discrepancy noted in Section B question 4(b) total. +3 marks credited. Grade revised from B+ to A.',
    applied_at: '2026-05-29T11:00:00Z',
    resolved_at: '2026-05-31T15:20:00Z',
    resolved_by: 'Controller of Examinations',
  },
];
