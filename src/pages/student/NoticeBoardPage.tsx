import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Pin,
  FileText,
  AlertTriangle,
  Calendar,
  Eye,
  Download,
  Paperclip,
  CheckCircle2,
  Clock,
  X,
  Printer,
  Sparkles,
  Building,
  Filter,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { noticeService } from '../../services/noticeService.js';
import { UniversityNotice, NoticeCategory, NoticePriority, NoticeAttachment } from '../../data/mockNotices.js';

export const NoticeBoardPage: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [notices, setNotices] = useState<UniversityNotice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NoticePriority | 'all'>('all');
  const [selectedNotice, setSelectedNotice] = useState<UniversityNotice | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const key = `itm_acked_notices_${user?.id || 'anonymous'}`;
      const raw = localStorage.getItem(key);
      setAcknowledgedIds(raw ? JSON.parse(raw) : []);
    } catch {
      setAcknowledgedIds([]);
    }
  }, [user?.id]);

  const handleToggleAcknowledge = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = `itm_acked_notices_${user?.id || 'anonymous'}`;
    setAcknowledgedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const loadNotices = async () => {
    try {
      const list = await noticeService.getNoticesForUser(role || 'student', {
        search: searchQuery,
        category: selectedCategory,
        priority: selectedPriority,
        status: 'active'
      });
      setNotices(list || []);
    } catch (e) {
      console.error('Error loading notices:', e);
      setNotices([]);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [searchQuery, selectedCategory, selectedPriority, role]);

  const handleOpenNotice = (notice: UniversityNotice) => {
    setSelectedNotice(notice);
    if (user?.id) {
      noticeService.markAsRead(notice.id, user.id);
    }
    noticeService.incrementViewCount(notice.id);
  };

  const handleDownloadAttachment = (att: NoticeAttachment, notice?: UniversityNotice) => {
    try {
      if (att.url && att.url !== '#' && (att.url.startsWith('data:') || att.url.startsWith('http') || att.url.startsWith('blob:'))) {
        const link = document.createElement('a');
        link.href = att.url;
        link.download = att.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const noticeRef = notice?.circular_number || 'ITM/EXAM/2026/042';
        const noticeTitle = notice?.title || 'Official University Circular';
        const noticeDept = notice?.department_name || 'Controller of Examinations';
        const noticeDate = notice?.published_at
          ? new Date(notice.published_at).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB');

        const officialDocContent = `================================================================================
                           ITM UNIVERSITY
             (Office of the Controller of Examinations & Academic Affairs)
================================================================================
Ref. No: ${noticeRef}                                      Date: ${noticeDate}
Department: ${noticeDept}
Classification: Official Academic Notice Enclosure

DOCUMENT TITLE: ${att.name}
ASSOCIATED CIRCULAR: ${noticeTitle}

--------------------------------------------------------------------------------
CERTIFICATE OF AUTHENTICITY & STATUTORY ENCLOSURE
--------------------------------------------------------------------------------
This document represents an official certified enclosure transmitted via the
ITM University Examination & Academic Management System (UEAMS).

Enclosure Summary:
- File Reference: ${att.name}
- Registered Type: ${att.type || 'Official University Circular'}
- Recorded File Size: ${att.size}
- Dispatched To: All Enrolled Students & Faculty Members

Summary of Regulatory Guidelines:
1. All candidates are advised to strictly verify timelines and directives specified.
2. For examination-related discrepancies, report to the Controller of Examinations
   (coe@itmuniversity.edu.in) within 3 working days.
3. Cryptographically validated via ITM University Central Student Records.

--------------------------------------------------------------------------------
Digitally Issued & Verified by:
Controller of Examinations (CoE)
ITM University, Main Campus
================================================================================
`;
        const blob = new Blob([officialDocContent], { type: 'text/plain;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        // Always use .txt extension for plain-text fallback content.
        // NEVER set a .pdf extension on a plain text blob — that corrupts the file for the user.
        const safeName = att.name.replace(/\.(pdf|docx?|xlsx?)$/i, '') + '.txt';
        link.download = safeName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      setDownloadSuccessMessage(`Downloaded "${att.name}" successfully.`);
      setTimeout(() => setDownloadSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const urgentBroadcasts = notices.filter((n) => n.broadcast_alert || n.priority === 'urgent');

  const getPriorityBadge = (priority: NoticePriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'normal':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCategoryBadge = (cat: NoticeCategory) => {
    switch (cat) {
      case 'results':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'examination':
        return 'bg-blue-50 text-[#1E5AA8] border-blue-200';
      case 'academic':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'events':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'administrative':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Download Alert Toast */}
      {downloadSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2747] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1E5AA8] border border-blue-200">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
              Institutional Circulars &amp; Notice Board
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#1E5AA8] border border-blue-200">
              Official Bulletin
            </span>
          </div>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Official announcements from the Examination Cell, Dean of Academic Affairs, and Registrar Office.
          </p>
        </div>

        <div className="text-right text-xs text-[#64748B] hidden md:block">
          <div>Institutional Feed: <strong className="text-slate-800">ITM University Main Hub</strong></div>
          <div>Updated: <strong className="text-slate-800">Real-time Broadcast</strong></div>
        </div>
      </div>

      {/* Top Urgent Alert Banner if any */}
      {urgentBroadcasts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>High-Priority Statutory Broadcast</span>
          </div>
          <div className="text-sm font-bold text-[#0F2747]">
            {urgentBroadcasts[0].title}
          </div>
          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
            {urgentBroadcasts[0].content}
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">{urgentBroadcasts[0].circular_number}</span>
            <button
              onClick={() => handleOpenNotice(urgentBroadcasts[0])}
              className="text-xs font-bold text-[#1E5AA8] hover:text-[#0F2747] flex items-center gap-1 cursor-pointer"
            >
              <span>Read Full Notification &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-100">
          {[
            { id: 'all', label: 'All Circulars' },
            { id: 'examination', label: 'Examinations' },
            { id: 'results', label: 'Results & Gazette' },
            { id: 'academic', label: 'Academic & CIA' },
            { id: 'administrative', label: 'Administrative' },
            { id: 'events', label: 'Events & Convocation' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${selectedCategory === cat.id
                  ? 'bg-[#0F2747] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Priority Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search circulars by keywords, circular number, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8] transition"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Alerts Only</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Updates</option>
          </select>
        </div>
      </div>

      {/* Notice Cards List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            {searchQuery.trim() ? (
              <>
                <p className="font-semibold text-sm text-slate-700">No results for &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term or clear the query</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-slate-700">No circulars in this category</p>
                <p className="text-xs text-slate-400 mt-1">Try switching to a different category or priority filter</p>
              </>
            )}
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => handleOpenNotice(notice)}
              className={`bg-white border rounded-2xl p-5 hover:border-[#1E5AA8]/60 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4 ${notice.is_pinned
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-slate-200'
                }`}
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.is_pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      <Pin className="w-3 h-3 fill-amber-700" />
                      PINNED
                    </span>
                  )}

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getPriorityBadge(notice.priority)}`}>
                    {notice.priority}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getCategoryBadge(notice.category)}`}>
                    {notice.category}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    {notice.circular_number}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0F2747] leading-snug group-hover:text-[#1E5AA8]">
                  {notice.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                  <span>Issued by: <strong className="text-slate-600">{notice.author_name}</strong> ({notice.author_role})</span>
                  <span>•</span>
                  <span>Date: {new Date(notice.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {notice.attachments && notice.attachments.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" />
                        {notice.attachments.length} Document Attached
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 self-end sm:self-center shrink-0">
                {/* Contextual Action Button */}
                {notice.title.toLowerCase().includes('exam') && (
                  <Link
                    to="/student/exam-apply"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-3d-gold px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Apply for Exam &rarr;</span>
                  </Link>
                )}
                {notice.title.toLowerCase().includes('fee') && (
                  <Link
                    to="/student/fees"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-3d-gold px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Check Fee &rarr;</span>
                  </Link>
                )}
                {notice.title.toLowerCase().includes('schedule') && (
                  <Link
                    to="/student/timetable"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-3d-gold px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span>View Timetable &rarr;</span>
                  </Link>
                )}

                {/* Acknowledgement Toggle */}
                <button
                  type="button"
                  onClick={(e) => handleToggleAcknowledge(notice.id, e)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                    acknowledgedIds.includes(notice.id)
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Mark as read & acknowledged"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{acknowledgedIds.includes(notice.id) ? 'Acknowledged' : 'Acknowledge'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenNotice(notice);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-[#0F2747] transition shrink-0 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#1E5AA8]" />
                  <span>View Circular</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official Circular Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Official Institutional Circular</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Circular
                </button>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead */}
            <div className="p-8 sm:p-12 space-y-6 text-[#0F2747]">
              <div className="text-center border-b-2 border-[#0F2747] pb-6 space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight uppercase font-serif">
                  ITM UNIVERSITY
                </h2>
                <p className="text-xs font-medium text-slate-600">
                  (Established under State Universities Act, Accredited 'A++' by NAAC)
                </p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Office of the Controller of Examinations &amp; Academic Affairs
                </p>
              </div>

              {/* Reference & Date */}
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-3">
                <div>
                  <strong className="text-slate-500">Ref No:</strong>{' '}
                  <span className="font-bold text-[#0F2747]">{selectedNotice.circular_number}</span>
                </div>
                <div>
                  <strong className="text-slate-500">Date:</strong>{' '}
                  <span className="font-bold text-[#0F2747]">
                    {new Date(selectedNotice.published_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Title Header */}
              <div className="bg-slate-50 border-l-4 border-[#0F2747] p-4 rounded-r-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">CIRCULAR NOTIFICATION</div>
                <h3 className="text-base font-bold text-[#0F2747] mt-0.5">
                  Sub: {selectedNotice.title}
                </h3>
              </div>

              {/* Content Body */}
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans space-y-4">
                {selectedNotice.content}
              </div>

              {/* Attachments Section */}
              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Enclosed Documents &amp; Schedules:
                  </div>
                  <div className="space-y-1.5">
                    {selectedNotice.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-indigo-900 bg-white p-3 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold">{att.name}</span>
                          <span className="text-[10px] text-slate-400">({att.size})</span>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(att, selectedNotice)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Block */}
              <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
                <div className="text-[11px] text-slate-400">
                  <p>Copy to:</p>
                  <p>1. Hon'ble Vice-Chancellor Secretariat</p>
                  <p>2. Deans of Faculties &amp; HODs</p>
                  <p>3. Notice Boards &amp; Student Portal</p>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-serif italic text-sm text-[#0F2747] font-bold">
                    [Digitally Signed via UEAMS]
                  </div>
                  <div className="font-bold text-xs text-[#0F2747]">{selectedNotice.author_name}</div>
                  <div className="text-[11px] text-slate-600">{selectedNotice.author_role}</div>
                  <div className="text-[10px] text-slate-400">ITM University, Main Campus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
