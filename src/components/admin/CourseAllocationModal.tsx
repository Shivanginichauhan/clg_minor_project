import React, { useState, useEffect } from 'react';
import { AcademicSession } from '../../types/database.types.js';
import { AllocationFormData } from '../../services/academicStructureService.js';
import { SubjectWithDetails, FacultyWithDetails } from '../../data/mockAcademics.js';
import { X, UserCheck, AlertCircle, Clock, BookOpen } from 'lucide-react';

interface CourseAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AllocationFormData) => Promise<void>;
  subjects: SubjectWithDetails[];
  facultyList: FacultyWithDetails[];
  sessions: AcademicSession[];
  defaultSubjectId?: string;
  defaultFacultyId?: string;
}

export const CourseAllocationModal: React.FC<CourseAllocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subjects,
  facultyList,
  sessions,
  defaultSubjectId,
  defaultFacultyId,
}) => {
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const [formData, setFormData] = useState<AllocationFormData>({
    subject_id: defaultSubjectId || subjects[0]?.id || '',
    faculty_id: defaultFacultyId || facultyList[0]?.id || '',
    session_id: currentSession?.id || '',
    role: 'primary_instructor',
    weekly_hours: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize form values whenever modal opens or subject/faculty/session lists populate
  useEffect(() => {
    if (isOpen) {
      const activeSession = sessions.find((s) => s.is_current) || sessions[0];
      setFormData({
        subject_id: defaultSubjectId || subjects[0]?.id || '',
        faculty_id: defaultFacultyId || facultyList[0]?.id || '',
        session_id: activeSession?.id || '',
        role: 'primary_instructor',
        weekly_hours: 4,
      });
      setError(null);
    }
  }, [isOpen, defaultSubjectId, defaultFacultyId, subjects, facultyList, sessions]);

  if (!isOpen) return null;

  const selectedSubject = subjects.find((s) => s.id === (formData.subject_id || subjects[0]?.id));
  const selectedFaculty = facultyList.find((f) => f.id === (formData.faculty_id || facultyList[0]?.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeSession = sessions.find((s) => s.is_current) || sessions[0];
    const resolvedSubjectId = formData.subject_id || defaultSubjectId || subjects[0]?.id;
    const resolvedFacultyId = formData.faculty_id || defaultFacultyId || facultyList[0]?.id;
    const resolvedSessionId = formData.session_id || activeSession?.id;

    if (!resolvedSubjectId || !resolvedFacultyId || !resolvedSessionId) {
      setError('Please fill all required allocation fields');
      return;
    }

    const payload: AllocationFormData = {
      ...formData,
      subject_id: resolvedSubjectId,
      faculty_id: resolvedFacultyId,
      session_id: resolvedSessionId,
    };

    try {
      setLoading(true);
      setError(null);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate subject');
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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                Assign Subject to Faculty
              </h3>
              <p className="text-xs text-[#64748B]">
                Allocate course workload and instruction responsibilities
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
              Academic Session *
            </label>
            <select
              value={formData.session_id}
              onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              required
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.name} {sess.is_current ? '(Current Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Course / Subject *
            </label>
            <select
              value={formData.subject_id}
              onChange={(e) => {
                const sub = subjects.find((s) => s.id === e.target.value);
                setFormData({
                  ...formData,
                  subject_id: e.target.value,
                  weekly_hours: sub?.type === 'practical' ? 3 : 4,
                  role: sub?.type === 'practical' ? 'lab_incharge' : 'primary_instructor',
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  [{sub.code}] {sub.name} (Sem {sub.semester_number} • {sub.program?.code} • {sub.credits} Credits)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Appointed Faculty Member *
            </label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              required
            >
              {facultyList.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.profile?.full_name} — {fac.designation} ({fac.department?.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Instruction Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              >
                <option value="primary_instructor">Primary Instructor / Course Lead</option>
                <option value="co_instructor">Co-Instructor</option>
                <option value="lab_incharge">Lab Incharge / Practical Faculty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Weekly Teaching Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.weekly_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, weekly_hours: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8] pl-9"
                  required
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Summary Preview Box */}
          {selectedSubject && selectedFaculty && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="text-slate-700 font-medium">
                Assigning <span className="text-[#0F2747] font-bold">{selectedFaculty.profile?.full_name}</span> to teach{' '}
                <span className="text-[#1E5AA8] font-bold">{selectedSubject.code}: {selectedSubject.name}</span>.
              </div>
              <div className="text-[11px] text-[#64748B]">
                Department: {selectedSubject.department?.name} • Program: {selectedSubject.program?.code}
              </div>
            </div>
          )}

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
              {loading ? 'Assigning...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
