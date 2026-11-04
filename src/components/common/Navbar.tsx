import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher, RwandaFlagIcon, UkFlagIcon } from './LanguageSwitcher';
import {
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  LogIn,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open on small screens
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/', label: t('navHome') },
    { to: '/about', label: t('navAbout') },
    { to: '/programs', label: t('navPrograms') },
    { to: '/admissions', label: t('navAdmissions') },
    { to: '/track', label: t('navTrack') },
    { to: '/contact', label: t('navContact') },
  ];

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'DIRECTOR') return '/dashboard/director';
    if (user.role === 'ACCOUNTANT') return '/dashboard/accountant/inventory';
    return '/dashboard/animator';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#11151B]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2B3139] transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          
          {/* Zone 1: Wordmark with Binance Gold Accent */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group focus:outline-none min-w-0"
            aria-label="Institut Baptiste de Buberuka Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FCD535] via-[#E5A910] to-[#B37800] flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_-3px_rgba(252,213,53,0.3)] group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-base font-black tracking-tight text-slate-900 dark:text-[#F0F3F6] leading-tight truncate">
                IBB BUBERUKA
              </span>
              <span className="text-[9px] sm:text-[11px] font-mono text-slate-500 dark:text-[#707A8A] truncate">
                TVET RWANDA · EST. 1998
              </span>
            </div>
          </Link>

          {/* Zone 2: Desktop Navigation Links (Visible on large desktop: xl / >=1280px) */}
          <nav className="hidden xl:flex items-center gap-3 2xl:gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A0AAB8]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`whitespace-nowrap px-2 py-1.5 relative transition-colors ${
                    isActive
                      ? 'text-[#B37800] dark:text-[#FCD535] font-bold'
                      : 'hover:text-slate-900 dark:hover:text-[#F0F3F6]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#B37800] dark:bg-[#FCD535] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Interactive Controls & Portal CTA (Desktop: xl / >=1280px) */}
          <div className="hidden xl:flex items-center gap-2.5 shrink-0">
            {/* Language Selector with Flags */}
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] hover:text-slate-900 dark:hover:text-[#F0F3F6] rounded-xl border border-slate-200 dark:border-[#2B3139] transition-colors cursor-pointer"
              title={theme === 'light' ? t('themeDark') : t('themeLight')}
              aria-label="Theme toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-[#FCD535]" />
              )}
            </button>

            {/* Staff Portal / Dashboard Action */}
            {isAuthenticated ? (
              <Link
                to={getDashboardRoute()}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t('navDashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t('navStaffLogin')}</span>
              </Link>
            )}
          </div>

          {/* Zone 4: Mobile & Tablet Controls (<1280px: Laptops, Tablets, Smartphones) */}
          <div className="flex xl:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher in Compact mode for header sanity */}
            <LanguageSwitcher compact />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] hover:text-slate-900 dark:hover:text-[#F0F3F6] rounded-xl border border-slate-200 dark:border-[#2B3139] transition-colors cursor-pointer"
              title={theme === 'light' ? t('themeDark') : t('themeLight')}
              aria-label="Toggle light / dark theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-[#FCD535]" />
              )}
            </button>

            {/* Hamburger / Close Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] cursor-pointer transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900 dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Responsive Drawer for Tablets and Mobile Devices (<1280px) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white dark:bg-[#11151B] border-b border-slate-200 dark:border-[#2B3139] px-4 pt-3 pb-6 space-y-3 animate-fadeIn max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile Language Switcher Strip with Real Flag Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-[#181D24] border border-slate-200/80 dark:border-[#2B3139]">
            <span className="text-xs font-bold text-slate-700 dark:text-[#A0AAB8] uppercase font-mono tracking-wider">
              {language === 'rw' ? 'Hitamo Ururimi' : 'Choose Language'}
            </span>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setLanguage('rw')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  language === 'rw'
                    ? 'bg-[#FCD535] text-slate-950 font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#202630] text-slate-700 dark:text-[#A0AAB8] hover:text-slate-900 border border-slate-200 dark:border-transparent'
                }`}
              >
                <RwandaFlagIcon className="w-4 h-3 shrink-0" />
                <span>🇷🇼</span>
                <span className="font-semibold truncate">Kinyarwanda</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#FCD535] text-slate-950 font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#202630] text-slate-700 dark:text-[#A0AAB8] hover:text-slate-900 border border-slate-200 dark:border-transparent'
                }`}
              >
                <UkFlagIcon className="w-4 h-3 shrink-0" />
                <span>🇬🇧</span>
                <span className="font-semibold truncate">English</span>
              </button>
            </div>
          </div>

          {/* Navigation Links list */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 text-sm font-semibold rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] font-bold border-l-4 border-[#FCD535]'
                      : 'text-slate-700 dark:text-[#A0AAB8] hover:bg-slate-50 dark:hover:bg-[#181D24]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#707A8A]" />
                </Link>
              );
            })}
          </div>

          {/* Action Button at bottom of drawer */}
          <div className="pt-3 border-t border-slate-200 dark:border-[#252B33]">
            {isAuthenticated ? (
              <Link
                to={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('navDashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('navStaffLogin')}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
