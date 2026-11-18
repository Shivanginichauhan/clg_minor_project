import { attendanceService } from './attendanceService.js';
import { assignmentService } from './assignmentService.js';

export type NotificationPriority = 'urgent' | 'deadline' | 'info' | 'success';
export type NotificationCategory = 'attendance' | 'exam' | 'assignment' | 'fee' | 'general';

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string;
  action_label?: string;
  action_url?: string;
  is_read: boolean;
  snoozed_until?: string | null;
}

const INITIAL_NOTIFICATIONS: StudentNotification[] = [
  {
    id: 'notif-1',
    title: 'Statutory Attendance Warning: DBMS-201',
    message: 'Your current attendance in Advanced DBMS is 72.5% (below statutory 75%). You must attend the next 3 consecutive lectures to become eligible for hall ticket issuance.',
    category: 'attendance',
    priority: 'urgent',
    timestamp: '2026-04-20T08:30:00',
    action_label: 'View Attendance Ledger',
    action_url: '/student/attendance',
    is_read: false
  },
  {
    id: 'notif-2',
    title: 'Assignment Submission Deadline: Computer Networks',
    message: 'Assignment "BGP Routing & RPKI Validation Lab Report" is due tomorrow at 11:59 PM. Upload your packet analysis before portal locks.',
    category: 'assignment',
    priority: 'deadline',
    timestamp: '2026-04-20T09:15:00',
    action_label: 'Submit Assignment',
    action_url: '/student/assignments',
    is_read: false
  },
  {
    id: 'notif-3',
    title: 'End-Semester Exam Hall Ticket Ready for Download',
    message: 'May 2026 Term End Examination Admit Card has been generated with your verified roll number and seat desk allocation.',
    category: 'exam',
    priority: 'urgent',
    timestamp: '2026-04-18T14:00:00',
    action_label: 'Download Hall Ticket',
    action_url: '/student/examinations',
    is_read: false
  },
  {
    id: 'notif-4',
    title: 'Chancellor Merit Grant Disbursed & Adjusted',
    message: 'Institutional Merit Scholarship voucher of ₹25,000 has been successfully reconciled against Semester 2 tuition fees with 0 remaining balance.',
    category: 'fee',
    priority: 'success',
    timestamp: '2026-04-15T11:00:00',
    action_label: 'View Fee Breakdown',
    action_url: '/student/fees',
    is_read: true
  },
  {
    id: 'notif-5',
    title: 'University Annual Tech Fest & Hackathon Registration',
    message: 'Registrations are now open for ITM HackNation 2026. Teams of up to 4 can submit project abstracts before 10 May.',
    category: 'general',
    priority: 'info',
    timestamp: '2026-04-12T10:00:00',
    action_label: 'Read Circular',
    action_url: '/student/notices',
    is_read: true
  }
];

class StudentNotificationService {
  private getStorageKey(studentId?: string): string {
    return studentId ? `itm_student_notifications_${studentId}` : 'itm_student_notifications_v1';
  }

  private save(items: StudentNotification[], studentId?: string): void {
    localStorage.setItem(this.getStorageKey(studentId), JSON.stringify(items));
  }

  async getNotifications(studentId?: string): Promise<StudentNotification[]> {
    await new Promise((r) => setTimeout(r, 60));
    const key = this.getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    let notifications = [...INITIAL_NOTIFICATIONS];
    if (studentId) {
      try {
        const att = await attendanceService.getStudentAttendanceOverview(studentId);
        const dangerSubject = att.subjectReports.find((r) => r.percentage < 75);
        if (dangerSubject) {
          notifications = [
            {
              id: `notif-att-${dangerSubject.subject.id}`,
              title: `Statutory Attendance Warning: ${dangerSubject.subject.code}`,
              message: `Your current attendance in ${dangerSubject.subject.name} is ${dangerSubject.percentage.toFixed(1)}% (below statutory 75%). You must attend the next ${Math.max(1, Math.ceil(3 * dangerSubject.total_classes - 4 * dangerSubject.attended_classes))} consecutive lectures to restore eligibility.`,
              category: 'attendance',
              priority: 'urgent',
              timestamp: new Date().toISOString(),
              action_label: 'View Attendance Ledger',
              action_url: '/student/attendance',
              is_read: false
            },
            ...INITIAL_NOTIFICATIONS.filter(n => n.category !== 'attendance')
          ];
        } else {
          notifications = [
            {
              id: 'notif-att-good',
              title: 'Statutory Attendance Standing: Verified',
              message: `Your overall attendance is ${att.overallPercentage.toFixed(1)}%. You meet all statutory eligibility criteria for upcoming examinations.`,
              category: 'attendance',
              priority: 'success',
              timestamp: new Date().toISOString(),
              action_label: 'View Attendance Ledger',
              action_url: '/student/attendance',
              is_read: true
            },
            ...INITIAL_NOTIFICATIONS.filter(n => n.category !== 'attendance')
          ];
        }

        // Dynamically integrate upcoming assignment deadlines into the notification feed
        const assignments = await assignmentService.getAssignments(studentId);
        const pendingAssignments = assignments.filter((a) => a.status !== 'submitted' && a.status !== 'graded');
        const asgNotifs: StudentNotification[] = pendingAssignments.map((a) => {
          const diffDays = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 3600 * 24);
          const isUrgent = diffDays <= 1;
          return {
            id: `notif-asg-${a.id}`,
            title: `Coursework Due: ${a.title} (${a.subject_code})`,
            message: `Submission due by ${new Date(a.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(a.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}. Total Weightage: ${a.weightage_percent}% (${a.total_marks} Marks).`,
            category: 'assignment',
            priority: isUrgent ? 'urgent' : 'deadline',
            timestamp: new Date().toISOString(),
            action_label: 'Upload Coursework',
            action_url: '/student/assignments',
            is_read: false,
          };
        });

        // Prepend active assignment notifications
        notifications = [...asgNotifs, ...notifications.filter((n) => n.category !== 'assignment')];
      } catch (err) {
        console.warn('[NOTIFICATIONS] Dynamic student data generation error:', err);
      }
    }

    localStorage.setItem(key, JSON.stringify(notifications));
    return notifications;
  }

  async markAsRead(id: string, studentId?: string): Promise<void> {
    const list = await this.getNotifications(studentId);
    const item = list.find((n) => n.id === id);
    if (item) {
      item.is_read = true;
      this.save(list, studentId);
    }
  }

  async markAllAsRead(studentId?: string): Promise<void> {
    const list = (await this.getNotifications(studentId)).map((n) => ({ ...n, is_read: true }));
    this.save(list, studentId);
  }

  async snoozeNotification(id: string, hours: number, studentId?: string): Promise<void> {
    const list = await this.getNotifications(studentId);
    const item = list.find((n) => n.id === id);
    if (item) {
      const snoozeDate = new Date();
      snoozeDate.setHours(snoozeDate.getHours() + hours);
      item.snoozed_until = snoozeDate.toISOString();
      this.save(list, studentId);
    }
  }

  async addNotification(
    notif: Omit<StudentNotification, 'id' | 'timestamp' | 'is_read'>,
    studentId?: string
  ): Promise<StudentNotification> {
    const list = await this.getNotifications(studentId);
    const newEntry: StudentNotification = {
      id: `notif-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      is_read: false,
      ...notif,
    };
    list.unshift(newEntry);
    this.save(list, studentId);
    return newEntry;
  }
}

export const studentNotificationService = new StudentNotificationService();
