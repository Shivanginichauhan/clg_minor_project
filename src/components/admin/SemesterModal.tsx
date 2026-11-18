import React, { useState, useEffect } from 'react';
import { Semester, Program, AcademicSession } from '../../types/database.types.js';
import { SemesterFormData } from '../../services/academicStructureService.js';
import { X, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: SemesterFormData) => Promise<void>;
  semester: Semester | null;
  programs: Program[];
  sessions: AcademicSession[];
  defaultProgramId?: string;
  defaultSessionId?: string;
}

export const SemesterModal: React.FC<SemesterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  semester,
  programs,
  sessions,
  defaultProgramId,
  defaultSessionId,
}) => {
  const [programId, setProgramId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [termType, setTermType] = useState<'odd' | 'even' | 'summer'>('odd');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (semester) {
      setProgramId(semester.program_id);
      setSessionId(semester.session_id);
      setSemesterNumber(semester.semester_number);
      setTermType(semester.term_type || (semester.semester_number % 2 === 1 ? 'odd' : 'even'));
      setStartDate(semester.start_date || '');
      setEndDate(semester.end_date || '');
      setIsActive(semester.is_active);
    } else {
      const prog = defaultProgramId || programs[0]?.id || '';
      const sess = defaultSessionId || sessions.find((s) => s.is_current)?.id || sessions[0]?.id || '';
      setProgramId(prog);
      setSessionId(sess);
      setSemesterNumber(1);
      setTermType('odd');
      setStartDate('2026-08-01');
      setEndDate('2026-12-31');
      setIsActive(true);
    }
    setError(null);
  }, [semester, isOpen, programs, sessions, defaultProgramId, defaultSessionId]);

  if (!isOpen) return null;

  const handleSemesterNumberChange = (num: number) => {
    setSemesterNumber(num);
    if (termType !== 'summer') {
      setTermType(num % 2 === 1 ? 'odd' : 'even');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      setError('Please select a degree program');
      return;
    }
    if (!sessionId) {
      setError('Please select an academic session');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be strictly after start date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(semester ? semester.id : null, {
        program_id: programId,
        session_id: sessionId,
        semester_number: Number(semesterNumber),
        term_type: termType,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save semester');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#172033]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                {semester ? 'Edit Academic Semester' : 'Create New Semester'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Configure term schedule, program linkage & active status
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F2747] mb-1">
              Degree Program *
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
              required
            >
              <option value="">Select Degree Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F2747] mb-1">
              Academic Session *
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
              required
            >
              <option value="">Select Academic Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '— [Current]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F2747] mb-1">
                Semester Number *
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={semesterNumber}
                onChange={(e) => handleSemesterNumberChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2747] mb-1">
                Term Classification *
              </label>
              <select
                value={termType}
                onChange={(e) => setTermType(e.target.value as 'odd' | 'even' | 'summer')}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
                required
              >
                <option value="odd">Odd Term (Fall / Autumn)</option>
                <option value="even">Even Term (Spring)</option>
                <option value="summer">Summer Term</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F2747] mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2747] mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1E5AA8] focus:outline-hidden transition"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#1E5AA8] rounded border-slate-300 focus:ring-[#1E5AA8]"
              />
              <span className="text-xs font-medium text-slate-700">
                Mark as Active Semester (allows student registration & marks entry)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0F2747] hover:bg-[#1E5AA8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : semester ? 'Save Changes' : 'Create Semester'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
