export type UserRole = 'student' | 'faculty' | 'administrator' | 'dean';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ExamScheduleStatus = 'draft' | 'submitted' | 'approved' | 'published';
export type MarksStatus = 'draft' | 'submitted' | 'verified' | 'locked';
export type ResultStatus = 'draft' | 'pending_approval' | 'approved' | 'published';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type ExamFormStatus = 'submitted' | 'approved' | 'rejected' | 'admit_card_generated';

export interface Profile {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  head_of_department_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  department_id: string;
  code: string;
  name: string;
  degree_level: 'undergraduate' | 'postgraduate' | 'diploma' | 'doctorate';
  total_semesters: number;
  created_at: string;
  updated_at: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  program_id: string;
  session_id: string;
  semester_number: number;
  term_type: 'odd' | 'even' | 'summer';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  department_id: string;
  program_id: string;
  code: string;
  name: string;
  credits: number;
  semester_number: number;
  type: 'theory' | 'practical' | 'elective' | 'project';
  max_internal_marks: number;
  max_external_marks: number;
  pass_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  enrollment_number: string;
  roll_number: string;
  department_id: string;
  program_id: string;
  current_semester_id?: string;
  admission_session_id: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  category?: string;
  father_name?: string;
  mother_name?: string;
  emergency_phone?: string;
  permanent_address?: string;
  current_address?: string;
  cgpa?: number;
  credits_earned?: number;
  academic_standing?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  user_id: string;
  employee_id: string;
  department_id: string;
  designation: string;
  specialization?: string;
  joining_date?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  semester_id: string;
  subject_id: string;
  enrolled_at: string;
  status: 'enrolled' | 'dropped' | 'completed';
}

export interface Attendance {
  id: string;
  subject_id: string;
  student_id: string;
  faculty_id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  created_at: string;
}

export interface Examination {
  id: string;
  session_id: string;
  semester_id: string;
  name: string;
  exam_type: 'regular' | 'supplementary' | 'improvement';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamSchedule {
  id: string;
  examination_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  status: ExamScheduleStatus;
  reviewed_by_dean_id?: string;
  approved_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  building: string;
  floor: number;
  capacity: number;
  is_available: boolean;
  created_at: string;
}

export interface SeatingArrangement {
  id: string;
  exam_schedule_id: string;
  room_id: string;
  student_id: string;
  seat_number: string;
  created_at: string;
}

export interface FacultyExamDuty {
  id: string;
  exam_schedule_id: string;
  faculty_id: string;
  room_id: string;
  duty_role: 'invigilator' | 'reliever' | 'chief_superintendent';
  status: 'assigned' | 'confirmed' | 'completed';
  assigned_at: string;
}

export interface Marks {
  id: string;
  student_id: string;
  subject_id: string;
  examination_id: string;
  entered_by_faculty_id: string;
  internal_marks: number;
  external_marks: number;
  practical_marks?: number;
  total_marks: number;
  status: MarksStatus;
  verified_by_admin_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  student_id: string;
  examination_id: string;
  semester_id: string;
  total_credits: number;
  sgpa: number;
  cgpa: number;
  result_status: ResultStatus;
  approved_by_dean_id?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'students' | 'faculty' | 'administrators' | 'deans';
  author_id: string;
  is_pinned: boolean;
  published_at: string;
  expires_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description: string;
  severity?: 'info' | 'warning' | 'security' | 'critical';
  ip_address?: string;
  created_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  document_type: string;
  title: string;
  file_url: string;
  verified: boolean;
  verified_by?: string;
  created_at: string;
}

export interface TimetableSlotDB {
  id: string;
  subject_id: string;
  faculty_id?: string;
  semester_id: string;
  room_id?: string;
  room_number: string;
  building: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_number: number;
  start_time: string;
  end_time: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  batch?: string;
  substitute_faculty_id?: string;
  substitute_date?: string;
  substitute_reason?: string;
  substitute_notes?: string;
  substitute_status?: 'none' | 'arranged' | 'confirmed' | 'completed' | 'revoked';
  created_at: string;
}

export interface AcademicCalendarEventDB {
  id: string;
  session_id?: string;
  event_date: string;
  title: string;
  category: 'lecture' | 'exam' | 'holiday' | 'event' | 'deadline';
  description?: string;
  venue?: string;
  start_time?: string;
  created_at: string;
}

export interface ExamRegistrationDB {
  id: string;
  application_no: string;
  student_id: string;
  examination_id: string;
  semester_id: string;
  candidate_type?: 'Regular' | 'Ex-Student / Re-appear' | 'Improvement';
  total_papers_count: number;
  total_credits: number;
  examination_fee: number;
  backlog_fee: number;
  marksheet_fee: number;
  center_fee?: number;
  total_amount_paid: number;
  payment_status: 'pending' | 'paid' | 'exempted';
  payment_transaction_id?: string;
  student_phone?: string;
  student_email?: string;
  guardian_name?: string;
  emergency_phone?: string;
  correspondence_address?: string;
  category?: string;
  attendance_percentage: number;
  is_eligible: boolean;
  approval_status: 'approved' | 'pending_dean_review' | 'rejected';
  admit_card_available: boolean;
  exam_center: string;
  submitted_at: string;
}

export interface ExamRegistrationPaperDB {
  id: string;
  registration_id: string;
  subject_id: string;
  paper_type: 'regular' | 'backlog' | 'improvement';
  credits: number;
  fee: number;
  status: string;
  created_at: string;
}

export interface ScholarshipSchemeDB {
  id: string;
  name: string;
  provider: string;
  category: 'Merit-Based' | 'Need-Based' | 'Girls Empowerment' | 'Special Category' | 'Sports / Research';
  amount_per_annum: number;
  eligibility: string;
  min_cgpa?: number;
  max_family_income?: number;
  deadline: string;
  description?: string;
  badge?: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface ScholarshipApplicationDB {
  id: string;
  application_no: string;
  scheme_id: string;
  student_id: string;
  annual_family_income: number;
  category: string;
  cgpa: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  applied_amount: number;
  sanctioned_amount?: number;
  status: 'submitted' | 'verified_by_advisor' | 'sanctioned_by_dean' | 'disbursed' | 'rejected';
  dean_remarks?: string;
  dean_pin_signed: boolean;
  sanctioned_at?: string;
  disbursement_date?: string;
  utr_number?: string;
  created_at: string;
}

export interface ScholarshipDocumentDB {
  id: string;
  application_id: string;
  document_name: string;
  file_type: string;
  file_url: string;
  is_verified: boolean;
  created_at: string;
}

export interface StudentClearanceDB {
  id: string;
  student_id: string;
  semester_id: string;
  accounts_cleared: boolean;
  accounts_dues_amount: number;
  accounts_cleared_at?: string;
  library_cleared: boolean;
  library_overdue_books_count: number;
  library_cleared_at?: string;
  attendance_percentage: number;
  attendance_cleared: boolean;
  mentor_approval: boolean;
  mentor_condoned: boolean;
  mentor_id?: string;
  mentor_approved_at?: string;
  can_apply_for_exam: boolean;
  overall_status: 'cleared' | 'action_required' | 'blocked';
  noc_reference: string;
  cleared_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAchievementDB {
  id: string;
  student_id: string;
  title: string;
  category: 'Hackathon / Competition' | 'Industry Internship' | 'Professional Certification' | 'Research Paper / Publication' | 'Sports & Athletics' | 'Cultural & Fine Arts';
  issuing_organization: string;
  issue_date: string;
  credential_id?: string;
  credential_url?: string;
  certificate_file_url: string;
  badge?: string;
  is_verified: boolean;
  verified_by?: string;
  created_at: string;
}

export interface FacultyMentorshipCohortDB {
  id: string;
  faculty_id: string;
  program_id: string;
  semester_id: string;
  section: string;
  session_id: string;
  cohort_name: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentMentorshipRecordDB {
  id: string;
  cohort_id: string;
  student_id: string;
  attendance_percentage: number;
  total_lectures: number;
  attended_lectures: number;
  cgpa: number;
  backlog_count: number;
  no_dues_status: 'cleared' | 'accounts_pending' | 'library_pending';
  mentor_approval_status: 'approved' | 'pending' | 'condoned' | 'rejected';
  condonation_reason?: string;
  condoned_at?: string;
  counseling_notes?: string;
  last_counseled_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipGuardianAlertDB {
  id: string;
  student_id: string;
  faculty_id: string;
  alert_type: 'shortage' | 'dues' | 'counseling' | 'appreciation';
  message: string;
  sent_to_phone?: string;
  sent_to_email?: string;
  delivery_status: string;
  sent_at: string;
}

export interface FacultyLeaveProxyDB {
  id: string;
  slot_id: string;
  original_faculty_id: string;
  substitute_faculty_id: string;
  leave_date: string;
  leave_type: 'Casual Leave (CL)' | 'Academic / Conference Duty (OD)' | 'Medical Leave' | 'Official University Deputation' | 'Personal Emergency';
  handover_notes?: string;
  status: 'arranged' | 'confirmed' | 'completed' | 'revoked';
  created_at: string;
}

export interface MedicalCondonationDB {
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

export interface FeeStructureDB {
  id: string;
  program_code: string;
  program_name: string;
  semester: number;
  academic_year: string;
  tuition_fee: number;
  lab_fee: number;
  library_fee: number;
  exam_fee: number;
  development_fee: number;
  total_fee: number;
  due_date: string;
  created_at: string;
}

export interface StudentFeeRecordDB {
  id: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  program: string;
  semester: number;
  academic_year: string;
  total_billed: number;
  total_paid: number;
  scholarship_offset: number;
  balance_due: number;
  status: 'PAID' | 'PARTIAL' | 'DUE' | 'OVERDUE';
  last_payment_date?: string;
  hall_ticket_blocked: boolean;
  created_at: string;
}

export interface FeeReceiptDB {
  id: string;
  receipt_no: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  program: string;
  semester: number;
  amount: number;
  payment_mode: 'NetBanking' | 'UPI' | 'Demand Draft' | 'Credit Card' | 'Challan';
  transaction_ref: string;
  heads: { name: string; amount: number }[];
  date: string;
  cashier: string;
  status: 'VALID' | 'CANCELLED';
  cancel_reason?: string;
  created_at: string;
}

export interface FeeRefundDB {
  id: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  reason: string;
  amount_requested: number;
  amount_approved?: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  applied_date: string;
  approver?: string;
  approval_date?: string;
  bank_details: {
    account_no: string;
    ifsc: string;
    bank_name: string;
  };
  created_at: string;
}

export interface AcademicTermMasterDB {
  id: string;
  term_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  instructional_days: number;
  exam_start_date: string;
  exam_end_date: string;
  admission_start: string;
  admission_end: string;
  status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED';
  gazetted: boolean;
  created_at: string;
}

export interface UniversityEventDB {
  id: string;
  title: string;
  category: 'HOLIDAY' | 'EXAM_WINDOW' | 'ACADEMIC_EVENT' | 'STATUTORY_MEETING';
  start_date: string;
  end_date: string;
  description: string;
  affects_instruction: boolean;
  public_circular_url?: string;
  created_at: string;
}

export interface SystemBackupDB {
  id: string;
  timestamp: string;
  type: 'SCHEDULED' | 'MANUAL_SNAPSHOT' | 'PRE_IMPORT_BACKUP';
  record_count: number;
  size_kb: number;
  file_name: string;
  checksum: string;
  created_by: string;
  status: 'SUCCESS' | 'CORRUPTED';
  created_at: string;
}

export interface BulkImportLogDB {
  id: string;
  timestamp: string;
  file_name: string;
  entity_type: 'students' | 'faculty' | 'marks' | 'timetable' | 'attendance';
  total_records: number;
  success_count: number;
  failed_count: number;
  imported_by: string;
  can_rollback: boolean;
  is_rolled_back: boolean;
  rolled_back_at?: string;
  created_at: string;
}

export interface CustomRoleDB {
  id: string;
  role_code: string;
  role_name: string;
  description: string;
  department_scoped: boolean;
  scope_department?: string;
  is_system_reserved: boolean;
  permissions: {
    academics: ('view' | 'create' | 'edit' | 'delete')[];
    examinations: ('view' | 'create' | 'edit' | 'approve')[];
    finance: ('view' | 'issue' | 'refund')[];
    grievances: ('view' | 'resolve' | 'escalate')[];
    audit: ('view' | 'export')[];
  };
  assigned_users_count: number;
  created_at: string;
}

export interface DispatchCampaignDB {
  id: string;
  campaign_name: string;
  channel: 'EMAIL' | 'SMS' | 'IN_PORTAL_ALERT' | 'OMNICHANNEL';
  target_audience: 'ALL_STUDENTS' | 'DEFAULTERS_ONLY' | 'PROGRAM_COHORT' | 'ALL_FACULTY';
  target_program?: string;
  subject: string;
  body_template: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  bounced_count: number;
  scheduled_for?: string;
  dispatched_at: string;
  dispatched_by: string;
  status: 'DRAFT' | 'SCHEDULED' | 'DISPATCHED' | 'FAILED';
  created_at: string;
}

export interface LibraryBookDB {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  created_at: string;
}

export interface LibraryCirculationDB {
  id: string;
  book_id: string;
  book_title: string;
  isbn: string;
  borrower_type: 'STUDENT' | 'FACULTY';
  borrower_id: string;
  borrower_name: string;
  roll_or_emp_id: string;
  issued_date: string;
  due_date: string;
  returned_date?: string;
  fine_amount: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  created_at: string;
}

export interface LabAssetDB {
  id: string;
  asset_code: string;
  name: string;
  lab_name: string;
  department: string;
  purchase_date: string;
  warranty_expiry: string;
  last_maintenance: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
  created_at: string;
}

export interface MakerCheckerRequestDB {
  id: string;
  operation_type: 'DEPARTMENT_PURGE' | 'DEGREE_PROGRAM_PURGE' | 'RESULT_GAZETTE_PUBLISH' | 'HIGH_VALUE_REFUND' | 'DB_HARD_RESET' | 'EXAM_SCHEDULE_UNLOCK';
  title: string;
  description: string;
  target_entity: string;
  requested_by: string;
  requested_at: string;
  payload: Record<string, any>;
  status: 'PENDING_SECOND_APPROVAL' | 'AUTHORIZED' | 'REJECTED';
  authorized_by?: string;
  authorized_at?: string;
  authorization_notes?: string;
  security_hash: string;
  created_at: string;
}

export interface CampusDB {
  id: string;
  code: string;
  name: string;
  city: string;
  is_main: boolean;
  total_students: number;
  total_faculty: number;
  active_programs: number;
  created_at: string;
}

export interface PlacementDriveDB {
  id: string;
  company_name: string;
  role: string;
  package_ctc_lpa: number;
  drive_date: string;
  eligible_programs: string[];
  min_cgpa: number;
  total_registered: number;
  selected_count: number;
  status: 'UPCOMING' | 'ONGOING' | 'CONCLUDED';
  recruiter_contact: string;
  created_at: string;
}

export interface AlumniProfileDB {
  id: string;
  full_name: string;
  graduation_year: number;
  program: string;
  company: string;
  designation: string;
  location: string;
  linkedin_url?: string;
  email: string;
  mentorship_available: boolean;
  created_at: string;
}

export interface AccreditationCriterionDB {
  id: string;
  code: string;
  title: string;
  weightage: number;
  score_attained: number;
  status: 'COMPLIANT' | 'SUBMITTED' | 'NEEDS_REVIEW' | 'GAP_IDENTIFIED';
  lead_evaluator: string;
  key_indicators: {
    indicator_code: string;
    description: string;
    max_score: number;
    awarded_score: number;
    evidence_documents: string[];
  }[];
  created_at: string;
}
