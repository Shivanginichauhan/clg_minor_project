import { enrollmentService } from './enrollmentService.js';

export interface Assignment {
  id: string;
  faculty_id?: string;
  subject_code: string;
  subject_name: string;
  faculty_name: string;
  title: string;
  description: string;
  due_date: string; // ISO string or YYYY-MM-DD HH:mm
  total_marks: number;
  weightage_percent: number;
  status: 'not_started' | 'submitted' | 'graded' | 'late';
  submission?: {
    submitted_at: string;
    file_name: string;
    file_size_kb: number;
    notes?: string;
    marks_obtained?: number;
    feedback?: string;
    graded_by?: string;
  };
  attachments?: Array<{
    name: string;
    url: string;
    size: string;
  }>;
  rubrics?: Array<{
    criterion: string;
    max_marks: number;
  }>;
}

const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-001',
    subject_code: 'MCA-201',
    subject_name: 'Advanced Database Management Systems',
    faculty_name: 'Prof. Ananya Sen',
    title: 'Distributed Transaction & Concurrency Control Case Study',
    description: 'Implement a 2-Phase Commit (2PC) protocol simulation or write a rigorous architectural analysis with state-machine diagrams and edge-case handling for coordinator failure.',
    due_date: '2026-05-04T23:59:00',
    total_marks: 25,
    weightage_percent: 10,
    status: 'submitted',
    submission: {
      submitted_at: '2026-05-02T19:34:00',
      file_name: 'RahulSharma_MCA201_Assignment1_2PC.pdf',
      file_size_kb: 1420,
      notes: 'Included Python prototype test scripts in appendix.',
      marks_obtained: 23,
      feedback: 'Excellent breakdown of partition tolerance and presumes-abort optimization. Minor formatting issue in diagram 2.',
      graded_by: 'Prof. Ananya Sen'
    },
    attachments: [
      { name: 'Assignment_Brief_2PC_2026.pdf', url: '#', size: '380 KB' },
      { name: 'Sample_Architecture_Template.docx', url: '#', size: '120 KB' }
    ],
    rubrics: [
      { criterion: 'Protocol Correctness & Failure recovery', max_marks: 10 },
      { criterion: 'State-transition Diagrams', max_marks: 8 },
      { criterion: 'Code Simulation & Documentation', max_marks: 7 }
    ]
  },
  {
    id: 'asg-002',
    subject_code: 'MCA-203',
    subject_name: 'Computer Networks & Internet Protocols',
    faculty_name: 'Dr. Ramesh K. Verma',
    title: 'BGP Routing Hijacking & RPKI Validation Lab Report',
    description: 'Capture packet traces simulating route leak and analyze Route Origin Authorizations (ROAs). Submit Wireshark pcap insights along with prevention strategies.',
    due_date: '2026-05-08T23:59:00',
    total_marks: 30,
    weightage_percent: 15,
    status: 'not_started',
    attachments: [
      { name: 'Lab4_BGP_RPKI_Guide.pdf', url: '#', size: '1.2 MB' },
      { name: 'topology.pkt', url: '#', size: '45 KB' }
    ],
    rubrics: [
      { criterion: 'Packet Flow Diagnostics', max_marks: 12 },
      { criterion: 'Mitigation Strategies', max_marks: 10 },
      { criterion: 'Clarity of Methodology', max_marks: 8 }
    ]
  },
  {
    id: 'asg-003',
    subject_code: 'MCA-202',
    subject_name: 'Cloud Computing & Microservices',
    faculty_name: 'Dr. Vikram Rao',
    title: 'Kubernetes Multi-Tier Microservice Deployment',
    description: 'Dockerize a 3-tier polyglot service with Helm chart, config maps, ingress routing, and Prometheus metrics scraping endpoints.',
    due_date: '2026-05-12T18:00:00',
    total_marks: 20,
    weightage_percent: 10,
    status: 'not_started',
    attachments: [
      { name: 'K8s_Project_Spec_v2.pdf', url: '#', size: '540 KB' }
    ],
    rubrics: [
      { criterion: 'Containerization & Ingress', max_marks: 8 },
      { criterion: 'Horizontal Pod Autoscaler (HPA)', max_marks: 6 },
      { criterion: 'Observability & Metrics', max_marks: 6 }
    ]
  },
  {
    id: 'asg-004',
    subject_code: 'MCA-204',
    subject_name: 'Software Engineering & Agile Methodologies',
    faculty_name: 'Prof. Sunita Pillai',
    title: 'Sprint Backlog & Test-Driven Development Suite',
    description: 'Write comprehensive Jest / PyTest test cases achieving minimum 85% branch coverage for the payment ledger module.',
    due_date: '2026-04-20T23:59:00',
    total_marks: 25,
    weightage_percent: 10,
    status: 'graded',
    submission: {
      submitted_at: '2026-04-19T21:10:00',
      file_name: 'Rahul_TDD_Coverage_Report.pdf',
      file_size_kb: 2100,
      notes: 'Achieved 91.4% branch coverage with edge testing.',
      marks_obtained: 24,
      feedback: 'Outstanding test suite design and mock mocking strategy. Well done!',
      graded_by: 'Prof. Sunita Pillai'
    }
  }
];

class AssignmentService {
  private getStorageKey(studentId?: string): string {
    return studentId ? `itm_student_assignments_${studentId}` : 'itm_student_assignments_v1';
  }

  private getStoredAssignments(studentId?: string, studentName?: string): Assignment[] {
    const key = this.getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const sanitizedName = (studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '');
      const studentSeed = INITIAL_ASSIGNMENTS.map((asg) => {
        if (asg.submission) {
          return {
            ...asg,
            submission: {
              ...asg.submission,
              file_name: `${sanitizedName}_${asg.subject_code}_Assignment1.pdf`
            }
          };
        }
        return { ...asg };
      });
      localStorage.setItem(key, JSON.stringify(studentSeed));
      return studentSeed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  }

  private saveAssignments(items: Assignment[], studentId?: string): void {
    localStorage.setItem(this.getStorageKey(studentId), JSON.stringify(items));
  }

  async getAssignments(studentId?: string, studentName?: string): Promise<Assignment[]> {
    await new Promise((r) => setTimeout(r, 60));
    if (!studentId) return [];
    const key = this.getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    if (studentId === 'stu-001' || studentId === 'stu-current') {
      return this.getStoredAssignments(studentId, studentName);
    }

    try {
      const enrollments = await enrollmentService.getEnrollmentsByStudent(studentId);
      if (enrollments && enrollments.length > 0) {
        const dynamicAsgs: Assignment[] = enrollments.slice(0, 3).map((e, idx) => ({
          id: `asg-dyn-${studentId}-${idx}`,
          subject_code: e.subject?.code || `SUB-10${idx + 1}`,
          subject_name: e.subject?.name || 'Academic Coursework',
          faculty_name: 'Course Instructor',
          title: `Assignment ${idx + 1}: Core Principles & Applied Problem Set`,
          description: `Comprehensive coursework assessing unit concepts and computational applications for ${e.subject?.name || 'the course'}.`,
          due_date: new Date(Date.now() + 86400000 * (idx + 3)).toISOString(),
          total_marks: 25,
          weightage_percent: 10,
          status: 'not_started',
          attachments: [
            { name: `${e.subject?.code || 'Course'}_Assignment_Problem_Statement.pdf`, url: '#', size: '250 KB' }
          ],
          rubrics: [
            { criterion: 'Theoretical Foundation & Formulation', max_marks: 10 },
            { criterion: 'Solution Completeness & Accuracy', max_marks: 10 },
            { criterion: 'Presentation & Documentation', max_marks: 5 }
          ]
        }));
        localStorage.setItem(key, JSON.stringify(dynamicAsgs));
        return dynamicAsgs;
      }
    } catch (err) {
      console.warn('[ASSIGNMENT] Error loading student enrollments:', err);
    }

    return this.getStoredAssignments(studentId, studentName);
  }

  async createAssignment(payload: Omit<Assignment, 'id' | 'status' | 'submission'> & { faculty_id?: string }): Promise<Assignment> {
    const list = this.getStoredAssignments();
    const newAsg: Assignment = {
      ...payload,
      id: `asg-${Date.now()}`,
      status: 'not_started',
      faculty_id: payload.faculty_id,
    };
    const updated = [newAsg, ...list];
    this.saveAssignments(updated);
    return newAsg;
  }

  async getAssignmentsByFaculty(facultyId?: string, facultyName?: string): Promise<Assignment[]> {
    await new Promise((r) => setTimeout(r, 60));
    const all = this.getStoredAssignments();
    if (!facultyId) return all;
    return all.filter((a) => {
      if (a.faculty_id && a.faculty_id === facultyId) return true;
      if (facultyName && a.faculty_name.toLowerCase().includes(facultyName.toLowerCase().split(' ')[0])) return true;
      return false;
    });
  }

  async gradeSubmission(
    assignmentId: string,
    marksObtained: number,
    feedback: string,
    gradedBy: string,
    studentId?: string
  ): Promise<Assignment> {
    const list = this.getStoredAssignments(studentId);
    const idx = list.findIndex((a) => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');

    const cur = list[idx];
    const updated: Assignment = {
      ...cur,
      status: 'graded',
      submission: {
        submitted_at: cur.submission?.submitted_at || new Date().toISOString(),
        file_name: cur.submission?.file_name || 'Submission_Doc.pdf',
        file_size_kb: cur.submission?.file_size_kb || 1200,
        notes: cur.submission?.notes,
        marks_obtained: marksObtained,
        feedback,
        graded_by: gradedBy,
      },
    };

    list[idx] = updated;
    this.saveAssignments(list, studentId);
    return updated;
  }

  async submitAssignment(
    assignmentId: string,
    fileName: string,
    fileSizeKb: number,
    notes?: string,
    studentId?: string
  ): Promise<Assignment> {
    const list = this.getStoredAssignments(studentId);
    const idx = list.findIndex((a) => a.id === assignmentId);
    if (idx === -1) throw new Error('Assignment not found');

    const updated: Assignment = {
      ...list[idx],
      status: 'submitted',
      submission: {
        submitted_at: new Date().toISOString(),
        file_name: fileName,
        file_size_kb: fileSizeKb,
        notes: notes || 'Submitted via Student Portal'
      }
    };

    list[idx] = updated;
    this.saveAssignments(list, studentId);
    return updated;
  }
}

export const assignmentService = new AssignmentService();
