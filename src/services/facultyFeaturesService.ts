import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

// ==========================================
// 1. ATTENDANCE CORRECTIONS
// ==========================================
export interface AttendanceCorrectionRequest {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  session_date: string;
  period_slot?: string;
  old_status: 'absent' | 'present' | 'excused';
  requested_status: 'present' | 'excused';
  reason: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  faculty_remarks?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

const INITIAL_CORRECTIONS: AttendanceCorrectionRequest[] = [
  {
    id: 'corr-001',
    student_id: 'stu-001',
    student_name: 'Rahul Sharma',
    roll_number: '2025-MCA-042',
    subject_id: 'sub-mca-201',
    subject_code: 'MCA-201',
    subject_name: 'Advanced Database Management Systems',
    session_date: '2026-04-22',
    period_slot: '10:00 AM - 11:00 AM',
    old_status: 'absent',
    requested_status: 'present',
    reason: 'Was present in Room 204. Fingerprint scanner timed out during roll call.',
    status: 'pending',
    created_at: '2026-04-22T12:30:00.000Z'
  },
  {
    id: 'corr-002',
    student_id: 'stu-003',
    student_name: 'Amit Verma',
    roll_number: '2025-MCA-015',
    subject_id: 'sub-mca-201',
    subject_code: 'MCA-201',
    subject_name: 'Advanced Database Management Systems',
    session_date: '2026-04-20',
    period_slot: '11:15 AM - 12:15 PM',
    old_status: 'absent',
    requested_status: 'excused',
    reason: 'Representing University in Inter-Collegiate ACM Hackathon. Sanction letter attached.',
    proof_url: 'ACM_Dean_Sanction_Letter.pdf',
    status: 'pending',
    created_at: '2026-04-21T09:15:00.000Z'
  }
];

// ==========================================
// 2. LESSON PLAN & SYLLABUS TOPICS
// ==========================================
export interface LessonTopic {
  id: string;
  code: string; // e.g. "3.1"
  title: string;
  plannedHours: number;
  actualHours?: number;
  learningOutcome: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedDate?: string;
  teachingAid: 'Whiteboard & Slides' | 'Lab Demonstration' | 'Case Study' | 'Flipped Classroom';
}

export interface LessonUnitPlan {
  unitNumber: number;
  unitTitle: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  topics: LessonTopic[];
}

export interface CourseLessonPlan {
  subjectCode: string;
  subjectName: string;
  academicYear: string;
  semester: string;
  facultyName: string;
  units: LessonUnitPlan[];
}

const INITIAL_LESSON_PLANS: Record<string, CourseLessonPlan> = {
  'MCA-201': {
    subjectCode: 'MCA-201',
    subjectName: 'Advanced Database Management Systems',
    academicYear: '2025-26',
    semester: 'Semester 2',
    facultyName: 'Dr. Priya Nambiar',
    units: [
      {
        unitNumber: 1,
        unitTitle: 'Distributed Transaction Processing & Architectures',
        targetCompletionDate: '2026-02-15',
        actualCompletionDate: '2026-02-14',
        topics: [
          { id: 't1', code: '1.1', title: 'Distributed DBMS Architecture & Transparency', plannedHours: 3, actualHours: 3, learningOutcome: 'Understand distributed data placement', status: 'completed', completedDate: '2026-01-20', teachingAid: 'Whiteboard & Slides' },
          { id: 't2', code: '1.2', title: '2-Phase Commit (2PC) & 3-Phase Commit (3PC)', plannedHours: 4, actualHours: 4, learningOutcome: 'Analyze distributed atomic commitment', status: 'completed', completedDate: '2026-02-02', teachingAid: 'Case Study' },
          { id: 't3', code: '1.3', title: 'Sagas Pattern & Distributed Concurrency', plannedHours: 3, actualHours: 3, learningOutcome: 'Implement long-running distributed transactions', status: 'completed', completedDate: '2026-02-14', teachingAid: 'Lab Demonstration' }
        ]
      },
      {
        unitNumber: 2,
        unitTitle: 'NoSQL Stores, Graph Databases & CAP Theorem',
        targetCompletionDate: '2026-03-20',
        actualCompletionDate: '2026-03-18',
        topics: [
          { id: 't4', code: '2.1', title: 'Brewer\'s CAP Theorem & PACELC Trade-offs', plannedHours: 2, actualHours: 2, learningOutcome: 'Evaluate consistency vs availability', status: 'completed', completedDate: '2026-02-28', teachingAid: 'Whiteboard & Slides' },
          { id: 't5', code: '2.2', title: 'Cassandra Architecture & Wide-Column Storage', plannedHours: 4, actualHours: 4, learningOutcome: 'Configure ring topology & CQL schemas', status: 'completed', completedDate: '2026-03-10', teachingAid: 'Lab Demonstration' },
          { id: 't6', code: '2.3', title: 'Neo4j Graph Database & Cypher Queries', plannedHours: 3, actualHours: 3, learningOutcome: 'Model complex graph relationships', status: 'completed', completedDate: '2026-03-18', teachingAid: 'Lab Demonstration' }
        ]
      },
      {
        unitNumber: 3,
        unitTitle: 'Query Optimization & Cost-Based Estimations',
        targetCompletionDate: '2026-04-25',
        topics: [
          { id: 't7', code: '3.1', title: 'Heuristic Query Optimization & Relational Algebra Rewriting', plannedHours: 3, actualHours: 3, learningOutcome: 'Optimize SQL execution plans', status: 'completed', completedDate: '2026-04-05', teachingAid: 'Whiteboard & Slides' },
          { id: 't8', code: '3.2', title: 'System-R Dynamic Programming Join Enumeration', plannedHours: 4, actualHours: 4, learningOutcome: 'Calculate cost models for multi-table joins', status: 'completed', completedDate: '2026-04-18', teachingAid: 'Case Study' },
          { id: 't9', code: '3.3', title: 'Distributed Query Execution & Semi-Join Reductions', plannedHours: 3, learningOutcome: 'Minimize network transfer cost', status: 'in_progress', teachingAid: 'Lab Demonstration' }
        ]
      },
      {
        unitNumber: 4,
        unitTitle: 'Distributed Recovery, Consensus & Raft/Paxos',
        targetCompletionDate: '2026-05-15',
        topics: [
          { id: 't10', code: '4.1', title: 'Paxos Consensus Protocol and Leader Election', plannedHours: 3, learningOutcome: 'Explain distributed agreement in asynchronous networks', status: 'pending', teachingAid: 'Whiteboard & Slides' },
          { id: 't11', code: '4.2', title: 'Raft Protocol & Log Replication State Machine', plannedHours: 3, learningOutcome: 'Implement resilient distributed log', status: 'pending', teachingAid: 'Lab Demonstration' },
          { id: 't12', code: '4.3', title: 'Byzantine Fault Tolerance (BFT) Overview', plannedHours: 2, learningOutcome: 'Survey blockchain consensus fundamentals', status: 'pending', teachingAid: 'Flipped Classroom' }
        ]
      },
      {
        unitNumber: 5,
        unitTitle: 'Security, Data Warehousing & Modern Lakehouses',
        targetCompletionDate: '2026-05-30',
        topics: [
          { id: 't13', code: '5.1', title: 'Role-Based Access Control (RBAC) & Column-Level Encryption', plannedHours: 2, learningOutcome: 'Enforce database audit & compliance', status: 'pending', teachingAid: 'Whiteboard & Slides' },
          { id: 't14', code: '5.2', title: 'Star & Snowflake Schemas in Enterprise Data Warehouses', plannedHours: 3, learningOutcome: 'Design dimensional analytical models', status: 'pending', teachingAid: 'Case Study' }
        ]
      }
    ]
  }
};

// ==========================================
// 3. COURSE OUTCOME (CO) MAPPING & ATTAINMENT
// ==========================================
export interface CourseOutcome {
  id: string;
  code: string; // e.g. "CO1"
  description: string;
  bloomsLevel: 'Remember (L1)' | 'Understand (L2)' | 'Apply (L3)' | 'Analyze (L4)' | 'Evaluate (L5)' | 'Create (L6)';
  targetAttainmentPercent: number; // usually 75%
  actualAttainmentPercent: number;
  mappedAssessments: Array<{ name: string; maxMarks: number; averageScorePercent: number }>;
}

const INITIAL_COURSE_OUTCOMES: Record<string, CourseOutcome[]> = {
  'MCA-201': [
    {
      id: 'co1',
      code: 'CO1',
      description: 'Understand the architecture of distributed databases, transactional ACID properties and 2-phase commit.',
      bloomsLevel: 'Understand (L2)',
      targetAttainmentPercent: 75,
      actualAttainmentPercent: 84.5,
      mappedAssessments: [
        { name: 'CIA-I Midterm Q1 & Q2', maxMarks: 15, averageScorePercent: 86.0 },
        { name: 'Assignment 1 (2PC Protocol)', maxMarks: 10, averageScorePercent: 83.0 }
      ]
    },
    {
      id: 'co2',
      code: 'CO2',
      description: 'Design and query NoSQL and graph data stores using Cassandra and Neo4j for scalable systems.',
      bloomsLevel: 'Apply (L3)',
      targetAttainmentPercent: 75,
      actualAttainmentPercent: 78.2,
      mappedAssessments: [
        { name: 'Practical Lab Assessment 1', maxMarks: 20, averageScorePercent: 80.5 },
        { name: 'Assignment 2 (Cassandra CQL)', maxMarks: 10, averageScorePercent: 75.8 }
      ]
    },
    {
      id: 'co3',
      code: 'CO3',
      description: 'Analyze relational query execution plans and formulate optimal cost-based join strategies.',
      bloomsLevel: 'Analyze (L4)',
      targetAttainmentPercent: 75,
      actualAttainmentPercent: 68.4,
      mappedAssessments: [
        { name: 'CIA-II Midterm Q3', maxMarks: 15, averageScorePercent: 66.0 },
        { name: 'Quiz 2 (System R Optimizer)', maxMarks: 10, averageScorePercent: 70.8 }
      ]
    },
    {
      id: 'co4',
      code: 'CO4',
      description: 'Evaluate distributed consensus protocols (Paxos, Raft) and fault tolerance mechanisms.',
      bloomsLevel: 'Evaluate (L5)',
      targetAttainmentPercent: 75,
      actualAttainmentPercent: 72.0,
      mappedAssessments: [
        { name: 'Sessional Project Presentation', maxMarks: 25, averageScorePercent: 72.0 }
      ]
    }
  ]
};

// ==========================================
// 4. FACULTY ANNOUNCEMENTS
// ==========================================
export interface FacultyAnnouncement {
  id: string;
  faculty_id: string;
  faculty_name: string;
  target_subject_code: string;
  target_subject_name: string;
  title: string;
  message: string;
  urgency: 'Normal' | 'Important' | 'Urgent';
  channels: {
    portal: boolean;
    email: boolean;
    sms: boolean;
  };
  sent_at: string;
  metrics: {
    delivered: number;
    read: number;
    acknowledged: number;
  };
}

const INITIAL_ANNOUNCEMENTS: FacultyAnnouncement[] = [
  {
    id: 'anc-001',
    faculty_id: 'fac-001',
    faculty_name: 'Dr. Priya Nambiar',
    target_subject_code: 'MCA-201',
    target_subject_name: 'Advanced Database Management Systems',
    title: 'Postponement of Quiz 2 on Query Optimization',
    message: 'Due to the Guest Lecture on Cloud Architecture on Wednesday, Quiz 2 is rescheduled to Friday 2nd May at 10:15 AM in Room 204. Topics: Heuristic Rewriting and Join Estimations.',
    urgency: 'Important',
    channels: { portal: true, email: true, sms: false },
    sent_at: '2026-04-28T14:00:00Z',
    metrics: { delivered: 58, read: 52, acknowledged: 47 }
  },
  {
    id: 'anc-002',
    faculty_id: 'fac-001',
    faculty_name: 'Dr. Priya Nambiar',
    target_subject_code: 'MCA-201',
    target_subject_name: 'Advanced Database Management Systems',
    title: 'Submission Link Open: Assignment 3 on Cassandra Schema',
    message: 'The online portal drop box for Assignment 3 is live. Please ensure PDF report contains CQL schema scripts and output table screenshot. Deadline: 5th May 11:59 PM.',
    urgency: 'Normal',
    channels: { portal: true, email: true, sms: true },
    sent_at: '2026-04-20T10:30:00Z',
    metrics: { delivered: 58, read: 56, acknowledged: 54 }
  }
];

// ==========================================
// 5. STUDENT INTERVENTIONS
// ==========================================
export interface StudentIntervention {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  faculty_id: string;
  faculty_name: string;
  concerns: string[];
  intervention_type: 'Mentoring session' | 'Remedial class' | 'Parent meeting' | 'Referral to counselor';
  scheduled_date: string;
  follow_up_date: string;
  notes: string;
  status: 'Open' | 'Contacted' | 'Followed Up' | 'Resolved';
  created_at: string;
  timeline: Array<{
    date: string;
    event: string;
    actor: string;
  }>;
}

const INITIAL_INTERVENTIONS: StudentIntervention[] = [
  {
    id: 'int-001',
    student_id: 'stu-003',
    student_name: 'Amit Verma',
    roll_number: '2025-MCA-015',
    faculty_id: 'fac-001',
    faculty_name: 'Dr. Priya Nambiar',
    concerns: ['Attendance 71.4% (< 75% UGC Minimum)', 'Internal marks 12/30 (Midterm-1)', '2 missing assignments'],
    intervention_type: 'Mentoring session',
    scheduled_date: '2026-04-18',
    follow_up_date: '2026-05-02',
    notes: 'Student struggled due to health issues and bus commute delays. Agreed to submit makeup assignments and attend 2 morning revision hours.',
    status: 'Followed Up',
    created_at: '2026-04-15T11:00:00Z',
    timeline: [
      { date: '15 Apr 2026', event: 'Concern flagged by Attendance Tracker (<75%)', actor: 'Automated System' },
      { date: '18 Apr 2026', event: 'One-on-one counseling session conducted (40 mins)', actor: 'Dr. Priya Nambiar' },
      { date: '25 Apr 2026', event: 'Student submitted pending Assignment 1 & 2', actor: 'Amit Verma' },
      { date: '29 Apr 2026', event: 'Attendance increased to 74.2%', actor: 'Audit Ledger' }
    ]
  }
];

// ==========================================
// 6. QUESTION PAPER BUILDER
// ==========================================
export interface QuestionPaperDraft {
  id: string;
  subject_code: string;
  subject_name: string;
  exam_name: string;
  total_marks: number;
  duration_minutes: number;
  status: 'draft' | 'submitted_to_coe' | 'approved_by_coe';
  blueprint: {
    unit1_weightage: number;
    unit2_weightage: number;
    unit3_weightage: number;
    unit4_weightage: number;
    unit5_weightage: number;
  };
  sections: Array<{
    title: string;
    description: string;
    question_count: number;
    marks_per_question: number;
    total: number;
    questions: Array<{
      q_number: number;
      text: string;
      co_mapped: string;
      blooms_level: string;
      unit: number;
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

const INITIAL_QUESTION_PAPER: QuestionPaperDraft = {
  id: 'qp-mca201-endsem',
  subject_code: 'MCA-201',
  subject_name: 'Advanced Database Management Systems',
  exam_name: 'End Semester Examination — May 2026',
  total_marks: 100,
  duration_minutes: 180,
  status: 'draft',
  blueprint: {
    unit1_weightage: 20,
    unit2_weightage: 20,
    unit3_weightage: 20,
    unit4_weightage: 20,
    unit5_weightage: 20
  },
  sections: [
    {
      title: 'Section A (Multiple Choice & Objective Questions)',
      description: 'Answer all questions. Each question carries 1 mark.',
      question_count: 20,
      marks_per_question: 1,
      total: 20,
      questions: [
        { q_number: 1, text: 'Which phase of 2-Phase Commit (2PC) guarantees durability across coordinator failure?', co_mapped: 'CO1', blooms_level: 'Understand (L2)', unit: 1 },
        { q_number: 2, text: 'In Brewer\'s CAP theorem, what does Partition Tolerance imply?', co_mapped: 'CO2', blooms_level: 'Remember (L1)', unit: 2 },
        { q_number: 3, text: 'What is the primary objective of System R dynamic programming join algorithm?', co_mapped: 'CO3', blooms_level: 'Understand (L2)', unit: 3 }
      ]
    },
    {
      title: 'Section B (Short Answer Technical Questions)',
      description: 'Answer any 5 questions out of 7. Each question carries 6 marks.',
      question_count: 5,
      marks_per_question: 6,
      total: 30,
      questions: [
        { q_number: 1, text: 'Differentiate between synchronous 2PC and asynchronous Sagas pattern in microservices with suitable sequence diagram.', co_mapped: 'CO1', blooms_level: 'Analyze (L4)', unit: 1 },
        { q_number: 2, text: 'Explain Cassandra write path including CommitLog, Memtable, and SSTable compaction.', co_mapped: 'CO2', blooms_level: 'Apply (L3)', unit: 2 },
        { q_number: 3, text: 'Demonstrate relational algebra tree pushdown heuristic for selection and projection operators.', co_mapped: 'CO3', blooms_level: 'Apply (L3)', unit: 3 },
        { q_number: 4, text: 'Discuss Raft leader election and log reconciliation when network partition splits cluster 3:2.', co_mapped: 'CO4', blooms_level: 'Evaluate (L5)', unit: 4 },
        { q_number: 5, text: 'Design a Star schema dimensional model for hospital healthcare patient records.', co_mapped: 'CO1', blooms_level: 'Create (L6)', unit: 5 }
      ]
    },
    {
      title: 'Section C (Long Comprehensive Problem-Solving Questions)',
      description: 'Answer 2 questions. Each question carries 25 marks.',
      question_count: 2,
      marks_per_question: 25,
      total: 50,
      questions: [
        { q_number: 1, text: 'Consider an e-commerce order management distributed database. (a) Formulate the 3-tier schema. (b) Explain how Paxos ensures consensus when payment gateway timeouts occur. (c) Derive join selectivity estimation.', co_mapped: 'CO1 & CO3', blooms_level: 'Evaluate (L5)', unit: 1 },
        { q_number: 2, text: 'Comprehensive Neo4j Graph database implementation: Model social networking fraud rings with Cypher path-traversal queries and contrast performance against relational SQL joins.', co_mapped: 'CO2', blooms_level: 'Create (L6)', unit: 2 }
      ]
    }
  ],
  created_at: '2026-04-20T08:00:00Z',
  updated_at: '2026-04-28T16:00:00Z'
};

// ==========================================
// 7. RESEARCH & PUBLICATIONS PROFILE
// ==========================================
export interface ResearchPublication {
  id: string;
  type: 'Journal' | 'Conference' | 'Book Chapter' | 'Patent';
  title: string;
  venueName: string;
  year: number;
  doi?: string;
  indexing: 'Scopus' | 'Web of Science' | 'UGC CARE' | 'IEEE Xplore';
  impactFactor?: number;
  authors: string;
  certificateUrl?: string;
}

export interface FdpWorkshop {
  id: string;
  title: string;
  organizingBody: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  type: 'FDP' | 'Workshop' | 'STTP' | 'Pedagogy Training';
  certificateVerified: boolean;
}

const INITIAL_PUBLICATIONS: ResearchPublication[] = [
  {
    id: 'pub-001',
    type: 'Journal',
    title: 'Adaptive Distributed Query Optimization in Multi-Cloud Cassandra Clusters using Deep Q-Learning',
    venueName: 'IEEE Transactions on Cloud Computing',
    year: 2026,
    doi: '10.1109/TCC.2026.3129841',
    indexing: 'Scopus',
    impactFactor: 5.4,
    authors: 'Dr. Priya Nambiar, Dr. Rajesh K., Prof. V. Sen'
  },
  {
    id: 'pub-002',
    type: 'Conference',
    title: 'Resilient Microservice Transaction Orchestration: A Comparative Study of 2PC and Sagas',
    venueName: 'International Conference on High Performance Computing (HiPC 2025)',
    year: 2025,
    doi: '10.1145/354789.354792',
    indexing: 'IEEE Xplore',
    authors: 'Dr. Priya Nambiar'
  },
  {
    id: 'pub-003',
    type: 'Patent',
    title: 'Method and System for Zero-Knowledge Automated Examination Seating with Graph Coloring Optimization',
    venueName: 'Indian Patent Office (Application No. 202511094821 A)',
    year: 2025,
    indexing: 'UGC CARE',
    authors: 'Dr. Priya Nambiar, ITM University R&D Cell'
  }
];

const INITIAL_FDPS: FdpWorkshop[] = [
  {
    id: 'fdp-001',
    title: 'National FDP on AI-Driven Curriculum Design and Outcome-Based Education (OBE)',
    organizingBody: 'AICTE & IIT Kharagpur',
    durationDays: 5,
    startDate: '2026-01-12',
    endDate: '2026-01-16',
    type: 'FDP',
    certificateVerified: true
  },
  {
    id: 'fdp-002',
    title: 'Hands-on Cloud-Native Microservices & Kubernetes Deployment Bootcamp',
    organizingBody: 'AWS Academy & IEEE Computer Society',
    durationDays: 3,
    startDate: '2026-03-04',
    endDate: '2026-03-06',
    type: 'Workshop',
    certificateVerified: true
  }
];

// ==========================================
// STORAGE KEYS
// ==========================================
const KEY_CORRECTIONS = 'ueams_attendance_corrections';
const KEY_LESSON_PLANS = 'ueams_lesson_plans_v2';
const KEY_CO = 'ueams_course_outcomes';
const KEY_ANNOUNCEMENTS = 'ueams_faculty_announcements';
const KEY_INTERVENTIONS = 'ueams_student_interventions';
const KEY_QUESTION_PAPER = 'ueams_question_paper_draft';
const KEY_RESEARCH = 'ueams_faculty_research';
const KEY_FDPS = 'ueams_faculty_fdps';

export class FacultyFeaturesService {
  // 1. CORRECTIONS
  getCorrections(): AttendanceCorrectionRequest[] {
    const raw = localStorage.getItem(KEY_CORRECTIONS);
    if (!raw) {
      localStorage.setItem(KEY_CORRECTIONS, JSON.stringify(INITIAL_CORRECTIONS));
      return INITIAL_CORRECTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CORRECTIONS;
    }
  }

  saveCorrections(list: AttendanceCorrectionRequest[]) {
    localStorage.setItem(KEY_CORRECTIONS, JSON.stringify(list));
  }

  async reviewCorrection(id: string, action: 'approved' | 'rejected', remarks: string, reviewerName: string): Promise<AttendanceCorrectionRequest> {
    const list = this.getCorrections();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Correction request not found');

    list[idx].status = action;
    list[idx].faculty_remarks = remarks;
    list[idx].approved_by = reviewerName;
    list[idx].approved_at = new Date().toISOString();
    this.saveCorrections(list);

    // If approved, update attendance in Supabase if configured
    if (action === 'approved' && isSupabaseConfigured) {
      try {
        await supabase
          .from('attendance')
          .update({ status: list[idx].requested_status })
          .eq('student_id', list[idx].student_id)
          .eq('subject_id', list[idx].subject_id)
          .eq('date', list[idx].session_date);
      } catch (err) {
        console.warn('Supabase attendance correction update warning:', err);
      }
    }

    return list[idx];
  }

  // 2. LESSON PLANS
  getLessonPlan(subjectCode: string): CourseLessonPlan {
    const raw = localStorage.getItem(KEY_LESSON_PLANS);
    let all: Record<string, CourseLessonPlan> = INITIAL_LESSON_PLANS;
    if (raw) {
      try { all = JSON.parse(raw); } catch { all = INITIAL_LESSON_PLANS; }
    } else {
      localStorage.setItem(KEY_LESSON_PLANS, JSON.stringify(INITIAL_LESSON_PLANS));
    }
    return all[subjectCode] || {
      subjectCode,
      subjectName: 'Assigned Course',
      academicYear: '2025-26',
      semester: 'Current',
      facultyName: 'Dr. Priya Nambiar',
      units: [
        {
          unitNumber: 1,
          unitTitle: 'Foundations & Concepts',
          targetCompletionDate: '2026-03-01',
          topics: [
            { id: 'u1t1', code: '1.1', title: 'Unit Foundations & Objectives', plannedHours: 3, actualHours: 3, learningOutcome: 'Understand core concepts', status: 'completed', completedDate: '2026-02-10', teachingAid: 'Whiteboard & Slides' },
            { id: 'u1t2', code: '1.2', title: 'System Architectures & Models', plannedHours: 3, learningOutcome: 'Analyze system structures', status: 'in_progress', teachingAid: 'Lab Demonstration' }
          ]
        }
      ]
    };
  }

  updateTopicStatus(subjectCode: string, unitNumber: number, topicId: string, status: 'completed' | 'in_progress' | 'pending'): CourseLessonPlan {
    const raw = localStorage.getItem(KEY_LESSON_PLANS);
    let all: Record<string, CourseLessonPlan> = INITIAL_LESSON_PLANS;
    if (raw) {
      try { all = JSON.parse(raw); } catch { all = INITIAL_LESSON_PLANS; }
    }

    const plan = all[subjectCode] || this.getLessonPlan(subjectCode);
    const unit = plan.units.find(u => u.unitNumber === unitNumber);
    if (unit) {
      const topic = unit.topics.find(t => t.id === topicId);
      if (topic) {
        topic.status = status;
        if (status === 'completed') {
          topic.completedDate = new Date().toISOString().split('T')[0];
          topic.actualHours = topic.plannedHours;
        } else {
          delete topic.completedDate;
        }
      }

      // Check unit status
      const allDone = unit.topics.every(t => t.status === 'completed');
      if (allDone) {
        unit.actualCompletionDate = new Date().toISOString().split('T')[0];
      } else {
        delete unit.actualCompletionDate;
      }
    }

    all[subjectCode] = plan;
    localStorage.setItem(KEY_LESSON_PLANS, JSON.stringify(all));

    // Propagate to CourseMaterialService so students see dynamic completion!
    try {
      const matRaw = localStorage.getItem('ueams_syllabus_progress');
      let syl: any = matRaw ? JSON.parse(matRaw) : {};
      const completedTopics = unit?.topics.filter(t => t.status === 'completed').length || 0;
      const totalTopics = unit?.topics.length || 1;
      const pct = Math.round((completedTopics / totalTopics) * 100);

      if (!syl[subjectCode]) syl[subjectCode] = [];
      const sylUnit = syl[subjectCode].find((u: any) => u.unitNumber === unitNumber);
      if (sylUnit) {
        sylUnit.completionPercent = pct;
        sylUnit.status = pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'upcoming';
      }
      localStorage.setItem('ueams_syllabus_progress', JSON.stringify(syl));
    } catch (e) {
      console.warn('Sync to student syllabus warning:', e);
    }

    return plan;
  }

  // 3. COURSE OUTCOMES
  getCourseOutcomes(subjectCode: string): CourseOutcome[] {
    const raw = localStorage.getItem(KEY_CO);
    let all: Record<string, CourseOutcome[]> = INITIAL_COURSE_OUTCOMES;
    if (raw) {
      try { all = JSON.parse(raw); } catch { all = INITIAL_COURSE_OUTCOMES; }
    } else {
      localStorage.setItem(KEY_CO, JSON.stringify(INITIAL_COURSE_OUTCOMES));
    }
    return all[subjectCode] || INITIAL_COURSE_OUTCOMES['MCA-201'];
  }

  // 4. ANNOUNCEMENTS
  getAnnouncements(): FacultyAnnouncement[] {
    const raw = localStorage.getItem(KEY_ANNOUNCEMENTS);
    if (!raw) {
      localStorage.setItem(KEY_ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    try { return JSON.parse(raw); } catch { return INITIAL_ANNOUNCEMENTS; }
  }

  createAnnouncement(ann: Omit<FacultyAnnouncement, 'id' | 'sent_at' | 'metrics'>): FacultyAnnouncement {
    const list = this.getAnnouncements();
    const newAnc: FacultyAnnouncement = {
      ...ann,
      id: `anc-${Date.now()}`,
      sent_at: new Date().toISOString(),
      metrics: {
        delivered: 58,
        read: 1,
        acknowledged: 0
      }
    };
    const updated = [newAnc, ...list];
    localStorage.setItem(KEY_ANNOUNCEMENTS, JSON.stringify(updated));
    return newAnc;
  }

  // 5. INTERVENTIONS
  getInterventions(): StudentIntervention[] {
    const raw = localStorage.getItem(KEY_INTERVENTIONS);
    if (!raw) {
      localStorage.setItem(KEY_INTERVENTIONS, JSON.stringify(INITIAL_INTERVENTIONS));
      return INITIAL_INTERVENTIONS;
    }
    try { return JSON.parse(raw); } catch { return INITIAL_INTERVENTIONS; }
  }

  recordIntervention(intervention: Omit<StudentIntervention, 'id' | 'created_at' | 'timeline'>): StudentIntervention {
    const list = this.getInterventions();
    const newInt: StudentIntervention = {
      ...intervention,
      id: `int-${Date.now()}`,
      created_at: new Date().toISOString(),
      timeline: [
        {
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          event: `Intervention initiated (${intervention.intervention_type})`,
          actor: intervention.faculty_name
        }
      ]
    };
    const updated = [newInt, ...list];
    localStorage.setItem(KEY_INTERVENTIONS, JSON.stringify(updated));
    return newInt;
  }

  updateInterventionStatus(id: string, status: StudentIntervention['status'], followUpNotes?: string): StudentIntervention {
    const list = this.getInterventions();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Intervention record not found');

    list[idx].status = status;
    if (followUpNotes) {
      list[idx].notes = `${list[idx].notes}\n[Follow-up ${new Date().toLocaleDateString('en-IN')}]: ${followUpNotes}`;
    }
    list[idx].timeline.push({
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      event: `Status updated to ${status}${followUpNotes ? `: ${followUpNotes}` : ''}`,
      actor: list[idx].faculty_name
    });

    localStorage.setItem(KEY_INTERVENTIONS, JSON.stringify(list));
    return list[idx];
  }

  // 6. QUESTION PAPER
  getQuestionPaper(): QuestionPaperDraft {
    const raw = localStorage.getItem(KEY_QUESTION_PAPER);
    if (!raw) {
      localStorage.setItem(KEY_QUESTION_PAPER, JSON.stringify(INITIAL_QUESTION_PAPER));
      return INITIAL_QUESTION_PAPER;
    }
    try { return JSON.parse(raw); } catch { return INITIAL_QUESTION_PAPER; }
  }

  saveQuestionPaper(paper: QuestionPaperDraft): void {
    localStorage.setItem(KEY_QUESTION_PAPER, JSON.stringify({ ...paper, updated_at: new Date().toISOString() }));
  }

  // 7. RESEARCH & FDPS
  getResearchData(): { publications: ResearchPublication[]; fdps: FdpWorkshop[] } {
    const rawPubs = localStorage.getItem(KEY_RESEARCH);
    const rawFdps = localStorage.getItem(KEY_FDPS);
    let publications = INITIAL_PUBLICATIONS;
    let fdps = INITIAL_FDPS;

    if (rawPubs) {
      try { publications = JSON.parse(rawPubs); } catch { publications = INITIAL_PUBLICATIONS; }
    } else {
      localStorage.setItem(KEY_RESEARCH, JSON.stringify(INITIAL_PUBLICATIONS));
    }

    if (rawFdps) {
      try { fdps = JSON.parse(rawFdps); } catch { fdps = INITIAL_FDPS; }
    } else {
      localStorage.setItem(KEY_FDPS, JSON.stringify(INITIAL_FDPS));
    }

    return { publications, fdps };
  }

  addPublication(pub: Omit<ResearchPublication, 'id'>): ResearchPublication {
    const { publications } = this.getResearchData();
    const newPub: ResearchPublication = { ...pub, id: `pub-${Date.now()}` };
    const updated = [newPub, ...publications];
    localStorage.setItem(KEY_RESEARCH, JSON.stringify(updated));
    return newPub;
  }

  getResearchDataForFaculty(facultyId: string, facultyName?: string): { publications: ResearchPublication[]; fdps: FdpWorkshop[] } {
    const { publications, fdps } = this.getResearchData();
    if (!facultyName) return { publications, fdps };
    const nameLower = facultyName.toLowerCase();
    const parts = nameLower.split(' ').filter(p => p.length > 2 && !p.startsWith('dr') && !p.startsWith('prof'));
    const matchedPubs = publications.filter(p => {
      const auth = p.authors.toLowerCase();
      return auth.includes(nameLower) || parts.some(part => auth.includes(part));
    });
    return {
      publications: matchedPubs.length > 0 ? matchedPubs : publications,
      fdps
    };
  }
}

export const facultyFeaturesService = new FacultyFeaturesService();
