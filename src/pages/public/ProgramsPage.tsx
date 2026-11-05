import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Code2, Wrench, CheckCircle2, Award, BookOpen, ArrowRight, Laptop, Cpu, ShieldCheck } from 'lucide-react';

export const ProgramsPage: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="py-12 lg:py-16 bg-slate-50 dark:bg-[#0B0E11] min-h-screen text-slate-900 dark:text-[#F0F3F6] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-2">
            {language === 'rw' ? 'Uburezi mu Bumenyingiro n’Imyuga Byemewe na RTB' : 'TVET Accredited Technical Education'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('programsTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#A0AAB8] mt-4 leading-relaxed">
            {t('programsSubtitle')}
          </p>
        </div>

        {/* Deep Dive 1: Software Development */}
        <div className="bg-white dark:bg-[#181D24] rounded-3xl p-8 lg:p-12 border border-slate-200 dark:border-[#2B3139] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-1 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center border border-slate-200 dark:border-[#2B3139]">
                <Code2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                {language === 'rw' ? 'Ishami ry’Ikoranabuhanga (ICT)' : 'Department of ICT'}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('softwareDevTitle')}
              </h2>
              <div className="text-xs font-semibold text-[#0ECB81]">
                {t('softwareDevLevels')}
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                {t('softwareDevDesc')}
              </p>
              <div className="pt-2">
                <Link
                  to="/admissions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <span>{language === 'rw' ? 'Saba Kwiga Software Development' : 'Apply for Software Development'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200/60 dark:border-[#2B3139] space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#3B82F6]" />
                  Core Technical Competencies
                </h4>
                <ul className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Web frontends: HTML5, CSS3, Tailwind, JavaScript, React</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Server Backends: Node.js, Express, Python REST APIs</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Databases: MySQL relational schema design, SQLite & queries</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Mobile: Android and cross-platform mobile basics</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200/60 dark:border-[#2B3139] space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#3B82F6]" />
                  Progression & Level Structure
                </h4>
                <ul className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-2">
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L3 (Year 1):</strong> Programming logic, web fundamentals, hardware assembly, basic databases.</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L4 (Year 2):</strong> Full-stack web development, object-oriented software engineering, network routing.</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L5 (Year 3):</strong> Advanced software architecture, cloud hosting, capstone industrial project & 3-month internship.</li>
                </ul>
              </div>

            </div>

          </div>
        </div>

        {/* Deep Dive 2: Automobile Technology */}
        <div className="bg-white dark:bg-[#181D24] rounded-3xl p-8 lg:p-12 border border-slate-200 dark:border-[#2B3139] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-1 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#202630] text-[#0ECB81] flex items-center justify-center border border-slate-200 dark:border-[#2B3139]">
                <Wrench className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0ECB81]">
                {language === 'rw' ? 'Ishami ry’Ubukanishi n’Ubumenyingiro' : 'Department of Mechanical Engineering'}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('autoTechTitle')}
              </h2>
              <div className="text-xs font-semibold text-[#0ECB81]">
                {t('autoTechLevels')}
              </div>
              <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                {t('autoTechDesc')}
              </p>
              <div className="pt-2">
                <Link
                  to="/admissions"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0ECB81] hover:bg-emerald-600 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <span>{language === 'rw' ? 'Saba Kwiga Automobile Technology' : 'Apply for Automobile Technology'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200/60 dark:border-[#2B3139] space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#0ECB81]" />
                  Core Technical Competencies
                </h4>
                <ul className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-1.5">
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Electronic Fuel Injection (EFI) computer scanner troubleshooting</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Automatic & manual transmission reassembly & torque calibration</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Hydraulic braking, ABS anti-skid systems, power steering overhaul</li>
                  <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#0ECB81] shrink-0 mt-0.5" /> Electric vehicle (EV) safety protocols, inverters & battery cells</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200/60 dark:border-[#2B3139] space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0ECB81]" />
                  Progression & Level Structure
                </h4>
                <ul className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-2">
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L3 (Year 1):</strong> Automotive safety, hand tools, engine fundamentals, chassis lubrication.</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L4 (Year 2):</strong> Engine overhaul, electrical wiring schematics, fuel pumps, suspension geometry.</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">L5 (Year 3):</strong> Computerized sensor diagnostics, workshop management, garage leadership & industrial internship.</li>
                </ul>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
