import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { StockOverviewItem } from '../../types';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';

interface StockRemainingOverviewProps {
  initialItems?: StockOverviewItem[];
  onRefreshParent?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const StockRemainingOverview: React.FC<StockRemainingOverviewProps> = ({
  initialItems,
  onRefreshParent,
  title,
  subtitle,
  compact = false,
}) => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<StockOverviewItem[]>(initialItems || []);
  const [loading, setLoading] = useState<boolean>(!initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchStockOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/stock-overview');
      if (res.data?.stockItems) {
        setItems(res.data.stockItems);
      }
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      fetchStockOverview();
    } else {
      setItems(initialItems);
    }
  }, [initialItems]);

  const handleRefresh = () => {
    fetchStockOverview();
    onRefreshParent?.();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || item.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Aggregate metrics
  const totalItems = items.length;
  const lowOrOutCount = items.filter((i) => i.stock_status !== 'NORMAL').length;
  const healthyCount = items.filter((i) => i.stock_status === 'NORMAL').length;
  const averagePercentage = totalItems > 0
    ? Math.round(items.reduce((acc, i) => acc + (i.remaining_percentage || 0), 0) / totalItems)
    : 0;

  // Helper for progress bar color
  const getProgressColor = (item: StockOverviewItem) => {
    if (item.current_stock <= 0) return 'bg-[#F6465D] dark:bg-[#F6465D]';
    if (item.stock_status === 'LOW_STOCK' || item.remaining_percentage < 25) {
      return 'bg-[#DC2626] dark:bg-[#F6465D]';
    }
    if (item.remaining_percentage < 50) {
      return 'bg-[#D97706] dark:bg-[#F0B90B]';
    }
    return 'bg-[#059669] dark:bg-[#0ECB81]';
  };

  // Helper for status badge
  const renderStatusBadge = (item: StockOverviewItem) => {
    if (item.current_stock <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-[#991B1B] dark:text-[#F6465D] border border-rose-500/30">
          <XCircle className="w-3 h-3" />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (item.stock_status === 'LOW_STOCK' || item.remaining_percentage < 25) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-[#92400E] dark:text-[#F0B90B] border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>Low Reserve</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-[#065F46] dark:text-[#0ECB81] border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" />
        <span>Sufficient</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#252B33]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {title || (language === 'rw' ? 'Ijanisha ry’Ibiribwa Bisigaye mu Bubiko' : 'Inventory Food Reserves & Remaining Capacity')}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-[#1D4ED8] dark:text-[#38BDF8] border border-blue-500/20">
              {totalItems} STAPLES
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#707A8A]">
            {subtitle || (language === 'rw'
              ? 'Igereranya ry’ibiribwa bihari n’ingano y’ibanze (Available vs. Reference Capacity) kuri buri funguro.'
              : 'Real-time available quantities vs. defined baseline storage capacity with calculated remaining percentage.')}
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#11151B] p-1 rounded-lg border border-slate-200/80 dark:border-[#2B3139] text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-[#202630] text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900'
              }`}
            >
              All ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NORMAL')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'NORMAL'
                  ? 'bg-white dark:bg-[#202630] text-[#065F46] dark:text-[#0ECB81] font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900'
              }`}
            >
              Sufficient ({healthyCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOW_STOCK')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                statusFilter === 'LOW_STOCK'
                  ? 'bg-white dark:bg-[#202630] text-[#92400E] dark:text-[#F0B90B] font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900'
              }`}
            >
              Low Alert ({lowOrOutCount})
            </button>
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#11151B] p-1 rounded-lg border border-slate-200/80 dark:border-[#2B3139]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] shadow-2xs font-bold'
                  : 'text-slate-400 dark:text-[#707A8A] hover:text-slate-700 dark:hover:text-[#F0F3F6]'
              }`}
              title="Grid Cards View"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#202630] text-[#1769FF] dark:text-[#FCD535] shadow-2xs font-bold'
                  : 'text-slate-400 dark:text-[#707A8A] hover:text-slate-700 dark:hover:text-[#F0F3F6]'
              }`}
              title="Ledger Table View"
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-[#F0F3F6] border border-slate-200 dark:border-[#2B3139] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Stock Remaining Data"
            aria-label="Refresh stock remaining percentages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Search on larger lists */}
      {!compact && totalItems > 4 && (
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-[#11151B]/50 border-b border-slate-200/80 dark:border-[#252B33] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#707A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staple food by name or category..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1769FF] dark:focus:ring-[#FCD535]/40"
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-[#707A8A]">
            Average Reserve Level: <strong className="text-slate-900 dark:text-[#F0F3F6]">{averagePercentage}%</strong>
          </div>
        </div>
      )}

      {/* Stock Items Content */}
      <div className="p-4 sm:p-5">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-[#707A8A]">
            <div className="w-6 h-6 border-2 border-[#FCD535] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading real-time stock percentage calculations...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-[#707A8A]">
            No inventory food items found matching current filters.
          </div>
        ) : viewMode === 'table' ? (
          /* DETAILED LEDGER TABLE VIEW (All 7 required fields) */
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#252B33]">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">1. Food Item Name</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold text-right">2. Available Quantity</th>
                  <th className="py-3 px-4 font-bold text-right">4. Reference Quantity</th>
                  <th className="py-3 px-4 font-bold text-center">5. Remaining %</th>
                  <th className="py-3 px-4 font-bold text-center min-w-[160px]">6. Progress Bar</th>
                  <th className="py-3 px-4 font-bold text-center">7. Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33] bg-white dark:bg-[#181D24]">
                {filteredItems.map((item) => {
                  const safeAvailable = Math.max(0, item.current_stock);
                  const safeRef = item.reference_quantity && item.reference_quantity > 0
                    ? item.reference_quantity
                    : (safeAvailable > 0 ? safeAvailable : 100);
                  const calculatedPercentage = item.remaining_percentage !== undefined
                    ? item.remaining_percentage
                    : Math.round((safeAvailable / safeRef) * 1000) / 10;
                  const visualWidth = Math.min(100, Math.max(0, calculatedPercentage));
                  const progressColor = getProgressColor(item);
                  const isOut = safeAvailable <= 0;
                  const isLow = !isOut && (item.stock_status === 'LOW_STOCK' || calculatedPercentage < 25);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#202630]/60 transition-colors ${
                        isOut ? 'bg-rose-50/30 dark:bg-rose-950/10' : isLow ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#707A8A]">
                          ID #{item.id} · Unit: {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                        {item.category}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isOut ? 'text-[#F6465D]' : isLow ? 'text-amber-600 dark:text-[#F0B90B]' : 'text-slate-900 dark:text-[#F0F3F6]'}>
                          {safeAvailable.toLocaleString()} {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-[#A0AAB8] tabular-nums font-medium">
                        {safeRef.toLocaleString()} {item.unit}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md font-mono font-extrabold text-xs tabular-nums ${
                          isOut
                            ? 'bg-rose-500/15 text-[#991B1B] dark:text-[#F6465D]'
                            : isLow
                            ? 'bg-amber-500/15 text-[#92400E] dark:text-[#F0B90B]'
                            : 'bg-emerald-500/15 text-[#065F46] dark:text-[#0ECB81]'
                        }`}>
                          {calculatedPercentage}%
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="h-2.5 w-full bg-slate-200 dark:bg-[#202630] rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-[#2B3139]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${visualWidth}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 dark:text-[#707A8A]">
                            <span>0%</span>
                            <span>{calculatedPercentage}% remaining</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW (All 7 required fields displayed with high contrast) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const safeAvailable = Math.max(0, item.current_stock);
              const safeRef = item.reference_quantity && item.reference_quantity > 0
                ? item.reference_quantity
                : (safeAvailable > 0 ? safeAvailable : 100);
              const calculatedPercentage = item.remaining_percentage !== undefined
                ? item.remaining_percentage
                : Math.round((safeAvailable / safeRef) * 1000) / 10;
              const visualWidth = Math.min(100, Math.max(0, calculatedPercentage));
              const progressColor = getProgressColor(item);
              const isOut = safeAvailable <= 0;
              const isLow = !isOut && (item.stock_status === 'LOW_STOCK' || calculatedPercentage < 25);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl transition-all space-y-3 ${
                    isOut
                      ? 'bg-rose-50/40 dark:bg-rose-950/10 border-2 border-rose-300 dark:border-rose-900/60'
                      : isLow
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-2 border-amber-300 dark:border-amber-900/60'
                      : 'bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#252B33] hover:border-slate-300 dark:hover:border-[#2B3139]'
                  }`}
                >
                  {/* Top Row: Food Name, Category & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] truncate">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#707A8A]">
                        {item.category} · Unit: <strong>{item.unit}</strong>
                      </span>
                    </div>

                    <div className="shrink-0">
                      {renderStatusBadge(item)}
                    </div>
                  </div>

                  {/* Middle Row: Metrics (Available vs Reference) & Big Percentage */}
                  <div className="flex items-end justify-between gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl font-extrabold font-mono tabular-nums tracking-tight ${
                          isOut ? 'text-[#F6465D]' : isLow ? 'text-amber-600 dark:text-[#F0B90B]' : 'text-slate-900 dark:text-white'
                        }`}>
                          {safeAvailable.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-[#A0AAB8] font-semibold">
                          {item.unit}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#707A8A]">
                          available
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 dark:text-[#707A8A] flex items-center gap-1.5">
                        <span>Baseline Capacity:</span>
                        <strong className="text-slate-800 dark:text-[#A0AAB8]">
                          {safeRef.toLocaleString()} {item.unit}
                        </strong>
                        {item.min_stock_alert > 0 && (
                          <span className="text-slate-400 dark:text-[#707A8A] text-[10px]">
                            (Alert &le; {item.min_stock_alert})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Numeric Percentage Pill */}
                    <div className="text-right shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg font-mono font-black text-xl tabular-nums tracking-tight ${
                        isOut
                          ? 'bg-rose-500/20 text-[#991B1B] dark:text-[#F6465D]'
                          : isLow
                          ? 'bg-amber-500/20 text-[#92400E] dark:text-[#F0B90B]'
                          : 'bg-emerald-500/20 text-[#065F46] dark:text-[#0ECB81]'
                      }`}>
                        {calculatedPercentage}%
                      </div>
                      <span className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-[#707A8A] mt-0.5">
                        Remaining Capacity
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Proportional Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="h-3 w-full bg-slate-200 dark:bg-[#202630] rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-[#2B3139]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${visualWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-[#707A8A]">
                      <span>0%</span>
                      <span className="font-semibold text-slate-600 dark:text-[#A0AAB8]">
                        {isOut ? 'Depleted (0%)' : `${calculatedPercentage}% in store`}
                      </span>
                      <span>100% {calculatedPercentage > 100 ? `(Over: ${calculatedPercentage}%)` : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
