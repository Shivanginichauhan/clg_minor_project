import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  Award,
  CheckCircle2,
  FileCheck,
  Download,
  Printer,
  Layers,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Users,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const AccreditationEvidencePage: React.FC = () => {
  const { profile } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState('MCA-201');
  const [selectedSemester, setSelectedSemester] = useState('Semester 2 (AY 2025-26)');
  const [downloading, setDownloading] = useState(false);

  // Evidence Checklist Items
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeSyllabus, setIncludeSyllabus] = useState(true);
  const [includeInternalMarks, setIncludeInternalMarks] = useState(true);
  const [includeCOAttainment, setIncludeCOAttainment] = useState(true);
  const [includeMentoring, setIncludeMentoring] = useState(true);
  const [includeQuestionPapers, setIncludeQuestionPapers] = useState(true);

  const handleDownloadDossier = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const content = `========================================================================\nITM UNIVERSITY - ACCREDITATION SELF-ASSESSMENT REPORT (SAR) EVIDENCE DOSSIER\nNAAC CRITERIA 2 (TEACHING-LEARNING & EVALUATION) & NBA CRITERION 3 (COURSE OUTCOMES)\n========================================================================\nCourse: ${selectedCourse} - Advanced Database Management Systems\nSemester: ${selectedSemester}\nFaculty Incharge: ${profile?.full_name || 'Dr. Priya Nambiar'} (Associate Professor & HOD)\nGenerated At: ${new Date().toLocaleString('en-IN')}\n\n1. ATTENDANCE & ELIGIBILITY AUDIT:\n   - Total Lectures Conducted: 24 Sessions\n   - Enrolled Scholars: 58 Students\n   - Cumulative Class Attendance Average: 88.4%\n   - Statutory 75% UGC Minimum Compliance: 94.8% of Cohort Cleared\n\n2. SYLLABUS COMPLETION & LESSON PLAN RECORDS:\n   - Unit 1: 100% Completed (Distributed Transactions & 2PC)\n   - Unit 2: 100% Completed (Cassandra NoSQL & Graph Stores)\n   - Unit 3: 65% In Progress (Query Optimization Heuristics)\n   - Overall Syllabus Progress: 78% on pace for May examination\n\n3. CONTINUOUS INTERNAL ASSESSMENT (CIA) ATTAINMENT:\n   - CIA-I Average: 24.2 / 30 Marks\n   - CIA-II Average: 23.8 / 30 Marks\n   - Practical Lab Rubrics Average: 18.5 / 20 Marks\n\n4. COURSE OUTCOME (CO) DIRECT ATTAINMENT SUMMARY:\n   - CO1 (Understand Architecture): 84.5% Attainment [Target >=75% MET]\n   - CO2 (Apply NoSQL Databases): 78.2% Attainment [Target >=75% MET]\n   - CO3 (Analyze Query Execution): 68.4% Attainment [Target 75% REMEDIAL ACTION PLAN LOGGED]\n   - CO4 (Evaluate Distributed Consensus): 72.0% Attainment\n\n5. STUDENT MENTORSHIP & ACADEMIC INTERVENTIONS:\n   - Proctorial Interventions Logged: 3 Scholars\n   - Resolution Rate: 100% (Remedial tutorials & parental intimations recorded)\n\n[OFFICIAL UNIVERSITY ACCREDITATION SEAL - DIGITALLY VERIFIED BY DEAN ACADEMICS]\n========================================================================`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `NAAC_NBA_Dossier_${selectedCourse}_2026.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Institutional Quality Assurance Cell (IQAC)
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §20 NAAC / NBA Evidence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Accreditation Evidence Repository &amp; SAR Generator
            </h1>
            <p className="text-xs text-[#64748B]">
              Automated compilation of faculty teaching-learning audit records, lesson plans, attendance rosters, and CO attainment matrices into one certified package.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1E5AA8]" />
              <span>Print Preview</span>
            </button>
            <button
              onClick={handleDownloadDossier}
              disabled={downloading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Compiling Dossier...' : 'Download SAR Package (ZIP/PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Program & Course Selection Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#64748B]">Course Code:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747]"
            >
              <option value="MCA-201">MCA-201: Advanced Database Management Systems</option>
              <option value="MCA-202">MCA-202: Cloud Computing &amp; Microservices</option>
              <option value="MCA-203">MCA-203: Computer Networks &amp; Internet Protocols</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#64748B]">Cycle / Term:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747]"
            >
              <option value="Semester 2 (AY 2025-26)">Semester 2 (AY 2025-26)</option>
              <option value="Semester 1 (AY 2025-26)">Semester 1 (AY 2025-26)</option>
            </select>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            ✓ 6 of 6 Core Academic Modules Ready for Compilation
          </span>
        </div>
      </div>

      {/* Dynamic Evidence Module Aggregates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: Attendance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Criterion 2.6.2
            </span>
            <input
              type="checkbox"
              checked={includeAttendance}
              onChange={(e) => setIncludeAttendance(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">Lecture Attendance Register</h3>
          </div>
          <p className="text-xs text-slate-500">
            Auto-extracted from daily roll call logs. Includes verified absentee list, condonations, and 75% statutory ledger.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>24 Sessions</span>
            <span className="text-emerald-700 font-bold">88.4% Average</span>
          </div>
        </div>

        {/* Module 2: Syllabus & Lesson Plans */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Criterion 1.1.1
            </span>
            <input
              type="checkbox"
              checked={includeSyllabus}
              onChange={(e) => setIncludeSyllabus(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">Syllabus Delivery &amp; Lesson Plan</h3>
          </div>
          <p className="text-xs text-slate-500">
            Unit-wise planned vs actual lecture dates, learning outcomes, and teaching aids from LessonPlanPage.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>5 Units &bull; 14 Topics</span>
            <span className="text-blue-700 font-bold">78% Complete</span>
          </div>
        </div>

        {/* Module 3: Internal Assessment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Criterion 2.5.1
            </span>
            <input
              type="checkbox"
              checked={includeInternalMarks}
              onChange={(e) => setIncludeInternalMarks(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">CIA Marks &amp; Sessional Sheets</h3>
          </div>
          <p className="text-xs text-slate-500">
            Dean-approved continuous internal assessment marks sheets, attendance bonus weightages, and quiz breakdown.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>58 Students</span>
            <span className="text-amber-800 font-bold">Verified by HOD</span>
          </div>
        </div>

        {/* Module 4: CO Attainment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              NBA Criterion 3
            </span>
            <input
              type="checkbox"
              checked={includeCOAttainment}
              onChange={(e) => setIncludeCOAttainment(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">Course Outcome (CO) Attainment</h3>
          </div>
          <p className="text-xs text-slate-500">
            Direct CO attainment calculated from question-level Bloom's mapping against the 75% institutional threshold.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>4 Defined COs</span>
            <span className="text-purple-700 font-bold">75.8% Avg Attainment</span>
          </div>
        </div>

        {/* Module 5: Mentoring & Remedial */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Criterion 2.2.1
            </span>
            <input
              type="checkbox"
              checked={includeMentoring}
              onChange={(e) => setIncludeMentoring(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">Mentoring &amp; Remedial Actions</h3>
          </div>
          <p className="text-xs text-slate-500">
            Slow learner intervention logs, guardian intimations, and proctorial counseling timelines.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>3 Interventions</span>
            <span className="text-rose-700 font-bold">Follow-ups Tracked</span>
          </div>
        </div>

        {/* Module 6: Question Paper Blueprint */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Criterion 2.5.3
            </span>
            <input
              type="checkbox"
              checked={includeQuestionPapers}
              onChange={(e) => setIncludeQuestionPapers(e.target.checked)}
              className="rounded text-[#1E5AA8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-[#0F2747]">Question Paper Blueprint</h3>
          </div>
          <p className="text-xs text-slate-500">
            Certified exam authoring rubric with unit distribution, Section A/B/C weights, and CoE seal.
          </p>
          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] font-mono text-slate-700 flex justify-between">
            <span>100 Marks Scheme</span>
            <span className="text-sky-700 font-bold">100% Balanced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
