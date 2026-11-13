import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AcademicTerm, TermStockItem, TermDetailResponse, YearMeta } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import {
  CalendarRange,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Clock,
  Edit2,
  X,
  Sliders,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Plus,
  Filter
} from 'lucide-react';

const FALLBACK_YEARS = Array.from({ length: 2050 - 2022 }, (_, i) => `${2022 + i}-${2023 + i}`);

export const AcademicTermsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const isDirector = user?.role === 'DIRECTOR';
  const isAccountant = user?.role === 'ACCOUNTANT';
  const canManageTerms = isDirector || isAccountant;

  const initialYearParam = searchParams.get('year');
  const initialTermIdParam = searchParams.get('termId');

  const [academicYear, setAcademicYear] = useState(
    initialYearParam && /^\d{4}-\d{4}$/.test(initialYearParam) ? initialYearParam : '2026-2027'
  );
  const [availableYears, setAvailableYears] = useState<string[]>(FALLBACK_YEARS);
  const [yearMeta, setYearMeta] = useState<YearMeta | null>(null);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(
    initialTermIdParam ? parseInt(initialTermIdParam, 10) || null : null
  );
  const [termDetail, setTermDetail] = useState<TermDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ledger' | 'transactions'>('ledger');
  const [loading, setLoading] = useState(true);
  const [termLoading, setTermLoading] = useState(false);

  // Stock Movement History filters
  const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [movementProductFilter, setMovementProductFilter] = useState<string>('ALL');

  // Close term modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingTerm, setIsClosingTerm] = useState(false);

  // Reopen closed term modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenForm, setReopenForm] = useState({ reason: '', newEndDate: '' });
  const [isReopeningTerm, setIsReopeningTerm] = useState(false);

  // Edit term dates modal
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [datesForm, setDatesForm] = useState({ name: '', start_date: '', end_date: '' });
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Create term modal
  const [isCreateTermModalOpen, setIsCreateTermModalOpen] = useState(false);
  const [createTermForm, setCreateTermForm] = useState({
    academicYear: '2026-2027',
    termNumber: '1',
    name: 'Term 1',
    startDate: '',
    endDate: '',
  });
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);

  // Adjust single product opening stock modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    product_id: 0,
    product_name: '',
    unit: '',
    opening_stock: '',
    reason: '',
  });
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  // Initialize academic year modal
  const [isInitYearModalOpen, setIsInitYearModalOpen] = useState(false);
  const [initQuantities, setInitQuantities] = useState<Record<number, string>>({});
  const [initReason, setInitReason] = useState('');
  const [isInitializingYear, setIsInitializingYear] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync deep link params if user clicks a notification while already on this page
  useEffect(() => {
    const y = searchParams.get('year');
    const tid = searchParams.get('termId');
    if (y && /^\d{4}-\d{4}$/.test(y) && y !== academicYear) {
      setAcademicYear(y);
    }
    if (tid) {
      const parsed = parseInt(tid, 10);
      if (!isNaN(parsed)) {
        setSelectedTermId(parsed);
      }
    }
  }, [searchParams]);

  const notifyBellRefresh = () => {
    window.dispatchEvent(new CustomEvent('ibb:notifications-updated'));
  };

  const fetchTerms = async (keepSelection = true, preferredTermId?: number | null) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get('/inventory/terms', { params: { academic_year: academicYear } });
      const termsList: AcademicTerm[] = res.data?.terms || [];
      setTerms(termsList);
      if (Array.isArray(res.data?.availableYears) && res.data.availableYears.length > 0) {
        setAvailableYears(res.data.availableYears);
      }
      setYearMeta(res.data?.yearMeta || null);

      if (termsList.length > 0) {
        let termToSelect = termsList[0];
        const targetId = preferredTermId ?? (keepSelection ? selectedTermId : null);
        if (targetId) {
          const match = termsList.find((item) => item.id === targetId);
          if (match) {
            termToSelect = match;
          } else {
            const active = termsList.find((item) => item.status === 'Active');
            if (active) termToSelect = active;
          }
        } else {
          const active = termsList.find((item) => item.status === 'Active');
          if (active) termToSelect = active;
        }
        setSelectedTermId(termToSelect.id);
        fetchTermDetail(termToSelect.id);
      } else {
        setSelectedTermId(null);
        setTermDetail(null);
      }
    } catch (err: any) {
      console.error('Failed to load academic terms:', err);
      setErrorMsg(
        err.response?.data?.error ||
          (language === 'rw' ? 'Gufungura ibihembwe byanze.' : 'Failed to fetch academic terms.')
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTermDetail = async (termId: number) => {
    try {
      setTermLoading(true);
      const res = await api.get(`/inventory/terms/${termId}`);
      setTermDetail(res.data);
    } catch (err: any) {
      console.error('Failed to fetch term details:', err);
      setErrorMsg(
        err.response?.data?.error ||
          (language === 'rw' ? 'Gufungura igitabo cya stock byanze.' : 'Failed to load quarterly stock ledger.')
      );
    } finally {
      setTermLoading(false);
    }
  };

  useEffect(() => {
    const tidParam = searchParams.get('termId');
    const parsedTid = tidParam ? parseInt(tidParam, 10) : null;
    fetchTerms(Boolean(parsedTid), parsedTid && !isNaN(parsedTid) ? parsedTid : null);
  }, [academicYear]);

  const handleSelectTerm = (termId: number) => {
    setSelectedTermId(termId);
    setMovementProductFilter('ALL');
    setMovementTypeFilter('ALL');
    fetchTermDetail(termId);
  };

  const handleActivateTerm = async () => {
    if (!selectedTermId) return;
    setErrorMsg(null);
    try {
      const res = await api.post(`/inventory/terms/${selectedTermId}/activate`);
      setNotice(
        language === 'rw'
          ? 'Igihembwe cyemejwe nk’igihembwe gikora.'
          : res.data.message || 'Academic term activated successfully.'
      );
      notifyBellRefresh();
      fetchTerms(true);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          (language === 'rw' ? 'Kugira igihembwe gikora byanze.' : 'Failed to activate term.')
      );
    }
  };

  const handleCloseTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    setModalError(null);
    setErrorMsg(null);
    setIsClosingTerm(true);
    try {
      const res = await api.post(`/inventory/terms/${selectedTermId}/close`, {
        closing_notes: closingNotes,
      });
      setNotice(
        language === 'rw'
          ? 'Igihembwe cyafunzwe kandi stock isigaye yimuriwe mu gihembwe gikurikira.'
          : res.data.message || 'Term closed successfully. Closing stocks carried forward.'
      );
      setIsCloseModalOpen(false);
      setClosingNotes('');
      notifyBellRefresh();
      fetchTerms(true);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Gusoza igihembwe byanze.' : 'Failed to close academic term.')
      );
    } finally {
      setIsClosingTerm(false);
    }
  };

  const openReopenModal = () => {
    if (!termDetail?.term) return;
    setModalError(null);
    setReopenForm({
      reason: '',
      newEndDate: termDetail.term.end_date,
    });
    setIsReopenModalOpen(true);
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    setModalError(null);
    if (reopenForm.reason.trim().length < 5) {
      setModalError(
        language === 'rw'
          ? 'Shyiramo impamvu y’ubugenzuzi (byibuze inyuguti 5).'
          : 'Please enter a clear audit reason (minimum 5 characters).'
      );
      return;
    }
    setIsReopeningTerm(true);
    try {
      const res = await api.post(`/inventory/terms/${selectedTermId}/reopen`, {
        reason: reopenForm.reason.trim(),
        newEndDate: reopenForm.newEndDate || undefined,
      });
      setNotice(res.data?.message || 'Term reopened for controlled administrative editing.');
      setIsReopenModalOpen(false);
      notifyBellRefresh();
      fetchTerms(true);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Kongera gufungura igihembwe byanze.' : 'Failed to reopen closed term.')
      );
    } finally {
      setIsReopeningTerm(false);
    }
  };

  const openDatesModal = () => {
    if (!termDetail?.term || termDetail.term.status === 'Closed') return;
    setModalError(null);
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
    setModalError(null);
    setErrorMsg(null);

    if (!datesForm.start_date || !datesForm.end_date) {
      setModalError(
        language === 'rw'
          ? 'Itariki itangira n’itariki isoza birakenewe.'
          : 'Both Opening Date and Closing Date are required.'
      );
      return;
    }
    if (datesForm.start_date >= datesForm.end_date) {
      setModalError(
        language === 'rw'
          ? 'Itariki itangira igomba kubanziriza itariki isoza.'
          : 'Opening Date must be strictly earlier than Closing Date.'
      );
      return;
    }

    setIsSavingDates(true);
    try {
      await api.put(`/inventory/terms/${selectedTermId}`, {
        name: datesForm.name.trim(),
        startDate: datesForm.start_date,
        endDate: datesForm.end_date,
      });
      setNotice(language === 'rw' ? 'Amatariki y’igihembwe yahinduwe neza.' : 'Term dates updated successfully.');
      setIsDatesModalOpen(false);
      notifyBellRefresh();
      fetchTerms(true);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Guhindura amatariki y’igihembwe byanze.' : 'Failed to update term dates.')
      );
    } finally {
      setIsSavingDates(false);
    }
  };

  const openCreateTermModal = () => {
    setModalError(null);
    const existingNums = new Set(terms.map((item) => item.term_number));
    const nextMissing = ([1, 2, 3].find((n) => !existingNums.has(n)) || 1) as 1 | 2 | 3;
    setCreateTermForm({
      academicYear,
      termNumber: String(nextMissing),
      name: `Term ${nextMissing}`,
      startDate: '',
      endDate: '',
    });
    setIsCreateTermModalOpen(true);
  };

  const handleCreateTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!createTermForm.startDate || !createTermForm.endDate) {
      setModalError(
        language === 'rw'
          ? 'Shyiramo itariki itangira n’isoza.'
          : 'Opening Date and Closing Date are required.'
      );
      return;
    }
    if (createTermForm.startDate >= createTermForm.endDate) {
      setModalError(
        language === 'rw'
          ? 'Itariki itangira igomba kubanziriza itariki isoza.'
          : 'Opening Date must precede Closing Date.'
      );
      return;
    }

    setIsCreatingTerm(true);
    try {
      const res = await api.post('/inventory/terms', {
        academicYear: createTermForm.academicYear,
        termNumber: Number(createTermForm.termNumber),
        name: createTermForm.name.trim() || `Term ${createTermForm.termNumber}`,
        startDate: createTermForm.startDate,
        endDate: createTermForm.endDate,
      });
      setNotice(res.data?.message || 'Academic term created successfully.');
      setIsCreateTermModalOpen(false);
      notifyBellRefresh();
      if (createTermForm.academicYear !== academicYear) {
        setAcademicYear(createTermForm.academicYear);
      } else {
        fetchTerms(true, res.data?.term?.id);
      }
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Gushyiraho igihembwe byanze.' : 'Failed to create academic term.')
      );
    } finally {
      setIsCreatingTerm(false);
    }
  };

  const openAdjustModal = (item: TermStockItem) => {
    setModalError(null);
    setAdjustForm({
      product_id: item.product_id,
      product_name: item.product_name,
      unit: item.unit,
      opening_stock: String(item.opening_stock),
      reason: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTermId) return;
    setModalError(null);
    const qty = parseFloat(adjustForm.opening_stock);
    if (isNaN(qty) || qty < 0) {
      setModalError(
        language === 'rw'
          ? 'Stock Itangira ntishobora kuba munsi ya zero.'
          : 'Opening stock quantity must be non-negative.'
      );
      return;
    }
    if (!adjustForm.reason || adjustForm.reason.trim().length < 5) {
      setModalError(
        language === 'rw'
          ? 'Impamvu y’ubugenzuzi (byibuze inyuguti 5) irakenewe.'
          : 'Mandatory audit justification reason (minimum 5 characters) is required.'
      );
      return;
    }

    setIsSavingAdjust(true);
    try {
      await api.put(`/inventory/terms/${selectedTermId}/opening-stock`, {
        product_id: adjustForm.product_id,
        opening_stock: qty,
        reason: adjustForm.reason,
      });
      setNotice(
        language === 'rw'
          ? 'Stock Itangira yahinduwe kandi yanditswe mu bugenzuzi.'
          : 'Opening stock adjusted and audit trail logged.'
      );
      setIsAdjustModalOpen(false);
      fetchTermDetail(selectedTermId);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Guhindura Stock Itangira byanze.' : 'Failed to adjust opening stock.')
      );
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const openInitYearModal = () => {
    setModalError(null);
    const initialMap: Record<number, string> = {};
    (termDetail?.items || []).forEach((item) => {
      initialMap[item.product_id] = String(item.opening_stock || 0);
    });
    setInitQuantities(initialMap);
    setInitReason('');
    setIsInitYearModalOpen(true);
  };

  const handleInitializeYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsInitializingYear(true);

    try {
      const payload: any = { academicYear };
      if (!yearMeta?.previousYearClosingReady) {
        payload.initialItems = Object.entries(initQuantities).map(([pid, val]) => ({
          productId: Number(pid),
          openingStock: Math.max(0, parseFloat(val || '0') || 0),
        }));
        payload.reason = initReason.trim() || `Initial opening stock setup for ${academicYear}`;
      }

      const res = await api.post('/inventory/terms/initialize-year', payload);
      setNotice(
        language === 'rw'
          ? `Stock Itangira y’umwaka wa ${academicYear} yatangijwe neza.`
          : res.data.message || `Opening stock initialized for ${academicYear}.`
      );
      setIsInitYearModalOpen(false);
      notifyBellRefresh();
      fetchTerms(true);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error ||
          (language === 'rw' ? 'Gutangiza umwaka w’amashuri byanze.' : 'Failed to initialize academic year.')
      );
    } finally {
      setIsInitializingYear(false);
    }
  };

  const activeTerm = termDetail?.term;
  const isSelectedClosed = activeTerm?.status === 'Closed';
  const canEditSelectedOpening = Boolean(
    canManageTerms &&
      activeTerm &&
      activeTerm.status !== 'Closed' &&
      !activeTerm.carried_from_term_id
  );
  const items = termDetail?.items || [];
  const summary = termDetail?.summary;
  const financialSummary = termDetail?.financialSummary;
  const stockInTx = termDetail?.transactions?.stock_in || [];
  const stockOutTx = termDetail?.transactions?.stock_out || [];

  const totalOpening = summary?.totalOpeningQuantity ?? items.reduce((s, i) => s + (i.opening_stock || 0), 0);
  const totalReceived = summary?.totalReceivedQuantity ?? items.reduce((s, i) => s + (i.received_quantity || 0), 0);
  const totalIssued = summary?.totalIssuedQuantity ?? items.reduce((s, i) => s + (i.issued_quantity || 0), 0);
  const totalClosing = summary?.totalClosingQuantity ?? items.reduce((s, i) => s + (i.closing_stock || 0), 0);

  // Unified chronological movements list for the Stock Movements History tab
  const unifiedMovements = useMemo(() => {
    const combined = [
      ...stockInTx.map((tx: any) => ({
        uid: `IN-${tx.id}`,
        type: 'IN' as const,
        date: tx.transaction_date,
        time: tx.time || '--:--',
        productName: tx.product_name,
        quantity: Number(tx.quantity),
        unit: tx.unit,
        unitCost: Number(tx.unit_cost) > 0 ? Number(tx.unit_cost) : null,
        totalValue: Number(tx.total_cost) > 0 ? Number(tx.total_cost) : null,
        partyOrPurpose: [tx.supplier_name, tx.notes].filter(Boolean).join(' · ') || '—',
        actor: tx.recorded_by_name || tx.staff_name || 'Staff',
      })),
      ...stockOutTx.map((tx: any) => ({
        uid: `OUT-${tx.id}`,
        type: 'OUT' as const,
        date: tx.transaction_date,
        time: tx.transaction_time || tx.time || '--:--',
        productName: tx.product_name,
        quantity: Number(tx.quantity),
        unit: tx.unit,
        unitCost: tx.unit_cost !== null && tx.unit_cost !== undefined && Number(tx.unit_cost) > 0 ? Number(tx.unit_cost) : null,
        totalValue: tx.total_cost !== null && tx.total_cost !== undefined && Number(tx.total_cost) > 0 ? Number(tx.total_cost) : null,
        partyOrPurpose: tx.notes || (language === 'rw' ? 'Igikoni cy’Ishuri' : 'School Kitchen'),
        actor: tx.issued_by_name || tx.staff_name || 'Staff',
      })),
    ];

    return combined
      .filter((m) => {
        if (movementTypeFilter !== 'ALL' && m.type !== movementTypeFilter) return false;
        if (movementProductFilter !== 'ALL' && m.productName !== movementProductFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) return b.date > a.date ? 1 : -1;
        return b.time > a.time ? 1 : -1;
      });
  }, [stockInTx, stockOutTx, movementTypeFilter, movementProductFilter, language]);

  const movementProductNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach((i) => names.add(i.product_name));
    stockInTx.forEach((tx: any) => tx.product_name && names.add(tx.product_name));
    stockOutTx.forEach((tx: any) => tx.product_name && names.add(tx.product_name));
    return Array.from(names).sort();
  }, [items, stockInTx, stockOutTx]);

  const formatMoney = (val: number | null | undefined) => {
    if (val === null || val === undefined) return t('costNotRecorded');
    return `${Math.round(val).toLocaleString()} RWF`;
  };

  const exportColumns = [
    { header: t('colProduct'), key: 'product_name' },
    { header: t('unit'), key: 'unit' },
    { header: t('openingStock'), key: 'opening_stock', format: (val: any) => Number(val).toFixed(1) },
    { header: t('receivedStock'), key: 'received_quantity', format: (val: any) => Number(val).toFixed(1) },
    { header: t('issuedStock'), key: 'issued_quantity', format: (val: any) => Number(val).toFixed(1) },
    { header: t('closingStock'), key: 'closing_stock', format: (val: any) => Number(val).toFixed(1) },
    {
      header: `${t('unitPriceCol')} (RWF)`,
      key: 'unit_cost',
      format: (val: any) => (val === null || val === undefined ? t('costNotRecorded') : Number(val).toLocaleString()),
    },
    {
      header: `${t('closingValueCol')} (RWF)`,
      key: 'closing_value',
      format: (val: any) => (val === null || val === undefined ? t('costNotRecorded') : Number(val).toLocaleString()),
    },
    { header: t('status'), key: 'stock_status' },
  ];

  const getTermLabel = (term: AcademicTerm) => {
    if (language === 'rw') {
      if (term.term_number === 1) return t('term1');
      if (term.term_number === 2) return t('term2');
      if (term.term_number === 3) return t('term3');
    }
    return term.name;
  };

  return (
    <div className="space-y-5 max-w-7xl animate-fadeIn">
      {/* Printable Official Term Closing Report Header */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-5">
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
            Institut Baptiste de Buberuka (IBB)
          </h1>
          <p className="text-xs text-slate-600">
            {t('republicOfRwanda')} — {t('ministryOfEducation')}
          </p>
          <h2 className="text-sm font-bold uppercase mt-2 text-slate-800">
            {t('termClosingReportTitle')}
          </h2>
        </div>

        {activeTerm && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs border border-slate-300 rounded-lg p-3 bg-slate-50">
            <div>
              <span className="text-slate-500 block">{t('academicYears')}:</span>
              <strong className="text-slate-900">{academicYear}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('termNameLabel')}:</span>
              <strong className="text-slate-900">{getTermLabel(activeTerm)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('termStatus')}:</span>
              <strong className="text-slate-900">{activeTerm.status}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('openingDateLabel')}:</span>
              <strong className="text-slate-900">{activeTerm.start_date}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('closingDateLabel')}:</span>
              <strong className="text-slate-900">{activeTerm.end_date}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('closedByLabel')}:</span>
              <strong className="text-slate-900">{activeTerm.closed_by_name || '—'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Header: Clean, Simple, Actionable */}
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#181D24] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2B3139]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-[#707A8A] uppercase">
              {t('academicYears')}:
            </span>
            <select
              aria-label={t('academicYears')}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-[#F0F3F6] focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-[#181D24]">
                  {yr.replace('-', ' – ')}
                </option>
              ))}
            </select>
          </div>

          {canManageTerms && terms.length < 3 && (
            <button
              onClick={openCreateTermModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createTermBtn')}</span>
            </button>
          )}

          <ExportControls
            title={`IBB Term Closing Report - ${activeTerm?.name || 'Term'} (${academicYear})`}
            data={items}
            columns={exportColumns}
            fileNamePrefix={`IBB_Term_Report_${academicYear}_${activeTerm?.name?.replace(/\s+/g, '_') || 'Term'}`}
          />
        </div>
      </div>

      {/* Page-level Feedback */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#16A34A] dark:text-[#0ECB81] flex items-center justify-between no-print animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center justify-between no-print animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Initialize Academic Year Opening Stock Banner */}
      {canManageTerms && yearMeta && yearMeta.canInitializeOpening && (
        <div className="rounded-xl p-4 border border-[#1769FF]/30 bg-[#EAF2FF] dark:bg-[#1769FF]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1769FF]/15 text-[#1769FF] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
                {t('initYearModalTitle')} ({academicYear})
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#A0AAB8] mt-0.5">
                {yearMeta.previousYearClosingReady ? t('initYearCarryForwardHint') : t('initYearManualHint')}
              </p>
            </div>
          </div>

          <button
            onClick={openInitYearModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {yearMeta.previousYearClosingReady
                ? `${t('carryForwardYearBtn')} (${yearMeta.previousAcademicYear})`
                : t('initializeYearBtn')}
            </span>
          </button>
        </div>
      )}

      {/* 3 Simple Academic Term Selector Cards */}
      {loading && terms.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
          {t('loadingData')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
          {terms.map((term) => {
            const isSelected = term.id === selectedTermId;
            const isActive = term.status === 'Active';
            const isClosed = term.status === 'Closed';
            const isUpcoming = term.status === 'Upcoming';

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
                    {academicYear}
                  </span>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ECB81]/15 text-[#16A34A] dark:text-[#0ECB81] border border-[#0ECB81]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#0ECB81] animate-pulse" />
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
                  <h3 className="text-base font-black text-slate-900 dark:text-[#F0F3F6] truncate">
                    {getTermLabel(term)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#707A8A] font-mono mt-0.5">
                    {term.start_date} → {term.end_date}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#252B33] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A0AAB8]">
                  <span className="truncate">
                    {term.carried_from_term_id
                      ? `${t('carriedForwardFromBadge')}: ${term.carried_from_year} ${term.carried_from_term_name}`
                      : term.term_number === 1
                      ? language === 'rw'
                        ? 'Stock Itangira y’Umwaka'
                        : 'Academic year baseline opening'
                      : language === 'rw'
                      ? `Itangira ← Igihembwe ${term.term_number - 1}`
                      : `Opening ← Term ${term.term_number - 1} Closing`}
                  </span>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#1769FF] dark:text-[#FCD535] shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Term Information & Management Strip */}
      {activeTerm && (
        <div className="rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#181D24] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 no-print">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-[#F0F3F6]">
                {academicYear} · {getTermLabel(activeTerm)}
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-[#A0AAB8]">
                ({activeTerm.start_date} → {activeTerm.end_date})
              </span>
              {activeTerm.carried_from_term_id && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0ECB81]/10 text-[#16A34A] dark:text-[#0ECB81] border border-[#0ECB81]/25">
                  {t('carriedForwardFromBadge')}: {activeTerm.carried_from_year} · {activeTerm.carried_from_term_name}
                </span>
              )}
            </div>

            {isSelectedClosed ? (
              <div className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-0.5">
                <p>
                  <strong>{t('closedAtLabel')}:</strong>{' '}
                  {activeTerm.closed_at ? activeTerm.closed_at.slice(0, 10) : activeTerm.end_date} ·{' '}
                  <strong>{t('closedByLabel')}:</strong> {activeTerm.closed_by_name || 'System'}
                </p>
                {activeTerm.closing_notes && (
                  <p className="text-[11px] text-slate-500 dark:text-[#707A8A]">
                    {t('notes')}: {activeTerm.closing_notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-[#A0AAB8]">
                {activeTerm.reopened_at
                  ? `${t('reopenedNoticePrefix')} ${activeTerm.reopened_by_name || 'Staff'} (${activeTerm.reopen_reason || ''})`
                  : activeTerm.status === 'Active'
                  ? language === 'rw'
                    ? 'Igihembwe gikora. Stock In na Stock Out zihita zivugurura ibisigaye.'
                    : 'Active school term. Stock In and Stock Out movements update balances automatically.'
                  : language === 'rw'
                  ? 'Igihembwe giteganyijwe. Stock Itangira izava ku gihembwe kibanziriza.'
                  : 'Upcoming term. Opening stock inherits automatically when the preceding term closes.'}
              </p>
            )}
          </div>

          {canManageTerms && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!isSelectedClosed ? (
                <>
                  <button
                    onClick={openDatesModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-slate-50 dark:bg-[#202630] hover:bg-slate-100 dark:hover:bg-[#262D38] border border-slate-200 dark:border-[#2B3139] rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('editTermDates')}</span>
                  </button>

                  {activeTerm.status === 'Upcoming' && (
                    <button
                      onClick={handleActivateTerm}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{t('setActiveTermBtn')}</span>
                    </button>
                  )}

                  {activeTerm.status === 'Active' && (
                    <button
                      onClick={() => {
                        setModalError(null);
                        setIsCloseModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('closeTermBtn')}</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={openReopenModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 dark:text-[#F0B90B] bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('reopenTermBtn')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ESSENTIAL 4-CARD STOCK SUMMARY: Opening Stock | Stock In | Stock Out | Closing Stock */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#181D24] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
            {t('openingBalanceCard')}
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums mt-1.5">
            {totalOpening.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            {items.length} {t('totalItemsTracked')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#181D24] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
            <span>{t('receivedStock')}</span>
            <ArrowDownLeft className="w-4 h-4 text-[#16A34A] dark:text-[#0ECB81]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#16A34A] dark:text-[#0ECB81] font-mono tabular-nums mt-1.5">
            +{totalReceived.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">{t('totalInHint')}</p>
        </div>

        <div className="bg-white dark:bg-[#181D24] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
            <span>{t('issuedStock')}</span>
            <ArrowUpRight className="w-4 h-4 text-[#D97706] dark:text-[#F0B90B]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#D97706] dark:text-[#F0B90B] font-mono tabular-nums mt-1.5">
            -{totalIssued.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">{t('totalOutHint')}</p>
        </div>

        <div className="bg-white dark:bg-[#181D24] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
            {t('closingBalanceCard')}
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1769FF] dark:text-[#FCD535] font-mono tabular-nums mt-1.5">
            {totalClosing.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg/L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A0AAB8] mt-1">
            {formatMoney(financialSummary?.totalClosingValue)}
          </p>
        </div>
      </div>

      {/* TRUTHFUL FINANCIAL SUMMARY SECTION */}
      {financialSummary && (
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />
              <span>{t('financialSummarySection')}</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {academicYear} · {activeTerm ? getTermLabel(activeTerm) : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#252B33]">
              <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block">
                {t('totalStockInValueLabel')}
              </span>
              <strong className="text-base font-black font-mono text-[#16A34A] dark:text-[#0ECB81] mt-0.5 block">
                {formatMoney(financialSummary.totalStockInValue)}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#252B33]">
              <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block">
                {t('totalStockOutValueLabel')}
              </span>
              <strong className="text-base font-black font-mono text-[#D97706] dark:text-[#F0B90B] mt-0.5 block">
                {formatMoney(financialSummary.totalStockOutValue)}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#252B33]">
              <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block">
                {t('totalClosingValueLabel')}
              </span>
              <strong className="text-base font-black font-mono text-slate-900 dark:text-[#F0F3F6] mt-0.5 block">
                {formatMoney(financialSummary.totalClosingValue)}
              </strong>
            </div>
          </div>

          {financialSummary.valuationStatus !== 'COMPLETE' && financialSummary.missingCostProducts.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-[#F0B90B] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('missingCostNotice')}</p>
                <p className="text-[11px] mt-1 font-mono">
                  {financialSummary.missingCostProducts.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SIMPLE 2-TAB WORKSPACE: Stock Ledger & Closing Report | Stock Movements History */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-[#252B33] px-6 pt-3 gap-6 no-print overflow-x-auto">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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

        {termLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            {t('loadingData')}
          </div>
        ) : (
          <>
            {/* TAB 1: STOCK LEDGER & CLOSING REPORT */}
            {activeTab === 'ledger' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#151921] border-b border-slate-200 dark:border-[#252B33] text-[11px] font-bold uppercase text-slate-500 dark:text-[#707A8A]">
                      <th className="py-3.5 px-4">{t('colProduct')}</th>
                      <th className="py-3.5 px-3">{t('unit')}</th>
                      <th className="py-3.5 px-3 text-right">{t('openingStock')}</th>
                      <th className="py-3.5 px-3 text-right text-[#16A34A] dark:text-[#0ECB81]">
                        {t('receivedStock')}
                      </th>
                      <th className="py-3.5 px-3 text-right text-[#D97706] dark:text-[#F0B90B]">
                        {t('issuedStock')}
                      </th>
                      <th className="py-3.5 px-3 text-right font-black">{t('closingStock')}</th>
                      <th className="py-3.5 px-3 text-right">{t('unitPriceCol')}</th>
                      <th className="py-3.5 px-4 text-right">{t('closingValueCol')}</th>
                      <th className="py-3.5 px-4 text-center">{t('status')}</th>
                      {canEditSelectedOpening && (
                        <th className="py-3.5 px-4 text-center no-print">{t('actions')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202630]">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#181D24]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                          {item.product_name}
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
                          {item.unit_cost !== null ? `${item.unit_cost.toLocaleString()} RWF` : t('costNotRecorded')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-[#F0F3F6]">
                          {item.closing_value !== null && item.closing_value !== undefined
                            ? `${item.closing_value.toLocaleString()} RWF`
                            : t('costNotRecorded')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.stock_status === 'OUT_OF_STOCK' && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D] border border-[#F6465D]/30">
                              {t('statusOutOfStock')}
                            </span>
                          )}
                          {item.stock_status === 'LOW_STOCK' && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B90B]/15 text-[#D97706] dark:text-[#F0B90B] border border-[#F0B90B]/30">
                              {t('statusLow')}
                            </span>
                          )}
                          {item.stock_status === 'NORMAL' && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0ECB81]/15 text-[#16A34A] dark:text-[#0ECB81] border border-[#0ECB81]/30">
                              {t('statusSufficient')}
                            </span>
                          )}
                        </td>

                        {canEditSelectedOpening && (
                          <td className="py-3 px-4 text-center no-print">
                            <button
                              onClick={() => openAdjustModal(item)}
                              title={t('adjustOpeningTitle')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#252B33] transition-colors cursor-pointer"
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
                          {t('emptyState')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: SIMPLE STOCK MOVEMENTS HISTORY WITH FOOD ITEM & IN/OUT FILTERS */}
            {activeTab === 'transactions' && (
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#11151B] p-3.5 rounded-xl border border-slate-200 dark:border-[#252B33]">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-[#A0AAB8]">
                    <Filter className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />
                    <span>{t('filterByFoodItem')}:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      aria-label={t('filterByFoodItem')}
                      value={movementProductFilter}
                      onChange={(e) => setMovementProductFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{t('allFoodItems')}</option>
                      {movementProductNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={t('transactionTypeFilter')}
                      value={movementTypeFilter}
                      onChange={(e) => setMovementTypeFilter(e.target.value as 'ALL' | 'IN' | 'OUT')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">{t('movementTypeAll')}</option>
                      <option value="IN">{t('typeStockInLabel')}</option>
                      <option value="OUT">{t('typeStockOutLabel')}</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-[#252B33] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#151921] border-b border-slate-200 dark:border-[#252B33] text-[11px] font-bold uppercase text-slate-500 dark:text-[#707A8A]">
                        <th className="py-3 px-4">{t('colTransactionDate')}</th>
                        <th className="py-3 px-4">{t('colProduct')}</th>
                        <th className="py-3 px-3">{t('colMovementType')}</th>
                        <th className="py-3 px-3 text-right">{t('quantity')}</th>
                        <th className="py-3 px-3 text-right">{t('unitPriceCol')}</th>
                        <th className="py-3 px-3 text-right">{t('total')}</th>
                        <th className="py-3 px-4">{t('partyOrPurposeCol')}</th>
                        <th className="py-3 px-4">{t('responsibleUser')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#202630]">
                      {unifiedMovements.map((m) => (
                        <tr key={m.uid} className="hover:bg-slate-50/50 dark:hover:bg-[#181D24]/50">
                          <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-[#A0AAB8] whitespace-nowrap">
                            {m.date} {m.time !== '--:--' ? `· ${m.time}` : ''}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                            {m.productName}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.type === 'IN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0ECB81]/15 text-[#16A34A] dark:text-[#0ECB81]">
                                <ArrowDownLeft className="w-3 h-3" />
                                IN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0B90B]/15 text-[#D97706] dark:text-[#F0B90B]">
                                <ArrowUpRight className="w-3 h-3" />
                                OUT
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                              m.type === 'IN'
                                ? 'text-[#16A34A] dark:text-[#0ECB81]'
                                : 'text-[#D97706] dark:text-[#F0B90B]'
                            }`}
                          >
                            {m.type === 'IN' ? '+' : '-'}
                            {m.quantity.toLocaleString()} {m.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-[#A0AAB8] whitespace-nowrap">
                            {m.unitCost !== null ? `${m.unitCost.toLocaleString()} RWF` : t('costNotRecorded')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#F0F3F6] whitespace-nowrap">
                            {m.totalValue !== null ? `${m.totalValue.toLocaleString()} RWF` : t('costNotRecorded')}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8] max-w-xs truncate">
                            {m.partyOrPurpose}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-[#A0AAB8] whitespace-nowrap">
                            {m.actor}
                          </td>
                        </tr>
                      ))}
                      {unifiedMovements.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            {t('emptyState')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Printable Signature Block */}
      <div className="hidden print:grid grid-cols-2 gap-12 pt-16 mt-12 border-t text-xs">
        <div>
          <p className="font-bold uppercase text-slate-800">
            {language === 'rw' ? 'Byateguwe & Byagenzuwe na:' : 'Prepared & Audited By:'}
          </p>
          <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
          <p className="mt-1 font-semibold text-slate-900">M. Niyongabo Emmanuel</p>
          <p className="text-[10px] text-slate-500">Chief Accountant — IBB Rwanda</p>
        </div>
        <div>
          <p className="font-bold uppercase text-slate-800">
            {language === 'rw' ? 'Byemejwe & Byashyizweho Ikirango na:' : 'Approved & Sealed By:'}
          </p>
          <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
          <p className="mt-1 font-semibold text-slate-900">Pr. Ntiharirabura Jean Bosco</p>
          <p className="text-[10px] text-slate-500">School Director — IBB Rwanda</p>
        </div>
      </div>

      {/* MODAL 1: CLOSE TERM & CARRY-FORWARD STOCK */}
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseTermSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-[#F0B90B] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{language === 'rw' ? 'Amabwiriza yo Gusoza Igihembwe' : 'Important Term Closing Policy'}</span>
                </div>
                <p className="leading-relaxed">{t('carryForwardExplanation')}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-[#A0AAB8] uppercase block">
                  {t('closingStock')} — {getTermLabel(activeTerm)}:
                </span>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-[#252B33] rounded-lg p-2 space-y-1 bg-slate-50 dark:bg-[#11151B] text-xs">
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-[#202630] last:border-0"
                    >
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
                  {t('notes')} ({language === 'rw' ? 'Si ngombwa' : 'Optional'})
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={
                    language === 'rw'
                      ? 'Urugero: Ibarura ryo gusoza igihembwe ryarangiye neza.'
                      : 'e.g. End of term inventory audit complete.'
                  }
                  className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isClosingTerm}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isClosingTerm ? t('loadingData') : t('closeTermBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TERM DATES */}
      {isDatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                {t('editTermDates')}
              </h3>
              <button
                onClick={() => setIsDatesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDates} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('termNameLabel')} *
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
                    {t('openingDateLabel')} *
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
                    {t('closingDateLabel')} *
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingDates}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  {isSavingDates ? t('loadingData') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2b: REOPEN CLOSED TERM (CONTROLLED) */}
      {isReopenModalOpen && activeTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-[#F0B90B]">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                  {t('reopenTermModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-[#F0B90B]">
                {t('reopenTermWarning')}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('extendClosingDateOptional')}
                </label>
                <input
                  type="date"
                  value={reopenForm.newEndDate}
                  onChange={(e) => setReopenForm({ ...reopenForm, newEndDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('reopenReasonLabel')}
                </label>
                <textarea
                  rows={2}
                  value={reopenForm.reason}
                  onChange={(e) => setReopenForm({ ...reopenForm, reason: e.target.value })}
                  placeholder={t('reopenReasonPlaceholder')}
                  required
                  className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isReopeningTerm}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#e5a910] disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isReopeningTerm ? t('loadingData') : t('reopenTermBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2c: CREATE ACADEMIC TERM */}
      {isCreateTermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                {t('createTermModalTitle')}
              </h3>
              <button
                onClick={() => setIsCreateTermModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTermSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {t('academicYears')} *
                  </label>
                  <select
                    value={createTermForm.academicYear}
                    onChange={(e) => setCreateTermForm({ ...createTermForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {t('termNumberLabel')} *
                  </label>
                  <select
                    value={createTermForm.termNumber}
                    onChange={(e) =>
                      setCreateTermForm({
                        ...createTermForm,
                        termNumber: e.target.value,
                        name: `Term ${e.target.value}`,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('termNameLabel')} *
                </label>
                <input
                  type="text"
                  value={createTermForm.name}
                  onChange={(e) => setCreateTermForm({ ...createTermForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {t('openingDateLabel')} *
                  </label>
                  <input
                    type="date"
                    value={createTermForm.startDate}
                    onChange={(e) => setCreateTermForm({ ...createTermForm, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {t('closingDateLabel')} *
                  </label>
                  <input
                    type="date"
                    value={createTermForm.endDate}
                    onChange={(e) => setCreateTermForm({ ...createTermForm, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTermModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTerm}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  {isCreatingTerm ? t('loadingData') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST OPENING STOCK (AUDITED) */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                {t('adjustOpeningTitle')}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="text-xs font-bold text-[#1769FF] dark:text-[#FCD535]">
                {adjustForm.product_name} ({adjustForm.unit})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('openingStock')} *
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
                  {language === 'rw' ? 'Impamvu y’Ubugenzuzi *' : 'Mandatory Audit Justification *'}
                </label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder={
                    language === 'rw'
                      ? 'Urugero: Ibarura rusange ryo ku itangira ry’igihembwe'
                      : 'e.g. Physical stock take reconciliation'
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjust}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  {isSavingAdjust ? t('loadingData') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INITIALIZE ACADEMIC YEAR / CARRY FORWARD */}
      {isInitYearModalOpen && yearMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1769FF] dark:text-[#FCD535]">
                <CalendarRange className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-[#F0F3F6]">
                  {t('initYearModalTitle')} ({academicYear})
                </h3>
              </div>
              <button
                onClick={() => setIsInitYearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitializeYearSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{modalError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#EAF2FF] dark:bg-[#1769FF]/15 border border-[#CBDCFD] dark:border-[#1769FF]/30 text-xs text-[#172033] dark:text-[#C5D0DE]">
                {yearMeta.previousYearClosingReady ? (
                  <p className="font-semibold">
                    {t('initYearCarryForwardHint')} ({yearMeta.previousAcademicYear} · {t('term3')} → {academicYear} ·{' '}
                    {t('term1')})
                  </p>
                ) : (
                  <p className="font-semibold">{t('initYearManualHint')}</p>
                )}
              </div>

              {!yearMeta.previousYearClosingReady && (
                <>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-[#252B33] rounded-xl divide-y divide-slate-100 dark:divide-[#202630] bg-slate-50 dark:bg-[#11151B]">
                    {items.map((item) => (
                      <div key={item.product_id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-[#F0F3F6] truncate">
                          {item.product_name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={initQuantities[item.product_id] ?? '0'}
                            onChange={(e) =>
                              setInitQuantities((prev) => ({
                                ...prev,
                                [item.product_id]: e.target.value,
                              }))
                            }
                            className="w-24 px-2.5 py-1 text-right font-mono rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                          />
                          <span className="text-[11px] font-mono text-slate-400 w-7">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                      {t('notes')}
                    </label>
                    <input
                      type="text"
                      value={initReason}
                      onChange={(e) => setInitReason(e.target.value)}
                      placeholder={
                        language === 'rw'
                          ? `Urugero: Itangira ry’umwaka wa ${academicYear}`
                          : `e.g. Initial stock setup for ${academicYear}`
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6]"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInitYearModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-lg cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isInitializingYear}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1769FF] hover:bg-[#1258d4] disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {isInitializingYear
                      ? t('loadingData')
                      : yearMeta.previousYearClosingReady
                      ? t('carryForwardYearBtn')
                      : t('initializeYearBtn')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
