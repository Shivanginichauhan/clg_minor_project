export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'VERIFY'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PUBLISH'
  | 'EXPORT'
  | 'WITHHOLD'
  | 'REVALUATE'
  | 'SECURITY_ALERT';

export type AuditEntityType =
  | 'marks'
  | 'results'
  | 'examination'
  | 'exam_schedule'
  | 'seating'
  | 'invigilation'
  | 'attendance'
  | 'enrollment'
  | 'user'
  | 'notice'
  | 'academic_structure'
  | 'security';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'security';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  role: 'administrator' | 'dean' | 'faculty' | 'student' | 'system';
  action: AuditActionType;
  entity_type: AuditEntityType;
  entity_id?: string;
  entity_name?: string;
  description: string;
  ip_address: string;
  user_agent: string;
  severity: AuditSeverity;
  changes_payload?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    meta?: Record<string, any>;
  };
}

export const INITIAL_MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1092',
    timestamp: '2026-08-22T08:30:15Z',
    user_id: 'dean-001',
    user_name: 'Dr. Rajeshwari Raman',
    role: 'dean',
    action: 'PUBLISH',
    entity_type: 'results',
    entity_id: 'EXAM-2026-SP-01',
    entity_name: 'Spring 2026 End-Semester Examinations',
    description: 'Executed statutory gazette sign-off and published semester results to student portal for MCA and B.Tech batches (128 students).',
    ip_address: '172.16.4.12',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    severity: 'critical',
    changes_payload: {
      before: { result_status: 'approved_by_dean', is_published: false },
      after: { result_status: 'published', is_published: true, publication_timestamp: '2026-08-22T08:30:15Z' },
      meta: { digital_signature_pin: '******', batches: ['MCA-IV', 'BTECH-VIII', 'MBA-IV'] }
    }
  },
  {
    id: 'aud-1091',
    timestamp: '2026-08-22T08:15:40Z',
    user_id: 'admin-001',
    user_name: 'Vikramaditya Sharma',
    role: 'administrator',
    action: 'WITHHOLD',
    entity_type: 'results',
    entity_id: 'RES-MCA-2024-004',
    entity_name: 'Rohan Verma (Roll: 2024MCA004)',
    description: 'Withheld semester result of student Rohan Verma pending resolution of disciplinary committee inquiry (Case #UFM-2026-04).',
    ip_address: '172.16.4.28',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'warning',
    changes_payload: {
      before: { result_status: 'computed', is_withheld: false },
      after: { result_status: 'withheld', is_withheld: true, withholding_reason: 'Disciplinary Inquiry Pending (UFM Case #04)' }
    }
  },
  {
    id: 'aud-1090',
    timestamp: '2026-08-21T16:45:10Z',
    user_id: 'admin-001',
    user_name: 'Vikramaditya Sharma',
    role: 'administrator',
    action: 'VERIFY',
    entity_type: 'marks',
    entity_id: 'SUB-MCA-101',
    entity_name: 'Advanced Database Management Systems (MCA-101)',
    description: 'Completed administrative verification and final lock for Section A Theory and Practical internal assessments.',
    ip_address: '172.16.4.28',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info',
    changes_payload: {
      before: { verification_status: 'submitted_by_faculty', total_records: 42 },
      after: { verification_status: 'verified_by_admin', locked: true, verified_at: '2026-08-21T16:45:10Z' }
    }
  },
  {
    id: 'aud-1089',
    timestamp: '2026-08-21T14:22:00Z',
    user_id: 'fac-001',
    user_name: 'Dr. Meenakshi Sundaram',
    role: 'faculty',
    action: 'UPDATE',
    entity_type: 'marks',
    entity_id: 'MRK-2026-0018',
    entity_name: 'Continuous Internal Assessment (CIA-II)',
    description: 'Submitted CIA-II normalized scores for 38 enrolled students in Machine Learning (MCA-203).',
    ip_address: '172.16.10.45',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    severity: 'info',
    changes_payload: {
      before: { status: 'draft' },
      after: { status: 'submitted', submission_timestamp: '2026-08-21T14:22:00Z' }
    }
  },
  {
    id: 'aud-1088',
    timestamp: '2026-08-21T11:05:32Z',
    user_id: 'system',
    user_name: 'UEAMS Automated Security Engine',
    role: 'system',
    action: 'SECURITY_ALERT',
    entity_type: 'security',
    entity_id: 'SEC-TRG-004',
    entity_name: 'Row Level Security Trigger: trg_protect_profile_role',
    description: 'Blocked unauthorized privilege escalation attempt on profile user_id: stu-004 (attempted role mutation from student to administrator).',
    ip_address: '10.0.84.112',
    user_agent: 'PostgREST/12.0.2 (Direct API Invocation)',
    severity: 'security',
    changes_payload: {
      meta: {
        violation: 'Unauthorized mutation of profiles.role via direct client mutation',
        enforced_by: 'PostgreSQL Trigger: trg_protect_profile_role()',
        status: 'ABORTED'
      }
    }
  },
  {
    id: 'aud-1087',
    timestamp: '2026-08-20T17:10:00Z',
    user_id: 'dean-001',
    user_name: 'Dr. Rajeshwari Raman',
    role: 'dean',
    action: 'APPROVE',
    entity_type: 'examination',
    entity_id: 'EXAM-SCH-2026-001',
    entity_name: 'Spring 2026 Master Examination Timetable',
    description: 'Granted statutory approval to End-Semester timetable spanning 18 examination slots across 4 department clusters.',
    ip_address: '172.16.4.12',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'info',
    changes_payload: {
      before: { status: 'pending_dean_approval' },
      after: { status: 'approved', approved_at: '2026-08-20T17:10:00Z' }
    }
  },
  {
    id: 'aud-1086',
    timestamp: '2026-08-20T15:40:20Z',
    user_id: 'admin-001',
    user_name: 'Vikramaditya Sharma',
    role: 'administrator',
    action: 'CREATE',
    entity_type: 'seating',
    entity_id: 'SEAT-GEN-2026-001',
    entity_name: 'Examination Seating Matrix — Block A & B',
    description: 'Generated automated collision-free seating plans for 320 candidates across Examination Halls 101, 102, 201 with zigzag column mixing.',
    ip_address: '172.16.4.28',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info',
    changes_payload: {
      meta: {
        total_rooms_utilized: 6,
        allocated_candidates: 320,
        collision_violations: 0,
        algorithm: 'alternate_department_interleaving'
      }
    }
  },
  {
    id: 'aud-1085',
    timestamp: '2026-08-19T10:12:45Z',
    user_id: 'dean-002',
    user_name: 'Prof. Suresh Varma',
    role: 'dean',
    action: 'APPROVE',
    entity_type: 'attendance',
    entity_id: 'COND-2026-089',
    entity_name: 'Aarav Patel (2024MCA001) Condonation Waiver',
    description: 'Approved medical attendance condonation waiver (+6.5% adjustment, revised to 76.2%) upon verification of hospital records.',
    ip_address: '172.16.4.15',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'warning',
    changes_payload: {
      before: { condonation_status: 'pending', effective_percentage: 69.7 },
      after: { condonation_status: 'approved', condonation_percentage: 6.5, effective_percentage: 76.2 }
    }
  },
  {
    id: 'aud-1084',
    timestamp: '2026-08-19T09:00:11Z',
    user_id: 'admin-001',
    user_name: 'Vikramaditya Sharma',
    role: 'administrator',
    action: 'CREATE',
    entity_type: 'notice',
    entity_id: 'not-001',
    entity_name: 'Gazette Publication Circular',
    description: 'Broadcasted university-wide urgent circular regarding Spring 2026 result publication and scrutiny application windows.',
    ip_address: '172.16.4.28',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info',
    changes_payload: {
      after: { priority: 'urgent', target_audience: 'all', is_pinned: true }
    }
  },
  {
    id: 'aud-1083',
    timestamp: '2026-08-18T08:45:00Z',
    user_id: 'admin-001',
    user_name: 'Vikramaditya Sharma',
    role: 'administrator',
    action: 'LOGIN',
    entity_type: 'security',
    entity_id: 'AUTH-SESS-9081',
    entity_name: 'Administrator Authentication Session',
    description: 'Successful administrative login with dual-factor authenticated session token from campus network subnet.',
    ip_address: '172.16.4.28',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'info'
  }
];
