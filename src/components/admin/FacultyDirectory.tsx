import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  RefreshCw,
  LayoutGrid,
  List,
  Mail,
  Phone,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  FacultyWithDetails,
  studentFacultyService
} from '../../services/studentFacultyService.js';
import { Department, UserStatus } from '../../types/database.types.js';
import { FacultyModal } from './FacultyModal.js';
import { FacultyDetailsModal } from './FacultyDetailsModal.js';

interface FacultyDirectoryProps {
  departments: Department[];
}

export const FacultyDirectory: React.FC<FacultyDirectoryProps> = ({ departments }) => {
  const [facultyList, setFacultyList] = useState<FacultyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState<FacultyWithDetails | null>(null);
  const [detailsFaculty, setDetailsFaculty] = useState<FacultyWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const designations = [
    'Professor & HOD',
    'Professor',
    'Associate Professor',
    'Assistant Professor (Senior Grade)',
    'Assistant Professor',
    'Visiting Faculty / Lecturer',
  ];

  const fetchFaculty = async () => {
    setLoading(true);
    const data = await studentFacultyService.getFaculty({
      departmentId: selectedDepartment,
      designation: selectedDesignation,
      status: selectedStatus,
      search: searchQuery,
    });
    setFacultyList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaculty();
  }, [selectedDepartment, selectedDesignation, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaculty();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setFacultyToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faculty: FacultyWithDetails) => {
    setFacultyToEdit(faculty);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (faculty: FacultyWithDetails) => {
    setDetailsFaculty(faculty);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    await studentFacultyService.deleteFaculty(id);
    setDeleteConfirmId(null);
    fetchFaculty();
  };

  const handleStatusToggle = async (faculty: FacultyWithDetails) => {
    const nextStatus: UserStatus =
      faculty.status === 'active'
        ? 'inactive'
        : faculty.status === 'inactive'
        ? 'suspended'
        : 'active';
    await studentFacultyService.updateFaculty(faculty.id, { status: nextStatus });
    fetchFaculty();
  };

  const handleExportCsv = () => {
    const headers = 'Employee ID,Full Name,Email,Department,Designation,Specialization,Status,Joining Date\n';
    const rows = facultyList
      .map(
        (f) =>
          `"${f.employee_id}","${f.profile?.full_name}","${f.profile?.email}","${f.department?.name}","${f.designation}","${f.specialization || ''}","${f.status}","${f.joining_date || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ueams_faculty_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Action Bar & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by faculty name, employee ID, specialization, or email..."
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
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-[#1E5AA8] cursor-pointer"
          >
            <option value="all">All Designations</option>
            {designations.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
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
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Appoint Faculty</span>
          </button>
        </div>

      </div>

      {/* Record Counter Banner */}
      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>
          Showing <span className="font-bold text-[#0F2747]">{facultyList.length}</span> appointed faculty members
        </span>
        <button
          onClick={fetchFaculty}
          className="text-[11px] text-[#1E5AA8] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Refresh Roster
        </button>
      </div>

      {/* Faculty Data Display */}
      {loading ? (
        <div className="p-12 text-center text-[#64748B] bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-6 h-6 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading Faculty Roster...</p>
        </div>
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#0F2747]">No Faculty Members Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No faculty match the current filters. Adjust your search or create a new faculty appointment.
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Appoint Faculty Member
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
                  <th className="py-3 px-4">Faculty &amp; Employee ID</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyList.map((faculty) => (
                  <tr
                    key={faculty.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    {/* Faculty Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={faculty.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={faculty.profile?.full_name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div
                            onClick={() => handleOpenDetails(faculty)}
                            className="font-bold text-[#172033] hover:text-[#1E5AA8] cursor-pointer transition"
                          >
                            {faculty.profile?.full_name}
                          </div>
                          <span className="font-mono text-[11px] text-[#1E5AA8] font-bold">
                            {faculty.employee_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#172033]">{faculty.designation}</span>
                      <p className="text-[10px] text-[#64748B]">Joined {faculty.joining_date || '2021'}</p>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#172033]">{faculty.department?.name}</span>
                        <p className="text-[11px] text-[#64748B] font-mono">Dept Code: {faculty.department?.code}</p>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-700">
                      {faculty.specialization || 'Distributed Systems & Database Arch'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStatusToggle(faculty)}
                        title="Click to toggle status"
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase cursor-pointer transition ${
                          faculty.status === 'active'
                            ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200 hover:bg-emerald-100'
                            : faculty.status === 'inactive'
                            ? 'bg-amber-50 text-[#D97706] border border-amber-200 hover:bg-amber-100'
                            : 'bg-rose-50 text-[#DC2626] border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {faculty.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(faculty)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E5AA8] hover:bg-slate-100 transition cursor-pointer"
                          title="View Faculty Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(faculty)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2747] hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Faculty"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === faculty.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg">
                            <span className="text-[10px] text-[#DC2626] font-semibold">Delete?</span>
                            <button
                              onClick={() => handleDelete(faculty.id)}
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
                            onClick={() => setDeleteConfirmId(faculty.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Faculty"
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
          {facultyList.map((faculty) => (
            <div
              key={faculty.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:border-[#1E5AA8] transition space-y-3.5 relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={faculty.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={faculty.profile?.full_name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4
                      onClick={() => handleOpenDetails(faculty)}
                      className="text-xs font-bold text-[#172033] hover:text-[#1E5AA8] cursor-pointer transition"
                    >
                      {faculty.profile?.full_name}
                    </h4>
                    <p className="font-mono text-[11px] text-[#1E5AA8] font-bold">{faculty.employee_id}</p>
                    <p className="text-[10px] text-[#64748B]">{faculty.designation}</p>
                  </div>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  faculty.status === 'active'
                    ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                    : 'bg-amber-50 text-[#D97706] border border-amber-200'
                }`}>
                  {faculty.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Department:</span>
                  <span className="font-semibold text-[#172033]">{faculty.department?.code}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B] text-[11px]">
                  <span>Email:</span>
                  <span className="text-slate-700 truncate max-w-[150px]">{faculty.profile?.email}</span>
                </div>
                <div className="text-[11px] text-[#64748B] pt-1">
                  <span className="text-slate-400">Domain: </span>
                  <span className="text-slate-700">{faculty.specialization || 'Distributed Systems'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetails(faculty)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                >
                  <Eye className="w-3 h-3" /> Dossier
                </button>
                <button
                  onClick={() => handleOpenEdit(faculty)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Faculty Create / Edit Modal */}
      <FacultyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchFaculty()}
        facultyToEdit={facultyToEdit}
        departments={departments}
      />

      {/* Faculty Details Modal */}
      <FacultyDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        faculty={detailsFaculty}
        onEdit={(f) => handleOpenEdit(f)}
      />

    </div>
  );
};
