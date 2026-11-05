import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import { StockRemainingOverview } from '../../components/common/StockRemainingOverview';
import {
  Package,
  Plus,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  TrendingDown,
  Layers,
  X,
  Search,
  Filter
} from 'lucide-react';

export const FoodInventoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [valuationData, setValuationData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Grains & Cereals',
    unit: 'kg',
    minStockAlert: 50,
    avgUnitCost: 1000,
    referenceQuantity: 500,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [prodRes, valRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/valuation'),
      ]);
      setProducts(prodRes.data?.products || []);
      setValuationData(valRes.data?.summary || null);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Grains & Cereals',
      unit: 'kg',
      minStockAlert: 50,
      avgUnitCost: 1000,
      referenceQuantity: 500,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      minStockAlert: product.min_stock_alert,
      avgUnitCost: product.avg_unit_cost,
      referenceQuantity: product.reference_quantity || product.current_stock || 500,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}`, formData);
        setNotice(`Product "${formData.name}" updated successfully.`);
      } else {
        await api.post('/inventory/products', formData);
        setNotice(`Product "${formData.name}" added to inventory.`);
      }
      setIsModalOpen(false);
      fetchInventory();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save product.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const exportColumns = [
    { header: 'Product Name', key: 'name' },
    { header: 'Category', key: 'category' },
    { header: 'Unit', key: 'unit' },
    { header: 'Current Stock', key: 'current_stock' },
    { header: 'Alert Threshold', key: 'min_stock_alert' },
    { header: 'Avg Unit Cost (RWF)', key: 'avg_unit_cost' },
    { header: 'Total Value (RWF)', key: 'total_value', format: (val: number) => `RWF ${Math.round(val || 0).toLocaleString()}` },
    { header: 'Stock Status', key: 'is_low_stock', format: (val: number) => val === 1 ? 'LOW STOCK' : 'HEALTHY' },
  ];

  const canManageProducts = user?.role === 'DIRECTOR' || user?.role === 'ACCOUNTANT';

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('inventoryValuationHeading')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
              {language === 'rw' ? 'BYAGENZUWE' : 'AUDITED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {t('inventoryValuationSubheading')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportControls
            title={language === 'rw' ? 'Raporo y’Ibiribwa n’Agaciro Kabyo mu Bubiko' : 'Food Inventory Reserves & Valuation Report'}
            data={products}
            columns={exportColumns}
            fileNamePrefix="IBB_Food_Inventory"
          />

          {canManageProducts && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('addFoodProductBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-[#991B1B] dark:text-[#F6465D] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* KPI CARDS (Binance Midnight Level 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Valuation */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] shadow-xs hover:border-[#FCD535]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
              Total Reserve Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-[#707A8A]">RWF</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums tracking-tight">
                {Math.round(valuationData?.total_valuation || 0).toLocaleString()}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-100 dark:border-[#252B33]">
              <span className="text-slate-500 dark:text-[#A0AAB8]">Active Staples:</span>
              <span className="text-slate-900 dark:text-[#F0F3F6] font-bold">{valuationData?.total_items || 0} Products</span>
            </div>
          </div>
        </div>

        {/* Card 2: Healthy Stock */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] shadow-xs hover:border-[#0ECB81]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
              Healthy Stock Reserves
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0ECB81] font-mono tabular-nums tracking-tight">
                {valuationData?.healthy_stock_count || 0}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#707A8A]">Products</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-100 dark:border-[#252B33]">
              <span className="text-slate-500 dark:text-[#A0AAB8]">Safety Margin:</span>
              <span className="text-[#0ECB81] font-bold">&gt; Minimum Reorder</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div className="bg-white dark:bg-[#181D24] rounded-xl p-5 border border-slate-200 dark:border-[#2B3139] shadow-xs hover:border-[#F6465D]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
              Reorder Alerts
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              valuationData?.low_stock_count > 0 ? 'bg-[#F6465D]/15 text-[#F6465D]' : 'bg-slate-100 dark:bg-[#202630] text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                valuationData?.low_stock_count > 0 ? 'text-[#F6465D]' : 'text-slate-900 dark:text-[#F0F3F6]'
              }`}>
                {valuationData?.low_stock_count || 0}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-[#707A8A]">Items</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-100 dark:border-[#252B33]">
              <span className="text-slate-500 dark:text-[#A0AAB8]">Action required:</span>
              <span className={valuationData?.low_stock_count > 0 ? 'text-[#F6465D] font-bold' : 'text-[#0ECB81] font-medium'}>
                {valuationData?.low_stock_count > 0 ? 'Procure Immediately' : 'None Required'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOD STAPLES STOCK REMAINING PERCENTAGES OVERVIEW (ACCOUNTANT & ANIMATOR) */}
      <StockRemainingOverview onRefreshParent={fetchInventory} />

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#181D24] p-3 rounded-xl border border-slate-200 dark:border-[#2B3139]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#707A8A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="ALL">All Categories</option>
            <option value="Grains & Cereals">Grains & Cereals</option>
            <option value="Flour & Grains">Flour & Grains</option>
            <option value="Oils & Fats">Oils & Fats</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Tubers & Roots">Tubers & Roots</option>
            <option value="Sweeteners">Sweeteners</option>
            <option value="Seasonings">Seasonings</option>
            <option value="Legumes & Pulses">Legumes & Pulses</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS TABLE (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Loading food stock reserves...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <Package className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">No food products match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Ikiribwa' : 'Food Product'}</th>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Icyiciro' : 'Category'}</th>
                  <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Ibihari Ubu' : 'Available Stock'}</th>
                  <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Urugero ruto' : 'Min Threshold'}</th>
                  <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Igiciro fatizo' : 'Avg Unit Cost'}</th>
                  <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Agaciro kose' : 'Total Valuation'}</th>
                  <th className="py-3 px-4 font-bold text-center">{language === 'rw' ? 'Ibisigaye %' : 'Remaining %'}</th>
                  <th className="py-3 px-4 font-bold text-center">{language === 'rw' ? 'Imiterere' : 'Status'}</th>
                  {canManageProducts && <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Igikorwa' : 'Action'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_alert;
                  const safeRef = p.reference_quantity || p.current_stock || 1;
                  const pct = p.remaining_percentage !== undefined
                    ? p.remaining_percentage
                    : Math.round((p.current_stock / safeRef) * 100);
                  const progressWidth = Math.min(100, Math.max(0, pct));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                        {p.name}
                        <span className="block text-[10px] text-slate-400 dark:text-[#707A8A] font-mono font-normal">
                          Unit: {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                        {p.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isLow ? 'text-[#F6465D]' : 'text-slate-900 dark:text-[#F0F3F6]'}>
                          {p.current_stock.toLocaleString()} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-[#707A8A] tabular-nums">
                        {p.min_stock_alert.toLocaleString()} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-[#A0AAB8] tabular-nums">
                        RWF {p.avg_unit_cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-[#F0F3F6] tabular-nums">
                        RWF {Math.round(p.total_value || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-[#F0F3F6] tabular-nums">
                            {pct}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-[#202630] rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                p.current_stock <= 0
                                  ? 'bg-[#F6465D]'
                                  : pct < 25
                                  ? 'bg-[#DC2626] dark:bg-[#F6465D]'
                                  : pct < 50
                                  ? 'bg-[#D97706] dark:bg-[#F0B90B]'
                                  : 'bg-[#059669] dark:bg-[#0ECB81]'
                              }`}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-[#707A8A] mt-0.5">
                            Ref: {safeRef} {p.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                            Healthy
                          </span>
                        )}
                      </td>
                      {canManageProducts && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-[#FCD535] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-md transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL (Level 4 Elevated: #202630) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FCD535]" />
                {editingProduct ? 'Edit Food Product' : 'Register New Food Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rice (Tanzanian Super)"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Flour & Grains">Flour & Grains</option>
                    <option value="Oils & Fats">Oils & Fats</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Tubers & Roots">Tubers & Roots</option>
                    <option value="Sweeteners">Sweeteners</option>
                    <option value="Seasonings">Seasonings</option>
                    <option value="Legumes & Pulses">Legumes & Pulses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="liters">Liters (L)</option>
                    <option value="bags">Bags (50kg)</option>
                    <option value="bundles">Bundles</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Min Stock Alert Level
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Avg Unit Cost (RWF)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={formData.avgUnitCost}
                    onChange={(e) => setFormData({ ...formData, avgUnitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Reference Storage Baseline / Quota ({formData.unit || 'units'}) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={formData.referenceQuantity}
                  onChange={(e) => setFormData({ ...formData, referenceQuantity: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                />
                <span className="block text-[10px] text-slate-400 dark:text-[#707A8A] mt-1 font-mono">
                  Used as the baseline divisor: (Available Stock &divide; Reference Baseline) &times; 100
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#252B33]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
