import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Pin,
  FileText,
  AlertTriangle,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Download,
  Share2,
  Paperclip,
  CheckCircle2,
  Clock,
  X,
  Printer,
  ShieldCheck,
  Send,
  Building,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { noticeService } from '../../services/noticeService.js';
import { UniversityNotice, NoticeCategory, NoticePriority, NoticeAudience, NoticeAttachment } from '../../data/mockNotices.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { Department } from '../../types/database.types.js';

export const NoticeManagementPage: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NoticePriority | 'all'>('all');
  const [selectedAudience, setSelectedAudience] = useState<NoticeAudience | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>('active');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [previewNotice, setPreviewNotice] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('examination');
  const [formPriority, setFormPriority] = useState<NoticePriority>('normal');
  const [formAudience, setFormAudience] = useState<NoticeAudience>('all');
  const [formDeptName, setFormDeptName] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formBroadcast, setFormBroadcast] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formAttachments, setFormAttachments] = useState<NoticeAttachment[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [isDraggingAttachments, setIsDraggingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    academicStructureService.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  const loadNotices = async () => {
    try {
      const list = await noticeService.getNoticesForUser(role || 'administrator', {
        search: searchQuery,
        category: selectedCategory,
        priority: selectedPriority,
        target_audience: selectedAudience,
        status: statusFilter
      });
      setNotices(list);
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [searchQuery, selectedCategory, selectedPriority, selectedAudience, statusFilter, role]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('examination');
    setFormPriority('normal');
    setFormAudience('all');
    setFormDeptName('');
    setFormIsPinned(false);
    setFormBroadcast(false);
    setFormExpiresAt('');
    setFormAttachments([]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (notice: UniversityNotice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormPriority(notice.priority);
    setFormAudience(notice.target_audience);
    setFormDeptName(notice.department_name || '');
    setFormIsPinned(notice.is_pinned);
    setFormBroadcast(notice.broadcast_alert);
    setFormExpiresAt(notice.expires_at ? notice.expires_at.slice(0, 10) : '');
    setFormAttachments(notice.attachments || []);
    setShowCreateModal(true);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        showToast(`Rejected: "${file.name}" exceeds maximum allowed attachment size of 10MB.`);
        return;
      }

      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '#';
        const item: NoticeAttachment = {
          name: file.name,
          url: dataUrl,
          size: sizeStr,
          type: file.type || 'application/pdf'
        };
        setFormAttachments((prev) => [...prev, item]);
        showToast(`Attached "${file.name}" (${sizeStr})`);
      };
      reader.onerror = () => {
        showToast(`Failed to parse file "${file.name}".`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const cleanName = newAttachmentName.trim().endsWith('.pdf') ? newAttachmentName.trim() : `${newAttachmentName.trim()}.pdf`;
    const dummyContent = `UNIVERSITY CIRCULAR ATTACHMENT / ANNEXURE\nDocument Title: ${cleanName}\nIssue Reference: UEAMS/CIRCULAR/ANNEXURE\nTimestamp: ${new Date().toISOString()}\nVerified by Office of the Controller of Examinations.\n\n[Institutional Record Document Content]`;
    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(dummyContent)}`;
    const item: NoticeAttachment = {
      name: cleanName,
      url: dataUri,
      size: '28 KB',
      type: 'application/pdf'
    };
    setFormAttachments([...formAttachments, item]);
    setNewAttachmentName('');
    showToast(`Attached document: ${cleanName}`);
  };

  const handleRemoveAttachment = (idx: number) => {
    setFormAttachments(formAttachments.filter((_, i) => i !== idx));
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Please provide a title and detailed content.');
      return;
    }

    const currentActor = {
      id: user?.id || 'admin-001',
      name: profile?.full_name || 'Academic Administrator',
      role: role || 'administrator'
    };

    try {
      if (editingNotice) {
        await noticeService.updateNotice(
          editingNotice.id,
          {
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            priority: formPriority,
            target_audience: formAudience,
            department_name: formDeptName || undefined,
            is_pinned: formIsPinned,
            broadcast_alert: formBroadcast,
            expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
            attachments: formAttachments
          },
          currentActor
        );
        showToast('Circular Notice updated successfully.');
      } else {
        await noticeService.createNotice(
          {
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            priority: formPriority,
            target_audience: formAudience,
            department_name: formDeptName || undefined,
            author_name: currentActor.name,
            author_role: role === 'dean' ? 'Dean of Academic Affairs' : 'Controller of Examinations / Admin',
            author_id: currentActor.id,
            is_pinned: formIsPinned,
            broadcast_alert: formBroadcast,
            expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined,
            attachments: formAttachments
          },
          currentActor
        );
        showToast('Official Circular published and broadcasted to target audience.');
      }

      setShowCreateModal(false);
      await loadNotices();
    } catch (err: any) {
      console.error('Failed to save notice:', err);
      showToast(err.message || 'Failed to save notice.');
    }
  };

  const handleTogglePin = async (id: string) => {
    const currentActor = {
      id: user?.id || 'admin-001',
      name: profile?.full_name || 'Academic Administrator',
      role: role || 'administrator'
    };
    try {
      await noticeService.togglePin(id, currentActor);
      await loadNotices();
      showToast('Notice pinned status updated.');
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    const currentActor = {
      id: user?.id || 'admin-001',
      name: profile?.full_name || 'Academic Administrator',
      role: role || 'administrator'
    };
    try {
      await noticeService.deleteNotice(id, currentActor);
      setDeleteConfirmId(null);
      await loadNotices();
      showToast('Notice deleted and removed from student/faculty boards.');
    } catch (err: any) {
      console.error('Failed to delete notice:', err);
    }
  };

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
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2747] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">
              Notice Board &amp; Official Circular Publisher
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Official Portal
            </span>
          </div>
          <p className="text-sm text-[#64748B] max-w-3xl">
            Author, schedule, and broadcast institutional circulars, statutory examination notices, and departmental alerts across the university portal with role-based delivery.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Circular</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-[#64748B] font-semibold">Total Active Circulars</div>
          <div className="text-2xl font-bold text-[#0F2747] mt-1">{notices.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Published &amp; visible</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-[#64748B] font-semibold">Pinned High-Priority</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {notices.filter((n) => n.is_pinned).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Anchored on student dashboards</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-[#64748B] font-semibold">Urgent Broadcasts</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {notices.filter((n) => n.priority === 'urgent').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active flashing banner alerts</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs text-[#64748B] font-semibold">Total Circular Views</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {notices.reduce((acc, n) => acc + (n.views_count || 0), 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Portal engagement counter</p>
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by circular ref #, keywords, subject title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8] transition"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-full lg:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Categories</option>
            <option value="examination">Examination Alerts</option>
            <option value="results">Results &amp; Gazette</option>
            <option value="academic">Academic &amp; CIA</option>
            <option value="administrative">Administrative</option>
            <option value="events">Events &amp; Convocation</option>
          </select>

          {/* Audience Filter */}
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value as any)}
            className="w-full lg:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Audiences</option>
            <option value="students">Students Only</option>
            <option value="faculty">Faculty Only</option>
            <option value="deans">Deans Only</option>
            <option value="administrators">Admins Only</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="w-full lg:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>

          {/* Status Tab */}
          <div className="flex rounded-lg bg-slate-100 p-1 w-full lg:w-auto">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                statusFilter === 'active' ? 'bg-white text-[#0F2747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                statusFilter === 'expired' ? 'bg-white text-[#0F2747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                statusFilter === 'all' ? 'bg-white text-[#0F2747] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Notices Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Published Circulars &amp; Notices Register ({notices.length})
          </div>
          <span className="text-[11px] text-[#64748B]">
            Showing real-time institutional broadcasts
          </span>
        </div>

        {notices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm text-slate-700">No circulars match current filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search queries</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  notice.is_pinned ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
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

                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      Target: {notice.target_audience.toUpperCase()}
                    </span>

                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      {notice.circular_number}
                    </span>
                  </div>

                  <h3
                    onClick={() => setPreviewNotice(notice)}
                    className="text-base font-bold text-[#0F2747] hover:text-[#1E5AA8] transition cursor-pointer leading-snug"
                  >
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
                          <Paperclip className="w-3 h-3" />
                          {notice.attachments.length} Attachment(s)
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{notice.views_count || 1} Views</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setPreviewNotice(notice)}
                    title="Preview Official Circular"
                    className="p-2 rounded-lg text-slate-600 hover:text-[#0F2747] hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTogglePin(notice.id)}
                    title={notice.is_pinned ? 'Unpin from Top' : 'Pin to Top'}
                    className={`p-2 rounded-lg border transition cursor-pointer ${
                      notice.is_pinned
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200'
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${notice.is_pinned ? 'fill-amber-700' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(notice)}
                    title="Edit Circular"
                    className="p-2 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(notice.id)}
                    title="Delete Circular"
                    className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F2747]">Delete Circular Notice?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this official circular? It will immediately be removed from all student, faculty, and executive notice boards and logged in the immutable audit trail.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotice(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div id="create-notice-modal" className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0F2747]">
                  {editingNotice ? 'Edit Circular Notice' : 'Draft New Institutional Circular'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F2747] mb-1">
                  Circular Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Examination Registration & Hall Ticket Issuance Schedule"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  >
                    <option value="examination">Examination</option>
                    <option value="results">Results &amp; Gazette</option>
                    <option value="academic">Academic &amp; CIA</option>
                    <option value="administrative">Administrative</option>
                    <option value="circular">General Circular</option>
                    <option value="events">University Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent (Flash Banner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1">Target Audience</label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  >
                    <option value="all">All (University-wide)</option>
                    <option value="students">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                    <option value="deans">Deans Only</option>
                    <option value="administrators">Admins Only</option>
                    <option value="department">Department Specific</option>
                  </select>
                </div>
              </div>

              {formAudience === 'department' && (
                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1">Target Department</label>
                  <select
                    value={formDeptName}
                    onChange={(e) => setFormDeptName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0F2747] mb-1">
                  Official Notice Body Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Enter the full text of the circular notice, including statutory regulations, deadlines, instructions, and contact offices..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8] transition font-sans"
                />
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0F2747]">
                    Official Document Attachments (PDF / Excel / Images)
                  </label>
                  <span className="text-[11px] text-slate-400">PDF, Word, Excel, Images up to 25MB</span>
                </div>

                {/* Hidden File Input */}
                <input
                  id="notice-file-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFilesSelected(files);
                    }
                  }}
                  className="hidden"
                />

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingAttachments(true);
                  }}
                  onDragLeave={() => setIsDraggingAttachments(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingAttachments(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                    isDraggingAttachments
                      ? 'border-[#1E5AA8] bg-blue-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-[#1E5AA8] bg-slate-50 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-[#1E5AA8] group-hover:scale-110 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#0F2747]">
                    <span className="text-[#1E5AA8] underline">Click to upload official files</span> or drag &amp; drop here
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Attach official PDF Circulars, Exam Timetables (.xlsx/.csv), Question Banks, or Scanned Letters
                  </p>
                </div>

                {/* Quick Manual Add Alternative */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Or enter filename manually (e.g. Circular_Schedule_2026.pdf)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttachment();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F2747] text-xs font-semibold rounded-xl border border-slate-200 transition"
                  >
                    + Add Name
                  </button>
                </div>

                {/* Attached Files List */}
                {formAttachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Attached Documents ({formAttachments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formAttachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate text-[11px]">{att.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{att.size}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition shrink-0 cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#0F2747] mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#1E5AA8]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-pin"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E5AA8]"
                  />
                  <label htmlFor="chk-pin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Pin to Top of Notice Board
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-alert"
                    checked={formBroadcast}
                    onChange={(e) => setFormBroadcast(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <label htmlFor="chk-alert" className="text-xs font-semibold text-rose-700 cursor-pointer">
                    Display Flash Alert Banner
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2747] hover:bg-[#1E5AA8] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingNotice ? 'Update Circular' : 'Publish & Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Circular Preview Modal */}
      {previewNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Bar */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Building className="w-4 h-4 text-amber-400" />
                <span>Official Institutional Circular Preview</span>
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
                  onClick={() => setPreviewNotice(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead Styling */}
            <div className="p-8 sm:p-12 space-y-6 text-[#0F2747]">
              {/* Header */}
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

              {/* Reference & Date Bar */}
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-3">
                <div>
                  <strong className="text-slate-500">Ref No:</strong>{' '}
                  <span className="font-bold text-[#0F2747]">{previewNotice.circular_number}</span>
                </div>
                <div>
                  <strong className="text-slate-500">Date:</strong>{' '}
                  <span className="font-bold text-[#0F2747]">
                    {new Date(previewNotice.published_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Title / Subject */}
              <div className="bg-slate-50 border-l-4 border-[#0F2747] p-4 rounded-r-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">CIRCULAR NOTIFICATION</div>
                <h3 className="text-base font-bold text-[#0F2747] mt-0.5">
                  Sub: {previewNotice.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                  <span>Audience: <strong>{previewNotice.target_audience.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="capitalize">{previewNotice.category}</strong></span>
                  <span>•</span>
                  <span>Priority: <strong className="capitalize">{previewNotice.priority}</strong></span>
                </div>
              </div>

              {/* Body */}
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans space-y-4">
                {previewNotice.content}
              </div>

              {/* Attachments Section if any */}
              {previewNotice.attachments && previewNotice.attachments.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Enclosed Documents &amp; Schedules:
                  </div>
                  <div className="space-y-1.5">
                    {previewNotice.attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-indigo-800 bg-white p-2.5 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold">{att.name}</span>
                          <span className="text-[10px] text-slate-400">({att.size})</span>
                        </div>
                        {att.url && att.url !== '#' ? (
                          <a
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                            Digital Copy
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Block */}
              <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
                <div className="text-[11px] text-slate-400">
                  <p>Copy forward to:</p>
                  <p>1. Hon'ble Vice-Chancellor Secretariat</p>
                  <p>2. Deans of Faculties &amp; HODs</p>
                  <p>3. Examination Cell &amp; Notice Boards</p>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-serif italic text-sm text-[#0F2747] font-bold">
                    [Digitally Signed via UEAMS]
                  </div>
                  <div className="font-bold text-xs text-[#0F2747]">{previewNotice.author_name}</div>
                  <div className="text-[11px] text-slate-600">{previewNotice.author_role}</div>
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
