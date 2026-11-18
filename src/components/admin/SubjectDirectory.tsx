import React, { useState, useMemo } from 'react';
import { Department, Program, AcademicSession } from '../../types/database.types.js';
import { SubjectWithDetails, FacultyWithDetails } from '../../data/mockAcademics.js';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Download,
  LayoutGrid,
  List,
  Award,
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface SubjectDirectoryProps {
  subjects: SubjectWithDetails[];
  departments: Department[];
  programs: Program[];
  sessions: AcademicSession[];
  facultyList: FacultyWithDetails[];
  onOpenSubjectModal: (subject?: SubjectWithDetails) => void;
  onOpenAllocateModal: (subjectId?: string) => void;
  onDeleteSubject: (id: string) => void;
  onRefresh: () => void;
}

export const SubjectDirectory: React.FC<SubjectDirectoryProps> = ({
  subjects,
  departments,
  programs,
  sessions,
  facultyList,
  onOpenSubjectModal,
  onOpenAllocateModal,
  onDeleteSubject,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedProg, setSelectedProg] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filter programs based on department selection
  const availablePrograms = useMemo(() => {
    if (selectedDept === 'all') return programs;
    return programs.filter((p) => p.department_id === selectedDept);
  }, [programs, selectedDept]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      if (selectedDept !== 'all' && sub.department_id !== selectedDept) return false;
      if (selectedProg !== 'all' && sub.program_id !== selectedProg) return false;
      if (selectedSemester !== 'all' && sub.semester_number !== parseInt(selectedSemester)) return false;
      if (selectedType !== 'all' && sub.type !== selectedType) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCode = sub.code.toLowerCase().includes(query);
        const matchName = sub.name.toLowerCase().includes(query);
        const matchDept = sub.department?.name?.toLowerCase().includes(query) || sub.department?.code?.toLowerCase().includes(query);
        const matchProg = sub.program?.name?.toLowerCase().includes(query) || sub.program?.code?.toLowerCase().includes(query);
        return matchCode || matchName || matchDept || matchProg;
      }

      return true;
    });
  }, [subjects, selectedDept, selectedProg, selectedSemester, selectedType, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Course Code', 'Title', 'Type', 'Credits', 'Department', 'Program', 'Semester', 'Internal Marks', 'External Marks', 'Pass %'];
    const rows = filteredSubjects.map((s) => [
      `"${s.code}"`,
      `"${s.name}"`,
      s.type,
      s.credits,
      `"${s.department?.code || ''}"`,
      `"${s.program?.code || ''}"`,
      s.semester_number,
      s.max_internal_marks,
      s.max_external_marks,
      s.pass_percentage,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `curriculum_subjects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'theory':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#1E5AA8] border border-blue-200">
            Theory
          </span>
        );
      case 'practical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
            Practical / Lab
          </span>
        );
      case 'elective':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Elective
          </span>
        );
      case 'project':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
            Capstone Project
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. MCA-201), course title, department..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0F2747] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0F2747] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => onOpenAllocateModal()}
              className="px-3.5 py-2 bg-[#D97706] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Faculty</span>
            </button>

            <button
              onClick={() => onOpenSubjectModal()}
              className="px-3.5 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedProg('all');
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Degree Program
            </label>
            <select
              value={selectedProg}
              onChange={(e) => setSelectedProg(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Programs</option>
              {availablePrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Semesters</option>
              {Array.from({ length: 8 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Semester {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Course Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] capitalize"
            >
              <option value="all">All Types</option>
              <option value="theory">Theory</option>
              <option value="practical">Practical / Lab</option>
              <option value="elective">Elective</option>
              <option value="project">Project Work</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>
          Showing <span className="text-[#0F2747] font-bold">{filteredSubjects.length}</span> curriculum courses
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Theory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Practical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Elective
          </span>
        </div>
      </div>

      {/* Main View: Table or Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#0F2747]">No Subjects Found</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No academic subjects matched your filter criteria. Try adjusting the search or add a new subject.
          </p>
          <button
            onClick={() => onOpenSubjectModal()}
            className="px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Subject
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Course Code &amp; Title</th>
                  <th className="px-4 py-3.5">Program &amp; Dept</th>
                  <th className="px-4 py-3.5">Semester</th>
                  <th className="px-4 py-3.5">Type &amp; Credits</th>
                  <th className="px-4 py-3.5">Evaluation Scheme</th>
                  <th className="px-4 py-3.5">Appointed Faculty</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F2747] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {subject.code}
                          </span>
                          {getTypeBadge(subject.type)}
                        </div>
                        <div className="text-xs font-semibold text-[#172033] line-clamp-1 max-w-xs">
                          {subject.name}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-[#172033] font-semibold">
                        {subject.program?.code}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {subject.department?.code}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
                        Sem {subject.semester_number}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1E5AA8] border border-blue-200 font-bold font-mono">
                          {subject.credits} Credits
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="text-slate-700 font-mono text-[11px]">
                          Int: <span className="text-[#D97706] font-bold">{subject.max_internal_marks}</span> | Ext:{' '}
                          <span className="text-[#1E5AA8] font-bold">{subject.max_external_marks}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono">
                          Total: {subject.max_internal_marks + subject.max_external_marks} (Min {subject.pass_percentage}%)
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {subject.assigned_faculty && subject.assigned_faculty.length > 0 ? (
                        <div className="space-y-1">
                          {subject.assigned_faculty.map((fac) => (
                            <div
                              key={fac.id}
                              className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                              {fac.profile?.full_name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenAllocateModal(subject.id)}
                          className="text-[11px] text-[#D97706] hover:underline font-semibold cursor-pointer"
                        >
                          + Assign Faculty
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAllocateModal(subject.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#D97706] hover:bg-amber-50 transition cursor-pointer"
                          title="Assign Faculty"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenSubjectModal(subject)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E5AA8] hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove subject ${subject.code}?`)) {
                              onDeleteSubject(subject.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition space-y-3 relative group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0F2747] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {subject.code}
                  </span>
                  {getTypeBadge(subject.type)}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#0F2747] group-hover:text-[#1E5AA8] transition">
                    {subject.name}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {subject.program?.name} ({subject.program?.code})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-[#64748B] block">Semester</span>
                    <span className="font-semibold text-[#172033]">
                      Semester {subject.semester_number}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-[#64748B] block">Academic Credits</span>
                    <span className="font-bold text-[#1E5AA8] font-mono">
                      {subject.credits} Credits
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Evaluation:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    Int: {subject.max_internal_marks} + Ext: {subject.max_external_marks} ={' '}
                    <span className="text-[#D97706] font-bold">
                      {subject.max_internal_marks + subject.max_external_marks}M
                    </span>
                  </span>
                </div>

                {/* Faculty Pill */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                    Assigned Faculty:
                  </span>
                  {subject.assigned_faculty && subject.assigned_faculty.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {subject.assigned_faculty.map((f) => (
                        <span
                          key={f.id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          {f.profile?.full_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      No faculty appointed yet
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onOpenAllocateModal(subject.id)}
                  className="text-xs text-[#D97706] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Assign
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenSubjectModal(subject)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${subject.code}?`)) {
                        onDeleteSubject(subject.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
