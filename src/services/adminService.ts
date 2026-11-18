import { auditService } from './auditService.js';

export interface FeeStructure {
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
}

export interface StudentFeeRecord {
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
}

export interface FeeReceipt {
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
}

export interface RefundApplication {
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
}

export interface AcademicTermMaster {
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
}

export interface UniversityEvent {
  id: string;
  title: string;
  category: 'HOLIDAY' | 'EXAM_WINDOW' | 'ACADEMIC_EVENT' | 'STATUTORY_MEETING';
  start_date: string;
  end_date: string;
  description: string;
  affects_instruction: boolean;
  public_circular_url?: string;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'SCHEDULED' | 'MANUAL_SNAPSHOT' | 'PRE_IMPORT_BACKUP';
  record_count: number;
  size_kb: number;
  file_name: string;
  checksum: string;
  created_by: string;
  status: 'SUCCESS' | 'CORRUPTED';
}

export interface BulkImportLog {
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
}

export interface CustomRole {
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
}

export interface DispatchCampaign {
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
}

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
}

export interface CirculationRecord {
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
}

export interface LabAsset {
  id: string;
  asset_code: string;
  name: string;
  lab_name: string;
  department: string;
  purchase_date: string;
  warranty_expiry: string;
  last_maintenance: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
}

export interface SystemHealthData {
  supabaseStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  dbUptime: string;
  latencyMs: number;
  activeWorkers: number;
  queuePendingJobs: number;
  cacheHitRatio: number;
  diskUsagePct: number;
  lastVerifiedAt: string;
}

export interface DataIntegrityAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  affected_count: number;
  entity: string;
  resolution_route: string;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  city: string;
  is_main: boolean;
  total_students: number;
  total_faculty: number;
  active_programs: number;
}

export interface PlacementDrive {
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
}

export interface AlumniProfile {
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
}

export interface AccreditationCriterion {
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
}

export interface ProgramOutcomeAttainment {
  code: string;
  name: string;
  target_pct: number;
  attained_pct: number;
  status: 'ATTAINED' | 'NEAR_ATTAINED' | 'DEFICIENT';
}

export interface MakerCheckerRequest {
  id: string;
  operation_type: 'DEPARTMENT_PURGE' | 'DEGREE_PROGRAM_PURGE' | 'RESULT_GAZETTE_PUBLISH' | 'HIGH_VALUE_REFUND' | 'DB_HARD_RESET' | 'EXAM_SCHEDULE_UNLOCK' | 'HIGH_VALUE_SCHOLARSHIP_SANCTION';
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
}

// ── DEFAULT SEED DATA ──
const INITIAL_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fs-mca-sem2',
    program_code: 'MCA',
    program_name: 'Master of Computer Applications',
    semester: 2,
    academic_year: '2025-2026',
    tuition_fee: 50000,
    lab_fee: 8500,
    library_fee: 4500,
    exam_fee: 3000,
    development_fee: 2500,
    total_fee: 68500,
    due_date: '2026-05-15',
  },
  {
    id: 'fs-btech-sem4',
    program_code: 'BTECH_CSE',
    program_name: 'B.Tech Computer Science & Engineering',
    semester: 4,
    academic_year: '2025-2026',
    tuition_fee: 65000,
    lab_fee: 12000,
    library_fee: 5000,
    exam_fee: 3500,
    development_fee: 4500,
    total_fee: 90000,
    due_date: '2026-05-15',
  },
  {
    id: 'fs-mba-sem2',
    program_code: 'MBA',
    program_name: 'Master of Business Administration',
    semester: 2,
    academic_year: '2025-2026',
    tuition_fee: 75000,
    lab_fee: 5000,
    library_fee: 6000,
    exam_fee: 3000,
    development_fee: 5000,
    total_fee: 94000,
    due_date: '2026-05-15',
  },
];

const INITIAL_STUDENT_FEES: StudentFeeRecord[] = [
  {
    id: 'sfr-001',
    student_id: 'stu-001',
    roll_number: '2025MCA04',
    student_name: 'Rahul Sharma',
    program: 'MCA',
    semester: 2,
    academic_year: '2025-2026',
    total_billed: 68500,
    total_paid: 43500,
    scholarship_offset: 25000,
    balance_due: 0,
    status: 'PAID',
    last_payment_date: '2026-04-20',
    hall_ticket_blocked: false,
  },
  {
    id: 'sfr-002',
    student_id: 'stu-002',
    roll_number: '2025MCA12',
    student_name: 'Priya Patel',
    program: 'MCA',
    semester: 2,
    academic_year: '2025-2026',
    total_billed: 68500,
    total_paid: 48500,
    scholarship_offset: 0,
    balance_due: 20000,
    status: 'PARTIAL',
    last_payment_date: '2026-02-10',
    hall_ticket_blocked: false,
  },
  {
    id: 'sfr-003',
    student_id: 'stu-003',
    roll_number: '2025MCA15',
    student_name: 'Amit Kumar',
    program: 'MCA',
    semester: 2,
    academic_year: '2025-2026',
    total_billed: 68500,
    total_paid: 15000,
    scholarship_offset: 0,
    balance_due: 53500,
    status: 'OVERDUE',
    last_payment_date: '2026-01-05',
    hall_ticket_blocked: true,
  },
  {
    id: 'sfr-004',
    student_id: 'stu-004',
    roll_number: '2025MCA22',
    student_name: 'Sneha Verma',
    program: 'MCA',
    semester: 2,
    academic_year: '2025-2026',
    total_billed: 68500,
    total_paid: 68500,
    scholarship_offset: 0,
    balance_due: 0,
    status: 'PAID',
    last_payment_date: '2026-01-14',
    hall_ticket_blocked: false,
  },
  {
    id: 'sfr-005',
    student_id: 'stu-005',
    roll_number: '2024BTCSE08',
    student_name: 'Vikram Singh',
    program: 'B.Tech CSE',
    semester: 4,
    academic_year: '2025-2026',
    total_billed: 90000,
    total_paid: 90000,
    scholarship_offset: 0,
    balance_due: 0,
    status: 'PAID',
    last_payment_date: '2026-01-10',
    hall_ticket_blocked: false,
  },
];

const INITIAL_RECEIPTS: FeeReceipt[] = [
  {
    id: 'rcp-001',
    receipt_no: 'ITM/RCP/2026/0491',
    student_id: 'stu-001',
    roll_number: '2025MCA04',
    student_name: 'Rahul Sharma',
    program: 'MCA',
    semester: 2,
    amount: 3000,
    payment_mode: 'UPI',
    transaction_ref: 'UPI/HDFC/2026042091823',
    heads: [{ name: 'End-Semester Examination Fee', amount: 3000 }],
    date: '2026-04-20 14:32',
    cashier: 'System Gateway',
    status: 'VALID',
  },
  {
    id: 'rcp-002',
    receipt_no: 'ITM/RCP/2026/0488',
    student_id: 'stu-001',
    roll_number: '2025MCA04',
    student_name: 'Rahul Sharma',
    program: 'MCA',
    semester: 2,
    amount: 40500,
    payment_mode: 'NetBanking',
    transaction_ref: 'NB/SBI/992817263',
    heads: [
      { name: 'Tuition Fee (Partial Balance)', amount: 25000 },
      { name: 'Computer Lab Fee', amount: 8500 },
      { name: 'Library Fee', amount: 4500 },
      { name: 'Development Fee', amount: 2500 },
    ],
    date: '2026-01-12 11:15',
    cashier: 'Accounts Desk #2',
    status: 'VALID',
  },
];

const INITIAL_REFUNDS: RefundApplication[] = [
  {
    id: 'ref-001',
    student_id: 'stu-003',
    roll_number: '2025MCA15',
    student_name: 'Amit Kumar',
    reason: 'Double payment deduction during revaluation portal glitch',
    amount_requested: 1500,
    amount_approved: 1500,
    status: 'APPROVED',
    applied_date: '2026-04-18',
    approver: 'Finance Officer (Shri R.K. Mehta)',
    approval_date: '2026-04-20',
    bank_details: {
      account_no: '918273645019',
      ifsc: 'HDFC0001234',
      bank_name: 'HDFC Bank',
    },
  },
];

const INITIAL_IMPORT_LOGS: BulkImportLog[] = [
  {
    id: 'imp-001',
    timestamp: '2026-04-22 10:14',
    file_name: 'MCA_Sem2_Student_Admissions_Final.csv',
    entity_type: 'students',
    total_records: 62,
    success_count: 62,
    failed_count: 0,
    imported_by: 'Administrator (CoE Registry)',
    can_rollback: true,
    is_rolled_back: false,
  },
  {
    id: 'imp-002',
    timestamp: '2026-04-25 16:30',
    file_name: 'Internal_Marks_CIA_2_Draft.csv',
    entity_type: 'marks',
    total_records: 248,
    success_count: 244,
    failed_count: 4,
    imported_by: 'Dr. Priya Nambiar',
    can_rollback: true,
    is_rolled_back: false,
  },
];

const INITIAL_BACKUPS: BackupRecord[] = [
  {
    id: 'bkp-20260430',
    timestamp: '2026-04-30 02:00',
    type: 'SCHEDULED',
    record_count: 4850,
    size_kb: 14200,
    file_name: 'ITM_UEAMS_Snapshot_20260430_0200.sql.gz',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_by: 'Automated Cron Daemon',
    status: 'SUCCESS',
  },
  {
    id: 'bkp-20260429',
    timestamp: '2026-04-29 02:00',
    type: 'SCHEDULED',
    record_count: 4810,
    size_kb: 14050,
    file_name: 'ITM_UEAMS_Snapshot_20260429_0200.sql.gz',
    checksum: '8b7f14b62d8544c9d5df68b8e0e7a4628f8f2638848d79a78525b42d5448377c',
    created_by: 'Automated Cron Daemon',
    status: 'SUCCESS',
  },
];

const INITIAL_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role-exam-sup',
    role_code: 'EXAM_SUPERINTENDENT',
    role_name: 'Examination Center Superintendent',
    description: 'Responsible for center logistics, seating verification, and answer packet sealing.',
    department_scoped: false,
    is_system_reserved: false,
    permissions: {
      academics: ['view'],
      examinations: ['view', 'create', 'edit', 'approve'],
      finance: ['view'],
      grievances: ['view', 'resolve'],
      audit: ['view'],
    },
    assigned_users_count: 4,
  },
  {
    id: 'role-lab-incharge',
    role_code: 'LAB_INCHARGE',
    role_name: 'Laboratory Custodian & In-Charge',
    description: 'Oversees equipment inventory, calibration records, and software sandboxes.',
    department_scoped: true,
    scope_department: 'Department of Computer Science',
    is_system_reserved: false,
    permissions: {
      academics: ['view'],
      examinations: ['view'],
      finance: ['view'],
      grievances: ['view'],
      audit: ['view'],
    },
    assigned_users_count: 6,
  },
  {
    id: 'role-placement-officer',
    role_code: 'PLACEMENT_OFFICER',
    role_name: 'Training & Corporate Placement Officer',
    description: 'Coordinates recruiter drives, student dossiers, and compliance verifications.',
    department_scoped: false,
    is_system_reserved: false,
    permissions: {
      academics: ['view'],
      examinations: ['view'],
      finance: ['view'],
      grievances: ['view'],
      audit: ['view', 'export'],
    },
    assigned_users_count: 2,
  },
];

const INITIAL_CAMPAIGNS: DispatchCampaign[] = [
  {
    id: 'cmp-001',
    campaign_name: 'Even Semester 2026 Hall Ticket Download Alert',
    channel: 'OMNICHANNEL',
    target_audience: 'ALL_STUDENTS',
    subject: 'ITM University Notice: Download End-Semester Hall Ticket Before 5th May',
    body_template: 'Dear {{student_name}}, your hall ticket for Even Sem 2026 examinations is now available. Please clear outstanding dues of ₹{{fee_due}} to ensure unobstructed entry.',
    total_recipients: 1240,
    sent_count: 1240,
    delivered_count: 1228,
    opened_count: 1045,
    bounced_count: 12,
    dispatched_at: '2026-04-28 09:30',
    dispatched_by: 'Controller of Examinations',
    status: 'DISPATCHED',
  },
  {
    id: 'cmp-002',
    campaign_name: 'Statutory Fee Clearance Reminder - Phase 2',
    channel: 'SMS',
    target_audience: 'DEFAULTERS_ONLY',
    subject: 'ITM Fee Clearance Deadline',
    body_template: 'URGENT: {{student_name}} (Roll: {{roll_no}}), statutory fee balance of ₹{{fee_due}} is due by May 15. Pay at student portal.',
    total_recipients: 48,
    sent_count: 48,
    delivered_count: 48,
    opened_count: 42,
    bounced_count: 0,
    dispatched_at: '2026-04-30 11:00',
    dispatched_by: 'Finance Section',
    status: 'DISPATCHED',
  },
];

const INITIAL_BOOKS: LibraryBook[] = [
  {
    id: 'bk-001',
    isbn: '978-0131103627',
    title: 'The C Programming Language (2nd Edition)',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    category: 'Computer Science',
    total_copies: 25,
    available_copies: 18,
    shelf_location: 'Rack CS-04, Shelf B',
  },
  {
    id: 'bk-002',
    isbn: '978-0133970777',
    title: 'Database System Concepts (7th Edition)',
    author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
    category: 'Database Systems',
    total_copies: 30,
    available_copies: 12,
    shelf_location: 'Rack CS-09, Shelf A',
  },
  {
    id: 'bk-003',
    isbn: '978-0262033848',
    title: 'Introduction to Algorithms (3rd Edition)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
    category: 'Algorithms',
    total_copies: 40,
    available_copies: 22,
    shelf_location: 'Rack CS-02, Shelf C',
  },
];

const INITIAL_CIRCULATION: CirculationRecord[] = [
  {
    id: 'circ-001',
    book_id: 'bk-002',
    book_title: 'Database System Concepts (7th Edition)',
    isbn: '978-0133970777',
    borrower_type: 'STUDENT',
    borrower_id: 'stu-001',
    borrower_name: 'Rahul Sharma',
    roll_or_emp_id: '2025MCA04',
    issued_date: '2026-04-10',
    due_date: '2026-04-24',
    returned_date: '2026-04-23',
    fine_amount: 0,
    status: 'RETURNED',
  },
  {
    id: 'circ-002',
    book_id: 'bk-003',
    book_title: 'Introduction to Algorithms (3rd Edition)',
    isbn: '978-0262033848',
    borrower_type: 'STUDENT',
    borrower_id: 'stu-003',
    borrower_name: 'Amit Kumar',
    roll_or_emp_id: '2025MCA15',
    issued_date: '2026-04-01',
    due_date: '2026-04-15',
    fine_amount: 150,
    status: 'OVERDUE',
  },
];

const INITIAL_LAB_ASSETS: LabAsset[] = [
  {
    id: 'lab-001',
    asset_code: 'ITM-LAB-GPU-01',
    name: 'NVIDIA RTX A5000 Deep Learning Workstation',
    lab_name: 'Advanced AI & Data Intelligence Lab',
    department: 'Department of Computer Science',
    purchase_date: '2024-08-15',
    warranty_expiry: '2027-08-14',
    last_maintenance: '2026-03-10',
    status: 'OPERATIONAL',
  },
  {
    id: 'lab-002',
    asset_code: 'ITM-LAB-NET-08',
    name: 'Cisco Catalyst 3850 48-Port Managed Switch',
    lab_name: 'Computer Networks & Security Lab',
    department: 'Department of Computer Science',
    purchase_date: '2023-01-20',
    warranty_expiry: '2026-01-19',
    last_maintenance: '2026-04-15',
    status: 'OPERATIONAL',
  },
  {
    id: 'lab-003',
    asset_code: 'ITM-LAB-OS-14',
    name: 'Intel Xeon Gold Dual-Socket Virtualization Host',
    lab_name: 'Cloud Computing & Distributed Systems Lab',
    department: 'Department of Computer Science',
    purchase_date: '2024-11-05',
    warranty_expiry: '2027-11-04',
    last_maintenance: '2026-04-02',
    status: 'UNDER_MAINTENANCE',
  },
];

const INITIAL_CAMPUSES: Campus[] = [
  {
    id: 'camp-01',
    code: 'CAMPUS-MAIN',
    name: 'ITM University Main Campus (North Gate)',
    city: 'Gwalior, MP',
    is_main: true,
    total_students: 4850,
    total_faculty: 260,
    active_programs: 32,
  },
  {
    id: 'camp-02',
    code: 'CAMPUS-TECH',
    name: 'ITM School of Engineering & Technology (City Campus)',
    city: 'Gwalior, MP',
    is_main: false,
    total_students: 2150,
    total_faculty: 115,
    active_programs: 14,
  },
  {
    id: 'camp-03',
    code: 'CAMPUS-HEALTH',
    name: 'ITM Institute of Health Sciences & Medical Complex',
    city: 'Gwalior, MP',
    is_main: false,
    total_students: 1420,
    total_faculty: 85,
    active_programs: 8,
  },
];

const INITIAL_PLACEMENT_DRIVES: PlacementDrive[] = [
  {
    id: 'drv-001',
    company_name: 'Microsoft India Development Center',
    role: 'Software Development Engineer - I (Cloud Platforms)',
    package_ctc_lpa: 24.5,
    drive_date: '2026-05-12',
    eligible_programs: ['MCA', 'BTECH_CSE', 'MTECH_CSE'],
    min_cgpa: 7.5,
    total_registered: 142,
    selected_count: 8,
    status: 'UPCOMING',
    recruiter_contact: 'university.relations@microsoft.com',
  },
  {
    id: 'drv-002',
    company_name: 'Tata Consultancy Services (TCS Digital / Ninja)',
    role: 'Systems Engineer & Cloud Analyst',
    package_ctc_lpa: 7.5,
    drive_date: '2026-04-18',
    eligible_programs: ['MCA', 'BTECH_CSE', 'BTECH_ECE'],
    min_cgpa: 6.5,
    total_registered: 320,
    selected_count: 42,
    status: 'CONCLUDED',
    recruiter_contact: 'campus.hiring@tcs.com',
  },
  {
    id: 'drv-003',
    company_name: 'Deloitte India (Risk Advisory & Analytics)',
    role: 'Cybersecurity & Tech Consulting Analyst',
    package_ctc_lpa: 11.2,
    drive_date: '2026-05-02',
    eligible_programs: ['MCA', 'BTECH_CSE', 'MBA'],
    min_cgpa: 7.0,
    total_registered: 185,
    selected_count: 14,
    status: 'ONGOING',
    recruiter_contact: 'campus@deloitte.com',
  },
];

const INITIAL_ALUMNI: AlumniProfile[] = [
  {
    id: 'alm-001',
    full_name: 'Dr. Priya Saxena',
    graduation_year: 2021,
    program: 'MCA',
    company: 'Amazon Web Services (AWS)',
    designation: 'Senior Cloud Solutions Architect',
    location: 'Bengaluru, India',
    linkedin_url: 'https://linkedin.com/in/priya-saxena-aws',
    email: 'priya.saxena@alumni.itm.ac.in',
    mentorship_available: true,
  },
  {
    id: 'alm-002',
    full_name: 'Vikramaditya Rathore',
    graduation_year: 2022,
    program: 'B.Tech CSE',
    company: 'Google India',
    designation: 'Software Engineer III (Search Infrastructure)',
    location: 'Hyderabad, India',
    linkedin_url: 'https://linkedin.com/in/vikram-rathore',
    email: 'vikram.rathore@alumni.itm.ac.in',
    mentorship_available: true,
  },
  {
    id: 'alm-003',
    full_name: 'Ananya Deshmukh',
    graduation_year: 2023,
    program: 'MCA',
    company: 'Infosys Finacle',
    designation: 'Principal FinTech Consultant',
    location: 'Pune, India',
    linkedin_url: 'https://linkedin.com/in/ananya-deshmukh',
    email: 'ananya.deshmukh@alumni.itm.ac.in',
    mentorship_available: false,
  },
];

const INITIAL_ACCREDITATION_CRITERIA: AccreditationCriterion[] = [
  {
    id: 'cr-1',
    code: 'Criterion 1',
    title: 'Curricular Aspects (Design, CBCS, Academic Flexibility)',
    weightage: 150,
    score_attained: 138,
    status: 'COMPLIANT',
    lead_evaluator: 'Prof. S. R. Sharma (Dean Academics)',
    key_indicators: [
      { indicator_code: '1.1', description: 'Curriculum design and alignment with NEP 2020 & Outcome-based Education (OBE)', max_score: 50, awarded_score: 48, evidence_documents: ['BOS_Minutes_2025.pdf', 'OBE_Curriculum_Framework.pdf'] },
      { indicator_code: '1.2', description: 'Academic flexibility & Choice Based Credit System (CBCS) elective options', max_score: 50, awarded_score: 45, evidence_documents: ['CBCS_Course_Catalogue.pdf'] },
      { indicator_code: '1.3', description: 'Curriculum enrichment and value-added courses impartation', max_score: 50, awarded_score: 45, evidence_documents: ['Value_Added_Courses_2026.pdf'] },
    ],
  },
  {
    id: 'cr-2',
    code: 'Criterion 2',
    title: 'Teaching-Learning and Evaluation (Faculty, Continuous Internal Assessment)',
    weightage: 200,
    score_attained: 184,
    status: 'COMPLIANT',
    lead_evaluator: 'Dr. Archana Joshi (Controller of Examinations)',
    key_indicators: [
      { indicator_code: '2.1', description: 'Student-Full-Time Teacher Ratio and Mentor-Mentee Allocation', max_score: 60, awarded_score: 56, evidence_documents: ['Faculty_Cadre_Ratio.pdf'] },
      { indicator_code: '2.2', description: 'Automation of Continuous Internal Assessment & Semester Exam Gazette tabulation', max_score: 70, awarded_score: 66, evidence_documents: ['UEAMS_Automation_Report.pdf'] },
      { indicator_code: '2.3', description: 'Attainment of Program Outcomes (POs) and Course Outcomes (COs)', max_score: 70, awarded_score: 62, evidence_documents: ['OBE_Attainment_Matrices.xlsx'] },
    ],
  },
  {
    id: 'cr-3',
    code: 'Criterion 3',
    title: 'Research, Innovations and Extension (Grants, Patents, Citations)',
    weightage: 250,
    score_attained: 215,
    status: 'NEEDS_REVIEW',
    lead_evaluator: 'Dr. K. N. Verma (Dean R&D)',
    key_indicators: [
      { indicator_code: '3.1', description: 'Government & Non-Government Research Grants sanctioned', max_score: 80, awarded_score: 68, evidence_documents: ['DST_SERB_Sanctions.pdf'] },
      { indicator_code: '3.2', description: 'Peer-reviewed Scopus/WoS Journal Publications & Book Chapters', max_score: 90, awarded_score: 82, evidence_documents: ['Scopus_Indexed_Papers_2025-26.pdf'] },
      { indicator_code: '3.3', description: 'Technology Incubation, Intellectual Property Rights & Patents granted', max_score: 80, awarded_score: 65, evidence_documents: ['IPR_Filings_Ledger.pdf'] },
    ],
  },
  {
    id: 'cr-4',
    code: 'Criterion 4',
    title: 'Infrastructure and Learning Resources (Smart Labs, Digital Library, ERP)',
    weightage: 100,
    score_attained: 95,
    status: 'COMPLIANT',
    lead_evaluator: 'Director of Campus Infrastructure & ICT',
    key_indicators: [
      { indicator_code: '4.1', description: 'Physical classroom & ICT enabled smart amphitheatre infrastructure', max_score: 30, awarded_score: 29, evidence_documents: ['Smart_Room_Audit.pdf'] },
      { indicator_code: '4.2', description: 'Library as a learning resource (e-ShodhSindhu, DELNET, Koha/UEAMS digital catalogue)', max_score: 40, awarded_score: 38, evidence_documents: ['E_Resource_Subscription_Receipts.pdf'] },
      { indicator_code: '4.3', description: '10 Gbps High-speed campus-wide Wi-Fi & IT infrastructure maintenance', max_score: 30, awarded_score: 28, evidence_documents: ['NKN_Bandwidth_SLA.pdf'] },
    ],
  },
  {
    id: 'cr-5',
    code: 'Criterion 5',
    title: 'Student Support and Progression (Scholarships, Career Placements, Grievance)',
    weightage: 100,
    score_attained: 91,
    status: 'COMPLIANT',
    lead_evaluator: 'Dean of Student Welfare & Placements',
    key_indicators: [
      { indicator_code: '5.1', description: 'Students benefited by scholarships and fee waivers provided by institution and Govt.', max_score: 35, awarded_score: 32, evidence_documents: ['Scholarship_Disbursal_Roll.pdf'] },
      { indicator_code: '5.2', description: 'Placement of outgoing students and progression to higher education', max_score: 40, awarded_score: 37, evidence_documents: ['Placement_Offer_Letters_Consolidated.pdf'] },
      { indicator_code: '5.3', description: 'Statutory Student Grievance Redressal Mechanism & UGC Anti-Ragging compliance', max_score: 25, awarded_score: 22, evidence_documents: ['Grievance_SLA_Audit.pdf'] },
    ],
  },
  {
    id: 'cr-6',
    code: 'Criterion 6',
    title: 'Governance, Leadership and Management (ERP Automation, Internal Audits)',
    weightage: 100,
    score_attained: 92,
    status: 'COMPLIANT',
    lead_evaluator: 'Registrar & Controller of Finance',
    key_indicators: [
      { indicator_code: '6.1', description: 'Vision, Mission and Decentralized participative management governance', max_score: 25, awarded_score: 24, evidence_documents: ['Statutory_Council_Minutes.pdf'] },
      { indicator_code: '6.2', description: 'Implementation of e-governance across administration, finance, and examination', max_score: 40, awarded_score: 38, evidence_documents: ['UEAMS_ERP_Implementation_Signoff.pdf'] },
      { indicator_code: '6.3', description: 'Internal Quality Assurance Cell (IQAC) contribution and statutory audits', max_score: 35, awarded_score: 30, evidence_documents: ['IQAC_Annual_Report_2025.pdf'] },
    ],
  },
  {
    id: 'cr-7',
    code: 'Criterion 7',
    title: 'Institutional Values and Best Practices (Green Energy, Code of Conduct)',
    weightage: 100,
    score_attained: 88,
    status: 'SUBMITTED',
    lead_evaluator: 'Director of IQAC',
    key_indicators: [
      { indicator_code: '7.1', description: 'Gender equity promotion & Solar green campus initiatives (500 kW rooftop solar array)', max_score: 35, awarded_score: 31, evidence_documents: ['Green_Energy_Audit.pdf'] },
      { indicator_code: '7.2', description: 'Two unique institutional best practices demonstrated', max_score: 35, awarded_score: 31, evidence_documents: ['Best_Practices_Portfolio.pdf'] },
      { indicator_code: '7.3', description: 'Institutional distinctiveness in outcome-oriented professional technical education', max_score: 30, awarded_score: 26, evidence_documents: ['Institutional_Distinctiveness.pdf'] },
    ],
  },
];

const INITIAL_PO_ATTAINMENT: ProgramOutcomeAttainment[] = [
  { code: 'PO-1', name: 'Engineering & Computing Knowledge', target_pct: 75, attained_pct: 78.4, status: 'ATTAINED' },
  { code: 'PO-2', name: 'Problem Analysis & Algorithm Design', target_pct: 70, attained_pct: 73.1, status: 'ATTAINED' },
  { code: 'PO-3', name: 'Design/Development of Cloud Solutions', target_pct: 70, attained_pct: 69.2, status: 'NEAR_ATTAINED' },
  { code: 'PO-4', name: 'Conduct Complex System Investigations', target_pct: 65, attained_pct: 67.5, status: 'ATTAINED' },
  { code: 'PO-5', name: 'Modern Tool & IDE Usage', target_pct: 80, attained_pct: 86.0, status: 'ATTAINED' },
  { code: 'PO-6', name: 'The Engineer and Society & Legal Compliance', target_pct: 65, attained_pct: 68.0, status: 'ATTAINED' },
  { code: 'PO-7', name: 'Environment and Sustainability Ethics', target_pct: 70, attained_pct: 74.2, status: 'ATTAINED' },
  { code: 'PO-8', name: 'Life-long Learning & Adaptive Upskilling', target_pct: 75, attained_pct: 79.5, status: 'ATTAINED' },
];

const INITIAL_APPROVAL_REQUESTS: MakerCheckerRequest[] = [
  {
    id: 'req-001',
    operation_type: 'RESULT_GAZETTE_PUBLISH',
    title: 'Publish Official Result Gazette for MCA Semester 2 (Even 2026)',
    description: 'Controller of Examinations submitted calculated SGPA/CGPA result ledger for final publication to student portals.',
    target_entity: 'MCA Sem-2 Cohort (48 Candidates)',
    requested_by: 'Dr. Archana Joshi (CoE Exam Superintendant)',
    requested_at: '2026-04-30 11:20:00',
    payload: { semester: 2, program: 'MCA', total_candidates: 48, gazette_version: 'v2.1' },
    status: 'PENDING_SECOND_APPROVAL',
    security_hash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'req-002',
    operation_type: 'HIGH_VALUE_REFUND',
    title: 'Disburse Excess Hostel & Term Fee Refund > ₹25,000',
    description: 'Statutory refund request of ₹35,000 to student Vikram Singh (Roll: 2025MCA28) following semester course exemption.',
    target_entity: 'Student Fee Ledger (2025MCA28)',
    requested_by: 'Office of the Finance Registrar',
    requested_at: '2026-04-29 16:45:10',
    payload: { student_id: 'stu-028', amount: 35000, bank_ref: 'HDFC0001249' },
    status: 'PENDING_SECOND_APPROVAL',
    security_hash: 'SHA256:3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
  },
  {
    id: 'req-003',
    operation_type: 'DEPARTMENT_PURGE',
    title: 'Cascade Purge Archived Department: Dept of Printing Technology',
    description: 'Decommission legacy department and detach 0 active course mappings.',
    target_entity: 'Department of Printing Technology (Code: DPT)',
    requested_by: 'System Administrator',
    requested_at: '2026-04-25 09:15:00',
    payload: { dept_id: 'dept-old-print', dept_code: 'DPT' },
    status: 'AUTHORIZED',
    authorized_by: 'Dean of Academic Governance',
    authorized_at: '2026-04-25 14:30:00',
    authorization_notes: 'Verified that zero active batches or faculty allocations exist.',
    security_hash: 'SHA256:9f83ac127ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126a1102',
  },
];

class AdminService {
  // ── STORAGE KEYS ──
  private readonly FS_KEY = 'ueams_admin_fee_structures';
  private readonly SFR_KEY = 'ueams_admin_student_fees';
  private readonly RCP_KEY = 'ueams_admin_fee_receipts';
  private readonly REF_KEY = 'ueams_admin_fee_refunds';
  private readonly IMP_KEY = 'ueams_admin_import_logs';
  private readonly BKP_KEY = 'ueams_admin_backups';
  private readonly ROLE_KEY = 'ueams_admin_custom_roles';
  private readonly CMP_KEY = 'ueams_admin_campaigns';
  private readonly BK_KEY = 'ueams_admin_books';
  private readonly CIRC_KEY = 'ueams_admin_circulation';
  private readonly LAB_KEY = 'ueams_admin_lab_assets';
  private readonly CAMPUS_KEY = 'ueams_admin_campuses';
  private readonly ACTIVE_CAMPUS_KEY = 'ueams_admin_active_campus_id';
  private readonly PLACEMENT_KEY = 'ueams_admin_placements';
  private readonly ALUMNI_KEY = 'ueams_admin_alumni';
  private readonly ACCREDITATION_KEY = 'ueams_admin_accreditation';
  private readonly APPROVAL_KEY = 'ueams_admin_approvals';

  // ── FEE MANAGEMENT METHODS ──
  getFeeStructures(): FeeStructure[] {
    const raw = localStorage.getItem(this.FS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_FEE_STRUCTURES;
  }

  saveFeeStructure(struct: FeeStructure): void {
    const list = this.getFeeStructures();
    const idx = list.findIndex((s) => s.id === struct.id);
    if (idx >= 0) {
      list[idx] = struct;
    } else {
      list.push(struct);
    }
    localStorage.setItem(this.FS_KEY, JSON.stringify(list));
  }

  getStudentFees(): StudentFeeRecord[] {
    const raw = localStorage.getItem(this.SFR_KEY);
    return raw ? JSON.parse(raw) : INITIAL_STUDENT_FEES;
  }

  updateStudentFee(id: string, updates: Partial<StudentFeeRecord>): void {
    const list = this.getStudentFees();
    const idx = list.findIndex((s) => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem(this.SFR_KEY, JSON.stringify(list));
    }
  }

  getReceipts(): FeeReceipt[] {
    const raw = localStorage.getItem(this.RCP_KEY);
    return raw ? JSON.parse(raw) : INITIAL_RECEIPTS;
  }

  issueFeeReceipt(receipt: Omit<FeeReceipt, 'id' | 'receipt_no' | 'date' | 'status'>): FeeReceipt {
    const receipts = this.getReceipts();
    const newReceipt: FeeReceipt = {
      ...receipt,
      id: `rcp-${Date.now()}`,
      receipt_no: `ITM/RCP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'VALID',
    };
    receipts.unshift(newReceipt);
    localStorage.setItem(this.RCP_KEY, JSON.stringify(receipts));

    // Update student balance
    const students = this.getStudentFees();
    const student = students.find((s) => s.roll_number === receipt.roll_number || s.student_id === receipt.student_id);
    if (student) {
      student.total_paid += receipt.amount;
      student.balance_due = Math.max(0, student.total_billed - student.scholarship_offset - student.total_paid);
      student.status = student.balance_due === 0 ? 'PAID' : 'PARTIAL';
      student.last_payment_date = newReceipt.date.substring(0, 10);
      if (student.balance_due === 0) student.hall_ticket_blocked = false;
      localStorage.setItem(this.SFR_KEY, JSON.stringify(students));
    }

    auditService.logAction({
      action: 'FEE_RECEIPT_ISSUED',
      entity_type: 'fee_receipt',
      entity_id: newReceipt.id,
      entity_name: `Receipt #${newReceipt.receipt_no}`,
      description: `Issued statutory fee receipt of ₹${receipt.amount.toLocaleString('en-IN')} for ${receipt.student_name} (${receipt.roll_number})`,
      severity: 'info',
    });

    return newReceipt;
  }

  cancelReceipt(id: string, reason: string): void {
    const receipts = this.getReceipts();
    const rcp = receipts.find((r) => r.id === id);
    if (rcp) {
      rcp.status = 'CANCELLED';
      rcp.cancel_reason = reason;
      localStorage.setItem(this.RCP_KEY, JSON.stringify(receipts));

      auditService.logAction({
        action: 'FEE_RECEIPT_CANCELLED',
        entity_type: 'fee_receipt',
        entity_id: id,
        entity_name: `Receipt #${rcp.receipt_no}`,
        description: `Cancelled receipt #${rcp.receipt_no} for ${rcp.student_name}. Reason: ${reason}`,
        severity: 'security',
      });
    }
  }

  getRefunds(): RefundApplication[] {
    const raw = localStorage.getItem(this.REF_KEY);
    return raw ? JSON.parse(raw) : INITIAL_REFUNDS;
  }

  processRefund(id: string, approvedAmount: number, approver: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED'): void {
    const list = this.getRefunds();
    const ref = list.find((r) => r.id === id);
    if (ref) {
      ref.status = status;
      ref.amount_approved = approvedAmount;
      ref.approver = approver;
      ref.approval_date = new Date().toISOString().substring(0, 10);
      localStorage.setItem(this.REF_KEY, JSON.stringify(list));

      auditService.logAction({
        action: 'FEE_REFUND_PROCESSED',
        entity_type: 'refund',
        entity_id: id,
        entity_name: `Refund for ${ref.student_name}`,
        description: `${approver} updated refund #${id} to ${status} for ₹${approvedAmount}`,
        severity: 'security',
      });
    }
  }

  // ── BACKUP & ROLLBACK METHODS ──
  getImportLogs(): BulkImportLog[] {
    const raw = localStorage.getItem(this.IMP_KEY);
    return raw ? JSON.parse(raw) : INITIAL_IMPORT_LOGS;
  }

  recordImportLog(log: Omit<BulkImportLog, 'id' | 'timestamp' | 'is_rolled_back'>): BulkImportLog {
    const logs = this.getImportLogs();
    const newLog: BulkImportLog = {
      ...log,
      id: `imp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_rolled_back: false,
    };
    logs.unshift(newLog);
    localStorage.setItem(this.IMP_KEY, JSON.stringify(logs));
    return newLog;
  }

  rollbackImport(importId: string, officerName: string): boolean {
    const logs = this.getImportLogs();
    const item = logs.find((l) => l.id === importId);
    if (!item || item.is_rolled_back || !item.can_rollback) return false;

    item.is_rolled_back = true;
    item.can_rollback = false;
    item.rolled_back_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
    localStorage.setItem(this.IMP_KEY, JSON.stringify(logs));

    auditService.logAction({
      action: 'BULK_IMPORT_ROLLBACK',
      entity_type: 'import',
      entity_id: importId,
      entity_name: item.file_name,
      description: `${officerName} executed emergency rollback for import #${importId} (${item.total_records} records)`,
      severity: 'security',
    });

    return true;
  }

  getBackups(): BackupRecord[] {
    const raw = localStorage.getItem(this.BKP_KEY);
    return raw ? JSON.parse(raw) : INITIAL_BACKUPS;
  }

  createManualSnapshot(createdBy: string): BackupRecord {
    const backups = this.getBackups();
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const newBkp: BackupRecord = {
      id: `bkp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'MANUAL_SNAPSHOT',
      record_count: 5120,
      size_kb: 14890,
      file_name: `ITM_UEAMS_ManualSnapshot_${ts}.sql.gz`,
      checksum: `sha256-${Math.random().toString(36).substring(2, 15)}e49b934ca495991b`,
      created_by: createdBy,
      status: 'SUCCESS',
    };
    backups.unshift(newBkp);
    localStorage.setItem(this.BKP_KEY, JSON.stringify(backups));

    auditService.logAction({
      action: 'MANUAL_BACKUP_SNAPSHOT',
      entity_type: 'backup',
      entity_id: newBkp.id,
      entity_name: newBkp.file_name,
      description: `Manual database snapshot generated by ${createdBy} (Checksum: ${newBkp.checksum})`,
      severity: 'info',
    });

    return newBkp;
  }

  // ── ROLE & PERMISSION METHODS ──
  getCustomRoles(): CustomRole[] {
    const raw = localStorage.getItem(this.ROLE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CUSTOM_ROLES;
  }

  saveCustomRole(role: CustomRole): void {
    const roles = this.getCustomRoles();
    const idx = roles.findIndex((r) => r.id === role.id);
    if (idx >= 0) {
      roles[idx] = role;
    } else {
      roles.push(role);
    }
    localStorage.setItem(this.ROLE_KEY, JSON.stringify(roles));

    auditService.logAction({
      action: 'ROLE_CONFIG_UPDATE',
      entity_type: 'role',
      entity_id: role.id,
      entity_name: role.role_name,
      description: `Updated role permissions & scopes for ${role.role_name} (${role.role_code})`,
      severity: 'security',
    });
  }

  // ── CAMPAIGN & COMMUNICATION METHODS ──
  getCampaigns(): DispatchCampaign[] {
    const raw = localStorage.getItem(this.CMP_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CAMPAIGNS;
  }

  dispatchCampaign(campaign: Omit<DispatchCampaign, 'id' | 'dispatched_at' | 'status'>): DispatchCampaign {
    const list = this.getCampaigns();
    const newCamp: DispatchCampaign = {
      ...campaign,
      id: `cmp-${Date.now()}`,
      dispatched_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'DISPATCHED',
    };
    list.unshift(newCamp);
    localStorage.setItem(this.CMP_KEY, JSON.stringify(list));

    auditService.logAction({
      action: 'DISPATCH_COMMUNICATION_BROADCAST',
      entity_type: 'campaign',
      entity_id: newCamp.id,
      entity_name: newCamp.campaign_name,
      description: `Dispatched ${newCamp.channel} broadcast to ${newCamp.total_recipients} recipients (${newCamp.target_audience})`,
      severity: 'info',
    });

    return newCamp;
  }

  // ── LIBRARY & ASSET METHODS ──
  getBooks(): LibraryBook[] {
    const raw = localStorage.getItem(this.BK_KEY);
    return raw ? JSON.parse(raw) : INITIAL_BOOKS;
  }

  saveBook(book: LibraryBook): void {
    const books = this.getBooks();
    const idx = books.findIndex((b) => b.id === book.id);
    if (idx >= 0) {
      books[idx] = book;
    } else {
      books.push(book);
    }
    localStorage.setItem(this.BK_KEY, JSON.stringify(books));
  }

  getCirculation(): CirculationRecord[] {
    const raw = localStorage.getItem(this.CIRC_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CIRCULATION;
  }

  issueBook(circ: Omit<CirculationRecord, 'id' | 'issued_date' | 'fine_amount' | 'status'>): CirculationRecord {
    const circs = this.getCirculation();
    const newCirc: CirculationRecord = {
      ...circ,
      id: `circ-${Date.now()}`,
      issued_date: new Date().toISOString().substring(0, 10),
      fine_amount: 0,
      status: 'ISSUED',
    };
    circs.unshift(newCirc);
    localStorage.setItem(this.CIRC_KEY, JSON.stringify(circs));

    // Decrement copies
    const books = this.getBooks();
    const b = books.find((x) => x.id === circ.book_id);
    if (b && b.available_copies > 0) {
      b.available_copies--;
      localStorage.setItem(this.BK_KEY, JSON.stringify(books));
    }

    return newCirc;
  }

  returnBook(circulationId: string): void {
    const circs = this.getCirculation();
    const c = circs.find((x) => x.id === circulationId);
    if (c) {
      c.returned_date = new Date().toISOString().substring(0, 10);
      c.status = 'RETURNED';
      localStorage.setItem(this.CIRC_KEY, JSON.stringify(circs));

      const books = this.getBooks();
      const b = books.find((x) => x.id === c.book_id);
      if (b) {
        b.available_copies++;
        localStorage.setItem(this.BK_KEY, JSON.stringify(books));
      }
    }
  }

  getLabAssets(): LabAsset[] {
    const raw = localStorage.getItem(this.LAB_KEY);
    return raw ? JSON.parse(raw) : INITIAL_LAB_ASSETS;
  }

  saveLabAsset(asset: LabAsset): void {
    const list = this.getLabAssets();
    const idx = list.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      list[idx] = asset;
    } else {
      list.push(asset);
    }
    localStorage.setItem(this.LAB_KEY, JSON.stringify(list));
  }

  // ── SYSTEM HEALTH & DATA INTEGRITY ENGINE ──
  getSystemHealth(): SystemHealthData {
    return {
      supabaseStatus: 'HEALTHY',
      dbUptime: '99.98% (42d 16h)',
      latencyMs: 14,
      activeWorkers: 6,
      queuePendingJobs: 2,
      cacheHitRatio: 94.6,
      diskUsagePct: 38.2,
      lastVerifiedAt: new Date().toLocaleTimeString(),
    };
  }

  getDataIntegrityAlerts(): DataIntegrityAlert[] {
    return [
      {
        id: 'dia-01',
        severity: 'WARNING',
        title: 'Students Without Course Allocations',
        description: '2 newly enrolled candidates have zero subjects allocated in the Master Roster.',
        affected_count: 2,
        entity: 'Enrollments',
        resolution_route: '/admin/academics',
      },
      {
        id: 'dia-02',
        severity: 'CRITICAL',
        title: 'Unsubmitted CIA Internal Marks',
        description: 'MCA-203 (Cloud Computing) has 18 student CIA marks unsubmitted past statutory deadline.',
        affected_count: 18,
        entity: 'Examinations',
        resolution_route: '/admin/marks-verify',
      },
      {
        id: 'dia-03',
        severity: 'INFO',
        title: 'Pending Fee Defaulters Barred from Hall Ticket',
        description: '1 candidate has overdue balance > ₹50,000 with hall ticket status blocked.',
        affected_count: 1,
        entity: 'Finance',
        resolution_route: '/admin/fees',
      },
    ];
  }

  // ── MULTI-CAMPUS TENANCY METHODS ──
  getCampuses(): Campus[] {
    const raw = localStorage.getItem(this.CAMPUS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CAMPUSES;
  }

  getCurrentCampus(): Campus {
    const campuses = this.getCampuses();
    const activeId = localStorage.getItem(this.ACTIVE_CAMPUS_KEY);
    const found = campuses.find((c) => c.id === activeId);
    return found || campuses[0] || INITIAL_CAMPUSES[0];
  }

  setCurrentCampus(campusId: string): void {
    localStorage.setItem(this.ACTIVE_CAMPUS_KEY, campusId);
  }

  // ── PLACEMENT & ALUMNI TRACKING METHODS ──
  getPlacementDrives(): PlacementDrive[] {
    const raw = localStorage.getItem(this.PLACEMENT_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PLACEMENT_DRIVES;
  }

  savePlacementDrive(drive: PlacementDrive): void {
    const list = this.getPlacementDrives();
    const idx = list.findIndex((d) => d.id === drive.id);
    if (idx >= 0) {
      list[idx] = drive;
    } else {
      list.unshift(drive);
    }
    localStorage.setItem(this.PLACEMENT_KEY, JSON.stringify(list));
    auditService.logAction(
      'PLACEMENT_DRIVE_RECORDED',
      'Placements',
      `Drive recorded: ${drive.company_name} (${drive.package_ctc_lpa} LPA)`,
      'Training & Placement Directorate'
    );
  }

  getAlumniDirectory(): AlumniProfile[] {
    const raw = localStorage.getItem(this.ALUMNI_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ALUMNI;
  }

  registerAlumni(profile: AlumniProfile): void {
    const list = this.getAlumniDirectory();
    const idx = list.findIndex((a) => a.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.unshift(profile);
    }
    localStorage.setItem(this.ALUMNI_KEY, JSON.stringify(list));
    auditService.logAction(
      'ALUMNI_REGISTERED',
      'Alumni Affairs',
      `Alumni profile recorded: ${profile.full_name} (${profile.company})`,
      'Institutional Relations'
    );
  }

  // ── NAAC / NBA ACCREDITATION METHODS ──
  getAccreditationCriteria(): AccreditationCriterion[] {
    const raw = localStorage.getItem(this.ACCREDITATION_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ACCREDITATION_CRITERIA;
  }

  updateAccreditationCriterion(crit: AccreditationCriterion): void {
    const list = this.getAccreditationCriteria();
    const idx = list.findIndex((c) => c.id === crit.id);
    if (idx >= 0) {
      list[idx] = crit;
      localStorage.setItem(this.ACCREDITATION_KEY, JSON.stringify(list));
      auditService.logAction(
        'ACCREDITATION_METRIC_UPDATED',
        'IQAC Accreditation',
        `Updated NAAC ${crit.code}: Score ${crit.score_attained}/${crit.weightage}`,
        crit.lead_evaluator
      );
    }
  }

  getProgramOutcomes(): ProgramOutcomeAttainment[] {
    return INITIAL_PO_ATTAINMENT;
  }

  // ── TWO-PERSON APPROVAL (MAKER-CHECKER) METHODS ──
  getApprovalRequests(): MakerCheckerRequest[] {
    const raw = localStorage.getItem(this.APPROVAL_KEY);
    return raw ? JSON.parse(raw) : INITIAL_APPROVAL_REQUESTS;
  }

  submitApprovalRequest(
    req: Omit<MakerCheckerRequest, 'id' | 'requested_at' | 'status' | 'security_hash'>
  ): MakerCheckerRequest {
    const list = this.getApprovalRequests();
    const newReq: MakerCheckerRequest = {
      ...req,
      id: `req-${Date.now()}`,
      requested_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'PENDING_SECOND_APPROVAL',
      security_hash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
    list.unshift(newReq);
    localStorage.setItem(this.APPROVAL_KEY, JSON.stringify(list));
    auditService.logAction(
      'MAKER_CHECKER_REQUEST_CREATED',
      'Dual Governance',
      `Maker initiated: ${newReq.title} for ${newReq.target_entity}`,
      newReq.requested_by
    );
    return newReq;
  }

  authorizeRequest(
    reqId: string,
    checkerName: string,
    checkerPin: string,
    notes?: string
  ): { success: boolean; message: string } {
    // Statutory dual authorization PIN check (defaults to 7729 or 1234 for institutional sandbox)
    if (checkerPin !== '7729' && checkerPin !== '1234') {
      return { success: false, message: 'Invalid Checker Security PIN. Dual authorization denied.' };
    }

    const list = this.getApprovalRequests();
    const req = list.find((r) => r.id === reqId);
    if (!req) return { success: false, message: 'Request not found.' };

    if (req.status !== 'PENDING_SECOND_APPROVAL') {
      return { success: false, message: `Request is already ${req.status}.` };
    }

    req.status = 'AUTHORIZED';
    req.authorized_by = checkerName;
    req.authorized_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    req.authorization_notes = notes || 'Authorized under University Statutory Dual-Signoff Protocol.';

    localStorage.setItem(this.APPROVAL_KEY, JSON.stringify(list));
    auditService.logAction(
      'MAKER_CHECKER_REQUEST_AUTHORIZED',
      'Dual Governance',
      `Checker authorized: ${req.title} (${req.target_entity})`,
      checkerName
    );

    return { success: true, message: 'Dual authorization granted and recorded into statutory ledger.' };
  }

  rejectRequest(reqId: string, checkerName: string, reason: string): void {
    const list = this.getApprovalRequests();
    const req = list.find((r) => r.id === reqId);
    if (!req) return;

    req.status = 'REJECTED';
    req.authorized_by = checkerName;
    req.authorized_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    req.authorization_notes = reason;

    localStorage.setItem(this.APPROVAL_KEY, JSON.stringify(list));
    auditService.logAction(
      'MAKER_CHECKER_REQUEST_REJECTED',
      'Dual Governance',
      `Checker rejected: ${req.title}. Reason: ${reason}`,
      checkerName
    );
  }
}

export const adminService = new AdminService();
