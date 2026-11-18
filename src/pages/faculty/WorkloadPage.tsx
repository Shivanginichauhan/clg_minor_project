import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { classMentorshipService } from '../../services/classMentorshipService.js';
import { seatingService } from '../../services/seatingService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  Clock,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Users,
  DoorOpen,
  ShieldCheck,
  Award,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const WorkloadPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allAllocs = await academicStructureService.getAllocations();
        const facultyAllocs = allAllocs.filter((a) => {
          if (!user) return true;
          return a.faculty_id === user.id || a.faculty?.profile?.id === user.id;
        });
        setAllocations(facultyAllocs.length > 0 ? facultyAllocs : allAllocs.slice(0, 3));
      } catch (err) {
        console.error('Failed to load workload data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Workload calculations based on active allocations
  const lectureHours = allocations.length * 4; // average 4 hrs per course
  const labHours = 4; // practical sessions
  const mentoringHours = 2; // class cohort mentoring
  const examDutyHours = 2; // invigilation & evaluation
  const administrativeHours = 2; // department meetings & curriculum review
  const totalHours = lectureHours + labHours + mentoringHours + examDutyHours;
  const ugcStandardHours = 20;
  const isCompliant = totalHours <= ugcStandardHours;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Institutional Workload &amp; UGC Compliance
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §17 Faculty Audit</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Faculty Workload &amp; Teaching Hours
            </h1>
            <p className="text-xs text-[#64748B]">
              Integrated calculation of direct instructional hours, laboratory oversight, mentorship cohorts, and examination evaluation duties.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Workload Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workload Summary Card */}
      <div className="academic-card p-6 space-y-5 border-l-4 border-l-emerald-600 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Current Weekly Allocated Hours
            </div>
            <div className="text-3xl font-extrabold text-[#0F2747] font-mono mt-1">
              {totalHours} <span className="text-base font-normal text-slate-500">/ {ugcStandardHours} Hours Maximum</span>
            </div>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                isCompliant
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{isCompliant ? 'Compliant with UGC 2026 Norms' : 'Workload Exceeds Threshold'}</span>
            </span>
          </div>
        </div>

        {/* Multi-Segment Workload Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 rounded-full h-3.5 flex overflow-hidden p-0.5">
            <div
              className="bg-blue-600 h-2.5 rounded-l-full"
              style={{ width: `${(lectureHours / ugcStandardHours) * 100}%` }}
              title={`Lectures: ${lectureHours} hrs`}
            />
            <div
              className="bg-indigo-600 h-2.5"
              style={{ width: `${(labHours / ugcStandardHours) * 100}%` }}
              title={`Labs: ${labHours} hrs`}
            />
            <div
              className="bg-amber-500 h-2.5"
              style={{ width: `${(mentoringHours / ugcStandardHours) * 100}%` }}
              title={`Mentoring: ${mentoringHours} hrs`}
            />
            <div
              className="bg-emerald-600 h-2.5"
              style={{ width: `${(examDutyHours / ugcStandardHours) * 100}%` }}
              title={`Exam Duties: ${examDutyHours} hrs`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Lectures ({lectureHours} hrs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Practicals &amp; Labs ({labHours} hrs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Mentorship ({mentoringHours} hrs)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Exam Duties ({examDutyHours} hrs)
            </span>
            <span className="ml-auto font-mono text-emerald-700">
              {ugcStandardHours - totalHours} hrs available for R&amp;D
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Lectures</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">{lectureHours} hrs</div>
          <p className="text-[11px] text-slate-500">Across {allocations.length} allocated courses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Practicals &amp; Labs</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">{labHours} hrs</div>
          <p className="text-[11px] text-slate-500">2 Laboratory practical batches</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Class Mentorship</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">{mentoringHours} hrs</div>
          <p className="text-[11px] text-slate-500">Cohort counseling &amp; parent check-ins</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Exam Duties</span>
            <DoorOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">{examDutyHours} hrs</div>
          <p className="text-[11px] text-slate-500">Invigilation &amp; CoE evaluation desk</p>
        </div>
      </div>

      {/* Course-Wise Teaching Distribution Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Course-Wise Instructional Commitments
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Academic Session 2025-26</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject Code &amp; Title</th>
                <th className="py-3 px-4 text-center">Program</th>
                <th className="py-3 px-4 text-center">Credits (L-T-P)</th>
                <th className="py-3 px-4 text-center">Role</th>
                <th className="py-3 px-4 text-center">Weekly Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#172033]">{a.subject?.code}</span> &bull; {a.subject?.name}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{a.subject?.program?.code || 'MCA'}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {a.subject?.credits || 4} ({Math.max(1, (a.subject?.credits || 4) - 1)}-1-0)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {a.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#1E5AA8]">4.0 hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
