import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { facultyFeaturesService, FacultyAnnouncement } from '../../services/facultyFeaturesService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  Bell,
  Send,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Eye,
  Check,
  Smartphone,
  Mail,
  Layers,
  Sparkles
} from 'lucide-react';

export const FacultyAnnouncementsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [announcements, setAnnouncements] = useState<FacultyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('MCA-201');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [urgency, setUrgency] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');
  const [channelPortal, setChannelPortal] = useState<boolean>(true);
  const [channelEmail, setChannelEmail] = useState<boolean>(true);
  const [channelSms, setChannelSms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const allAllocs = await academicStructureService.getAllocations();
        const facultyAllocs = allAllocs.filter((a) => {
          if (!user) return true;
          return a.faculty_id === user.id || a.faculty?.profile?.id === user.id;
        });
        const currentAllocs = facultyAllocs.length > 0 ? facultyAllocs : allAllocs.slice(0, 3);
        setAllocations(currentAllocs);

        if (currentAllocs[0]?.subject?.code) {
          setSelectedSubjectCode(currentAllocs[0].subject.code);
        }

        const list = facultyFeaturesService.getAnnouncements();
        setAnnouncements(list);
      } catch (err) {
        console.error('Failed to load announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and message.');
      return;
    }

    setSubmitting(true);
    try {
      const matchAlloc = allocations.find(a => a.subject?.code === selectedSubjectCode);
      const subjectName = matchAlloc?.subject?.name || 'Advanced Database Management Systems';

      const newAnc = facultyFeaturesService.createAnnouncement({
        faculty_id: user?.id || 'fac-001',
        faculty_name: profile?.full_name || 'Dr. Priya Nambiar',
        target_subject_code: selectedSubjectCode,
        target_subject_name: subjectName,
        title,
        message,
        urgency,
        channels: {
          portal: channelPortal,
          email: channelEmail,
          sms: channelSms
        }
      });

      setAnnouncements(facultyFeaturesService.getAnnouncements());
      setTitle('');
      setMessage('');
      setFeedback(`Announcement dispatched successfully to 58 enrolled students of ${selectedSubjectCode}!`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      alert('Error publishing announcement: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
              Direct Communication Desk
            </span>
            <span className="text-xs text-[#64748B] font-medium">Research §14 Targeted Broadcasts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
            Class Announcements &amp; Notice Center
          </h1>
          <p className="text-xs text-[#64748B]">
            Broadcast schedule updates, quiz dates, and laboratory instructions directly to enrolled student cohorts across Portal, Email, and SMS.
          </p>
        </div>
      </div>

      {/* Success Feedback */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Compose Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#1E5AA8]" />
            <span>Compose Targeted Announcement</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Dispatches instantaneously</span>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F2747] mb-1.5">
                Target Student Cohort (Course):
              </label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
              >
                {allocations.map((a) => (
                  <option key={a.id} value={a.subject?.code}>
                    {a.subject?.code} - {a.subject?.name} (All Enrolled)
                  </option>
                ))}
                {!allocations.some(a => a.subject?.code === 'MCA-201') && (
                  <option value="MCA-201">MCA-201 - Advanced Database Management Systems</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2747] mb-1.5">Urgency Level:</label>
              <div className="flex items-center gap-2 pt-0.5">
                {(['Normal', 'Important', 'Urgent'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      urgency === lvl
                        ? lvl === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : lvl === 'Important'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-[#0F2747] text-white border-[#0F2747]'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F2747] mb-1.5">Subject / Notice Title:</label>
            <input
              type="text"
              placeholder="e.g., Postponement of Mid-term Quiz on Query Optimization..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F2747] mb-1.5">Announcement Details:</label>
            <textarea
              rows={3}
              placeholder="Type your notice or detailed instructional guidance here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-[#0F2747]">Broadcast Channels:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channelPortal}
                  onChange={(e) => setChannelPortal(e.target.checked)}
                  className="rounded text-[#1E5AA8]"
                />
                <span className="text-slate-700">Student Portal</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="rounded text-[#1E5AA8]"
                />
                <span className="text-slate-700">Official Email</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channelSms}
                  onChange={(e) => setChannelSms(e.target.checked)}
                  className="rounded text-[#1E5AA8]"
                />
                <span className="text-slate-700">SMS Gateway</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Delivered Class Announcements &amp; Read Receipts
          </h3>
          <span className="text-[11px] text-[#1E5AA8] font-mono">{announcements.length} Sent</span>
        </div>

        <div className="divide-y divide-slate-100">
          {announcements.map((a) => (
            <div key={a.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {a.target_subject_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      a.urgency === 'Urgent'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : a.urgency === 'Important'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    {a.urgency}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Dispatched on {new Date(a.sent_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#0F2747]">{a.title}</h4>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{a.message}</p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                  <span>Dispatched By: <strong className="text-slate-700">{a.faculty_name}</strong></span>
                  <span>&bull;</span>
                  <span>Channels: {a.channels.portal && 'Portal '} {a.channels.email && 'Email '} {a.channels.sms && 'SMS'}</span>
                </div>
              </div>

              {/* Read / Acknowledged Metrics */}
              <div className="flex items-center gap-3 shrink-0 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center text-xs">
                <div>
                  <div className="text-emerald-700 font-bold font-mono">{a.metrics.delivered}</div>
                  <div className="text-[10px] text-slate-500">Delivered</div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <div className="text-blue-700 font-bold font-mono">{a.metrics.read}</div>
                  <div className="text-[10px] text-slate-500">Read</div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <div className="text-indigo-700 font-bold font-mono">{a.metrics.acknowledged}</div>
                  <div className="text-[10px] text-slate-500">Ack</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
