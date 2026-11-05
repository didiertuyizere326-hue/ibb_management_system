import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronDown, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
  dropUp?: boolean;
}

// Crisp, high-fidelity SVG flags to guarantee 100% visual rendering on all platforms (including Windows, Linux, iOS, Android)
export const RwandaFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 16"
    className={`inline-block rounded-xs shadow-2xs shrink-0 overflow-hidden border border-black/10 dark:border-white/10 ${className}`}
    aria-hidden="true"
  >
    {/* Sky Blue top band */}
    <rect width="24" height="8" fill="#00A3E0" />
    {/* Yellow middle band */}
    <rect y="8" width="24" height="4" fill="#FAD201" />
    {/* Green bottom band */}
    <rect y="12" width="24" height="4" fill="#20603D" />
    {/* Golden Sun with rays in upper right */}
    <circle cx="19" cy="4" r="1.8" fill="#FAD201" />
    <path
      d="M19 1.5v5M16.5 4h5M17.2 2.2l3.6 3.6M17.2 5.8l3.6-3.6"
      stroke="#FAD201"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  </svg>
);

export const UkFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg
    viewBox="0 0 60 36"
    className={`inline-block rounded-xs shadow-2xs shrink-0 overflow-hidden border border-black/10 dark:border-white/10 ${className}`}
    aria-hidden="true"
  >
    {/* Navy Blue Field */}
    <rect width="60" height="36" fill="#012169" />
    {/* White Saltire (St Andrew / St Patrick background) */}
    <path d="M0 0L60 36M60 0L0 36" stroke="#FFFFFF" strokeWidth="7.2" />
    {/* Red Saltire (St Patrick) */}
    <path d="M0 0L60 36M60 0L0 36" stroke="#C8102E" strokeWidth="2.4" />
    {/* White Cross (St George background) */}
    <path d="M30 0v36M0 18h60" stroke="#FFFFFF" strokeWidth="12" />
    {/* Red Cross (St George) */}
    <path d="M30 0v36M0 18h60" stroke="#C8102E" strokeWidth="7.2" />
  </svg>
);

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
  dropUp = false,
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const languages = [
    {
      code: 'rw' as const,
      name: 'Kinyarwanda',
      shortName: 'RW',
      flagEmoji: '🇷🇼',
      FlagComponent: RwandaFlagIcon,
      subtitle: 'Ikinyarwanda · Rwanda',
    },
    {
      code: 'en' as const,
      name: 'English',
      shortName: 'EN',
      flagEmoji: '🇬🇧',
      FlagComponent: UkFlagIcon,
      subtitle: 'English · United Kingdom',
    },
  ];

  const current = languages.find((l) => l.code === language) || languages[1];
  const CurrentFlag = current.FlagComponent;

  const handleSelect = (code: 'en' | 'rw') => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Selected language: ${current.name} (${current.flagEmoji}). Click to switch language.`}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-[#A0AAB8] bg-white dark:bg-[#181D24] hover:bg-slate-100 dark:hover:bg-[#202630] hover:text-slate-900 dark:hover:text-[#F0F3F6] border border-slate-200 dark:border-[#2B3139] shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FCD535]/50 active:scale-95"
      >
        <span className="flex items-center gap-1">
          <CurrentFlag className="w-4 h-3 sm:w-4.5 sm:h-3.5" />
          <span className="text-xs select-none hidden xs:inline" role="img" aria-label={current.name}>
            {current.flagEmoji}
          </span>
        </span>
        <span className="font-mono text-[11px] sm:text-xs font-bold tracking-tight text-slate-800 dark:text-[#F0F3F6]">
          {compact ? (
            current.shortName
          ) : (
            <>
              <span className="hidden 2xl:inline">{current.name}</span>
              <span className="inline 2xl:hidden">{current.shortName}</span>
            </>
          )}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 dark:text-[#707A8A] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select website language"
          className={`absolute right-0 w-48 bg-white dark:bg-[#202630] rounded-xl shadow-xl border border-slate-200 dark:border-[#2B3139] py-1.5 z-50 animate-fadeIn ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-[#707A8A] border-b border-slate-100 dark:border-[#252B33] mb-1">
            {language === 'rw' ? 'Hitamo Ururimi' : 'Select Language'}
          </div>

          {languages.map((lang) => {
            const isSelected = language === lang.code;
            const Flag = lang.FlagComponent;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#FCD535]/15 text-slate-950 dark:text-[#FCD535] font-bold'
                    : 'text-slate-700 dark:text-[#A0AAB8] hover:bg-slate-50 dark:hover:bg-[#262D38] hover:text-slate-900 dark:hover:text-[#F0F3F6]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Flag className="w-5 h-3.5" />
                    <span className="text-sm select-none" role="img" aria-label={lang.name}>
                      {lang.flagEmoji}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="leading-tight font-semibold">{lang.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-[#707A8A]">
                      {lang.subtitle}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#1769FF] dark:text-[#FCD535] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
