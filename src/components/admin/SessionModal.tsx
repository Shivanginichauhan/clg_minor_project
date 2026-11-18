import React, { useState, useEffect } from 'react';
import { AcademicSession } from '../../types/database.types.js';
import { X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: { name: string; start_date: string; end_date: string; is_current: boolean }) => Promise<void>;
  session: AcademicSession | null;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  session,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setName(session.name);
      setStartDate(session.start_date);
      setEndDate(session.end_date);
      setIsCurrent(session.is_current);
    } else {
      setName('Academic Year 2026 - 2027');
      setStartDate('2026-07-01');
      setEndDate('2027-06-30');
      setIsCurrent(false);
    }
    setError(null);
  }, [session, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Academic session title is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('Start date must precede the end date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(session ? session.id : null, {
        name,
        start_date: startDate,
        end_date: endDate,
        is_current: isCurrent,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save academic session');
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
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F2747]">
                {session ? 'Edit Academic Session' : 'Define Academic Year'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Configure annual session boundaries and current term
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Session Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Academic Year 2025 - 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[#172033] text-sm focus:outline-hidden focus:bg-white focus:border-[#1E5AA8]"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0F2747] focus:ring-[#1E5AA8]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#0F2747] block">
                  Mark as Current Active Session
                </span>
                <span className="text-[#64748B]">
                  New enrollments and current examinations will default to this session
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
