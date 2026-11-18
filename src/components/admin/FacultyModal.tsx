import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
  Calendar
} from 'lucide-react';
import {
  FacultyFormData,
  studentFacultyService
} from '../../services/studentFacultyService.js';
import { Department, UserStatus } from '../../types/database.types.js';
import { FacultyWithDetails } from '../../data/mockAcademics.js';

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (faculty: FacultyWithDetails) => void;
  facultyToEdit?: FacultyWithDetails | null;
  departments: Department[];
}

export const FacultyModal: React.FC<FacultyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  facultyToEdit,
  departments,
}) => {
  const [formData, setFormData] = useState<FacultyFormData>({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    departmentId: '',
    designation: 'Assistant Professor',
    specialization: '',
    joiningDate: '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const designations = [
    'Professor & HOD',
    'Professor',
    'Associate Professor',
    'Assistant Professor (Senior Grade)',
    'Assistant Professor',
    'Visiting Faculty / Lecturer',
  ];

  useEffect(() => {
    if (facultyToEdit) {
      setFormData({
        fullName: facultyToEdit.profile?.full_name || '',
        email: facultyToEdit.profile?.email || '',
        phone: facultyToEdit.profile?.phone || '',
        employeeId: facultyToEdit.employee_id,
        departmentId: facultyToEdit.department_id,
        designation: facultyToEdit.designation,
        specialization: facultyToEdit.specialization || '',
        joiningDate: facultyToEdit.joining_date || '',
        status: facultyToEdit.status || 'active',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        employeeId: '',
        departmentId: departments[0]?.id || '',
        designation: 'Assistant Professor',
        specialization: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        status: 'active',
      });
    }
  }, [facultyToEdit, isOpen, departments]);

  if (!isOpen) return null;

  const handleGenerateEmployeeId = () => {
    const dept = departments.find((d) => d.id === formData.departmentId)?.code || 'CSE';
    const rand = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({
      ...prev,
      employeeId: `FAC-${dept}-${rand}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (facultyToEdit) {
        const updated = await studentFacultyService.updateFaculty(facultyToEdit.id, formData);
        if (updated) {
          onSuccess(updated);
          onClose();
        } else {
          setError('Failed to update faculty record.');
        }
      } else {
        const created = await studentFacultyService.createFaculty(formData);
        if (created) {
          onSuccess(created);
          onClose();
        } else {
          setError('Failed to appoint faculty member.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 text-[#172033]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">
                {facultyToEdit ? 'Edit Faculty Appointment' : 'Register Faculty Appointment'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {facultyToEdit ? 'Update designation, department & specialization' : 'Create faculty profile and assign employee ID'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Faculty Member Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Full Name (with Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Nambiar"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.nambiar@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98450 11223"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              {!facultyToEdit && (
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#172033] font-semibold">Portal Initial Password</label>
                    <span className="text-[10px] text-slate-400">Default: Faculty@123</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Faculty@123 (or custom password)"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Academic Designation & Department */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Appointment &amp; Department Allocation</span>
              </h3>
              {!facultyToEdit && (
                <button
                  type="button"
                  onClick={handleGenerateEmployeeId}
                  className="text-[11px] text-[#1E5AA8] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-generate ID
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Employee ID *</label>
                <input
                  type="text"
                  required
                  placeholder="FAC-CSE-018"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-[#1E5AA8] font-bold focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Department *</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#172033] font-semibold">Academic Designation *</label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  {designations.map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#172033] font-semibold">Academic Specialization / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Database Management Systems, Data Warehousing, Cryptography"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#172033] font-semibold">Employment Status</label>
                <div className="flex items-center gap-3">
                  {(['active', 'inactive', 'suspended'] as UserStatus[]).map((st) => (
                    <label
                      key={st}
                      className={`flex-1 p-2 rounded-xl border text-center text-xs font-semibold uppercase cursor-pointer transition ${
                        formData.status === st
                          ? st === 'active'
                            ? 'bg-emerald-50 text-[#16A34A] border-emerald-300'
                            : st === 'inactive'
                            ? 'bg-amber-50 text-[#D97706] border-amber-300'
                            : 'bg-rose-50 text-[#DC2626] border-rose-300'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="facultyStatus"
                        value={st}
                        checked={formData.status === st}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                        className="sr-only"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : facultyToEdit ? 'Update Faculty Record' : 'Appoint Faculty'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
