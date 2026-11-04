import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

interface LeaderProfile {
  id: number;
  positionKey: 'roleDirector' | 'roleAccountant' | 'roleAnimator' | 'roleAnimatrice';
  name: string;
  photoUrl: string;
  initials: string;
  departmentEn: string;
  departmentRw: string;
}

const LEADERS: LeaderProfile[] = [
  {
    id: 1,
    positionKey: 'roleDirector',
    name: 'Rev. Habimana Celestin',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    initials: 'HC',
    departmentEn: 'Executive Direction · IBB Rwanda',
    departmentRw: 'Ubuyobozi Bukuru · IBB Rwanda',
  },
  {
    id: 2,
    positionKey: 'roleAccountant',
    name: 'Uwimana Claire',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    initials: 'UC',
    departmentEn: 'Chief Accountant & Finance · IBB Rwanda',
    departmentRw: 'Ubucungamari n’Imari · IBB Rwanda',
  },
  {
    id: 3,
    positionKey: 'roleAnimator',
    name: 'Mugisha Patrick',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    initials: 'MP',
    departmentEn: 'Discipline & Boarding Animator · IBB Rwanda',
    departmentRw: 'Ushinzwe Imyitwarire n’Amacumbi · IBB Rwanda',
  },
  {
    id: 4,
    positionKey: 'roleAnimatrice',
    name: 'Mukamana Angelique',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    initials: 'MA',
    departmentEn: 'Female Boarding & Student Welfare · IBB Rwanda',
    departmentRw: 'Imibereho y’Abanyeshuri n’Amacumbi · IBB Rwanda',
  },
];

export const LeadershipCarousel: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check user preference for reduced motion
  const isReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const resetAutoplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isPaused && !isReducedMotion) {
      timerRef.current = setInterval(() => {
        setSlideDirection('next');
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % LEADERS.length);
      }, 4500);
    }
  }, [isPaused, isReducedMotion]);

  useEffect(() => {
    resetAutoplayTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetAutoplayTimer]);

  // Clear animation lock after slide transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    setSlideDirection('prev');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + LEADERS.length) % LEADERS.length);
    resetAutoplayTimer();
  }, [resetAutoplayTimer]);

  const handleNext = useCallback(() => {
    setSlideDirection('next');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % LEADERS.length);
    resetAutoplayTimer();
  }, [resetAutoplayTimer]);

  const handleSelectIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setSlideDirection(idx > currentIndex ? 'next' : 'prev');
    setIsAnimating(true);
    setCurrentIndex(idx);
    resetAutoplayTimer();
  };

  // Indices for neighboring previews on desktop
  const prevIndex = (currentIndex - 1 + LEADERS.length) % LEADERS.length;
  const nextIndex = (currentIndex + 1) % LEADERS.length;

  const currentLeader = LEADERS[currentIndex];
  const prevLeader = LEADERS[prevIndex];
  const nextLeader = LEADERS[nextIndex];

  return (
    <section
      className="w-full max-w-4xl mx-auto mt-6 mb-4 px-2 sm:px-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label="IBB Leadership & Administration Team"
      aria-roledescription="carousel"
    >
      {/* Outer Shell with Binance Floating Stage */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
        
        {/* Navigation Arrow: Previous */}
        <button
          type="button"
          onClick={handlePrev}
          className="p-2 sm:p-2.5 rounded-full bg-[#181D24]/85 hover:bg-[#202630] text-[#A0AAB8] hover:text-[#FCD535] border border-[#2B3139] hover:border-[#FCD535]/40 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 cursor-pointer shadow-lg shrink-0 active:scale-95"
          aria-label="Previous leadership profile"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* Carousel Center Stage with Smooth Transitions */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 py-2 overflow-hidden w-full max-w-2xl">
          
          {/* Previous profile (Desktop preview - subtle, scaled down, clickable) */}
          <button
            type="button"
            onClick={handlePrev}
            className="hidden md:flex flex-col items-center opacity-40 hover:opacity-80 scale-90 hover:scale-95 transition-all duration-400 text-center cursor-pointer max-w-[130px] shrink-0"
            title={`Previous: ${prevLeader.name}`}
            aria-label={`Switch to previous profile: ${prevLeader.name}`}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#2B3139] bg-[#181D24] mb-1.5 shadow-md">
              <img
                src={prevLeader.photoUrl}
                alt={prevLeader.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover object-center grayscale contrast-125"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[11px] text-[#A0AAB8] font-semibold truncate w-full">
              {prevLeader.name}
            </span>
            <span className="text-[10px] text-[#707A8A] font-mono uppercase tracking-wider truncate w-full">
              {t(prevLeader.positionKey)}
            </span>
          </button>

          {/* ACTIVE CENTER PROFILE CARD (Binance Midnight Surface) */}
          <div
            key={currentLeader.id}
            className={`flex items-center gap-3.5 sm:gap-5 bg-[#181D24]/95 backdrop-blur-xl border border-[#2B3139] hover:border-[#FCD535]/40 rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] text-[#F0F3F6] transition-all duration-400 transform w-full max-w-sm sm:max-w-md ${
              isReducedMotion
                ? 'opacity-100'
                : slideDirection === 'next'
                ? 'animate-slideInRight'
                : 'animate-slideInLeft'
            }`}
          >
            {/* Leadership Avatar with Binance Gold Ring */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#FCD535] ring-4 ring-[#FCD535]/15 shrink-0 bg-[#202630] shadow-md">
              {currentLeader.photoUrl ? (
                <img
                  src={currentLeader.photoUrl}
                  alt={currentLeader.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#202630] text-[#FCD535] font-black text-base">
                  {currentLeader.initials}
                </div>
              )}
              {/* Subtle online / active indicator dot */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#0ECB81] border-2 border-[#181D24] rounded-full shadow-sm" />
            </div>

            {/* Leadership Information Block */}
            <div className="flex flex-col text-left min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FCD535] truncate font-mono">
                  {t(currentLeader.positionKey)}
                </span>
                <span className="hidden xs:inline-block w-1 h-1 rounded-full bg-[#2B3139]" />
                <span className="hidden xs:inline-block text-[9px] font-mono text-[#0ECB81] font-semibold">
                  ACTIVE
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate leading-snug">
                {currentLeader.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#A0AAB8] truncate mt-0.5">
                {language === 'rw' ? currentLeader.departmentRw : currentLeader.departmentEn}
              </p>
            </div>
          </div>

          {/* Next profile (Desktop preview - subtle, scaled down, clickable) */}
          <button
            type="button"
            onClick={handleNext}
            className="hidden md:flex flex-col items-center opacity-40 hover:opacity-80 scale-90 hover:scale-95 transition-all duration-400 text-center cursor-pointer max-w-[130px] shrink-0"
            title={`Next: ${nextLeader.name}`}
            aria-label={`Switch to next profile: ${nextLeader.name}`}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#2B3139] bg-[#181D24] mb-1.5 shadow-md">
              <img
                src={nextLeader.photoUrl}
                alt={nextLeader.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover object-center grayscale contrast-125"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[11px] text-[#A0AAB8] font-semibold truncate w-full">
              {nextLeader.name}
            </span>
            <span className="text-[10px] text-[#707A8A] font-mono uppercase tracking-wider truncate w-full">
              {t(nextLeader.positionKey)}
            </span>
          </button>

        </div>

        {/* Navigation Arrow: Next */}
        <button
          type="button"
          onClick={handleNext}
          className="p-2 sm:p-2.5 rounded-full bg-[#181D24]/85 hover:bg-[#202630] text-[#A0AAB8] hover:text-[#FCD535] border border-[#2B3139] hover:border-[#FCD535]/40 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 cursor-pointer shadow-lg shrink-0 active:scale-95"
          aria-label="Next leadership profile"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

      </div>

      {/* Progress Indicators & Dot Controls */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {LEADERS.map((leader, idx) => (
          <button
            key={leader.id}
            type="button"
            onClick={() => handleSelectIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex
                ? 'w-7 bg-[#FCD535] shadow-[0_0_10px_rgba(252,213,53,0.5)]'
                : 'w-2 bg-[#2B3139] hover:bg-[#A0AAB8]'
            }`}
            aria-label={`Go to ${leader.name} (${t(leader.positionKey)})`}
            aria-current={idx === currentIndex ? 'true' : 'false'}
          />
        ))}
      </div>
    </section>
  );
};
