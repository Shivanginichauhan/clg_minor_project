import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Calendar,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Database,
  Trash2,
  FileText,
  HelpCircle,
  Check,
  Building2,
  Clock,
  History,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { examService } from '../../services/examService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import {
  Department,
  Program,
  AcademicSession,
  Semester,
  Subject
} from '../../types/database.types.js';
import { ExamCycleWithDetails } from '../../data/mockExams.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { Link } from 'react-router-dom';
import { adminService, BulkImportLog } from '../../services/adminService.js';

type ImportCategory = 'students' | 'faculty' | 'timetable' | 'history';

interface ParsedRecord {
  id: string;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
}

export const BulkDataImportPage: React.FC = () => {
  const { role, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ImportCategory>('students');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Reference Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examinations, setExaminations] = useState<ExamCycleWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Parsed & Validation State
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Import History & Rollback State
  const [importLogs, setImportLogs] = useState<BulkImportLog[]>([]);
  const [rollbackTarget, setRollbackTarget] = useState<BulkImportLog | null>(null);

  const loadImportHistory = () => {
    setImportLogs(adminService.getImportLogs());
  };

  const handleExecuteRollback = () => {
    if (!rollbackTarget) return;
    const ok = adminService.rollbackImport(
      rollbackTarget.id,
      profile?.full_name || 'System Administrator'
    );
    if (ok) {
      loadImportHistory();
      setRollbackTarget(null);
    }
  };

  // Load Reference Data
  useEffect(() => {
    loadImportHistory();
    const fetchReferences = async () => {
      setLoadingRefs(true);
      try {
        const [depts, progs, sess, sems, subs, exams] = await Promise.all([
          studentFacultyService.getDepartments(),
          studentFacultyService.getPrograms(),
          studentFacultyService.getSessions(),
          studentFacultyService.getSemesters(),
          academicStructureService.getSubjects(),
          examService.getExaminations(),
        ]);

        setDepartments(depts);
        setPrograms(progs);
        setSessions(sess);
        setSemesters(sems);
        setSubjects(subs);
        setExaminations(exams);
        if (exams.length > 0) {
          setSelectedExamId(exams[0].id);
        }
      } catch (err) {
        console.error('Failed to load reference data for import:', err);
      } finally {
        setLoadingRefs(false);
      }
    };

    fetchReferences();
  }, []);

  // Clear data when switching tabs
  const handleTabChange = (cat: ImportCategory) => {
    setActiveCategory(cat);
    setParsedRecords([]);
    setFileName(null);
    setPasteText('');
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // TEMPLATES & SAMPLES GENERATION
  // ----------------------------------------------------
  const templates: Record<
    ImportCategory,
    { filename: string; headers: string[]; sampleRows: string[][] }
  > = {
    students: {
      filename: 'itm_students_import_template.csv',
      headers: [
        'Full Name',
        'Email',
        'Phone',
        'Roll Number',
        'Enrollment Number',
        'Department Code',
        'Program Code',
        'Gender',
        'DOB (YYYY-MM-DD)',
      ],
      sampleRows: [
        ['Aarav Sharma', 'aarav.sharma@itmuniversity.edu', '+91 9876543210', '2026-MCA-001', 'ENR-2026-001', 'CSE', 'MCA', 'Male', '2002-05-14'],
        ['Diya Sengupta', 'diya.sengupta@itmuniversity.edu', '+91 9876543211', '2026-MCA-002', 'ENR-2026-002', 'CSE', 'MCA', 'Female', '2001-11-20'],
        ['Kabir Verma', 'kabir.verma@itmuniversity.edu', '+91 9876543212', '2026-MCA-003', 'ENR-2026-003', 'CSE', 'MCA', 'Male', '2002-08-03'],
        ['Ananya Patel', 'ananya.patel@itmuniversity.edu', '+91 9876543213', '2026-MCA-004', 'ENR-2026-004', 'CSE', 'MCA', 'Female', '2003-01-29'],
      ],
    },
    faculty: {
      filename: 'itm_faculty_import_template.csv',
      headers: [
        'Full Name',
        'Email',
        'Phone',
        'Employee ID',
        'Department Code',
        'Designation',
        'Qualification',
        'Joining Date (YYYY-MM-DD)',
      ],
      sampleRows: [
        ['Dr. Arvind Swaminathan', 'arvind.swami@itmuniversity.edu', '+91 9123456780', 'EMP-CSE-101', 'CSE', 'Professor', 'Ph.D. Computer Science', '2019-07-15'],
        ['Dr. Meenakshi Sundaram', 'meenakshi.s@itmuniversity.edu', '+91 9123456781', 'EMP-CSE-102', 'CSE', 'Associate Professor', 'Ph.D. Machine Learning', '2021-01-10'],
        ['Prof. Rajesh Nambiar', 'rajesh.n@itmuniversity.edu', '+91 9123456782', 'EMP-ECE-201', 'ECE', 'Assistant Professor', 'M.Tech Embedded Systems', '2022-08-01'],
      ],
    },
    timetable: {
      filename: 'itm_exam_timetable_import_template.csv',
      headers: [
        'Subject Code',
        'Subject Name',
        'Exam Date (YYYY-MM-DD)',
        'Start Time (HH:MM)',
        'End Time (HH:MM)',
        'Room Number',
        'Building',
      ],
      sampleRows: [
        ['MCA-101', 'Advanced Data Structures & Algorithms', '2026-05-18', '09:30', '12:30', 'LH-101', 'Main Academic Complex'],
        ['MCA-102', 'Modern Database Engineering & NoSQL', '2026-05-20', '09:30', '12:30', 'LH-102', 'Main Academic Complex'],
        ['MCA-103', 'Full Stack Web Architecture & Cloud', '2026-05-22', '09:30', '12:30', 'LH-101', 'Science & Technology Block'],
        ['MCA-104', 'Software Quality Assurance & Testing', '2026-05-25', '09:30', '12:30', 'Auditorium A', 'Main Academic Complex'],
      ],
    },
    history: {
      filename: 'itm_import_audit_history.csv',
      headers: ['Batch ID', 'Category', 'Filename', 'Total Records', 'Successful', 'Failed', 'Imported By', 'Date'],
      sampleRows: [
        ['IMP-2026-001', 'students', 'students_jan2026.csv', '60', '60', '0', 'System Administrator', '2026-01-15'],
      ],
    },
  };

  const handleDownloadTemplate = () => {
    const config = templates[activeCategory];
    const csvContent = [
      config.headers.join(','),
      ...config.sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', config.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleInPaste = () => {
    const config = templates[activeCategory];
    const sample = [
      config.headers.join(','),
      ...config.sampleRows.map((r) => r.join(',')),
    ].join('\n');
    setPasteText(sample);
    processRawText(sample);
  };

  const handleExportFailedRows = () => {
    const invalidRecords = parsedRecords.filter((r) => !r.isValid);
    if (invalidRecords.length === 0) return;

    const sanitize = (val: any): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const firstData = invalidRecords[0].data;
    const dataKeys = Object.keys(firstData);
    const headers = [...dataKeys, 'Validation Errors'];

    const rows = invalidRecords.map((r) => {
      const cols = dataKeys.map((k) => sanitize(r.data[k]));
      cols.push(sanitize(r.errors.join('; ')));
      return cols.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `itm_${activeCategory}_failed_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ----------------------------------------------------
  // PARSING & VALIDATION ENGINE
  // ----------------------------------------------------
  const validateRow = (row: Record<string, any>, cat: ImportCategory): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Helper to find key case-insensitively
    const findVal = (aliases: string[]): any => {
      const rowKeys = Object.keys(row);
      for (const alias of aliases) {
        const foundKey = rowKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
          return row[foundKey];
        }
      }
      return '';
    };

    if (cat === 'students') {
      const name = findVal(['Full Name', 'Name', 'Student Name', 'Candidate Name', 'full_name', 'student_name']);
      const email = findVal(['Email', 'Email ID', 'Email Address', 'email', 'email_id']);
      const roll = findVal(['Roll Number', 'Roll No', 'Roll', 'roll_number', 'roll_no', 'Enrollment Number', 'Enrollment']);

      if (!name) errors.push('Full Name is required');
      if (!email || !String(email).includes('@')) errors.push('Valid institutional email is required');
      if (!roll) errors.push('Roll Number is required');
    } else if (cat === 'faculty') {
      const name = findVal(['Full Name', 'Name', 'Faculty Name', 'Staff Name', 'full_name']);
      const email = findVal(['Email', 'Email ID', 'email']);
      const empId = findVal(['Employee ID', 'Emp ID', 'Employee Code', 'Staff ID', 'employee_id']);

      if (!name) errors.push('Full Name is required');
      if (!email || !String(email).includes('@')) errors.push('Valid institutional email is required');
      if (!empId) errors.push('Employee ID is required');
    } else if (cat === 'timetable') {
      const subCode = findVal(['Subject Code', 'Course Code', 'Code', 'subject_code']);
      const dateRaw = String(findVal(['Exam Date', 'Date', 'Exam Date (YYYY-MM-DD)', 'exam_date'])).trim();
      const start = findVal(['Start Time', 'Start Time (HH:MM)', 'Time', 'start_time']);
      const end = findVal(['End Time', 'End Time (HH:MM)', 'end_time']);

      if (!subCode) errors.push('Subject Code is required');
      if (!dateRaw) {
        errors.push('Exam Date is required');
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) && !/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateRaw)) {
        errors.push('Exam Date must be in YYYY-MM-DD or DD-MM-YYYY format');
      }
      if (!start) errors.push('Start Time is required');
      if (!end) errors.push('End Time is required');
    }

    return { isValid: errors.length === 0, errors };
  };

  const processRawRows = (rows: Record<string, any>[]) => {
    const validated: ParsedRecord[] = rows.map((r, idx) => {
      const { isValid, errors } = validateRow(r, activeCategory);
      return {
        id: `row-${idx}-${Date.now()}`,
        data: r,
        isValid,
        errors,
      };
    });
    setParsedRecords(validated);
  };

  const processRawText = (text: string) => {
    if (!text.trim()) {
      setParsedRecords([]);
      return;
    }

    try {
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      processRawRows(json);
    } catch (e: any) {
      // Fallback simple CSV parsing
      const lines = text.trim().split('\n');
      if (lines.length <= 1) {
        setParsedRecords([]);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          obj[h] = parts[i] || '';
        });
        return obj;
      });
      processRawRows(rows);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`File size exceeds 10MB statutory limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller CSV or Excel spreadsheet.`);
      return;
    }

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!json || json.length === 0) {
          alert('The uploaded spreadsheet contains no data rows.');
          return;
        }
        processRawRows(json);
      } catch (err: any) {
        console.error('File parse error:', err);
        alert('Could not parse the selected file. Please make sure it is a valid CSV or Excel (.xlsx/.xls) file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setParsedRecords([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // DATABASE INGESTION ACTION
  // ----------------------------------------------------
  const handleImportToDatabase = async () => {
    const validRows = parsedRecords.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('There are no valid records to import. Please review errors first.');
      return;
    }

    setIsProcessing(true);
    setImportProgress(10);
    setImportResult(null);

    let successCount = 0;
    const errorList: string[] = [];

    try {
      if (activeCategory === 'students') {
        const defaultDept = departments[0]?.id || '';
        const defaultProg = programs[0]?.id || '';
        const defaultSess = sessions.find((s) => s.is_current)?.id || sessions[0]?.id || '';
        const defaultSem = semesters[0]?.id || '';

        const studentsPayload = validRows.map((r, idx) => {
          const d = r.data;
          const deptCode = d['Department Code'] || d['Department'];
          const progCode = d['Program Code'] || d['Program'];
          const foundDept = deptCode ? departments.find((dept) => dept.code.toUpperCase() === String(deptCode).toUpperCase()) : null;
          const foundProg = progCode ? programs.find((prog) => prog.code.toUpperCase() === String(progCode).toUpperCase()) : null;

          if (!foundDept) {
            errorList.push(`Row ${idx + 1}: Unrecognized department code '${deptCode || 'MISSING'}'. Department must exist in system master.`);
          }
          if (!foundProg) {
            errorList.push(`Row ${idx + 1}: Unrecognized program code '${progCode || 'MISSING'}'. Degree program must exist in system master.`);
          }

          const matchedDept = foundDept?.id || '';
          const matchedProg = foundProg?.id || '';

          const roll = d['Roll Number'] || d['Roll'] || `TMP-${idx + 1}`;

          return {
            fullName: d['Full Name'] || d['Name'],
            email: d['Email'],
            phone: d['Phone'] || '',
            rollNumber: roll,
            enrollmentNumber: d['Enrollment Number'] || `ITM/ENR/${roll}`,
            departmentId: matchedDept,
            programId: matchedProg,
            sessionId: defaultSess,
            semesterId: defaultSem,
            gender: d['Gender'] || 'Unspecified',
            dateOfBirth: d['DOB (YYYY-MM-DD)'] || d['DOB'] || '2002-01-01',
            status: 'active' as const,
          };
        });

        if (errorList.length > 0) {
          throw new Error(`Data validation failed on ${errorList.length} references: ${errorList.slice(0, 3).join('; ')}`);
        }

        setImportProgress(40);
        const res = await studentFacultyService.bulkImportStudents(studentsPayload);
        successCount = res.imported;
        if (res.errors?.length) errorList.push(...res.errors);
      } else if (activeCategory === 'faculty') {
        const defaultDept = departments[0]?.id || '';

        const facultyPayload = validRows.map((r, idx) => {
          const d = r.data;
          const deptCode = d['Department Code'] || d['Department'];
          const foundDept = deptCode ? departments.find((dept) => dept.code.toUpperCase() === String(deptCode).toUpperCase()) : null;
          if (!foundDept) {
            errorList.push(`Row ${idx + 1}: Unrecognized faculty department code '${deptCode || 'MISSING'}'. Department must exist in system master.`);
          }
          const matchedDept = foundDept?.id || '';

          return {
            fullName: d['Full Name'] || d['Name'],
            email: d['Email'],
            phone: d['Phone'] || '',
            employeeId: d['Employee ID'] || d['Emp ID'],
            departmentId: matchedDept,
            designation: d['Designation'] || 'Assistant Professor',
            qualification: d['Qualification'] || 'Ph.D. / Master',
            joiningDate: d['Joining Date (YYYY-MM-DD)'] || d['Joining Date'] || new Date().toISOString().split('T')[0],
            status: 'active' as const,
          };
        });

        if (errorList.length > 0) {
          throw new Error(`Faculty import validation failed: ${errorList.slice(0, 3).join('; ')}`);
        }

        setImportProgress(50);
        const res = await studentFacultyService.bulkImportFaculty(facultyPayload);
        successCount = res.imported;
        if (res.errors?.length) errorList.push(...res.errors);
      } else if (activeCategory === 'timetable') {
        if (!selectedExamId) {
          throw new Error('Please select an active Examination cycle for timetable import.');
        }

        const unmatchedCodes: string[] = [];
        const schedulePayload = validRows.map((r, idx) => {
          const d = r.data;
          const subCode = (d['Subject Code'] || d['Code'] || '').toUpperCase();
          const matchedSubject = subjects.find((s) => s.code.toUpperCase() === subCode);

          if (!matchedSubject) {
            unmatchedCodes.push(`Row ${idx + 1}: Subject '${subCode}'`);
          }

          return {
            examination_id: selectedExamId,
            subject_id: matchedSubject?.id || '',
            exam_date: d['Exam Date (YYYY-MM-DD)'] || d['Exam Date'] || d['Date'],
            start_time: d['Start Time (HH:MM)'] || d['Start Time'] || '09:30',
            end_time: d['End Time (HH:MM)'] || d['End Time'] || '12:30',
            room_number: d['Room Number'] || d['Room'] || 'LH-101',
            building: d['Building'] || 'Main Academic Complex',
            status: 'draft' as const,
          };
        });

        if (unmatchedCodes.length > 0) {
          throw new Error(`Schedule mapping error: Unrecognized course codes found (${unmatchedCodes.slice(0, 4).join(', ')}). Please create subjects first or correct codes in spreadsheet.`);
        }

        setImportProgress(60);
        const res = await examService.bulkImportExamSchedules(schedulePayload);
        successCount = res.imported;
        if (res.errors?.length) errorList.push(...res.errors);
      }

      setImportProgress(100);
      if (successCount > 0) {
        adminService.recordImportLog({
          file_name: fileName || `${activeCategory}_import.csv`,
          entity_type: activeCategory,
          total_records: validRows.length,
          success_count: successCount,
          failed_count: validRows.length - successCount,
          imported_by: profile?.full_name || 'System Administrator',
          can_rollback: true,
        });
      }
      setImportResult({
        total: validRows.length,
        success: successCount,
        failed: validRows.length - successCount,
        errors: errorList,
      });
    } catch (err: any) {
      console.error('Batch database ingestion error:', err);
      setImportResult({
        total: validRows.length,
        success: successCount,
        failed: validRows.length - successCount,
        errors: [err?.message || 'Database error occurred during batch ingestion.'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRecords.filter((r) => r.isValid).length;
  const invalidCount = parsedRecords.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              Institutional Bulk Ingestion Engine
            </span>
            <span className="text-xs text-[#64748B]">
              Authority: <span className="text-[#0F2747] font-bold capitalize">{role || 'Administrator'}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Bulk Data Import Center
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl">
            Upload institutional CSV or Excel spreadsheets (.xlsx, .xls) to mass-populate Student Admissions, Faculty Roster, or Official Examination Timetables with automated schema validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#0F2747] border border-slate-300 shadow-xs hover:border-[#1E5AA8] transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#1E5AA8]" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleTabChange('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeCategory === 'students'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Admissions Roster</span>
        </button>

        <button
          onClick={() => handleTabChange('faculty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeCategory === 'faculty'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty Directory &amp; Staff</span>
        </button>

        <button
          onClick={() => handleTabChange('timetable')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeCategory === 'timetable'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Examination Timetable &amp; Slots</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeCategory === 'history'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>Import History &amp; Rollback Logs ({importLogs.length})</span>
        </button>
      </div>

      {activeCategory === 'history' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <History className="w-4 h-4 text-[#1E5AA8]" />
                Audit Log of Bulk Ingestion Batches &amp; Rollbacks
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Full chronological ledger of uploaded spreadsheets with automatic rollback capability for data resilience.
              </p>
            </div>
            <button
              onClick={loadImportHistory}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID &amp; File Name</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4 text-center">Records (Success / Total)</th>
                  <th className="py-3 px-4 text-center">Ingestion Status</th>
                  <th className="py-3 px-4">Imported By</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importLogs.length > 0 ? (
                  importLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F2747] flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-[#1E5AA8]" />
                          {log.file_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {log.id} &bull; {log.timestamp}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize text-slate-800">
                        {log.entity_type}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className="text-emerald-700">{log.success_count}</span>
                        <span className="text-slate-400"> / </span>
                        <span>{log.total_records}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            log.is_rolled_back
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {log.is_rolled_back ? 'ROLLED BACK' : 'ACTIVE INGESTION'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {log.imported_by}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.is_rolled_back ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Rolled back at {log.rolled_back_at}
                          </span>
                        ) : log.can_rollback ? (
                          <button
                            onClick={() => setRollbackTarget(log)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 ml-auto transition shadow-2xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                            <span>Rollback Ingestion</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">No rollback point</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      No batch ingestion logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Timetable Examination Cycle Selector (only for timetable category) */}
          {activeCategory === 'timetable' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div>
                  <span className="font-bold">Target Examination Cycle:</span>
                  <span className="ml-1 text-amber-800">Select which exam session will receive the imported schedule slots.</span>
                </div>
              </div>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {examinations.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.session_name}) &bull; {ex.exam_type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Input Mode Selector & File Dropzone */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F2747]">
                Upload or Paste {activeCategory === 'students' ? 'Student Admissions' : activeCategory === 'faculty' ? 'Faculty Appointments' : 'Exam Timetable'} Data
              </h3>
              <p className="text-[11px] text-[#64748B]">Supported formats: .xlsx, .xls, .csv</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setInputMode('file')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'file' ? 'bg-white text-[#0F2747] shadow-xs' : 'text-slate-600 hover:text-[#0F2747]'
              }`}
            >
              Spreadsheet File
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'paste' ? 'bg-white text-[#0F2747] shadow-xs' : 'text-slate-600 hover:text-[#0F2747]'
              }`}
            >
              Direct Paste
            </button>
          </div>
        </div>

        {inputMode === 'file' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
              isDragging
                ? 'border-[#1E5AA8] bg-blue-50/80 scale-[1.01]'
                : 'border-slate-300 hover:border-[#1E5AA8] bg-slate-50 hover:bg-blue-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white text-[#1E5AA8] border border-slate-200 group-hover:scale-110 group-hover:border-[#1E5AA8] shadow-sm flex items-center justify-center transition-transform mb-3">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            {fileName ? (
              <div className="space-y-2">
                <div className="text-sm font-bold text-[#0F2747] flex items-center justify-center gap-2">
                  <span className="text-[#1E5AA8]">{fileName}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {parsedRecords.length} rows loaded
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs font-semibold text-[#1E5AA8] hover:underline"
                  >
                    Choose another file
                  </button>
                  <span className="text-slate-300">&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear file
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-bold text-[#0F2747]">
                  {isDragging ? 'Drop spreadsheet here to load' : 'Click to select or drag and drop spreadsheet here'}
                </div>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                  Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB supported.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    Auto-column mapping
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                    Real-time validation
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#172033]">
                Paste comma-separated (CSV) or tab-separated text directly from Excel:
              </label>
              <button
                type="button"
                onClick={handleLoadSampleInPaste}
                className="text-xs text-[#1E5AA8] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Sample Rows
              </button>
            </div>
            <textarea
              rows={7}
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                processRawText(e.target.value);
              }}
              placeholder="Paste table data with header row here..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8]"
            />
          </div>
        )}
      </div>

      {/* Results Alert if import was completed */}
      {importResult && (
        <div
          className={`p-5 rounded-2xl border text-xs shadow-xs space-y-3 ${
            importResult.failed === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                Batch Database Ingestion Completed: {importResult.success} records stored successfully in Supabase!
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeCategory === 'students' && (
                <Link
                  to="/admin/users"
                  className="px-3 py-1.5 bg-[#0F2747] text-white rounded-lg font-bold text-[11px] hover:bg-[#1E5AA8] transition"
                >
                  View in Student Directory &rarr;
                </Link>
              )}
              {activeCategory === 'faculty' && (
                <Link
                  to="/admin/users"
                  className="px-3 py-1.5 bg-[#0F2747] text-white rounded-lg font-bold text-[11px] hover:bg-[#1E5AA8] transition"
                >
                  View in Faculty Directory &rarr;
                </Link>
              )}
              {activeCategory === 'timetable' && (
                <Link
                  to="/admin/exams"
                  className="px-3 py-1.5 bg-[#0F2747] text-white rounded-lg font-bold text-[11px] hover:bg-[#1E5AA8] transition"
                >
                  View in Exam Management &rarr;
                </Link>
              )}
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-2 space-y-1 bg-white/70 p-3 rounded-xl border border-amber-300">
              <div className="font-bold text-amber-900">Skipped items / Notices:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>...and {importResult.errors.length - 5} more issues.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Interactive Data Preview & Ingestion Table */}
      {parsedRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          {/* Header & Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-[#0F2747]">
                Spreadsheet Preview &amp; Verification
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {parsedRecords.length} Total Rows
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {validCount} Valid ✓
              </span>
              {invalidCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">
                  {invalidCount} Needs Attention ⚠
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {invalidCount > 0 && (
                <button
                  onClick={handleExportFailedRows}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Export only records with validation errors to fix in spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>Download Failed Rows ({invalidCount})</span>
                </button>
              )}

              <button
                onClick={() => {
                  setParsedRecords([]);
                  setFileName(null);
                  setPasteText('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleImportToDatabase}
                disabled={isProcessing || validCount === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F2747] to-[#1E5AA8] hover:from-[#1E5AA8] hover:to-[#0F2747] text-white shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ingesting to Database ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Store {validCount} Records Directly in Database</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5 w-28">Status</th>
                  {Object.keys(parsedRecords[0].data).slice(0, 7).map((col) => (
                    <th key={col} className="py-3 px-3.5">
                      {col}
                    </th>
                  ))}
                  <th className="py-3 px-3.5">Verification Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRecords.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !item.isValid ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {item.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Issue
                        </span>
                      )}
                    </td>
                    {Object.keys(parsedRecords[0].data).slice(0, 7).map((col) => (
                      <td key={col} className="py-2.5 px-3.5 text-slate-800 font-medium">
                        {String(item.data[col] || '—')}
                      </td>
                    ))}
                    <td className="py-2.5 px-3.5">
                      {item.errors.length > 0 ? (
                        <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {item.errors.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          Schema matches &bull; Ready for database
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* Helpful Guidelines Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#0F2747]">
          <HelpCircle className="w-4 h-4 text-[#1E5AA8]" />
          <span>Institutional Data Ingestion Guidelines</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
          <li className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-[#0F2747] block">🎓 Students Admissions</span>
            <span>Ensure unique Roll Numbers and Institutional Emails. Department and Program codes will be automatically resolved.</span>
          </li>
          <li className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-[#0F2747] block">👨‍🏫 Faculty Roster</span>
            <span>Employee IDs must be distinct. Faculty accounts are automatically provisioned with active status and linked profiles.</span>
          </li>
          <li className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-[#0F2747] block">📅 Examination Timetable</span>
            <span>Subject codes match against curriculum subjects. Dates must follow YYYY-MM-DD and times follow HH:MM 24-hour format.</span>
          </li>
        </ul>
      </div>

      {/* Emergency Rollback Confirmation Modal */}
      {rollbackTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2 text-rose-800">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold">Confirm Ingestion Rollback</h3>
              </div>
              <button
                onClick={() => setRollbackTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                You are about to execute an atomic rollback for spreadsheet batch <strong className="text-rose-900 font-mono">{rollbackTarget.file_name}</strong>.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>Batch Identifier:</span>
                  <strong className="font-mono text-slate-900">{rollbackTarget.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Target Entity:</span>
                  <strong className="capitalize text-slate-900">{rollbackTarget.entity_type}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <strong className="text-slate-900">{rollbackTarget.total_records} rows</strong>
                </div>
                <div className="flex justify-between">
                  <span>Imported On:</span>
                  <strong className="text-slate-900">{rollbackTarget.timestamp}</strong>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                ⚠️ This operation will deactivate the records provisioned by this file and record a security audit entry with your officer profile.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Execute Emergency Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
