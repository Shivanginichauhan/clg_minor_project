import React from 'react';
import {
  X,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Building,
  Award,
  CalendarCheck,
  ShieldCheck,
  Edit,
  Printer,
  QrCode,
  Sparkles
} from 'lucide-react';
import { StudentWithDetails } from '../../data/mockAcademics.js';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithDetails | null;
  onEdit: (student: StudentWithDetails) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
}) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 text-[#172033]">
        
        {/* Header Banner */}
        <div className="bg-slate-50 p-6 border-b border-slate-200 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={student.profile?.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    student.status === 'active'
                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                      : student.status === 'inactive'
                      ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                      : 'bg-rose-50 text-[#DC2626] border border-rose-200'
                  }`}>
                    {student.status} Student
                  </span>
                  <span className="text-xs text-[#1E5AA8] font-mono font-bold">
                    {student.roll_number}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F2747] tracking-tight">
                  {student.profile?.full_name}
                </h2>
                <p className="text-xs text-[#64748B]">
                  {student.program?.name} &bull; {student.department?.name}
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
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Cumulative CGPA</span>
              <div className="text-lg font-extrabold text-[#0F2747] font-mono">{student.cgpa ? student.cgpa.toFixed(2) : '8.92'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Attendance</span>
              <div className="text-lg font-extrabold text-[#16A34A] font-mono">{student.attendance_avg ? `${student.attendance_avg}%` : '90.0%'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Current Term</span>
              <div className="text-lg font-extrabold text-[#1E5AA8] font-mono">
                Sem {student.current_semester?.semester_number || '2'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Exam Status</span>
              <div className="text-lg font-extrabold text-[#16A34A]">Eligible</div>
            </div>
          </div>

          {/* Academic Info Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Academic Registration Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[#64748B]">Enrollment ID:</span>
                <p className="font-mono font-bold text-[#172033] mt-0.5">{student.enrollment_number}</p>
              </div>
              <div>
                <span className="text-[#64748B]">University Roll No:</span>
                <p className="font-mono font-bold text-[#1E5AA8] mt-0.5">{student.roll_number}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Department:</span>
                <p className="text-[#172033] font-semibold mt-0.5">{student.department?.name} ({student.department?.code})</p>
              </div>
              <div>
                <span className="text-[#64748B]">Academic Program:</span>
                <p className="text-[#172033] font-semibold mt-0.5">{student.program?.name} ({student.program?.degree_level})</p>
              </div>
              <div>
                <span className="text-[#64748B]">Admission Session:</span>
                <p className="text-[#172033] font-medium mt-0.5">{student.session?.name}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Admission Date:</span>
                <p className="text-[#172033] font-medium mt-0.5">{new Date(student.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Personal & Contact Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Personal &amp; Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[#64748B]">Institutional Email:</span>
                <p className="font-medium text-[#172033] mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {student.profile?.email}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Phone Number:</span>
                <p className="font-medium text-[#172033] mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {student.profile?.phone || 'Not recorded'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Date of Birth:</span>
                <p className="font-medium text-[#172033] mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {student.date_of_birth || '2002-04-14'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Gender:</span>
                <p className="font-medium text-[#172033] mt-0.5">{student.gender || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Hall Ticket / Examination Readiness Card */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-[#1E5AA8] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2747]">May 2026 Examination Cycle</h4>
                <p className="text-[11px] text-[#64748B]">
                  Hall Ticket generated &bull; Seating Desk B-14 &bull; Hall 302
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-white text-[#1E5AA8] border border-blue-200 font-bold flex-shrink-0 shadow-2xs">
              #AC-2026-{student.roll_number.replace(/[^A-Za-z0-9]/g, '')}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Student Dossier</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
