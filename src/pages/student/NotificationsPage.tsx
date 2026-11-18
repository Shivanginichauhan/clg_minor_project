import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import {
  studentNotificationService,
  StudentNotification,
  NotificationPriority,
  NotificationCategory
} from '../../services/studentNotificationService.js';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await studentNotificationService.getNotifications(user?.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await studentNotificationService.markAsRead(id, user?.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await studentNotificationService.markAllAsRead(user?.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleSnooze = async (id: string) => {
    await studentNotificationService.snoozeNotification(id, 24, user?.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Contextual Student Dispatch &amp; Alerts
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Personalized Notifications Hub
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Targeted alerts aggregated specifically for your courses, attendance status, upcoming examination forms, and assignment schedules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn-3d-gold px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Priority:
          </span>
          {(['all', 'urgent', 'deadline', 'info', 'success'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                priorityFilter === p
                  ? 'bg-[#0F2747] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Domain:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-[#1E5AA8]"
          >
            <option value="all">All Domains</option>
            <option value="attendance">Attendance Alerts</option>
            <option value="exam">Examination &amp; Admit Cards</option>
            <option value="assignment">Assignments &amp; Labs</option>
            <option value="fee">Fees &amp; Grants</option>
            <option value="general">General Circulars</option>
          </select>
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#0F2747]">You are all caught up!</h3>
          <p className="text-xs text-slate-500 mt-1">No active notifications matching your selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isDeadline = item.priority === 'deadline';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                  !item.is_read
                    ? isUrgent
                      ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                      : isDeadline
                      ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                      : 'bg-white border-[#1E5AA8]/50 shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-600 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                          item.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : item.priority === 'deadline'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : item.priority === 'success'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-blue-100 text-[#1E5AA8] border-blue-300'
                        }`}
                      >
                        {item.priority === 'urgent' ? '🔴 Urgent Action' : item.priority.toUpperCase()}
                      </span>

                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {item.category}
                      </span>

                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" title="Unread" />
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#0F2747]">{item.title}</h3>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(item.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    {item.action_url && item.action_label && (
                      <Link
                        to={item.action_url}
                        className="btn-3d-gold inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shadow-2xs"
                      >
                        <span>{item.action_label}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSnooze(item.id)}
                      className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer"
                    >
                      Snooze 24h
                    </button>
                    {!item.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="px-2.5 py-1 rounded-lg text-[#1E5AA8] hover:bg-blue-50 text-[11px] font-bold cursor-pointer"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
