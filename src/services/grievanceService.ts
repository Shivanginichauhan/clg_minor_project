export type GrievanceCategory = 'attendance' | 'marks' | 'fee' | 'hall_ticket' | 'other';
export type GrievanceStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface GrievanceComment {
  id: string;
  sender: string;
  role: 'student' | 'officer' | 'system';
  timestamp: string;
  message: string;
}

export interface GrievanceTicket {
  id: string;
  ticket_no: string;
  student_id: string;
  student_name: string;
  category: GrievanceCategory;
  subject: string;
  description: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  department: string;
  sla_days: number;
  is_escalated: boolean;
  resolution_note?: string;
  comments: GrievanceComment[];
  attachment_name?: string;
}

const DEFAULT_GRIEVANCES: GrievanceTicket[] = [
  {
    id: 'grv-01',
    ticket_no: 'GRV-2026-0419',
    student_id: 'stu-current',
    student_name: 'Rahul Sharma',
    category: 'attendance',
    subject: 'Attendance missing for MCA-201 DBMS Lecture on 18 April',
    description: 'I was present during the physical roll-call in Room 302 on 18 April (10:00 AM - 11:00 AM), but the portal marked absent.',
    priority: 'high',
    status: 'in_progress',
    created_at: '2026-04-19 14:10',
    updated_at: '2026-04-20 09:30',
    assigned_to: 'Dr. Ananya Sen (Course Faculty)',
    department: 'Department of Computer Science',
    sla_days: 3,
    is_escalated: false,
    comments: [
      {
        id: 'c1',
        sender: 'Student Support System',
        role: 'system',
        timestamp: '2026-04-19 14:10',
        message: 'Ticket received and routed automatically to Course Coordinator.'
      },
      {
        id: 'c2',
        sender: 'Prof. Ananya Sen',
        role: 'officer',
        timestamp: '2026-04-20 09:30',
        message: 'Cross-verifying against the manual classroom roster sheet with Teaching Assistant.'
      }
    ]
  },
  {
    id: 'grv-02',
    ticket_no: 'GRV-2026-0288',
    student_id: 'stu-current',
    student_name: 'Rahul Sharma',
    category: 'fee',
    subject: 'Scholarship offset not reflected in receipt breakdown TXN-871024',
    description: 'Chancellor Merit sanction letter was approved on 14 Oct 2025, needed confirmation of credit transfer.',
    priority: 'medium',
    status: 'resolved',
    created_at: '2026-01-12 11:20',
    updated_at: '2026-01-14 16:45',
    assigned_to: 'Accounts Section (Finance Desk)',
    department: 'Central Accounts & Finance',
    sla_days: 5,
    is_escalated: false,
    resolution_note: 'Scholarship credit voucher SCH-OFFSET-001 has been mapped and fee ledger reconciled with zero balance.',
    comments: [
      {
        id: 'c3',
        sender: 'Accounts Officer Mr. Gopal',
        role: 'officer',
        timestamp: '2026-01-14 16:45',
        message: 'Reconciliation complete. Download updated fee receipt from your Fee Portal.'
      }
    ]
  }
];

class GrievanceService {
  private getStorageKey(studentId?: string): string {
    return studentId ? `itm_student_grievances_${studentId}` : 'itm_student_grievances_v1';
  }

  private getStored(studentId?: string, studentName?: string): GrievanceTicket[] {
    if (!studentId) return [];
    const key = this.getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (studentId === 'stu-001' || studentId === 'stu-current' || studentId === 'student-current') {
        const studentSeed = DEFAULT_GRIEVANCES.map((g) => ({
          ...g,
          student_id: studentId,
          student_name: studentName || g.student_name,
        }));
        localStorage.setItem(key, JSON.stringify(studentSeed));
        return studentSeed;
      }
      // For any real/new logged-in student, start clean with 0 grievances
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: GrievanceTicket[] = JSON.parse(raw);
      return parsed.filter((t) => t.student_id === studentId);
    } catch {
      return [];
    }
  }

  private save(items: GrievanceTicket[], studentId?: string): void {
    if (!studentId) return;
    localStorage.setItem(this.getStorageKey(studentId), JSON.stringify(items));
  }

  async getGrievances(studentId?: string, studentName?: string): Promise<GrievanceTicket[]> {
    if (!studentId) return [];
    await new Promise((r) => setTimeout(r, 60));
    return this.getStored(studentId, studentName);
  }

  async createGrievance(data: {
    student_id: string;
    student_name: string;
    category: GrievanceCategory;
    subject: string;
    description: string;
    priority: GrievancePriority;
    attachment_name?: string;
  }): Promise<GrievanceTicket> {
    const list = this.getStored(data.student_id, data.student_name);
    const newId = `grv-${Date.now()}`;
    const ticketNo = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: GrievanceTicket = {
      id: newId,
      ticket_no: ticketNo,
      student_id: data.student_id,
      student_name: data.student_name,
      category: data.category,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: 'submitted',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updated_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
      department: data.category === 'fee' ? 'Finance & Accounts' : 'Academic Office & HOD',
      sla_days: data.priority === 'urgent' ? 2 : 5,
      is_escalated: false,
      attachment_name: data.attachment_name,
      comments: [
        {
          id: `c-${Date.now()}`,
          sender: 'Central Helpdesk',
          role: 'system',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          message: 'Ticket recorded with SLA timer. Officer assignment underway.'
        }
      ]
    };

    list.unshift(newTicket);
    this.save(list, data.student_id);
    return newTicket;
  }

  async addComment(ticketId: string, message: string, senderName: string, studentId?: string): Promise<GrievanceTicket> {
    const list = this.getStored(studentId, senderName);
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = list[idx];
    ticket.comments.push({
      id: `c-${Date.now()}`,
      sender: senderName,
      role: 'student',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      message
    });
    ticket.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 16);

    list[idx] = ticket;
    this.save(list, studentId);
    return ticket;
  }

  async updateStatus(ticketId: string, status: GrievanceStatus, resolutionNote?: string): Promise<GrievanceTicket> {
    const list = this.getStored();
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = list[idx];
    ticket.status = status;
    if (resolutionNote) ticket.resolution_note = resolutionNote;
    ticket.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    ticket.comments.push({
      id: `c-${Date.now()}`,
      sender: 'Redressal Officer',
      role: 'officer',
      timestamp: ticket.updated_at,
      message: `Status transitioned to ${status.toUpperCase()}${resolutionNote ? `: ${resolutionNote}` : ''}`
    });

    list[idx] = ticket;
    this.save(list);
    return ticket;
  }

  async escalateTicket(ticketId: string, reason: string): Promise<GrievanceTicket> {
    const list = this.getStored();
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = list[idx];
    ticket.is_escalated = true;
    ticket.priority = 'urgent';
    ticket.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
    ticket.comments.push({
      id: `c-${Date.now()}`,
      sender: 'SLA Escalation Engine',
      role: 'system',
      timestamp: ticket.updated_at,
      message: `Ticket escalated to higher authority. Reason: ${reason}`
    });

    list[idx] = ticket;
    this.save(list);
    return ticket;
  }
}

export const grievanceService = new GrievanceService();
