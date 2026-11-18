import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Users,
  TrendingUp,
  Building2,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  ExternalLink,
  Mail,
  Award,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { adminService, PlacementDrive, AlumniProfile } from '../../services/adminService.js';
import { UniversityCrest } from '../../components/common/UniversityCrest.js';

export const PlacementAlumniPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DRIVES' | 'ALUMNI' | 'PARTNERS'>('DRIVES');
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Drive Form
  const [newDrive, setNewDrive] = useState<Partial<PlacementDrive>>({
    company_name: '',
    role: '',
    package_ctc_lpa: 12.0,
    drive_date: new Date().toISOString().substring(0, 10),
    eligible_programs: ['MCA', 'BTECH_CSE'],
    min_cgpa: 7.0,
    status: 'UPCOMING',
    recruiter_contact: ''
  });

  // New Alumni Form
  const [newAlumni, setNewAlumni] = useState<Partial<AlumniProfile>>({
    full_name: '',
    graduation_year: 2024,
    program: 'MCA',
    company: '',
    designation: '',
    location: 'Bengaluru, India',
    linkedin_url: '',
    email: '',
    mentorship_available: true
  });

  const reloadData = () => {
    setDrives(adminService.getPlacementDrives());
    setAlumni(adminService.getAlumniDirectory());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Metrics
  const avgPackage = drives.length > 0 ? (drives.reduce((a, b) => a + b.package_ctc_lpa, 0) / drives.length).toFixed(1) : '0.0';
  const highestPackage = drives.length > 0 ? Math.max(...drives.map((d) => d.package_ctc_lpa)).toFixed(1) : '0.0';
  const totalOffers = drives.reduce((a, b) => a + b.selected_count, 0);
  const totalMentors = alumni.filter((a) => a.mentorship_available).length;

  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAlumni = alumni.filter((a) => {
    return (
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSaveDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrive.company_name || !newDrive.role) return;

    const driveToSave: PlacementDrive = {
      id: `drive-${Date.now()}`,
      company_name: newDrive.company_name,
      role: newDrive.role,
      package_ctc_lpa: Number(newDrive.package_ctc_lpa) || 6.0,
      drive_date: newDrive.drive_date || new Date().toISOString().substring(0, 10),
      eligible_programs: newDrive.eligible_programs || ['MCA'],
      min_cgpa: Number(newDrive.min_cgpa) || 6.5,
      total_registered: 0,
      selected_count: 0,
      status: (newDrive.status as any) || 'UPCOMING',
      recruiter_contact: newDrive.recruiter_contact || 'hr@company.com'
    };

    adminService.savePlacementDrive(driveToSave);
    setIsDriveModalOpen(false);
    reloadData();
    setSuccessMessage(`Placement drive with ${driveToSave.company_name} recorded successfully.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSaveAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlumni.full_name || !newAlumni.company) return;

    const profileToSave: AlumniProfile = {
      id: `alum-${Date.now()}`,
      full_name: newAlumni.full_name,
      graduation_year: Number(newAlumni.graduation_year) || 2024,
      program: newAlumni.program || 'MCA',
      company: newAlumni.company,
      designation: newAlumni.designation || 'Software Engineer',
      location: newAlumni.location || 'India',
      linkedin_url: newAlumni.linkedin_url,
      email: newAlumni.email || '',
      mentorship_available: Boolean(newAlumni.mentorship_available)
    };

    adminService.registerAlumni(profileToSave);
    setIsAlumniModalOpen(false);
    reloadData();
    setSuccessMessage(`Alumni record for ${profileToSave.full_name} registered in the institutional network.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Imperial Header */}
      <div className="academic-hero text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                <span>Directorate of Corporate Relations &amp; Career Services</span>
              </span>
              <span className="text-[11px] text-slate-300 font-semibold">
                Campus Placements &bull; Global Alumni Network &bull; Industry Liaison
              </span>
            </div>

            <h1 className="font-academic-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Placement &amp; Alumni Career Intelligence
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Track multi-tier corporate recruitment drives, CTC packages, institutional placement statistics, and active alumni mentors spanning Fortune 500 organizations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab === 'DRIVES' ? (
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-amber-300 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Placement Drive</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAlumniModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md hover:bg-amber-300 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Alumnus</span>
              </button>
            )}
            <UniversityCrest size="md" variant="gold" className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-[#1E5AA8]">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Active Placement Drives</span>
          <div className="text-2xl font-extrabold text-[#0F2747] mt-1">{drives.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Corporate Drives in Cycle</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Average Package (CTC)</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{avgPackage} <span className="text-xs font-bold">LPA</span></div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across All Registered Programs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Apex Package Offered</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">₹{highestPackage} <span className="text-xs font-bold">LPA</span></div>
          <p className="text-[11px] text-slate-500 mt-0.5">{totalOffers} Total Candidates Placed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs border-l-4 border-l-purple-600">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Alumni Mentors Active</span>
          <div className="text-2xl font-extrabold text-purple-700 mt-1">{totalMentors} / {alumni.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Open for Scholar Mentorship</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DRIVES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'DRIVES'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Corporate Placement Drives ({drives.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALUMNI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'ALUMNI'
                ? 'bg-[#0F2747] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Alumni &amp; Mentorship Directory ({alumni.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'DRIVES' ? 'Search company or role...' : 'Search alumnus or company...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747] w-64"
            />
          </div>
          <button
            onClick={reloadData}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: CORPORATE PLACEMENT DRIVES */}
      {activeTab === 'DRIVES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrives.map((drive) => (
            <div
              key={drive.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-[#0F2747] transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0F2747] font-extrabold text-sm">
                      {drive.company_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0F2747]">{drive.company_name}</h3>
                      <p className="text-xs text-slate-500">{drive.role}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      drive.status === 'CONCLUDED'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : drive.status === 'ONGOING'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {drive.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Compensation</span>
                    <div className="font-bold text-emerald-700">₹{drive.package_ctc_lpa} LPA</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Drive Date</span>
                    <div className="font-bold text-slate-700">{drive.drive_date}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Min. Cutoff</span>
                    <div className="font-semibold text-slate-700">{drive.min_cgpa} CGPA</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Selected</span>
                    <div className="font-bold text-indigo-700">{drive.selected_count} / {drive.total_registered}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {drive.eligible_programs.map((prog, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                      {prog}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate text-[11px]">{drive.recruiter_contact}</span>
                <button
                  onClick={() => {
                    const updated = {
                      ...drive,
                      status: (drive.status === 'UPCOMING' ? 'ONGOING' : drive.status === 'ONGOING' ? 'CONCLUDED' : 'UPCOMING') as any
                    };
                    adminService.savePlacementDrive(updated);
                    reloadData();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-[#0F2747] hover:text-white rounded-lg transition cursor-pointer"
                >
                  Advance Phase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ALUMNI & MENTORSHIP DIRECTORY */}
      {activeTab === 'ALUMNI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlumni.map((alum) => (
            <div
              key={alum.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-[#0F2747] transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F2747] text-white flex items-center justify-center font-bold text-sm">
                      {alum.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0F2747]">{alum.full_name}</h3>
                      <p className="text-xs text-slate-500">
                        {alum.program} &bull; Class of {alum.graduation_year}
                      </p>
                    </div>
                  </div>

                  {alum.mentorship_available && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Mentor</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Position:</span>
                    <span className="font-bold text-slate-800">{alum.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employer:</span>
                    <span className="font-bold text-[#1E5AA8]">{alum.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-600">{alum.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={`mailto:${alum.email}`}
                  className="text-slate-500 hover:text-[#0F2747] flex items-center gap-1 text-[11px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact</span>
                </a>

                {alum.linkedin_url && (
                  <a
                    href={alum.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Placement Drive Modal */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Schedule Corporate Placement Drive</h3>
                <p className="text-xs text-slate-500">Record upcoming recruitment cycle parameters</p>
              </div>
            </div>

            <form onSubmit={handleSaveDrive} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Microsoft India"
                    value={newDrive.company_name}
                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Software Development Engineer"
                    value={newDrive.role}
                    onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Package CTC (₹ LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newDrive.package_ctc_lpa}
                    onChange={(e) => setNewDrive({ ...newDrive, package_ctc_lpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drive Date *</label>
                  <input
                    type="date"
                    required
                    value={newDrive.drive_date}
                    onChange={(e) => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min. CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDrive.min_cgpa}
                    onChange={(e) => setNewDrive({ ...newDrive, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recruiter Contact Email</label>
                  <input
                    type="email"
                    placeholder="campus@company.com"
                    value={newDrive.recruiter_contact}
                    onChange={(e) => setNewDrive({ ...newDrive, recruiter_contact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Alumnus Modal */}
      {isAlumniModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F2747]">Register University Alumnus</h3>
                <p className="text-xs text-slate-500">Record graduate career placement and mentorship readiness</p>
              </div>
            </div>

            <form onSubmit={handleSaveAlumni} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ananya Verma"
                    value={newAlumni.full_name}
                    onChange={(e) => setNewAlumni({ ...newAlumni, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Graduation Year *</label>
                  <input
                    type="number"
                    required
                    value={newAlumni.graduation_year}
                    onChange={(e) => setNewAlumni({ ...newAlumni, graduation_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., MCA or B.Tech CSE"
                    value={newAlumni.program}
                    onChange={(e) => setNewAlumni({ ...newAlumni, program: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employer / Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Google"
                    value={newAlumni.company}
                    onChange={(e) => setNewAlumni({ ...newAlumni, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Systems Architect"
                    value={newAlumni.designation}
                    onChange={(e) => setNewAlumni({ ...newAlumni, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Hyderabad, India"
                    value={newAlumni.location}
                    onChange={(e) => setNewAlumni({ ...newAlumni, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={newAlumni.linkedin_url}
                  onChange={(e) => setNewAlumni({ ...newAlumni, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2747]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mentorCheck"
                  checked={newAlumni.mentorship_available}
                  onChange={(e) => setNewAlumni({ ...newAlumni, mentorship_available: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F2747] cursor-pointer"
                />
                <label htmlFor="mentorCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Available for Student Mentorship &amp; Mock Interview Sessions
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAlumniModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0F2747] hover:bg-[#1E5AA8] text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Alumnus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
