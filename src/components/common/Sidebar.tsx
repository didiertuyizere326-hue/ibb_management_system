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
  ChevronLeft,
  BookOpen,
  Globe,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarRange
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
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

  // Reusable NavLink renderer with full support for Collapsed Tooltips & Modern White Theme
  const renderNavLink = (
    to: string,
    icon: React.ReactNode,
    label: string,
    end = false,
    badge?: React.ReactNode
  ) => (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center ${
          isCollapsed ? 'lg:justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
        } text-xs rounded-xl transition-all duration-150 ${
          isActive
            ? 'bg-[#EAF2FF] text-[#1769FF] font-bold border-l-2 border-[#1769FF] dark:bg-[#FCD535]/10 dark:text-[#FCD535] dark:border-[#FCD535] shadow-xs'
            : 'text-[#64748B] dark:text-[#A0AAB8] hover:bg-[#F3F7FF] hover:text-[#172033] dark:hover:bg-[#181D24] dark:hover:text-[#F0F3F6]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-2.5'} min-w-0`}>
            <span
              className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                isActive
                  ? 'text-[#1769FF] dark:text-[#FCD535]'
                  : 'text-[#64748B] dark:text-[#707A8A] group-hover:text-[#172033] dark:group-hover:text-[#F0F3F6]'
              }`}
            >
              {icon}
            </span>
            <span className={`${isCollapsed ? 'lg:hidden' : 'block'} truncate font-medium`}>
              {label}
            </span>
          </div>

          {!isCollapsed && badge}
          {!isCollapsed && isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] dark:bg-[#FCD535] shrink-0" />
          )}

          {/* Accessible Tooltip when Collapsed on Desktop */}
          {isCollapsed && (
            <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-[#172033] dark:bg-[#202630] text-white dark:text-[#F0F3F6] text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 border border-slate-700/40 dark:border-[#2B3139] animate-fadeIn">
              <span>{label}</span>
            </div>
          )}
        </>
      )}
    </NavLink>
  );

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
        className={`no-print fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-[#11151B] text-[#172033] dark:text-[#F0F3F6] border-r border-[#E2E8F0] dark:border-[#2B3139] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header */}
        <div
          className={`h-16 px-4 flex items-center ${
            isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
          } border-b border-[#E2E8F0] dark:border-[#252B33] bg-[#F5F7FB]/70 dark:bg-[#0B0E11]/40 shrink-0`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769FF] via-[#0B3B91] to-[#071A33] dark:from-[#FCD535] dark:via-[#E5A910] dark:to-[#B37800] flex items-center justify-center text-white dark:text-slate-950 font-black shadow-md shrink-0 cursor-pointer"
              onClick={() => navigate('/')}
              title="IBB BUBERUKA — Official Portal"
            >
              <GraduationCap className="w-5 h-5 text-white dark:text-slate-950 stroke-[2.2]" />
            </div>

            <div className={`flex flex-col min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-[#172033] dark:text-[#F0F3F6] leading-none truncate">
                  IBB BUBERUKA
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#0ECB81] animate-pulse" />
              </div>
              <span className="text-[10px] text-[#1769FF] dark:text-[#FCD535] font-mono font-bold tracking-wider uppercase mt-1">
                {user.role} SUITE
              </span>
            </div>
          </div>

          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-[#64748B] hover:text-[#1769FF] hover:bg-[#EAF2FF] dark:text-[#A0AAB8] dark:hover:text-[#FCD535] dark:hover:bg-[#181D24] rounded-lg transition-colors cursor-pointer"
              title={t('collapseSidebar')}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3.5'} py-4 space-y-3`}>
          
          {/* ======================================= */}
          {/* DIRECTOR NAVIGATION: 7 STRICT CATEGORIES */}
          {/* ======================================= */}
          {user.role === 'DIRECTOR' && (
            <>
              {/* Category 1: Dashboard Overview */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('overview')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] dark:bg-[#FCD535]" />
                      {t('catOverview')}
                    </span>
                    {openCategories.overview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.overview || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director',
                      <LayoutDashboard className="w-4 h-4" />,
                      t('directorOverview'),
                      true
                    )}
                  </div>
                )}
              </div>

              {/* Category 2: Students & Academic Management */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('students')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      {t('catStudents')}
                    </span>
                    {openCategories.students ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.students || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/admissions',
                      <Users className="w-4 h-4" />,
                      t('studentAdmissions')
                    )}
                    {renderNavLink(
                      '/dashboard/director/approved-students',
                      <BookOpen className="w-4 h-4" />,
                      t('approvedStudents')
                    )}
                    {renderNavLink(
                      '/dashboard/director/academic-settings',
                      <Sliders className="w-4 h-4" />,
                      t('academicGrading')
                    )}
                  </div>
                )}
              </div>

              {/* Category 3: Inventory & Logistics */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('inventory')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#0ECB81]" />
                      {t('catInventory')}
                    </span>
                    {openCategories.inventory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.inventory || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/inventory',
                      <Package className="w-4 h-4" />,
                      t('foodInventory')
                    )}
                    {renderNavLink(
                      '/dashboard/director/stock-in',
                      <ArrowDownLeft className="w-4 h-4 text-[#16A34A] dark:text-[#0ECB81]" />,
                      t('stockInTitle')
                    )}
                    {renderNavLink(
                      '/dashboard/director/stock-out',
                      <ArrowUpRight className="w-4 h-4 text-[#F59E0B] dark:text-[#F0B90B]" />,
                      t('dailyStockOutBtn')
                    )}
                    {renderNavLink(
                      '/dashboard/director/terms',
                      <CalendarRange className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />,
                      t('academicTermsStock')
                    )}
                    {renderNavLink(
                      '/dashboard/director/transactions',
                      <FileClock className="w-4 h-4" />,
                      t('stockLedgerTitle')
                    )}
                    {renderNavLink(
                      '/dashboard/director/suppliers',
                      <Truck className="w-4 h-4" />,
                      t('supplierManagement')
                    )}
                  </div>
                )}
              </div>

              {/* Category 4: Staff & Access Control */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('staff')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                      {t('catStaff')}
                    </span>
                    {openCategories.staff ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.staff || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/bank-accounts',
                      <CreditCard className="w-4 h-4" />,
                      t('schoolBankAccounts')
                    )}
                    {renderNavLink(
                      '/dashboard/director/staff',
                      <ShieldCheck className="w-4 h-4" />,
                      t('staffAccounts')
                    )}
                    {renderNavLink(
                      '/dashboard/director/access-control',
                      <KeyRound className="w-4 h-4" />,
                      t('rolePermissions')
                    )}
                  </div>
                )}
              </div>

              {/* Category 5: Institutional Reports & Inquiries */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('reports')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8]" />
                      {t('catReports')}
                    </span>
                    {openCategories.reports ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.reports || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/reports',
                      <FileBarChart2 className="w-4 h-4" />,
                      t('reportsAnalytics')
                    )}
                    {renderNavLink(
                      '/dashboard/director/messages',
                      <Inbox className="w-4 h-4" />,
                      t('inboxInquiries')
                    )}
                  </div>
                )}
              </div>

              {/* Category 6: Audit Logs */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('audit')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#F6465D]" />
                      {t('catAudit')}
                    </span>
                    {openCategories.audit ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.audit || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/audit',
                      <FileClock className="w-4 h-4" />,
                      t('systemAudit')
                    )}
                  </div>
                )}
              </div>

              {/* Category 7: Account & Profile */}
              <div>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleCategory('account')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] hover:text-[#172033] dark:hover:text-[#F0F3F6] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                      {t('catAccount')}
                    </span>
                    {openCategories.account ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}
                {(openCategories.account || isCollapsed) && (
                  <div className="mt-1 space-y-0.5">
                    {renderNavLink(
                      '/dashboard/director/profile',
                      <UserCircle className="w-4 h-4" />,
                      t('accountProfile')
                    )}
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
              {!isCollapsed && (
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] block mb-2">
                  {language === 'rw' ? 'Imari n’Ububiko bw’Ibiribwa' : 'Finance & Food Inventory'}
                </span>
              )}
              {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}

              {renderNavLink(
                '/dashboard/accountant/inventory',
                <Package className="w-4 h-4" />,
                t('foodInventory')
              )}
              {renderNavLink(
                '/dashboard/accountant/stock-in',
                <ArrowDownLeft className="w-4 h-4 text-[#16A34A] dark:text-[#0ECB81]" />,
                t('stockInTitle')
              )}
              {renderNavLink(
                '/dashboard/accountant/stock-out',
                <ArrowUpRight className="w-4 h-4 text-[#F59E0B] dark:text-[#F0B90B]" />,
                t('dailyStockOutBtn')
              )}
              {renderNavLink(
                '/dashboard/accountant/terms',
                <CalendarRange className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />,
                t('academicTermsStock')
              )}
              {renderNavLink(
                '/dashboard/accountant/transactions',
                <FileClock className="w-4 h-4" />,
                t('stockLedgerTitle')
              )}
              {renderNavLink(
                '/dashboard/accountant/bank-accounts',
                <CreditCard className="w-4 h-4" />,
                t('schoolBankAccounts')
              )}
              {renderNavLink(
                '/dashboard/accountant/suppliers',
                <Truck className="w-4 h-4" />,
                t('supplierManagement')
              )}
              {renderNavLink(
                '/dashboard/accountant/reports',
                <FileBarChart2 className="w-4 h-4" />,
                t('reportsAnalytics')
              )}
              {renderNavLink(
                '/dashboard/accountant/messages',
                <Inbox className="w-4 h-4" />,
                t('inboxInquiries')
              )}
              {renderNavLink(
                '/dashboard/accountant/profile',
                <UserCircle className="w-4 h-4" />,
                t('accountProfile')
              )}
            </div>
          )}

          {/* ======================================= */}
          {/* ANIMATOR NAVIGATION */}
          {/* ======================================= */}
          {user.role === 'ANIMATOR' && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A] block mb-2">
                  {language === 'rw' ? 'Ububiko n’Imicungire y’Ibiribwa' : 'Inventory & Stock Operations'}
                </span>
              )}
              {isCollapsed && <div className="h-px bg-[#E2E8F0] dark:bg-[#252B33] my-1 mx-1 lg:block hidden" />}

              {renderNavLink(
                '/dashboard/animator',
                <Package className="w-4 h-4" />,
                t('foodInventory'),
                true
              )}
              {renderNavLink(
                '/dashboard/animator/stock-in',
                <ArrowDownLeft className="w-4 h-4 text-[#16A34A] dark:text-[#0ECB81]" />,
                t('stockInTitle')
              )}
              {renderNavLink(
                '/dashboard/animator/stock-out',
                <ArrowUpRight className="w-4 h-4 text-[#F59E0B] dark:text-[#F0B90B]" />,
                t('dailyStockOutBtn')
              )}
              {renderNavLink(
                '/dashboard/animator/terms',
                <CalendarRange className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />,
                t('academicTermsStock')
              )}
              {renderNavLink(
                '/dashboard/animator/history',
                <FileClock className="w-4 h-4" />,
                t('stockLedgerTitle')
              )}
              {renderNavLink(
                '/dashboard/animator/suppliers',
                <Truck className="w-4 h-4" />,
                t('supplierManagement')
              )}
              {renderNavLink(
                '/dashboard/animator/reports',
                <FileBarChart2 className="w-4 h-4" />,
                t('reportsAnalytics')
              )}
              {renderNavLink(
                '/dashboard/animator/messages',
                <Inbox className="w-4 h-4" />,
                t('inboxInquiries')
              )}
              {renderNavLink(
                '/dashboard/animator/profile',
                <UserCircle className="w-4 h-4" />,
                t('accountProfile')
              )}
            </div>
          )}

        </div>

        {/* Bottom User Card & Collapse Toggle Footer */}
        <div className="p-3 border-t border-[#E2E8F0] dark:border-[#252B33] bg-[#F5F7FB]/70 dark:bg-[#181D24] shrink-0 space-y-2">
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'} gap-2`}>
            <div
              className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-2.5'} min-w-0 cursor-pointer`}
              onClick={() => navigate(`/dashboard/${user.role.toLowerCase()}/profile`)}
              title={t('accountProfile')}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#CBDCFD] dark:border-[#2B3139] bg-white dark:bg-[#202630] shrink-0 flex items-center justify-center shadow-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#1769FF] dark:text-[#FCD535] bg-[#EAF2FF] dark:bg-[#FCD535]/20">
                    {user.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`flex flex-col min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <span className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-[#707A8A] font-mono truncate">
                  {user.position}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 text-[#64748B] hover:text-[#DC2626] dark:hover:text-[#F6465D] hover:bg-rose-50 dark:hover:bg-[#F6465D]/15 rounded-lg transition-colors shrink-0 cursor-pointer"
              title={t('navLogout')}
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Collapse / Expand Inline Action */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full py-1.5 px-2 text-xs font-medium text-[#64748B] hover:text-[#1769FF] hover:bg-[#EAF2FF] dark:text-[#A0AAB8] dark:hover:text-[#FCD535] dark:hover:bg-[#202630] rounded-lg transition-colors cursor-pointer"
              title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />
              ) : (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <PanelLeftClose className="w-3.5 h-3.5" />
                  <span>{t('collapseSidebar')}</span>
                </div>
              )}
            </button>
          )}
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
