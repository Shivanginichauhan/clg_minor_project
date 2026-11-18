import { studentClearanceService } from './studentClearanceService.js';
import { auditService } from './auditService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface MenteeStudent {
  id: string;
  user_id: string;
  full_name: string;
  roll_number: string;
  enrollment_number: string;
  program_name: string;
  semester_name: string;
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  email: string;
  phone: string;
  guardian_name: string;
  guardian_phone: string;
  address: string;
  avatar_url: string;
  attendance_percentage: number;
  total_lectures: number;
  attended_lectures: number;
  cgpa: number;
  backlog_count: number;
  no_dues_status: 'cleared' | 'accounts_pending' | 'library_pending';
  mentor_approval_status: 'approved' | 'pending' | 'condoned';
  exam_clearance_status: 'eligible' | 'attendance_shortage' | 'dues_pending' | 'blocked';
  mentor_notes?: string;
  last_counseled_date?: string;
}

export interface MentorshipCohortSummary {
  mentorName: string;
  mentorDesignation: string;
  mentorDepartment: string;
  cohortName: string;
  programCode: string;
  semester: string;
  section: string;
  academicYear: string;
  totalMentees: number;
  averageAttendance: number;
  attendanceShortageCount: number;
  examEligibleCount: number;
  activeBacklogsCount: number;
  averageCgpa: number;
}

const STORAGE_KEY_MENTEES = 'ueams_mentee_cohort_v1';

export const initialMentees: MenteeStudent[] = [
  {
    id: 'stu-001',
    user_id: 'usr-stu-001',
    full_name: 'Rahul Sharma',
    roll_number: '2025-MCA-042',
    enrollment_number: 'ENR-2025-MCA-001',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'General',
    email: 'rahul.mca@university.edu',
    phone: '+91 98765 43210',
    guardian_name: 'Mr. Ramesh Sharma',
    guardian_phone: '+91 98111 22334',
    address: 'B-402, Nilgiri Heights, University Enclave, City',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 88.0,
    total_lectures: 140,
    attended_lectures: 123,
    cgpa: 8.92,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Active participant in lab practicals and tech symposium.',
    last_counseled_date: '2026-03-20',
  },
  {
    id: 'stu-002',
    user_id: 'usr-stu-002',
    full_name: 'Sneha Roy',
    roll_number: '2025-MCA-015',
    enrollment_number: 'ENR-2025-MCA-002',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'General',
    email: 'sneha.roy@university.edu',
    phone: '+91 98765 43211',
    guardian_name: 'Dr. Alok Roy',
    guardian_phone: '+91 98222 33445',
    address: 'Flat 12-A, Silver Oaks, Model Town',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 94.5,
    total_lectures: 140,
    attended_lectures: 132,
    cgpa: 9.45,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Class Representative candidate. Exceptional marks in Cloud Microservices.',
    last_counseled_date: '2026-03-18',
  },
  {
    id: 'stu-003',
    user_id: 'usr-stu-003',
    full_name: 'Amit Verma',
    roll_number: '2025-MCA-003',
    enrollment_number: 'ENR-2025-MCA-003',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'OBC',
    email: 'amit.verma@university.edu',
    phone: '+91 98765 43212',
    guardian_name: 'Mr. Suresh Verma',
    guardian_phone: '+91 98333 44556',
    address: 'H.No 78, Lane 4, Shastri Nagar',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 71.2,
    total_lectures: 140,
    attended_lectures: 100,
    cgpa: 7.60,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'pending',
    exam_clearance_status: 'attendance_shortage',
    mentor_notes: 'Missed 2 weeks due to viral fever. Medical certificate submitted for condonation.',
    last_counseled_date: '2026-03-25',
  },
  {
    id: 'stu-004',
    user_id: 'usr-stu-004',
    full_name: 'Pooja Sharma',
    roll_number: '2025-MCA-007',
    enrollment_number: 'ENR-2025-MCA-007',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'General',
    email: 'pooja.s@university.edu',
    phone: '+91 98765 43213',
    guardian_name: 'Mrs. Sunita Sharma',
    guardian_phone: '+91 98444 55667',
    address: 'Plot 45, Green Avenue, Sector 15',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 68.0,
    total_lectures: 140,
    attended_lectures: 95,
    cgpa: 7.20,
    backlog_count: 1,
    no_dues_status: 'accounts_pending',
    mentor_approval_status: 'pending',
    exam_clearance_status: 'blocked',
    mentor_notes: 'Attendance shortage & term fee balance ₹1,500 pending. Guardian notified.',
    last_counseled_date: '2026-03-27',
  },
  {
    id: 'stu-005',
    user_id: 'usr-stu-005',
    full_name: 'Vikram Malhotra',
    roll_number: '2025-MCA-018',
    enrollment_number: 'ENR-2025-MCA-018',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'General',
    email: 'vikram.m@university.edu',
    phone: '+91 98765 43214',
    guardian_name: 'Col. K. S. Malhotra',
    guardian_phone: '+91 98555 66778',
    address: 'Defence Enclave, Quarter D-14',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 82.0,
    total_lectures: 140,
    attended_lectures: 115,
    cgpa: 8.10,
    backlog_count: 0,
    no_dues_status: 'library_pending',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'dues_pending',
    mentor_notes: '1 library book (Operating Systems Concepts) overdue. Return pending.',
    last_counseled_date: '2026-03-15',
  },
  {
    id: 'stu-006',
    user_id: 'usr-stu-006',
    full_name: 'Neha Gupta',
    roll_number: '2025-MCA-022',
    enrollment_number: 'ENR-2025-MCA-022',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'General',
    email: 'neha.gupta@university.edu',
    phone: '+91 98765 43215',
    guardian_name: 'Mr. Arvind Gupta',
    guardian_phone: '+91 98666 77889',
    address: 'C-22, Civil Lines, University Road',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 91.0,
    total_lectures: 140,
    attended_lectures: 127,
    cgpa: 9.15,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Excellent consistency. Submitted semester project proposal on Blockchain.',
    last_counseled_date: '2026-03-22',
  },
  {
    id: 'stu-007',
    user_id: 'usr-stu-007',
    full_name: 'Rohan Deshmukh',
    roll_number: '2025-MCA-029',
    enrollment_number: 'ENR-2025-MCA-029',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'OBC',
    email: 'rohan.d@university.edu',
    phone: '+91 98765 43216',
    guardian_name: 'Mr. Vijay Deshmukh',
    guardian_phone: '+91 98777 88990',
    address: '14, Sai Nagar, Station Road',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 75.5,
    total_lectures: 140,
    attended_lectures: 106,
    cgpa: 7.80,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Advised not to miss any more classes to remain above statutory 75%.',
    last_counseled_date: '2026-03-24',
  },
  {
    id: 'stu-008',
    user_id: 'usr-stu-008',
    full_name: 'Anjali Mishra',
    roll_number: '2025-MCA-033',
    enrollment_number: 'ENR-2025-MCA-033',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'EWS',
    email: 'anjali.m@university.edu',
    phone: '+91 98765 43217',
    guardian_name: 'Pandit S. N. Mishra',
    guardian_phone: '+91 98888 99001',
    address: 'Ward 8, Temple View Colony',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 86.5,
    total_lectures: 140,
    attended_lectures: 121,
    cgpa: 8.70,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Applied for Post-Matric Merit Scholarship. Recommended by proctorial board.',
    last_counseled_date: '2026-03-19',
  },
  {
    id: 'stu-009',
    user_id: 'usr-stu-009',
    full_name: 'Karanveer Singh',
    roll_number: '2025-MCA-037',
    enrollment_number: 'ENR-2025-MCA-037',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'General',
    email: 'karanveer.s@university.edu',
    phone: '+91 98765 43218',
    guardian_name: 'Sardar J. S. Singh',
    guardian_phone: '+91 98999 00112',
    address: 'Gurdwara Road, Preet Vihar',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 64.0,
    total_lectures: 140,
    attended_lectures: 90,
    cgpa: 6.90,
    backlog_count: 2,
    no_dues_status: 'cleared',
    mentor_approval_status: 'pending',
    exam_clearance_status: 'attendance_shortage',
    mentor_notes: 'Critical attendance shortage & 2 Sem-1 backlogs. Parents summoned for counseling.',
    last_counseled_date: '2026-03-28',
  },
  {
    id: 'stu-010',
    user_id: 'usr-stu-010',
    full_name: 'Tanvi Patel',
    roll_number: '2025-MCA-044',
    enrollment_number: 'ENR-2025-MCA-044',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'General',
    email: 'tanvi.p@university.edu',
    phone: '+91 98765 43219',
    guardian_name: 'Mr. Bhavesh Patel',
    guardian_phone: '+91 98112 33445',
    address: 'Tower 4, Royal Palms, Airport Road',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 96.0,
    total_lectures: 140,
    attended_lectures: 134,
    cgpa: 9.80,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Batch topper rank #1. Selected for ACM ICPC Regional preliminaries.',
    last_counseled_date: '2026-03-16',
  },
  {
    id: 'stu-011',
    user_id: 'usr-stu-011',
    full_name: 'Devendra Rao',
    roll_number: '2025-MCA-049',
    enrollment_number: 'ENR-2025-MCA-049',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Male',
    category: 'SC',
    email: 'devendra.rao@university.edu',
    phone: '+91 98765 43220',
    guardian_name: 'Mr. Ramachandra Rao',
    guardian_phone: '+91 98223 44556',
    address: 'Ambedkar Colony, Sector 9',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 78.5,
    total_lectures: 140,
    attended_lectures: 110,
    cgpa: 8.05,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Regular attendance. Satisfactory progress in Database Lab assignments.',
    last_counseled_date: '2026-03-21',
  },
  {
    id: 'stu-012',
    user_id: 'usr-stu-012',
    full_name: 'Meera Iyer',
    roll_number: '2025-MCA-055',
    enrollment_number: 'ENR-2025-MCA-055',
    program_name: 'Master of Computer Applications (MCA)',
    semester_name: 'Semester 2',
    section: 'Section A',
    gender: 'Female',
    category: 'General',
    email: 'meera.iyer@university.edu',
    phone: '+91 98765 43221',
    guardian_name: 'Mr. K. V. Iyer',
    guardian_phone: '+91 98334 55667',
    address: 'Flat 5B, Carnatic Enclave, South Extension',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    attendance_percentage: 89.0,
    total_lectures: 140,
    attended_lectures: 125,
    cgpa: 8.95,
    backlog_count: 0,
    no_dues_status: 'cleared',
    mentor_approval_status: 'approved',
    exam_clearance_status: 'eligible',
    mentor_notes: 'Coordinator for department coding club. Strong academic standing.',
    last_counseled_date: '2026-03-23',
  },
];

class ClassMentorshipService {
  private getStoredMentees(): MenteeStudent[] {
    const raw = localStorage.getItem(STORAGE_KEY_MENTEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MENTEES, JSON.stringify(initialMentees));
      return initialMentees;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialMentees;
    }
  }

  private saveMentees(mentees: MenteeStudent[]): void {
    localStorage.setItem(STORAGE_KEY_MENTEES, JSON.stringify(mentees));
  }

  async getCohortSummary(facultyName?: string): Promise<{ summary: MentorshipCohortSummary; mentees: MenteeStudent[] }> {
    const mentees = this.getStoredMentees();
    const total = mentees.length;
    const avgAtt = total > 0 ? mentees.reduce((acc, m) => acc + m.attendance_percentage, 0) / total : 0;
    const shortageCount = mentees.filter((m) => m.attendance_percentage < 75).length;
    const eligibleCount = mentees.filter((m) => m.exam_clearance_status === 'eligible').length;
    const backlogsCount = mentees.filter((m) => m.backlog_count > 0).length;
    const avgCgpa = total > 0 ? mentees.reduce((acc, m) => acc + m.cgpa, 0) / total : 0;

    const summary: MentorshipCohortSummary = {
      mentorName: facultyName || 'Dr. Priya Nambiar',
      mentorDesignation: 'Associate Professor & Class Mentor',
      mentorDepartment: 'Department of Computer Science & Engineering',
      cohortName: 'Master of Computer Applications (MCA) — Sem 2 (Sec A)',
      programCode: 'MCA-2025-26',
      semester: 'Semester 2',
      section: 'Section A',
      academicYear: '2025-2026',
      totalMentees: total,
      averageAttendance: parseFloat(avgAtt.toFixed(1)),
      attendanceShortageCount: shortageCount,
      examEligibleCount: eligibleCount,
      activeBacklogsCount: backlogsCount,
      averageCgpa: parseFloat(avgCgpa.toFixed(2)),
    };

    return { summary, mentees };
  }

  async grantMentorCondonation(studentId: string, reason: string = 'Medical / Co-curricular ground verified'): Promise<MenteeStudent> {
    const mentees = this.getStoredMentees();
    const index = mentees.findIndex((m) => m.id === studentId || m.roll_number === studentId);
    if (index === -1) throw new Error('Student not found in mentorship cohort');

    const target = mentees[index];
    const isDuesOk = target.no_dues_status === 'cleared';

    mentees[index] = {
      ...target,
      mentor_approval_status: 'condoned',
      exam_clearance_status: isDuesOk ? 'eligible' : 'dues_pending',
      mentor_notes: `${target.mentor_notes || ''} [CONDONED ON ${new Date().toLocaleDateString('en-IN')}: ${reason}]`.trim(),
      last_counseled_date: new Date().toISOString().split('T')[0],
    };

    this.saveMentees(mentees);

    // Sync with studentClearanceService if this is the active demo student stu-001
    try {
      await studentClearanceService.approveMentorClearance(target.id);
    } catch (e) {
      console.warn('Sync to studentClearanceService skipped:', e);
    }

    await auditService.logAction({
      action: 'APPROVE_MENTOR_CONDONATION',
      entity_type: 'student_mentorship',
      entity_id: target.id,
      entity_name: `${target.full_name} (${target.roll_number})`,
      description: `Class mentor granted attendance condonation and exam eligibility sign-off: ${reason}`,
      severity: 'info',
    });

    return mentees[index];
  }

  async updateMentorNotes(studentId: string, notes: string): Promise<MenteeStudent> {
    const mentees = this.getStoredMentees();
    const index = mentees.findIndex((m) => m.id === studentId);
    if (index === -1) throw new Error('Student not found');

    mentees[index].mentor_notes = notes;
    mentees[index].last_counseled_date = new Date().toISOString().split('T')[0];
    this.saveMentees(mentees);
    return mentees[index];
  }

  async sendGuardianAlert(studentId: string, alertType: 'shortage' | 'dues' | 'counseling'): Promise<{ success: boolean; message: string }> {
    const mentees = this.getStoredMentees();
    const student = mentees.find((m) => m.id === studentId);
    if (!student) throw new Error('Student not found');

    let msg = '';
    if (alertType === 'shortage') {
      msg = `Official SMS & Email dispatched to ${student.guardian_name} (${student.guardian_phone}) regarding attendance shortage (${student.attendance_percentage}%).`;
    } else if (alertType === 'dues') {
      msg = `Payment intimation sent to ${student.guardian_name} for pending term accounts clearance.`;
    } else {
      msg = `Parent-Teacher counseling invitation scheduled and delivered to ${student.guardian_name}.`;
    }

    if (isSupabaseConfigured) {
      Promise.resolve(
        supabase
          .from('mentorship_guardian_alerts')
          .insert({
            student_id: student.id,
            faculty_id: 'fac-001',
            alert_type: alertType,
            message: msg,
            sent_to_phone: student.guardian_phone,
            sent_to_email: student.email,
          })
      )
        .then(() => {})
        .catch((err: any) => console.warn('[MENTORSHIP] Alert DB log:', err));
    }

    return { success: true, message: msg };
  }
}

export const classMentorshipService = new ClassMentorshipService();
