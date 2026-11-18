import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Printer,
  Sparkles,
  Search,
  Lock,
  Save,
  Send,
  RefreshCw,
  BarChart3,
  BookOpen,
  UserCheck,
  CheckSquare,
  ShieldAlert,
  ChevronDown,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  marksService,
  SubjectMarksStatistics
} from '../../services/marksService.js';
import { StudentMarksWithDetails } from '../../data/mockMarks.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { examService } from '../../services/examService.js';
import { enrollmentService } from '../../services/enrollmentService.js';
import { StudentWithDetails } from '../../data/mockAcademics.js';
import { Subject, Examination } from '../../types/database.types.js';

export const MarksEntryPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [marksList, setMarksList] = useState<StudentMarksWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'cia' | 'external' | 'consolidated' | 'foil_sheet'>('cia');
  const [searchQuery, setSearchQuery] = useState('');
  const [anonymousMode, setAnonymousMode] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingModalOpen, setIsSubmittingModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [isCsvDragging, setIsCsvDragging] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load initial subjects and examinations
  useEffect(() => {
    const initData = async () => {
      try {
        const [allSubjects, allExams] = await Promise.all([
          academicStructureService.getSubjects(),
          examService.getExaminations(),
        ]);
        setSubjects(allSubjects);
        setExaminations(allExams);

        const initialExamId = allExams[0]?.id || '';
        setSelectedExamId(initialExamId);

        if (allSubjects.length > 0) {
          setSelectedSubjectId(allSubjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects/exams:', err);
      }
    };
    initData();
  }, []);

  // Load marks when subject or examination changes
  const loadMarks = async () => {
    if (!selectedSubjectId || !selectedExamId) return;

    try {
      const records = await marksService.getMarksBySubject(selectedSubjectId, selectedExamId);
      if (records && records.length > 0) {
        setMarksList(records);
      } else {
        // Automatically populate marks roster from enrolled students
        const enrollments = await enrollmentService.getEnrollmentsBySubject(selectedSubjectId);
        const enrolledStudents = enrollments.map((e) => e.student).filter(Boolean) as StudentWithDetails[];
        const sub = subjects.find((s) => s.id === selectedSubjectId);
        const ex = examinations.find((e) => e.id === selectedExamId);

        const initialList: StudentMarksWithDetails[] = enrolledStudents.map((s) => ({
          id: '',
          student_id: s.id,
          subject_id: selectedSubjectId,
          examination_id: selectedExamId,
          student_name: s.profile?.full_name || 'Student',
          roll_number: s.roll_number || '',
          enrollment_number: s.enrollment_number || '',
          program_name: s.program?.name || '',
          subject_code: sub?.code || '',
          subject_name: sub?.name || '',
          subject_credits: sub?.credits || 4,
          subject_type: (sub?.type as any) || 'theory',
          exam_name: ex?.name || '',
          faculty_name: profile?.full_name || 'Faculty',
          internal_marks: 0,
          external_marks: 0,
          total_marks: 0,
          grade_letter: 'F',
          grade_point: 0,
          is_passed: false,
          status: 'draft',
          moderation_grace_marks: 0,
          cia_breakdown: {
            test1_marks: 0,
            test1_max: 30,
            test2_marks: 0,
            test2_max: 20,
            assignment_marks: 0,
            assignment_max: 10,
            seminar_quiz_marks: 0,
            seminar_quiz_max: 5,
            attendance_score: 0,
            attendance_max: 5,
          },
          max_internal: sub?.max_internal_marks || 40,
          external_theory_max: sub?.max_external_marks || 60,
          external_practical_max: 0,
        } as any));

        setMarksList(initialList);
      }
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to load marks:', err);
    }
  };

  useEffect(() => {
    loadMarks();
  }, [selectedSubjectId, selectedExamId]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedExam = examinations.find((e) => e.id === selectedExamId);

  // Filtered marks based on search query
  const filteredMarks = useMemo(() => {
    if (!searchQuery.trim()) return marksList;
    const q = searchQuery.toLowerCase();
    return marksList.filter(
      (m) =>
        m.student_name.toLowerCase().includes(q) ||
        m.roll_number.toLowerCase().includes(q) ||
        (m.dummy_barcode_no && m.dummy_barcode_no.toLowerCase().includes(q))
    );
  }, [marksList, searchQuery]);

  // Real-time statistics
  const stats: SubjectMarksStatistics = useMemo(() => {
    if (!selectedSubjectId || !selectedExamId) {
      return {
        total_candidates: 0,
        evaluated_count: 0,
        passed_count: 0,
        failed_count: 0,
        absent_count: 0,
        pass_percentage: 0,
        average_score: 0,
        highest_score: 0,
        lowest_score: 0,
        std_deviation: 0,
        grade_distribution: {},
        anomalies: []
      };
    }
    return marksService.calculateSubjectStatistics(marksList);
  }, [marksList, selectedSubjectId, selectedExamId]);

  // Overall status of current subject
  const currentStatus = marksList[0]?.status || 'draft';
  const isReadOnly = currentStatus === 'submitted' || currentStatus === 'verified' || currentStatus === 'locked';

  // Field change handlers
  const handleCiaChange = (
    studentId: string,
    field: keyof StudentMarksWithDetails['cia_breakdown'],
    val: number
  ) => {
    if (isReadOnly) return;
    setIsDirty(true);

    setMarksList((prev) =>
      prev.map((m) => {
        if (m.student_id !== studentId) return m;

        const maxVal = m.cia_breakdown[`${field.replace('_marks', '')}_max` as keyof StudentMarksWithDetails['cia_breakdown']] || 100;
        const clampedVal = Math.max(0, Math.min(Number(val) || 0, maxVal as number));

        const updatedCia = {
          ...m.cia_breakdown,
          [field]: clampedVal
        };

        const computedInternal = Math.min(
          m.max_internal || 40,
          Math.round(((updatedCia.test1_marks + updatedCia.test2_marks) / (updatedCia.test1_max + updatedCia.test2_max)) * 20) +
            updatedCia.assignment_marks +
            updatedCia.seminar_quiz_marks +
            updatedCia.attendance_score
        );

        const total = computedInternal + (m.external_theory_marks || 0) + (m.external_practical_marks || 0) + (m.moderation_grace_marks || 0);

        return {
          ...m,
          cia_breakdown: updatedCia,
          internal_marks: computedInternal,
          total_marks: total
        };
      })
    );
  };

  const handleExternalChange = (
    studentId: string,
    field: 'external_theory_marks' | 'external_practical_marks',
    val: number
  ) => {
    if (isReadOnly) return;
    setIsDirty(true);

    setMarksList((prev) =>
      prev.map((m) => {
        if (m.student_id !== studentId) return m;

        const maxVal = field === 'external_theory_marks' ? m.external_theory_max : m.external_practical_max;
        const clampedVal = Math.max(0, Math.min(Number(val) || 0, maxVal || 100));

        const updated = {
          ...m,
          [field]: clampedVal
        };

        const total =
          m.internal_marks +
          (field === 'external_theory_marks' ? clampedVal : m.external_theory_marks || 0) +
          (field === 'external_practical_marks' ? clampedVal : m.external_practical_marks || 0) +
          (m.moderation_grace_marks || 0);

        return {
          ...updated,
          external_marks: field === 'external_theory_marks' ? clampedVal : m.external_theory_marks || 0,
          practical_marks: field === 'external_practical_marks' ? clampedVal : m.external_practical_marks || 0,
          total_marks: total
        };
      })
    );
  };

  // Save changes locally and persist to Supabase
  const handleSaveDraft = async () => {
    try {
      await marksService.batchUpdateMarks(marksList, profile?.id);
      setIsDirty(false);
      setMessage({ type: 'success', text: 'Evaluation draft saved successfully to database.' });
      await loadMarks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save marks draft.' });
    }
  };

  // Sync attendance scores
  const handleSyncAttendance = () => {
    if (isReadOnly) return;
    try {
      const updated = marksService.syncAttendanceScores(selectedSubjectId, selectedExamId, marksList);
      if (updated && updated.length > 0) {
        setMarksList(updated);
        setIsDirty(true);
        setMessage({
          type: 'success',
          text: `Attendance scores and CIA bonus synchronized for ${updated.length} students!`
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to synchronize attendance scores.' });
    }
  };

  // Submit to HOD
  const handleSubmitToHOD = async () => {
    const actorId = profile?.id || user?.id;
    if (!actorId) {
      setMessage({ type: 'error', text: 'Authentication session expired. Please log in again.' });
      return;
    }

    try {
      await marksService.batchUpdateMarks(marksList, actorId);
      await marksService.submitSubjectMarks(selectedSubjectId, selectedExamId, actorId);
      setIsSubmittingModalOpen(false);
      setMessage({
        type: 'success',
        text: 'Marks successfully submitted to Head of Department & Controller of Examinations for formal verification!'
      });
      await loadMarks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit marks.' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = marksService.exportMarksToCSV(selectedSubjectId, selectedExamId, marksList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `UEAMS_Marks_${selectedSubject?.code || 'SUB'}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Handle uploaded spreadsheet file (CSV or Excel)
  const handleCsvFileProcess = (file: File) => {
    if (!file) return;
    setCsvFileName(file.name);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          setCsvInput(csvText);
        } catch (err: any) {
          console.error('Failed to parse excel marks file:', err);
          alert('Could not parse Excel marks file. Please make sure it is a valid format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setCsvInput(text);
      };
      reader.readAsText(file);
    }
  };

  // Import CSV
  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) return;

    const result = marksService.importMarksFromCSV(selectedSubjectId, selectedExamId, csvInput, marksList);
    if (result.success) {
      if (result.updatedMarks && result.updatedMarks.length > 0) {
        setMarksList(result.updatedMarks);
        setIsDirty(true);
      }
      setMessage({
        type: 'success',
        text: `Successfully imported evaluation for ${result.importedCount} candidates!`
      });
      setIsCsvModalOpen(false);
      setCsvInput('');
      setCsvFileName(null);
      loadMarks();
    } else {
      setMessage({
        type: 'error',
        text: (result.errors && result.errors.length > 0) ? result.errors.slice(0, 3).join(' ') : 'CSV import error occurred.'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Hidden in Print) */}
      <div className="print:hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                Evaluation &amp; Grading Matrix
              </span>
              <span className="text-xs text-[#64748B] font-medium">Faculty Marks Entry Terminal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Continuous Internal Assessment (CIA) &amp; End-Semester Marks
            </h1>
            <p className="text-xs text-[#64748B]">
              Tabulate mid-term tests, assignments, seminars, attendance weightage, external theory &amp; practical awards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {!isReadOnly && (
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Foil Sheet</span>
            </button>
          </div>
        </div>

        {/* Selector Filters Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#64748B]">Assigned Course / Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code}: {sub.name} ({sub.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#64748B]">Examination Cycle</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
            >
              {examinations.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.session_id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#64748B]">Status &amp; Submission</label>
            <div className="flex items-center h-[38px]">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 border ${
                  currentStatus === 'locked'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : currentStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : currentStatus === 'submitted'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {currentStatus === 'locked' && <Lock className="w-3 h-3" />}
                {currentStatus === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                {currentStatus === 'submitted' && <Send className="w-3 h-3" />}
                {currentStatus === 'draft' && <FileSpreadsheet className="w-3 h-3" />}
                <span>{currentStatus}</span>
              </span>
            </div>
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={!isDirty}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isDirty
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => setIsSubmittingModalOpen(true)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </>
              )}

              {isReadOnly && (
                <span className="text-xs font-semibold text-slate-500 italic py-2">
                  Records finalized &amp; locked against modifications.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`print:hidden p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Statistical Overview Widget (Hidden in Print) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#64748B] block">Enrolled</span>
          <span className="text-xl font-mono font-bold text-[#0F2747]">{stats.total_candidates}</span>
          <span className="text-[10px] text-slate-500 block">Evaluated: {stats.evaluated_count}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-700 block">Pass Rate</span>
          <span className="text-xl font-mono font-bold text-emerald-700">{stats.pass_percentage}%</span>
          <span className="text-[10px] text-emerald-600 block">{stats.passed_count} Passed Candidates</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#1E5AA8] block">Class Average</span>
          <span className="text-xl font-mono font-bold text-[#1E5AA8]">{stats.average_score} / 100</span>
          <span className="text-[10px] text-slate-500 block">Std Dev: &plusmn;{stats.std_deviation}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-[#64748B] block">Score Range</span>
          <span className="text-sm font-mono font-bold text-[#0F2747] block pt-1">
            {stats.highest_score} <span className="text-xs text-slate-400">High</span> &bull; {stats.lowest_score} <span className="text-xs text-slate-400">Low</span>
          </span>
          <span className="text-[10px] text-slate-500 block">100-Point Scale</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2">
          <span className="text-[11px] font-bold uppercase text-[#64748B] block mb-1">Grade Distribution</span>
          <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
            <span className="text-purple-700">O: {stats.grade_distribution['O'] || 0}</span>
            <span className="text-blue-700">A+: {stats.grade_distribution['A+'] || 0}</span>
            <span className="text-blue-600">A: {stats.grade_distribution['A'] || 0}</span>
            <span className="text-emerald-700">B+: {stats.grade_distribution['B+'] || 0}</span>
            <span className="text-emerald-600">B: {stats.grade_distribution['B'] || 0}</span>
            <span className="text-amber-700">P: {stats.grade_distribution['P'] || 0}</span>
            <span className="text-rose-700">F: {stats.grade_distribution['F'] || 0}</span>
          </div>
        </div>
      </div>

      {/* Anomaly Alerts (If Any) */}
      {stats.anomalies.length > 0 && (
        <div className="print:hidden bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Academic Performance Anomaly Diagnostics</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
            {stats.anomalies.map((anom, idx) => (
              <li key={idx}>{anom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs & Filter Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('cia')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'cia'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Continuous Internal Assessment (CIA /40)</span>
          </button>

          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'external'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>External Theory &amp; Practical Awards</span>
          </button>

          <button
            onClick={() => setActiveTab('consolidated')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'consolidated'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Consolidated Subject Foil &amp; Grades</span>
          </button>

          <button
            onClick={() => setActiveTab('foil_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'foil_sheet'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Official Form-A Award List</span>
          </button>
        </div>

        {/* Search and Anonymous Toggle */}
        <div className="flex items-center gap-3">
          {activeTab === 'external' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={(e) => setAnonymousMode(e.target.checked)}
                className="rounded text-[#1E5AA8] focus:ring-[#1E5AA8]"
              />
              <span>Blind Dummy Barcode Mode</span>
            </label>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8] w-48"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: Continuous Internal Assessment (CIA) */}
      {activeTab === 'cia' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747]">
                Continuous Internal Assessment (CIA) Matrix &bull; Max 40 Marks
              </h3>
              <p className="text-xs text-[#64748B]">
                Mid-Term Tests (20 scaled) + Assignments (10) + Seminars/Quizzes (10) + Attendance Bonus (5).
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleSyncAttendance}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-[#1E5AA8] border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Attendance Bonus</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate Roll No &amp; Name</th>
                  <th className="py-3 px-3 text-center">Test 1 (30)</th>
                  <th className="py-3 px-3 text-center">Test 2 (30)</th>
                  <th className="py-3 px-3 text-center">Tests Scaled (20)</th>
                  <th className="py-3 px-3 text-center">Assignment (10)</th>
                  <th className="py-3 px-3 text-center">Seminar/Quiz (10)</th>
                  <th className="py-3 px-3 text-center">Att. Bonus (5)</th>
                  <th className="py-3 px-4 text-center font-bold text-[#0F2747]">Total CIA (/40)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMarks.map((m) => {
                  const testsScaled = Math.round(
                    ((m.cia_breakdown.test1_marks + m.cia_breakdown.test2_marks) / 60) * 20
                  );

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={m.student_name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="text-[#0F2747] block font-mono">{m.roll_number}</strong>
                            <span className="text-[11px] text-[#64748B]">{m.student_name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Test 1 */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.cia_breakdown.test1_marks}
                          onChange={(e) => handleCiaChange(m.student_id, 'test1_marks', parseFloat(e.target.value))}
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>

                      {/* Test 2 */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.cia_breakdown.test2_marks}
                          onChange={(e) => handleCiaChange(m.student_id, 'test2_marks', parseFloat(e.target.value))}
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>

                      {/* Scaled Mid-term */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                        {testsScaled}
                      </td>

                      {/* Assignment */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.cia_breakdown.assignment_marks}
                          onChange={(e) => handleCiaChange(m.student_id, 'assignment_marks', parseFloat(e.target.value))}
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>

                      {/* Seminar / Quiz */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.cia_breakdown.seminar_quiz_marks}
                          onChange={(e) => handleCiaChange(m.student_id, 'seminar_quiz_marks', parseFloat(e.target.value))}
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>

                      {/* Attendance Bonus */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.cia_breakdown.attendance_score}
                          onChange={(e) => handleCiaChange(m.student_id, 'attendance_score', parseFloat(e.target.value))}
                          className="w-12 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>

                      {/* Total CIA */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-sm font-bold text-[#1E5AA8] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {m.internal_marks} / 40
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: External Theory & Practical Marks Entry */}
      {activeTab === 'external' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747]">
                End-Semester External Theory &amp; Practical Assessment Entry
              </h3>
              <p className="text-xs text-[#64748B]">
                {selectedSubject?.type === 'combined'
                  ? 'Combined Course: Theory Max 40 + Practical Lab Max 20'
                  : 'Theory Course: External Theory Max 60'}
              </p>
            </div>
            {anonymousMode && (
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Blind Evaluation: Candidate identities masked</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">
                    {anonymousMode ? 'Dummy Evaluation Barcode' : 'Candidate Roll No & Name'}
                  </th>
                  <th className="py-3 px-4 text-center">
                    External Theory ({selectedSubject?.type === 'combined' ? '40' : '60'})
                  </th>
                  {selectedSubject?.type === 'combined' && (
                    <th className="py-3 px-4 text-center">Practical Lab Exam (20)</th>
                  )}
                  <th className="py-3 px-4 text-center font-bold text-[#0F2747]">
                    Total External
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMarks.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      {anonymousMode ? (
                        <span className="font-mono font-bold text-purple-700 text-xs">
                          {m.dummy_barcode_no || `DUMMY-${m.id.slice(-4)}`}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={m.student_name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <strong className="text-[#0F2747] block font-mono">{m.roll_number}</strong>
                            <span className="text-[11px] text-[#64748B]">{m.student_name}</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* External Theory */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={m.external_theory_marks || ''}
                        placeholder="0"
                        onChange={(e) =>
                          handleExternalChange(
                            m.student_id,
                            'external_theory_marks',
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                      />
                    </td>

                    {/* External Practical (If Combined) */}
                    {selectedSubject?.type === 'combined' && (
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={m.external_practical_marks || ''}
                          placeholder="0"
                          onChange={(e) =>
                            handleExternalChange(
                              m.student_id,
                              'external_practical_marks',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-mono font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] disabled:bg-slate-100"
                        />
                      </td>
                    )}

                    {/* Total External */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-[#0F2747]">
                        {(m.external_theory_marks || 0) + (m.external_practical_marks || 0)} /{' '}
                        {selectedSubject?.type === 'combined' ? '60' : '60'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Consolidated Subject Foil & Grades */}
      {activeTab === 'consolidated' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747]">
              Consolidated Subject Foil &amp; UGC 10-Point CBCS Grade Matrix
            </h3>
            <p className="text-xs text-[#64748B]">
              Aggregated assessment results with moderation adjustments, grade letter awards, and GPA points.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate Roll No &amp; Name</th>
                  <th className="py-3 px-3 text-center">Internal (/40)</th>
                  <th className="py-3 px-3 text-center">External (/60)</th>
                  <th className="py-3 px-3 text-center">Grace</th>
                  <th className="py-3 px-4 text-center font-bold text-[#0F2747]">Total (/100)</th>
                  <th className="py-3 px-3 text-center font-bold">Grade</th>
                  <th className="py-3 px-3 text-center">Point</th>
                  <th className="py-3 px-4 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMarks.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={m.student_name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <strong className="text-[#0F2747] block font-mono">{m.roll_number}</strong>
                          <span className="text-[11px] text-[#64748B]">{m.student_name}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">{m.internal_marks}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {(m.external_theory_marks || 0) + (m.external_practical_marks || 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700">
                      {m.moderation_grace_marks ? `+${m.moderation_grace_marks}` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <strong className="font-mono text-sm text-[#0F2747]">{m.total_marks}</strong>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                          m.grade_letter === 'O'
                            ? 'bg-purple-100 text-purple-800'
                            : m.grade_letter === 'A+'
                            ? 'bg-blue-100 text-blue-800'
                            : m.grade_letter === 'A'
                            ? 'bg-blue-50 text-blue-700'
                            : m.grade_letter === 'B+'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.grade_letter === 'B'
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.grade_letter === 'P'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.grade_letter}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {m.grade_point}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.is_passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {m.is_passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Official Form-A Award List / Foil Sheet (Print View) */}
      {activeTab === 'foil_sheet' && (
        <div className="space-y-6">
          <div
            id="printable-marks-foil-sheet"
            className="bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-md space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {/* Seal & University Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#0F2747] text-white flex items-center justify-center font-extrabold text-xl mb-2 shadow-xs">
                U
              </div>
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#0F2747]">
                University Examination &amp; Academic Management System
              </h2>
              <p className="text-xs uppercase font-bold text-[#1E5AA8] tracking-widest">
                OFFICE OF THE CONTROLLER OF EXAMINATIONS &bull; STATUTORY EVALUATION AWARD REGISTER
              </p>
              <div className="inline-block mt-2 px-6 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest">
                FORM &apos;A&apos; &bull; CONSOLIDATED SUBJECT FOIL SHEET
              </div>
            </div>

            {/* Course & Exam Info Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#64748B] block text-[10px]">Subject Code &amp; Name:</span>
                <strong className="text-slate-900 block font-mono">{selectedSubject?.code}</strong>
                <span className="text-slate-700 block font-semibold">{selectedSubject?.name}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Examination Cycle:</span>
                <strong className="text-slate-900 block">{selectedExam?.name}</strong>
                <span className="text-slate-700 block">Session: {selectedExam?.session_id}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Credits &amp; Type:</span>
                <strong className="text-slate-900 block">{selectedSubject?.credits} Credits</strong>
                <span className="text-slate-700 block uppercase">{selectedSubject?.type}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Evaluating Faculty:</span>
                <strong className="text-slate-900 block">{profile?.full_name || 'Prof. Anand Ramanathan'}</strong>
                <span className="text-slate-700 block text-[10px]">Employee ID: {profile?.id || 'FAC-2026-001'}</span>
              </div>
            </div>

            {/* Candidate List Table */}
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-[#0F2747] uppercase font-bold border-b border-slate-300 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Candidate Name</th>
                  <th className="py-2.5 px-3 text-center">CIA (/40)</th>
                  <th className="py-2.5 px-3 text-center">Theory (/60)</th>
                  <th className="py-2.5 px-3 text-center">Grace</th>
                  <th className="py-2.5 px-3 text-center font-bold">Total (/100)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">GPA</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {marksList.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{m.roll_number}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{m.student_name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{m.internal_marks}</td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {(m.external_theory_marks || 0) + (m.external_practical_marks || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                      {m.moderation_grace_marks ? `+${m.moderation_grace_marks}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{m.total_marks}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#1E5AA8]">{m.grade_letter}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{m.grade_point}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {m.is_passed ? 'PASS' : 'FAIL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Statutory Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-8 border-t-2 border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[#64748B] block text-[10px]">Evaluating Examiner:</span>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end">
                  <span className="text-[11px] font-mono font-bold text-slate-800">
                    {profile?.full_name || 'Dr. Anand Ramanathan'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">Department Faculty Signature</span>
              </div>

              <div className="space-y-1 text-center">
                <span className="text-[#64748B] block text-[10px]">Head of Department:</span>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center">
                  <span className="text-[11px] font-mono text-slate-700 italic">Verified &amp; Approved</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Department Examination Committee</span>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-[#64748B] block text-[10px]">Controller of Examinations:</span>
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-end">
                  <span className="text-[11px] font-mono font-bold text-[#0F2747]">Dr. S. Ramanathan, CoE</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Office of Examination Branch</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Submit to HOD */}
      {isSubmittingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1E5AA8]" />
                Final Marks Submission to HOD
              </h3>
              <button
                onClick={() => setIsSubmittingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <p className="font-bold">Subject: {selectedSubject?.code} - {selectedSubject?.name}</p>
                <p className="text-[11px]">Total Candidates: {marksList.length} &bull; Pass Rate: {stats.pass_percentage}%</p>
              </div>

              <div className="space-y-2 text-slate-700">
                <p>
                  By submitting these evaluation records, you certify under university examination statutes that the CIA and external marks have been verified for factual accuracy.
                </p>
                <p className="text-amber-800 font-semibold">
                  Note: Once submitted, records will be locked against direct modification without HOD or CoE approval.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmittingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitToHOD}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Submit to HOD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: CSV Import */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#1E5AA8]" />
                Import Marks from CSV
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Upload a spreadsheet (.csv or .xlsx) or paste CSV content matching the official evaluation columns.
              </p>

              {/* Hidden file input */}
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFileProcess(file);
                }}
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => csvFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsCsvDragging(true);
                }}
                onDragLeave={() => setIsCsvDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsCsvDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleCsvFileProcess(file);
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isCsvDragging
                    ? 'border-[#1E5AA8] bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#1E5AA8] bg-slate-50 hover:bg-blue-50/30'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1E5AA8] shadow-2xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                {csvFileName ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1E5AA8]">{csvFileName}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                      Loaded from file
                    </span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-[#0F2747]">
                    <span className="text-[#1E5AA8] underline">Click to choose Excel/CSV file</span> or drag &amp; drop here
                  </div>
                )}
                <span className="text-[10px] text-slate-400">Supports .xlsx, .xls, and .csv files up to 10MB</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Raw CSV Content / Preview
                </label>
                <textarea
                  required
                  rows={6}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={`"Roll Number","Student Name","Enrollment No","CIA 1 (30)","CIA 2 (30)","Assignment (10)","Seminar/Quiz (10)","Attendance (5)","Total Internal (40)","External Theory (60/40)","External Practical (20)","Moderation Grace","Total Marks (100)","Grade Letter","Grade Point","Status"\n"2026-CS-0101","Aarav Sharma","ENR-2026-9081",27,28,9,9,5,36,54,0,0,90,"O",10,"PASS"`}
                  className="w-full font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="text-xs font-bold text-[#1E5AA8] underline cursor-pointer"
                >
                  Download CSV Template First
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Apply Marks</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
