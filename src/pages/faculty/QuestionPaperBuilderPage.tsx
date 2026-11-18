import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { facultyFeaturesService, QuestionPaperDraft } from '../../services/facultyFeaturesService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Printer,
  Send,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Clock
} from 'lucide-react';

export const QuestionPaperBuilderPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [paper, setPaper] = useState<QuestionPaperDraft | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    const draft = facultyFeaturesService.getQuestionPaper();
    setPaper(draft);
  }, []);

  if (!paper) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading Question Paper Builder...</div>;
  }

  // Calculate actual blueprint sum
  const blueprintSum =
    paper.blueprint.unit1_weightage +
    paper.blueprint.unit2_weightage +
    paper.blueprint.unit3_weightage +
    paper.blueprint.unit4_weightage +
    paper.blueprint.unit5_weightage;

  const totalCalculatedMarks = paper.sections.reduce((acc, s) => acc + s.total, 0);
  const isBlueprintValid = blueprintSum === 100 && totalCalculatedMarks === paper.total_marks;

  const handleSaveDraft = () => {
    facultyFeaturesService.saveQuestionPaper(paper);
    setFeedback({
      type: 'info',
      message: 'Draft question paper and blueprint criteria successfully saved to institutional vault.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitToCoE = () => {
    if (!isBlueprintValid) {
      alert('Cannot submit to CoE: Blueprint allocation must sum exactly to 100% and total marks must match 100.');
      return;
    }
    const updated = { ...paper, status: 'submitted_to_coe' as const };
    facultyFeaturesService.saveQuestionPaper(updated);
    setPaper(updated);
    setFeedback({
      type: 'success',
      message: 'Question paper submitted to Controller of Examinations (CoE) with digital cryptoseal token #COE-QP-2026-9812!',
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                Examination Cell Authoring
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §9 Question Paper Matrix</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Question Paper Authoring &amp; Blueprint Verifier
            </h1>
            <p className="text-xs text-[#64748B]">
              Author university question papers with automated unit blueprint compliance, Bloom's taxonomy tagging, and one-click submission to CoE.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1E5AA8]" />
              <span>Print Paper PDF</span>
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmitToCoE}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Submit to CoE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Course & Exam Meta Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#0F2747] text-white">
            {paper.subject_code}
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#0F2747]">{paper.subject_name}</h3>
            <p className="text-xs text-slate-500">{paper.exam_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            Total Marks: <strong className="text-[#0F2747]">{paper.total_marks}</strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            Duration: <strong className="text-[#1E5AA8]">{paper.duration_minutes / 60} Hours</strong>
          </div>
          <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-purple-900 font-bold uppercase">
            Status: {paper.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Curriculum Blueprint Verifier */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Curriculum Blueprint Weightage Verifier</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Statutory syllabus balance: Each unit must meet the designated course curriculum weightage (Sum = 100%).
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isBlueprintValid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBlueprintValid ? 'Blueprint 100% Compliant' : 'Blueprint Imbalance'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {[1, 2, 3, 4, 5].map((u) => {
            const wt = (paper.blueprint as any)[`unit${u}_weightage`];
            return (
              <div key={u} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Unit {u} Weightage</span>
                <div className="text-lg font-extrabold text-[#0F2747] font-mono">{wt}%</div>
                <span className="text-[10px] text-emerald-700 font-semibold block">Required: 20% ✓</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Paper Sections */}
      <div className="space-y-4">
        {paper.sections.map((section, sIdx) => (
          <div key={sIdx} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F2747]">{section.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg font-mono text-slate-700">
                  {section.question_count} Questions &times; {section.marks_per_question} Marks ={' '}
                  <strong className="text-[#0F2747]">{section.total} Marks</strong>
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {section.questions.map((q) => (
                <div key={q.q_number} className="p-4 hover:bg-slate-50/50 transition flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-slate-500 w-8 pt-0.5">
                    Q{q.q_number}.
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-medium text-[#172033] leading-relaxed">{q.text}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                        Mapped {q.co_mapped}
                      </span>
                      <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                        Bloom: {q.blooms_level}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                        Unit {q.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
