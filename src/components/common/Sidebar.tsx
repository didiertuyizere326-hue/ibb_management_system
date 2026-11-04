import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Sliders,
  Package,
  Clock,
  Truck,
  ShieldCheck,
  KeyRound,
  FileBarChart2,
  FileClock,
  UserCircle,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Globe,
  CreditCard
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Collapsible category state for Director
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
    overview: true,
    students: true,
    inventory: true,
    staff: false,
    reports: true,
    audit: false,
    account: true,
  });

  // Confirmation modal states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleCategory = (key: string) => {
    setOpenCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    onClose?.();
    navigate('/');
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutModalOpen(false);
      onClose?.();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const navLinkClasses = (isActive: boolean) =>
    `group flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-amber-500/10 dark:bg-[#FCD535]/10 text-amber-900 dark:text-[#FCD535] font-semibold border-l-2 border-amber-600 dark:border-[#FCD535] shadow-xs'
        : 'text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#181D24] hover:text-slate-900 dark:hover:text-[#F0F3F6]'
    }`;

  const iconClasses = (isActive: boolean) =>
    `w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
      isActive ? 'text-amber-600 dark:text-[#FCD535]' : 'text-slate-400 dark:text-[#707A8A] group-hover:text-slate-700 dark:group-hover:text-[#F0F3F6]'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-[#11151B] text-slate-800 dark:text-[#F0F3F6] border-r border-slate-200 dark:border-[#2B3139] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header (Binance-inspired Header with Gold Accent) */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] bg-slate-50/50 dark:bg-[#0B0E11]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FCD535] via-[#E5A910] to-[#B37800] flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_-3px_rgba(252,213,53,0.3)]">
              <GraduationCap className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-[#F0F3F6] leading-none">
                  IBB BUBERUKA
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
              </div>
              <span className="text-[10px] text-[#3B82F6] dark:text-[#FCD535] font-mono font-semibold tracking-wider uppercase mt-1">
                {user.role} SUITE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          
          {/* ======================================= */}
          {/* DIRECTOR NAVIGATION: 7 STRICT CATEGORIES */}
          {/* ======================================= */}
          {user.role === 'DIRECTOR' && (
            <>
              {/* Category 1: Dashboard Overview */}
              <div>
                <button
                  onClick={() => toggleCategory('overview')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#FCD535]" />
                    {t('catOverview')}
                  </span>
                  {openCategories.overview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.overview && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director"
                      end
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <LayoutDashboard className={iconClasses(isActive)} />
                            <span>{t('directorOverview')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 2: Students & Academic Management */}
              <div>
                <button
                  onClick={() => toggleCategory('students')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                    {t('catStudents')}
                  </span>
                  {openCategories.students ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.students && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/admissions"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Users className={iconClasses(isActive)} />
                            <span>{t('studentAdmissions')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/approved-students"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <BookOpen className={iconClasses(isActive)} />
                            <span>{t('approvedStudents')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/academic-settings"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Sliders className={iconClasses(isActive)} />
                            <span>{t('academicSettings')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/bank-accounts"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <CreditCard className={iconClasses(isActive)} />
                            <span>School Bank Accounts</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 3: Inventory & Stock Management */}
              <div>
                <button
                  onClick={() => toggleCategory('inventory')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#0ECB81]" />
                    {t('catInventory')}
                  </span>
                  {openCategories.inventory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.inventory && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/inventory"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Package className={iconClasses(isActive)} />
                            <span>{t('foodInventory')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/schedules"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Clock className={iconClasses(isActive)} />
                            <span>{t('stockWorkingHours')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/suppliers"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Truck className={iconClasses(isActive)} />
                            <span>{t('supplierManagement')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 4: Staff & Access Control */}
              <div>
                <button
                  onClick={() => toggleCategory('staff')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" />
                    {t('catStaff')}
                  </span>
                  {openCategories.staff ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.staff && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/staff"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className={iconClasses(isActive)} />
                            <span>{t('staffAccounts')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/access-control"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <KeyRound className={iconClasses(isActive)} />
                            <span>{t('accessControl')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 5: Reports & Analytics */}
              <div>
                <button
                  onClick={() => toggleCategory('reports')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#F0B90B]" />
                    {t('catReports')}
                  </span>
                  {openCategories.reports ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.reports && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/reports"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <FileBarChart2 className={iconClasses(isActive)} />
                            <span>{t('reportsAnalytics')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                    <NavLink
                      to="/dashboard/director/messages"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Inbox className={iconClasses(isActive)} />
                            <span>{t('contactInbox')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 6: System Audit & Activity */}
              <div>
                <button
                  onClick={() => toggleCategory('audit')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#38BDF8]" />
                    {t('catAudit')}
                  </span>
                  {openCategories.audit ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.audit && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/audit"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <FileClock className={iconClasses(isActive)} />
                            <span>{t('systemAudit')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Category 7: Account & Profile */}
              <div>
                <button
                  onClick={() => toggleCategory('account')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] hover:text-slate-800 dark:hover:text-[#F0F3F6] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#A0AAB8]" />
                    {t('catAccount')}
                  </span>
                  {openCategories.account ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {openCategories.account && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/dashboard/director/profile"
                      onClick={onClose}
                      className={({ isActive }) => navLinkClasses(isActive)}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <UserCircle className={iconClasses(isActive)} />
                            <span>{t('accountProfile')}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                        </>
                      )}
                    </NavLink>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================================= */}
          {/* ACCOUNTANT NAVIGATION */}
          {/* ======================================= */}
          {user.role === 'ACCOUNTANT' && (
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] block mb-2">
                Finance & Food Inventory
              </span>
              <NavLink
                to="/dashboard/accountant/inventory"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Package className={iconClasses(isActive)} />
                      <span>{t('foodInventory')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/stock-in"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <ArrowDownLeft className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0ECB81]' : 'text-[#0ECB81]'}`} />
                      <span>{t('stockInTitle')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/transactions"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <FileClock className={iconClasses(isActive)} />
                      <span>{t('stockLedgerTitle')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/bank-accounts"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className={iconClasses(isActive)} />
                      <span>School Bank Accounts</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/suppliers"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Truck className={iconClasses(isActive)} />
                      <span>{t('supplierManagement')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/schedules"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Clock className={iconClasses(isActive)} />
                      <span>{t('stockWorkingHours')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/reports"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <FileBarChart2 className={iconClasses(isActive)} />
                      <span>{t('reportsAnalytics')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/accountant/profile"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <UserCircle className={iconClasses(isActive)} />
                      <span>{t('accountProfile')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* ======================================= */}
          {/* ANIMATOR NAVIGATION */}
          {/* ======================================= */}
          {user.role === 'ANIMATOR' && (
            <div className="space-y-1">
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#707A8A] block mb-2">
                Discipline & Stock Out
              </span>
              <NavLink
                to="/dashboard/animator"
                end
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Package className={iconClasses(isActive)} />
                      <span>{t('animatorStockTitle')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/animator/stock-out"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <ArrowUpRight className="w-4 h-4 text-[#F0B90B] shrink-0" />
                      <span>{t('dailyStockOutBtn')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/animator/history"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <FileClock className={iconClasses(isActive)} />
                      <span>{t('stockLedgerTitle')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dashboard/animator/profile"
                onClick={onClose}
                className={({ isActive }) => navLinkClasses(isActive)}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <UserCircle className={iconClasses(isActive)} />
                      <span>{t('accountProfile')}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535]" />}
                  </>
                )}
              </NavLink>
            </div>
          )}

        </div>

        {/* Back to School Website Button */}
        <div className="px-3.5 pt-2 pb-1 border-t border-slate-200 dark:border-[#252B33]">
          <button
            type="button"
            onClick={() => setIsLeaveModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-[#1769FF] dark:text-[#FCD535] bg-blue-50 dark:bg-[#FCD535]/10 hover:bg-blue-100 dark:hover:bg-[#FCD535]/15 border border-blue-200 dark:border-[#FCD535]/30 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('backToWebsite')}</span>
          </button>
        </div>

        {/* User Card & Logout Footer (Level 3 Card Surface: #181D24) */}
        <div className="p-3.5 border-t border-slate-200 dark:border-[#252B33] bg-slate-50/70 dark:bg-[#181D24] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-300 dark:border-[#2B3139] bg-slate-200 dark:bg-[#202630] shrink-0 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-slate-900 dark:text-[#FCD535] bg-[#FCD535]/20">
                    {user.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-[#F0F3F6] truncate leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#707A8A] font-mono truncate">
                  {user.position}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-[#DC2626] dark:hover:text-[#F6465D] hover:bg-rose-50 dark:hover:bg-[#F6465D]/15 rounded-md transition-colors shrink-0 cursor-pointer"
              title={t('navLogout')}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Dialog: Return to Official Website */}
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

      {/* Confirmation Dialog: Logout Confirmation */}
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
