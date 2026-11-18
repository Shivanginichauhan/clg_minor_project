import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { assignmentService, Assignment } from '../../services/assignmentService.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  Search,
  Check,
  Send,
  Eye,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyAssignmentsPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create Assignment Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-05-15T23:59');
  const [newTotalMarks, setNewTotalMarks] = useState<number>(25);
  const [newWeightage, setNewWeightage] = useState<number>(10);

  // Grade Modal State
  const [selectedAsgForGrading, setSelectedAsgForGrading] = useState<Assignment | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(20);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  useEffect(() => {
    academicStructureService.getAllocations().then((allocs) => {
      const myAllocs = allocs.filter((a) => {
        if (!user) return false;
        if (user.role === 'administrator' || user.role === 'dean') return true;
        return a.faculty_id === user.id || a.faculty?.id === user.id || a.faculty?.profile?.id === user.id;
      });
      if (myAllocs.length > 0) {
        const subs = myAllocs
          .filter((a) => a.subject)
          .map((a) => ({ code: a.subject!.code, name: a.subject!.name }));
        setSubjects(subs);
        setNewSubjectCode(subs[0]?.code || '');
      }
    });
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getAssignmentsByFaculty(user?.id, profile?.full_name);
      setAssignments(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate) {
      setToastMessage({ text: 'Please complete all required fields.', type: 'error' });
      return;
    }

    const sub = subjects.find((s) => s.code === newSubjectCode);
    await assignmentService.createAssignment({
      faculty_id: user?.id,
      subject_code: newSubjectCode,
      subject_name: sub?.name || newSubjectCode,
      faculty_name: profile?.full_name || 'Course Faculty',
      title: newTitle.trim(),
      description: newDescription.trim(),
      due_date: newDueDate,
      total_marks: Number(newTotalMarks),
      weightage_percent: Number(newWeightage),
      rubrics: [
        { criterion: 'Technical Execution & Correctness', max_marks: Math.round(newTotalMarks * 0.5) },
        { criterion: 'Architecture & Diagrams', max_marks: Math.round(newTotalMarks * 0.3) },
        { criterion: 'Documentation & Code Quality', max_marks: Math.round(newTotalMarks * 0.2) },
      ],
    });

    setToastMessage({
      text: `Assignment "${newTitle}" created! It has been dispatched to all enrolled student dashboards and timetables.`,
      type: 'success',
    });
    setIsCreateOpen(false);
    setNewTitle('');
    setNewDescription('');
    await loadAssignments();
  };

  const handleOpenGradeModal = (asg: Assignment) => {
    setSelectedAsgForGrading(asg);
    setGradeMarks(asg.submission?.marks_obtained ?? asg.total_marks - 3);
    setGradeFeedback(asg.submission?.feedback ?? 'Good work on architecture. Please clarify the deadlock scenario in unit 3.');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgForGrading) return;

    if (gradeMarks > selectedAsgForGrading.total_marks || gradeMarks < 0) {
      setToastMessage({
        text: `Marks must be between 0 and ${selectedAsgForGrading.total_marks}.`,
        type: 'error',
      });
      return;
    }

    await assignmentService.gradeSubmission(
      selectedAsgForGrading.id,
      Number(gradeMarks),
      gradeFeedback,
      profile?.full_name || 'Prof. Ananya Sen'
    );

    setToastMessage({
      text: `Graded assignment for ${selectedAsgForGrading.title}! Scored: ${gradeMarks}/${selectedAsgForGrading.total_marks}. Feedback delivered to student.`,
      type: 'success',
    });
    setSelectedAsgForGrading(null);
    await loadAssignments();
  };

  const filtered = assignments.filter((a) => {
    if (selectedSubject !== 'all' && a.subject_code !== selectedSubject) return false;
    return true;
  });

  const totalSubmissions = assignments.filter((a) => a.submission || a.status === 'submitted' || a.status === 'graded').length;
  const pendingGrading = assignments.filter((a) => a.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss alert">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[11px] px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-blue-300" />
                <span>Continuous Internal Assessment (CIA) Engine</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>UGC CBCS Evaluation Model</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Course Assignments, Quizzes &amp; Grading Desk
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Create and publish assignments with deadline tracking, rubrics, and automated calendar integration. Review student submissions, grade papers with constructive feedback, and sync with CIA marks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-3d-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white text-blue-950 hover:bg-blue-50"
            >
              <PlusCircle className="w-4 h-4 text-[#1E5AA8]" />
              <span>Create New Assignment</span>
            </button>
            <Link
              to="/faculty/marks"
              className="btn-3d-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 border-white/20"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>CIA Marks Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Active Assignments</span>
          <div className="text-2xl font-black font-mono text-[#0F2747]">{assignments.length}</div>
          <span className="text-[10px] text-slate-400">Across your teaching allocations</span>
        </div>

        <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Student Submissions Received</span>
          <div className="text-2xl font-black font-mono text-emerald-700">{totalSubmissions}</div>
          <span className="text-[10px] text-slate-400">Digital PDF / code uploads</span>
        </div>

        <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Evaluation</span>
          <div className="text-2xl font-black font-mono text-amber-600">{pendingGrading}</div>
          <span className="text-[10px] text-slate-400">Awaiting score &amp; feedback</span>
        </div>
      </div>

      {/* No assigned subjects alert */}
      {subjects.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>No assigned subjects found for your account. Please contact your department HOD to assign teaching allocations.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#0F2747]">Filter by Course:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] min-w-[220px]"
          >
            <option value="all">All Assigned Courses ({assignments.length})</option>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} &ndash; {s.name}
              </option>
            ))}
          </select>
        </div>

        <span className="badge-3d text-xs font-bold bg-slate-100 text-slate-700">
          {filtered.length} Assignment(s) Displayed
        </span>
      </div>

      {/* Assignment List */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#0F2747] border-b border-slate-100 pb-3">
          Course Assignment Registry &amp; Student Submissions
        </h2>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading course assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p>No assignments created for this subject yet.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-3d-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Assignment</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((asg) => {
              const isOverdue = new Date(asg.due_date).getTime() < Date.now();
              return (
                <div
                  key={asg.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#1E5AA8]/50 hover:shadow-xs transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-[#1E5AA8] border border-blue-200">
                          {asg.subject_code}
                        </span>
                        <span className="text-xs font-bold text-slate-600">&bull; {asg.subject_name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          Max: {asg.total_marks} Marks ({asg.weightage_percent}% CIA)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#0F2747] pt-1">{asg.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{asg.description}</p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {new Date(asg.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          asg.status === 'graded'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : asg.submission
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {asg.status === 'graded'
                          ? '✓ Evaluated & Graded'
                          : asg.submission
                          ? '⏳ Submission Received'
                          : isOverdue
                          ? 'Deadline Passed'
                          : 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Submission & Grading Box */}
                  {asg.submission ? (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <strong className="text-slate-800">Student Submission: {asg.submission.file_name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">({asg.submission.file_size_kb} KB)</span>
                        </div>
                        {asg.submission.marks_obtained !== undefined && (
                          <div className="text-[11px] text-emerald-800 font-semibold pl-6">
                            Awarded: <strong className="font-mono text-xs">{asg.submission.marks_obtained} / {asg.total_marks}</strong> &bull; Feedback: &quot;{asg.submission.feedback}&quot;
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenGradeModal(asg)}
                        className="btn-3d-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{asg.status === 'graded' ? 'Re-Grade Submission' : 'Grade Submission Now'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No student submissions uploaded for this assignment docket yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#1E5AA8]" />
                <h3 className="text-base font-bold text-[#0F2747]">Create New Assignment / Task</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                aria-label="Close create modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Course</label>
                <select
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                >
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Simulator & Paxos Protocol Lab"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Problem Statement &amp; Requirements</label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed instructions, format guidelines, and expected deliverables..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#1E5AA8] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Due Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={newTotalMarks}
                    onChange={(e) => setNewTotalMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">CIA Weight (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newWeightage}
                    onChange={(e) => setNewWeightage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publish Assignment to Students</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {selectedAsgForGrading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#0F2747]">Grade Student Submission</h3>
              </div>
              <button
                onClick={() => setSelectedAsgForGrading(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                aria-label="Close grade modal"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <span className="font-bold text-[#0F2747] block">{selectedAsgForGrading.title}</span>
              <div className="text-slate-600 flex items-center justify-between">
                <span>Submitted Document:</span>
                <strong className="font-mono text-blue-700">{selectedAsgForGrading.submission?.file_name}</strong>
              </div>
              <div className="text-slate-600 flex items-center justify-between">
                <span>Maximum Obtainable:</span>
                <strong className="font-mono text-slate-800">{selectedAsgForGrading.total_marks} Marks</strong>
              </div>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Marks Awarded (out of {selectedAsgForGrading.total_marks})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedAsgForGrading.total_marks}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold font-mono text-[#0F2747] focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Constructive Feedback &amp; Review Remarks</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Explain rubric strengths, code comments, or areas for improvement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-600 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAsgForGrading(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Grade &amp; Notify Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
