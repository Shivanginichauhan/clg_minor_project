import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { examRegistrationService } from '../../services/examRegistrationService.js';
import { scholarshipService } from '../../services/scholarshipService.js';
import { resultsService } from '../../services/resultsService.js';
import { grievanceService } from '../../services/grievanceService.js';
import { attendanceService } from '../../services/attendanceService.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Filter,
  Search,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface UnifiedRequestItem {
  id: string;
  referenceNo: string;
  type: 'exam_form' | 'scholarship' | 'revaluation' | 'grievance' | 'condonation';
  title: string;
  department: string;
  submittedAt: string;
  status: 'pending' | 'in_review' | 'approved' | 'resolved' | 'rejected';
  statusLabel: string;
  targetUrl: string;
  details: string;
}

export const MyRequestsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<UnifiedRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllRequests();
  }, [user]);

  const loadAllRequests = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const studentId = user.id;
      const [examApp, scholarships, revaluations, grievances, condonations] = await Promise.all([
        examRegistrationService.getStudentApplication(studentId),
        scholarshipService.getApplications({ studentId }),
        resultsService.getRevaluations({ studentId }),
        grievanceService.getGrievances(studentId, profile?.full_name),
        attendanceService.getAllCondonations(),
      ]);

      const unified: UnifiedRequestItem[] = [];

      // 1. Exam Registration Form
      if (examApp) {
        unified.push({
          id: examApp.id,
          referenceNo: examApp.application_no,
          type: 'exam_form',
          title: 'May 2026 Term-End Examination Registration',
          department: 'Office of Controller of Examinations',
          submittedAt: examApp.submitted_at || '2026-04-18',
          status: examApp.payment_status === 'paid' ? 'approved' : 'pending',
          statusLabel: examApp.payment_status === 'paid' ? 'Registered & Cleared' : 'Payment Pending',
          targetUrl: '/student/exam-apply',
          details: `${(examApp.regular_papers?.length || 0) + (examApp.backlog_papers?.length || 0)} Papers Registered &bull; Fees ₹${examApp.total_amount_paid}`,
        });
      }

      // 2. Scholarship Applications
      scholarships.forEach((s) => {
        unified.push({
          id: s.id,
          referenceNo: s.application_no,
          type: 'scholarship',
          title: s.scheme_name,
          department: 'Dean Office & Academic Council',
          submittedAt: s.created_at,
          status: s.status === 'disbursed' || s.status === 'sanctioned_by_dean' ? 'approved' : s.status === 'verified_by_advisor' ? 'in_review' : s.status === 'rejected' ? 'rejected' : 'pending',
          statusLabel: s.status.replace(/_/g, ' ').toUpperCase(),
          targetUrl: '/student/scholarships',
          details: `Requested Benefit: ₹${s.applied_amount || s.sanctioned_amount || 50000} &bull; Academic Year 2025-26`,
        });
      });

      // 3. Revaluation Applications
      revaluations.forEach((r) => {
        unified.push({
          id: r.id,
          referenceNo: r.application_number,
          type: 'revaluation',
          title: `${r.service_type === 're_evaluation' ? 'Paper Re-Evaluation' : 'Re-Totaling'}: ${r.subject_code}`,
          department: 'Examination Evaluation Center',
          submittedAt: r.applied_at,
          status: r.status === 'revised' || r.status === 'no_change' ? 'resolved' : r.status === 'rejected' ? 'rejected' : 'in_review',
          statusLabel: r.status.replace(/_/g, ' ').toUpperCase(),
          targetUrl: '/student/results',
          details: `${r.subject_name} &bull; Original Grade: ${r.original_grade}`,
        });
      });

      // 4. Grievance Tickets
      grievances.forEach((g) => {
        unified.push({
          id: g.id,
          referenceNo: g.ticket_no,
          type: 'grievance',
          title: g.subject,
          department: g.department,
          submittedAt: g.created_at,
          status: g.status === 'resolved' ? 'resolved' : g.status === 'in_progress' ? 'in_review' : 'pending',
          statusLabel: g.status.replace('_', ' ').toUpperCase(),
          targetUrl: '/student/grievance',
          details: `Category: ${g.category.toUpperCase()} &bull; Priority: ${g.priority.toUpperCase()}`,
        });
      });

      // 5. Medical Condonations
      const myConds = condonations.filter((c) => c.student_id === studentId || c.student_id === 'stu-001');
      myConds.forEach((c) => {
        const missed = (c as any).missed_classes_count ?? (c as any).missed_classes ?? 0;
        const subDate = (c as any).created_at ?? (c as any).applied_date ?? new Date().toISOString();
        unified.push({
          id: c.id,
          referenceNo: `COND-MED-${c.id.slice(-6)}`,
          type: 'condonation',
          title: `Medical Condonation: ${missed} Missed Lectures`,
          department: 'Dean Student Affairs',
          submittedAt: subDate,
          status: c.status === 'approved' ? 'approved' : c.status === 'pending' ? 'in_review' : 'rejected',
          statusLabel: c.status.toUpperCase(),
          targetUrl: '/student/attendance',
          details: `${c.from_date} to ${c.to_date} &bull; Reason: ${c.reason}`,
        });
      });

      // Sort by date descending
      unified.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setRequests(unified);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.referenceNo.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                Consolidated Tracking Desk
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Unified Student Governance Pipeline
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              My Requests &amp; Application Status
            </h1>
            <p className="text-xs text-[#64748B]">
              Track your exam forms, scholarship disbursals, revaluation requests, grievances, and medical condonations in one live ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllRequests}
              className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'exam_form', label: 'Exam Form' },
              { id: 'scholarship', label: 'Scholarship' },
              { id: 'revaluation', label: 'Revaluation' },
              { id: 'grievance', label: 'Grievance' },
              { id: 'condonation', label: 'Condonation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterType === tab.id
                    ? 'bg-[#0F2747] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or ref no..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No filed applications found matching your criteria.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#1E5AA8]/50 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {req.referenceNo}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#1E5AA8] border border-blue-200">
                        {req.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {req.submittedAt}</span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0F2747] mt-1">{req.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5" dangerouslySetInnerHTML={{ __html: req.details }} />
                    <p className="text-[11px] text-slate-400 mt-0.5">Routed to: {req.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      req.status === 'approved' || req.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : req.status === 'in_review'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {req.statusLabel}
                  </span>

                  <Link
                    to={req.targetUrl}
                    className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1 text-[#1E5AA8]"
                  >
                    <span>View Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
