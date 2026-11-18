export interface ScholarshipScheme {
  id: string;
  name: string;
  provider: string;
  category: 'Merit-Based' | 'Need-Based' | 'Girls Empowerment' | 'Special Category' | 'Sports / Research';
  amount_per_annum: number;
  eligibility: string;
  min_cgpa?: number;
  max_family_income?: number; // in INR per annum
  deadline: string;
  description: string;
  status: 'active' | 'closed';
  badge: string;
}

export interface ScholarshipApplication {
  id: string;
  application_no: string;
  scheme_id: string;
  scheme_name: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  department_name: string;
  program_name: string;
  current_semester: number;
  cgpa: number;
  annual_family_income: number;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  applied_amount: number;
  sanctioned_amount?: number;
  status: 'submitted' | 'verified_by_advisor' | 'sanctioned_by_dean' | 'disbursed' | 'rejected' | 'pending_vc_approval';
  dean_remarks?: string;
  dean_pin_signed?: boolean;
  sanctioned_at?: string;
  disbursement_date?: string;
  utr_number?: string;
  documents: Array<{
    name: string;
    type: string;
    verified: boolean;
  }>;
  created_at: string;
}

export const initialScholarshipSchemes: ScholarshipScheme[] = [
  {
    id: 'sch-scheme-01',
    name: "Chancellor's Academic Excellence Merit Scholarship",
    provider: 'University Board of Governors & Chancellor Endowment Fund',
    category: 'Merit-Based',
    amount_per_annum: 50000,
    eligibility: 'Matriculated regular PG & UG scholars holding CGPA >= 8.50 with no backlogs in any semester.',
    min_cgpa: 8.5,
    deadline: '2026-06-30',
    description: 'Premier institutional financial honor instituted to reward top-tier scholarly performers with direct fee subsidies and laptop/research bursaries.',
    status: 'active',
    badge: 'Chancellor Seal',
  },
  {
    id: 'sch-scheme-02',
    name: 'National Post-Matric Higher Education Scholarship',
    provider: 'Ministry of Education & Social Justice, Govt. of India',
    category: 'Need-Based',
    amount_per_annum: 35000,
    eligibility: 'Annual gross parental family income below INR 4,50,000 per annum with verified income certificate.',
    max_family_income: 450000,
    deadline: '2026-07-15',
    description: 'Central sector scheme for meritorious university scholars from economically weaker backgrounds to cover living and academic expenses.',
    status: 'active',
    badge: 'National Portal',
  },
  {
    id: 'sch-scheme-03',
    name: 'AICTE Pragati Scheme for Women Scholars',
    provider: 'All India Council for Technical Education (AICTE)',
    category: 'Girls Empowerment',
    amount_per_annum: 50000,
    eligibility: 'Exclusively for female scholars admitted into technical MCA, B.Tech, or M.Tech degree tracks.',
    deadline: '2026-08-30',
    description: 'Special initiative dedicated to empowering young women scholars pursuing technical excellence and software engineering leadership.',
    status: 'active',
    badge: 'AICTE Direct',
  },
  {
    id: 'sch-scheme-04',
    name: 'University Full Tuition Fee Waiver (TFW) Scheme',
    provider: 'University Statutory Welfare Council',
    category: 'Need-Based',
    amount_per_annum: 42000,
    eligibility: 'Annual parental income under INR 2,50,000 with minimum 75% attendance record in current semester.',
    max_family_income: 250000,
    deadline: '2026-06-25',
    description: 'Statutory 100% tuition concession granted directly onto semester accounts by the Office of the Dean.',
    status: 'active',
    badge: '100% Tuition',
  },
  {
    id: 'sch-scheme-05',
    name: 'Research Innovation & Conference Publication Grant',
    provider: 'Deanery of Academic Research & Innovation',
    category: 'Sports / Research',
    amount_per_annum: 25000,
    eligibility: 'Scholars with accepted research papers in IEEE, Springer, or Scopus indexed international symposiums.',
    deadline: '2026-09-15',
    description: 'Direct reimbursement of manuscript registration, travel fellowships, and open-access laboratory experimentation fees.',
    status: 'active',
    badge: 'Dean Seed Fund',
  },
];

export const initialScholarshipApplications: ScholarshipApplication[] = [
  {
    id: 'app-sch-001',
    application_no: 'SCH-2026-MCA-081',
    scheme_id: 'sch-scheme-01',
    scheme_name: "Chancellor's Academic Excellence Merit Scholarship",
    student_id: 'stu-001',
    student_name: 'Rahul Sharma',
    student_roll: '2025-MCA-042',
    department_name: 'Computer Science & Engineering',
    program_name: 'Master of Computer Applications',
    current_semester: 2,
    cgpa: 8.92,
    annual_family_income: 380000,
    category: 'General',
    bank_name: 'State Bank of India (SBI)',
    account_number: '•••• •••• 4892',
    ifsc_code: 'SBIN0004123',
    applied_amount: 50000,
    sanctioned_amount: 50000,
    status: 'sanctioned_by_dean',
    dean_remarks: 'Verified CGPA 8.92 and academic excellence record. Sanctioned for full scholarship disbursement of ₹50,000 under Chancellor Merit quota.',
    dean_pin_signed: true,
    sanctioned_at: '2026-03-24T14:30:00Z',
    disbursement_date: '2026-04-10',
    utr_number: 'CMS2026032488102391',
    documents: [
      { name: 'Semester 1 UGC-CBCS Grade Card', type: 'PDF', verified: true },
      { name: 'Income Certificate (Tehsildar Certified)', type: 'PDF', verified: true },
      { name: 'Bank Passbook / Cancelled Cheque', type: 'JPEG', verified: true },
    ],
    created_at: '2026-03-10T11:00:00Z',
  },
  {
    id: 'app-sch-002',
    application_no: 'SCH-2026-MCA-094',
    scheme_id: 'sch-scheme-03',
    scheme_name: 'AICTE Pragati Scheme for Women Scholars',
    student_id: 'stu-002',
    student_name: 'Priya Patel',
    student_roll: '2025-MCA-015',
    department_name: 'Computer Science & Engineering',
    program_name: 'Master of Computer Applications',
    current_semester: 2,
    cgpa: 9.15,
    annual_family_income: 290000,
    category: 'OBC',
    bank_name: 'HDFC Bank Ltd',
    account_number: '•••• •••• 7119',
    ifsc_code: 'HDFC0001092',
    applied_amount: 50000,
    sanctioned_amount: 50000,
    status: 'disbursed',
    dean_remarks: 'Outstanding scholarly merit (CGPA 9.15). AICTE quota approved and credited to beneficiary account via DBT.',
    dean_pin_signed: true,
    sanctioned_at: '2026-02-18T10:15:00Z',
    disbursement_date: '2026-02-28',
    utr_number: 'AICTE-PRAGATI-9982103',
    documents: [
      { name: 'Matriculation & High School Certificate', type: 'PDF', verified: true },
      { name: 'AICTE Enrolment Endorsement Form', type: 'PDF', verified: true },
      { name: 'Aadhaar Seeded Bank Account Declaration', type: 'PDF', verified: true },
    ],
    created_at: '2026-02-05T09:30:00Z',
  },
  {
    id: 'app-sch-003',
    application_no: 'SCH-2026-MCA-112',
    scheme_id: 'sch-scheme-04',
    scheme_name: 'University Full Tuition Fee Waiver (TFW) Scheme',
    student_id: 'stu-003',
    student_name: 'Amit Kumar Verma',
    student_roll: '2025-MCA-031',
    department_name: 'Computer Science & Engineering',
    program_name: 'Master of Computer Applications',
    current_semester: 2,
    cgpa: 7.85,
    annual_family_income: 185000,
    category: 'OBC',
    bank_name: 'Punjab National Bank',
    account_number: '•••• •••• 3381',
    ifsc_code: 'PUNB0182700',
    applied_amount: 42000,
    status: 'submitted',
    dean_remarks: 'Income documents undergoing physical verification at University Registrar desk.',
    documents: [
      { name: 'State Tehsildar Income Certificate', type: 'PDF', verified: true },
      { name: 'BPL Ration Card Copy', type: 'PDF', verified: false },
    ],
    created_at: '2026-03-28T16:00:00Z',
  },
  {
    id: 'app-sch-004',
    application_no: 'SCH-2026-BT-045',
    scheme_id: 'sch-scheme-01',
    scheme_name: "Chancellor's Academic Excellence Merit Scholarship",
    student_id: 'stu-004',
    student_name: 'Pooja Hegde',
    student_roll: '2024-BT-055',
    department_name: 'Computer Science & Engineering',
    program_name: 'Bachelor of Technology (CSE)',
    current_semester: 4,
    cgpa: 8.65,
    annual_family_income: 420000,
    category: 'General',
    bank_name: 'ICICI Bank',
    account_number: '•••• •••• 9012',
    ifsc_code: 'ICIC0000492',
    applied_amount: 50000,
    status: 'verified_by_advisor',
    documents: [
      { name: 'Semester 1-3 Consolidated Transcripts', type: 'PDF', verified: true },
      { name: 'Identity Proof', type: 'PDF', verified: true },
    ],
    created_at: '2026-03-29T12:00:00Z',
  }
];
