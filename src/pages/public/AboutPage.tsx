import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  Target,
  Sparkles,
  MapPin,
  Award,
  Calendar,
  Layers,
  Cpu,
  Wrench,
  UtensilsCrossed,
  Trophy,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  ArrowRight
} from 'lucide-react';

interface GalleryItem {
  id: number;
  category: 'campus' | 'software' | 'auto' | 'life';
  titleEn: string;
  titleRw: string;
  descEn: string;
  descRw: string;
  imageUrl: string;
}

export const AboutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  // Keyboard navigation for Lightbox (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, activeCategory]);

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      category: 'campus',
      titleEn: 'IBB Main Administrative & Academic Block',
      titleRw: 'Inyubako Nkuru y’Ubuyobozi n’Amasomo muri IBB',
      descEn: 'Architectural facade overlooking the scenic northern hills of Buberuka in Burera District.',
      descRw: 'Inyubako nkuru igaragara neza ku misozi y’Amajyaruguru mu Karere ka Burera i Buberuka.',
      imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      category: 'software',
      titleEn: 'Advanced Computer Programming Laboratory',
      titleRw: 'Icyumba cya Mudasobwa Zigezweho z’Ikoranabuhanga',
      descEn: 'Equipped with fiber optic internet, multi-monitor coding desks, and Linux development servers.',
      descRw: 'Gifite murandasi yihuta cyane, mudasobwa zifite imbaraga zo gukora porogaramu na za seriveri.',
      imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      category: 'auto',
      titleEn: 'Automotive Mechanical Bay & Diagnostic Scanners',
      titleRw: 'Icyumba cy’Ubukanishi bw’Imodoka no Gusuzuma Moteri',
      descEn: 'Hands-on training bay with hydraulic lifts, EFI computerized analyzers, and brake test benches.',
      descRw: 'Aho abanyeshuri bimenyereza gukanika imodoka hakoreshejwe ibyuma bizamura imodoka na mudasobwa.',
      imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 4,
      category: 'software',
      titleEn: 'Collaborative Student Software Teams',
      titleRw: 'Amatsinda y’Abanyeshuri Bakora Porogaramu',
      descEn: 'Level 4 and Level 5 developers building full-stack applications for Rwandan enterprise needs.',
      descRw: 'Abanyeshuri b’inzego za L4 na L5 bakorera hamwe imishinga y’ikoranabuhanga ikemura ibibazo.',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 5,
      category: 'auto',
      titleEn: 'Engine Disassembly & Overhaul Practical Workstation',
      titleRw: 'Gukanika Moteri Z’Imodoka mu Buryo Bufatika',
      descEn: 'Practical component analysis of common-rail diesel systems and gasoline electronic ignition.',
      descRw: 'Gusobanukirwa moteri zikoresha mazutu na lisansi hifashishijwe uburyo bwa kijyambere.',
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 6,
      category: 'life',
      titleEn: 'Boarding Facilities & Dining Refectory',
      titleRw: 'Amacumbi y’Abanyeshuri n’Icyumba Cy’Amafunguro',
      descEn: 'Spacious, hygienic dining hall serving balanced meals audited through computerized food inventory.',
      descRw: 'Icyumba cy’amafunguro gifite isuku gitanga ibiryo byiza bicungirwa ku ikoranabuhanga.',
      imageUrl: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 7,
      category: 'campus',
      titleEn: 'Campus Chapel & Spiritual Formation Center',
      titleRw: 'Urusengero rw’Ishuri n’Aho Gukura mu Mwuka',
      descEn: 'Weekly Christian chapel services fostering ethical character, fellowship, and servant leadership.',
      descRw: 'Amateraniro n’amasengesho bifasha abanyeshuri gukura mu kwizera no kugira umuco mwiza.',
      imageUrl: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 8,
      category: 'life',
      titleEn: 'Sports Grounds & Physical Wellness',
      titleRw: 'Ibibuga by’Imikino n’Imyidagaduro y’Abanyeshuri',
      descEn: 'Football and volleyball fields supporting inter-school championships and healthy student life.',
      descRw: 'Ibibuga by’umupira w’amaguru na volleyball bifasha abanyeshuri kugira ubuzima bwiza no kuruhuka.',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const filteredPhotos = activeCategory === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % filteredPhotos.length;
    setSelectedPhoto(filteredPhotos[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setSelectedPhoto(filteredPhotos[prevIndex]);
  };

  return (
    <div className="py-10 sm:py-16 bg-slate-50 dark:bg-[#0B0E11] min-h-screen text-slate-900 dark:text-[#F0F3F6] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        
        {/* ======================================================== */}
        {/* SECTION 1: ABOUT IBB INSTITUTIONAL PROFILE & HERO */}
        {/* ======================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('aboutHeroBadge')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('aboutTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            {t('aboutSubtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-slate-500 dark:text-[#707A8A]">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
              <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Burera District, Northern Province, Rwanda</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
              <Award className="w-3.5 h-3.5 text-[#FCD535]" />
              <span>Accredited TVET L3, L4, L5 (RTB & NESA)</span>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: INSTITUTIONAL HISTORY & FOUNDATION TIMELINE */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#181D24] rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 dark:border-[#2B3139] shadow-sm space-y-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-1">
              Historical Heritage & Foundation
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('historyTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A0AAB8] mt-1">
              {t('historySubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            <p className="p-5 rounded-2xl bg-slate-50 dark:bg-[#11151B] border border-slate-200/60 dark:border-[#252B33]">
              {t('historyP1')}
            </p>
            <p className="p-5 rounded-2xl bg-slate-50 dark:bg-[#11151B] border border-slate-200/60 dark:border-[#252B33]">
              {t('historyP2')}
            </p>
          </div>

          {/* 4 Milestones Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-[#252B33]">
            {[
              {
                year: t('milestone1Year'),
                title: t('milestone1Title'),
                desc: t('milestone1Desc'),
                accent: 'border-[#FCD535] text-[#B37800] dark:text-[#FCD535]',
              },
              {
                year: t('milestone2Year'),
                title: t('milestone2Title'),
                desc: t('milestone2Desc'),
                accent: 'border-[#3B82F6] text-[#3B82F6]',
              },
              {
                year: t('milestone3Year'),
                title: t('milestone3Title'),
                desc: t('milestone3Desc'),
                accent: 'border-[#0ECB81] text-[#0ECB81]',
              },
              {
                year: t('milestone4Year'),
                title: t('milestone4Title'),
                desc: t('milestone4Desc'),
                accent: 'border-[#8B5CF6] text-[#8B5CF6]',
              },
            ].map((milestone, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#202630] border border-slate-200/60 dark:border-[#2B3139] flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className={`text-base font-black font-mono tracking-wider block mb-1 ${milestone.accent}`}>
                    {milestone.year}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {milestone.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#A0AAB8] leading-relaxed">
                  {milestone.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: MISSION, VISION & CORE VALUES */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-1">
              Ethical & Academic Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Mission, Vision & Institutional Ethos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Mission */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center mb-5 border border-slate-200 dark:border-[#2B3139]">
                  <Target className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {t('missionTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  {t('missionDesc')}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#252B33] text-[11px] font-mono text-[#3B82F6] font-semibold">
                Competency-Based Education (CBT)
              </div>
            </div>

            {/* Vision */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#202630] text-[#0ECB81] flex items-center justify-center mb-5 border border-slate-200 dark:border-[#2B3139]">
                  <Sparkles className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {t('visionTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  {t('visionDesc')}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#252B33] text-[11px] font-mono text-[#0ECB81] font-semibold">
                Regional Technical Mastery
              </div>
            </div>

            {/* Core Values */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-[#202630] text-[#FCD535] flex items-center justify-center mb-5 border border-slate-200 dark:border-[#2B3139]">
                  <HeartHandshake className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {t('valuesTitle')}
                </h3>
                <ul className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-2 leading-relaxed">
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">{t('valIntegrity')}:</strong> {t('valIntegrityDesc')}</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">{t('valRigor')}:</strong> {t('valRigorDesc')}</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">{t('valDiscipline')}:</strong> {t('valDisciplineDesc')}</li>
                  <li><strong className="text-slate-900 dark:text-[#F0F3F6]">{t('valService')}:</strong> {t('valServiceDesc')}</li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#252B33] text-[11px] font-mono text-[#B37800] dark:text-[#FCD535] font-semibold">
                Christian Discipline & Ethics
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: CAMPUS INFRASTRUCTURE & FACILITIES */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-1">
              State-of-the-Art Environment
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('campusTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A0AAB8] mt-1">
              {t('campusSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Facility 1: Computer Lab */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col group">
              <div className="h-44 overflow-hidden relative bg-[#202630]">
                <img
                  src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&auto=format&fit=crop&q=80"
                  alt="Computer Lab"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1769FF] text-white">
                  SOFTWARE LAB
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {t('facilityComputer')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                    {t('facilityComputerDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Facility 2: Automotive Bay */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col group">
              <div className="h-44 overflow-hidden relative bg-[#202630]">
                <img
                  src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80"
                  alt="Automotive Workshop Bay"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0ECB81] text-slate-950">
                  AUTO WORKSHOP
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {t('facilityAuto')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                    {t('facilityAutoDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Facility 3: Boarding Dorms & Dining */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col group">
              <div className="h-44 overflow-hidden relative bg-[#202630]">
                <img
                  src="https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&auto=format&fit=crop&q=80"
                  alt="Boarding & Dining"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535] text-slate-950">
                  SMART DINING
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {t('facilityDorms')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                    {t('facilityDormsDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Facility 4: Sports & Chapel */}
            <div className="bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2B3139] shadow-sm flex flex-col group">
              <div className="h-44 overflow-hidden relative bg-[#202630]">
                <img
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80"
                  alt="Sports & Chapel"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8B5CF6] text-white">
                  CAMPUS LIFE
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {t('facilitySports')}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                    {t('facilitySportsDesc')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: INTERACTIVE PHOTO GALLERY WITH LIGHTBOX */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-1">
                Visual Experience
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('galleryTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A0AAB8] mt-1">
                {t('gallerySubtitle')}
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-2xs">
              {[
                { key: 'all', label: t('galleryAll') },
                { key: 'campus', label: t('galleryCampus') },
                { key: 'software', label: t('gallerySoftware') },
                { key: 'auto', label: t('galleryAuto') },
                { key: 'life', label: t('galleryLife') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === tab.key
                      ? 'bg-[#FCD535] text-slate-950 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] shadow-sm cursor-pointer aspect-4/3"
              >
                <img
                  src={photo.imageUrl}
                  alt={language === 'rw' ? photo.titleRw : photo.titleEn}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FCD535]">
                      {photo.category.toUpperCase()}
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                  </div>
                  <h4 className="text-xs font-bold leading-tight">
                    {language === 'rw' ? photo.titleRw : photo.titleEn}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header bar */}
              <div className="p-4 flex items-center justify-between border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535] text-slate-950 uppercase">
                    {selectedPhoto.category}
                  </span>
                  <h3 className="text-sm font-bold truncate max-w-md">
                    {language === 'rw' ? selectedPhoto.titleRw : selectedPhoto.titleEn}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title={t('closeModal')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo View */}
              <div className="relative max-h-[65vh] flex items-center justify-center bg-black/60">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={language === 'rw' ? selectedPhoto.titleRw : selectedPhoto.titleEn}
                  className="max-h-[65vh] w-auto max-w-full object-contain"
                />

                {/* Left/Right controls */}
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white transition-all cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white transition-all cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Caption footer */}
              <div className="p-4 bg-slate-900 text-slate-300 text-xs border-t border-white/10">
                <p>{language === 'rw' ? selectedPhoto.descRw : selectedPhoto.descEn}</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 6: KEY ADMINISTRATIVE OFFICERS */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-1">
              Leadership & Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('keyLeadershipTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A0AAB8] mt-1">
              {t('keyLeadershipSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: t('roleDirector'),
                name: 'Rev. Habimana Celestin',
                desc: language === 'rw'
                  ? 'Ayobora imirimo yose y’uburezi, uburere bwa gikirisitu, n’iterambere ry’ikigo cya IBB.'
                  : 'Supervises administrative, academic, spiritual, and institutional development policies across IBB.',
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
              },
              {
                role: t('roleAccountant'),
                name: 'Uwimana Claire, CPA',
                desc: language === 'rw'
                  ? 'Gucunga umutungo w’ishuri, amasoko y’ibiribwa, abagemura ibiribwa, n’igenzura ry’imari.'
                  : 'Manages institutional finances, supplier relations, food procurement, and inventory auditing.',
                img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
              },
              {
                role: t('roleAnimator'),
                name: 'Mugisha Patrick',
                desc: language === 'rw'
                  ? 'Kugenzura amasaha yo gutanga ibiribwa, imyitwarire y’abanyeshuri, imikino n’umutekano.'
                  : 'Supervises daily food stock issuing windows, student discipline, sports, and campus operations.',
                img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
              },
              {
                role: t('roleAnimatrice'),
                name: 'Mukamana Angelique',
                desc: language === 'rw'
                  ? 'Kwita ku macumbi y’abanyeshuri, isuku, uburere bw’abakobwa, n’icyumba cy’amafunguro.'
                  : 'Oversees student accommodation health, girl student mentorship, dining hall supervision, and welfare.',
                img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
              },
            ].map((officer, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#181D24] rounded-2xl p-6 border border-slate-200 dark:border-[#2B3139] text-center flex flex-col items-center shadow-sm"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#FCD535] mb-4 bg-[#202630] shadow-sm">
                  <img src={officer.img} alt={officer.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1769FF] dark:text-[#FCD535] block">
                  {officer.role}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-2">
                  {officer.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#A0AAB8] leading-relaxed">
                  {officer.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 7: ENROLLMENT CTA BANNER */}
        {/* ======================================================== */}
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#11151B] to-[#181D24] text-white border border-[#2B3139] shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono font-bold text-[#FCD535] uppercase tracking-wider">
              {t('heroBadge')}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              {language === 'rw' ? 'Tangira Urugendo rwawe muri IBB Buberuka' : 'Begin Your Technical Journey at IBB Buberuka'}
            </h3>
            <p className="text-xs sm:text-sm text-[#A0AAB8] leading-relaxed">
              {language === 'rw'
                ? 'Iyandikishe ubu mu mashami ya Software Development cyangwa Automobile Technology. Nta kiguzi cyo kuzuza dosiyeti bisaba.'
                : 'Enroll today in accredited Software Development or Automobile Technology programs. Free online application with instant tracking.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/admissions"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-lg transition-all"
            >
              <span>{t('heroApplyBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors"
            >
              <span>{t('heroTrackBtn')}</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
