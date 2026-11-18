import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  Award,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  FileCheck
} from 'lucide-react';
import { assignmentService, Assignment } from '../../services/assignmentService.js';

export const AssignmentsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Submission modal state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentService.getAssignments(user?.id, profile?.full_name);
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (asg: Assignment) => {
    setSelectedAssignment(asg);
    setSubmissionFile(null);
    setSubmissionNotes('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        alert('File size exceeds 20MB limit.');
        return;
      }
      setSubmissionFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submissionFile) {
      alert('Please select a file to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await assignmentService.submitAssignment(
        selectedAssignment.id,
        submissionFile.name,
        Math.round(submissionFile.size / 1024),
        submissionNotes,
        user?.id
      );
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAssignment(null);
      setToastMessage(`Assignment "${updated.title}" successfully submitted!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = assignments.filter((asg) => {
    if (statusFilter === 'pending' && (asg.status !== 'not_started' && asg.status !== 'late')) return false;
    if (statusFilter === 'submitted' && asg.status !== 'submitted') return false;
    if (statusFilter === 'graded' && asg.status !== 'graded') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        asg.title.toLowerCase().includes(q) ||
        asg.subject_code.toLowerCase().includes(q) ||
        asg.subject_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = assignments.filter((a) => a.status === 'not_started' || a.status === 'late').length;
  const gradedCount = assignments.filter((a) => a.status === 'graded').length;
  const submittedCount = assignments.filter((a) => a.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Continuous Internal Assessment (CIA)
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Assignments &amp; Coursework Portfolio
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track active assignments, submission deadlines, rubric-based faculty evaluations, and download reference materials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-amber-300">Action Required</p>
              <p className="text-base font-extrabold text-white mt-0.5">{pendingCount} Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-extrabold text-[#0F2747] mt-0.5">{assignments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E5AA8]">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Submission</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Awaiting Review</p>
            <p className="text-2xl font-extrabold text-[#1E5AA8] mt-0.5">{submittedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E5AA8]">
            <Upload className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluated &amp; Graded</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{gradedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['all', 'pending', 'submitted', 'graded'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#0F2747] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or topic..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#1E5AA8]"
          />
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#0F2747]">No assignments found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no assignments matching your current search or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((asg) => {
            const isDueSoon = new Date(asg.due_date).getTime() - Date.now() < 3 * 24 * 3600 * 1000;
            return (
              <div
                key={asg.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1E5AA8]/40 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {asg.subject_code}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">{asg.subject_name}</span>
                      <span className="text-[11px] text-slate-400">&bull; {asg.faculty_name}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F2747]">{asg.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {asg.status === 'graded' && (
                      <span className="badge-3d text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Graded: {asg.submission?.marks_obtained}/{asg.total_marks}
                      </span>
                    )}
                    {asg.status === 'submitted' && (
                      <span className="badge-3d text-xs font-bold px-3 py-1 bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Submitted
                      </span>
                    )}
                    {(asg.status === 'not_started' || asg.status === 'late') && (
                      <span
                        className={`badge-3d text-xs font-bold px-3 py-1 border flex items-center gap-1 ${
                          isDueSoon
                            ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Due: {new Date(asg.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>

                {/* Rubrics & Weightage breakdown */}
                {asg.rubrics && asg.rubrics.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> Assessment Rubric (Total {asg.total_marks} Marks &bull; {asg.weightage_percent}% CIA Weight)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {asg.rubrics.map((r, i) => (
                        <div key={i} className="text-xs bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                          <span className="text-slate-600 font-medium truncate">{r.criterion}</span>
                          <span className="font-mono font-bold text-[#0F2747]">{r.max_marks}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evaluator Feedback if Graded */}
                {asg.status === 'graded' && asg.submission?.feedback && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> Faculty Review &bull; {asg.submission.graded_by}
                      </span>
                      <span>Score: {asg.submission.marks_obtained} / {asg.total_marks}</span>
                    </div>
                    <p className="text-xs text-emerald-950 italic">"{asg.submission.feedback}"</p>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    {asg.attachments && asg.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {asg.attachments.length} Reference Attachment(s)
                      </span>
                    )}
                    {asg.submission && (
                      <span className="text-slate-600">
                        Submitted: <strong>{asg.submission.file_name}</strong> ({asg.submission.file_size_kb} KB)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {asg.status === 'not_started' || asg.status === 'late' ? (
                      <button
                        onClick={() => handleOpenSubmit(asg)}
                        className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Submit Work &rarr;
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmit(asg)}
                        className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        Re-upload Submission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal Dialog */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedAssignment.subject_code}
                </span>
                <h3 className="text-base font-bold text-[#0F2747] mt-1">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500">Instructor: {selectedAssignment.faculty_name}</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
                aria-label="Close assignment submission modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Submission Document (PDF, ZIP, DOCX up to 20MB)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-[#1E5AA8] transition bg-slate-50/50">
                  <input
                    type="file"
                    id="asg-file-input"
                    accept=".pdf,.doc,.docx,.zip,.tar.gz"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="asg-file-input" className="cursor-pointer block space-y-1.5">
                    <Upload className="w-8 h-8 text-[#1E5AA8] mx-auto" />
                    <p className="text-xs font-bold text-[#0F2747]">
                      {submissionFile ? submissionFile.name : 'Click to select file'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {submissionFile
                        ? `${(submissionFile.size / 1024).toFixed(1)} KB selected`
                        : 'Drag & drop or browse from local disk'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Notes / Git Repository Links (Optional)
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="e.g. Completed with extra credit unit testing. GitHub repo: ..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  <strong>Statutory Declaration:</strong> By submitting, you affirm that this work is original and adheres to the university academic integrity code. Plagiarism checks are run automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !submissionFile}
                  className="btn-3d-gold px-5 py-2 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Confirm & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
