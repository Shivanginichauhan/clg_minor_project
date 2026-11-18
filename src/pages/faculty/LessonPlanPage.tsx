import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { academicStructureService } from '../../services/academicStructureService.js';
import { facultyFeaturesService, CourseLessonPlan, LessonTopic } from '../../services/facultyFeaturesService.js';
import { FacultyAllocationWithDetails } from '../../data/mockAcademics.js';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';

export const LessonPlanPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [allocations, setAllocations] = useState<FacultyAllocationWithDetails[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('MCA-201');
  const [lessonPlan, setLessonPlan] = useState<CourseLessonPlan | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<{ [unitNumber: number]: boolean }>({ 1: true, 2: true, 3: true, 4: false, 5: false });
  const [loading, setLoading] = useState<boolean>(true);
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

        const initialCode = currentAllocs[0]?.subject?.code || 'MCA-201';
        setSelectedCourseCode(initialCode);
        const plan = facultyFeaturesService.getLessonPlan(initialCode);
        setLessonPlan(plan);
      } catch (err) {
        console.error('Failed to load lesson plan data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSelectCourse = (code: string) => {
    setSelectedCourseCode(code);
    const plan = facultyFeaturesService.getLessonPlan(code);
    setLessonPlan(plan);
  };

  const handleTopicToggle = (unitNumber: number, topicId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'in_progress' : currentStatus === 'in_progress' ? 'pending' : 'completed';
    const updated = facultyFeaturesService.updateTopicStatus(selectedCourseCode, unitNumber, topicId, nextStatus);
    setLessonPlan({ ...updated });
    setFeedback(`Topic status updated to "${nextStatus.replace('_', ' ')}". Student course materials syllabus progress synchronized!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const toggleUnitExpand = (unitNumber: number) => {
    setExpandedUnits(prev => ({ ...prev, [unitNumber]: !prev[unitNumber] }));
  };

  // Compute stats
  const allTopics = lessonPlan?.units.flatMap(u => u.topics) || [];
  const completedTopics = allTopics.filter(t => t.status === 'completed');
  const inProgressTopics = allTopics.filter(t => t.status === 'in_progress');
  const overallProgress = allTopics.length > 0 ? Math.round((completedTopics.length / allTopics.length) * 100) : 0;
  const totalPlannedHours = allTopics.reduce((acc, t) => acc + t.plannedHours, 0);
  const totalCoveredHours = allTopics.reduce((acc, t) => acc + (t.actualHours || (t.status === 'completed' ? t.plannedHours : 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Academic Curriculum Compliance
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §13 Teaching Records</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Course Lesson Plan &amp; Syllabus Tracker
            </h1>
            <p className="text-xs text-[#64748B]">
              Structured topic planning, learning outcomes, and delivery milestones. Synchronized directly with student portals and HOD dashboards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Lesson Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Course Selector & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#1E5AA8]" />
            <span>Select Teaching Course:</span>
          </label>
          <select
            value={selectedCourseCode}
            onChange={(e) => handleSelectCourse(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747] focus:bg-white focus:outline-none focus:border-[#1E5AA8]"
          >
            {allocations.map((a) => (
              <option key={a.id} value={a.subject?.code}>
                {a.subject?.code} - {a.subject?.name}
              </option>
            ))}
            {!allocations.some(a => a.subject?.code === 'MCA-201') && (
              <option value="MCA-201">MCA-201 - Advanced Database Management Systems</option>
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Syllabus Delivery:</span>{' '}
            <strong className={`font-mono ${overallProgress >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {overallProgress}% Complete
            </strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Topics Covered:</span>{' '}
            <strong className="text-[#0F2747] font-mono">{completedTopics.length} / {allTopics.length}</strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            <span className="text-[#64748B]">Teaching Hours:</span>{' '}
            <strong className="text-blue-700 font-mono">{totalCoveredHours} / {totalPlannedHours} hrs</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#0F2747]">Cumulative Academic Term Progress</span>
          <span className="text-[#1E5AA8] font-mono">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#1E5AA8] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
          <span>{completedTopics.length} Topics Completed &bull; {inProgressTopics.length} In Progress &bull; {allTopics.length - completedTopics.length - inProgressTopics.length} Pending</span>
          <span className="font-medium text-emerald-700">Target Pace: On Schedule for May Exam Session</span>
        </div>
      </div>

      {/* Units & Topics Accordion */}
      <div className="space-y-4">
        {lessonPlan?.units.map((unit) => {
          const unitCompleted = unit.topics.filter(t => t.status === 'completed').length;
          const unitPercent = unit.topics.length > 0 ? Math.round((unitCompleted / unit.topics.length) * 100) : 0;
          const isExpanded = expandedUnits[unit.unitNumber] ?? true;

          return (
            <div key={unit.unitNumber} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Unit Header */}
              <div
                onClick={() => toggleUnitExpand(unit.unitNumber)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="text-slate-400 mt-0.5 sm:mt-0">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        Unit {unit.unitNumber}
                      </span>
                      <h3 className="text-sm font-bold text-[#0F2747]">{unit.unitTitle}</h3>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Target Completion: <span className="font-mono">{unit.targetCompletionDate}</span>
                      {unit.actualCompletionDate && (
                        <span className="text-emerald-700 font-semibold ml-2">
                          &bull; Completed on {unit.actualCompletionDate} ✓
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-8 sm:pl-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0F2747]">{unitPercent}%</span>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${unitPercent === 100 ? 'bg-emerald-500' : unitPercent > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                        style={{ width: `${unitPercent}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      unitPercent === 100
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : unitPercent > 0
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {unitPercent === 100 ? 'Completed' : unitPercent > 0 ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Unit Topics Table */}
              {isExpanded && (
                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[#64748B] uppercase font-semibold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Topic Code &amp; Title</th>
                        <th className="py-2.5 px-4">Learning Objective</th>
                        <th className="py-2.5 px-4 text-center">Teaching Aid</th>
                        <th className="py-2.5 px-4 text-center">Planned Hours</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unit.topics.map((topic) => (
                        <tr key={topic.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {topic.code}
                              </span>
                              <span className="font-bold text-[#172033]">{topic.title}</span>
                            </div>
                            {topic.completedDate && (
                              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                Logged completed: {topic.completedDate} ({topic.actualHours || topic.plannedHours} hrs conducted)
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#64748B] max-w-xs">{topic.learningOutcome}</td>
                          <td className="py-3 px-4 text-center text-[11px] text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {topic.teachingAid}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                            {topic.plannedHours} hrs
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                topic.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : topic.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {topic.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleTopicToggle(unit.unitNumber, topic.id, topic.status)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                                topic.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                  : topic.status === 'in_progress'
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-[#0F2747] text-white hover:bg-[#1E5AA8]'
                              }`}
                            >
                              {topic.status === 'completed' ? '✓ Done' : topic.status === 'in_progress' ? 'Mark Done' : 'Start Topic'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
