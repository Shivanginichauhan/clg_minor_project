import React, { useState, useEffect } from 'react';
import { Program, Department } from '../../types/database.types.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { SubjectWithDetails } from '../../data/mockAcademics.js';
import {
  GraduationCap,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  PieChart
} from 'lucide-react';

interface CurriculumMatrixViewProps {
  programs: Program[];
  departments: Department[];
  selectedProgramId?: string;
  onOpenSubjectModal: (subject?: SubjectWithDetails) => void;
}

export const CurriculumMatrixView: React.FC<CurriculumMatrixViewProps> = ({
  programs,
  departments,
  selectedProgramId,
  onOpenSubjectModal,
}) => {
  const [activeProgId, setActiveProgId] = useState<string>(
    selectedProgramId || programs[0]?.id || ''
  );
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProgramId) {
      setActiveProgId(selectedProgramId);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    const loadCurriculum = async () => {
      if (!activeProgId) return;
      setLoading(true);
      const data = await academicStructureService.getProgramCurriculumSummary(activeProgId);
      setSummary(data);
      setLoading(false);
    };
    loadCurriculum();
  }, [activeProgId]);

  const selectedProg = programs.find((p) => p.id === activeProgId);
  const selectedDept = departments.find((d) => d.id === selectedProg?.department_id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Program Selector Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">
            Select Degree Program:
          </label>
          <select
            value={activeProgId}
            onChange={(e) => setActiveProgId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] font-bold"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name} ({p.total_semesters} Semesters)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Syllabus Matrix</span>
          </button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="p-12 text-center text-[#64748B] bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Computing curriculum credit matrix...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Program KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Degree Credits
              </span>
              <div className="text-2xl font-black text-[#0F2747] font-mono">
                {summary.totalCredits}
              </div>
              <p className="text-[11px] text-[#64748B]">Required for graduation</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Theory vs Lab Split
              </span>
              <div className="text-lg font-bold text-[#172033] font-mono flex items-center gap-1">
                <span className="text-[#1E5AA8]">{summary.theoryCredits} Th</span>
                <span className="text-slate-400">/</span>
                <span className="text-[#16A34A]">{summary.practicalCredits} Lab</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                + {summary.electiveCredits} Elective • {summary.projectCredits} Project
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Subject Courses
              </span>
              <div className="text-2xl font-black text-[#1E5AA8] font-mono">
                {summary.totalSubjects}
              </div>
              <p className="text-[11px] text-[#64748B]">
                Across {selectedProg?.total_semesters} Semesters
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Total Cumulative Marks
              </span>
              <div className="text-2xl font-black text-[#D97706] font-mono">
                {summary.maxTotalMarks}
              </div>
              <p className="text-[11px] text-[#64748B]">Internal + External Combined</p>
            </div>
          </div>

          {/* Program Overview Banner */}
          <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-white text-[#1E5AA8] font-mono text-xs font-bold uppercase border border-blue-200 shadow-2xs">
                  {selectedProg?.code}
                </span>
                <span className="text-xs text-[#64748B] capitalize font-medium">
                  {selectedProg?.degree_level} Degree
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0F2747]">
                {selectedProg?.name}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Offering Department: {selectedDept?.name} ({selectedDept?.code})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#172033] font-semibold px-3 py-1.5 bg-white border border-blue-200 rounded-xl shadow-2xs">
                {selectedProg?.total_semesters} Academic Semesters
              </span>
            </div>
          </div>

          {/* Semester-by-Semester Matrix */}
          <div className="space-y-6">
            {Array.from({ length: selectedProg?.total_semesters || 4 }).map((_, idx) => {
              const semNum = idx + 1;
              const semSubjects: SubjectWithDetails[] = summary.semesters[semNum] || [];
              const semCredits = semSubjects.reduce((a, b) => a + b.credits, 0);
              const semMarks = semSubjects.reduce(
                (a, b) => a + (b.max_internal_marks + b.max_external_marks),
                0
              );

              return (
                <div
                  key={semNum}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  {/* Semester Header */}
                  <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center font-mono font-bold text-xs">
                        S{semNum}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F2747]">
                          Semester {semNum} Curriculum
                        </h4>
                        <p className="text-[11px] text-[#64748B] font-mono">
                          {semNum % 2 !== 0 ? 'Odd Term' : 'Even Term'} • {semSubjects.length} Registered Courses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E5AA8] border border-blue-200 font-mono font-bold">
                        {semCredits} Credits
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-[#D97706] border border-amber-200 font-mono font-bold">
                        {semMarks} Total Marks
                      </span>
                    </div>
                  </div>

                  {/* Subject List */}
                  {semSubjects.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No courses mapped for Semester {semNum} yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {semSubjects.map((sub) => (
                        <div
                          key={sub.id}
                          className="px-6 py-3 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[#0F2747] font-mono font-bold text-xs">
                              {sub.code}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-[#172033]">
                                {sub.name}
                              </div>
                              <div className="text-[11px] text-[#64748B] capitalize">
                                {sub.type} Course • Min Passing {sub.pass_percentage}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-right">
                              <div className="font-mono text-slate-700 font-medium">
                                Int: {sub.max_internal_marks} | Ext: {sub.max_external_marks}
                              </div>
                              <div className="text-[10px] text-[#1E5AA8] font-mono font-bold">
                                {sub.credits} Credits
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
