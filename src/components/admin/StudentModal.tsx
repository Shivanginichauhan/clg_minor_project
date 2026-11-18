import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash
} from 'lucide-react';
import {
  StudentFormData,
  studentFacultyService
} from '../../services/studentFacultyService.js';
import {
  Department,
  Program,
  AcademicSession,
  Semester,
  UserStatus
} from '../../types/database.types.js';
import { StudentWithDetails } from '../../data/mockAcademics.js';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentWithDetails) => void;
  studentToEdit?: StudentWithDetails | null;
  departments: Department[];
  sessions: AcademicSession[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentToEdit,
  departments,
  sessions,
}) => {
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    email: '',
    phone: '',
    enrollmentNumber: '',
    rollNumber: '',
    departmentId: '',
    programId: '',
    semesterId: '',
    sessionId: '',
    dateOfBirth: '',
    gender: 'Male',
    status: 'active',
  });

  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        fullName: studentToEdit.profile?.full_name || '',
        email: studentToEdit.profile?.email || '',
        phone: studentToEdit.profile?.phone || '',
        enrollmentNumber: studentToEdit.enrollment_number || '',
        rollNumber: studentToEdit.roll_number || '',
        departmentId: studentToEdit.department_id || departments[0]?.id || '',
        programId: studentToEdit.program_id || '',
        semesterId: studentToEdit.current_semester_id || '',
        sessionId: studentToEdit.admission_session_id || sessions[0]?.id || '',
        dateOfBirth: studentToEdit.date_of_birth || '',
        gender: studentToEdit.gender || 'Male',
        status: studentToEdit.status || 'active',
      });
    } else {
      const defaultDept = departments[0]?.id || '';
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        enrollmentNumber: '',
        rollNumber: '',
        departmentId: defaultDept,
        programId: '',
        semesterId: '',
        sessionId: sessions.find((s) => s.is_current)?.id || sessions[0]?.id || '',
        dateOfBirth: '2002-05-14',
        gender: 'Male',
        status: 'active',
      });
    }
  }, [studentToEdit, isOpen, departments, sessions]);

  // Load programs when department changes
  useEffect(() => {
    const updatePrograms = async () => {
      if (formData.departmentId) {
        const progs = await studentFacultyService.getPrograms(formData.departmentId);
        setAvailablePrograms(progs);
        if (progs.length > 0 && (!formData.programId || !progs.some((p) => p.id === formData.programId))) {
          setFormData((prev) => ({ ...prev, programId: progs[0].id }));
        }
      }
    };
    updatePrograms();
  }, [formData.departmentId]);

  // Load semesters when program changes
  useEffect(() => {
    const updateSemesters = async () => {
      if (formData.programId) {
        const sems = await studentFacultyService.getSemesters(formData.programId);
        setAvailableSemesters(sems);
        if (sems.length > 0 && (!formData.semesterId || !sems.some((s) => s.id === formData.semesterId))) {
          setFormData((prev) => ({ ...prev, semesterId: sems[0].id }));
        }
      }
    };
    updateSemesters();
  }, [formData.programId]);

  if (!isOpen) return null;

  const handleGenerateCodes = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const progCode = availablePrograms.find((p) => p.id === formData.programId)?.code || 'MCA';
    setFormData((prev) => ({
      ...prev,
      enrollmentNumber: `ENR-${year}-${progCode}-${rand}`,
      rollNumber: `${year}-${progCode}-0${Math.floor(10 + Math.random() * 80)}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (studentToEdit) {
        const updated = await studentFacultyService.updateStudent(studentToEdit.id, formData);
        if (updated) {
          onSuccess(updated);
          onClose();
        } else {
          setError('Failed to update student record.');
        }
      } else {
        const created = await studentFacultyService.createStudent(formData);
        if (created) {
          onSuccess(created);
          onClose();
        } else {
          setError('Failed to create student admission.');
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
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F2747]">
                {studentToEdit ? 'Edit Student Record' : 'Register New Student Admission'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {studentToEdit ? 'Update academic enrollment & personal details' : 'Create profile, assign roll number & program'}
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

          {/* Personal Info Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
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
                  placeholder="e.g. priya.mca@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              {!studentToEdit && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#172033] font-semibold">Portal Initial Password</label>
                    <span className="text-[10px] text-slate-400">Default: Student@123</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Student@123 (or custom password)"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-[#172033] font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#172033] font-semibold">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Identifiers */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>Academic Identifiers &amp; Numbers</span>
              </h3>
              {!studentToEdit && (
                <button
                  type="button"
                  onClick={handleGenerateCodes}
                  className="text-[11px] text-[#1E5AA8] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-generate IDs
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Enrollment Number *</label>
                <input
                  type="text"
                  required
                  placeholder="ENR-2025-MCA-001"
                  value={formData.enrollmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-[#0F2747] font-bold focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">University Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="2025-MCA-042"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-[#1E5AA8] font-bold focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                />
              </div>
            </div>
          </div>

          {/* Department, Program & Semester */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E5AA8] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Program &amp; Semester Allocation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Academic Program *</label>
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  {availablePrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Current Semester</label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  {availableSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      Semester {s.semester_number} ({s.term_type.toUpperCase()} Term)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#172033] font-semibold">Admission Academic Session</label>
                <select
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_current ? '(Current Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-[#172033] font-semibold">Account Status</label>
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
                        name="status"
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
              <span>{loading ? 'Saving...' : studentToEdit ? 'Update Student Record' : 'Complete Admission'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
