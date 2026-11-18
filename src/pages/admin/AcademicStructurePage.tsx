import React, { useState, useEffect } from 'react';
import { Department, Program, AcademicSession, Semester } from '../../types/database.types.js';
import {
  academicStructureService,
  DepartmentFormData,
  ProgramFormData,
  SemesterFormData,
  SubjectFormData,
  AllocationFormData
} from '../../services/academicStructureService.js';
import { studentFacultyService } from '../../services/studentFacultyService.js';
import { SubjectWithDetails, FacultyWithDetails, FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import { SubjectDirectory } from '../../components/admin/SubjectDirectory.js';
import { DepartmentProgramDirectory } from '../../components/admin/DepartmentProgramDirectory.js';
import { CourseAllocationsDirectory } from '../../components/admin/CourseAllocationsDirectory.js';
import { CurriculumMatrixView } from '../../components/admin/CurriculumMatrixView.js';
import { DepartmentModal } from '../../components/admin/DepartmentModal.js';
import { ProgramModal } from '../../components/admin/ProgramModal.js';
import { SessionModal } from '../../components/admin/SessionModal.js';
import { SemesterModal } from '../../components/admin/SemesterModal.js';
import { SubjectModal } from '../../components/admin/SubjectModal.js';
import { CourseAllocationModal } from '../../components/admin/CourseAllocationModal.js';
import {
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  UserCheck,
  Layers,
  Sparkles,
  Award,
  AlertTriangle,
  X
} from 'lucide-react';
import { auditService } from '../../services/auditService.js';

export const AcademicStructurePage: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'subjects' | 'hierarchy' | 'allocations' | 'matrix'>('subjects');

  // Academic State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [progModalOpen, setProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Program | null>(null);
  const [defaultDeptIdForProg, setDefaultDeptIdForProg] = useState<string | undefined>();

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);

  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithDetails | null>(null);

  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [defaultSubjectIdForAlloc, setDefaultSubjectIdForAlloc] = useState<string | undefined>();

  const [selectedProgramForMatrix, setSelectedProgramForMatrix] = useState<string | undefined>();

  // High-security Cascade Delete Guard
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'department' | 'program';
    name: string;
    cascadeCount: number;
    cascadeDesc: string;
  } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [depts, progs, sess, sems, subs, allocs, facs] = await Promise.all([
        academicStructureService.getDepartments(),
        academicStructureService.getPrograms(),
        academicStructureService.getSessions(),
        academicStructureService.getSemesters(),
        academicStructureService.getSubjects(),
        academicStructureService.getAllocations(),
        studentFacultyService.getFaculty(),
      ]);

      setDepartments(depts);
      setPrograms(progs);
      setSessions(sess);
      setSemesters(sems);
      setSubjects(subs);
      setAllocations(allocs);
      setFacultyList(facs);
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department Handlers
  const handleSaveDept = async (id: string | null, data: DepartmentFormData) => {
    await academicStructureService.saveDepartment(id, data);
    await fetchData();
  };

  const handleDeleteDept = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    const linkedProgs = programs.filter((p) => p.department_id === id);
    setDeleteTarget({
      id,
      type: 'department',
      name: dept?.name || 'Academic Department',
      cascadeCount: linkedProgs.length,
      cascadeDesc: `${linkedProgs.length} academic programs, active subjects, and candidate mark records.`,
    });
    setDeleteConfirmationText('');
  };

  // Program Handlers
  const handleSaveProg = async (id: string | null, data: ProgramFormData) => {
    await academicStructureService.saveProgram(id, data);
    await fetchData();
  };

  const handleDeleteProg = (id: string) => {
    const prog = programs.find((p) => p.id === id);
    const linkedSubs = subjects.filter((s) => s.program_id === id);
    setDeleteTarget({
      id,
      type: 'program',
      name: prog?.name || 'Academic Degree Program',
      cascadeCount: linkedSubs.length,
      cascadeDesc: `${linkedSubs.length} course subjects and active cohort registrations.`,
    });
    setDeleteConfirmationText('');
  };

  const handleConfirmCascadeDelete = async () => {
    if (!deleteTarget || deleteConfirmationText !== 'DELETE') return;

    if (deleteTarget.type === 'department') {
      await academicStructureService.deleteDepartment(deleteTarget.id);
      auditService.logAction({
        action: 'DEPARTMENT_CASCADE_DELETE',
        entity_type: 'academic_structure',
        entity_id: deleteTarget.id,
        entity_name: deleteTarget.name,
        description: `Administrator confirmed cascade destruction of department "${deleteTarget.name}".`,
        severity: 'security',
      });
    } else {
      await academicStructureService.deleteProgram(deleteTarget.id);
      auditService.logAction({
        action: 'PROGRAM_CASCADE_DELETE',
        entity_type: 'academic_structure',
        entity_id: deleteTarget.id,
        entity_name: deleteTarget.name,
        description: `Administrator confirmed deletion of academic program "${deleteTarget.name}".`,
        severity: 'security',
      });
    }

    setDeleteTarget(null);
    await fetchData();
  };

  // Session Handlers
  const handleSaveSession = async (id: string | null, data: any) => {
    await academicStructureService.saveSession(id, data);
    await fetchData();
  };

  // Semester Handlers
  const handleSaveSemester = async (id: string | null, data: SemesterFormData) => {
    if (id) {
      await academicStructureService.updateSemester(id, data);
    } else {
      await academicStructureService.createSemester(data);
    }
    await fetchData();
  };

  const handleDeleteSemester = async (id: string) => {
    await academicStructureService.deleteSemester(id);
    await fetchData();
  };

  // Subject Handlers
  const handleSaveSubject = async (id: string | null, data: SubjectFormData) => {
    await academicStructureService.saveSubject(id, data);
    await fetchData();
  };

  const handleDeleteSubject = async (id: string) => {
    await academicStructureService.deleteSubject(id);
    await fetchData();
  };

  // Allocation Handlers
  const handleSaveAllocation = async (data: AllocationFormData) => {
    await academicStructureService.saveAllocation(data);
    await fetchData();
  };

  const handleDeleteAllocation = async (id: string) => {
    await academicStructureService.deleteAllocation(id);
    await fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E5AA8] mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Affairs &amp; Governance</span>
            <span className="text-slate-400">•</span>
            <span className="text-[#64748B]">Curriculum Catalog</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2747] tracking-tight">
            Academic Structure &amp; Subject Management
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Manage institutional departments, degree programs, curriculum courses, and faculty teaching allocations.
          </p>
        </div>

        {/* Global Quick Metrics */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-medium">Departments</span>
            <span className="text-sm font-bold text-[#0F2747] font-mono">
              {departments.length}
            </span>
          </div>
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-medium">Programs</span>
            <span className="text-sm font-bold text-[#1E5AA8] font-mono">
              {programs.length}
            </span>
          </div>
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-medium">Total Courses</span>
            <span className="text-sm font-bold text-[#0F2747] font-mono">
              {subjects.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('subjects')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'subjects'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Subject Catalog ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('allocations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'allocations'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Faculty Course Allocations ({allocations.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'matrix'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum &amp; Credit Matrix</span>
        </button>

        <button
          onClick={() => setActiveMainTab('hierarchy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeMainTab === 'hierarchy'
              ? 'bg-[#0F2747] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments, Programs &amp; Sessions</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      {loading ? (
        <div className="p-16 text-center text-[#64748B] bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading academic databases and curriculum catalogs...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: SUBJECTS CATALOG */}
          {activeMainTab === 'subjects' && (
            <SubjectDirectory
              subjects={subjects}
              departments={departments}
              programs={programs}
              sessions={sessions}
              facultyList={facultyList}
              onOpenSubjectModal={(sub) => {
                setEditingSubject(sub || null);
                setSubjectModalOpen(true);
              }}
              onOpenAllocateModal={(subId) => {
                setDefaultSubjectIdForAlloc(subId);
                setAllocateModalOpen(true);
              }}
              onDeleteSubject={handleDeleteSubject}
              onRefresh={fetchData}
            />
          )}

          {/* TAB 2: COURSE ALLOCATIONS */}
          {activeMainTab === 'allocations' && (
            <CourseAllocationsDirectory
              allocations={allocations}
              facultyList={facultyList}
              subjects={subjects}
              sessions={sessions}
              onOpenAllocateModal={() => {
                setDefaultSubjectIdForAlloc(undefined);
                setAllocateModalOpen(true);
              }}
              onDeleteAllocation={handleDeleteAllocation}
              onRefresh={fetchData}
            />
          )}

          {/* TAB 3: CURRICULUM & CREDIT MATRIX */}
          {activeMainTab === 'matrix' && (
            <CurriculumMatrixView
              programs={programs}
              departments={departments}
              selectedProgramId={selectedProgramForMatrix}
              onOpenSubjectModal={(sub) => {
                setEditingSubject(sub || null);
                setSubjectModalOpen(true);
              }}
            />
          )}

          {/* TAB 4: DEPARTMENTS & DEGREE PROGRAMS */}
          {activeMainTab === 'hierarchy' && (
            <DepartmentProgramDirectory
              departments={departments}
              programs={programs}
              sessions={sessions}
              semesters={semesters}
              facultyList={facultyList}
              subjects={subjects}
              onOpenDeptModal={(dept) => {
                setEditingDept(dept || null);
                setDeptModalOpen(true);
              }}
              onOpenProgModal={(prog, defaultDeptId) => {
                setEditingProg(prog || null);
                setDefaultDeptIdForProg(defaultDeptId);
                setProgModalOpen(true);
              }}
              onOpenSessionModal={(sess) => {
                setEditingSession(sess || null);
                setSessionModalOpen(true);
              }}
              onOpenSemesterModal={(sem) => {
                setEditingSemester(sem || null);
                setSemesterModalOpen(true);
              }}
              onDeleteDept={handleDeleteDept}
              onDeleteProg={handleDeleteProg}
              onDeleteSemester={handleDeleteSemester}
              onSelectProgramForCurriculum={(progId) => {
                setSelectedProgramForMatrix(progId);
                setActiveMainTab('matrix');
              }}
            />
          )}
        </div>
      )}

      {/* MODALS */}
      <DepartmentModal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        onSave={handleSaveDept}
        department={editingDept}
        facultyList={facultyList}
      />

      <ProgramModal
        isOpen={progModalOpen}
        onClose={() => setProgModalOpen(false)}
        onSave={handleSaveProg}
        program={editingProg}
        departments={departments}
        defaultDepartmentId={defaultDeptIdForProg}
      />

      <SessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        onSave={handleSaveSession}
        session={editingSession}
      />

      <SemesterModal
        isOpen={semesterModalOpen}
        onClose={() => setSemesterModalOpen(false)}
        onSave={handleSaveSemester}
        semester={editingSemester}
        programs={programs}
        sessions={sessions}
      />

      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
        departments={departments}
        programs={programs}
      />

      <CourseAllocationModal
        isOpen={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        onSave={handleSaveAllocation}
        subjects={subjects}
        facultyList={facultyList}
        sessions={sessions}
        defaultSubjectId={defaultSubjectIdForAlloc}
      />

      {/* High-Security Cascade Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Confirm Destructive Cascade Deletion</h3>
                <p className="text-xs text-rose-700">Irreversible Structural Modification</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p>
                You are requesting deletion of <strong>"{deleteTarget.name}"</strong>.
              </p>
              <p className="font-semibold text-rose-950">
                ⚠️ Cascade Warning: This will permanently delete {deleteTarget.cascadeDesc}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                To confirm deletion, type <span className="font-mono text-rose-700 select-all">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to authorize"
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE'}
                onClick={handleConfirmCascadeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
              >
                Authorize Cascade Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
