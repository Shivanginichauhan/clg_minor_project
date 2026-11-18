import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
  Upload,
  Download,
  Award,
  AlertTriangle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { StudentDirectory } from '../../components/admin/StudentDirectory.js';
import { FacultyDirectory } from '../../components/admin/FacultyDirectory.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import {
  Department,
  Program,
  AcademicSession,
  Semester
} from '../../types/database.types.js';

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'departments'>('students');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);

  // High-Security Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');

  const loadReferenceData = async () => {
    setLoading(true);
    const [depts, progs, sess, sems, studs, facs] = await Promise.all([
      studentFacultyService.getDepartments(),
      studentFacultyService.getPrograms(),
      studentFacultyService.getSessions(),
      studentFacultyService.getSemesters(),
      studentFacultyService.getStudents(),
      studentFacultyService.getFaculty(),
    ]);

    setDepartments(depts);
    setPrograms(progs);
    setSessions(sess);
    setSemesters(sems);
    setStudentCount(studs.length);
    setFacultyCount(facs.length);
    setLoading(false);
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleExecuteReset = () => {
    if (resetConfirmWord !== 'RESET') {
      alert('Verification Failed: You must type RESET in all caps to confirm.');
      return;
    }
    studentFacultyService.resetDemoData();
    setShowResetModal(false);
    setResetConfirmWord('');
    loadReferenceData();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
              Academic Roster Management
            </span>
            <span className="text-xs text-[#64748B]">
              Academic Session: <span className="text-[#0F2747] font-semibold">{sessions[0]?.name || '2025 - 2026'}</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Student &amp; Faculty Management
          </h1>
          <p className="text-xs text-[#64748B] max-w-2xl">
            Centralized institutional directory for student admissions, roll number assignments, faculty appointments, department mappings, and academic dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/bulk-import"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Import CSV/Excel</span>
          </Link>

          <button
            onClick={() => {
              setResetConfirmWord('');
              setShowResetModal(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
            title="Reset Sample Records"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Directory Data</span>
          </button>
        </div>
      </div>

      {/* High-Level Institutional Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F2747]">{studentCount}</div>
            <div className="text-xs text-[#64748B]">Enrolled Students</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F2747]">{facultyCount}</div>
            <div className="text-xs text-[#64748B]">Appointed Faculty</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F2747]">{departments.length}</div>
            <div className="text-xs text-[#64748B]">Academic Departments</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] border border-amber-200 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F2747]">{programs.length}</div>
            <div className="text-xs text-[#64748B]">Degree Programs</div>
          </div>
        </div>

      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Admissions ({studentCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('faculty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'faculty'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty Directory ({facultyCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0F2747] hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments &amp; Programs</span>
        </button>
      </div>

      {/* Tab Body */}
      {activeTab === 'students' && (
        <StudentDirectory
          departments={departments}
          programs={programs}
          sessions={sessions}
          semesters={semesters}
        />
      )}

      {activeTab === 'faculty' && (
        <FacultyDirectory departments={departments} />
      )}

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-blue-900">
              <Building2 className="w-5 h-5 text-[#1E5AA8] shrink-0" />
              <span>
                Academic Department creation, syllabus curriculum editing, and HOD leadership appointments are governed in the <strong>Academic Structure &amp; Curriculum</strong> module.
              </span>
            </div>
            <Link
              to="/admin/academic-structure"
              className="px-4 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white font-bold shrink-0 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Manage Academic Structure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {departments.map((dept) => {
              const deptPrograms = programs.filter((p) => p.department_id === dept.id);
              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        {dept.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F2747] mt-1.5">{dept.name}</h3>
                      <p className="text-xs text-[#64748B] mt-1">{dept.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#1E5AA8]" />
                      <span>Associated Programs ({deptPrograms.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {deptPrograms.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#172033]">{p.name}</span>
                            <span className="text-[10px] text-[#1E5AA8] font-mono ml-2">({p.code})</span>
                          </div>
                          <span className="text-[11px] text-[#64748B] capitalize">
                            {p.degree_level} &bull; {p.total_semesters} Semesters
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High-Security Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold">Destructive Action: Reset Directory</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                This will delete all custom-provisioned student admission profiles, custom faculty appointments, and department assignments, restoring the institutional database to seed baseline records.
              </p>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 font-medium">
                To confirm this irreversible operation, please type <span className="font-mono font-bold text-rose-700">RESET</span> in the box below:
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Type RESET to confirm"
                  value={resetConfirmWord}
                  onChange={(e) => setResetConfirmWord(e.target.value)}
                  className="w-full font-mono text-center uppercase tracking-widest text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetConfirmWord !== 'RESET'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Confirm Hard Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
