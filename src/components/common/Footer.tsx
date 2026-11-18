import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, BookOpen, ExternalLink, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { UniversityCrest } from './UniversityCrest.js';

interface FooterProps {
  className?: string;
  variant?: 'dashboard' | 'auth' | 'homepage';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'dashboard' }) => {
  if (variant === 'homepage') {
    return (
      <footer
        id="ueams-homepage-footer"
        className={`bg-[#0B192C] text-slate-300 border-t-2 border-[#C59B27]/40 pt-10 pb-8 mt-auto ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Col 1: University Seal & Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UniversityCrest size="md" variant="gold" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-academic-serif font-black text-base text-white tracking-wide">
                      ITM University
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ESTD. 1984
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-200/80 font-medium">
                    Office of the Controller of Examinations
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous statutory portal ensuring tamper-proof academic evaluations, cryptographic verification, and state-wide examination governance.
              </p>
              <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                  <span>North Avenue, Sector 14, Capital Region</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                  <a href="mailto:coe@ITMuniversity.edu.in" className="text-blue-300 hover:text-white transition-colors">
                    coe@ITMuniversity.edu.in
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                  <span>+91 (011) 2874-5500 (COE Helpdesk)</span>
                </div>
              </div>
            </div>

            {/* Col 2: Access Portals */}
            <div className="space-y-3.5">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-2">
                <span className="w-1.5 h-3 bg-[#C59B27] rounded-sm"></span>
                Access Portals
              </h5>
              <ul className="space-y-2 text-xs">
                {[
                  ['Student Examination Desk', '/login'],
                  ['Faculty & Evaluator Portal', '/login'],
                  ['Dean of Academic Affairs', '/login'],
                  ['Admin & COE Controller Console', '/login'],
                  ['Student Profile Self-Registration', '/signup']
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-slate-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                    >
                      <span className="text-[#C59B27] text-[10px]">&rsaquo;</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Examination Services */}
            <div className="space-y-3.5">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-2">
                <span className="w-1.5 h-3 bg-[#1E5AA8] rounded-sm"></span>
                Examination Cell
              </h5>
              <ul className="space-y-2 text-xs">
                {[
                  ['Admit Card / Hall Ticket Retrieval', '#verify'],
                  ['Online Result Gazette Verification', '#verify'],
                  ['Statutory Circulars & Timetables', '#notices'],
                  ['Examination Ordinance 2026', '#lifecycle'],
                  ['Grievance & Scrutiny Redressal', '#faqs']
                ].map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-slate-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-150"
                    >
                      <span className="text-blue-400 text-[10px]">&rsaquo;</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Statutory Accreditations */}
            <div className="space-y-3.5">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/60 pb-2">
                <span className="w-1.5 h-3 bg-emerald-500 rounded-sm"></span>
                Accreditations
              </h5>
              <div className="space-y-2.5">
                {[
                  { title: 'NAAC Grade A++', subtitle: 'Highest Institutional Grade (CGPA 3.82)', icon: Award, color: 'text-amber-400' },
                  { title: 'UGC Autonomous', subtitle: 'Recognized under Sec 2(f) & 12(B)', icon: BookOpen, color: 'text-blue-400' },
                  { title: 'ISO 27001:2022', subtitle: 'Tamper-Proof Examination Security', icon: ShieldCheck, color: 'text-emerald-400' }
                ].map(({ title, subtitle, icon: Icon, color }) => (
                  <div
                    key={title}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 hover:bg-slate-800 transition"
                  >
                    <Icon className={`w-5 h-5 ${color} shrink-0`} />
                    <div>
                      <div className="font-bold text-white text-xs leading-none">{title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright & System Health */}
          <div className="pt-6 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} ITM University &bull; Office of the Controller of Examinations. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (99.98%)</span>
              </span>
              <span className="text-slate-500 hidden md:inline">&bull;</span>
              <a href="#overview" className="hover:text-white transition hidden md:inline">Examination Bye-Laws</a>
              <span className="text-slate-500 hidden md:inline">&bull;</span>
              <span className="text-slate-400">UEAMS v2.4</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      id="ueams-global-footer"
      className={`border-t border-slate-200 bg-white/95 text-xs text-slate-500 transition-colors mt-auto ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
          {/* University Identity & Crest */}
          <div className="flex items-center gap-3">
            <UniversityCrest size="sm" variant="gold" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-academic-serif font-bold text-sm text-[#0F2747]">
                  ITM University
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  ESTD. 1984
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Statutory Examination &amp; Academic Governance Portal &bull; Office of the Controller of Examinations
              </p>
            </div>
          </div>

          {/* Compliance & Accreditation Badges */}
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-bold">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>NAAC Grade A++ Accredited</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>UGC CBCS 10-Point Scale</span>
            </span>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} ITM University. All institutional examination data is protected under the State Universities Act &amp; IT Act 2000.
          </p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span className="hover:text-[#0F2747] transition cursor-pointer">Examination Bye-Laws</span>
            <span>&bull;</span>
            <span className="hover:text-[#0F2747] transition cursor-pointer">Ordinance 2026</span>
            <span>&bull;</span>
            <span className="hover:text-[#0F2747] transition cursor-pointer">Grievance Cell</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

