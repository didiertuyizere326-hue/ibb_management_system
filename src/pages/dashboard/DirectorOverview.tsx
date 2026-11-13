import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { Application } from '../../types';
import { DocumentModal } from '../../components/common/DocumentModal';
import {
  Users,
  Package,
  Wallet,
  CalendarRange,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Eye,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Activity,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  CreditCard,
  FileBarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';

export const DirectorOverview: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#2B3139' : '#E2E8F0';
  const tickColor = isDark ? '#707A8A' : '#64748B';
  const pieStroke = isDark ? '#181D24' : '#FFFFFF';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/executive-overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[460px]">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-[#A0AAB8]">
          <div className="w-9 h-9 border-2 border-[#1769FF] dark:border-[#FCD535] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider uppercase">
            {language === 'rw' ? 'Gutegereza Amakuru y’Ibiro...' : 'Loading Executive Terminal...'}
          </span>
        </div>
      </div>
    );
  }

  const {
    applications,
    studentsByLevel,
    studentsByDept,
    inventory,
    financial,
    recentApplications,
    recentStockOut,
    messages,
    admissionsGrowth,
    stockSpendTrend,
  } = data;

  // Chart data: Application breakdown with light/dark theme adaptation
  const appBreakdown = [
    { name: language === 'rw' ? 'Bemerewe' : 'Admitted', count: applications?.approved_apps || 0, color: isDark ? '#0ECB81' : '#16A34A' },
    { name: language === 'rw' ? 'Bategereje' : 'Pending', count: applications?.pending_apps || 0, color: isDark ? '#F0B90B' : '#F59E0B' },
    { name: language === 'rw' ? 'Gusuzumwa' : 'Review', count: applications?.review_apps || 0, color: isDark ? '#38BDF8' : '#1769FF' },
    { name: language === 'rw' ? 'Banzwe' : 'Rejected', count: applications?.rejected_apps || 0, color: isDark ? '#F6465D' : '#DC2626' },
  ];

  const DONUT_COLORS = isDark
    ? ['#FCD535', '#3B82F6', '#0ECB81', '#8B5CF6']
    : ['#1769FF', '#0B3B91', '#16A34A', '#F59E0B'];

  const chartPrimaryStroke = isDark ? '#FCD535' : '#1769FF';
  const chartSecondaryStroke = isDark ? '#3B82F6' : '#0B3B91';
  const chartSpendStroke = isDark ? '#0ECB81' : '#16A34A';

  // Clean Tooltip adapted for both White and Dark Themes
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#202630] border border-[#E2E8F0] dark:border-[#2B3139] p-3 rounded-xl shadow-xl text-xs font-sans">
          <p className="text-[11px] font-sans text-[#64748B] dark:text-[#707A8A] uppercase font-bold tracking-wider mb-1.5">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color || entry.stroke || (isDark ? '#FCD535' : '#1769FF') }}
                />
                <span className="text-[#172033] dark:text-[#A0AAB8] font-medium">{entry.name}:</span>
              </div>
              <span className="font-sans font-bold text-[#172033] dark:text-[#F0F3F6] tabular-nums">
                {typeof entry.value === 'number' && entry.value > 1000
                  ? entry.value.toLocaleString()
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Title & Binance Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('executiveTerminal')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            Real-time institutional oversight, enrollment growth curves, inventory velocity, and financial health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/director/admissions"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-all duration-150"
          >
            <span>{t('viewAllAdmissions')}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950/20 text-slate-950 text-[10px] font-mono">
              {applications?.pending_apps || 0}
            </span>
          </Link>

          <Link
            to="/dashboard/director/reports"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-[#F0F3F6] bg-slate-100 dark:bg-[#181D24] hover:bg-slate-200 dark:hover:bg-[#202630] border border-slate-200 dark:border-[#2B3139] rounded-lg transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t('auditExports')}</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QUICK ACTIONS ROW (INSPIRED BY INFORIDA / NUCLEUS STYLE) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/dashboard/director/admissions"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Kwakira Abanyeshuri' : 'Admit Student'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {applications?.pending_apps || 0} {language === 'rw' ? 'bategereje' : 'pending'}
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard/director/staff"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Abakozi b’Ishuri' : 'Staff Accounts'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Imyirondoro & Ibyiciro' : 'Access & Roles'}
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard/director/bank-accounts"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Konti za Banki' : 'Bank Accounts'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Uburyo bwo Kwishyura' : 'Tuition & Fees'}
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard/director/inventory"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Ububiko bw’Ibiribwa' : 'Food Inventory'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {inventory?.total_products || 0} {language === 'rw' ? 'biri mu bubiko' : 'staples active'}
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard/director/terms"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <CalendarRange className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Imyaka & Ibihembwe' : 'Academic Terms'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Ibarura rya Stock' : 'Quarterly Stock Ledger'}
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard/director/reports"
          className="bg-white dark:bg-[#181D24] p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/50 dark:hover:border-[#FCD535]/50 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileBarChart2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate">
              {language === 'rw' ? 'Gusohora Raporo' : 'Generate Reports'}
            </span>
            <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'CSV & Kwicapa' : 'CSV & Print View'}
            </span>
          </div>
        </Link>
      </div>

      {/* ======================================================== */}
      {/* 4 MODERN KPI STAT CARDS (PALETTE & TYPOGRAPHY UPGRADED) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Applications */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/40 dark:hover:border-[#FCD535]/40 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Abasabye Kwiga' : 'Admissions Pipeline'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#38BDF8] flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#172033] dark:text-[#F0F3F6] font-sans tabular-nums tracking-tight">
                {applications?.total_apps || 0}
              </span>
              <span className="text-xs text-[#16A34A] dark:text-[#0ECB81] font-sans font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{((applications?.approved_apps || 0) / Math.max(1, applications?.total_apps || 1) * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans pt-2 border-t border-[#E2E8F0] dark:border-[#252B33]">
              <span className="text-[#16A34A] dark:text-[#0ECB81] font-semibold">
                {applications?.approved_apps || 0} {language === 'rw' ? 'Bemerewe' : 'Admitted'}
              </span>
              <span className="text-[#F59E0B] dark:text-[#F0B90B] font-medium">
                {applications?.pending_apps || 0} {language === 'rw' ? 'Bategereje' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Boarding Qualified Students */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#16A34A]/40 dark:hover:border-[#0ECB81]/40 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Abemerewe Amacumbi (≥80%)' : 'Boarding Qualified (≥80%)'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#202630] text-[#16A34A] dark:text-[#0ECB81] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#16A34A] dark:text-[#0ECB81] font-sans tabular-nums tracking-tight">
                {applications?.boarding_qualified || 0}
              </span>
              <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] font-sans font-medium">
                {language === 'rw' ? 'Abanyeshuri' : 'Scholars'}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans pt-2 border-t border-[#E2E8F0] dark:border-[#252B33]">
              <span className="text-[#64748B] dark:text-[#A0AAB8]">
                {language === 'rw' ? 'Ipimo ry’Igihugu S3' : 'S3 National Benchmark'}
              </span>
              <span className="text-[#16A34A] dark:text-[#0ECB81] font-bold">
                {language === 'rw' ? '100% Bemerewe' : '100% Eligible'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Food Stock Valuation & Health */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/40 dark:hover:border-[#FCD535]/40 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Agaciro k’Ibiribwa mu Bubiko' : 'Food Stock Valuation'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-[#202630] text-[#F59E0B] dark:text-[#FCD535] flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-sans font-bold text-[#64748B] dark:text-[#707A8A]">RWF</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#172033] dark:text-[#F0F3F6] font-sans tabular-nums tracking-tight">
                {Math.round(inventory?.total_valuation || 0).toLocaleString()}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans pt-2 border-t border-[#E2E8F0] dark:border-[#252B33]">
              <span className="text-[#64748B] dark:text-[#A0AAB8]">
                {inventory?.total_products || 0} {language === 'rw' ? 'Biri mu Bubiko' : 'Staples Active'}
              </span>
              {inventory?.low_stock_count > 0 ? (
                <span className="text-[#DC2626] dark:text-[#F6465D] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#F6465D] animate-ping" />
                  {inventory.low_stock_count} {language === 'rw' ? 'Biri Hasi' : 'Low Alert'}
                </span>
              ) : (
                <span className="text-[#16A34A] dark:text-[#0ECB81] font-semibold">
                  {language === 'rw' ? 'Bihagije Neza' : 'Reserves Optimal'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Inquiries & Messages */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs hover:border-[#1769FF]/40 dark:hover:border-[#38BDF8]/40 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#707A8A]">
              {language === 'rw' ? 'Ubutumwa n’Ibibazo' : 'Inquiry & Community'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF2FF] dark:bg-[#202630] text-[#1769FF] dark:text-[#38BDF8] flex items-center justify-center">
              <Inbox className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#172033] dark:text-[#F0F3F6] font-sans tabular-nums tracking-tight">
                {messages?.total || 0}
              </span>
              <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] font-sans font-medium">
                {language === 'rw' ? 'Ubutumwa' : 'Inquiries'}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] font-sans pt-2 border-t border-[#E2E8F0] dark:border-[#252B33]">
              <span className="text-[#1769FF] dark:text-[#38BDF8] font-semibold">
                {messages?.unread || 0} {language === 'rw' ? 'Butarasomwa' : 'Unread'}
              </span>
              <Link to="/dashboard/director/messages" className="text-[#64748B] hover:text-[#1769FF] dark:text-slate-400 dark:hover:text-[#F0F3F6] font-medium transition-colors">
                {language === 'rw' ? 'Fungura Inbox →' : 'Open Inbox →'}
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* ROW 1 CHARTS: ADMISSIONS GROWTH & FOOD PROCUREMENT TREND */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Admissions Enrollment Curve */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1769FF] dark:bg-[#FCD535]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                  {t('admissionsTrajectory')}
                </h3>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#707A8A] mt-0.5">
                {t('sixMonthGrowth')}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-sm bg-[#1769FF] dark:bg-[#FCD535]" />
                <span className="text-[#64748B] dark:text-[#A0AAB8] font-medium">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-sm bg-[#0B3B91] dark:bg-[#3B82F6]" />
                <span className="text-[#64748B] dark:text-[#A0AAB8] font-medium">Admitted</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admissionsGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartPrimaryStroke} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartPrimaryStroke} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartSecondaryStroke} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartSecondaryStroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={isDark ? 0.3 : 0.7} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke={chartPrimaryStroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#admissionGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke={chartSecondaryStroke}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#secondaryGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Food Inventory Procurement & Spend Velocity */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] dark:bg-[#0ECB81]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                  {t('foodProcurementTrend')}
                </h3>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#707A8A] mt-0.5">
                {t('monthlyProcurementSpend')}
              </p>
            </div>
            <span className="text-xs font-sans font-bold tabular-nums text-[#16A34A] dark:text-[#0ECB81]">
              RWF {Math.round(financial?.total_spend || 0).toLocaleString()} Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockSpendTrend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartSpendStroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartSpendStroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={isDark ? 0.3 : 0.7} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: tickColor }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  name="Procurement Spend (RWF)"
                  stroke={chartSpendStroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* ROW 2 CHARTS: ACADEMIC LEVEL DONUT & STATUS DISTRIBUTION */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 3: Enrolled Students by Level (Sleek Donut Chart with Center Metric) */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                {t('enrolledByLevel')}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#707A8A] mt-0.5">
                {t('enrolledCohortBreakdown')}
              </p>
            </div>
            <span className="text-[11px] font-sans font-medium text-[#64748B] dark:text-[#707A8A]">
              Academic Year 2026-2027
            </span>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentsByLevel}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  stroke={pieStroke}
                  strokeWidth={2}
                >
                  {studentsByLevel.map((entry: any, index: number) => (
                    <Cell key={`donut-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-sans text-[#64748B] dark:text-[#A0AAB8] mr-2">
                      {val}: <strong className="text-[#172033] dark:text-[#F0F3F6] font-bold tabular-nums">{entry.payload.count}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-3xl font-extrabold font-sans text-[#172033] dark:text-[#F0F3F6] tabular-nums tracking-tight">
                {applications?.approved_apps || 0}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#707A8A] tracking-wider">
                Enrolled
              </span>
            </div>
          </div>
        </div>

        {/* Chart 4: Admission Status Distribution (Rounded Bar Chart) */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                {t('admissionsDecisionDistribution')}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#707A8A] mt-0.5">
                {t('currentEvaluationState')}
              </p>
            </div>
            <span className="text-xs font-sans font-bold tabular-nums text-[#1769FF] dark:text-[#FCD535]">
              {applications?.total_apps || 0} Total Dossiers
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={isDark ? 0.3 : 0.7} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {appBreakdown.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* FINANCIAL TABLES: RECENT APPLICATIONS & DAILY STOCK LOG */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Recent Applications Table */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#252B33]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                {t('recentAdmissionDossiers')}
              </h3>
              <span className="text-[11px] text-[#64748B] dark:text-[#707A8A]">
                {language === 'rw' ? 'Bitegereje isuzuma ry’Umuyobozi' : 'Pending director evaluation & verification'}
              </span>
            </div>
            <Link
              to="/dashboard/director/admissions"
              className="text-xs font-bold text-[#1769FF] dark:text-[#FCD535] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{t('allStatus')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-[#F5F7FB] dark:bg-[#11151B] text-[#64748B] dark:text-[#707A8A] uppercase font-sans font-bold tracking-wider text-[10px] border-b border-[#E2E8F0] dark:border-[#252B33]">
                <tr>
                  <th className="py-2.5 px-4">{language === 'rw' ? 'Umunyeshuri' : 'Candidate'}</th>
                  <th className="py-2.5 px-3">{language === 'rw' ? 'Ishami & Urwego' : 'Trade & Level'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'rw' ? 'Amanota S3' : 'S3 Marks'}</th>
                  <th className="py-2.5 px-3 text-center">{language === 'rw' ? 'Imiterere' : 'Status'}</th>
                  <th className="py-2.5 px-4 text-right">{language === 'rw' ? 'Suzuma' : 'Inspect'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#252B33]">
                {recentApplications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-[#F3F7FF] dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F0F3F6] truncate max-w-[140px]">
                      {app.student_name}
                      <span className="block text-[10px] text-[#64748B] dark:text-[#707A8A] font-sans mt-0.5">
                        {app.tracking_number}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#64748B] dark:text-[#A0AAB8]">
                      <span className="font-sans font-bold text-[#172033] dark:text-[#F0F3F6]">{app.academic_level}</span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] block">
                        {app.department === 'Software Development' ? 'Software' : 'Auto'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-sans font-bold tabular-nums">
                      <span className={app.s3_marks >= 80 ? 'text-[#16A34A] dark:text-[#0ECB81]' : 'text-[#172033] dark:text-[#F0F3F6]'}>
                        {app.s3_marks}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${
                        app.status === 'Approved'
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] dark:bg-[#0ECB81]/15 dark:text-[#0ECB81] dark:border-[#0ECB81]/30'
                          : app.status === 'Pending'
                          ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-[#F0B90B]/15 dark:text-[#F0B90B] dark:border-[#F0B90B]/30'
                          : app.status === 'Under Review'
                          ? 'bg-[#EAF2FF] text-[#1769FF] border border-[#BFDBFE] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] dark:border-[#38BDF8]/30'
                          : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] dark:bg-[#F6465D]/15 dark:text-[#F6465D] dark:border-[#F6465D]/30'
                      }`}>
                        {app.status === 'Approved' && language === 'rw' ? 'Yemejwe'
                          : app.status === 'Pending' && language === 'rw' ? 'Bitegerejwe'
                          : app.status === 'Under Review' && language === 'rw' ? 'Gusuzumwa'
                          : app.status === 'Rejected' && language === 'rw' ? 'Yanzwe'
                          : app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-1.5 text-[#64748B] hover:text-[#1769FF] hover:bg-[#EAF2FF] dark:hover:text-[#FCD535] dark:hover:bg-[#262D38] rounded-lg transition-colors"
                        title={language === 'rw' ? 'Suzuma Dosiyeti' : 'Inspect Application Dossier'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Stock Out Issues */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#252B33]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                {t('dailyStockIssuanceLog')}
              </h3>
              <span className="text-[11px] text-[#64748B] dark:text-[#707A8A]">
                {language === 'rw' ? 'Ibisohoka buri munsi bigana mu gikoni' : 'Daily food dispatches to boarding refectory'}
              </span>
            </div>
            <Link
              to="/dashboard/director/inventory"
              className="text-xs font-bold text-[#1769FF] dark:text-[#FCD535] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{language === 'rw' ? 'Ububiko bwose' : 'Inventory Portal'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-[#F5F7FB] dark:bg-[#11151B] text-[#64748B] dark:text-[#707A8A] uppercase font-sans font-bold tracking-wider text-[10px] border-b border-[#E2E8F0] dark:border-[#252B33]">
                <tr>
                  <th className="py-2.5 px-4">{language === 'rw' ? 'Ikiribwa' : 'Food Product'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'rw' ? 'Ingano' : 'Quantity'}</th>
                  <th className="py-2.5 px-3">{language === 'rw' ? 'Igihe (CAT)' : 'Time (CAT)'}</th>
                  <th className="py-2.5 px-4">{language === 'rw' ? 'Cyatanzwe na' : 'Dispatched By'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#252B33]">
                {recentStockOut.map((so: any) => (
                  <tr key={so.id} className="hover:bg-[#F3F7FF] dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#172033] dark:text-[#F0F3F6]">
                      {so.product_name}
                    </td>
                    <td className="py-3 px-3 text-right font-sans font-bold text-[#F59E0B] dark:text-[#F0B90B] tabular-nums">
                      {so.quantity} <span className="text-[10px] text-[#64748B] dark:text-[#707A8A]">{so.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-[#64748B] dark:text-[#A0AAB8] font-sans text-[11px] tabular-nums">
                      {so.transaction_time} <span className="text-[10px] text-[#94A3B8] dark:text-[#707A8A]">({so.transaction_date})</span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] dark:text-[#A0AAB8] text-[11px] truncate max-w-[120px]">
                      {so.issued_by_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Document Review Modal */}
      {selectedApp && (
        <DocumentModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}

    </div>
  );
};
