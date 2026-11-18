import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  StudentWithDetails,
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
import { StudentModal } from './StudentModal.js';
import { StudentDetailsModal } from './StudentDetailsModal.js';
import { BulkStudentModal } from './BulkStudentModal.js';

interface StudentDirectoryProps {
  departments: Department[];
  programs: Program[];
  sessions: AcademicSession[];
  semesters: Semester[];
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  departments,
  programs,
  sessions,
  semesters,
}) => {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentWithDetails | null>(null);
  const [detailsStudent, setDetailsStudent] = useState<StudentWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    const data = await studentFacultyService.getStudents({
      departmentId: selectedDepartment,
      programId: selectedProgram,
      status: selectedStatus,
      search: searchQuery,
    });
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedDepartment, selectedProgram, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: StudentWithDetails) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (student: StudentWithDetails) => {
    setDetailsStudent(student);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    await studentFacultyService.deleteStudent(id);
    setDeleteConfirmId(null);
    fetchStudents();
  };

  const handleStatusToggle = async (student: StudentWithDetails) => {
    const nextStatus: UserStatus =
      student.status === 'active'
        ? 'inactive'
        : student.status === 'inactive'
        ? 'suspended'
        : 'active';
    await studentFacultyService.updateStudent(student.id, { status: nextStatus });
    fetchStudents();
  };

  const handleExportCsv = () => {
    const headers = 'Roll No,Enrollment No,Full Name,Email,Department,Program,Semester,Status,CGPA\n';
    const rows = students
      .map(
        (s) =>
          `"${s.roll_number}","${s.enrollment_number}","${s.profile?.full_name}","${s.profile?.email}","${s.department?.name}","${s.program?.code}","Sem ${s.current_semester?.semester_number || 1}","${s.status}","${s.cgpa || 0}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ueams_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Action Bar & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll no, enrollment no, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-[#172033] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1E5AA8] focus:ring-1 focus:ring-[#1E5AA8] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-[#1E5AA8] cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-[#1E5AA8] cursor-pointer"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-[#1E5AA8] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-[#0F2747] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-[#0F2747] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E5AA8] border border-blue-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#1E5AA8]" />
            <span className="hidden sm:inline">Batch Import</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
        </div>

      </div>

      {/* Record Counter Banner */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>
          Showing <span className="font-bold text-[#0F2747]">{students.length}</span> registered students
        </span>
        <button
          onClick={fetchStudents}
          className="text-[11px] text-[#1E5AA8] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Refresh Roster
        </button>
      </div>

      {/* Students Data Display */}
      {loading ? (
        <div className="p-12 text-center text-[#64748B] bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-6 h-6 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading Student Admissions...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#0F2747]">No Student Records Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No students match your active filters. Clear search filters or create a new student admission.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Add Student Admission
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student &amp; Roll Number</th>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">Department &amp; Program</th>
                  <th className="py-3 px-4">Current Term</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    {/* Student & Roll */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={student.profile?.full_name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div
                            onClick={() => handleOpenDetails(student)}
                            className="font-bold text-[#172033] hover:text-[#1E5AA8] cursor-pointer transition flex items-center gap-1.5"
                          >
                            <span>{student.profile?.full_name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-[#1E5AA8] font-bold">
                            {student.roll_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Enrollment */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                      {student.enrollment_number}
                    </td>

                    {/* Department & Program */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#172033]">
                          {student.program?.name} ({student.program?.code})
                        </span>
                        <p className="text-[11px] text-[#64748B]">{student.department?.name}</p>
                      </div>
                    </td>

                    {/* Semester */}
                    <td className="py-3 px-4 text-[#172033]">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] font-semibold">
                        Sem {student.current_semester?.semester_number || '2'}
                      </span>
                    </td>

                    {/* CGPA */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-[#0F2747] font-mono">
                        {student.cgpa ? student.cgpa.toFixed(2) : '8.92'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStatusToggle(student)}
                        title="Click to toggle status"
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase cursor-pointer transition ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200 hover:bg-emerald-100'
                            : student.status === 'inactive'
                            ? 'bg-amber-50 text-[#D97706] border border-amber-200 hover:bg-amber-100'
                            : 'bg-rose-50 text-[#DC2626] border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {student.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E5AA8] hover:bg-slate-100 transition cursor-pointer"
                          title="View Student Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === student.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg">
                            <span className="text-[10px] text-[#DC2626] font-semibold">Delete?</span>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-[#1E5AA8] transition space-y-3.5 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={student.profile?.full_name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4
                      onClick={() => handleOpenDetails(student)}
                      className="text-xs font-bold text-[#172033] hover:text-[#1E5AA8] cursor-pointer transition"
                    >
                      {student.profile?.full_name}
                    </h4>
                    <p className="font-mono text-[11px] text-[#1E5AA8] font-bold">{student.roll_number}</p>
                    <p className="text-[10px] text-[#64748B]">{student.enrollment_number}</p>
                  </div>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  student.status === 'active'
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    : 'bg-amber-50 text-[#D97706] border border-amber-200'
                }`}>
                  {student.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Program:</span>
                  <span className="font-semibold text-[#172033]">{student.program?.name}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Department:</span>
                  <span className="text-slate-700">{student.department?.code}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Semester:</span>
                  <span className="text-[#1E5AA8] font-semibold">Sem {student.current_semester?.semester_number || 2}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>CGPA:</span>
                  <span className="font-mono font-bold text-[#16A34A]">{student.cgpa ? student.cgpa.toFixed(2) : '8.92'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetails(student)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                >
                  <Eye className="w-3 h-3" /> Dossier
                </button>
                <button
                  onClick={() => handleOpenEdit(student)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Create / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchStudents()}
        studentToEdit={studentToEdit}
        departments={departments}
        sessions={sessions}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        student={detailsStudent}
        onEdit={(st) => handleOpenEdit(st)}
      />

      {/* Bulk Import Modal */}
      <BulkStudentModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => fetchStudents()}
        departments={departments}
        programs={programs}
        sessions={sessions}
        semesters={semesters}
      />

    </div>
  );
};
