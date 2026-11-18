import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useSearchParams, Link } from 'react-router-dom';
import { academicStructureService } from '../../services/academicStructureService.js';
import { courseMaterialService, MaterialItem } from '../../services/courseMaterialService.js';
import {
  Layers,
  Upload,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BookOpen,
  Eye,
  Filter,
  Search,
  Users
} from 'lucide-react';

export const FacultyMaterialsPage: React.FC = () => {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || '';

  const [subjects, setSubjects] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [unitNumber, setUnitNumber] = useState<number>(1);
  const [type, setType] = useState<'slides' | 'notes' | 'lab_manual' | 'question_bank'>('slides');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'PPTX' | 'ZIP'>('PDF');
  const [fileSize, setFileSize] = useState('3.8 MB');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    // Load faculty's assigned courses
    academicStructureService.getAllocations().then((allocs) => {
      const myAllocs = allocs.filter((a) => {
        if (!user) return true;
        if (user.role === 'administrator' || user.role === 'dean') return true;
        return a.faculty_id === user.id || a.faculty?.id === user.id || a.faculty?.profile?.id === user.id;
      });
      if (myAllocs.length > 0) {
        const subs = myAllocs
          .filter((a) => a.subject)
          .map((a) => ({ code: a.subject!.code, name: a.subject!.name }));
        setSubjects(subs);
        const qSub = searchParams.get('subject');
        if (qSub && subs.some((s) => s.code.toLowerCase() === qSub.toLowerCase())) {
          setSelectedSubject(qSub.toUpperCase());
        } else {
          setSelectedSubject(subs[0].code);
        }
      }
    });
  }, [user, searchParams]);

  useEffect(() => {
    loadMaterials();
  }, [selectedSubject]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const mats = await courseMaterialService.getMaterials(selectedSubject);
      setMaterials(mats);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setToastMessage({ text: 'Please enter a resource title.', type: 'error' });
      return;
    }

    const currentSub = subjects.find((s) => s.code === selectedSubject);
    await courseMaterialService.uploadMaterial({
      subjectCode: selectedSubject,
      subjectName: currentSub?.name || selectedSubject,
      unitNumber: Number(unitNumber),
      title: title.trim(),
      type,
      fileFormat,
      fileSize,
      uploadedBy: {
        name: profile?.full_name || 'Prof. Ananya Sen',
        designation: (profile as any)?.title || 'Associate Professor',
        email: profile?.email || 'faculty@university.edu',
        officeHours: 'Mon / Wed 3:00 PM - 5:00 PM',
        cabin: 'Academic Block B, Room 304',
      },
    });

    setToastMessage({
      text: `Resource "${title}" published successfully! Students enrolled in ${selectedSubject} can now download it.`,
      type: 'success',
    });
    setTitle('');
    setIsUploadOpen(false);
    await loadMaterials();
  };

  const handleDelete = async (id: string, matTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${matTitle}"?`)) {
      await courseMaterialService.deleteMaterial(id);
      setToastMessage({ text: `Removed "${matTitle}" from course repository.`, type: 'success' });
      await loadMaterials();
    }
  };

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`card-3d p-4 rounded-2xl shadow-xs flex items-center justify-between gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss alert">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="academic-hero card-3d-dark text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge-3d text-[11px] px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>Course Content &amp; Learning Repository</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Student Portal Sync</span>
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Course Study Materials &amp; Lecture Notes Management
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Upload and manage certified lecture presentation slides, revision notes, lab manuals, and question banks for your assigned courses. Files sync directly to registered student portals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-3d-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white text-blue-950 hover:bg-blue-50"
            >
              <Upload className="w-4 h-4 text-[#1E5AA8]" />
              <span>Upload Learning Material</span>
            </button>
            <Link
              to={`/student/materials?subject=${selectedSubject}`}
              target="_blank"
              className="btn-3d-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 border-white/20"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>Preview Student View</span>
            </Link>
          </div>
        </div>
      </div>

      {/* No assigned subjects alert */}
      {subjects.length === 0 && !loading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>No assigned subjects found for your account. Please contact your department HOD to assign course allocations.</span>
        </div>
      )}

      {/* Control Bar: Subject Selector + Search */}
      <div className="card-3d bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#0F2747] whitespace-nowrap">Course / Subject:</label>
          {subjects.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No assigned subjects</span>
          ) : (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F2747] focus:outline-none focus:border-[#1E5AA8] min-w-[260px]"
            >
              {subjects.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} &ndash; {sub.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search uploaded titles..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E5AA8]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <span className="badge-3d text-xs font-bold bg-slate-100 text-slate-700">
            {filtered.length} Resource(s)
          </span>
        </div>
      </div>

      {/* Repository Listing */}
      <div className="card-3d bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F2747]">
              Published Course Assets &bull; {selectedSubject}
            </h2>
            <p className="text-xs text-slate-500">Live verified materials accessible to all enrolled students</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading course materials...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p>No materials uploaded for {selectedSubject} yet.</p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn-3d-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload First Slide / Note</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#1E5AA8]/50 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
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
                      <span className="text-xs font-mono text-slate-400">
                        {mat.fileSize} &bull; {mat.fileFormat}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F2747] mt-1">{mat.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Uploaded {mat.uploadedAt}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {mat.downloadsCount} student downloads
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => courseMaterialService.downloadMaterial(mat)}
                    className="btn-3d-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 text-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id, mat.title)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete resource"
                    aria-label={`Delete ${mat.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#1E5AA8]" />
                <h3 className="text-base font-bold text-[#0F2747]">Upload Course Material</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
                aria-label="Close upload modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Course</label>
                <input
                  type="text"
                  value={selectedSubject}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Title / Chapter Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Lock Manager (DLM) & Two-Phase Locking"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Syllabus Unit</label>
                  <select
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  >
                    {[1, 2, 3, 4, 5].map((u) => (
                      <option key={u} value={u}>
                        Unit {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Resource Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="slides">Lecture Presentation Slides</option>
                    <option value="notes">Class Handout / Summary Notes</option>
                    <option value="lab_manual">Laboratory Experiment Manual</option>
                    <option value="question_bank">Question Bank &amp; Solutions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">File Format</label>
                  <select
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  >
                    <option value="PDF">Adobe Acrobat (PDF)</option>
                    <option value="PPTX">Microsoft PowerPoint (PPTX)</option>
                    <option value="ZIP">Archive Bundle (ZIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">File Size</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 4.2 MB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1E5AA8]"
                  />
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-600 block">Select Document to Attach</span>
                <span className="text-[10px] text-slate-400">PDF, PPTX, ZIP up to 25MB supported</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish to Student Portal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
