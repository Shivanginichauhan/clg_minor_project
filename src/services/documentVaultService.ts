export type DocumentCategory = 'marksheet' | 'hall_ticket' | 'receipt' | 'scholarship' | 'condonation' | 'certificate';

export interface VaultDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  semester: string;
  issue_date: string;
  file_name: string;
  file_size: string;
  format: 'PDF' | 'DOCX';
  verification_code: string;
  description: string;
  download_url: string;
  issuer: string;
  status: 'verified' | 'provisional' | 'archived';
}

const DEFAULT_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-001',
    title: 'Semester 1 Official Grade Card & Transcript',
    category: 'marksheet',
    semester: 'Semester 1 (Dec 2025)',
    issue_date: '2026-01-15',
    file_name: 'ITM_GradeCard_Sem1_2025MCA042.pdf',
    file_size: '640 KB',
    format: 'PDF',
    verification_code: 'VER-SEM1-849204',
    description: 'Official CBCS marksheet signed by Controller of Examinations. SGPA: 8.80.',
    download_url: '#',
    issuer: 'Office of the Controller of Examinations',
    status: 'verified'
  },
  {
    id: 'doc-002',
    title: 'End-Semester Examination Hall Ticket / Admit Card',
    category: 'hall_ticket',
    semester: 'Semester 2 (May 2026)',
    issue_date: '2026-04-28',
    file_name: 'AdmitCard_May2026_MCA2.pdf',
    file_size: '420 KB',
    format: 'PDF',
    verification_code: 'ADMIT-MAY26-9921',
    description: 'Statutory entry pass containing exam schedule, seat allocation, and verified QR code.',
    download_url: '#',
    issuer: 'Examination Center ITM',
    status: 'verified'
  },
  {
    id: 'doc-003',
    title: 'Semester 2 Tuition & Development Fee Receipt',
    category: 'receipt',
    semester: 'Semester 2 (AY 2025-26)',
    issue_date: '2026-01-10',
    file_name: 'FeeReceipt_Sem2_TXN88291.pdf',
    file_size: '310 KB',
    format: 'PDF',
    verification_code: 'FEE-2026-TXN88291',
    description: 'Statutory digital payment receipt for ₹45,000 paid via Net Banking.',
    download_url: '#',
    issuer: 'Accounts & Finance Division',
    status: 'verified'
  },
  {
    id: 'doc-004',
    title: 'Chancellor Merit Scholarship Sanction Order',
    category: 'scholarship',
    semester: 'Academic Year 2025-26',
    issue_date: '2025-10-14',
    file_name: 'Sanction_ChancellorMerit_2025.pdf',
    file_size: '520 KB',
    format: 'PDF',
    verification_code: 'SCHOL-ORD-2025-091',
    description: 'Official sanction order granting 50% tuition waiver (₹25,000) based on top 5 percentile merit.',
    download_url: '#',
    issuer: 'Academic Council & Dean Office',
    status: 'verified'
  },
  {
    id: 'doc-005',
    title: 'Medical Condonation Approval Order',
    category: 'condonation',
    semester: 'Semester 1 (Dec 2025)',
    issue_date: '2025-11-20',
    file_name: 'Medical_Condonation_Approval_Sem1.pdf',
    file_size: '280 KB',
    format: 'PDF',
    verification_code: 'COND-2025-MCA-11',
    description: 'Dean approved 5.2% condonation due to hospitalization during mid-term cycle.',
    download_url: '#',
    issuer: 'Dean Academic Council',
    status: 'verified'
  },
  {
    id: 'doc-006',
    title: 'Institutional Bonafide & Enrolment Certificate',
    category: 'certificate',
    semester: 'AY 2025-26',
    issue_date: '2025-08-05',
    file_name: 'Bonafide_Certificate_MCA_2025.pdf',
    file_size: '380 KB',
    format: 'PDF',
    verification_code: 'CERT-BNF-2025-0042',
    description: 'Certified student bonafide for passport, bank education loan, and transit pass verification.',
    download_url: '#',
    issuer: 'Registrar Office',
    status: 'verified'
  }
];

class DocumentVaultService {
  async getDocuments(studentId?: string, rollNumber?: string): Promise<VaultDocument[]> {
    await new Promise((r) => setTimeout(r, 60));
    const safeRoll = (rollNumber || studentId || 'STUDENT').replace(/[^a-zA-Z0-9]/g, '');
    return DEFAULT_DOCUMENTS.map((doc) => {
      let fileName = doc.file_name.replace('2025MCA042', safeRoll);
      let verifCode = doc.verification_code;
      if (doc.category === 'marksheet') {
        fileName = `ITM_GradeCard_Sem1_${safeRoll}.pdf`;
        verifCode = `VER-SEM1-${safeRoll.slice(-6).toUpperCase()}`;
      } else if (doc.category === 'hall_ticket') {
        fileName = `AdmitCard_May2026_${safeRoll}.pdf`;
      }
      return {
        ...doc,
        file_name: fileName,
        verification_code: verifCode,
      };
    });
  }

  downloadDocument(doc: VaultDocument): void {
    // Generate text/pdf simulation download safely
    const content = `========================================================\nITM UNIVERSITY - VERIFIED DIGITAL VAULT RECORD\n========================================================\nDocument: ${doc.title}\nCategory: ${doc.category.toUpperCase()}\nVerification Reference: ${doc.verification_code}\nIssued By: ${doc.issuer}\nDate: ${doc.issue_date}\n\nThis is a certified digital transcript record from the central archive.\nVerify at: https://verify.itm.edu/doc/${doc.verification_code}\n========================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file_name.endsWith('.pdf') ? doc.file_name.replace('.pdf', '_record.txt') : doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const documentVaultService = new DocumentVaultService();
