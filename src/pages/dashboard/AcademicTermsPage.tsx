import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AcademicTerm, TermStockItem, TermDetailResponse } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import {
  CalendarRange,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Package,
  Layers,
  Clock,
  Edit2,
  Check,
  RefreshCw,
  X,
  FileText,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export const AcademicTermsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const isDirector = user?.role === 'DIRECTOR';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const canManageTerms = isDirector || isAccountant;

  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [termDetail, setTermDetail] = useState<TermDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ledger' | 'transactions'>('ledger');
  const [loading, setLoading] = useState(true);
  const [termLoading, setTermLoading] = useState(false);

  // Modals state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingTerm, setIsClosingTerm] = useState(false);

  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [datesForm, setDatesForm] = useState({ name: '', start_date: '', end_date: '' });
  const [isSavingDates, setIsSavingDates] = useState(false);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ product_id: 0, opening_stock: '', reason: '' });
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch list of terms for academic year
  const fetchTerms = async (keepSelection = true) => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/terms', { params: { academic_year: academicYear } });
      const termsList: AcademicTerm[] = res.data?.terms || [];
      setTerms(termsList);

      if (termsList.length > 0) {
        let termToSelect = termsList[0];
        if (keepSelection && selectedTermId) {
          const match = termsList.find((t) => t.id === selectedTermId);
          if (match) termToSelect = match;
        } else {
          const active = termsList.find((t) => t.status === 'ACTIVE');
          if (active) termToSelect = active;
        }
        setSelectedTermId(termToSelect.id);
        fetchTermDetail(termToSelect.id);
      } else {
        setSelectedTermId(null);
        setTermDetail(null);
      }
    } catch (err) {
      console.error('Failed to load academic terms:', err);
      setErrorMsg('Failed to fetch academic terms.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single term itemized details
  const fetchTermDetail = async (termId: number) => {
    try {
      setTermLoading(true);
      const res = await api.get(`/inventory/terms/${termId}`);
      setTermDetail(res.data);
    } catch (err) {
      console.error('Failed to fetch term details:', err);
      setErrorMsg('Failed to load quarterly stock ledger.');
    } finally {
      setTermLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms(false);
  }, [academicYear]);

  const handleSelectTerm = (termId: number) => {
    setSelectedTermId(termId);
    fetchTermDetail(termId);
  };

  // Term Activation handler
  const handleActivateTerm = async () => {
    if (!selectedTermId) return;
    try {
      const res = await api.post(`/inventory/terms/${selectedTermId}/activate`);
      setNotice(res.data.message || 'Academic term activated successfully.');
      fetchTerms(true);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to activate term.');
    }
  };

  // Term Closing handler
  const handleCloseTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    setIsClosingTerm(true);
    try {
      const res = await api.post(`/inventory/terms/${selectedTermId}/close`, {
        closing_notes: closingNotes,
      });
      setNotice(res.data.message || 'Term closed successfully. Closing stocks carried forward to the next term.');
      setIsCloseModalOpen(false);
      setClosingNotes('');
      fetchTerms(true);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to close academic term.');
    } finally {
      setIsClosingTerm(false);
    }
  };

  // Dates configuration handler
  const openDatesModal = () => {
    if (!termDetail?.term) return;
    setDatesForm({
      name: termDetail.term.name,
      start_date: termDetail.term.start_date,
      end_date: termDetail.term.end_date,
    });
    setIsDatesModalOpen(true);
  };

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    setIsSavingDates(true);
    try {
      await api.put(`/inventory/terms/${selectedTermId}`, datesForm);
      setNotice('Term dates updated successfully.');
      setIsDatesModalOpen(false);
      fetchTerms(true);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update term dates.');
    } finally {
      setIsSavingDates(false);
    }
  };

  // Opening stock adjustment handler
  const openAdjustModal = (item: TermStockItem) => {
    setAdjustForm({
      product_id: item.product_id,
      opening_stock: String(item.opening_stock),
      reason: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    const qty = parseFloat(adjustForm.opening_stock);
    if (isNaN(qty) || qty < 0) {
      setErrorMsg('Opening stock quantity must be non-negative.');
      return;
    }
    if (!adjustForm.reason || adjustForm.reason.trim().length < 5) {
      setErrorMsg('Mandatory audit justification reason is required.');
      return;
    }

    setIsSavingAdjust(true);
    try {
      await api.put(`/inventory/terms/${selectedTermId}/opening-stock`, {
        product_id: adjustForm.product_id,
        opening_stock: qty,
        reason: adjustForm.reason,
      });
      setNotice('Opening stock adjusted and audit trail logged.');
      setIsAdjustModalOpen(false);
      fetchTermDetail(selectedTermId);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to adjust opening stock.');
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const activeTerm = termDetail?.term;
  const items = termDetail?.items || [];
  const stockInTx = termDetail?.transactions?.stock_in || [];
  const stockOutTx = termDetail?.transactions?.stock_out || [];

  // Summary totals
  const totalStaples = items.length;
  const totalReceived = items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
  const totalIssued = items.reduce((sum, item) => sum + (item.issued_quantity || 0), 0);
  const totalValuation = items.reduce((sum, item) => sum + (item.total_value || 0), 0);

  // CSV Export columns
  const exportColumns = [
    { header: 'Product Name', key: 'product_name' },
    { header: 'Category', key: 'category' },
    { header: 'Unit', key: 'unit' },
    { header: 'Opening Stock', key: 'opening_stock', format: (val: any) => Number(val).toFixed(1) },
    { header: 'Received (In)', key: 'received_quantity', format: (val: any) => Number(val).toFixed(1) },
    { header: 'Issued (Out)', key: 'issued_quantity', format: (val: any) => Number(val).toFixed(1) },
    { header: 'Closing Stock', key: 'closing_stock', format: (val: any) => Number(val).toFixed(1) },
    { header: 'Avg Unit Cost (RWF)', key: 'unit_cost', format: (val: any) => Number(val).toLocaleString() },
    { header: 'Total Value (RWF)', key: 'total_value', format: (val: any) => Number(val).toLocaleString() },
    { header: 'Stock Status', key: 'stock_status' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-fadeIn">
      
      {/* Printable Institutional Header (Hidden on screen, visible on print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
          Institut Baptiste de Buberuka (IBB)
        </h1>
        <p className="text-xs text-slate-600">
          Republic of Rwanda — Ministry of Education / RTB
        </p>
        <h2 className="text-sm font-semibold uppercase mt-2 text-slate-800">
          Quarterly Academic Term Stock Ledger & Inventory Valuation
        </h2>
        <p className="text-xs text-slate-500">
          Academic Year: {academicYear} | Term: {activeTerm?.name || 'N/A'} ({activeTerm?.start_date} to {activeTerm?.end_date})
        </p>
      </div>

      {/* Main Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#252B33] no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-[#1769FF] dark:text-[#FCD535]" />
            <span>{t('academicTermsStock')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1 max-w-2xl">
            {t('academicTermsStockSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#181D24] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2B3139]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#707A8A] uppercase">Year:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-[#F0F3F6] focus:outline-none cursor-pointer"
            >
              <option value="2026-2027">2026 - 2027</option>
              <option value="2027-2028">2027 - 2028</option>
            </select>
          </div>

          {/* Export & Print */}
          <ExportControls
            title={`IBB Quarterly Stock Report - ${activeTerm?.name || 'Term'} (${academicYear})`}
            data={items}
            columns={exportColumns}
            fileNamePrefix={`IBB_Stock_${activeTerm?.name?.replace(/\s+/g, '_') || 'Term'}`}
          />
        </div>
      </div>

      {/* Notification / Error Alerts */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center justify-between no-print animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D] flex items-center justify-between no-print animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 RWANDA ACADEMIC TERMS SELECTOR TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        {terms.map((term) => {
          const isSelected = term.id === selectedTermId;
          const isActive = term.status === 'ACTIVE';
          const isClosed = term.status === 'CLOSED';
          const isUpcoming = term.status === 'UPCOMING';

          return (
            <button
              key={term.id}
              onClick={() => handleSelectTerm(term.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-[#181D24] border-[#1769FF] dark:border-[#FCD535] ring-2 ring-[#1769FF]/20 dark:ring-[#FCD535]/20 shadow-md'
                  : 'bg-white dark:bg-[#181D24] border-slate-200 dark:border-[#2B3139] hover:border-slate-300 dark:hover:border-[#384252] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#A0AAB8]">
                  Term {term.term_number}
                </span>

                {/* Status Badges */}
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
                    {t('termActive')}
                  </span>
                )}
                {isClosed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8] border border-slate-200 dark:border-[#2B3139]">
                    <Lock className="w-2.5 h-2.5" />
                    {t('termClosed')}
                  </span>
                )}
                {isUpcoming && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1769FF]/10 text-[#1769FF] dark:text-[#38BDF8] border border-[#1769FF]/20">
                    <Clock className="w-2.5 h-2.5" />
                    {t('termUpcoming')}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-[#F0F3F6] truncate">
                  {term.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#707A8A] font-mono mt-0.5">
                  {term.start_date} → {term.end_date}
                </p>
              </div>

              {/* Carry forward hint */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#252B33] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#A0AAB8]">
                <span>
                  {term.term_number === 1
                    ? 'Baseline opening stock'
                    : `Opening ← Term ${term.term_number - 1} Closing`}
                </span>
                {isSelected && <ArrowRight className="w-3 h-3 text-[#1769FF] dark:text-[#FCD535]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TERM CONTROL & SUMMARY STRIP */}
      {activeTerm && (
        <div className="rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#181D24] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeTerm.status === 'ACTIVE'
                ? 'bg-[#0ECB81]/15 text-[#0ECB81]'
                : activeTerm.status === 'CLOSED'
                ? 'bg-slate-100 dark:bg-[#202630] text-slate-500'
                : 'bg-[#1769FF]/15 text-[#1769FF]'
            }`}>
              {activeTerm.status === 'CLOSED' ? <Lock className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-[#F0F3F6]">
                  {activeTerm.name}
                </h2>
                <span className="text-xs font-mono text-slate-400">({academicYear})</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-0.5">
                {activeTerm.status === 'ACTIVE'
                  ? 'Currently active school term. All daily food deliveries and dining hall releases are tracked dynamically.'
                  : activeTerm.status === 'CLOSED'
                  ? `Term closed and locked on ${activeTerm.closed_at ? new Date(activeTerm.closed_at).toLocaleDateString() : ''} by ${activeTerm.closed_by_name || 'Administration'}.`
                  : 'Upcoming academic term. Opening balances will inherit directly from the preceding term upon closing.'}
              </p>
            </div>
          </div>

          {/* Action buttons for authorized management */}
          {canManageTerms && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={openDatesModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-slate-50 dark:bg-[#202630] hover:bg-slate-100 dark:hover:bg-[#262D38] border border-slate-200 dark:border-[#2B3139] rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('editTermDates')}</span>
              </button>

              {activeTerm.status === 'UPCOMING' && (
                <button
                  onClick={handleActivateTerm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{t('setActiveTermBtn')}</span>
                </button>
              )}

              {activeTerm.status === 'ACTIVE' && (
                <button
                  onClick={() => setIsCloseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('closeTermBtn')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4 HIGH-IMPACT KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Monitored Staples */}
        <div className="bg-white dark:bg-[#181D24] p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#707A8A] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Food Staples Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#1769FF] dark:text-[#38BDF8] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
            {totalStaples} <span className="text-xs font-normal text-slate-500">Items</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            Grains, pulses, roots & cooking essentials
          </p>
        </div>

        {/* KPI 2: Total Received (In) */}
        <div className="bg-white dark:bg-[#181D24] p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#707A8A] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Received (In)</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-[#16A34A] dark:text-[#0ECB81] flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#16A34A] dark:text-[#0ECB81] font-mono tabular-nums">
            +{totalReceived.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            Official vendor procurement deliveries
          </p>
        </div>

        {/* KPI 3: Total Issued (Out) */}
        <div className="bg-white dark:bg-[#181D24] p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#707A8A] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Issued (Out)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-[#D97706] dark:text-[#F0B90B] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#D97706] dark:text-[#F0B90B] font-mono tabular-nums">
            -{totalIssued.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            Student dining hall kitchen rations
          </p>
        </div>

        {/* KPI 4: Closing Reserve Valuation */}
        <div className="bg-white dark:bg-[#181D24] p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#707A8A] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserve Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#1769FF]/20 text-[#1769FF] dark:text-[#FCD535] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
            {totalValuation.toLocaleString()} <span className="text-xs font-normal text-slate-500">RWF</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            Total monetary value of remaining stock
          </p>
        </div>

      </div>

      {/* CONTENT TABS: Quarterly Stock Ledger vs Term Transactions */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        
        {/* Tab navigation headers */}
        <div className="flex border-b border-slate-200 dark:border-[#252B33] px-6 pt-3 gap-6 no-print">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-[#1769FF] dark:border-[#FCD535] text-[#1769FF] dark:text-[#FCD535]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F0F3F6]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('termLedgerTab')}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8]">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'border-[#1769FF] dark:border-[#FCD535] text-[#1769FF] dark:text-[#FCD535]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F0F3F6]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('termTransactionsTab')}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8]">
              {stockInTx.length + stockOutTx.length}
            </span>
          </button>
        </div>

        {/* TAB 1: QUARTERLY STOCK LEDGER */}
        {activeTab === 'ledger' && (
          <div>
            {/* Dynamic Formula Explanation Banner */}
            <div className="p-4 bg-slate-50/80 dark:bg-[#11151B] border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between text-xs text-slate-600 dark:text-[#A0AAB8]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535] shrink-0" />
                <span>
                  <strong>Dynamic Calculation Formula:</strong> Closing Stock = (Opening Stock + Stock Received - Stock Issued).
                  {activeTerm?.term_number && activeTerm.term_number > 1 && (
                    <span className="ml-1 text-slate-500">
                      Opening Stock inherited from Term {activeTerm.term_number - 1} Closing.
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Single Source of Truth
              </span>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#151921] border-b border-slate-200 dark:border-[#252B33] text-[11px] font-bold uppercase text-slate-500 dark:text-[#707A8A]">
                    <th className="py-3.5 px-4">Food Staple</th>
                    <th className="py-3.5 px-3">Unit</th>
                    <th className="py-3.5 px-3 text-right">Opening Stock</th>
                    <th className="py-3.5 px-3 text-right text-[#16A34A] dark:text-[#0ECB81]">Received (+)</th>
                    <th className="py-3.5 px-3 text-right text-[#D97706] dark:text-[#F0B90B]">Issued (-)</th>
                    <th className="py-3.5 px-3 text-right font-black">Closing Stock</th>
                    <th className="py-3.5 px-3 text-right">Avg Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">Total Value</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    {canManageTerms && activeTerm?.status !== 'CLOSED' && (
                      <th className="py-3.5 px-4 text-center no-print">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#202630]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181D24]/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-[#F0F3F6]">
                          {item.product_name}
                        </div>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-[#C5D0DE]">
                        {item.opening_stock.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#16A34A] dark:text-[#0ECB81] font-semibold">
                        +{item.received_quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D97706] dark:text-[#F0B90B] font-semibold">
                        -{item.issued_quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-black text-slate-900 dark:text-[#F0F3F6] bg-slate-50/40 dark:bg-[#11151B]/40">
                        {item.closing_stock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-[#A0AAB8]">
                        {item.unit_cost.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-[#F0F3F6]">
                        {item.total_value.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.stock_status === 'OUT_OF_STOCK' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                            Out of Stock
                          </span>
                        )}
                        {item.stock_status === 'LOW_STOCK' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30">
                            Low Reserve
                          </span>
                        )}
                        {item.stock_status === 'NORMAL' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                            Healthy
                          </span>
                        )}
                      </td>

                      {canManageTerms && activeTerm?.status !== 'CLOSED' && (
                        <td className="py-3 px-4 text-center no-print">
                          <button
                            onClick={() => openAdjustModal(item)}
                            title="Adjust Opening Stock (Audited)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#252B33] transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No product ledger records found for this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TERM TRANSACTIONS HISTORY */}
        {activeTab === 'transactions' && (
          <div className="p-6 space-y-6">
            
            {/* Stock In Deliveries */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6] mb-3 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[#16A34A]" />
                <span>Stock Received (Deliveries During {activeTerm?.name})</span>
              </h3>
              
              <div className="overflow-x-auto border border-slate-200 dark:border-[#252B33] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#151921] border-b border-slate-200 dark:border-[#252B33] text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Total Cost</th>
                      <th className="py-3 px-4">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202630]">
                    {stockInTx.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-[#181D24]/50">
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-[#A0AAB8]">{tx.transaction_date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">{tx.product_name}</td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8]">{tx.supplier_name || 'Authorized Vendor'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#16A34A]">+{tx.quantity} {tx.unit}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{Number(tx.unit_cost).toLocaleString()} RWF</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{Number(tx.total_cost).toLocaleString()} RWF</td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8]">{tx.recorded_by_name || 'Accountant'}</td>
                      </tr>
                    ))}
                    {stockInTx.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          No Stock In deliveries recorded for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stock Out Issuances */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6] mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#D97706]" />
                <span>Stock Issued (Dining Rations During {activeTerm?.name})</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-[#252B33] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#151921] border-b border-slate-200 dark:border-[#252B33] text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Notes / Meal Purpose</th>
                      <th className="py-3 px-4">Override Status</th>
                      <th className="py-3 px-4">Issued By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202630]">
                    {stockOutTx.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-[#181D24]/50">
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-[#A0AAB8]">
                          {tx.transaction_date} · {tx.transaction_time}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">{tx.product_name}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#D97706]">
                          -{tx.quantity} {tx.unit}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8] max-w-xs truncate">
                          {tx.notes || 'Routine kitchen preparation'}
                        </td>
                        <td className="py-2.5 px-4">
                          {tx.is_emergency_override ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F6465D]/15 text-[#F6465D]">
                              Emergency Override
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0ECB81]/15 text-[#0ECB81]">
                              Scheduled
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8]">{tx.issued_by_name || 'Staff'}</td>
                      </tr>
                    ))}
                    {stockOutTx.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No Stock Out issuances recorded for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Printable Institutional Signature Block (Hidden on screen, visible on print) */}
      <div className="hidden print:grid grid-cols-2 gap-12 pt-16 mt-12 border-t text-xs">
        <div>
          <p className="font-bold uppercase text-slate-800">Prepared & Audited By:</p>
          <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
          <p className="mt-1 font-semibold text-slate-900">M. Niyongabo Emmanuel</p>
          <p className="text-[10px] text-slate-500">Chief Accountant — IBB Rwanda</p>
        </div>
        <div>
          <p className="font-bold uppercase text-slate-800">Approved & Sealed By:</p>
          <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
          <p className="mt-1 font-semibold text-slate-900">Pr. Ntiharirabura Jean Bosco</p>
          <p className="text-[10px] text-slate-500">School Director — IBB Rwanda</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CLOSE TERM & CARRY-FORWARD STOCK                */}
      {/* ======================================================== */}
      {isCloseModalOpen && activeTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                  {t('confirmCloseTermTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseTermSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-[#F0B90B] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Important Term Closing Policy</span>
                </div>
                <p className="leading-relaxed">
                  {t('carryForwardExplanation')}
                </p>
              </div>

              {/* Summary preview of closing balances */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-[#A0AAB8] uppercase block">
                  Closing Balances to Carry Forward:
                </span>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-[#252B33] rounded-lg p-2 space-y-1 bg-slate-50 dark:bg-[#11151B] text-xs">
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-[#202630] last:border-0">
                      <span className="font-medium text-slate-800 dark:text-[#F0F3F6]">{i.product_name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-[#FCD535]">
                        {i.closing_stock} {i.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Closing Observations / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="e.g. End of term inventory audit complete. All dining hall accounts reconciled."
                  className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosingTerm}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isClosingTerm ? 'Locking Term & Carrying Forward...' : 'Confirm Closing & Lock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT TERM DATES                                 */}
      {/* ======================================================== */}
      {isDatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                Configure Term Dates
              </h3>
              <button
                onClick={() => setIsDatesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDates} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Term Name *
                </label>
                <input
                  type="text"
                  value={datesForm.name}
                  onChange={(e) => setDatesForm({ ...datesForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={datesForm.start_date}
                    onChange={(e) => setDatesForm({ ...datesForm, start_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={datesForm.end_date}
                    onChange={(e) => setDatesForm({ ...datesForm, end_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDatesModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDates}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-sm cursor-pointer"
                >
                  {isSavingDates ? 'Saving...' : 'Save Dates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADJUST OPENING STOCK (AUDITED)                  */}
      {/* ======================================================== */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                Adjust Opening Stock (Audited)
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Adjusted Opening Stock Quantity *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={adjustForm.opening_stock}
                  onChange={(e) => setAdjustForm({ ...adjustForm, opening_stock: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Mandatory Audit Justification *
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Physical stock take reconciliation difference"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjust}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-sm cursor-pointer"
                >
                  {isSavingAdjust ? 'Saving...' : 'Update Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
