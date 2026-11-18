import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useSearchParams } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollmentService.js';
import { courseMaterialService, MaterialItem, SyllabusUnit } from '../../services/courseMaterialService.js';
import {
  BookOpen,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Mail,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

export const CourseMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    searchParams.get('subject') || ''
  );
  const [enrolledSubjects, setEnrolledSubjects] = useState<Array<{ code: string; name: string }>>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [syllabusUnits, setSyllabusUnits] = useState<SyllabusUnit[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      enrollmentService.getEnrollmentsByStudent(user.id).then((enrs) => {
        const subs = enrs
          .filter((e) => e.subject)
          .map((e) => ({ code: e.subject!.code, name: e.subject!.name }));
        if (subs.length > 0) {
          setEnrolledSubjects(subs);
          const paramSub = searchParams.get('subject');
          if (paramSub && subs.some((s) => s.code.toLowerCase() === paramSub.toLowerCase())) {
            setSelectedSubjectCode(paramSub.toUpperCase());
          } else {
            setSelectedSubjectCode(subs[0].code);
          }
        }
      });
    }
  }, [user, searchParams]);

  useEffect(() => {
    loadMaterialsAndSyllabus();
  }, [selectedSubjectCode]);

  const loadMaterialsAndSyllabus = async () => {
    setLoading(true);
    try {
      const [mats, units] = await Promise.all([
        courseMaterialService.getMaterials(selectedSubjectCode),
        courseMaterialService.getSyllabusUnits(selectedSubjectCode),
      ]);
      setMaterials(mats);
      setSyllabusUnits(units);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (item: MaterialItem) => {
    courseMaterialService.downloadMaterial(item);
    setToastMessage(`Downloaded "${item.title}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredMaterials = materials.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.title.toLowerCase().includes(q) || m.uploadedBy.name.toLowerCase().includes(q);
    }
    return true;
  });

  const facultyInfo = materials[0]?.uploadedBy || (selectedSubjectCode ? {
    name: 'Course Coordinator',
    designation: 'Department Faculty',
    email: 'academics@university.edu',
    officeHours: 'Mon / Wed 3:00 PM - 5:00 PM',
    cabin: 'Academic Block B, Faculty Wing'
  } : null);

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-[#1E5AA8] border border-blue-200">
                Academic Repository
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                Lecture Notes, Slides &amp; Syllabus Progress
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Course Material &amp; Syllabus Tracker
            </h1>
            <p className="text-xs text-[#64748B]">
              Download verified faculty lecture notes, unit-wise question banks, and monitor term syllabus completion.
            </p>
          </div>

          {/* Subject Switcher */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Course:</label>
            {enrolledSubjects.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No enrolled courses</span>
            ) : (
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-[#0F2747] focus:outline-none focus:border-[#1E5AA8]"
              >
                {enrolledSubjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── FACULTY CONTACT & OFFICE HOURS CARD ── */}
      {facultyInfo && (
        <div className="card-3d bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#1E5AA8] border border-indigo-200 flex items-center justify-center font-bold text-base">
                {facultyInfo.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#0F2747]">{facultyInfo.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    Course Incharge
                  </span>
                </div>
                <p className="text-xs text-slate-500">{facultyInfo.designation}</p>
                <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {facultyInfo.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {facultyInfo.cabin}
                  </span>
                  <span className="flex items-center gap-1 text-[#1E5AA8] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    Office Hours: {facultyInfo.officeHours}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`mailto:${facultyInfo.email}?subject=Student%20Query%20[${selectedSubjectCode}]`}
              className="btn-3d-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Mail className="w-3.5 h-3.5 text-[#1E5AA8]" />
              <span>Consult Faculty</span>
            </a>
          </div>
        </div>
      )}

      {/* ── SYLLABUS PROGRESS TRACKER (Unit 1, 2, 3...) ── */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F2747] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1E5AA8]" />
              <span>Syllabus Unit-Wise Progress &bull; {selectedSubjectCode}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Faculty curriculum completion audit for statutory board</p>
          </div>
          <span className="badge-3d text-[11px] font-bold bg-blue-50 text-[#1E5AA8] border-blue-200">
            Term II Progress
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {syllabusUnits.map((u) => (
            <div
              key={u.unitNumber}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                u.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : u.status === 'in_progress'
                  ? 'border-amber-200 bg-amber-50/50'
                  : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit {u.unitNumber}</span>
                  {u.status === 'completed' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  ) : u.status === 'in_progress' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200">
                      <Clock className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300">
                      Upcoming
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[#0F2747] mt-2 line-clamp-2">{u.title}</h4>
                <div className="mt-2 space-y-1">
                  {u.topics.map((t, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                  <span>Coverage</span>
                  <span>{u.completionPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      u.status === 'completed' ? 'bg-emerald-600' : u.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${u.completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COURSE REPOSITORY & DOWNLOADS ── */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'slides', 'notes', 'lab_manual', 'question_bank'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                  typeFilter === type
                    ? 'bg-[#0F2747] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* List of Material Items */}
        <div className="space-y-3">
          {filteredMaterials.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No notes or slides found matching your filter for {selectedSubjectCode}.
            </div>
          ) : (
            filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#1E5AA8]/50 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E5AA8] flex items-center justify-center shrink-0 border border-blue-200 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase border border-slate-200">
                        Unit {mat.unitNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E5AA8] uppercase border border-blue-200">
                        {mat.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{mat.fileSize} &bull; {mat.fileFormat}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F2747] mt-1">{mat.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Uploaded by {mat.uploadedBy.name} on {mat.uploadedAt} &bull; {mat.downloadsCount} student downloads
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(mat)}
                    className="btn-3d-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Material</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
