import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { GraduationCap, MapPin, Phone, Mail, Award, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-50 dark:bg-[#11151B] text-slate-700 dark:text-[#A0AAB8] border-t border-slate-200 dark:border-[#2B3139] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Col 1: Brand & TVET Accreditation */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCD535] to-[#B37800] flex items-center justify-center text-slate-950 font-black shadow-sm">
                <GraduationCap className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-[#F0F3F6]">IBB BUBERUKA</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#707A8A] leading-relaxed">
              Institut Baptiste de Buberuka is an accredited TVET institution in Rwanda providing hands-on technical diplomas in Software Development and Automobile Technology.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#0ECB81] pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Accredited by Rwanda TVET Board (RTB)</span>
            </div>
          </div>

          {/* Col 2: Academic Programs */}
          <div>
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-[#F0F3F6] mb-4">
              Academic Programs
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-[#A0AAB8]">
              <li>
                <Link to="/programs" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Software Development (L3, L4, L5)
                </Link>
              </li>
              <li>
                <Link to="/programs" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Automobile Technology (L3, L4, L5)
                </Link>
              </li>
              <li>
                <Link to="/admissions" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Boarding & Accommodation Criteria
                </Link>
              </li>
              <li>
                <Link to="/admissions" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Admissions Guidelines 2026-2027
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-[#F0F3F6] mb-4">
              Student & Staff Portal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-[#A0AAB8]">
              <li>
                <Link to="/admissions" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Online Admission Application
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Track Application Status
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  Staff Administrative Login
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-slate-900 dark:hover:text-[#F0F3F6] transition-colors">
                  General Inquiries & Campus Visits
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Coordinates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-900 dark:text-[#F0F3F6] mb-4">
              Campus Location
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-[#A0AAB8]">
              <MapPin className="w-4 h-4 text-[#FCD535] shrink-0 mt-0.5" />
              <span>Buberuka District, Northern Province, Republic of Rwanda</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-[#A0AAB8]">
              <Phone className="w-4 h-4 text-[#FCD535] shrink-0" />
              <span className="font-mono">+250 788 123 456 / +250 788 234 567</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-[#A0AAB8]">
              <Mail className="w-4 h-4 text-[#FCD535] shrink-0" />
              <span className="font-mono">admissions@ibb.ac.rw · info@ibb.ac.rw</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-[#252B33] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-[#707A8A] gap-4">
          <p>© 2026 Institut Baptiste de Buberuka (IBB). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 dark:hover:text-[#A0AAB8]">Excellence</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-600 dark:hover:text-[#A0AAB8]">Integrity</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-600 dark:hover:text-[#A0AAB8]">Technical Stewardship</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
