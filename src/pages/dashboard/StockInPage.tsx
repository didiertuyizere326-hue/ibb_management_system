import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product, Supplier, ActiveTermResponse } from '../../types';
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck
} from 'lucide-react';

export const StockInPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [termInfo, setTermInfo] = useState<ActiveTermResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    unitCost: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, suppRes, termRes, txRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/suppliers'),
        api.get('/inventory/active-term'),
        api.get('/inventory/transactions', { params: { type: 'IN' } }),
      ]);
      const prodList: Product[] = prodRes.data?.products || [];
      const suppList: Supplier[] = suppRes.data?.suppliers?.filter((s: Supplier) => s.is_active === 1) || [];
      setProducts(prodList);
      setSuppliers(suppList);
      setTermInfo(termRes.data || null);
      setRecentTransactions(txRes.data?.transactions?.slice(0, 8) || []);

      setFormData((prev) => ({
        ...prev,
        productId: prev.productId || (prodList.length > 0 ? String(prodList[0].id) : ''),
        unitCost: prev.unitCost || (prodList.length > 0 ? String(prodList[0].avg_unit_cost || '') : ''),
        supplierId: prev.supplierId || (suppList.length > 0 ? String(suppList[0].id) : ''),
        transactionDate: termRes.data?.kigaliDate || prev.transactionDate,
      }));
    } catch (err) {
      console.error('Failed to load stock in data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(formData.productId));
  const qty = parseFloat(formData.quantity) || 0;
  const cost = parseFloat(formData.unitCost) || 0;
  const totalCost = qty * cost;
  const activeTerm = termInfo?.activeTerm || null;
  const hasActiveTerm = Boolean(activeTerm && activeTerm.status === 'Active');

  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => String(p.id) === productId);
    setFormData({
      ...formData,
      productId,
      unitCost: prod ? String(prod.avg_unit_cost) : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);

    if (!hasActiveTerm || !activeTerm) {
      setErrorMsg(t('noActiveTermNotice'));
      return;
    }

    if (!formData.productId || !formData.supplierId || qty <= 0) {
      setErrorMsg(
        language === 'rw'
          ? 'Hitamo ikiribwa, umugemuzi, kandi ushyiremo ingano nyayo irenga zero.'
          : 'Please select a product, supplier, and enter a positive quantity.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/inventory/stock-in', {
        ...formData,
        termId: activeTerm.id,
      });
      setNotice(
        language === 'rw' ? 'Ibyinjijwe mu bubiko byanditswe neza.' : res.data.message
      );
      setFormData((prev) => ({
        ...prev,
        quantity: '',
        notes: '',
      }));
      fetchData();
      window.dispatchEvent(new CustomEvent('ibb:notifications-updated'));
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          (language === 'rw' ? 'Kwandika ibyinjijwe mu bubiko byanze.' : 'Failed to record Stock In.')
      );
      window.dispatchEvent(new CustomEvent('ibb:notifications-updated'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight flex items-center gap-2">
          <ArrowDownLeft className="w-6 h-6 text-[#0ECB81]" />
          <span>{t('recordStockInHeading')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
          {t('recordStockInSubheading')}
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#16A34A] dark:text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* ACTIVE ACADEMIC TERM BANNER */}
      <div
        className={`rounded-xl p-4 sm:p-5 border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          hasActiveTerm
            ? 'bg-[#EAF2FF] dark:bg-[#1769FF]/15 border-[#CBDCFD] dark:border-[#1769FF]/30 text-slate-900 dark:text-[#F0F3F6]'
            : 'bg-rose-50 dark:bg-[#F6465D]/10 border-rose-200 dark:border-[#F6465D]/30 text-slate-900 dark:text-[#F0F3F6]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasActiveTerm
                ? 'bg-[#1769FF]/15 text-[#1769FF] dark:text-[#38BDF8]'
                : 'bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D]'
            }`}
          >
            {hasActiveTerm ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div className="space-y-0.5">
            <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#1769FF] dark:text-[#38BDF8]">
              {hasActiveTerm ? t('activeTermAuthorizationTitle') : t('termClosed')}
            </span>
            {hasActiveTerm && activeTerm ? (
              <p className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6]">
                {activeTerm.academic_year} · {activeTerm.name} ({activeTerm.start_date} → {activeTerm.end_date}) · {user?.role}
              </p>
            ) : (
              <p className="text-xs font-semibold text-[#DC2626] dark:text-[#F6465D]">
                {t('noActiveTermNotice')}
              </p>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] shrink-0 text-right">
          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] block uppercase font-mono">
            {t('kigaliTime')}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
            {termInfo?.kigaliTime || '--:--'} CAT
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM CARD */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181D24] rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('selectFoodProduct')}
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('selectSupplierPrompt')}
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('quantityReceivedLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 500"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 dark:text-[#707A8A] font-semibold">
                    {selectedProduct?.unit || 'unit'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('unitPurchasePrice')}
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  placeholder="e.g. 1400"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('deliveryDateLabel')}
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  min={activeTerm?.start_date}
                  max={activeTerm?.end_date}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-[#A0AAB8] font-medium">
                {t('calculatedInvoiceLabel')}
              </span>
              <span className="text-lg font-black text-[#16A34A] dark:text-[#0ECB81] font-mono tabular-nums">
                RWF {Math.round(totalCost).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                {t('deliveryBatchInvoice')}
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('deliveryNotesPlaceholder')}
                className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !hasActiveTerm || loading || qty <= 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? t('recordingInflowBtn') : t('recordStockInSubmitBtn')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SUMMARY / INSTRUCTIONS CARD */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-6 border border-slate-200 dark:border-[#2B3139] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6]">
            {t('procurementProtocolTitle')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            {t('procurementProtocolDesc')}
          </p>

          <div className="p-3.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-xs text-[#1769FF] dark:text-[#38BDF8] space-y-1">
            <strong>{t('formulaEnforcedLabel')}</strong>
            <p className="font-mono text-[11px]">
              {t('closingStock')} = {t('openingStock')} + {t('receivedStock')} − {t('issuedStock')}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-900 dark:text-[#F0F3F6] block">
              {t('recentProcurementsLabel')}
            </span>
            <div className="space-y-2 text-xs">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-[#707A8A] py-4 text-center">
                  {t('emptyState')}
                </p>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex justify-between items-center gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block truncate">
                        {tx.product_name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono block truncate">
                        {tx.party_name} · {tx.date}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-[#16A34A] dark:text-[#0ECB81] shrink-0">
                      +{tx.quantity} {tx.unit}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
