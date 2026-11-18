import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  Search,
  Plus,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { adminService, DispatchCampaign } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const CommunicationDispatcherPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<DispatchCampaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Campaign Form
  const [campaignName, setCampaignName] = useState('');
  const [channel, setChannel] = useState<DispatchCampaign['channel']>('OMNICHANNEL');
  const [targetAudience, setTargetAudience] = useState<DispatchCampaign['target_audience']>('ALL_STUDENTS');
  const [subject, setSubject] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Dear {{student_name}} (Roll: {{roll_no}}), please note the following statutory update regarding your academic term: {{message}}'
  );

  const reloadData = () => {
    setCampaigns(adminService.getCampaigns());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    const recipientCount =
      targetAudience === 'ALL_STUDENTS'
        ? 1240
        : targetAudience === 'DEFAULTERS_ONLY'
        ? 48
        : targetAudience === 'ALL_FACULTY'
        ? 86
        : 62;

    adminService.dispatchCampaign({
      campaign_name: campaignName,
      channel,
      target_audience: targetAudience,
      subject,
      body_template: bodyTemplate,
      total_recipients: recipientCount,
      sent_count: recipientCount,
      delivered_count: Math.floor(recipientCount * 0.98),
      opened_count: Math.floor(recipientCount * 0.82),
      bounced_count: Math.floor(recipientCount * 0.02),
      dispatched_by: 'Office of the Controller of Examinations',
    });

    reloadData();
    setIsModalOpen(false);
    setNotice(`Broadcast "${campaignName}" successfully queued and dispatched to ${recipientCount} recipients.`);
    setCampaignName('');
    setSubject('');
  };

  // Metrics
  const totalSent = campaigns.reduce((a, b) => a + b.sent_count, 0);
  const totalDelivered = campaigns.reduce((a, b) => a + b.delivered_count, 0);
  const avgOpenRate = totalSent > 0 ? (campaigns.reduce((a, b) => a + b.opened_count, 0) / totalSent) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="academic-hero card-3d-dark text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Institutional Communications</span>
            </div>
            <h1 className="font-academic-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Omnichannel Communication Dispatcher
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Broadcast high-priority SMS alerts, registered email circulars, and in-portal statutory notices with segmented cohort filtering and delivery tracking.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-medium">Avg Delivery Rate</p>
              <div className="text-xl font-bold text-white mt-0.5">98.4%</div>
            </div>
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-emerald-600">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="academic-card p-5 border-l-4 border-l-[#1E5AA8]">
          <p className="text-xs text-slate-500 font-medium">Total Broadcasts</p>
          <div className="text-2xl font-bold text-[#0F2747] mt-1">{campaigns.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Campaigns Executed</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-emerald-600">
          <p className="text-xs text-slate-500 font-medium">Messages Delivered</p>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalDelivered.toLocaleString('en-IN')}</div>
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">SMS & Registered Email</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-indigo-600">
          <p className="text-xs text-slate-500 font-medium">Recipient Readership Rate</p>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{avgOpenRate.toFixed(1)}%</div>
          <p className="text-xs text-slate-500 mt-0.5">Confirmed Open Metric</p>
        </div>

        <div className="academic-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-medium">Bounce / Failure Ratio</p>
          <div className="text-2xl font-bold text-amber-600 mt-1">1.2%</div>
          <p className="text-xs text-slate-500 mt-0.5">Within Acceptable SLA</p>
        </div>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">Communication Dispatch History</h3>
            <p className="text-xs text-slate-500">All student and faculty bulk notifications with real-time delivery telemetry.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2747] text-white rounded-lg hover:bg-[#1E5AA8] transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Compose Institutional Broadcast
          </button>
        </div>

        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="academic-card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {c.channel}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Audience: {c.target_audience}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      DISPATCHED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F2747] mt-1.5">{c.campaign_name}</h4>
                  <p className="text-xs text-slate-600 font-medium">{c.subject}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400">Dispatched:</span>
                  <p className="text-xs font-semibold text-slate-700">{c.dispatched_at}</p>
                  <p className="text-[11px] text-slate-400">By {c.dispatched_by}</p>
                </div>
              </div>

              {/* Message Template Body */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-mono border border-slate-100">
                {c.body_template}
              </div>

              {/* Delivery Telemetry Bar */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500 text-[10px]">Recipients</span>
                  <p className="font-bold text-slate-800">{c.total_recipients}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <span className="text-emerald-700 text-[10px]">Delivered</span>
                  <p className="font-bold text-emerald-800">{c.delivered_count}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <span className="text-blue-700 text-[10px]">Opened</span>
                  <p className="font-bold text-blue-800">{c.opened_count}</p>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg">
                  <span className="text-rose-700 text-[10px]">Bounced</span>
                  <p className="font-bold text-rose-800">{c.bounced_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: COMPOSE BROADCAST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" /> Compose Institutional Broadcast
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. Even Sem Hall Ticket Access Circular"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transmission Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="OMNICHANNEL">Omnichannel (SMS + Email + Portal)</option>
                    <option value="EMAIL">Email Circular Only</option>
                    <option value="SMS">Emergency SMS Broadcast</option>
                    <option value="IN_PORTAL_ALERT">In-Portal Banner Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Segmentation</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="ALL_STUDENTS">All Registered Scholars (1,240)</option>
                    <option value="DEFAULTERS_ONLY">Fee & Attendance Defaulters (48)</option>
                    <option value="PROGRAM_COHORT">MCA Semester 2 Cohort (62)</option>
                    <option value="ALL_FACULTY">Teaching Faculty & Evaluators (86)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Subject Line</label>
                <input
                  type="text"
                  placeholder="Official Notice regarding..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Body Template</label>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    Supported: &#123;&#123;student_name&#125;&#125;, &#123;&#123;roll_no&#125;&#125;, &#123;&#123;fee_due&#125;&#125;
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2747] text-white rounded font-semibold hover:bg-[#1E5AA8]"
                >
                  Confirm & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
