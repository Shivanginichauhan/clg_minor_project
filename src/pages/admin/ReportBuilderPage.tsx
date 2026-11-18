import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Bookmark,
  Play,
  Printer,
  Sliders,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { studentFacultyService, StudentWithDetails } from '../../services/studentFacultyService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

interface ReportField {
  id: string;
  label: string;
  selected: boolean;
}

interface SavedTemplate {
  id: string;
  title: string;
  description: string;
  filterAttendanceMin?: number;
  filterAttendanceMax?: number;
  filterBacklogMin?: number;
  filterCgpaMin?: number;
  selectedFieldIds: string[];
}

const DEFAULT_FIELDS: ReportField[] = [
  { id: 'roll_number', label: 'Roll Number', selected: true },
  { id: 'full_name', label: 'Student Name', selected: true },
  { id: 'program_code', label: 'Program', selected: true },
  { id: 'semester', label: 'Current Semester', selected: true },
  { id: 'attendance_pct', label: 'Attendance %', selected: true },
  { id: 'cgpa', label: 'Cumulative CGPA', selected: true },
  { id: 'backlog_count', label: 'Backlog Count', selected: true },
  { id: 'fee_due', label: 'Fee Dues (₹)', selected: false },
  { id: 'admission_batch', label: 'Admission Batch', selected: false },
  { id: 'status', label: 'Academic Standing', selected: true },
];

const PREBUILT_TEMPLATES: SavedTemplate[] = [
  {
    id: 'tmpl-ugc-detained',
    title: 'UGC Detained Scholars (<75% Attendance)',
    description: 'Students barred from taking semester-end examinations due to attendance shortage.',
    filterAttendanceMax: 74.9,
    selectedFieldIds: ['roll_number', 'full_name', 'program_code', 'semester', 'attendance_pct', 'status'],
  },
  {
    id: 'tmpl-dean-honors',
    title: 'Dean’s Academic Honors List (CGPA ≥ 8.5 & 0 Backlogs)',
    description: 'Candidates eligible for merit citations, scholarships, and academic medals.',
    filterCgpaMin: 8.5,
    filterBacklogMin: 0,
    selectedFieldIds: ['roll_number', 'full_name', 'program_code', 'semester', 'cgpa', 'attendance_pct'],
  },
  {
    id: 'tmpl-academic-probation',
    title: 'Critical Academic Probation (Backlogs ≥ 2)',
    description: 'Scholars requiring mandatory remedial counseling and mentor intervention.',
    filterBacklogMin: 2,
    selectedFieldIds: ['roll_number', 'full_name', 'program_code', 'semester', 'backlog_count', 'cgpa', 'status'],
  },
];

export const ReportBuilderPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [fields, setFields] = useState<ReportField[]>(DEFAULT_FIELDS);
  const [templates, setTemplates] = useState<SavedTemplate[]>(PREBUILT_TEMPLATES);

  // Filters
  const [minAttendance, setMinAttendance] = useState<number | ''>('');
  const [maxAttendance, setMaxAttendance] = useState<number | ''>('');
  const [minBacklogs, setMinBacklogs] = useState<number | ''>('');
  const [minCgpa, setMinCgpa] = useState<number | ''>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      const data = await studentFacultyService.getStudents();
      // Augment with realistic analytical data for custom querying
      const augmented = data.map((s, idx) => ({
        ...s,
        program_code: String(s.department?.name || s.department || '').includes('Computer') ? 'MCA' : 'BTECH_CSE',
        semester: idx % 2 === 0 ? 2 : 4,
        attendance_pct: idx === 2 ? 64.5 : idx === 1 ? 78.2 : 88.5 + (idx % 8),
        cgpa: idx === 2 ? 6.12 : idx === 0 ? 8.84 : 7.45 + (idx % 2),
        backlog_count: idx === 2 ? 3 : 0,
        fee_due: idx === 2 ? 53500 : 0,
        admission_batch: '2024-2026',
        status: idx === 2 ? 'PROBATION' : 'GOOD_STANDING',
      }));
      setStudents(augmented);
    };
    load();
  }, []);

  const toggleField = (id: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  };

  const handleApplyTemplate = (tmpl: SavedTemplate) => {
    setMinAttendance(tmpl.filterAttendanceMin ?? '');
    setMaxAttendance(tmpl.filterAttendanceMax ?? '');
    setMinBacklogs(tmpl.filterBacklogMin ?? '');
    setMinCgpa(tmpl.filterCgpaMin ?? '');
    setFields(
      fields.map((f) => ({
        ...f,
        selected: tmpl.selectedFieldIds.includes(f.id),
      }))
    );
  };

  // Filter Pipeline
  const filteredData = students.filter((s) => {
    if (selectedProgram !== 'ALL' && s.program_code !== selectedProgram) return false;
    if (minAttendance !== '' && s.attendance_pct < Number(minAttendance)) return false;
    if (maxAttendance !== '' && s.attendance_pct > Number(maxAttendance)) return false;
    if (minBacklogs !== '' && s.backlog_count < Number(minBacklogs)) return false;
    if (minCgpa !== '' && s.cgpa < Number(minCgpa)) return false;
    return true;
  });

  const activeColumns = fields.filter((f) => f.selected);

  const handleExportCSV = () => {
    const headers = activeColumns.map((c) => c.label).join(',');
    const rows = filteredData.map((row) =>
      activeColumns
        .map((col) => {
          const val = row[col.id];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Custom_Academic_Report_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Institutional Analytics</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ad-Hoc Custom Report Builder
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Extract cross-tabular cohorts by picking custom columns, configuring chained criteria, and saving compliance report templates.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-emerald-300 font-medium">Matching Scholars</p>
              <div className="text-xl font-bold text-white mt-0.5">{filteredData.length} Records</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* Templates Row */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#0F2747] uppercase tracking-wider flex items-center gap-1.5">
          <Bookmark className="w-4 h-4 text-amber-500" /> Statutory & Accreditation Report Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleApplyTemplate(tmpl)}
              className="academic-card p-4 hover:border-[#1E5AA8] cursor-pointer transition border border-slate-200"
            >
              <h4 className="text-xs font-bold text-[#0F2747]">{tmpl.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-semibold">
                <span>Click to Apply Rules</span>
                <Play className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurator Box: Field Picker + Condition Chains */}
      <div className="academic-card p-5 space-y-4">
        {/* Field Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Columns to Include in Output ({activeColumns.length} Selected):
          </label>
          <div className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => toggleField(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  f.selected
                    ? 'bg-[#0F2747] text-white border-[#0F2747]'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Chains */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Criteria & Filter Thresholds:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Program</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="ALL">All Programs</option>
                <option value="MCA">MCA</option>
                <option value="BTECH_CSE">B.Tech CSE</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Min Attendance %</label>
              <input
                type="number"
                placeholder="e.g. 75"
                value={minAttendance}
                onChange={(e) => setMinAttendance(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Max Attendance %</label>
              <input
                type="number"
                placeholder="e.g. 74.9"
                value={maxAttendance}
                onChange={(e) => setMaxAttendance(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 8.0"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Min Backlogs</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={minBacklogs}
                onChange={(e) => setMinBacklogs(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              setMinAttendance('');
              setMaxAttendance('');
              setMinBacklogs('');
              setMinCgpa('');
              setSelectedProgram('ALL');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Reset Filters
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print View
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export Filtered CSV ({filteredData.length})
            </button>
          </div>
        </div>
      </div>

      {/* Live Data Preview */}
      <div className="academic-card overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-[#0F2747]">
          <span>Live Dataset Preview</span>
          <span className="text-slate-500 font-normal">Displaying {filteredData.length} matching candidates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                {activeColumns.map((col) => (
                  <th key={col.id} className="py-2.5 px-4">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  {activeColumns.map((col) => (
                    <td key={col.id} className="py-2.5 px-4 text-slate-700">
                      {col.id === 'status' ? (
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            row[col.id] === 'GOOD_STANDING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row[col.id]}
                        </span>
                      ) : col.id === 'attendance_pct' ? (
                        <span className={`font-bold ${row[col.id] < 75 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {row[col.id]}%
                        </span>
                      ) : col.id === 'fee_due' ? (
                        `₹${Number(row[col.id] || 0).toLocaleString('en-IN')}`
                      ) : (
                        row[col.id] ?? '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
