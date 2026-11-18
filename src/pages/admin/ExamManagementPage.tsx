import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  Search,
  Filter,
  Layers,
  DoorOpen,
  Eye,
  Check,
  X,
  FileText,
  AlertCircle,
  UploadCloud,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import {
  examService,
  ScheduleConflict
} from '../../services/examService.js';
import {
  ExamCycleWithDetails,
  ExamScheduleWithDetails
} from '../../data/mockExams.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { Subject, Program, AcademicSession } from '../../types/database.types.js';
import { adminService } from '../../services/adminService.js';

export const ExamManagementPage: React.FC = () => {
  const [exams, setExams] = useState<ExamCycleWithDetails[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [schedules, setSchedules] = useState<ExamScheduleWithDetails[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'conflicts' | 'cycles'>('schedules');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('all');

  // Metadata dependencies
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  // Modals & form state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamScheduleWithDetails | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for schedule
  const [formData, setFormData] = useState({
    subject_id: '',
    exam_date: '2026-05-20',
    start_time: '09:30',
    end_time: '12:30',
    room_number: 'LH-101',
    building: 'APJ Abdul Kalam Academic Block',
    session_type: 'morning' as 'morning' | 'afternoon',
    max_marks: 100,
  });

  // Form states for new Exam Cycle
  const [cycleFormData, setCycleFormData] = useState({
    name: '',
    session_id: '',
    exam_type: 'regular' as 'regular' | 'supplementary' | 'improvement',
    start_date: '2026-05-18',
    end_date: '2026-06-10',
    is_active: true,
  });

  const [deanSubmissionRemarks, setDeanSubmissionRemarks] = useState('');

  const loadData = async () => {
    const allExams = await examService.getExaminations();
    setExams(allExams);

    const activeOrFirst = allExams.find((e) => e.is_active) || allExams[0];
    const currentExamId = selectedExamId || (activeOrFirst ? activeOrFirst.id : '');
    setSelectedExamId(currentExamId);

    if (currentExamId) {
      const allSchedules = await examService.getExamSchedules(currentExamId);
      setSchedules(allSchedules);
      const detectedConflicts = await examService.detectScheduleConflicts(currentExamId);
      setConflicts(detectedConflicts);
    }

    const [subjs, progs, sess] = await Promise.all([
      academicStructureService.getSubjects(),
      academicStructureService.getPrograms(),
      academicStructureService.getSessions(),
    ]);
    setSubjects(subjs);
    setPrograms(progs);
    setSessions(sess);
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId]);

  const currentExam = exams.find((e) => e.id === selectedExamId);
  const isCyclePublished = currentExam?.approval_status === 'published' || (currentExam as any)?.is_published;
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  const handleRequestUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim() || !currentExam) return;

    adminService.submitApprovalRequest({
      operation_type: 'EXAM_SCHEDULE_UNLOCK',
      title: `Statutory Unlock Request: ${currentExam.name}`,
      target_entity: currentExam.name,
      description: `Examination timetable alteration requested: ${unlockReason}. Initiated by Examination Controller.`,
      requested_by: 'Controller of Examinations',
      payload: {
        exam_id: currentExam.id,
        exam_name: currentExam.name,
        reason: unlockReason,
        requested_at: new Date().toISOString(),
      },
    });

    setIsUnlockModalOpen(false);
    setUnlockReason('');
    setMessage({
      type: 'success',
      text: 'Timetable unlock request queued in Two-Person Approval ledger (/admin/dual-approvals) for statutory checker sign-off.',
    });
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      (s.subject_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.subject_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.room_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProg = programFilter === 'all' || s.program_name === programFilter;
    return matchesSearch && matchesProg;
  });

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCyclePublished) {
      setMessage({
        type: 'error',
        text: 'Statutory Lock Violation: Master Examination Timetable is published and frozen. Alterations require Two-Person Authorization sign-off.',
      });
      return;
    }
    if (!selectedExamId) {
      setMessage({ type: 'error', text: 'Please select an examination cycle first.' });
      return;
    }
    if (!formData.subject_id) {
      setMessage({ type: 'error', text: 'Please select a subject.' });
      return;
    }

    try {
      if (editingSchedule) {
        await examService.updateExamSchedule(editingSchedule.id, {
          subject_id: formData.subject_id,
          exam_date: formData.exam_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room_number: formData.room_number,
          building: formData.building,
          session_type: formData.session_type,
          max_marks: formData.max_marks,
        });
        setMessage({ type: 'success', text: 'Exam schedule slot updated successfully.' });
      } else {
        await examService.createExamSchedule({
          examination_id: selectedExamId,
          subject_id: formData.subject_id,
          exam_date: formData.exam_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room_number: formData.room_number,
          building: formData.building,
          session_type: formData.session_type,
          max_marks: formData.max_marks,
        });
        setMessage({ type: 'success', text: 'New paper schedule added to the master timetable.' });
      }

      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save exam schedule slot.' });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const currentExam = exams.find((e) => e.id === selectedExamId);
    if (currentExam?.approval_status === 'approved' || (currentExam as any)?.is_published) {
      setMessage({
        type: 'error',
        text: 'Action Prohibited: Cannot delete papers from an approved or published examination cycle. Removing scheduled slots invalidates issued student hall tickets.',
      });
      return;
    }

    if (confirm('Are you sure you want to remove this paper from the examination timetable?')) {
      await examService.deleteExamSchedule(id);
      setMessage({ type: 'success', text: 'Paper schedule slot removed.' });
      await loadData();
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleFormData.name) {
      setMessage({ type: 'error', text: 'Cycle title is required.' });
      return;
    }

    try {
      const newExam = await examService.createExamination({
        name: cycleFormData.name,
        session_id: cycleFormData.session_id || (sessions[0]?.id ?? 'session-2025-26'),
        exam_type: cycleFormData.exam_type,
        start_date: cycleFormData.start_date,
        end_date: cycleFormData.end_date,
        semester_id: (cycleFormData as any).semester_id || 'sem-mca-2',
      });
      setMessage({ type: 'success', text: 'New examination cycle created successfully.' });
      setIsCycleModalOpen(false);
      setSelectedExamId(newExam.id);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create examination cycle.' });
    }
  };

  const handleSubmitToDean = async () => {
    if (!selectedExamId) return;
    try {
      await examService.submitScheduleForDeanApproval(selectedExamId);
      setMessage({
        type: 'success',
        text: 'Timetable officially submitted to Dean of Academic Affairs for statutory review and approval.',
      });
      setIsSubmitModalOpen(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit timetable.' });
    }
  };

  const handlePublishTimetable = async () => {
    if (!selectedExamId) return;
    if (confirm('Publish this timetable university-wide? Students will immediately receive Hall Tickets & exam notifications.')) {
      try {
        await examService.publishTimetable(selectedExamId);
        setMessage({ type: 'success', text: 'Timetable published! Hall Tickets generated for eligible students.' });
        await loadData();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to publish timetable.' });
      }
    }
  };

  const openAddScheduleModal = () => {
    setEditingSchedule(null);
    setFormData({
      subject_id: subjects[0]?.id || '',
      exam_date: '2026-05-20',
      start_time: '09:30',
      end_time: '12:30',
      room_number: 'LH-101',
      building: 'APJ Abdul Kalam Academic Block',
      session_type: 'morning',
      max_marks: 100,
    });
    setIsScheduleModalOpen(true);
  };

  const openEditScheduleModal = (sch: ExamScheduleWithDetails) => {
    setEditingSchedule(sch);
    setFormData({
      subject_id: sch.subject_id,
      exam_date: sch.exam_date,
      start_time: sch.start_time,
      end_time: sch.end_time,
      room_number: sch.room_number || 'LH-101',
      building: sch.building || 'APJ Abdul Kalam Academic Block',
      session_type: sch.session_type || 'morning',
      max_marks: sch.max_marks || 100,
    });
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                Examination Operations
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Cycle Configuration &amp; Timetable Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Examination Cycles &amp; Timetable Governance
            </h1>
            <p className="text-xs text-[#64748B]">
              Build conflict-free examination schedules, execute cohort clash audits, and submit for statutory Dean approval.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCycleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#1E5AA8]" />
              <span>New Exam Cycle</span>
            </button>
            <button
              onClick={() => selectedExamId && examService.exportTimetableCSV(selectedExamId)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Timetable CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Cycle Selector Bar & Action Center */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-[#0F2747] whitespace-nowrap">Active Exam Cycle:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#1E5AA8] min-w-[280px]"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.exam_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {currentExam && (
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                currentExam.approval_status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : currentExam.approval_status === 'approved'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : currentExam.approval_status === 'submitted'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Status: {currentExam.approval_status || 'Draft'}
            </span>

            {currentExam.approval_status === 'draft' && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Dean</span>
              </button>
            )}

            {currentExam.approval_status === 'approved' && (
              <button
                onClick={handlePublishTimetable}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Publish University-Wide</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Scheduled Exam Papers</span>
            <Calendar className="w-4 h-4 text-[#1E5AA8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F2747]">{schedules.length} Papers</div>
          <p className="text-[11px] text-[#64748B]">Across active degree cohorts</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Schedule Conflict Clashes</span>
            <AlertTriangle className={`w-4 h-4 ${conflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-3xl font-extrabold ${conflicts.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {conflicts.length} Clashes
          </div>
          <p className="text-[11px] text-[#64748B]">
            {conflicts.length === 0 ? '0 collisions detected' : 'Requires immediate resolution'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Examination Window</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-[#0F2747] truncate">
            {currentExam?.start_date} &rarr; {currentExam?.end_date}
          </div>
          <p className="text-[11px] text-[#64748B]">{currentExam?.session_name || 'Active Session'}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
            <span>Dean Statutory Signoff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-[#0F2747] capitalize">
            {currentExam?.approval_status || 'Draft Stage'}
          </div>
          <p className="text-[11px] text-[#64748B] truncate">
            {currentExam?.reviewed_by_dean_name || 'Pending Dean review'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'schedules'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Master Timetable Builder</span>
          </button>
          
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'conflicts'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Clash &amp; Conflict Inspector</span>
            {conflicts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-200 text-rose-900 font-extrabold">
                {conflicts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cycles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'cycles'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cycle Configurations ({exams.length})</span>
          </button>
        </div>

        {activeTab === 'schedules' && (
          <div className="flex items-center gap-2">
            {isCyclePublished ? (
              <>
                <button
                  onClick={() => setIsUnlockModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Request Timetable Unlock</span>
                </button>
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1.5 cursor-not-allowed"
                  title="Schedule is frozen post-publication"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timetable Frozen</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/admin/bulk-import"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#0F2747] border border-slate-300 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#1E5AA8]" />
                  <span>Bulk Import Timetable</span>
                </Link>
                <button
                  onClick={openAddScheduleModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exam Paper</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Master Timetable */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {/* Post-Publication Freeze Notice */}
          {isCyclePublished && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-amber-950 text-xs block">
                    Statutory Post-Publication Timetable Lock Enforced
                  </span>
                  <span className="text-amber-800 text-[11px] leading-tight block mt-0.5">
                    This examination cycle is officially published and hall tickets are in circulation. Direct modifications or deletions are strictly locked under university examination bylaws.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/admin/dual-approvals"
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs"
                >
                  View Sign-off Queue
                </Link>
                <button
                  onClick={() => setIsUnlockModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Request Unlock</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject code, title, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
              />
            </div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
            >
              <option value="all">All Degree Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Master Examination Timetable &bull; {currentExam?.name}
              </h3>
              <span className="text-xs text-[#1E5AA8] font-mono font-medium">
                {filteredSchedules.length} Papers Scheduled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Slot</th>
                    <th className="py-3 px-4">Subject Code &amp; Title</th>
                    <th className="py-3 px-4">Program &amp; Sem</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Max Marks</th>
                    <th className="py-3 px-4">Venue Hall</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#64748B]">
                        No exam papers scheduled yet. Click "Add Exam Paper" to schedule.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F2747]">{sch.exam_date}</div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            {sch.start_time} - {sch.end_time} ({sch.session_type?.toUpperCase()})
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-[#1E5AA8]">{sch.subject_code}</div>
                          <div className="text-[11px] text-[#172033] font-medium">{sch.subject_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#172033]">{sch.program_name}</div>
                          <div className="text-[11px] text-[#64748B]">Semester {sch.semester_number}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sch.subject_type === 'practical'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {sch.subject_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#0F2747]">
                          {sch.max_marks || 100}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172033]">{sch.room_number || 'LH-101'}</div>
                          <div className="text-[10px] text-[#64748B] truncate max-w-[140px]">{sch.building}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              sch.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sch.status === 'approved'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : sch.status === 'submitted'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isCyclePublished || sch.status === 'published' ? (
                            <div className="flex items-center justify-end gap-1.5" title="Frozen post-publication">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-[10px] flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Locked</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditScheduleModal(sch)}
                                className="p-1.5 text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Edit Schedule"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(sch.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clash & Conflict Detection Inspector */}
      {activeTab === 'conflicts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Automated Examination Clash &amp; Overlap Audit Engine
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Scans for simultaneous papers in the same cohort or venue double-booking collisions.
              </p>
            </div>
            <button
              onClick={async () => {
                if (selectedExamId) {
                  const detected = await examService.detectScheduleConflicts(selectedExamId);
                  setConflicts(detected);
                  setMessage({ type: 'success', text: `Audit completed: ${detected.length} issues identified.` });
                }
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Re-Run Conflict Audit</span>
            </button>
          </div>

          {conflicts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Zero Schedule Conflicts Detected</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                All scheduled papers have valid timeslots, distinct room allocations, and no overlapping cohort examinations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conf, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-rose-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      {conf.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-200 text-rose-900">
                      {conf.severity} severity
                    </span>
                  </div>
                  <p className="text-xs text-rose-800">{conf.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Cycles Manager */}
      {activeTab === 'cycles' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F2747]">Examination Cycle Definitions</h3>
            <button
              onClick={() => setIsCycleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Cycle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className={`p-4 rounded-xl border transition ${
                  ex.id === selectedExamId
                    ? 'border-[#1E5AA8] bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ex.exam_type}
                    </span>
                    <h4 className="text-sm font-bold text-[#0F2747] mt-1">{ex.name}</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Session: {ex.session_name} &bull; {ex.start_date} to {ex.end_date}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      ex.approval_status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : ex.approval_status === 'approved'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {ex.approval_status || 'Draft'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">{ex.total_schedules || 0} scheduled papers</span>
                  <button
                    onClick={() => {
                      setSelectedExamId(ex.id);
                      setActiveTab('schedules');
                    }}
                    className="text-xs font-bold text-[#1E5AA8] hover:underline cursor-pointer"
                  >
                    Manage Timetable &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Paper Schedule */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1E5AA8]" />
                {editingSchedule ? 'Edit Exam Paper Slot' : 'Add Exam Paper Schedule'}
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Course / Subject</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name} (Sem {sub.semester_number} &bull; {sub.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Exam Date</label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Session Slot</label>
                  <select
                    value={formData.session_type}
                    onChange={(e) => setFormData({ ...formData, session_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="morning">Morning (09:30 - 12:30)</option>
                    <option value="afternoon">Afternoon (14:00 - 17:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Room / Hall Number</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Max Marks</label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) || 100 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Building Complex</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Exam Cycle */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1E5AA8]" />
                Configure New Examination Cycle
              </h3>
              <button
                onClick={() => setIsCycleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Cycle Title</label>
                <input
                  type="text"
                  placeholder="e.g. End-Semester Examination November/December 2026"
                  value={cycleFormData.name}
                  onChange={(e) => setCycleFormData({ ...cycleFormData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Academic Session</label>
                  <select
                    value={cycleFormData.session_id}
                    onChange={(e) => setCycleFormData({ ...cycleFormData, session_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Exam Type</label>
                  <select
                    value={cycleFormData.exam_type}
                    onChange={(e) => setCycleFormData({ ...cycleFormData, exam_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="regular">Regular</option>
                    <option value="supplementary">Supplementary</option>
                    <option value="improvement">Improvement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">Start Date</label>
                  <input
                    type="date"
                    value={cycleFormData.start_date}
                    onChange={(e) => setCycleFormData({ ...cycleFormData, start_date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#64748B]">End Date</label>
                  <input
                    type="date"
                    value={cycleFormData.end_date}
                    onChange={(e) => setCycleFormData({ ...cycleFormData, end_date: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
                >
                  Create Exam Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit to Dean */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                Submit Timetable to Dean
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#64748B]">
                You are submitting the master timetable for <strong>{currentExam?.name}</strong> containing{' '}
                <strong>{schedules.length} examination papers</strong> to the Dean of Academic Affairs for statutory review.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Submission Remarks / Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Clash checks passed, room allotments confirmed across APJ Block and Central Audi."
                  value={deanSubmissionRemarks}
                  onChange={(e) => setDeanSubmissionRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitToDean}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition cursor-pointer"
                >
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Timetable Unlock */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Statutory Timetable Unlock Request</span>
              </h3>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRequestUnlock} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                You are requesting statutory unfreezing for published examination cycle{' '}
                <strong className="text-[#0F2747]">{currentExam?.name}</strong>. This will queue a two-person approval request in the institutional governance ledger.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Revision / Hall Relocation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Clash identified with statutory election holiday on 22nd May. Need to relocate 2 paper slots to APJ Block..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dual-Governance Protocol</span>
                </div>
                <p>The request will require secondary authorization by a statutory Checker with cryptographic PIN verification at <code>/admin/dual-approvals</code>.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Queue Unlock Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
