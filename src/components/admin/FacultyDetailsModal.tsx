import React from 'react';
import {
  X,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Building,
  BookOpen,
  DoorOpen,
  Award,
  Edit,
  Printer,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { FacultyWithDetails } from '../../data/mockAcademics.js';

interface FacultyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: FacultyWithDetails | null;
  onEdit: (faculty: FacultyWithDetails) => void;
}

export const FacultyDetailsModal: React.FC<FacultyDetailsModalProps> = ({
  isOpen,
  onClose,
  faculty,
  onEdit,
}) => {
  if (!isOpen || !faculty) return null;

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
                src={faculty.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={faculty.profile?.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    faculty.status === 'active'
                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                      : 'bg-amber-50 text-[#D97706] border border-amber-200'
                  }`}>
                    {faculty.status} Faculty
                  </span>
                  <span className="text-xs text-[#1E5AA8] font-mono font-bold">
                    {faculty.employee_id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F2747] tracking-tight">
                  {faculty.profile?.full_name}
                </h2>
                <p className="text-xs text-[#64748B]">
                  {faculty.designation} &bull; {faculty.department?.name}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Assigned Courses</span>
              <div className="text-lg font-extrabold text-[#1E5AA8] font-mono">{faculty.assigned_subject_count || 2} Courses</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Exam Duties</span>
              <div className="text-lg font-extrabold text-[#0F2747] font-mono">2 Assigned</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Marks Status</span>
              <div className="text-lg font-extrabold text-[#D97706] font-mono">1 Pending</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] text-[#64748B] font-semibold uppercase">Attendance Log</span>
              <div className="text-lg font-extrabold text-[#16A34A] font-mono">94.8%</div>
            </div>
          </div>

          {/* Appointment Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>University Appointment Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[#64748B]">Employee ID:</span>
                <p className="font-mono font-bold text-[#1E5AA8] mt-0.5">{faculty.employee_id}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Academic Designation:</span>
                <p className="font-bold text-[#172033] mt-0.5">{faculty.designation}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Department:</span>
                <p className="text-[#172033] font-semibold mt-0.5">{faculty.department?.name} ({faculty.department?.code})</p>
              </div>
              <div>
                <span className="text-[#64748B]">Date of Joining:</span>
                <p className="text-[#172033] font-medium mt-0.5">{faculty.joining_date || '2019-06-15'}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#64748B]">Domain Specialization:</span>
                <p className="text-[#172033] font-medium mt-0.5">{faculty.specialization || 'Distributed Computing & Database Management Systems'}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Contact &amp; Institutional Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[#64748B]">Official Email:</span>
                <p className="font-medium text-[#172033] mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {faculty.profile?.email}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Contact Number:</span>
                <p className="font-medium text-[#172033] mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {faculty.profile?.phone || '+91 98450 11223'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Duties Highlight */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-[#1E5AA8] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0F2747]">Active Invigilation Order</h4>
                <p className="text-[11px] text-[#64748B]">
                  Hall 302 &bull; Chief Invigilator &bull; 15 May 2026 (10:00 AM - 01:00 PM)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-white text-[#1E5AA8] border border-blue-200 shadow-2xs">
              Confirmed
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
            <span>Print Appointment Card</span>
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
                onEdit(faculty);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Appointment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
