import React, { useState, useEffect } from 'react';
import { Program, Department } from '../../types/database.types.js';
import { ProgramFormData } from '../../services/academicStructureService.js';
import { X, GraduationCap, AlertCircle } from 'lucide-react';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: ProgramFormData) => Promise<void>;
  program: Program | null;
  departments: Department[];
  defaultDepartmentId?: string;
}

export const ProgramModal: React.FC<ProgramModalProps> = ({
  isOpen,
  onClose,
  onSave,
  program,
  departments,
  defaultDepartmentId,
}) => {
  const [formData, setFormData] = useState<ProgramFormData>({
    department_id: defaultDepartmentId || departments[0]?.id || '',
    code: '',
    name: '',
    degree_level: 'postgraduate',
    total_semesters: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (program) {
      setFormData({
        department_id: program.department_id,
        code: program.code,
        name: program.name,
        degree_level: program.degree_level,
        total_semesters: program.total_semesters,
      });
    } else {
      setFormData({
        department_id: defaultDepartmentId || departments[0]?.id || '',
        code: '',
        name: '',
        degree_level: 'postgraduate',
        total_semesters: 4,
      });
    }
    setError(null);
  }, [program, isOpen, departments, defaultDepartmentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id) {
      setError('Please select an offering department');
      return;
    }
    if (!formData.code.trim()) {
      setError('Program code is required (e.g. MCA, BTECH-CSE)');
      return;
    }
    if (!formData.name.trim()) {
      setError('Program degree name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(program ? program.id : null, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save degree program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#172033]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                {program ? 'Edit Degree Program' : 'Charter New Degree Program'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Define curriculum duration and academic degree level
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Host Department *
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Program Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. MCA"
                maxLength={12}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] font-mono uppercase font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Degree Program Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Master of Computer Applications"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Degree Level
              </label>
              <select
                value={formData.degree_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    degree_level: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] capitalize"
              >
                <option value="undergraduate">Undergraduate (UG)</option>
                <option value="postgraduate">Postgraduate (PG)</option>
                <option value="diploma">Diploma / Certificate</option>
                <option value="doctorate">Doctorate (Ph.D)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duration (Semesters) *
              </label>
              <select
                value={formData.total_semesters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_semesters: parseInt(e.target.value) || 4,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              >
                <option value={2}>2 Semesters (1 Year)</option>
                <option value={4}>4 Semesters (2 Years - PG)</option>
                <option value={6}>6 Semesters (3 Years - UG/Diploma)</option>
                <option value={8}>8 Semesters (4 Years - B.Tech / Engg)</option>
                <option value={10}>10 Semesters (5 Years - Integrated)</option>
              </select>
            </div>
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
              {loading ? 'Saving...' : program ? 'Update Program' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
