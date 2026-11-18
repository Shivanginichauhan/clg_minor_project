import React, { useState, useEffect } from 'react';
import { Department, Program } from '../../types/database.types.js';
import { SubjectFormData } from '../../services/academicStructureService.js';
import { SubjectWithDetails } from '../../data/mockAcademics.js';
import { X, BookOpen, AlertCircle, Award, Sparkles } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: SubjectFormData) => Promise<void>;
  subject: SubjectWithDetails | null;
  departments: Department[];
  programs: Program[];
  defaultProgramId?: string;
  defaultDepartmentId?: string;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subject,
  departments,
  programs,
  defaultProgramId,
  defaultDepartmentId,
}) => {
  const [formData, setFormData] = useState<SubjectFormData>({
    department_id: defaultDepartmentId || departments[0]?.id || '',
    program_id: defaultProgramId || programs[0]?.id || '',
    code: '',
    name: '',
    credits: 4,
    semester_number: 1,
    type: 'theory',
    max_internal_marks: 40,
    max_external_marks: 60,
    pass_percentage: 40,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter programs based on selected department
  const filteredPrograms = programs.filter(
    (p) => !formData.department_id || p.department_id === formData.department_id
  );

  useEffect(() => {
    if (subject) {
      setFormData({
        department_id: subject.department_id,
        program_id: subject.program_id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
        semester_number: subject.semester_number,
        type: subject.type,
        max_internal_marks: subject.max_internal_marks,
        max_external_marks: subject.max_external_marks,
        pass_percentage: subject.pass_percentage,
      });
    } else {
      const initDept = defaultDepartmentId || departments[0]?.id || '';
      const validProgs = programs.filter((p) => !initDept || p.department_id === initDept);
      setFormData({
        department_id: initDept,
        program_id: defaultProgramId || validProgs[0]?.id || '',
        code: '',
        name: '',
        credits: 4,
        semester_number: 1,
        type: 'theory',
        max_internal_marks: 40,
        max_external_marks: 60,
        pass_percentage: 40,
      });
    }
    setError(null);
  }, [subject, isOpen, departments, programs, defaultDepartmentId, defaultProgramId]);

  if (!isOpen) return null;

  const handleDeptChange = (deptId: string) => {
    const validProgs = programs.filter((p) => p.department_id === deptId);
    setFormData({
      ...formData,
      department_id: deptId,
      program_id: validProgs[0]?.id || '',
    });
  };

  const handleTypeChange = (type: 'theory' | 'practical' | 'elective' | 'project') => {
    if (type === 'practical' || type === 'project') {
      setFormData({
        ...formData,
        type,
        credits: type === 'practical' ? 2 : 4,
        max_internal_marks: 50,
        max_external_marks: 50,
        pass_percentage: 50,
      });
    } else {
      setFormData({
        ...formData,
        type,
        credits: 4,
        max_internal_marks: 40,
        max_external_marks: 60,
        pass_percentage: 40,
      });
    }
  };

  const selectedProgram = programs.find((p) => p.id === formData.program_id);
  const maxSemesters = selectedProgram?.total_semesters || 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Subject / Course code is required (e.g. MCA-201, CS-401)');
      return;
    }
    if (!formData.name.trim()) {
      setError('Course title is required');
      return;
    }
    if (formData.credits <= 0) {
      setError('Credits must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(subject ? subject.id : null, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-[#172033]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                {subject ? 'Edit Curriculum Course' : 'Create Curriculum Subject'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Define credits, course type, and assessment evaluation scheme
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Department & Program */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Degree Program *
              </label>
              <select
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              >
                {filteredPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} ({prog.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. MCA-201"
                maxLength={14}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] font-mono uppercase font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Advanced Database Systems & Distributed NoSQL"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
          </div>

          {/* Semester, Type, Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Semester Number *
              </label>
              <select
                value={formData.semester_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    semester_number: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              >
                {Array.from({ length: maxSemesters }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Semester {idx + 1} {idx % 2 === 0 ? '(Odd)' : '(Even)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Classification *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] capitalize"
              >
                <option value="theory">Theory Course</option>
                <option value="practical">Laboratory / Practical</option>
                <option value="elective">Program Elective</option>
                <option value="project">Capstone / Project Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Credits *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
          </div>

          {/* Assessment Scheme Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2747] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D97706]" />
                Assessment Scheme &amp; Evaluation Breakdown
              </span>
              <span className="text-xs font-mono text-[#1E5AA8] font-bold">
                Total: {formData.max_internal_marks + formData.max_external_marks} Marks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Max Internal Marks
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.max_internal_marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_internal_marks: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Max External / End-Sem Marks
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.max_external_marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_external_marks: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:border-[#1E5AA8]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">
                  Passing Percentage (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.pass_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pass_percentage: parseInt(e.target.value) || 40,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:border-[#1E5AA8]"
                />
              </div>
            </div>
          </div>

          {/* Quick Helper */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#1E5AA8] text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Configuring this subject enables automated exam timetable generation, faculty workload tracking, and digital marks entry.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : subject ? 'Update Subject' : 'Add Subject to Curriculum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
