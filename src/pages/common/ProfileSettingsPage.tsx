import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Lock,
  Save,
  Check,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Award,
  Shield,
  School,
  Camera,
  Trash2,
  MapPin,
  FileText,
  Printer,
  QrCode,
  Download,
  Upload,
  Plus,
  X,
  Users,
  CreditCard,
  HeartHandshake
} from 'lucide-react';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';
import { Link } from 'react-router-dom';

export const ProfileSettingsPage: React.FC = () => {
  const { profile, role, updateProfileData, updatePassword, user } = useAuth();

  // Robust effective role detection from URL path or auth context
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const effectiveRole = (
    pathname.startsWith('/faculty') ? 'faculty' :
    pathname.startsWith('/dean') ? 'dean' :
    pathname.startsWith('/admin') ? 'administrator' :
    (profile?.role || role || 'student')
  ) as 'student' | 'faculty' | 'administrator' | 'dean';

  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'documents' | 'achievements' | 'id_card' | 'security'>('personal');

  // Document locker: per-slot upload type
  type DocSlot = {
    id: string;
    label: string;
    description: string;
    required: boolean;
    accepts: string;
    category: string;
    dataUrl?: string;
    fileName?: string;
    size?: string;
    uploadedAt?: string;
  };

  // Role-based official document definitions
  const getRoleDocSlots = (targetRole: string): Omit<DocSlot, 'dataUrl' | 'fileName' | 'size' | 'uploadedAt'>[] => {
    switch (targetRole) {
      case 'faculty':
        return [
          { id: 'fac_phd_pg', label: "Doctoral (Ph.D.) / Master's Degree Certificate", description: 'Highest qualification degree certificate & transcripts (UGC/AICTE recognized)', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Academic' },
          { id: 'fac_ugc_net', label: 'UGC-NET / CSIR-JRF / GATE Scorecard & Award Letter', description: 'National eligibility test qualification certificate or research fellowship award', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Eligibility' },
          { id: 'fac_appointment', label: 'University Appointment & Selection Committee Order', description: 'Official faculty appointment letter issued by the Registrar & Board of Governors', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Employment' },
          { id: 'fac_joining', label: 'Official Joining Report & Declaration of Service', description: 'Counter-signed joining report attested by Head of Department & Dean', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Employment' },
          { id: 'fac_experience', label: 'Prior Teaching & Industrial Experience Certificates', description: 'Service letters & experience certificates from previous accredited institutions', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Service' },
          { id: 'fac_aadhaar_pan', label: 'National Identity Proof (Aadhaar & PAN Card)', description: 'Self-attested government identity copy (UIDAI Aadhaar & Income Tax PAN)', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'fac_relieving_noc', label: 'Relieving Order & Institution No Objection Certificate (NOC)', description: 'Official clearance and relieving certificate from previous university / employer', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Compliance' },
          { id: 'fac_lpc_bank', label: 'Last Pay Certificate (LPC) & Bank ECS Mandate', description: 'Salary certificate / LPC and cancelled cheque for university payroll disbursement', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Finance' },
          { id: 'fac_publications', label: 'SCI / Scopus Indexed Research Papers & Patent Dossier', description: 'Compilation of top 5 journal papers, books, or granted patent certificates', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Research' },
          { id: 'fac_photo_sig', label: 'Official Faculty Photo & Digital Signature Specimen', description: 'Formal high-resolution passport portrait and scanned blue-ink signature specimen', required: true, accepts: '.jpg,.jpeg,.png', category: 'Identity' },
        ];
      case 'dean':
        return [
          { id: 'dean_gazette_order', label: 'Statutory Executive Appointment Notification', description: 'Official Gazette notification or Chancellor/Senate decree appointing Dean of Academic Affairs', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Executive' },
          { id: 'dean_phd_seniority', label: 'Senior Professorship & Doctoral (Ph.D.) Credentials', description: 'Professorial promotion decree (CAS Level 14/15) & Doctoral convocation degree', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Academic' },
          { id: 'dean_service_book', label: 'University Service Book & Cumulative Appraisal Dossier', description: 'Verified official service book extract and cumulative academic performance ledger', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Governance' },
          { id: 'dean_seal_specimen', label: 'Digital Cryptographic Signature & Official Seal Specimen', description: 'Specimen signature and institutional embossing seal specimen for statutory notices', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Executive' },
          { id: 'dean_id_pan', label: 'Government National Identity (Aadhaar & PAN Card)', description: 'Self-attested copies of government identity credentials', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'dean_vigilance', label: 'Central Vigilance Clearance & Ethics Declaration', description: 'Statutory integrity & vigilance clearance certificate from University Chief Vigilance Officer', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Vigilance' },
          { id: 'dean_fellowships', label: 'National/International Fellowships & Academic Chair Accreditations', description: 'IEEE Fellow, INSA, Royal Society, or Academic Chair tenure credentials', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Academic' },
          { id: 'dean_portrait', label: 'Executive Senate Formal Portrait', description: 'Formal academic regalia studio portrait for University Senate and Annual Report', required: true, accepts: '.jpg,.jpeg,.png', category: 'Identity' },
        ];
      case 'administrator':
        return [
          { id: 'adm_appointment', label: 'Central Administrator / Examination Controller Appointment Order', description: 'Board of Management appointment resolution and official cadre order', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Employment' },
          { id: 'adm_nda', label: 'University Confidentiality & Non-Disclosure Agreement (NDA)', description: 'Signed statutory bond for Examination security, result integrity, and student data protection', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Compliance' },
          { id: 'adm_pg_cert', label: 'Highest Academic & Professional Credentials', description: "Master's Degree / Engineering Degree in Computer Science, Systems, or Management", required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Academic' },
          { id: 'adm_identity', label: 'Government National ID (Aadhaar & PAN Card)', description: 'Self-attested copies of Aadhaar Card and Income Tax PAN Card', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'adm_experience', label: 'Enterprise Systems & Administrative Experience Letters', description: 'Prior service records in university ERP administration, examination data vaults, or e-governance', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Service' },
          { id: 'adm_security_cert', label: 'IT Governance / ISO 27001 / Cybersecurity Certifications', description: 'CISA, CISSP, CEH, or equivalent enterprise systems compliance credentials', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Technical' },
          { id: 'adm_photo_key', label: 'Authorized Officer Photo & Digital Key Verification', description: 'High-resolution administrative ID photograph and authorized PKI public key verification', required: true, accepts: '.jpg,.jpeg,.png', category: 'Identity' },
        ];
      case 'student':
      default:
        return [
          { id: 'doc_10th', label: '10th (Matriculation) Certificate', description: 'CBSE / ICSE / State Board pass certificate with marksheet', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Education' },
          { id: 'doc_12th', label: '12th (Higher Secondary) Certificate', description: 'Board pass certificate + marksheet with subjects', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Education' },
          { id: 'doc_degree', label: 'Graduation Degree / Diploma Certificate', description: 'BCA / B.Sc / BBA or equivalent degree certificate (if already issued)', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Education' },
          { id: 'doc_aadhaar', label: 'Aadhaar Card (UIDAI)', description: 'Both sides of Aadhaar card, self-attested copy', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'doc_domicile', label: 'Domicile / Residence Certificate', description: 'State domicile issued by Tehsildar or SDM', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'doc_category', label: 'Category / Caste Certificate', description: 'OBC / SC / ST / EWS — if applicable; else skip', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'doc_antiragging', label: 'Anti-Ragging Affidavit', description: 'Signed undertaking by student and parent/guardian', required: true, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Affidavit' },
          { id: 'doc_migration', label: 'Migration / Transfer Certificate', description: 'TC from previous institution (required if from another university)', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Education' },
          { id: 'doc_photo', label: 'Passport Size Photographs', description: 'Scanned copy of 6 recent colour passport photos (white background)', required: true, accepts: '.jpg,.jpeg,.png', category: 'Identity' },
          { id: 'doc_gap', label: 'Gap Year Certificate (if applicable)', description: 'Self-declaration affidavit for gap year between studies', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Affidavit' },
          { id: 'doc_income', label: 'Income Certificate (for Scholarship)', description: 'Annual family income certificate for scholarship/fee concession', required: false, accepts: '.pdf,.jpg,.jpeg,.png', category: 'Scholarship' },
        ];
    }
  };

  const getInitialDocSlots = (targetRole: string, userId: string): DocSlot[] => {
    const key = `ueams_doc_slots_${targetRole}_${userId || 'default'}`;
    const baseSlots = getRoleDocSlots(targetRole);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: DocSlot[] = JSON.parse(raw);
        return baseSlots.map(slot => {
          const found = parsed.find(p => p.id === slot.id);
          return found ? { ...slot, ...found } : { ...slot };
        });
      }
    } catch (err) {
      console.warn('Could not read doc slots from localStorage', err);
    }

    if (targetRole === 'faculty') {
      return baseSlots.map(slot => {
        if (slot.id === 'fac_phd_pg') {
          return { ...slot, fileName: 'phd_convocation_degree_iitd.pdf', size: '342.5 KB', uploadedAt: '15 Jul 2024', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'fac_appointment') {
          return { ...slot, fileName: 'university_faculty_appointment_order.pdf', size: '185.2 KB', uploadedAt: '22 Jul 2024', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'fac_aadhaar_pan') {
          return { ...slot, fileName: 'faculty_aadhaar_pan_verified.pdf', size: '210.0 KB', uploadedAt: '24 Jul 2024', dataUrl: 'sample_doc' };
        }
        return { ...slot };
      });
    }

    if (targetRole === 'dean') {
      return baseSlots.map(slot => {
        if (slot.id === 'dean_gazette_order') {
          return { ...slot, fileName: 'gazette_executive_order_dean_academics.pdf', size: '420.1 KB', uploadedAt: '10 Nov 2023', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'dean_phd_seniority') {
          return { ...slot, fileName: 'senior_professor_promotion_credentials.pdf', size: '290.4 KB', uploadedAt: '15 Nov 2023', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'dean_seal_specimen') {
          return { ...slot, fileName: 'dean_digital_cryptographic_seal_specimen.pdf', size: '148.0 KB', uploadedAt: '20 Nov 2023', dataUrl: 'sample_doc' };
        }
        return { ...slot };
      });
    }

    if (targetRole === 'administrator') {
      return baseSlots.map(slot => {
        if (slot.id === 'adm_appointment') {
          return { ...slot, fileName: 'bom_resolution_examination_controller.pdf', size: '310.2 KB', uploadedAt: '05 Jan 2024', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'adm_nda') {
          return { ...slot, fileName: 'exam_data_security_confidentiality_nda.pdf', size: '215.8 KB', uploadedAt: '08 Jan 2024', dataUrl: 'sample_doc' };
        }
        if (slot.id === 'adm_identity') {
          return { ...slot, fileName: 'controller_aadhaar_pan_attested.pdf', size: '190.5 KB', uploadedAt: '10 Jan 2024', dataUrl: 'sample_doc' };
        }
        return { ...slot };
      });
    }

    return baseSlots.map(slot => {
      if (slot.id === 'doc_10th') {
        return { ...slot, fileName: 'cbse_10th_marksheet_certificate.pdf', size: '210.4 KB', uploadedAt: '14 Aug 2025', dataUrl: 'sample_doc' };
      }
      if (slot.id === 'doc_12th') {
        return { ...slot, fileName: 'cbse_12th_science_marksheet.pdf', size: '245.8 KB', uploadedAt: '15 Aug 2025', dataUrl: 'sample_doc' };
      }
      if (slot.id === 'doc_aadhaar') {
        return { ...slot, fileName: 'aadhaar_card_masked_selfattested.pdf', size: '180.2 KB', uploadedAt: '16 Aug 2025', dataUrl: 'sample_doc' };
      }
      if (slot.id === 'doc_antiragging') {
        return { ...slot, fileName: 'ugc_antiragging_affidavit_signed.pdf', size: '130.5 KB', uploadedAt: '18 Aug 2025', dataUrl: 'sample_doc' };
      }
      return { ...slot };
    });
  };

  const [docSlots, setDocSlots] = useState<DocSlot[]>(() =>
    getInitialDocSlots(effectiveRole, user?.id || 'default')
  );

  // Sync slots whenever role or user changes
  React.useEffect(() => {
    setDocSlots(getInitialDocSlots(effectiveRole, user?.id || 'default'));
  }, [effectiveRole, user?.id]);

  const slotFileRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const handleSlotUpload = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = docSlots.map(s => s.id === slotId ? {
        ...s,
        dataUrl: ev.target?.result as string,
        fileName: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      } : s);
      setDocSlots(updated);
      try {
        localStorage.setItem(`ueams_doc_slots_${effectiveRole}_${user?.id || 'default'}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save slot upload to localStorage', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSlotDownload = (slot: DocSlot) => {
    if (slot.fileName) {
      const a = document.createElement('a');
      if (slot.dataUrl && slot.dataUrl !== 'sample_doc') {
        a.href = slot.dataUrl;
      } else {
        const dummyContent = `OFFICIAL UNIVERSITY RECORDS VAULT\n================================\nDocument: ${slot.label}\nFilename: ${slot.fileName}\nCategory: ${slot.category}\nVerification Status: Digitally Verified by University Registrar\nTimestamp: ${slot.uploadedAt || new Date().toISOString()}`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        a.href = URL.createObjectURL(blob);
      }
      a.download = slot.fileName;
      a.click();
    }
  };

  const handleSlotRemove = (slotId: string) => {
    const updated = docSlots.map(s => s.id === slotId ? { ...s, dataUrl: undefined, fileName: undefined, size: undefined, uploadedAt: undefined } : s);
    setDocSlots(updated);
    try {
      localStorage.setItem(`ueams_doc_slots_${effectiveRole}_${user?.id || 'default'}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save slot removal to localStorage', err);
    }
  };

  // Additional / Custom documents state (allows uploading any document outside standard slots)
  type ExtraDoc = {
    id: string;
    title: string;
    category: string;
    fileName: string;
    size: string;
    uploadedAt: string;
    dataUrl: string;
  };

  const extraDocsKey = `ueams_extra_docs_${effectiveRole}_${user?.id || 'default'}`;

  const [extraDocs, setExtraDocs] = useState<ExtraDoc[]>(() => {
    try {
      const raw = localStorage.getItem(extraDocsKey);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('Could not read extra docs', err);
    }
    return [];
  });

  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [extraDocTitle, setExtraDocTitle] = useState('');
  const [extraDocCategory, setExtraDocCategory] = useState('Academic');
  const [extraDocFile, setExtraDocFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const extraFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExtraDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setExtraDocFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: ev.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveExtraDoc = () => {
    if (!extraDocTitle.trim() || !extraDocFile) return;
    const newDoc: ExtraDoc = {
      id: `extra_doc_${Date.now()}`,
      title: extraDocTitle.trim(),
      category: extraDocCategory,
      fileName: extraDocFile.name,
      size: extraDocFile.size,
      uploadedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      dataUrl: extraDocFile.dataUrl,
    };
    const updated = [newDoc, ...extraDocs];
    setExtraDocs(updated);
    try {
      localStorage.setItem(extraDocsKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist extra doc', err);
    }
    setExtraDocTitle('');
    setExtraDocCategory('Academic');
    setExtraDocFile(null);
    setIsAddDocOpen(false);
  };

  const handleRemoveExtraDoc = (id: string) => {
    const updated = extraDocs.filter(d => d.id !== id);
    setExtraDocs(updated);
    try {
      localStorage.setItem(extraDocsKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not remove extra doc', err);
    }
  };

  const handleDownloadExtraDoc = (doc: ExtraDoc) => {
    if (doc.fileName) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.fileName;
      a.click();
    }
  };

  // Achievements & Professional Honors state
  type AchievementItem = {
    id: string;
    title: string;
    category: string;
    issuer: string;
    date: string;
    description: string;
    dataUrl?: string;
    fileName?: string;
    size?: string;
  };

  const achievementsKey = `ueams_achievements_${effectiveRole}_${user?.id || 'default'}`;

  const getInitialAchievements = (targetRole: string): AchievementItem[] => {
    if (targetRole === 'faculty') {
      return [
        {
          id: 'ach_fac_1',
          title: 'DST-SERB Core Research Grant (₹42.5 Lakhs)',
          category: 'Research Grant',
          issuer: 'Department of Science & Technology, Govt. of India',
          date: '2025-08-15',
          description: 'Principal Investigator for research grant on Scalable Distributed Consensus in Heterogeneous Cloud-Edge Networks.',
          fileName: 'dst_serb_grant_sanction.pdf',
          size: '320 KB',
          dataUrl: 'sample_ach',
        },
        {
          id: 'ach_fac_2',
          title: 'Patent Granted: Fault-Tolerant Byzantine Ledger',
          category: 'Patent Granted',
          issuer: 'Indian Patent Office (Govt. of India)',
          date: '2025-04-10',
          description: 'Commercialization and IP grant for decentralized consensus ledger architecture (Patent No. IN-419820-B).',
          fileName: 'patent_grant_certificate.pdf',
          size: '280 KB',
          dataUrl: 'sample_ach',
        },
        {
          id: 'ach_fac_3',
          title: 'Best Faculty Researcher Award 2025',
          category: 'Best Paper Award',
          issuer: 'Central University Academic Senate',
          date: '2025-01-26',
          description: 'Honoured for top research publication impact and h-index citations in academic year 2024-25.',
          fileName: 'best_faculty_award_2025.pdf',
          size: '190 KB',
          dataUrl: 'sample_ach',
        },
      ];
    }
    if (targetRole === 'dean') {
      return [
        {
          id: 'ach_dean_1',
          title: 'NAAC A++ Institutional Accreditation Steering Commendation',
          category: 'Statutory Accreditation',
          issuer: 'National Assessment & Accreditation Council (NAAC)',
          date: '2025-09-20',
          description: 'Led university academic curriculum compliance, CBCS outcome-based education audit, and criterion I-IV governance.',
          fileName: 'naac_steering_commendation.pdf',
          size: '410 KB',
          dataUrl: 'sample_ach',
        },
        {
          id: 'ach_dean_2',
          title: 'Fellow of the Indian National Academy of Engineering (FNAE)',
          category: 'National Fellowship',
          issuer: 'INAE Apex Council',
          date: '2024-11-12',
          description: 'Conferred honorary fellowship for distinguished national contributions to engineering education & computing systems.',
          fileName: 'inae_fellowship_conferment.pdf',
          size: '350 KB',
          dataUrl: 'sample_ach',
        },
      ];
    }
    if (targetRole === 'administrator') {
      return [
        {
          id: 'ach_adm_1',
          title: 'National E-Governance Excellence Award 2025',
          category: 'E-Governance Award',
          issuer: 'Ministry of Electronics & Information Technology (MeitY)',
          date: '2025-07-18',
          description: 'Awarded Gold Trophy for zero-error digital examination life-cycle automation and confidential result encryption.',
          fileName: 'meity_egov_gold_award.pdf',
          size: '380 KB',
          dataUrl: 'sample_ach',
        },
        {
          id: 'ach_adm_2',
          title: 'ISO 27001 Information Security Lead Auditor Credential',
          category: 'ISO Certification',
          issuer: 'BSI Group International',
          date: '2024-12-05',
          description: 'Certified Lead Auditor for university digital identity, RLS database access, and exam data vault protection.',
          fileName: 'iso_27001_lead_auditor.pdf',
          size: '290 KB',
          dataUrl: 'sample_ach',
        },
      ];
    }
    // Student
    return [
      {
        id: 'ach_std_1',
        title: '1st Place - Inter-University Web Hackathon 2025',
        category: 'Competition',
        issuer: 'State Higher Education Tech Council',
        date: '2025-09-14',
        description: 'Developed an automated cloud ledger for university resource allocations.',
        fileName: 'hackathon_winner_cert.pdf',
        size: '220 KB',
        dataUrl: 'sample_ach',
      },
      {
        id: 'ach_std_2',
        title: 'Full Stack Web Development Internship Completion',
        category: 'Internship',
        issuer: 'Infosys Springboard',
        date: '2025-06-30',
        description: 'Completed 12-week intensive industry internship in enterprise TypeScript systems.',
        fileName: 'internship_completion_certificate.pdf',
        size: '185 KB',
        dataUrl: 'sample_ach',
      },
    ];
  };

  const [achievements, setAchievements] = useState<AchievementItem[]>(() => {
    try {
      const raw = localStorage.getItem(achievementsKey);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('Could not read achievements', err);
    }
    return getInitialAchievements(effectiveRole);
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(achievementsKey);
      if (raw) {
        setAchievements(JSON.parse(raw));
      } else {
        setAchievements(getInitialAchievements(effectiveRole));
      }
    } catch (err) {
      setAchievements(getInitialAchievements(effectiveRole));
    }
  }, [effectiveRole, achievementsKey]);

  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achCategory, setAchCategory] = useState(
    effectiveRole === 'faculty' ? 'Research Grant' :
    effectiveRole === 'dean' ? 'Statutory Accreditation' :
    effectiveRole === 'administrator' ? 'E-Governance Award' : 'Competition'
  );
  const [achIssuer, setAchIssuer] = useState('');
  const [achDate, setAchDate] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achFileData, setAchFileData] = useState<{ dataUrl: string; name: string; size: string } | null>(null);

  const achFileRef = useRef<HTMLInputElement>(null);

  // Authentic Personal Info Defaults per role
  const getDefaultPersonalInfo = (targetRole: string, currentProfile: any) => {
    const profileName = currentProfile?.full_name || '';
    if (targetRole === 'faculty') {
      return {
        fullName: profileName || 'Dr. Priya Nambiar',
        phone: currentProfile?.phone || '+91 98765 12345',
        dob: '1985-08-22',
        gender: 'Female',
        bloodGroup: 'B+ Positive',
        category: 'Faculty / General',
        fatherName: 'Dr. K. Nambiar',
        motherName: 'S. Nambiar',
        emergencyPhone: '+91 98450 11223',
        permanentAddress: 'House 42, Green Glen Layout, Bellandur, Bengaluru, KA - 560103',
        currentAddress: 'Quarter C-14, Professor Colony, North Campus, University Enclave',
      };
    }
    if (targetRole === 'dean') {
      return {
        fullName: profileName || 'Prof. K. R. Ramanathan',
        phone: currentProfile?.phone || '+91 98765 99999',
        dob: '1968-11-05',
        gender: 'Male',
        bloodGroup: 'A+ Positive',
        category: 'Senior Cadre / Executive',
        fatherName: 'Late Justice V. Ramanathan',
        motherName: 'K. Ramanathan',
        emergencyPhone: '+91 98765 99999',
        permanentAddress: 'Heritage Manor, 14 Sterling Road, Nungambakkam, Chennai, TN - 600034',
        currentAddress: 'Bungalow 3, Vice-Chancellor & Dean Enclave, University North Campus',
      };
    }
    if (targetRole === 'administrator') {
      return {
        fullName: profileName || 'System Administrator',
        phone: currentProfile?.phone || '+91 98765 00001',
        dob: '1982-03-19',
        gender: 'Male',
        bloodGroup: 'O+ Positive',
        category: 'Central Administration / Cadre A',
        fatherName: 'Anand Verma',
        motherName: 'Pushpa Verma',
        emergencyPhone: '+91 98110 33445',
        permanentAddress: 'Sector 14, Vikas Nagar, New Delhi - 110078',
        currentAddress: 'Officers Enclave, Central Secretariat Building, University Campus',
      };
    }
    return {
      fullName: profileName || 'Aditya Sharma',
      phone: currentProfile?.phone || '+91 98765 43210',
      dob: '2002-04-14',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      category: 'General / Unreserved',
      fatherName: 'Ramesh Sharma',
      motherName: 'Sunita Sharma',
      emergencyPhone: '+91 98410 99881',
      permanentAddress: 'Flat 402, Royal Palms Residency, Civil Lines, Kanpur, UP - 208001',
      currentAddress: 'Room 214, Block-B, University Boys Hostel, Campus North',
    };
  };

  const personalStorageKey = `ueams_personal_${effectiveRole}_${user?.id || 'default'}`;
  const initialPersonal = (() => {
    try {
      const raw = localStorage.getItem(personalStorageKey);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('Could not read personal info', err);
    }
    return getDefaultPersonalInfo(effectiveRole, profile);
  })();

  const [fullName, setFullName] = useState(initialPersonal.fullName);
  const [phone, setPhone] = useState(initialPersonal.phone);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [dob, setDob] = useState(initialPersonal.dob);
  const [gender, setGender] = useState(initialPersonal.gender);
  const [bloodGroup, setBloodGroup] = useState(initialPersonal.bloodGroup);
  const [category, setCategory] = useState(initialPersonal.category);
  const [fatherName, setFatherName] = useState(initialPersonal.fatherName);
  const [motherName, setMotherName] = useState(initialPersonal.motherName);
  const [emergencyPhone, setEmergencyPhone] = useState(initialPersonal.emergencyPhone);
  const [permanentAddress, setPermanentAddress] = useState(initialPersonal.permanentAddress);
  const [currentAddress, setCurrentAddress] = useState(initialPersonal.currentAddress);

  // Sync personal fields when effectiveRole changes
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(personalStorageKey);
      const data = raw ? JSON.parse(raw) : getDefaultPersonalInfo(effectiveRole, profile);
      setFullName(profile?.full_name || data.fullName);
      setPhone(profile?.phone || data.phone);
      setDob(data.dob);
      setGender(data.gender);
      setBloodGroup(data.bloodGroup);
      setCategory(data.category);
      setFatherName(data.fatherName);
      setMotherName(data.motherName);
      setEmergencyPhone(data.emergencyPhone);
      setPermanentAddress(data.permanentAddress);
      setCurrentAddress(data.currentAddress);
    } catch (err) {
      console.warn('Error syncing personal state', err);
    }
  }, [effectiveRole, profile?.full_name, profile?.phone, personalStorageKey]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleAchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAchFileData({
        dataUrl: ev.target?.result as string,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddAchievement = () => {
    if (!achTitle.trim() || !achIssuer.trim() || !achDate) return;
    const newAch: AchievementItem = {
      id: Date.now().toString(),
      title: achTitle,
      category: achCategory,
      issuer: achIssuer,
      date: achDate,
      description: achDesc,
      dataUrl: achFileData?.dataUrl,
      fileName: achFileData?.name,
      size: achFileData?.size,
    };
    const updated = [newAch, ...achievements];
    setAchievements(updated);
    try {
      localStorage.setItem(achievementsKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist achievement', err);
    }
    setAchTitle('');
    setAchCategory(
      effectiveRole === 'faculty' ? 'Research Grant' :
      effectiveRole === 'dean' ? 'Statutory Accreditation' :
      effectiveRole === 'administrator' ? 'E-Governance Award' : 'Competition'
    );
    setAchIssuer('');
    setAchDate('');
    setAchDesc('');
    setAchFileData(null);
    setIsAddAchievementOpen(false);
  };

  const handleDownloadAchievement = (ach: AchievementItem) => {
    if (ach.fileName) {
      const a = document.createElement('a');
      if (ach.dataUrl && ach.dataUrl !== 'sample_ach') {
        a.href = ach.dataUrl;
      } else {
        const dummyContent = `ACADEMIC HONOUR & MERIT CREDENTIAL\n=================================\nTitle: ${ach.title}\nCategory: ${ach.category}\nConferred By: ${ach.issuer}\nDate: ${ach.date}\nDescription: ${ach.description || 'Verified official institutional merit portfolio.'}`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        a.href = URL.createObjectURL(blob);
      }
      a.download = ach.fileName;
      a.click();
    } else {
      alert('No certificate file attached to this achievement.');
    }
  };

  // Profile saving state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password changing state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image file size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      setProfileError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);

    try {
      localStorage.setItem(personalStorageKey, JSON.stringify({
        fullName,
        phone,
        avatarUrl,
        dob,
        gender,
        bloodGroup,
        category,
        fatherName,
        motherName,
        emergencyPhone,
        permanentAddress,
        currentAddress,
      }));
    } catch (err) {
      console.warn('Could not persist personal details to localStorage', err);
    }

    const { error } = await updateProfileData({
      fullName,
      phone,
      avatarUrl: avatarUrl || undefined,
    });

    setProfileSaving(false);
    if (error) {
      setProfileError(error.message || 'Failed to update profile details.');
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasNumber || !hasSpecial) {
      setPasswordError('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    const { error } = await updatePassword(newPassword);
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message || 'Failed to change password.');
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading user dossier...
      </div>
    );
  }

  const userMeta = user?.user_metadata || {};
  const studentRoll = userMeta.roll_number || '2025-MCA-042';
  const studentEnrollment = userMeta.enrollment_number || 'ENR-2025-MCA-001';
  const facultyEmpId = userMeta.employee_id || 'FAC-CSE-2024-018';
  const facultyDesig = userMeta.designation || 'Assistant Professor (Senior Scale)';
  const facultyDept = 'Department of Computer Science & Engineering';
  const deanOfficerId = userMeta.employee_id || 'DEAN-ACA-2023-01';
  const deanSchool = 'School of Computing, Engineering & Data Sciences';
  const adminEmpId = userMeta.employee_id || 'ADM-COE-2024-04';
  const adminDivision = 'Directorate of Central Examinations & Academic ERP';
  const departmentName = 'Department of Computer Science & Engineering';
  const programName = 'Master of Computer Applications (MCA)';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl overflow-hidden bg-slate-100 border-2 border-blue-200 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-[#0F2747] shadow-sm">
              {avatarUrl || profile.avatar_url ? (
                <img
                  src={avatarUrl || profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0F2747]">{profile.full_name}</h1>
                <span className="badge-3d text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border border-blue-200">
                  {effectiveRole}
                </span>
                {effectiveRole === 'faculty' && (
                  <span className="badge-3d text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Tenured University Faculty
                  </span>
                )}
                {effectiveRole === 'dean' && (
                  <span className="badge-3d text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    Statutory Executive Officer
                  </span>
                )}
                {effectiveRole === 'administrator' && (
                  <span className="badge-3d text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                    Controller of Examinations
                  </span>
                )}
                {effectiveRole === 'student' && (
                  <span className="badge-3d text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Matriculated Regular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{profile.email}</p>

              {/* Role-specific identity line */}
              {effectiveRole === 'faculty' && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                  <span>Emp ID: <strong className="font-mono text-[#0F2747]">{facultyEmpId}</strong></span>
                  <span>&bull;</span>
                  <span>Post: <strong className="text-[#0F2747]">{facultyDesig}</strong></span>
                  <span>&bull;</span>
                  <span>Dept: <strong className="text-[#0F2747]">CSE</strong></span>
                </div>
              )}
              {effectiveRole === 'dean' && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                  <span>Officer ID: <strong className="font-mono text-[#0F2747]">{deanOfficerId}</strong></span>
                  <span>&bull;</span>
                  <span>Office: <strong className="text-[#0F2747]">Dean of Academic Affairs</strong></span>
                  <span>&bull;</span>
                  <span>Standing: <strong className="text-[#0F2747]">Senate Chair</strong></span>
                </div>
              )}
              {effectiveRole === 'administrator' && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                  <span>Admin ID: <strong className="font-mono text-[#0F2747]">{adminEmpId}</strong></span>
                  <span>&bull;</span>
                  <span>Directorate: <strong className="text-[#0F2747]">Central Examinations &amp; ERP</strong></span>
                  <span>&bull;</span>
                  <span>Privilege: <strong className="text-[#0F2747]">Security Level 5</strong></span>
                </div>
              )}
              {effectiveRole === 'student' && (
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                  <span>Roll: <strong className="font-mono text-[#0F2747]">{studentRoll}</strong></span>
                  <span>&bull;</span>
                  <span>Enr ID: <strong className="font-mono text-[#0F2747]">{studentEnrollment}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
            <p>University UID: <span className="font-mono text-slate-700 font-bold">{profile.id.slice(0, 16)}...</span></p>
            {effectiveRole === 'faculty' && (
              <>
                <p>Appointment Session: <span className="text-slate-700 font-semibold">July 2024 (AY 2024-25)</span></p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>UGC / AICTE Approved Faculty</span>
                </div>
              </>
            )}
            {effectiveRole === 'dean' && (
              <>
                <p>Statutory Term: <span className="text-slate-700 font-semibold">2023 – 2026 (Triennial Term)</span></p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-amber-700 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chief Academic Authority &bull; Signatory</span>
                </div>
              </>
            )}
            {effectiveRole === 'administrator' && (
              <>
                <p>Service Cadre: <span className="text-slate-700 font-semibold">Permanent Administration</span></p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-purple-700 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Certified Systems Controller &amp; Custodian</span>
                </div>
              </>
            )}
            {effectiveRole === 'student' && (
              <>
                <p>Admitted Term: <span className="text-slate-700 font-semibold">July 2025 (AY 2025-26)</span></p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Institutional Scholar</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dossier Tabs Navigation */}
      <div className="card-3d bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'academic'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {effectiveRole === 'faculty' && <Briefcase className="w-3.5 h-3.5" />}
            {effectiveRole === 'dean' && <Shield className="w-3.5 h-3.5" />}
            {effectiveRole === 'administrator' && <ShieldCheck className="w-3.5 h-3.5" />}
            {effectiveRole === 'student' && <GraduationCap className="w-3.5 h-3.5" />}
            <span>
              {effectiveRole === 'faculty' && 'Faculty Dossier & Service Record'}
              {effectiveRole === 'dean' && 'Executive Governance Dossier'}
              {effectiveRole === 'administrator' && 'Administrative & System Dossier'}
              {effectiveRole === 'student' && 'Academic Standing & Curriculum'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Document Locker</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              {effectiveRole === 'faculty' && 'Research & Grants'}
              {effectiveRole === 'dean' && 'Senate Accreditations'}
              {effectiveRole === 'administrator' && 'Governance Awards'}
              {effectiveRole === 'student' && 'Achievements'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('id_card')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'id_card'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              {effectiveRole === 'faculty' && 'Faculty Smart ID Card'}
              {effectiveRole === 'dean' && 'Executive Senate ID Card'}
              {effectiveRole === 'administrator' && 'Controller Official ID Card'}
              {effectiveRole === 'student' && 'Digital Smart ID Card'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#1E5AA8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security &amp; Password</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: PERSONAL INFORMATION ── */}
      {activeTab === 'personal' && (
        <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Personal &amp; Guardian Profile</h2>
              <p className="text-xs text-slate-500">Official candidate identification and contact records</p>
            </div>
            {profileSaved && (
              <span className="badge-3d text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes Persisted
              </span>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {profileError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Profile Photo Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-slate-300 flex items-center justify-center text-xl font-bold text-[#0F2747] shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  fullName.charAt(0) || 'S'
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="btn-3d-secondary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    <span>Upload Passport Photograph</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Affixed directly to your University Smart ID Card, Admit Cards, and Official Transcripts.
                </p>
              </div>
            </div>

            {/* Candidate Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] font-semibold focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Quota</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>
            </div>

            {/* Parent & Emergency Contact */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <span className="text-xs font-bold text-[#0F2747] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-600" />
                <span>
                  {effectiveRole === 'student' ? 'Parent / Guardian & Emergency Information' : 'Family / Next of Kin & Emergency Contact'}
                </span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {effectiveRole === 'student' ? 'Father / Guardian Name' : 'Father / Spouse Name'}
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {effectiveRole === 'student' ? 'Mother Name' : 'Mother / Kin Name'}
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#0F2747]"
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Permanent Home Address</span>
                </label>
                <textarea
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {effectiveRole === 'student' ? 'Current Campus / Local Residence' : 'Official Campus Residence / Staff Quarters'}
                  </span>
                </label>
                <textarea
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-3d-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'Saving...' : 'Save Dossier Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: ROLE-BASED ACADEMIC & INSTITUTIONAL DOSSIER ── */}
      {activeTab === 'academic' && (
        <div className="space-y-4">

          {/* FACULTY DOSSIER VIEW */}
          {effectiveRole === 'faculty' && (
            <>
              <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#1E5AA8]" />
                      <span>Faculty Academic &amp; Service Dossier</span>
                    </h2>
                    <p className="text-xs text-slate-500">Official faculty appointment credentials, academic qualifications, and teaching portfolio</p>
                  </div>
                  <span className="badge-3d text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    API Score 385 &bull; Grade A+ Faculty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'University Employee ID', value: facultyEmpId, mono: true, icon: '🪪' },
                    { label: 'Academic Designation', value: facultyDesig, mono: false, icon: '👨‍🏫' },
                    { label: 'Teaching Department', value: facultyDept, mono: false, icon: '🏛️' },
                    { label: 'Highest Academic Qualification', value: 'Ph.D. in Computer Science & AI (IIT Delhi)', mono: false, icon: '🎓' },
                    { label: 'Research Specialization', value: 'Distributed Systems, Cloud Architecture & Machine Learning', mono: false, icon: '🔬' },
                    { label: 'Cumulative Teaching Experience', value: '7.5 Years (4.5 Yrs University + 3 Yrs Industry R&D)', mono: false, icon: '⏳' },
                    { label: 'Active Teaching Load', value: '14 Contact Hours / Week (Theory: 8h, Labs: 6h)', mono: false, icon: '📅' },
                    { label: 'Assigned Mentorship Cohort', value: 'MCA Batch 2025-27 (Cohort Lead - 42 Scholars)', mono: false, icon: '👥' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-base shrink-0 mt-0.5">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                        <p className={`text-xs font-bold text-[#0F2747] mt-0.5 break-words ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Performance Metric Cards */}
              <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Teaching &amp; Research Performance Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teaching API Score</p>
                    <p className="text-3xl font-extrabold text-[#0F2747] font-mono mt-1">385</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Exceeds UGC CAS Norms</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Research Publications</p>
                    <p className="text-3xl font-extrabold text-[#1E5AA8] font-mono mt-1">14</p>
                    <p className="text-[10px] text-[#1E5AA8] font-semibold mt-0.5">h-index: 6 &bull; 2 Patents</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mentorship Cohort</p>
                    <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">42</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">98.4% Cumulative Attendance</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                  <span>Explore related modules:</span>
                  <Link to="/faculty/subjects" className="text-[#1E5AA8] font-semibold hover:underline">Assigned Teaching Subjects</Link>
                  <span>&bull;</span>
                  <Link to="/faculty/timetable" className="text-[#1E5AA8] font-semibold hover:underline">Teaching Lecture Schedule</Link>
                  <span>&bull;</span>
                  <Link to="/faculty/mentorship" className="text-[#1E5AA8] font-semibold hover:underline">Class Mentorship Cohort</Link>
                </div>
              </div>
            </>
          )}

          {/* DEAN DOSSIER VIEW */}
          {effectiveRole === 'dean' && (
            <>
              <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600" />
                      <span>Executive Governance &amp; Senate Dossier</span>
                    </h2>
                    <p className="text-xs text-slate-500">Official executive appointment, statutory powers, and academic governance portfolio</p>
                  </div>
                  <span className="badge-3d text-xs bg-amber-50 text-amber-800 border-amber-200 font-bold">
                    Senate Chair &bull; Chief Academic Officer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Executive Officer ID', value: deanOfficerId, mono: true, icon: '🏛️' },
                    { label: 'Governance Portfolio', value: 'Dean, Academic Affairs & Faculty Senate Chairperson', mono: false, icon: '📜' },
                    { label: 'Statutory School / Faculty', value: deanSchool, mono: false, icon: '🏢' },
                    { label: 'Academic Cadre', value: 'Senior Professor & Emeritus Academic Fellow (CAS Level 15)', mono: false, icon: '🎖️' },
                    { label: 'Highest Academic Qualification', value: 'Ph.D., Post-Doctoral Fellow (Carnegie Mellon / IISc)', mono: false, icon: '🎓' },
                    { label: 'Statutory Administrative Term', value: '2023 – 2026 (Triennial Decree by Chancellor)', mono: false, icon: '📅' },
                    { label: 'Governance Jurisdiction', value: '18 Academic Departments • 142 Degree Programs', mono: false, icon: '🌐' },
                    { label: 'Statutory Authority', value: 'Autonomous Approval of Curriculum, Exam Regulations & Clearances', mono: false, icon: '✍️' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-base shrink-0 mt-0.5">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                        <p className={`text-xs font-bold text-[#0F2747] mt-0.5 break-words ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dean Governance Metric Cards */}
              <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Institutional Governance &amp; Council Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Programs Governed</p>
                    <p className="text-3xl font-extrabold text-[#0F2747] font-mono mt-1">142</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% NAAC A++ Aligned</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Oversight</p>
                    <p className="text-3xl font-extrabold text-amber-700 font-mono mt-1">320+</p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-0.5">All Departments Verified</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clearances Endorsed</p>
                    <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">4,850+</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">AY 2025-26 Term</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                  <span>Executive desks:</span>
                  <Link to="/dean/scholarships" className="text-[#1E5AA8] font-semibold hover:underline">Scholarship Sanctions Desk</Link>
                  <span>&bull;</span>
                  <Link to="/dean/timetables" className="text-[#1E5AA8] font-semibold hover:underline">Master Timetable Governance</Link>
                  <span>&bull;</span>
                  <Link to="/dean/exam-approvals" className="text-[#1E5AA8] font-semibold hover:underline">Exam Schedule Approvals</Link>
                </div>
              </div>
            </>
          )}

          {/* ADMINISTRATOR DOSSIER VIEW */}
          {effectiveRole === 'administrator' && (
            <>
              <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>Administrative &amp; Regulatory Service Dossier</span>
                    </h2>
                    <p className="text-xs text-slate-500">Official administration credentials, security privilege tier, and statutory audit records</p>
                  </div>
                  <span className="badge-3d text-xs bg-purple-50 text-purple-700 border-purple-200 font-bold">
                    Security Clearance Level 5 &bull; Systems Controller
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Admin Cadre ID', value: adminEmpId, mono: true, icon: '🪪' },
                    { label: 'Administrative Post', value: 'Controller of Examinations & Systems Director', mono: false, icon: '🖥️' },
                    { label: 'Directorate / Division', value: adminDivision, mono: false, icon: '🏢' },
                    { label: 'Security Privilege Tier', value: 'Level 5 Root Privileges (Cryptographic Authority)', mono: false, icon: '🔐' },
                    { label: 'Highest Academic Qualification', value: 'M.Tech (Software Systems) & CISA Certified', mono: false, icon: '🎓' },
                    { label: 'Administrative Experience', value: '12 Years Central University Administration', mono: false, icon: '⏳' },
                    { label: 'Critical Systems Governed', value: 'Examination ERP, RLS Database, Identity & Result Vault', mono: false, icon: '🗄️' },
                    { label: 'Regulatory Audit Compliance', value: 'ISO 27001 & UGC Exam Guidelines 2025 Compliant', mono: false, icon: '✅' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-base shrink-0 mt-0.5">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                        <p className={`text-xs font-bold text-[#0F2747] mt-0.5 break-words ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin SLA & Systems Metric Cards */}
              <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  System Reliability &amp; Operational Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active System Uptime</p>
                    <p className="text-3xl font-extrabold text-[#0F2747] font-mono mt-1">99.98%</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Zero Unscheduled Downtime</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Sessions Managed</p>
                    <p className="text-3xl font-extrabold text-purple-700 font-mono mt-1">48</p>
                    <p className="text-[10px] text-purple-700 font-semibold mt-0.5">120,000+ Candidates Handled</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Audits</p>
                    <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">0</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Zero Vulnerabilities (AY 2025-26)</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                  <span>Controller operations:</span>
                  <Link to="/admin/exams" className="text-[#1E5AA8] font-semibold hover:underline">Exam Cycles &amp; Master Timetable</Link>
                  <span>&bull;</span>
                  <Link to="/admin/marks-verify" className="text-[#1E5AA8] font-semibold hover:underline">Marks Verification Desk</Link>
                  <span>&bull;</span>
                  <Link to="/admin/audit" className="text-[#1E5AA8] font-semibold hover:underline">System Audit Ledger</Link>
                </div>
              </div>
            </>
          )}

          {/* STUDENT DOSSIER VIEW */}
          {effectiveRole === 'student' && (
            <>
              <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#1E5AA8]" />
                      <span>Academic Identity &amp; Programme Details</span>
                    </h2>
                    <p className="text-xs text-slate-500">Your official matriculation record and current academic standing</p>
                  </div>
                  <span className="badge-3d text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    CGPA 8.92 &bull; Distinction
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'University Roll Number', value: studentRoll, mono: true, icon: '🎓' },
                    { label: 'Enrollment ID', value: studentEnrollment, mono: true, icon: '🪪' },
                    { label: 'Degree Programme', value: programName, mono: false, icon: '📘' },
                    { label: 'Department', value: departmentName, mono: false, icon: '🏛️' },
                    { label: 'Active Semester', value: 'Semester 2 — Even Term 2025-26', mono: false, icon: '📅' },
                    { label: 'Academic Session', value: 'AY 2025 – 2026', mono: false, icon: '🗓️' },
                    { label: 'Admission Category', value: category || 'General / Unreserved', mono: false, icon: '📋' },
                    { label: 'Admission Year', value: 'July 2025', mono: false, icon: '📌' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-base shrink-0 mt-0.5">{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</p>
                        <p className={`text-xs font-bold text-[#0F2747] mt-0.5 break-words ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Performance Summary */}
              <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Performance Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</p>
                    <p className="text-3xl font-extrabold text-[#0F2747] font-mono mt-1">8.92</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Top 5% of Cohort</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current SGPA</p>
                    <p className="text-3xl font-extrabold text-[#1E5AA8] font-mono mt-1">9.10</p>
                    <p className="text-[10px] text-[#1E5AA8] font-semibold mt-0.5">Semester 2</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Backlogs</p>
                    <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">0</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">All Clear</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  For subject-wise grades and transcripts, visit the
                  <Link to="/student/results" className="text-[#1E5AA8] font-semibold hover:underline ml-1">Results &amp; Grade Card</Link> page.
                </p>
              </div>
            </>
          )}

        </div>
      )}

      {/* ── TAB 3: OFFICIAL DOCUMENT LOCKER ── */}
      {activeTab === 'documents' && (() => {
        const uploadedCount = docSlots.filter(s => s.dataUrl).length;
        const requiredTotal = docSlots.filter(s => s.required).length;
        const requiredDone = docSlots.filter(s => s.required && s.dataUrl).length;
        const categoryColors: Record<string, string> = {
          'Education': 'bg-blue-50 text-blue-700 border-blue-200',
          'Identity': 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'Affidavit': 'bg-amber-50 text-amber-700 border-amber-200',
          'Scholarship': 'bg-purple-50 text-purple-700 border-purple-200',
          'Academic': 'bg-indigo-50 text-indigo-700 border-indigo-200',
          'Eligibility': 'bg-teal-50 text-teal-700 border-teal-200',
          'Employment': 'bg-blue-50 text-blue-700 border-blue-200',
          'Service': 'bg-sky-50 text-sky-700 border-sky-200',
          'Compliance': 'bg-amber-50 text-amber-700 border-amber-200',
          'Finance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'Research': 'bg-purple-50 text-purple-700 border-purple-200',
          'Executive': 'bg-rose-50 text-rose-700 border-rose-200',
          'Governance': 'bg-cyan-50 text-cyan-700 border-cyan-200',
          'Vigilance': 'bg-red-50 text-red-700 border-red-200',
          'Technical': 'bg-violet-50 text-violet-700 border-violet-200',
          'Other': 'bg-slate-50 text-slate-700 border-slate-200',
        };
        const uniqueCategories: string[] = Array.from(new Set<string>(docSlots.map(s => s.category)));

        return (
        <div className="space-y-5">

          {/* Header + progress */}
          <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1E5AA8]" />
                  Official Document Locker &bull; {effectiveRole.toUpperCase()} ARCHIVE
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {effectiveRole === 'faculty' && 'Upload university appointment orders, UGC-NET/GATE qualifications, Ph.D. credentials, and service records in designated slots.'}
                  {effectiveRole === 'dean' && 'Upload statutory executive notifications, doctoral credentials, university service book, and digital seal specimens.'}
                  {effectiveRole === 'administrator' && 'Upload controller appointment orders, data security NDAs, enterprise IT certifications, and administrative credentials.'}
                  {effectiveRole === 'student' && 'Upload standard verified matriculation records, eligibility certificates, and affidavits in designated slots.'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(true)}
                  className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Upload Extra Document
                </button>
                <div className="text-right pl-3 border-l border-slate-200">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completion</p>
                  <p className="text-2xl font-bold text-[#0F2747]">{uploadedCount}<span className="text-sm text-slate-400">/{docSlots.length}</span></p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-600">Mandatory credentials: {requiredDone} / {requiredTotal} uploaded</span>
                <span className={requiredDone === requiredTotal ? 'text-emerald-600' : 'text-amber-600'}>
                  {requiredDone === requiredTotal ? '✓ All mandatory documents uploaded' : `${requiredTotal - requiredDone} pending uploads`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(requiredDone / (requiredTotal || 1)) * 100}%`,
                    background: requiredDone === requiredTotal ? '#16a34a' : '#f59e0b'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Add Extra Document Modal */}
          {isAddDocOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
                <div className="bg-[#0F2747] text-white p-4 flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Upload Additional Document
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setIsAddDocOpen(false); setExtraDocFile(null); }}
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Document Name / Title *</label>
                    <input
                      type="text"
                      value={extraDocTitle}
                      onChange={e => setExtraDocTitle(e.target.value)}
                      placeholder="e.g. Relieving Letter, NOC, Grant Award, Passport Copy"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                    <select
                      value={extraDocCategory}
                      onChange={e => setExtraDocCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                    >
                      <option value="Academic">Academic &amp; Qualifications</option>
                      <option value="Identity">Identity &amp; Civil Documents</option>
                      <option value="Employment">Employment &amp; Service Orders</option>
                      <option value="Compliance">Compliance &amp; Ethics Undertakings</option>
                      <option value="Finance">Financial &amp; Payroll Records</option>
                      <option value="Research">Research Papers &amp; Patents</option>
                      <option value="Executive">Executive &amp; Governance Decrees</option>
                      <option value="Technical">Technical &amp; IT Certifications</option>
                      <option value="Education">Education &amp; Marksheets</option>
                      <option value="Affidavit">Affidavit &amp; Undertaking</option>
                      <option value="Scholarship">Scholarship &amp; Grants</option>
                      <option value="Other">Other Certificate / Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF or Image) *</label>
                    <input
                      type="file"
                      ref={extraFileInputRef}
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      onChange={handleExtraDocFileSelect}
                      className="hidden"
                    />
                    <div
                      onClick={() => extraFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#1E5AA8] rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      {extraDocFile ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-semibold">{extraDocFile.name}</span>
                          <span className="text-[10px] text-slate-400">({extraDocFile.size})</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-[#0F2747]">Click to select document</p>
                          <p className="text-[10px] text-slate-400">Supports PDF, JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsAddDocOpen(false); setExtraDocFile(null); }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!extraDocTitle.trim() || !extraDocFile}
                      onClick={handleSaveExtraDoc}
                      className="btn-3d-gold px-5 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Save Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom / Additional Uploaded Documents */}
          {extraDocs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Additional Uploaded Documents ({extraDocs.length})
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extraDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border bg-emerald-50/40 border-emerald-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-100 border-emerald-300 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-[#0F2747] leading-tight">{doc.title}</h4>
                          <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{doc.category}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[150px]">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-400">{doc.size}</span>
                          <span className="text-[10px] text-slate-400">&bull; {doc.uploadedAt}</span>
                          <div className="flex gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => handleDownloadExtraDoc(doc)}
                              className="flex items-center gap-1 text-[10px] font-bold text-[#1E5AA8] hover:underline cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraDoc(doc.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document slots grouped dynamically by category */}
          {uniqueCategories.map(cat => {
            const catSlots = docSlots.filter(s => s.category === cat);
            if (catSlots.length === 0) return null;
            const badgeClass = categoryColors[cat] || categoryColors['Other'];
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`}>
                    {cat} Credentials
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400">{catSlots.filter(s => s.dataUrl).length}/{catSlots.length} uploaded</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-xl border transition-all ${
                        slot.dataUrl
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : slot.required
                          ? 'bg-white border-slate-200 hover:border-amber-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 border-dashed'
                      }`}
                    >
                      {/* Hidden per-slot file input */}
                      <input
                        type="file"
                        accept={slot.accepts}
                        ref={el => { slotFileRefs.current[slot.id] = el; }}
                        onChange={e => handleSlotUpload(slot.id, e)}
                        className="hidden"
                      />

                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          slot.dataUrl
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                            : slot.required
                            ? 'bg-amber-50 border-amber-200 text-amber-500'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          {slot.dataUrl
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <FileText className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-[#0F2747] leading-tight">{slot.label}</h4>
                            {slot.required
                              ? <span className="text-[9px] font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">Required</span>
                              : <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">Optional</span>
                            }
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{slot.description}</p>

                          {slot.dataUrl ? (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[150px]">{slot.fileName}</span>
                              <span className="text-[10px] text-slate-400">{slot.size}</span>
                              <span className="text-[10px] text-slate-400">&bull; {slot.uploadedAt}</span>
                              <div className="flex gap-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSlotDownload(slot)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-[#1E5AA8] hover:underline cursor-pointer"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSlotRemove(slot.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => slotFileRefs.current[slot.id]?.click()}
                              className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                slot.required
                                  ? 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
                                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Upload className="w-3 h-3" />
                              Upload {slot.accepts.includes('pdf') ? 'PDF / Image' : 'Image'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
        );
      })()}

      {/* ── TAB: ACHIEVEMENTS ── */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Achievements &amp; Extracurricular Portfolio</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload certificates for competitions, internships, workshops, events &amp; more
                </p>
              </div>
              <button
                onClick={() => setIsAddAchievementOpen(true)}
                className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Achievement
              </button>
            </div>
          </div>

          {/* Add Achievement Modal */}
          {isAddAchievementOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
                <div className="bg-[#0F2747] text-white p-4 flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Add New Achievement
                  </h3>
                  <button onClick={() => setIsAddAchievementOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Achievement Title *</label>
                      <input
                        type="text"
                        value={achTitle}
                        onChange={e => setAchTitle(e.target.value)}
                        placeholder="e.g. 1st Place - Hackathon"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                      <select
                        value={achCategory}
                        onChange={e => setAchCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                      >
                        <option>Competition</option>
                        <option>Internship</option>
                        <option>Workshop / Seminar</option>
                        <option>Certification</option>
                        <option>Sports</option>
                        <option>Cultural Event</option>
                        <option>Research / Paper</option>
                        <option>Volunteer / NSS</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Issued by / Organizer *</label>
                      <input
                        type="text"
                        value={achIssuer}
                        onChange={e => setAchIssuer(e.target.value)}
                        placeholder="e.g. IIT Delhi, Google, etc."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={achDate}
                        onChange={e => setAchDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description (optional)</label>
                    <textarea
                      value={achDesc}
                      onChange={e => setAchDesc(e.target.value)}
                      rows={2}
                      placeholder="Briefly describe your achievement..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1E5AA8] resize-none"
                    />
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Certificate / Proof</label>
                    <input
                      ref={achFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleAchFileSelect}
                      className="hidden"
                    />
                    {achFileData ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-800">{achFileData.name}</p>
                            <p className="text-[10px] text-emerald-600">{achFileData.size}</p>
                          </div>
                        </div>
                        <button onClick={() => setAchFileData(null)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => achFileRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center gap-2 text-slate-500 hover:border-[#1E5AA8] hover:text-[#1E5AA8] transition cursor-pointer"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-medium">Click to upload certificate (PDF, JPG, PNG)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsAddAchievementOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAchievement}
                      disabled={!achTitle.trim() || !achIssuer.trim() || !achDate}
                      className="btn-3d-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Achievement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements List */}
          {achievements.length === 0 ? (
            <div className="card-3d bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-[#0F2747] mb-1">No achievements added yet</h3>
              <p className="text-xs text-slate-500 mb-4">Upload your competition wins, internship certificates, workshop completions and more.</p>
              <button
                onClick={() => setIsAddAchievementOpen(true)}
                className="btn-3d-gold px-5 py-2 text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add First Achievement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((ach) => {
                const categoryColors: Record<string, string> = {
                  'Competition': 'bg-amber-50 text-amber-700 border-amber-200',
                  'Internship': 'bg-blue-50 text-blue-700 border-blue-200',
                  'Workshop / Seminar': 'bg-purple-50 text-purple-700 border-purple-200',
                  'Certification': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Sports': 'bg-orange-50 text-orange-700 border-orange-200',
                  'Cultural Event': 'bg-pink-50 text-pink-700 border-pink-200',
                  'Research / Paper': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  'Volunteer / NSS': 'bg-teal-50 text-teal-700 border-teal-200',
                };
                const colorClass = categoryColors[ach.category] || 'bg-slate-50 text-slate-700 border-slate-200';
                return (
                  <div key={ach.id} className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 hover:border-amber-300 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F2747] leading-tight">{ach.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{ach.issuer}</p>
                        </div>
                      </div>
                      <span className={`badge-3d text-[9px] font-bold shrink-0 ${colorClass}`}>
                        {ach.category}
                      </span>
                    </div>

                    {ach.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        {new Date(ach.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => handleDownloadAchievement(ach)}
                        className={`flex items-center gap-1 font-bold cursor-pointer ${
                          ach.dataUrl ? 'text-[#1E5AA8] hover:underline' : 'text-slate-400 cursor-default'
                        }`}
                        title={ach.dataUrl ? 'Download certificate' : 'No file uploaded'}
                      >
                        <Download className="w-3 h-3" />
                        {ach.dataUrl ? 'Download Certificate' : 'No file'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DIGITAL SMART STUDENT ID CARD ── */}
      {activeTab === 'id_card' && (
        <div className="space-y-6">
          <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-sm font-bold text-[#0F2747]">Institutional Smart Identity Card</h2>
              <p className="text-xs text-slate-500">Official RFID &amp; Barcode identity instrument for campus &amp; examination halls</p>
            </div>
            <button
              onClick={() => window.print()}
              className="btn-3d-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1E5AA8]" />
              <span>Print Smart ID Card</span>
            </button>
          </div>

          {/* Smart ID Card Preview (Front & Back) */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-6 bg-slate-100 rounded-3xl border border-slate-300">
            {/* ID Card Front */}
            <div className="w-[340px] h-[520px] rounded-3xl bg-white border-2 border-slate-400 shadow-xl overflow-hidden flex flex-col justify-between relative text-slate-800">
              {/* Header Gradient */}
              <div className="bg-[#0A192F] text-white p-4 text-center border-b-2 border-amber-400 relative">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <UniversityCrest size="sm" variant="gold" />
                  <div className="text-left leading-tight">
                    <span className="font-academic-serif font-extrabold text-[12px] tracking-wider block text-white">
                      CENTRAL UNIVERSITY
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-amber-300 font-bold block">
                      {effectiveRole === 'faculty' && 'Faculty of Engineering & Technology'}
                      {effectiveRole === 'dean' && 'Office of the Dean of Academic Affairs'}
                      {effectiveRole === 'administrator' && 'Directorate of Central Examinations & ERP'}
                      {effectiveRole === 'student' && 'Autonomous Statutory Institution'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo & Identity */}
              <div className="p-4 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-3 border-[#1E5AA8] shadow-md bg-slate-100">
                  {avatarUrl || profile.avatar_url ? (
                    <img src={avatarUrl || profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-[#0F2747]">
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-academic-serif text-base font-extrabold text-[#0F2747] tracking-tight">
                    {fullName}
                  </h3>
                  <span className="badge-3d text-[9px] px-2 py-0.5 bg-blue-50 text-[#1E5AA8] border-blue-200 font-bold uppercase">
                    {effectiveRole === 'faculty' && 'Tenured Academic Faculty'}
                    {effectiveRole === 'dean' && 'Dean & Senate Chairperson'}
                    {effectiveRole === 'administrator' && 'Controller of Examinations'}
                    {effectiveRole === 'student' && 'Postgraduate Scholar'}
                  </span>
                </div>

                {/* Academic / Institutional Metadata Grid */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1 text-[11px] mt-2">
                  {effectiveRole === 'faculty' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">EMP ID:</span>
                        <span className="font-mono font-extrabold text-[#0F2747]">{facultyEmpId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">POST:</span>
                        <span className="font-bold text-slate-800">{facultyDesig}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">DEPARTMENT:</span>
                        <span className="font-bold text-slate-800">CSE Dept</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">BLOOD GRP:</span>
                        <span className="font-bold text-rose-700">{bloodGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">VALIDITY:</span>
                        <span className="font-mono font-bold text-emerald-700">2024 &ndash; 2029</span>
                      </div>
                    </>
                  )}
                  {effectiveRole === 'dean' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">OFFICER ID:</span>
                        <span className="font-mono font-extrabold text-[#0F2747]">{deanOfficerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">PORTFOLIO:</span>
                        <span className="font-bold text-slate-800">Dean of Academic Affairs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">SCHOOL:</span>
                        <span className="font-bold text-slate-800">Computing &amp; Data Sciences</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">BLOOD GRP:</span>
                        <span className="font-bold text-rose-700">{bloodGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">VALIDITY:</span>
                        <span className="font-mono font-bold text-emerald-700">2023 &ndash; 2027</span>
                      </div>
                    </>
                  )}
                  {effectiveRole === 'administrator' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">ADMIN ID:</span>
                        <span className="font-mono font-extrabold text-[#0F2747]">{adminEmpId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">CADRE POST:</span>
                        <span className="font-bold text-slate-800">Examination Controller</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">PRIVILEGE:</span>
                        <span className="font-bold text-purple-700">Level 5 Root Privileges</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">BLOOD GRP:</span>
                        <span className="font-bold text-rose-700">{bloodGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">VALIDITY:</span>
                        <span className="font-mono font-bold text-emerald-700">2024 &ndash; 2028</span>
                      </div>
                    </>
                  )}
                  {effectiveRole === 'student' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">ROLL NO:</span>
                        <span className="font-mono font-extrabold text-[#0F2747]">{studentRoll}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">ENROLLMENT:</span>
                        <span className="font-mono font-extrabold text-[#0F2747]">{studentEnrollment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">PROGRAM:</span>
                        <span className="font-bold text-slate-800">MCA (Sem II)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">BLOOD GRP:</span>
                        <span className="font-bold text-rose-700">{bloodGroup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">VALIDITY:</span>
                        <span className="font-mono font-bold text-emerald-700">2025 &ndash; 2027</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ID Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-8 h-8 text-[#0F2747]" />
                  <span className="text-[8px] font-mono text-slate-400 leading-tight">
                    SCAN TO VERIFY<br />IDENTITY
                  </span>
                </div>

                <div className="text-right">
                  <div className="h-6 flex items-end justify-end font-academic-serif text-[9px] font-bold text-[#1E5AA8] uppercase">
                    {effectiveRole === 'faculty' && 'REGISTRAR & CHANCELLOR'}
                    {effectiveRole === 'dean' && 'CHANCELLOR & SENATE'}
                    {effectiveRole === 'administrator' && 'BOARD OF MANAGEMENT'}
                    {effectiveRole === 'student' && 'REGISTRAR \u2022 SEAL'}
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                    {effectiveRole === 'student' ? 'Authorized Signatory' : 'Statutory Executive Signatory'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: SECURITY & PASSWORD ── */}
      {activeTab === 'security' && (
        <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Security &amp; Password Management</h2>
              <p className="text-xs text-[#64748B]">Update portal authentication credentials and security keys</p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8] pl-10 pr-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8] pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-3d-gold px-6 py-2.5 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
