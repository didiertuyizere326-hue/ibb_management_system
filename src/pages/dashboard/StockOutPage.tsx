import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product, ScheduleStatus } from '../../types';
import {
  ArrowUpRight,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldAlert,
  Info
} from 'lucide-react';

export const StockOutPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    isEmergencyOverride: false,
    overrideReason: '',
  });

  const [recentStockOuts, setRecentStockOuts] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, schRes, txRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/schedule-status'),
        api.get('/inventory/transactions', { params: { type: 'OUT' } }),
      ]);
      setProducts(prodRes.data?.products || []);
      setScheduleStatus(schRes.data);
      setRecentStockOuts(txRes.data?.transactions?.slice(0, 6) || []);

      if (prodRes.data?.products?.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: String(prodRes.data.products[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load stock out data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll schedule status every 10 seconds to auto-enable button when authorized window opens!
    const interval = setInterval(async () => {
      try {
        const schRes = await api.get('/inventory/schedule-status');
        setScheduleStatus(schRes.data);
      } catch {
        // quiet
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(formData.productId));
  const qty = parseFloat(formData.quantity) || 0;
  const isDirector = user?.role === 'DIRECTOR';

  // Authorization Evaluation
  const isAuthorizedPeriod = scheduleStatus?.isPermitted === true;
  const canSubmit = isAuthorizedPeriod || (isDirector && formData.isEmergencyOverride);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);

    if (!formData.productId || qty <= 0) {
      setErrorMsg('Please select a food product and enter a valid quantity.');
      return;
    }

    // Negative stock prevention check
    if (selectedProduct && selectedProduct.current_stock < qty) {
      setErrorMsg(
        `Insufficient Stock! Requested: ${qty} ${selectedProduct.unit}, but only ${selectedProduct.current_stock} ${selectedProduct.unit} available. Negative stock is strictly prohibited.`
      );
      return;
    }

    if (!isAuthorizedPeriod && !formData.isEmergencyOverride) {
      setErrorMsg(scheduleStatus?.reason || 'Stock Out is currently locked outside Director-authorized hours.');
      return;
    }

    if (formData.isEmergencyOverride && (!formData.overrideReason || formData.overrideReason.length < 5)) {
      setErrorMsg('A detailed justification is mandatory for emergency off-schedule stock release.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/inventory/stock-out', formData);
      setNotice(res.data.message);
      setFormData({
        ...formData,
        quantity: '',
        notes: '',
        isEmergencyOverride: false,
        overrideReason: '',
      });
      fetchData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to record Stock Out.');
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
          <span>Food Reserves & Daily Stock Out</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
          Animator module for issuing daily kitchen rations under Director-controlled working hours (Africa/Kigali).
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-[#F6465D]/15 border border-[#F6465D]/30 text-xs text-[#F6465D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* SCHEDULE RESTRICTION INDICATOR CARD */}
      <div className={`rounded-xl p-5 border shadow-xs transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isAuthorizedPeriod
          ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30 text-slate-900 dark:text-[#F0F3F6]'
          : 'bg-[#F0B90B]/10 border-[#F0B90B]/30 text-slate-900 dark:text-[#F0F3F6]'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
            isAuthorizedPeriod
              ? 'bg-[#0ECB81]/20 text-[#0ECB81]'
              : 'bg-[#F0B90B]/20 text-[#F0B90B]'
          }`}>
            {isAuthorizedPeriod ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              isAuthorizedPeriod
                ? 'bg-[#0ECB81]/20 text-[#0ECB81]'
                : 'bg-[#F0B90B]/20 text-[#F0B90B]'
            }`}>
              {isAuthorizedPeriod ? 'KITCHEN DISPATCH WINDOW OPEN' : 'DISPATCH CURRENTLY LOCKED'}
            </span>

            <p className="text-xs font-semibold">
              {scheduleStatus?.reason || 'Verifying Africa/Kigali server schedule...'}
            </p>
            {!isAuthorizedPeriod && scheduleStatus?.nextOpeningTime && (
              <span className="text-[11px] text-slate-500 dark:text-[#A0AAB8] font-mono block">
                Next scheduled opening: <strong className="text-slate-900 dark:text-[#F0F3F6]">{scheduleStatus.nextOpeningTime}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] shrink-0 text-right">
          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] block uppercase font-mono">Server Time</span>
          <span className="text-lg font-bold text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
            {scheduleStatus?.kigaliTime || '00:00'} CAT
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STOCK OUT FORM (Level 3 Surface) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181D24] rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  Food Product to Issue *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Available: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  Quantity to Release *
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
            </div>

            {/* Current Balance Bar (Binance Level 4 Accent Strip) */}
            {selectedProduct && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-[#707A8A] block text-[10px]">Current Available Reserve:</span>
                  <strong className="text-slate-900 dark:text-[#F0F3F6] font-mono">
                    {selectedProduct.current_stock} {selectedProduct.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-[#707A8A] block text-[10px]">Balance After Release:</span>
                  <strong className={`font-mono ${selectedProduct.current_stock - qty < 0 ? 'text-[#F6465D]' : 'text-[#0ECB81]'}`}>
                    {(selectedProduct.current_stock - qty).toFixed(1)} {selectedProduct.unit}
                  </strong>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                Ration Notes / Meal Purpose
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Breakfast porridge preparation for 420 students"
                className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              />
            </div>

            {/* EMERGENCY OVERRIDE SECTION (DIRECTOR ONLY) */}
            {!isAuthorizedPeriod && isDirector && (
              <div className="p-4 rounded-xl border border-[#F6465D]/30 bg-[#F6465D]/10 space-y-3">
                <div className="flex items-center gap-2 text-[#F6465D] font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Director Emergency Schedule Override</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  As Director, you have authority to release stock outside authorized working hours in cases of emergency kitchen requirements. Every override is permanently logged in system audit trails.
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEmergencyOverride}
                    onChange={(e) => setFormData({ ...formData, isEmergencyOverride: e.target.checked })}
                    className="w-4 h-4 rounded text-[#F6465D] focus:ring-[#F6465D]"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6]">
                    Authorize Emergency Release
                  </span>
                </label>

                {formData.isEmergencyOverride && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#F6465D] mb-1">
                      Mandatory Justification Reason *
                    </label>
                    <input
                      type="text"
                      value={formData.overrideReason}
                      onChange={(e) => setFormData({ ...formData, overrideReason: e.target.value })}
                      placeholder="e.g. Late weekend sports tournament dinner preparation"
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#11151B] border border-[#F6465D]/40 text-slate-900 dark:text-[#F0F3F6] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex items-center justify-between">
              {!isAuthorizedPeriod && !isDirector && (
                <span className="text-[11px] text-[#F0B90B] flex items-center gap-1 font-mono font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked outside authorized hours</span>
                </span>
              )}

              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#F0B90B] hover:bg-[#d9a508] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? 'Recording Issue...' : 'Release Daily Stock Out'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* RECENT ISSUES CARD (Level 3 Surface) */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-6 border border-slate-200 dark:border-[#2B3139] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6]">
            Recent Kitchen Releases
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            Animator records are timestamped in Africa/Kigali time and deducted immediately from student dining supplies.
          </p>

          <div className="space-y-2 pt-2">
            {recentStockOuts.map((tx) => (
              <div key={tx.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block text-xs">{tx.product_name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">{tx.time} · {tx.date}</span>
                </div>
                <div className="text-right font-mono font-bold text-[#F0B90B] text-xs">
                  -{tx.quantity} {tx.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
