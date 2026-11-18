export interface FeeHead {
  name: string;
  billed: number;
  paid: number;
  scholarship_offset: number;
  balance: number;
  due_date: string;
  status: 'paid' | 'partial' | 'due' | 'overdue';
}

export interface FeeTransaction {
  id: string;
  receipt_no: string;
  date: string;
  amount: number;
  payment_mode: 'NetBanking' | 'UPI' | 'CreditCard' | 'Scholarship Credit' | 'Demand Draft';
  heads_covered: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  gateway_ref: string;
}

export interface StudentFeeSummary {
  studentId: string;
  academicYear: string;
  semesterName: string;
  totalBilled: number;
  totalPaid: number;
  scholarshipOffset: number;
  outstandingBalance: number;
  nextDueDate: string;
  feeHeads: FeeHead[];
  transactions: FeeTransaction[];
}

const DEFAULT_FEE_SUMMARY: StudentFeeSummary = {
  studentId: 'stu-current',
  academicYear: '2025 - 2026',
  semesterName: 'MCA Semester 2',
  totalBilled: 68500,
  totalPaid: 43500,
  scholarshipOffset: 25000,
  outstandingBalance: 0,
  nextDueDate: '2026-08-10',
  feeHeads: [
    {
      name: 'Semester Tuition Fee',
      billed: 50000,
      paid: 25000,
      scholarship_offset: 25000,
      balance: 0,
      due_date: '2026-01-15',
      status: 'paid'
    },
    {
      name: 'Computer Lab & Cloud Sandbox Access',
      billed: 8500,
      paid: 8500,
      scholarship_offset: 0,
      balance: 0,
      due_date: '2026-01-15',
      status: 'paid'
    },
    {
      name: 'End-Semester Examination Fee',
      billed: 3000,
      paid: 3000,
      scholarship_offset: 0,
      balance: 0,
      due_date: '2026-04-30',
      status: 'paid'
    },
    {
      name: 'Central Library & IEEE Digital Access',
      billed: 4500,
      paid: 4500,
      scholarship_offset: 0,
      balance: 0,
      due_date: '2026-01-15',
      status: 'paid'
    },
    {
      name: 'University Development & Sports Fund',
      billed: 2500,
      paid: 2500,
      scholarship_offset: 0,
      balance: 0,
      due_date: '2026-01-15',
      status: 'paid'
    }
  ],
  transactions: [
    {
      id: 'TXN-882910',
      receipt_no: 'ITM/RCP/2026/0491',
      date: '2026-04-20 14:32',
      amount: 3000,
      payment_mode: 'UPI',
      heads_covered: 'End-Semester Examination Fee',
      status: 'SUCCESS',
      gateway_ref: 'UPI/HDFC/2026042091823'
    },
    {
      id: 'TXN-871024',
      receipt_no: 'ITM/RCP/2026/0118',
      date: '2026-01-10 11:15',
      amount: 40500,
      payment_mode: 'NetBanking',
      heads_covered: 'Tuition (Part) + Labs + Library + Sports',
      status: 'SUCCESS',
      gateway_ref: 'SBIN/NB/9912048572'
    },
    {
      id: 'SCH-OFFSET-001',
      receipt_no: 'ITM/ADJ/2026/004',
      date: '2026-01-08 10:00',
      amount: 25000,
      payment_mode: 'Scholarship Credit',
      heads_covered: 'Chancellor Merit Grant 50% Tuition Waiver',
      status: 'SUCCESS',
      gateway_ref: 'GOV-DBT/UNIV-ADJUST/2026'
    }
  ]
};

class FeeService {
  private getStorageKey(studentId?: string): string {
    return studentId ? `itm_student_fees_${studentId}` : 'itm_student_fees_v1';
  }

  private getStoredSummary(studentId?: string, programName?: string, semesterName?: string): StudentFeeSummary {
    const key = this.getStorageKey(studentId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const isSeed = studentId === 'stu-001' || studentId === 'stu-current';
      const studentSeed: StudentFeeSummary = isSeed
        ? {
            ...DEFAULT_FEE_SUMMARY,
            studentId: studentId || 'stu-current',
          }
        : {
            studentId: studentId || 'stu-current',
            academicYear: '2025 - 2026',
            semesterName: semesterName || (programName ? `${programName} Current Semester` : 'Regular Semester'),
            totalBilled: 55000,
            totalPaid: 55000,
            scholarshipOffset: 0,
            outstandingBalance: 0,
            nextDueDate: '2026-08-10',
            feeHeads: [
              {
                name: 'Semester Tuition Fee',
                billed: 45000,
                paid: 45000,
                scholarship_offset: 0,
                balance: 0,
                due_date: '2026-01-15',
                status: 'paid',
              },
              {
                name: 'Lab & Computer Sandbox Fee',
                billed: 6000,
                paid: 6000,
                scholarship_offset: 0,
                balance: 0,
                due_date: '2026-01-15',
                status: 'paid',
              },
              {
                name: 'Library & Online Journals Fee',
                billed: 2500,
                paid: 2500,
                scholarship_offset: 0,
                balance: 0,
                due_date: '2026-01-15',
                status: 'paid',
              },
              {
                name: 'Student Welfare & Sports Fund',
                billed: 1500,
                paid: 1500,
                scholarship_offset: 0,
                balance: 0,
                due_date: '2026-01-15',
                status: 'paid',
              },
            ],
            transactions: [
              {
                id: `TXN-${Date.now().toString().slice(-6)}`,
                receipt_no: `ITM/RCP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
                date: '2026-01-12 10:30',
                amount: 55000,
                payment_mode: 'NetBanking',
                heads_covered: 'Tuition + Lab + Library + Welfare Settlement',
                status: 'SUCCESS',
                gateway_ref: `HDFC/NB/${Date.now().toString().slice(-8)}`,
              },
            ],
          };
      localStorage.setItem(key, JSON.stringify(studentSeed));
      return studentSeed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FEE_SUMMARY;
    }
  }

  private saveSummary(data: StudentFeeSummary, studentId?: string): void {
    localStorage.setItem(this.getStorageKey(studentId), JSON.stringify(data));
  }

  async getFeeSummary(studentId?: string, programName?: string, semesterName?: string): Promise<StudentFeeSummary> {
    await new Promise((r) => setTimeout(r, 60));
    return this.getStoredSummary(studentId, programName, semesterName);
  }

  async payFee(amount: number, mode: 'UPI' | 'NetBanking' | 'CreditCard', studentId?: string): Promise<FeeTransaction> {
    const summary = this.getStoredSummary(studentId);
    const newTxn: FeeTransaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      receipt_no: `ITM/RCP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      amount,
      payment_mode: mode,
      heads_covered: 'Supplementary / Tuition Settlement',
      status: 'SUCCESS',
      gateway_ref: `${mode}/GATEWAY/${Date.now()}`
    };

    summary.totalPaid += amount;
    summary.outstandingBalance = Math.max(0, summary.outstandingBalance - amount);
    summary.transactions.unshift(newTxn);
    this.saveSummary(summary, studentId);
    return newTxn;
  }
}

export const feeService = new FeeService();
