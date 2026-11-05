import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { ConfirmationModal } from './ConfirmationModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Globe,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Search,
  CheckCircle2,
  UserCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  breadcrumbs: string[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleSidebar,
  breadcrumbs,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [kigaliTime, setKigaliTime] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Confirmation Modals State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Live Africa/Kigali Clock (24-hour financial precision)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Kigali',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setKigaliTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // quiet fail
    }
  };

  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    navigate('/');
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalOpen(false);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getProfilePath = () => {
    if (!user) return '/dashboard/director/profile';
    return `/dashboard/${user.role.toLowerCase()}/profile`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#11151B] border-b border-[#E2E8F0] dark:border-[#2B3139] px-4 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
        
        {/* Left side: Mobile Toggle & Binance-style Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] rounded-lg lg:hidden cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Hierarchy */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] dark:text-[#707A8A] overflow-hidden whitespace-nowrap">
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="hover:text-[#1769FF] dark:hover:text-[#F0F3F6] shrink-0 font-semibold text-[#172033] dark:text-[#A0AAB8] transition-colors cursor-pointer flex items-center gap-1"
              title="Return to School Website"
            >
              <span>IBB</span>
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-[#707A8A]" />
                <span
                  className={`truncate ${
                    idx === breadcrumbs.length - 1
                      ? 'text-[#172033] dark:text-[#FCD535] font-semibold tracking-tight'
                      : 'hover:text-slate-800 dark:hover:text-[#F0F3F6]'
                  }`}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right side: Back to Website + Kigali Clock + Language + Theme + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Universal Action: Back to Official School Website */}
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-[#1769FF] dark:text-[#FCD535] bg-blue-50 dark:bg-[#FCD535]/10 hover:bg-blue-100 dark:hover:bg-[#FCD535]/15 border border-blue-200 dark:border-[#FCD535]/30 transition-all cursor-pointer shadow-xs"
            title={t('backToWebsite')}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[150px]">{t('backToWebsite')}</span>
          </button>

          {/* Mobile Back to Website Icon */}
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="sm:hidden p-2 text-[#1769FF] dark:text-[#FCD535] bg-blue-50 dark:bg-[#FCD535]/10 hover:bg-blue-100 dark:hover:bg-[#FCD535]/15 rounded-lg border border-blue-200 dark:border-[#FCD535]/30 transition-colors cursor-pointer"
            title={t('backToWebsite')}
            aria-label="Return to official website"
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Africa/Kigali Financial Ticker Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#181D24] rounded-lg text-xs font-mono text-[#172033] dark:text-[#A0AAB8] border border-[#E2E8F0] dark:border-[#2B3139]">
            <span className="w-2 h-2 rounded-full bg-[#059669] dark:bg-[#0ECB81] animate-pulse" />
            <span className="text-[11px] text-[#64748B] dark:text-[#707A8A]">KIGALI (CAT):</span>
            <span className="font-bold text-[#172033] dark:text-[#F0F3F6] tabular-nums tracking-wider">
              {kigaliTime || '00:00:00'}
            </span>
          </div>

          {/* Language switcher with flags (🇷🇼 / 🇬🇧) */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="md:hidden">
            <LanguageSwitcher compact />
          </div>

          {/* Theme toggle (Binance Midnight / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] hover:text-slate-900 dark:hover:text-[#F0F3F6] rounded-lg border border-[#E2E8F0] dark:border-[#2B3139] transition-colors cursor-pointer"
            title="Toggle light / Binance midnight dark theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-[#FCD535]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] hover:text-slate-900 dark:hover:text-[#F0F3F6] rounded-lg relative border border-[#E2E8F0] dark:border-[#2B3139] transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] dark:bg-[#F6465D] text-white rounded-full text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#202630] rounded-xl shadow-2xl border border-[#E2E8F0] dark:border-[#2B3139] py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-[#E8EDF4] dark:border-[#252B33] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] uppercase tracking-wider">
                      {t('institutionalAlerts')}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-[#DC2626] dark:text-[#F6465D]">
                        {unreadCount} {t('newAlerts')}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#1769FF] dark:text-[#FCD535] hover:underline font-medium transition-colors cursor-pointer"
                    >
                      {t('markAllAsRead')}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#E8EDF4] dark:divide-[#252B33]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-[#707A8A]">
                      {t('noNotifications')}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition-colors ${
                          n.is_read === 0
                            ? 'bg-amber-50/60 dark:bg-[#FCD535]/5 border-l-2 border-[#1769FF] dark:border-[#FCD535]'
                            : 'hover:bg-slate-50 dark:hover:bg-[#181D24]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[#172033] dark:text-[#F0F3F6]">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] shrink-0 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#64748B] dark:text-[#A0AAB8] mt-1 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setShowNotifMenu(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#1769FF] dark:text-[#FCD535] font-semibold mt-2 hover:underline"
                          >
                            <span>{t('openModule')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Trigger */}
          {user && (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-[#E2E8F0] dark:border-[#2B3139] hover:bg-slate-100 dark:hover:bg-[#181D24] transition-colors cursor-pointer"
                aria-label="User profile options"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-[#2B3139] bg-slate-200 dark:bg-[#202630] shrink-0 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-mono font-bold text-[#172033] dark:text-[#FCD535] bg-[#FCD535]/20">
                      {user.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate max-w-[120px] leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[9px] text-[#64748B] dark:text-[#707A8A] font-mono uppercase truncate">
                    {user.role}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#202630] rounded-xl shadow-2xl border border-[#E2E8F0] dark:border-[#2B3139] py-2 z-50 animate-fadeIn">
                  
                  {/* Account Header */}
                  <div className="px-4 py-3 border-b border-[#E8EDF4] dark:border-[#252B33]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-300 dark:border-[#2B3139] bg-slate-100 dark:bg-[#181D24] shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-slate-800 dark:text-[#FCD535] bg-[#FCD535]/20">
                            {user.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
                          {user.full_name}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#707A8A] truncate font-mono">
                          {user.email}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-[#1769FF] dark:text-[#FCD535] mt-0.5">
                          {user.role} · {user.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-1">
                    {/* Personal Profile Management */}
                    <Link
                      to={getProfilePath()}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#172033] dark:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#262D38] transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />
                      <span>{t('profileManagement')}</span>
                    </Link>

                    {/* Back to Official Website */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsLeaveModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#172033] dark:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#262D38] transition-colors cursor-pointer text-left"
                    >
                      <Globe className="w-4 h-4 text-[#059669] dark:text-[#0ECB81]" />
                      <span>{t('backToWebsite')}</span>
                    </button>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-[#E8EDF4] dark:border-[#252B33]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#DC2626] dark:text-[#F6465D] hover:bg-rose-50 dark:hover:bg-[#F6465D]/15 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </header>

      {/* Confirmation Dialog: Leave Dashboard and Return to Official Website */}
      <ConfirmationModal
        isOpen={isLeaveModalOpen}
        title={t('leaveDashboardConfirmTitle')}
        message={t('leaveDashboardConfirmMessage')}
        confirmText={t('yesContinue')}
        cancelText={t('cancel')}
        confirmVariant="primary"
        iconType="website"
        onConfirm={handleConfirmLeave}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {/* Confirmation Dialog: Universal Logout Confirmation */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title={t('logoutConfirmTitle')}
        message={t('logoutConfirmMessage')}
        confirmText={t('yesLogout')}
        cancelText={t('cancel')}
        confirmVariant="danger"
        iconType="logout"
        loading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};
