import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Info
} from 'lucide-react';
import {
  StudentFormData,
  studentFacultyService
} from '../../services/studentFacultyService.js';
import {
  Department,
  Program,
  AcademicSession,
  Semester
} from '../../types/database.types.js';

interface BulkStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  programs: Program[];
  sessions: AcademicSession[];
  semesters: Semester[];
}

export const BulkStudentModal: React.FC<BulkStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  programs,
  sessions,
  semesters,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<StudentFormData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const sampleCsv = `Full Name,Email,Phone,Roll Number,Enrollment Number,Gender,DOB
Rohan Mehra,rohan.mca@university.edu,+91 98765 43220,2025-MCA-051,ENR-2025-MCA-051,Male,2002-03-12
Kavita Sen,kavita.mca@university.edu,+91 98765 43221,2025-MCA-052,ENR-2025-MCA-052,Female,2001-09-24
Manish Verma,manish.mca@university.edu,+91 98765 43222,2025-MCA-053,ENR-2025-MCA-053,Male,2002-07-19
Anjali Nair,anjali.mca@university.edu,+91 98765 43223,2025-MCA-054,ENR-2025-MCA-054,Female,2002-12-05`;

  const handleLoadSample = () => {
    setCsvText(sampleCsv);
    handleParseCsv(sampleCsv);
  };

  const handleParseCsv = (text: string) => {
    setError(null);
    setSuccessCount(null);

    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const defaultDept = departments[0]?.id || '';
    const defaultProg = programs[0]?.id || '';
    const defaultSession = sessions.find((s) => s.is_current)?.id || sessions[0]?.id || '';
    const defaultSem = semesters[0]?.id || '';

    const results: StudentFormData[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 2) {
        const [fullName, email, phone, roll, enr, gender, dob] = cols;
        results.push({
          fullName: fullName || `Student ${i}`,
          email: email || `student${i}@university.edu`,
          phone: phone || '',
          rollNumber: roll || `2025-MCA-0${50 + i}`,
          enrollmentNumber: enr || `ENR-2025-MCA-0${50 + i}`,
          departmentId: defaultDept,
          programId: defaultProg,
          sessionId: defaultSession,
          semesterId: defaultSem,
          gender: gender || 'Male',
          dateOfBirth: dob || '2002-01-01',
          status: 'active',
        });
      }
    }

    setParsedRows(results);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setError('Please provide valid CSV rows to import');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const res = await studentFacultyService.bulkImportStudents(parsedRows);
      const count = typeof res === 'number' ? res : (res?.count ?? res?.imported ?? 0);
      setIsProcessing(false);
      setSuccessCount(count);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err?.message || 'Error during batch import');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 text-[#172033]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">Batch Student Admissions</h2>
              <p className="text-xs text-[#64748B]">Import multiple student profiles via CSV format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[#16A34A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Successfully imported {successCount} student admissions!</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs text-[#172033] font-semibold">Paste CSV Data</label>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-[#1E5AA8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Fill Sample MCA Batch (4 records)
            </button>
          </div>

          <textarea
            rows={6}
            placeholder="Full Name,Email,Phone,Roll Number,Enrollment Number,Gender,DOB..."
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              handleParseCsv(e.target.value);
            }}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1E5AA8] leading-relaxed"
          />

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F2747]">Parsed Preview ({parsedRows.length} students)</span>
                <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for import
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1.5 font-mono text-[11px]">
                {parsedRows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                    <span className="font-bold text-[#172033]">{r.fullName}</span>
                    <span className="text-[#1E5AA8] font-semibold">{r.rollNumber}</span>
                    <span className="text-[#64748B]">{r.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-2 text-xs text-[#64748B]">
            <Info className="w-4 h-4 text-[#1E5AA8] flex-shrink-0 mt-0.5" />
            <p>
              Expected CSV columns in order: <code className="text-[#1E5AA8] font-bold">Full Name, Email, Phone, Roll Number, Enrollment Number, Gender, Date of Birth</code>. Department and Session default to active academic cycle.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing || parsedRows.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Importing Batch...' : `Import ${parsedRows.length} Students`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
