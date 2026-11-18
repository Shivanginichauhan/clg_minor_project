import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  performanceAnalyticsService,
  PerformanceAnalyticsData,
  SubjectAnalytics
} from '../../services/performanceAnalyticsService.js';

export const PerformanceAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PerformanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await performanceAnalyticsService.getAnalytics(user?.id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#1E5AA8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Generating CBCS Performance Analytics &amp; Trend Graphs...</p>
      </div>
    );
  }

  // Format chart data for Subject Comparison
  const subjectChartData = data.subjects.map((s) => ({
    name: s.subject_code,
    fullName: s.subject_name,
    'Your Score': s.student_score,
    'Class Average': s.class_average,
    'Highest Score': s.highest_score
  }));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="academic-hero text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-3d text-[10px] px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold uppercase tracking-wider">
                Academic Council Longitudinal Evaluation
              </span>
            </div>
            <h1 className="font-academic-serif text-2xl font-bold tracking-tight">
              Performance Analytics &amp; Grade Trends
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Comparative analysis of semester grade point averages (SGPA), internal assessment diagnostics, cohort percentile rank, and subject strengths.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-center">
              <p className="text-[10px] uppercase font-bold text-amber-300">Cohort Rank</p>
              <p className="text-base font-extrabold text-white mt-0.5">
                Top {100 - Math.round(data.percentile)}% &bull; #{data.classRank} of {data.totalStudents}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cumulative CGPA</p>
          <p className="text-2xl font-academic-display font-extrabold text-[#0F2747] mt-0.5">{data.currentCGPA}</p>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">First Class with Distinction</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Percentile</p>
          <p className="text-2xl font-academic-display font-extrabold text-purple-700 mt-0.5">{data.percentile}%</p>
          <p className="text-[10px] text-purple-800 font-semibold mt-1">Ahead of {Math.round((data.percentile / 100) * data.totalStudents)} peers</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best Subject Area</p>
          <p className="text-base font-bold text-[#1E5AA8] mt-1 truncate">Cloud Systems (MCA-202)</p>
          <p className="text-[10px] text-slate-500 mt-1">Score: 92% (Top 3% Cohort)</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Focus Recommendation</p>
          <p className="text-base font-bold text-amber-700 mt-1 truncate">DBMS Attendance</p>
          <p className="text-[10px] text-amber-800 font-semibold mt-1">Attend 3 classes to cross 75%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Semester Trend Chart (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1E5AA8]" />
              SGPA Trend Progression
            </h3>
            <span className="text-[10px] font-mono font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              UGC 10-Point Scale
            </span>
          </div>

          <div className="h-64 w-full min-w-0 min-h-[256px]">
            <ResponsiveContainer width="100%" height={256} minWidth={100} minHeight={256}>
              <LineChart data={data.semesterTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                <YAxis domain={[6.0, 10.0]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2747', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="sgpa"
                  name="Your SGPA"
                  stroke="#1E5AA8"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="class_average"
                  name="Class Average"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 italic text-center">
            Consistently performing +1.35 grade points above batch average across all completed semesters.
          </p>
        </div>

        {/* Subject Comparison Bar Chart (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Subject Score vs Cohort Average
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Continuous Evaluation (100m)
            </span>
          </div>

          <div className="h-64 w-full min-w-0 min-h-[256px]">
            <ResponsiveContainer width="100%" height={256} minWidth={100} minHeight={256}>
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2747', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Your Score" fill="#1E5AA8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Class Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 italic text-center">
            Surpassed class average in 4 out of 4 core subjects in current semester.
          </p>
        </div>
      </div>

      {/* Diagnostic Subject Breakdown & Recommendations */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#0F2747] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
          Detailed Subject CIA Diagnostic &amp; Faculty Recommendations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.subjects.map((sub) => (
            <div
              key={sub.subject_code}
              className={`p-5 rounded-2xl bg-white border shadow-2xs space-y-3 ${
                sub.status === 'needs_attention'
                  ? 'border-amber-300'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#1E5AA8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {sub.subject_code}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        sub.status === 'strong'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'needs_attention'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-[#1E5AA8]'
                      }`}
                    >
                      {sub.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0F2747] mt-1">{sub.subject_name}</h4>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-[#0F2747]">{sub.student_score}%</span>
                  <p className="text-[10px] text-slate-400">Percentile: {sub.percentile}%</p>
                </div>
              </div>

              {/* Assessment Breakdown Chips */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500">Quiz 1</p>
                  <p className="font-bold text-[#0F2747] mt-0.5">
                    {sub.assessment_breakdown.quiz1.score}/{sub.assessment_breakdown.quiz1.max}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500">Quiz 2</p>
                  <p className="font-bold text-[#0F2747] mt-0.5">
                    {sub.assessment_breakdown.quiz2.score}/{sub.assessment_breakdown.quiz2.max}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500">Midterm</p>
                  <p className="font-bold text-[#0F2747] mt-0.5">
                    {sub.assessment_breakdown.midterm.score}/{sub.assessment_breakdown.midterm.max}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500">CIA Asg</p>
                  <p className="font-bold text-[#0F2747] mt-0.5">
                    {sub.assessment_breakdown.assignment.score}/{sub.assessment_breakdown.assignment.max}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Actionable Recommendation</span>
                  <span className={sub.attendance_percent < 75 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                    Attendance: {sub.attendance_percent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{sub.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
