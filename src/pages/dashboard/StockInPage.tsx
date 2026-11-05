import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Product, Supplier } from '../../types';
import { ArrowDownLeft, Plus, CheckCircle2, AlertCircle, Calendar, Truck, DollarSign, Layers } from 'lucide-react';

export const StockInPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
      const [prodRes, suppRes, txRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/suppliers'),
        api.get('/inventory/transactions', { params: { type: 'IN' } }),
      ]);
      setProducts(prodRes.data?.products || []);
      setSuppliers(suppRes.data?.suppliers?.filter((s: Supplier) => s.is_active === 1) || []);
      setRecentTransactions(txRes.data?.transactions?.slice(0, 8) || []);

      if (prodRes.data?.products?.length > 0 && !formData.productId) {
        setFormData((prev) => ({
          ...prev,
          productId: String(prodRes.data.products[0].id),
          unitCost: String(prodRes.data.products[0].avg_unit_cost || ''),
        }));
      }
      if (suppRes.data?.suppliers?.length > 0 && !formData.supplierId) {
        setFormData((prev) => ({ ...prev, supplierId: String(suppRes.data.suppliers[0].id) }));
      }
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

    if (!formData.productId || !formData.supplierId || qty <= 0) {
      setErrorMsg(language === 'rw' ? 'Hitamo ikiribwa, umugemuzi, kandi ushyiremo ingano nyayo.' : 'Please select a product, supplier, and enter a valid quantity.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/inventory/stock-in', formData);
      setNotice(language === 'rw' ? 'Ibyinjijwe mu bubiko byanditswe neza.' : res.data.message);
      setFormData({
        ...formData,
        quantity: '',
        notes: '',
      });
      fetchData();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (language === 'rw' ? 'Kwandika ibyinjijwe mu bubiko byanze.' : 'Failed to record Stock In.'));
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM CARD (Level 3 Surface) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181D24] rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-[#2B3139] shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  Food Product to Stock *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Cur: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                  Supplying Vendor *
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
                  Quantity Delivered *
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
                  Unit Cost (RWF)
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
                  Delivery Date *
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>
            </div>

            {/* Total Cost Display (Binance Level 4 Accent Strip) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-[#A0AAB8] font-medium">Calculated Procurement Invoice:</span>
              <span className="text-lg font-black text-[#0ECB81] font-mono tabular-nums">
                RWF {Math.round(totalCost).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                Delivery Notes / Invoice Reference
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Term 1 bulk delivery, supplier receipt #REC-8921"
                className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] disabled:opacity-50 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{submitting ? 'Recording Inflow...' : 'Confirm Stock In Delivery'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* SUMMARY / INSTRUCTIONS CARD (Level 3 Surface) */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-6 border border-slate-200 dark:border-[#2B3139] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6]">
            Procurement Ledger Protocol
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
            Every recorded Stock In immediately updates physical food reserves in the database and recalculates the weighted average cost for institutional balance sheets.
          </p>

          <div className="p-3.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-xs text-[#3B82F6] dark:text-[#38BDF8] space-y-1">
            <strong>Formula Enforced:</strong>
            <p className="font-mono text-[11px]">Available Qty = Cumulative In − Cumulative Out</p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-900 dark:text-[#F0F3F6] block">
              Recent Procurements:
            </span>
            <div className="space-y-2 text-xs">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block">{tx.product_name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">{tx.party_name} · {tx.date}</span>
                  </div>
                  <div className="text-right font-mono font-bold text-[#0ECB81]">
                    +{tx.quantity} {tx.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
