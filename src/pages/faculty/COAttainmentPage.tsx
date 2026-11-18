import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { facultyFeaturesService, CourseOutcome } from '../../services/facultyFeaturesService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export const COAttainmentPage: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('MCA-201');
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const allAllocs = await academicStructureService.getAllocations();
        const facultyAllocs = allAllocs.filter((a) => {
          if (!user) return true;
          return a.faculty_id === user.id || a.faculty?.profile?.id === user.id;
        });
        const currentAllocs = facultyAllocs.length > 0 ? facultyAllocs : allAllocs.slice(0, 3);
        setAllocations(currentAllocs);

        const initialCode = currentAllocs[0]?.subject?.code || 'MCA-201';
        setSelectedCourseCode(initialCode);
        const outcomes = facultyFeaturesService.getCourseOutcomes(initialCode);
        setCourseOutcomes(outcomes);
      } catch (err) {
        console.error('Failed to load CO Attainment data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSelectCourse = (code: string) => {
    setSelectedCourseCode(code);
    const outcomes = facultyFeaturesService.getCourseOutcomes(code);
    setCourseOutcomes(outcomes);
  };

  const meetingTargetCount = courseOutcomes.filter(co => co.actualAttainmentPercent >= co.targetAttainmentPercent).length;
  const averageAttainment = courseOutcomes.length > 0
    ? (courseOutcomes.reduce((acc, co) => acc + co.actualAttainmentPercent, 0) / courseOutcomes.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Outcome-Based Education (OBE)
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §5 NBA / NAAC Accreditation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Course Outcome (CO) Attainment
            </h1>
            <p className="text-xs text-[#64748B]">
              Real-time calculation of Course Outcome direct attainment from Continuous Internal Assessments (CIA), midterms, and lab rubrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export SAR Form 4.1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course Selector & Key Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
            <span>Select Teaching Course:</span>
          </label>
          <select
            value={selectedCourseCode}
            onChange={(e) => handleSelectCourse(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          >
            {allocations.map((a) => (
              <option key={a.id} value={a.subject?.code}>
                {a.subject?.code} - {a.subject?.name}
              </option>
            ))}
            {!allocations.some(a => a.subject?.code === 'MCA-201') && (
              <option value="MCA-201">MCA-201 - Advanced Database Management Systems</option>
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Average Attainment:</span>{' '}
            <strong className="text-[#1E5AA8] font-mono">{averageAttainment}%</strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Compliance Rate:</span>{' '}
            <strong className="text-emerald-700 font-mono">
              {meetingTargetCount} / {courseOutcomes.length} COs Meeting Target (≥75%)
            </strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Benchmark Threshold:</span>{' '}
            <strong className="text-slate-800 font-mono">75.0%</strong>
          </div>
        </div>
      </div>

      {/* CO Attainment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courseOutcomes.map((co) => {
          const isMeeting = co.actualAttainmentPercent >= co.targetAttainmentPercent;
          return (
            <div
              key={co.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 transition ${
                isMeeting ? 'border-slate-200 hover:border-emerald-300' : 'border-amber-300 bg-amber-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold bg-[#0F2747] text-white">
                      {co.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Bloom: {co.bloomsLevel}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#172033] leading-snug pt-1">{co.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isMeeting
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {isMeeting ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Meets Target
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-700" /> Attention Needed
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Attainment Gauge */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Attainment Level</span>
                  <div className="space-x-1 font-mono">
                    <span className="font-extrabold text-[#0F2747]">{co.actualAttainmentPercent}%</span>
                    <span className="text-slate-400">/ Target {co.targetAttainmentPercent}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      isMeeting ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, co.actualAttainmentPercent)}%` }}
                  />
                </div>
              </div>

              {/* Assessment Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Mapped CIA Assessment Performance
                </div>
                <div className="space-y-1.5">
                  {co.mappedAssessments.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 font-medium">{a.name} ({a.maxMarks}M)</span>
                      <span className="font-mono font-bold text-[#0F2747]">{a.averageScorePercent}% Class Avg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Plan & Accreditation Guide */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Accreditation Recommendation &amp; Continuous Improvement Loop</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Course outcomes CO1 (84.5%) and CO2 (78.2%) comfortably exceed the 75% institutional threshold. CO3 (Query Optimization) currently stands at 68.4%. Recommended pedagogical intervention: Conduct additional tutorial problem sessions on Relational Algebra pushdown heuristics and schedule remedial lab quizzes before the final examination.
        </p>
      </div>
    </div>
  );
};
