import React, { useState, useMemo } from 'react';
import { AcademicSession } from '../../types/database.types.js';
import { FacultyAllocationWithDetails, FacultyWithDetails, SubjectWithDetails } from '../../data/mockAcademics.js';
import {
  UserCheck,
  Search,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Award,
  Download,
  AlertCircle
} from 'lucide-react';

interface CourseAllocationsDirectoryProps {
  allocations: FacultyAllocationWithDetails[];
  facultyList: FacultyWithDetails[];
  subjects: SubjectWithDetails[];
  sessions: AcademicSession[];
  onOpenAllocateModal: () => void;
  onDeleteAllocation: (id: string) => void;
  onRefresh: () => void;
}

export const CourseAllocationsDirectory: React.FC<CourseAllocationsDirectoryProps> = ({
  allocations,
  facultyList,
  subjects,
  sessions,
  onOpenAllocateModal,
  onDeleteAllocation,
  onRefresh,
}) => {
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession?.id || 'all');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAllocations = useMemo(() => {
    return allocations.filter((alloc) => {
      if (selectedSessionId !== 'all' && alloc.session_id !== selectedSessionId) return false;
      if (selectedFacultyId !== 'all' && alloc.faculty_id !== selectedFacultyId) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const facultyName = alloc.faculty?.profile?.full_name?.toLowerCase() || '';
        const subjectCode = alloc.subject?.code?.toLowerCase() || '';
        const subjectName = alloc.subject?.name?.toLowerCase() || '';
        if (!facultyName.includes(query) && !subjectCode.includes(query) && !subjectName.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [allocations, selectedSessionId, selectedFacultyId, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Faculty Member',
      'Designation',
      'Employee ID',
      'Department',
      'Subject Code',
      'Subject Title',
      'Semester',
      'Program',
      'Role',
      'Weekly Hours',
    ];

    const rows = filteredAllocations.map((a) => [
      `"${a.faculty?.profile?.full_name || ''}"`,
      `"${a.faculty?.designation || ''}"`,
      a.faculty?.employee_id || '',
      a.subject?.department?.code || '',
      a.subject?.code || '',
      `"${(a.subject?.name || '').replace(/"/g, '""')}"`,
      `Sem ${a.subject?.semester_number || 1}`,
      a.subject?.program?.code || '',
      a.role,
      a.weekly_hours,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faculty_course_allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'primary_instructor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#D97706] border border-amber-200">Primary Instructor</span>;
      case 'co_instructor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E5AA8] border border-blue-200">Co-Instructor</span>;
      case 'lab_incharge':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">Lab Incharge</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 capitalize">{role}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by faculty name, subject code or title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Allocations</span>
            </button>

            <button
              onClick={onOpenAllocateModal}
              className="px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Allocation</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Academic Intake Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Academic Sessions</option>
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.name} {sess.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
              Filter by Faculty Member
            </label>
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[#172033] text-xs focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
            >
              <option value="all">All Faculty Members</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.profile?.full_name} ({f.designation} • {f.department?.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredAllocations.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D97706] border border-amber-200 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#0F2747]">No Course Allocations Found</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No faculty course assignments match your current filters.
          </p>
          <button
            onClick={onOpenAllocateModal}
            className="px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Faculty to Subject
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Faculty Member</th>
                  <th className="px-5 py-3.5">Assigned Subject &amp; Course Code</th>
                  <th className="px-5 py-3.5">Program &amp; Sem</th>
                  <th className="px-5 py-3.5">Teaching Role</th>
                  <th className="px-5 py-3.5">Weekly Hours</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-[#0F2747] shrink-0">
                          {alloc.faculty?.profile?.full_name?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <div className="font-bold text-[#172033]">
                            {alloc.faculty?.profile?.full_name}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {alloc.faculty?.designation} • {alloc.faculty?.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F2747] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {alloc.subject?.code}
                          </span>
                          <span className="text-xs font-semibold text-[#172033]">
                            {alloc.subject?.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {alloc.subject?.department?.name}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-[#172033] font-semibold font-mono">
                        {alloc.subject?.program?.code} (Sem {alloc.subject?.semester_number})
                      </div>
                      <div className="text-[11px] text-[#1E5AA8] font-mono font-semibold">
                        {alloc.subject?.credits} Credits Course
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {getRoleLabel(alloc.role)}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono font-semibold flex items-center gap-1.5 w-fit">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {alloc.weekly_hours} hrs/wk
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove allocation of ${alloc.subject?.code} from ${alloc.faculty?.profile?.full_name}?`
                            )
                          ) {
                            onDeleteAllocation(alloc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="De-allocate Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
