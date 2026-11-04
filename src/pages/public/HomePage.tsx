import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LeadershipCarousel } from '../../components/common/LeadershipCarousel';
import { api } from '../../services/api';
import {
  GraduationCap,
  ArrowRight,
  Code2,
  Wrench,
  Award,
  Users,
  Building,
  CheckCircle2,
  Sparkles,
  Compass,
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>({
    totalStudentsEnrolled: 424,
    academicPrograms: 2,
    approvedAdmissionsThisSession: 38,
    totalApplicationsReceived: 56,
    activeSuppliers: 3,
    foodReservesKg: 4910,
    nationalExamSuccessRate: '98.6%',
    practicalJobPlacementRate: '94.2%',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/public-stats');
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch {
        // Fallback to default state
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0E11] text-slate-900 dark:text-[#F0F3F6] transition-colors">
      
      {/* ======================================================== */}
      {/* 1. HOMEPAGE HERO WITH BINANCE MIDNIGHT ATMOSPHERE */}
      {/* ======================================================== */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-900 via-[#0B0E11] to-[#0B0E11]">
        {/* Campus Background Image with Measured Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80"
            alt="Institut Baptiste de Buberuka Campus"
            className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11] via-[#0B0E11]/85 to-[#0B0E11]/60" />
        </div>

        {/* Subtle Binance Gold Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FCD535]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 flex-1 flex flex-col justify-center items-center text-center">
          
          {/* Admissions announcement banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181D24]/90 text-[#FCD535] border border-[#FCD535]/30 text-xs font-semibold backdrop-blur-md mb-6 animate-fadeIn shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FCD535]" />
            <span>{t('heroBadge')}</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl text-balance leading-tight mb-6">
            {t('heroHeadline')}
          </h1>

          {/* Value proposition subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 dark:text-[#A0AAB8] max-w-2xl text-pretty leading-relaxed mb-8">
            {t('heroSubtitle')}
          </p>

          {/* The Three Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 mb-6 w-full max-w-xl sm:max-w-none px-4 sm:px-0">
            {/* Button 1: Apply for Admission (Binance Gold Action) */}
            <Link
              to="/admissions"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl shadow-lg shadow-[#FCD535]/20 hover:-translate-y-0.5 transition-all w-full sm:w-auto cursor-pointer"
            >
              <span>{t('heroApplyBtn')}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>

            {/* Button 2: Explore Programs */}
            <Link
              to="/programs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#181D24]/90 hover:bg-[#202630] border border-[#2B3139] backdrop-blur-md rounded-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              <Compass className="w-4 h-4 text-[#0ECB81] shrink-0" />
              <span>{t('heroExploreBtn')}</span>
            </Link>

            {/* Button 3: Track Application */}
            <Link
              to="/track"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-200 hover:text-white bg-[#11151B]/90 hover:bg-[#181D24] border border-[#2B3139] backdrop-blur-md rounded-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
            >
              <FileCheck2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
              <span>{t('heroTrackBtn')}</span>
            </Link>
          </div>

          {/* ======================================================== */}
          {/* COMPACT LEADERSHIP CAROUSEL INSIDE HERO BACKGROUND */}
          {/* Placed immediately below 3 hero buttons and above stats */}
          {/* ======================================================== */}
          <LeadershipCarousel />

        </div>

        {/* ======================================================== */}
        {/* 2. REAL DATABASE-BACKED STATISTICS STRIP (BINANCE FINANCIAL STYLE) */}
        {/* ======================================================== */}
        <div className="relative z-10 w-full border-t border-[#2B3139] bg-[#11151B]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              
              <div className="space-y-1 p-2 rounded-xl bg-[#181D24]/60 border border-[#2B3139]/60">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F0F3F6] font-mono tabular-nums">
                  {stats.totalStudentsEnrolled}
                </span>
                <span className="block text-xs font-medium text-[#A0AAB8]">
                  {t('statsStudents')}
                </span>
              </div>

              <div className="space-y-1 p-2 rounded-xl bg-[#181D24]/60 border border-[#2B3139]/60">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#3B82F6] font-mono tabular-nums">
                  {stats.academicPrograms}
                </span>
                <span className="block text-xs font-medium text-[#A0AAB8]">
                  {t('statsPrograms')} (L3–L5)
                </span>
              </div>

              <div className="space-y-1 p-2 rounded-xl bg-[#181D24]/60 border border-[#2B3139]/60">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0ECB81] font-mono tabular-nums">
                  {stats.approvedAdmissionsThisSession}
                </span>
                <span className="block text-xs font-medium text-[#A0AAB8]">
                  {t('statsApproved')}
                </span>
              </div>

              <div className="space-y-1 p-2 rounded-xl bg-[#181D24]/60 border border-[#2B3139]/60">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FCD535] font-mono tabular-nums">
                  {stats.practicalJobPlacementRate}
                </span>
                <span className="block text-xs font-medium text-[#A0AAB8]">
                  {t('statsPlacement')}
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. ACADEMIC PROGRAMS SHOWCASE */}
      {/* ======================================================== */}
      <section className="py-20 bg-slate-50 dark:bg-[#0B0E11] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FCD535] mb-2">
              TVET Competency-Based Training (CBT)
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('programsTitle')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-[#A0AAB8] mt-3 leading-relaxed">
              {t('programsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Program 1: Software Development */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl p-8 border border-slate-200 dark:border-[#2B3139] hover:border-[#3B82F6]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center mb-6 border border-slate-200 dark:border-[#2B3139]">
                  <Code2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-[#F0F3F6] mb-2">
                  {t('softwareDevTitle')}
                </h4>
                <div className="text-xs font-semibold text-[#0ECB81] mb-4">
                  {t('softwareDevLevels')}
                </div>
                <p className="text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed mb-6">
                  {t('softwareDevDesc')}
                </p>

                <div className="space-y-2 mb-6">
                  {[
                    'Full-stack Web & Mobile Development (React, Node.js, Python)',
                    'Relational & NoSQL Database Design and Administration',
                    'Algorithms, Data Structures & Automated Testing',
                    'DevOps, Version Control (Git) & Cloud Fundamentals',
                  ].map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#F0F3F6]">
                      <CheckCircle2 className="w-4 h-4 text-[#0ECB81] shrink-0" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-[#2B3139] flex items-center justify-between">
                <Link
                  to="/programs"
                  className="text-xs font-bold text-[#3B82F6] hover:underline inline-flex items-center gap-1"
                >
                  <span>Program Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/admissions"
                  className="px-4 py-2 text-xs font-semibold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-lg transition-colors"
                >
                  Apply for Software
                </Link>
              </div>
            </div>

            {/* Program 2: Automobile Technology */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl p-8 border border-slate-200 dark:border-[#2B3139] hover:border-[#0ECB81]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#202630] text-[#0ECB81] flex items-center justify-center mb-6 border border-slate-200 dark:border-[#2B3139]">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-[#F0F3F6] mb-2">
                  {t('autoTechTitle')}
                </h4>
                <div className="text-xs font-semibold text-[#0ECB81] mb-4">
                  {t('autoTechLevels')}
                </div>
                <p className="text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed mb-6">
                  {t('autoTechDesc')}
                </p>

                <div className="space-y-2 mb-6">
                  {[
                    'Electronic Fuel Injection (EFI) Computer Diagnostics',
                    'Modern Transmission Overhaul & Hybrid Powertrains',
                    'Anti-lock Braking Systems (ABS) & Chassis Steering',
                    'Electrical Systems Wiring & Air Conditioning Repair',
                  ].map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#F0F3F6]">
                      <CheckCircle2 className="w-4 h-4 text-[#0ECB81] shrink-0" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-[#2B3139] flex items-center justify-between">
                <Link
                  to="/programs"
                  className="text-xs font-bold text-[#0ECB81] hover:underline inline-flex items-center gap-1"
                >
                  <span>Program Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/admissions"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0ECB81] hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  Apply for Automobile
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. INSTITUTIONAL ADVANTAGES & CAMPUS LIFE */}
      {/* ======================================================== */}
      <section className="py-20 bg-white dark:bg-[#11151B] border-t border-slate-200 dark:border-[#2B3139]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            
            <div className="lg:col-span-1 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535]">
                Why Choose IBB Buberuka
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F0F3F6] tracking-tight">
                Holistic Formation in Faith and Technology
              </h3>
              <p className="text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                Founded on Christian integrity and professional technical rigor, Institut Baptiste de Buberuka prepares students not only to pass exams, but to thrive as entrepreneurial leaders in Rwanda’s evolving industrial landscape.
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#3B82F6] hover:underline"
                >
                  <span>Read full history and mission statement</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#181D24] border border-slate-200/80 dark:border-[#2B3139]">
                <Building className="w-6 h-6 text-[#3B82F6] mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] mb-1.5">
                  Full Modern Boarding Campus
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  Clean dormitories, nutritious school dining, 24/7 security, discipline animation, and supervised study periods for boys and girls.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#181D24] border border-slate-200/80 dark:border-[#2B3139]">
                <Wrench className="w-6 h-6 text-[#0ECB81] mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] mb-1.5">
                  Industry-Grade Workshops
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  Computer labs with high-speed internet and modern automotive mechanic bays equipped with genuine engine diagnostic scanners.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#181D24] border border-slate-200/80 dark:border-[#2B3139]">
                <Award className="w-6 h-6 text-[#FCD535] mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] mb-1.5">
                  RTB Accredited Diplomas
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  Every graduate receives an official TVET certificate recognized across the East African Community (EAC) for university progression or employment.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#181D24] border border-slate-200/80 dark:border-[#2B3139]">
                <Users className="w-6 h-6 text-purple-400 mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] mb-1.5">
                  Industrial Internship Placement
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  Direct partnership with top tech software firms in Kigali and automotive repair garages across Musanze, Gicumbi, and Kigali.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CALL TO ACTION STRIP (BINANCE ELEVATED SURFACE) */}
      {/* ======================================================== */}
      <section className="py-16 bg-[#11151B] border-t border-[#2B3139] text-[#F0F3F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Ready to build your technical career with IBB?
            </h3>
            <p className="text-xs text-[#A0AAB8] max-w-xl leading-relaxed">
              Applications for Academic Year 2026-2027 are currently being accepted. Space in Software Development and Automobile Technology is allocated on merit.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/admissions"
              className="px-6 py-3 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Start Admission Application
            </Link>
            <Link
              to="/contact"
              className="px-5 py-3 text-xs font-semibold text-[#F0F3F6] bg-[#202630] hover:bg-[#262D38] border border-[#2B3139] rounded-xl transition-colors whitespace-nowrap"
            >
              Contact Registrar
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
