export interface NoticeAttachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export type NoticeCategory = 
  | 'examination' 
  | 'academic' 
  | 'administrative' 
  | 'circular' 
  | 'results' 
  | 'events';

export type NoticePriority = 'normal' | 'high' | 'urgent';

export type NoticeAudience = 'all' | 'students' | 'faculty' | 'administrators' | 'deans' | 'department';

export interface UniversityNotice {
  id: string;
  circular_number: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  target_audience: NoticeAudience;
  department_id?: string;
  department_name?: string;
  author_name: string;
  author_role: string;
  author_id: string;
  is_pinned: boolean;
  broadcast_alert: boolean;
  attachments?: NoticeAttachment[];
  published_at: string;
  expires_at?: string;
  views_count: number;
  acknowledgments_count?: number;
}

export const INITIAL_MOCK_NOTICES: UniversityNotice[] = [
  {
    id: 'not-001',
    circular_number: 'UEAMS/EXAM/2026/CIR-108',
    title: 'Urgent: Gazette Publication of Spring 2026 End-Semester Examinations & Re-evaluation Schedule',
    content: `The Office of the Controller of Examinations hereby notifies all undergraduate and postgraduate students that the official Tabulation Register (TR) and Statement of Marks for the Spring 2026 End-Semester Examinations have been officially gazetted following Dean statutory sign-off.

Students may access their digital Statement of Marks (Grade Card) and verify cumulative credits on the Student Portal.

Schedule for Post-Result Services:
1. Online Re-evaluation & Answer Script Scrutiny Applications open: 24th August 2026
2. Last date for fee submission and scrutiny application: 31st August 2026 (11:59 PM)
3. Publication of revised scrutiny results: 10th September 2026

Disciplinary withholding (UFM/Fee default) cases must contact the Examination Cell Scrutiny Unit in Administrative Block Room 104 with valid clearances.`,
    category: 'results',
    priority: 'urgent',
    target_audience: 'all',
    author_name: 'Dr. Rajeshwari Raman',
    author_role: 'Controller of Examinations',
    author_id: 'dean-001',
    is_pinned: true,
    broadcast_alert: true,
    published_at: '2026-08-22T08:30:00Z',
    expires_at: '2026-09-15T23:59:59Z',
    views_count: 1420,
    acknowledgments_count: 612,
    attachments: [
      {
        name: 'Spring_2026_Result_Gazette_Summary.pdf',
        url: '#',
        size: '1.4 MB',
        type: 'application/pdf'
      },
      {
        name: 'Revaluation_Guidelines_and_Fee_Schedule.pdf',
        url: '#',
        size: '420 KB',
        type: 'application/pdf'
      }
    ]
  },
  {
    id: 'not-002',
    circular_number: 'UEAMS/ACAD/2026/CIR-094',
    title: 'CIA-II Continuous Internal Assessment Marks Moderation & Freeze Deadline',
    content: `All Department Heads and Course Faculty members are requested to finalize and upload Continuous Internal Assessment (CIA-II) theory and practical component marks on the Faculty Marks Entry Portal by 26th August 2026, 5:00 PM.

Key Directives:
1. Ensure normalization of internal components (Quiz, Assignments, Mid-Term).
2. Departmental Moderation Committees must convene between 27th-28th August to review outlier marks (>90% or <35%).
3. Final administrative verification and lock will be executed on 29th August 2026. No modifications will be entertained after lock without Dean Executive sanction.`,
    category: 'academic',
    priority: 'high',
    target_audience: 'faculty',
    author_name: 'Prof. Suresh Varma',
    author_role: 'Dean of Academic Affairs',
    author_id: 'dean-002',
    is_pinned: true,
    broadcast_alert: false,
    published_at: '2026-08-20T10:00:00Z',
    expires_at: '2026-08-30T17:00:00Z',
    views_count: 345,
    acknowledgments_count: 88,
    attachments: [
      {
        name: 'CIA_Marks_Normalization_Matrix_2026.pdf',
        url: '#',
        size: '680 KB',
        type: 'application/pdf'
      }
    ]
  },
  {
    id: 'not-003',
    circular_number: 'UEAMS/SEAT/2026/CIR-052',
    title: 'Invigilation Duty Roster & Special Flying Squad Deployment for Supplementary Term',
    content: `The comprehensive Invigilation Duty Roster for the upcoming Supplementary and Special End-Term Examination cycle has been released.

All assigned invigilators are required to report to the Examination Control Room 45 minutes prior to session commencement for biometric logging and confidential question paper packet distribution.

Any duty swap must be submitted via the Faculty Portal with mutual consent at least 24 hours in advance and sanctioned by the Chief Superintendent.`,
    category: 'examination',
    priority: 'normal',
    target_audience: 'faculty',
    author_name: 'Dr. Anand Joshi',
    author_role: 'Chief Superintendent of Examinations',
    author_id: 'admin-001',
    is_pinned: false,
    broadcast_alert: false,
    published_at: '2026-08-18T14:15:00Z',
    expires_at: '2026-09-05T18:00:00Z',
    views_count: 280,
    attachments: [
      {
        name: 'Invigilation_Duty_Allocation_Roster.xlsx',
        url: '#',
        size: '310 KB',
        type: 'application/vnd.ms-excel'
      }
    ]
  },
  {
    id: 'not-004',
    circular_number: 'UEAMS/ATTN/2026/CIR-041',
    title: 'Attendance Shortage Condonation Applications — Final Submission Window',
    content: `Students with overall semester attendance between 65.0% and 74.9% seeking statutory condonation on medical grounds or recognized inter-university sports/cultural participation must submit their attested supporting documents before 25th August 2026.

Applications must be submitted through the Department HOD with valid medical certificates from the University Health Centre. The Dean Academic Council will review all submissions on 26th August 2026. Students below 65% attendance are not eligible for condonation under UGC Regulation 7.2.`,
    category: 'administrative',
    priority: 'high',
    target_audience: 'students',
    department_name: 'All Departments',
    author_name: 'Academic Registrar Office',
    author_role: 'Registrar',
    author_id: 'admin-002',
    is_pinned: false,
    broadcast_alert: false,
    published_at: '2026-08-16T09:00:00Z',
    expires_at: '2026-08-26T23:59:59Z',
    views_count: 1890,
    attachments: [
      {
        name: 'Medical_Condonation_Form_Format.pdf',
        url: '#',
        size: '220 KB',
        type: 'application/pdf'
      }
    ]
  },
  {
    id: 'not-005',
    circular_number: 'UEAMS/GEN/2026/CIR-019',
    title: 'University Annual Convocation 2026 — Degree Certificate Rehearsal & Regalia Guidelines',
    content: `The 28th Annual Convocation of the University is scheduled for Saturday, 19th September 2026 at the Main University Auditorium.

Graduating students from the 2025-2026 academic batch with cleared credit ledgers and zero financial dues are eligible to receive their degrees in person. Mandatory rehearsal will take place on 18th September at 3:00 PM. Academic regalia (stoles & robes) can be collected from Room 202 starting 16th September upon production of the digital Convocation Pass.`,
    category: 'events',
    priority: 'normal',
    target_audience: 'all',
    author_name: 'Prof. Ananya Sen',
    author_role: 'Convocation Committee Chair',
    author_id: 'admin-003',
    is_pinned: false,
    broadcast_alert: false,
    published_at: '2026-08-12T11:20:00Z',
    expires_at: '2026-09-20T23:59:59Z',
    views_count: 2450,
    attachments: [
      {
        name: 'Convocation_2026_Procedure_and_Protocol.pdf',
        url: '#',
        size: '1.8 MB',
        type: 'application/pdf'
      }
    ]
  }
];
