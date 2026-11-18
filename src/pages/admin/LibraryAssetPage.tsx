import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  HardDrive,
  Building,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { adminService, LibraryBook, CirculationRecord, LabAsset } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const LibraryAssetPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CIRCULATION' | 'LAB_ASSETS'>('CATALOG');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [circulation, setCirculation] = useState<CirculationRecord[]>([]);
  const [labAssets, setLabAssets] = useState<LabAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<LibraryBook | null>(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRoll, setBorrowerRoll] = useState('');
  const [borrowerType, setBorrowerType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  const reloadData = () => {
    setBooks(adminService.getBooks());
    setCirculation(adminService.getCirculation());
    setLabAssets(adminService.getLabAssets());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleReturnBook = (circId: string) => {
    adminService.returnBook(circId);
    reloadData();
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForIssue) return;

    adminService.issueBook({
      book_id: selectedBookForIssue.id,
      book_title: selectedBookForIssue.title,
      isbn: selectedBookForIssue.isbn,
      borrower_type: borrowerType,
      borrower_id: `user-${Date.now()}`,
      borrower_name: borrowerName,
      roll_or_emp_id: borrowerRoll,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
    });

    reloadData();
    setIsIssueModalOpen(false);
    setBorrowerName('');
    setBorrowerRoll('');
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.includes(searchQuery) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Institutional Infrastructure</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Library Repository & Laboratory Assets
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Central catalog registry for reference texts, automated circulation desk with late fee assessment, and departmental lab equipment inventory.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-medium">Available Titles</p>
              <div className="text-xl font-bold text-white mt-0.5">{books.reduce((a, b) => a + b.available_copies, 0)} Copies</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CATALOG' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Central Library Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('CIRCULATION')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CIRCULATION' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Circulation Desk & Dues ({circulation.length})
        </button>
        <button
          onClick={() => setActiveTab('LAB_ASSETS')}
          className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'LAB_ASSETS' ? 'border-[#0F2747] text-[#0F2747] font-semibold' : 'border-transparent text-slate-600'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Laboratory Equipment & Sandboxes ({labAssets.length})
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search ISBN, book title, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2747]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredBooks.map((b) => (
              <div key={b.id} className="academic-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono bg-blue-50 text-[#1E5AA8] px-2 py-0.5 rounded font-bold">
                      ISBN: {b.isbn}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        b.available_copies > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {b.available_copies} of {b.total_copies} Left
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F2747] mt-2">{b.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{b.author}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Rack: {b.shelf_location}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">{b.category}</span>
                  {b.available_copies > 0 && (
                    <button
                      onClick={() => {
                        setSelectedBookForIssue(b);
                        setIsIssueModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#0F2747] text-white rounded hover:bg-[#1E5AA8]"
                    >
                      Issue Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CIRCULATION */}
      {activeTab === 'CIRCULATION' && (
        <div className="academic-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Book Title / ISBN</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Issued On</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fine</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {circulation.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0F2747]">{c.book_title}</div>
                    <div className="font-mono text-[10px] text-slate-400">{c.isbn}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{c.borrower_name}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {c.roll_or_emp_id} ({c.borrower_type})
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.issued_date}</td>
                  <td className="py-3 px-4 text-slate-600">{c.due_date}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        c.status === 'RETURNED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-700">
                    {c.fine_amount > 0 ? `₹${c.fine_amount}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c.status !== 'RETURNED' && (
                      <button
                        onClick={() => handleReturnBook(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        Accept Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: LAB ASSETS */}
      {activeTab === 'LAB_ASSETS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {labAssets.map((asset) => (
              <div key={asset.id} className="academic-card p-5 space-y-3 border-l-4 border-l-indigo-600">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                    {asset.asset_code}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      asset.status === 'OPERATIONAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#0F2747]">{asset.name}</h4>
                <p className="text-xs text-slate-600 font-medium">{asset.lab_name}</p>

                <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Warranty Expiry:</span>
                    <span className="font-semibold text-slate-700">{asset.warranty_expiry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Calibration:</span>
                    <span className="font-semibold text-slate-700">{asset.last_maintenance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ISSUE BOOK */}
      {isIssueModalOpen && selectedBookForIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747]">Issue Reference Book</h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="font-bold text-[#0F2747]">{selectedBookForIssue.title}</div>
              <div className="text-slate-500 font-mono text-[11px]">ISBN: {selectedBookForIssue.isbn}</div>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Borrower Type</label>
                <select
                  value={borrowerType}
                  onChange={(e) => setBorrowerType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Roll / Employee ID</label>
                <input
                  type="text"
                  value={borrowerRoll}
                  onChange={(e) => setBorrowerRoll(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2747] text-white rounded font-semibold hover:bg-[#1E5AA8]"
                >
                  Confirm Issue (14 Days)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
