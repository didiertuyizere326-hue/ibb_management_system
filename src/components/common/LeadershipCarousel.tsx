import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const resetAutoplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isPaused && !isReducedMotion) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % LEADERS.length);
      }, 5000);
    }
  }, [isPaused, isReducedMotion]);

  useEffect(() => {
    resetAutoplayTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetAutoplayTimer]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + LEADERS.length) % LEADERS.length);
    resetAutoplayTimer();
  }, [resetAutoplayTimer]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % LEADERS.length);
    resetAutoplayTimer();
  }, [resetAutoplayTimer]);

  const handleSelectIndex = useCallback(
    (idx: number) => {
      if (idx === currentIndex) return;
      setCurrentIndex(idx);
      resetAutoplayTimer();
    },
    [currentIndex, resetAutoplayTimer]
  );

  // Compute circular relative position: 0 = center, 1 = right, -1 = left, 2 = back
  const getRelativePosition = (index: number) => {
    const total = LEADERS.length;
    const diff = (index - currentIndex + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === total - 1) return 'left';
    return 'back';
  };

  return (
    <section
      className="w-full max-w-5xl mx-auto mt-6 mb-4 px-2 sm:px-4 select-none overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label="IBB Leadership & Administration Team"
      aria-roledescription="carousel"
    >
      {/* 3D Carousel Stage */}
      <div className="relative flex items-center justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="z-40 p-2 sm:p-2.5 rounded-full bg-[#181D24]/85 hover:bg-[#202630] text-[#A0AAB8] hover:text-[#FCD535] border border-[#2B3139] hover:border-[#FCD535]/50 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 cursor-pointer shadow-lg shrink-0 active:scale-95"
          aria-label="Previous leadership profile"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        {/* 3D Perspective Viewport */}
        <div
          className="relative w-full max-w-3xl h-[300px] sm:h-[335px] md:h-[360px] flex items-center justify-center mx-1 sm:mx-3"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          {LEADERS.map((leader, idx) => {
            const pos = getRelativePosition(idx);
            const isCenter = pos === 'center';
            const isLeft = pos === 'left';
            const isRight = pos === 'right';

            // Responsive 3D transform classes
            let positionClasses = '';
            if (isCenter) {
              positionClasses =
                'z-30 opacity-100 scale-100 translate-x-0 [transform:translate3d(0,0,0)_scale(1)_rotateY(0deg)]';
            } else if (isLeft) {
              positionClasses =
                'z-20 opacity-45 sm:opacity-70 cursor-pointer [transform:translate3d(-22%,0,-120px)_scale(0.8)_rotateY(10deg)] sm:[transform:translate3d(-48%,0,-120px)_scale(0.84)_rotateY(14deg)] md:[transform:translate3d(-62%,0,-130px)_scale(0.85)_rotateY(14deg)] hover:opacity-90';
            } else if (isRight) {
              positionClasses =
                'z-20 opacity-45 sm:opacity-70 cursor-pointer [transform:translate3d(22%,0,-120px)_scale(0.8)_rotateY(-10deg)] sm:[transform:translate3d(48%,0,-120px)_scale(0.84)_rotateY(-14deg)] md:[transform:translate3d(62%,0,-130px)_scale(0.85)_rotateY(-14deg)] hover:opacity-90';
            } else {
              positionClasses =
                'z-10 opacity-0 pointer-events-none [transform:translate3d(0,0,-240px)_scale(0.68)_rotateY(0deg)]';
            }

            return (
              <div
                key={leader.id}
                onClick={() => {
                  if (isLeft) handlePrev();
                  else if (isRight) handleNext();
                }}
                aria-hidden={!isCenter}
                className={`absolute w-[210px] sm:w-[240px] md:w-[265px] h-[275px] sm:h-[310px] md:h-[335px] rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform ${
                  isReducedMotion
                    ? 'transition-opacity duration-200'
                    : 'transition-[transform,opacity,box-shadow,border-color] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
                } ${
                  isCenter
                    ? 'border-2 border-[#FCD535]/75 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.8),0_0_24px_rgba(252,213,53,0.2)]'
                    : 'border border-white/20 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.65)]'
                } ${positionClasses}`}
              >
                {/* Background Portrait Image */}
                <div className="relative w-full h-full bg-[#181D24]">
                  {!failedImages[leader.id] ? (
                    <img
                      src={leader.photoUrl}
                      alt={`${leader.name} — ${t(leader.positionKey)}`}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover object-top transition-transform duration-700 ${
                        isCenter ? 'scale-100' : 'scale-105 brightness-90'
                      }`}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [leader.id]: true }))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#202630] text-[#FCD535] font-black text-3xl">
                      {leader.initials}
                    </div>
                  )}

                  {/* Subtle cinematic vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E11]/95 via-[#0B0E11]/25 to-transparent pointer-events-none" />

                  {/* Top Glassmorphic IBB Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11151B]/65 backdrop-blur-md border border-white/15">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCenter ? 'bg-[#0ECB81]' : 'bg-[#A0AAB8]'
                      }`}
                    />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/90">
                      IBB Leadership
                    </span>
                  </div>

                  {/* Bottom Glassmorphic Info Card */}
                  <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 bg-[#11151B]/75 backdrop-blur-md border-t border-white/15 text-left">
                    <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FCD535] font-mono truncate">
                      {t(leader.positionKey)}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate leading-snug mt-0.5">
                      {leader.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#A0AAB8] truncate mt-0.5">
                      {language === 'rw' ? leader.departmentRw : leader.departmentEn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="z-40 p-2 sm:p-2.5 rounded-full bg-[#181D24]/85 hover:bg-[#202630] text-[#A0AAB8] hover:text-[#FCD535] border border-[#2B3139] hover:border-[#FCD535]/50 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 cursor-pointer shadow-lg shrink-0 active:scale-95"
          aria-label="Next leadership profile"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Pagination Indicators */}
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
