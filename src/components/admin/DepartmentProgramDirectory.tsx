import React, { useState } from 'react';
import { Department, Program, AcademicSession, Semester } from '../../types/database.types.js';
import { FacultyWithDetails, SubjectWithDetails } from '../../data/mockAcademics.js';
import {
  Building2,
  GraduationCap,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Users,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  Clock
} from 'lucide-react';

interface DepartmentProgramDirectoryProps {
  departments: Department[];
  programs: Program[];
  sessions: AcademicSession[];
  semesters?: Semester[];
  facultyList: FacultyWithDetails[];
  subjects: SubjectWithDetails[];
  onOpenDeptModal: (dept?: Department) => void;
  onOpenProgModal: (prog?: Program, defaultDeptId?: string) => void;
  onOpenSessionModal: (session?: AcademicSession) => void;
  onOpenSemesterModal?: (semester?: Semester) => void;
  onDeleteDept: (id: string) => void;
  onDeleteProg: (id: string) => void;
  onDeleteSemester?: (id: string) => void;
  onSelectProgramForCurriculum?: (programId: string) => void;
}

export const DepartmentProgramDirectory: React.FC<DepartmentProgramDirectoryProps> = ({
  departments,
  programs,
  sessions,
  semesters = [],
  facultyList,
  subjects,
  onOpenDeptModal,
  onOpenProgModal,
  onOpenSessionModal,
  onOpenSemesterModal,
  onDeleteDept,
  onDeleteProg,
  onDeleteSemester,
  onSelectProgramForCurriculum,
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'programs' | 'sessions' | 'semesters'>('departments');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const filteredPrograms = programs.filter(
    (p) => selectedDeptFilter === 'all' || p.department_id === selectedDeptFilter
  );

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Academic Departments ({departments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'programs'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Degree Programs ({programs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Academic Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('semesters')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'semesters'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Academic Semesters ({semesters.length})</span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === 'departments' && (
            <button
              onClick={() => onOpenDeptModal()}
              className="w-full sm:w-auto px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Establish Department</span>
            </button>
          )}
          {activeTab === 'programs' && (
            <button
              onClick={() => onOpenProgModal()}
              className="w-full sm:w-auto px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Charter Degree Program</span>
            </button>
          )}
          {activeTab === 'sessions' && (
            <button
              onClick={() => onOpenSessionModal()}
              className="w-full sm:w-auto px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Academic Session</span>
            </button>
          )}
          {activeTab === 'semesters' && (
            <button
              onClick={() => onOpenSemesterModal?.()}
              className="w-full sm:w-auto px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Semester</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. DEPARTMENTS VIEW */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => {
            const deptPrograms = programs.filter((p) => p.department_id === dept.id);
            const deptFaculty = facultyList.filter((f) => f.department_id === dept.id);
            const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
            const hod = facultyList.find((f) => f.id === dept.head_of_department_id);

            return (
              <div
                key={dept.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition space-y-4 relative group"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                      {dept.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">
                        {dept.name}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                        {dept.description || 'Academic department offering higher education and research degrees.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenDeptModal(dept)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete department ${dept.name}?`)) {
                          onDeleteDept(dept.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* HOD Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Head of Department (HOD):</span>
                  <span className="font-semibold text-[#172033]">
                    {hod ? hod.profile?.full_name : 'To be appointed'}
                  </span>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-[#64748B] block font-medium">Programs</span>
                    <span className="text-sm font-bold text-[#0F2747] font-mono">
                      {deptPrograms.length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-[#64748B] block font-medium">Faculty</span>
                    <span className="text-sm font-bold text-[#1E5AA8] font-mono">
                      {deptFaculty.length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-[#64748B] block font-medium">Courses</span>
                    <span className="text-sm font-bold text-[#0F2747] font-mono">
                      {deptSubjects.length}
                    </span>
                  </div>
                </div>

                {/* Programs quick list */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Degree Offerings
                    </span>
                    <button
                      onClick={() => onOpenProgModal(undefined, dept.id)}
                      className="text-[11px] text-[#1E5AA8] hover:underline font-semibold cursor-pointer"
                    >
                      + Add Program
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {deptPrograms.map((p) => (
                      <span
                        key={p.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium flex items-center gap-1.5"
                      >
                        <GraduationCap className="w-3 h-3 text-[#1E5AA8]" />
                        {p.code} ({p.total_semesters} Sems)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DEGREE PROGRAMS VIEW */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
            <label className="text-xs font-semibold text-slate-700">
              Filter by Department:
            </label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Program Code &amp; Title</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Degree Level</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Total Curriculum Subjects</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrograms.map((program) => {
                    const dept = departments.find((d) => d.id === program.department_id);
                    const progSubjects = subjects.filter((s) => s.program_id === program.id);
                    const totalCredits = progSubjects.reduce((acc, s) => acc + s.credits, 0);

                    return (
                      <tr key={program.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-[#0F2747] text-sm">
                              {program.code}
                            </div>
                            <div className="text-xs text-slate-700 font-semibold">
                              {program.name}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1E5AA8] border border-blue-200 font-mono font-bold">
                            {dept?.code}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="capitalize px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                            {program.degree_level}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="text-slate-800 font-semibold">
                            {program.total_semesters} Semesters
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            {program.total_semesters / 2} Academic Years
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0F2747] font-mono">
                              {progSubjects.length} Courses
                            </span>
                            <span className="text-[11px] text-[#64748B] font-mono">
                              ({totalCredits} Credits)
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onSelectProgramForCurriculum && (
                              <button
                                onClick={() => onSelectProgramForCurriculum(program.id)}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold transition cursor-pointer"
                              >
                                View Syllabus
                              </button>
                            )}
                            <button
                              onClick={() => onOpenProgModal(program)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete program ${program.code}?`)) {
                                  onDeleteProg(program.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACADEMIC SESSIONS VIEW */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-5 bg-white border rounded-2xl transition space-y-3 relative shadow-xs ${
                sess.is_current
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      sess.is_current
                        ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                      {sess.name}
                      {sess.is_current && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          Active Current Term
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[#64748B] font-mono mt-0.5">
                      {sess.start_date} &rarr; {sess.end_date}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenSessionModal(sess)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-[#64748B]">Status:</span>
                <span
                  className={`font-semibold flex items-center gap-1.5 ${
                    sess.is_current ? 'text-[#16A34A]' : 'text-slate-500'
                  }`}
                >
                  {sess.is_current ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      Active Academic Intake
                    </>
                  ) : (
                    'Archived / Planned'
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. ACADEMIC SEMESTERS VIEW */}
      {activeTab === 'semesters' && (
        <div className="space-y-4">
          {semesters.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F2747]">No Academic Semesters Found</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1 mb-4">
                Define semester terms for your degree programs to enable student enrollments, attendance, and exam registrations.
              </p>
              {onOpenSemesterModal && (
                <button
                  onClick={() => onOpenSemesterModal()}
                  className="px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Semester</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((sem) => {
                const prog = programs.find((p) => p.id === sem.program_id);
                const sess = sessions.find((s) => s.id === sem.session_id);
                const termLabel =
                  sem.term_type === 'odd'
                    ? 'Odd Term'
                    : sem.term_type === 'even'
                    ? 'Even Term'
                    : 'Summer Term';

                return (
                  <div
                    key={sem.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                            sem.is_active
                              ? 'bg-blue-50 text-[#1E5AA8] border-blue-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className="text-xs font-mono font-bold">S{sem.semester_number}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
                            Semester {sem.semester_number}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                sem.term_type === 'odd'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : sem.term_type === 'even'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {termLabel}
                            </span>
                          </h4>
                          <p className="text-xs font-medium text-slate-600 mt-0.5">
                            {prog?.name || 'Academic Program'} ({prog?.code || 'N/A'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onOpenSemesterModal && (
                          <button
                            onClick={() => onOpenSemesterModal(sem)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Semester"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteSemester && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete Semester ${sem.semester_number} (${prog?.code})?`)) {
                                onDeleteSemester(sem.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Semester"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Academic Session:
                        </span>
                        <span className="font-semibold text-[#0F2747]">
                          {sess?.name || 'Standard Session'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Term Timeline:
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-700">
                          {sem.start_date || 'N/A'} &rarr; {sem.end_date || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-[#64748B]">Enrollment Status:</span>
                      <span
                        className={`font-semibold flex items-center gap-1.5 ${
                          sem.is_active ? 'text-[#16A34A]' : 'text-slate-500'
                        }`}
                      >
                        {sem.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                            Active Term (Open)
                          </>
                        ) : (
                          'Closed / Inactive'
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
