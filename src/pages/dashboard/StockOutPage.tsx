import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product, ActiveTermResponse } from '../../types';
import {
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  Lock,
  ShieldCheck
} from 'lucide-react';

export const StockOutPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [termInfo, setTermInfo] = useState<ActiveTermResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [recentStockOuts, setRecentStockOuts] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, termRes, txRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/active-term'),
        api.get('/inventory/transactions', { params: { type: 'OUT' } }),
      ]);
      const prodList: Product[] = prodRes.data?.products || [];
      setProducts(prodList);
      setTermInfo(termRes.data || null);
      setRecentStockOuts(txRes.data?.transactions?.slice(0, 6) || []);

      setFormData((prev) => ({
        ...prev,
        productId: prev.productId || (prodList.length > 0 ? String(prodList[0].id) : ''),
        transactionDate: termRes.data?.kigaliDate || prev.transactionDate,
      }));
    } catch (err) {
      console.error('Failed to load stock out data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(formData.productId));
  const qty = parseFloat(formData.quantity) || 0;
  const activeTerm = termInfo?.activeTerm || null;
  const hasActiveTerm = Boolean(activeTerm && activeTerm.status === 'Active');
  const isInsufficient = Boolean(selectedProduct && qty > selectedProduct.current_stock);
  const canSubmit = Boolean(hasActiveTerm && selectedProduct && qty > 0 && !isInsufficient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);

    if (!hasActiveTerm || !activeTerm) {
      setErrorMsg(t('noActiveTermNotice'));
      return;
    }

    if (!formData.productId || qty <= 0) {
      setErrorMsg(
        language === 'rw'
          ? 'Hitamo ikiribwa kandi ushyiremo ingano irenga zero.'
          : 'Please select a food product and enter a positive quantity.'
      );
      return;
    }

    if (selectedProduct && selectedProduct.current_stock < qty) {
      setErrorMsg(
        language === 'rw'
          ? `Ububiko budahagije! Wasabye ${qty} ${selectedProduct.unit}, ariko hasigaye ${selectedProduct.current_stock} ${selectedProduct.unit} gusa.`
          : `Insufficient Stock! Requested: ${qty} ${selectedProduct.unit}, but only ${selectedProduct.current_stock} ${selectedProduct.unit} available. Negative stock is strictly prohibited.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/inventory/stock-out', {
        productId: formData.productId,
        quantity: qty,
        transactionDate: formData.transactionDate,
        notes: formData.notes,
        termId: activeTerm.id,
      });
      setNotice(
        language === 'rw'
          ? 'Ibiribwa byasohowe neza kandi byavanywe mu bubiko.'
          : res.data.message || 'Daily stock out ration issued successfully.'
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
          (language === 'rw' ? 'Kwandika ibisohoka mu bubiko byanze.' : 'Failed to record Stock Out.')
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
          <ArrowUpRight className="w-6 h-6 text-[#F0B90B]" />
          <span>{t('dailyStockOutHeading')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
          {t('dailyStockOutSubheading')}
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

      {/* ACTIVE ACADEMIC TERM STATUS BANNER */}
      <div
        className={`rounded-xl p-5 border shadow-xs transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          hasActiveTerm
            ? 'bg-[#EAF2FF] dark:bg-[#1769FF]/15 border-[#CBDCFD] dark:border-[#1769FF]/30 text-slate-900 dark:text-[#F0F3F6]'
            : 'bg-rose-50 dark:bg-[#F6465D]/10 border-rose-200 dark:border-[#F6465D]/30 text-slate-900 dark:text-[#F0F3F6]'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
              hasActiveTerm
                ? 'bg-[#1769FF]/15 text-[#1769FF] dark:text-[#38BDF8]'
                : 'bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D]'
            }`}
          >
            {hasActiveTerm ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                hasActiveTerm
                  ? 'bg-[#1769FF]/15 text-[#1769FF] dark:text-[#38BDF8]'
                  : 'bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D]'
              }`}
            >
              {hasActiveTerm ? t('activeTermAuthorizationTitle') : t('termClosed')}
            </span>

            {hasActiveTerm && activeTerm ? (
              <>
                <p className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6]">
                  {activeTerm.academic_year} · {activeTerm.name} ({activeTerm.start_date} → {activeTerm.end_date})
                </p>
                <span className="text-[11px] text-slate-600 dark:text-[#A0AAB8] font-mono block">
                  {language === 'rw' ? 'Urwego rw’umukozi' : 'Active Role'}:{' '}
                  <strong className="text-slate-900 dark:text-[#F0F3F6]">{user?.role}</strong> ·{' '}
                  {language === 'rw'
                    ? 'Uburenganzira busesuye bwo gusohora ibiribwa burafunguye'
                    : 'Full Stock Out authorization active'}
                </span>
              </>
            ) : (
              <p className="text-xs font-semibold text-[#DC2626] dark:text-[#F6465D]">
                {t('noActiveTermNotice')}
              </p>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] shrink-0 text-right">
          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] block uppercase font-mono">
            {t('kigaliTime')}
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
            {termInfo?.kigaliTime || '--:--'} CAT
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STOCK OUT FORM */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181D24] rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  {t('productToIssueLabel')}
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
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
                  {t('quantityToReleaseLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={selectedProduct?.current_stock || 999999}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 150"
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
                  {t('date')} *
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

            {/* Current Balance Bar */}
            {selectedProduct && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-[#707A8A] block text-[10px]">
                    {t('currentReserveLabel')}
                  </span>
                  <strong className="text-slate-900 dark:text-[#F0F3F6] font-mono">
                    {selectedProduct.current_stock} {selectedProduct.unit}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-[#707A8A] block text-[10px]">
                    {t('balanceAfterLabel')}
                  </span>
                  <strong
                    className={`font-mono ${
                      selectedProduct.current_stock - qty < 0
                        ? 'text-[#DC2626] dark:text-[#F6465D]'
                        : 'text-[#16A34A] dark:text-[#0ECB81]'
                    }`}
                  >
                    {(selectedProduct.current_stock - qty).toFixed(1)} {selectedProduct.unit}
                  </strong>
                </div>
              </div>
            )}

            {isInsufficient && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] font-semibold">
                {t('insufficientStockAlert')}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                {t('rationNotesLabel')}
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('rationNotesPlaceholder')}
                className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {!hasActiveTerm && (
                <span className="text-[11px] text-[#DC2626] dark:text-[#F6465D] flex items-center gap-1 font-mono font-medium">
                  <CalendarRange className="w-3.5 h-3.5" />
                  <span>{t('termClosed')}</span>
                </span>
              )}

              <button
                type="submit"
                disabled={submitting || !canSubmit || loading}
                className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#F0B90B] hover:bg-[#d9a508] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? t('recordingIssueBtn') : t('recordStockOutSubmitBtn')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RECENT ISSUES CARD */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-6 border border-slate-200 dark:border-[#2B3139] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6]">
            {t('recentReleasesTitle')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            {t('recentReleasesDesc')}
          </p>

          <div className="space-y-2 pt-2">
            {recentStockOuts.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-[#707A8A] py-4 text-center">
                {t('emptyState')}
              </p>
            ) : (
              recentStockOuts.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex justify-between items-center gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block text-xs truncate">
                      {tx.product_name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono block truncate">
                      {tx.time} · {tx.date}
                      {tx.recorded_by_name ? ` · ${tx.recorded_by_name}` : ''}
                    </span>
                  </div>
                  <div className="text-right font-mono font-bold text-[#D97706] dark:text-[#F0B90B] text-xs shrink-0">
                    -{tx.quantity} {tx.unit}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
