import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  BookOpen,
  Clock,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AssignedSubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFacultyCourses = async () => {
      setLoading(true);
      try {
        const allAllocs = await academicStructureService.getAllocations();
        // Role-based filtering: Dean/Admin see all, Faculty sees strictly their own allocations
        const facultyAllocs = allAllocs.filter((a) => {
          if (!user) return false;
          if (user.role === 'administrator' || user.role === 'dean') return true;
          return (
            a.faculty_id === user.id ||
            a.faculty?.id === user.id ||
            a.faculty?.profile?.id === user.id ||
            a.faculty?.user_id === user.id
          );
        });
        setAllocations(facultyAllocs);
      } catch (err) {
        console.error('Failed to fetch assigned courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyCourses();
  }, [user]);

  const totalWeeklyHours = allocations.reduce((acc, a) => acc + a.weekly_hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E5AA8] mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Faculty Academic Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            My Assigned Teaching Courses
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Active courses, syllabus evaluation schemes, and teaching workload for current session.
          </p>
        </div>

        {/* Quick metrics */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-[#64748B] block font-medium">Assigned Courses</span>
            <span className="text-base font-bold text-[#0F2747] font-mono">
              {allocations.length}
            </span>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-[#64748B] block font-medium">Workload</span>
            <span className="text-base font-bold text-[#1E5AA8] font-mono">
              {totalWeeklyHours} hrs/wk
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#64748B] bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading course schedule and teaching assignments...</p>
        </div>
      ) : allocations.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#0F2747]">No Subjects Assigned Yet</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You do not have any teaching allocations assigned for the current academic session. Contact your HOD or Dean.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allocations.map((alloc) => {
            const subject = alloc.subject;
            if (!subject) return null;

            return (
              <div
                key={alloc.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1E5AA8] transition flex flex-col justify-between shadow-xs group"
              >
                {/* Header Banner */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0F2747] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {subject.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                          {alloc.role.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#172033] group-hover:text-[#1E5AA8] transition pt-1">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {subject.program?.name} ({subject.program?.code}) • Semester {subject.semester_number}
                      </p>
                    </div>
                  </div>

                  {/* Course Details Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-[#64748B] block font-medium">Credits</span>
                      <span className="font-bold text-[#1E5AA8] font-mono">
                        {subject.credits} Credits
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-[#64748B] block font-medium">Teaching Hours</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {alloc.weekly_hours} hrs/wk
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-[#64748B] block font-medium">Course Type</span>
                      <span className="font-bold text-[#172033] capitalize">
                        {subject.type}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Scheme Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        Internal Evaluation:
                      </span>
                      <span className="font-mono font-bold text-[#0F2747]">
                        {subject.max_internal_marks} Marks
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#1E5AA8]" />
                        End-Semester University Exam:
                      </span>
                      <span className="font-mono font-bold text-[#0F2747]">
                        {subject.max_external_marks} Marks
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#64748B] text-[11px] pt-1 border-t border-slate-200">
                      <span>Total Marks: {subject.max_internal_marks + subject.max_external_marks}</span>
                      <span>Min Passing: {subject.pass_percentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/faculty/attendance?subjectId=${subject.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Attendance</span>
                    </Link>
                    <Link
                      to={`/faculty/materials?subject=${subject.code}`}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#1E5AA8] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#1E5AA8]" />
                      <span>Materials</span>
                    </Link>
                  </div>

                  <Link
                    to={`/faculty/marks?subjectId=${subject.id}`}
                    className="px-3 py-1.5 rounded-lg bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <span>Enter Marks</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
