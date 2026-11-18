import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  degreeProgressService,
  DegreeProgressSummary,
  WhatIfSimulationResult
} from '../../services/degreeProgressService.js';

export const DegreeProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DegreeProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('core_theory');

  // What-If Simulation State
  const [selectedElective, setSelectedElective] = useState('Big Data Analytics & Spark');
  const [targetGPA, setTargetGPA] = useState<number>(9.0);
  const [simulation, setSimulation] = useState<WhatIfSimulationResult | null>(null);

  useEffect(() => {
    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await degreeProgressService.getDegreeProgress(user?.id);
      setSummary(data);
      if (data) {
        const sim = degreeProgressService.simulateWhatIf(data, selectedElective, targetGPA);
        setSimulation(sim);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = () => {
    if (!summary) return;
    const sim = degreeProgressService.simulateWhatIf(summary, selectedElective, targetGPA);
    setSimulation(sim);
  };

  if (loading || !summary) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading Degree Audit &amp; Progress Dossier...</p>
      </div>
    );
  }

  const percentEarned = Math.round((summary.totalEarnedCredits / summary.totalRequiredCredits) * 100);
  const percentInProgress = Math.round((summary.totalInProgressCredits / summary.totalRequiredCredits) * 100);
  const remainingCredits = summary.totalRequiredCredits - (summary.totalEarnedCredits + summary.totalInProgressCredits);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Choice Based Credit System (CBCS) Degree Audit
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Degree Progress &amp; Graduation Audit
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {summary.programName} &bull; Cohort {summary.matriculationYear} &bull; Expected Completion: {summary.expectedGraduation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-amber-300">Degree Standing</p>
              <p className="text-xs font-extrabold text-emerald-300 mt-0.5">{summary.standing}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Progress Overview Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F2747]">Overall Credit Completion Journey</h2>
            <p className="text-xs text-slate-500">
              Statutory requirement: <strong>{summary.totalRequiredCredits} Total Credits</strong> for degree conferral
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Earned:</span>{' '}
              <strong className="text-emerald-700 text-sm">{summary.totalEarnedCredits}</strong>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">In Progress:</span>{' '}
              <strong className="text-[#1E5AA8] text-sm">{summary.totalInProgressCredits}</strong>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Remaining:</span>{' '}
              <strong className="text-amber-700 text-sm">{Math.max(0, remainingCredits)}</strong>
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200">
            <div
              style={{ width: `${percentEarned}%` }}
              className="bg-emerald-600 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
              title={`Earned: ${summary.totalEarnedCredits} Credits (${percentEarned}%)`}
            >
              {percentEarned > 12 && `${percentEarned}% Earned`}
            </div>
            <div
              style={{ width: `${percentInProgress}%` }}
              className="bg-[#1E5AA8] transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white"
              title={`In Progress: ${summary.totalInProgressCredits} Credits (${percentInProgress}%)`}
            >
              {percentInProgress > 12 && `${percentInProgress}% Current`}
            </div>
            <div
              style={{ width: `${Math.max(0, 100 - percentEarned - percentInProgress)}%` }}
              className="bg-slate-200/80 transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-slate-600"
              title={`Pending: ${remainingCredits} Credits`}
            >
              {100 - percentEarned - percentInProgress > 15 && `Pending`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Completed &amp; Certified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E5AA8] inline-block" /> Enrolled This Semester
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Required in Future Semesters
            </span>
          </div>
        </div>

        {/* Backlog Safety Notice */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Active Backlogs:</strong> All registered courses to date have been cleared with passing grades on first attempt.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            Standing: Regular
          </span>
        </div>
      </div>

      {/* Category Breakdown Checklists */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1E5AA8]" />
          Credit Fulfillment by Curricular Category
        </h3>

        <div className="space-y-3">
          {summary.categories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            const catProgress = Math.round(((cat.earned + cat.in_progress) / cat.required) * 100);

            return (
              <div
                key={cat.id}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition"
              >
                <div
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#0F2747]">{cat.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          ({cat.earned} of {cat.required} Credits Earned)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-extrabold text-[#0F2747]">{catProgress}%</span>
                      <p className="text-[10px] text-slate-400">Fulfilled</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cat.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {item.code}
                              </span>
                              <span className="font-bold text-[#0F2747] truncate">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.credits} Credits &bull; {item.semester || 'Upcoming'}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            {item.status === 'completed' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Grade: {item.grade}
                              </span>
                            )}
                            {item.status === 'in_progress' && (
                              <span className="text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> In Progress
                              </span>
                            )}
                            {item.status === 'pending' && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Planned
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive What-If Graduation Planner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-300/80 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="badge-3d text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                Predictive Academic Simulator
              </span>
              <h3 className="text-base font-bold text-[#0F2747] mt-0.5">
                "What-If" Elective &amp; CGPA Graduation Forecaster
              </h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Simulate how selecting specific elective streams and achieving targeted performance in your upcoming semesters will impact your graduating CGPA and academic distinction standing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Future Track Elective (Semester 3)
            </label>
            <select
              value={selectedElective}
              onChange={(e) => {
                setSelectedElective(e.target.value);
              }}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-[#1E5AA8]"
            >
              <option value="Big Data Analytics & Spark">DSE-01: Big Data Analytics &amp; Spark (4 Credits)</option>
              <option value="DevSecOps & Kubernetes Security">DSE-01: DevSecOps &amp; Kubernetes Security (4 Credits)</option>
              <option value="Natural Language Processing & LLMs">DSE-01: Natural Language Processing &amp; LLMs (4 Credits)</option>
              <option value="Mobile Application Dev with Flutter">DSE-01: Mobile Application Dev with Flutter (4 Credits)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Targeted Future Average GPA: <span className="text-[#1E5AA8] font-mono">{targetGPA.toFixed(1)}</span>
              </label>
              <span className="text-[10px] text-slate-400">Scale: 6.0 to 10.0</span>
            </div>
            <input
              type="range"
              min="6.0"
              max="10.0"
              step="0.1"
              value={targetGPA}
              onChange={(e) => {
                setTargetGPA(parseFloat(e.target.value));
              }}
              className="w-full accent-[#1E5AA8] cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunSimulation}
            className="btn-3d-gold px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Recalculate Projection
          </button>
        </div>

        {/* Simulation Output Card */}
        {simulation && (
          <div className="p-4 rounded-xl bg-white border border-amber-300 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Projected Graduating CGPA</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#0F2747] font-academic-display">
                    {simulation.projectedCGPA}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    / 10.0 (On-Track for {simulation.projectedCGPA >= 8.5 ? 'Distinction' : 'First Class'})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[#1E5AA8] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {simulation.electiveChosen}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              {simulation.notes.map((note, idx) => (
                <p key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
