import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  facultyFeaturesService,
  ResearchPublication,
  FdpWorkshop
} from '../../services/facultyFeaturesService.js';
import {
  Award,
  BookOpen,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export const ResearchProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [fdps, setFdps] = useState<FdpWorkshop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New publication state
  const [pubType, setPubType] = useState<ResearchPublication['type']>('Journal');
  const [pubTitle, setPubTitle] = useState('');
  const [pubVenue, setPubVenue] = useState('');
  const [pubYear, setPubYear] = useState<number>(2026);
  const [pubDoi, setPubDoi] = useState('');
  const [pubIndexing, setPubIndexing] = useState<ResearchPublication['indexing']>('Scopus');
  const [pubImpact, setPubImpact] = useState<string>('4.2');
  const [pubAuthors, setPubAuthors] = useState(profile?.full_name || 'Dr. Priya Nambiar');

  useEffect(() => {
    const data = facultyFeaturesService.getResearchData();
    setPublications(data.publications);
    setFdps(data.fdps);
  }, []);

  const handleAddPublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubVenue.trim()) {
      alert('Please fill out title and venue name.');
      return;
    }

    try {
      facultyFeaturesService.addPublication({
        type: pubType,
        title: pubTitle,
        venueName: pubVenue,
        year: pubYear,
        doi: pubDoi,
        indexing: pubIndexing,
        impactFactor: parseFloat(pubImpact) || undefined,
        authors: pubAuthors
      });

      const updated = facultyFeaturesService.getResearchData();
      setPublications(updated.publications);
      setIsModalOpen(false);
      setPubTitle('');
      setPubVenue('');
      setPubDoi('');
      setFeedback('New scholarly research paper logged and indexed for UGC Career Advancement Scheme (CAS)!');
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      alert('Failed to log publication: ' + err.message);
    }
  };

  const totalFdpDays = fdps.reduce((acc, f) => acc + f.durationDays, 0);
  const requiredFdpDays = 10;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                UGC Career Advancement &amp; NAAC Criteria 3
              </span>
              <span className="text-xs text-[#64748B] font-medium">Research §19 Scholarly Profile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F2747] tracking-tight">
              Research, Publications &amp; FDP Repository
            </h1>
            <p className="text-xs text-[#64748B]">
              Centralized record of Scopus/Web of Science journals, conference proceedings, patents, and faculty development training.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export UGC API Report</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Publication</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Feedback */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Total Publications</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">{publications.length} Papers</div>
          <p className="text-[11px] text-slate-500">Scopus &bull; IEEE &bull; Patents</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Journal Impact</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">5.4 Max IF</div>
          <p className="text-[11px] text-slate-500">IEEE Transactions on Cloud</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>UGC FDP Mandatory Days</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">
            {totalFdpDays} <span className="text-sm font-normal text-slate-500">/ {requiredFdpDays} Days</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">2 Days remaining for AY 2025-26</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Patents Filed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#0F2747] font-mono">1 Patent</div>
          <p className="text-[11px] text-slate-500">Indian Patent Office Granted</p>
        </div>
      </div>

      {/* Publications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Indexed Scholarly Publications &amp; Patents
          </h3>
          <span className="text-[11px] text-[#1E5AA8] font-mono">{publications.length} Records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {publications.map((pub) => (
            <div key={pub.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {pub.type}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {pub.indexing}
                  </span>
                  {pub.impactFactor && (
                    <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                      IF: {pub.impactFactor}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 font-mono">Year {pub.year}</span>
                </div>

                <h4 className="text-sm font-bold text-[#0F2747]">{pub.title}</h4>
                <p className="text-xs text-slate-600 italic">{pub.venueName}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                  <span>Authors: <strong className="text-slate-700">{pub.authors}</strong></span>
                  {pub.doi && (
                    <>
                      <span>&bull;</span>
                      <span className="text-[#1E5AA8] font-mono flex items-center gap-1">
                        DOI: {pub.doi} <ExternalLink className="w-3 h-3" />
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-1">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Verified by R&amp;D Cell
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FDPs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Faculty Development Programs (FDPs) &amp; Pedagogical Workshops
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">{totalFdpDays} Days Completed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {fdps.map((fdp) => (
            <div key={fdp.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 mr-2">
                  {fdp.type} &bull; {fdp.durationDays} Days
                </span>
                <span className="font-bold text-[#0F2747]">{fdp.title}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Organized by: {fdp.organizingBody} &bull; {fdp.startDate} to {fdp.endDate}
                </p>
              </div>

              <div className="shrink-0">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ✓ Certificate Endorsed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Publication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">UGC / CAS Scholarly Upload</span>
                <h3 className="text-base font-bold text-[#0F2747]">Add Research Publication / Patent</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPublication} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Publication Type:</label>
                  <select
                    value={pubType}
                    onChange={(e) => setPubType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="Journal">Journal Article</option>
                    <option value="Conference">Conference Paper</option>
                    <option value="Book Chapter">Book Chapter</option>
                    <option value="Patent">Patent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Indexing Database:</label>
                  <select
                    value={pubIndexing}
                    onChange={(e) => setPubIndexing(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="Scopus">Scopus</option>
                    <option value="Web of Science">Web of Science</option>
                    <option value="IEEE Xplore">IEEE Xplore</option>
                    <option value="UGC CARE">UGC CARE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Title of Paper / Invention:</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Query Optimization in Multi-Cloud Environments..."
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Journal / Conference / Patent Body:</label>
                <input
                  type="text"
                  placeholder="e.g. IEEE Transactions on Cloud Computing"
                  value={pubVenue}
                  onChange={(e) => setPubVenue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Publication Year:</label>
                  <input
                    type="number"
                    value={pubYear}
                    onChange={(e) => setPubYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">Impact Factor:</label>
                  <input
                    type="text"
                    value={pubImpact}
                    onChange={(e) => setPubImpact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0F2747] mb-1">DOI / Patent ID:</label>
                  <input
                    type="text"
                    placeholder="10.1109/..."
                    value={pubDoi}
                    onChange={(e) => setPubDoi(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F2747] mb-1">Authors (comma-separated):</label>
                <input
                  type="text"
                  value={pubAuthors}
                  onChange={(e) => setPubAuthors(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white shadow-xs cursor-pointer"
                >
                  Index Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
