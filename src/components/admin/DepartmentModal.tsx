import React, { useState, useEffect } from 'react';
import { Department } from '../../types/database.types.js';
import { DepartmentFormData } from '../../services/academicStructureService.js';
import { FacultyWithDetails } from '../../data/mockAcademics.js';
import { X, Building2, UserCheck, AlertCircle } from 'lucide-react';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: DepartmentFormData) => Promise<void>;
  department: Department | null;
  facultyList: FacultyWithDetails[];
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  department,
  facultyList,
}) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    code: '',
    name: '',
    description: '',
    head_of_department_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setFormData({
        code: department.code,
        name: department.name,
        description: department.description || '',
        head_of_department_id: department.head_of_department_id || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        head_of_department_id: '',
      });
    }
    setError(null);
  }, [department, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Department code is required (e.g. CSE, IT, ECE)');
      return;
    }
    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(department ? department.id : null, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                {department ? 'Edit Department' : 'Establish New Department'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Configure academic faculties and leadership
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dept Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CSE"
                maxLength={8}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] font-mono uppercase font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description &amp; Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Undergraduate and postgraduate computing disciplines, research laboratories, and systems..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#1E5AA8]" />
                Head of Department (HOD)
              </span>
              <span className="text-[11px] text-[#64748B]">Optional</span>
            </label>
            <select
              value={formData.head_of_department_id || ''}
              onChange={(e) => setFormData({ ...formData, head_of_department_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="">-- No HOD Assigned / In Transition --</option>
              {facultyList.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.profile?.full_name} ({fac.designation} • {fac.employee_id})
                </option>
              ))}
            </select>
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
              {loading ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
