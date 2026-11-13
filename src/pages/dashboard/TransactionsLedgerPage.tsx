import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Product } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import { FileClock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const ALL_YEARS = Array.from({ length: 2050 - 2022 }, (_, i) => `${2022 + i}-${2023 + i}`);

export const TransactionsLedgerPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [txRes, prodRes] = await Promise.all([
        api.get('/inventory/transactions', {
          params: {
            type: typeFilter !== 'all' ? typeFilter : undefined,
            productId: productFilter !== 'all' ? productFilter : undefined,
            academicYear: academicYearFilter !== 'all' ? academicYearFilter : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        }),
        api.get('/inventory/products'),
      ]);
      setTransactions(txRes.data?.transactions || []);
      setProducts(prodRes.data?.products || []);
    } catch (err) {
      console.error('Failed to load transactions ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, productFilter, academicYearFilter, startDate, endDate]);

  const exportColumns = [
    { header: language === 'rw' ? 'Nimero' : 'Transaction ID', key: 'id' },
    { header: language === 'rw' ? 'Ubwoko' : 'Type', key: 'transaction_type' },
    { header: language === 'rw' ? 'Umwaka' : 'Academic Year', key: 'academic_year' },
    { header: language === 'rw' ? 'Igihembwe' : 'Term', key: 'term_name' },
    { header: language === 'rw' ? 'Ikiribwa' : 'Product', key: 'product_name' },
    { header: language === 'rw' ? 'Ingano' : 'Quantity', key: 'quantity' },
    { header: language === 'rw' ? 'Igipimo' : 'Unit', key: 'unit' },
    {
      header: language === 'rw' ? 'Agaciro (RWF)' : 'Total Value (RWF)',
      key: 'total_cost',
      format: (val: number) => `RWF ${Math.round(val || 0).toLocaleString()}`,
    },
    { header: language === 'rw' ? 'Uwagemuye / Ikigega' : 'Party / Destination', key: 'party_name' },
    { header: language === 'rw' ? 'Itariki' : 'Date', key: 'date' },
    { header: language === 'rw' ? 'Isaha (CAT)' : 'Time (CAT)', key: 'time' },
    { header: language === 'rw' ? 'Umukozi Wabikoze' : 'Staff Officer', key: 'recorded_by_name' },
    { header: language === 'rw' ? 'Ibisobanuro' : 'Notes', key: 'notes' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('stockMovementLedgerTitle')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              {language === 'rw' ? 'AMATEKA YOSE' : 'STOCK HISTORY'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {t('stockMovementLedgerSubtitle')}
          </p>
        </div>

        <ExportControls
          title={language === 'rw' ? 'Igitabo cy’Urugendo rw’Ibiribwa mu Bubiko' : 'Stock In & Stock Out Historical Ledger'}
          data={transactions}
          columns={exportColumns}
          fileNamePrefix="IBB_Stock_History"
        />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl p-3.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {t('transactionTypeFilter')}:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allTransactions')}</option>
            <option value="IN">{t('typeStockInLabel')}</option>
            <option value="OUT">{t('typeStockOutLabel')}</option>
          </select>
        </div>

        {/* Academic Year Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {t('academicYears')}:
          </span>
          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{language === 'rw' ? 'Imyaka Yose' : 'All Years'}</option>
            {ALL_YEARS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {language === 'rw' ? 'Ikiribwa:' : 'Product:'}
          </span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{language === 'rw' ? 'Ibiribwa Byose' : 'All Food Products'}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {language === 'rw' ? 'Kuva:' : 'From:'}
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {language === 'rw' ? 'Kugeza:' : 'To:'}
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          />
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            {t('loadingData')}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <FileClock className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">{t('emptyState')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[880px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">{t('colTransactionDate')}</th>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Umwaka & Igihembwe' : 'Period'}</th>
                  <th className="py-3 px-4 font-bold text-center">{t('colMovementType')}</th>
                  <th className="py-3 px-4 font-bold">{t('colMovementProduct')}</th>
                  <th className="py-3 px-4 font-bold text-right">{t('colMovementQty')}</th>
                  <th className="py-3 px-4 font-bold text-right">{language === 'rw' ? 'Agaciro (RWF)' : 'Valuation (RWF)'}</th>
                  <th className="py-3 px-4 font-bold">{language === 'rw' ? 'Uwagemuye / Ikigega' : 'Vendor / Beneficiary'}</th>
                  <th className="py-3 px-4 font-bold">{t('colAuthorizedBy')}</th>
                  <th className="py-3 px-4 font-bold">{t('notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {transactions.map((tx, idx) => {
                  const isIn = tx.transaction_type === 'IN';
                  return (
                    <tr
                      key={`${tx.transaction_type}-${tx.id}-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-[#707A8A] whitespace-nowrap">
                        {tx.date} {tx.time && tx.time !== '--:--' ? `· ${tx.time}` : ''}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-[#A0AAB8] whitespace-nowrap">
                        {tx.academic_year ? `${tx.academic_year} · ${tx.term_name || ''}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isIn
                              ? 'bg-[#0ECB81]/15 text-[#16A34A] dark:text-[#0ECB81] border border-[#0ECB81]/30'
                              : 'bg-[#F0B90B]/15 text-[#D97706] dark:text-[#F0B90B] border border-[#F0B90B]/30'
                          }`}
                        >
                          {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{isIn ? (language === 'rw' ? 'BYINJIYE' : 'STOCK IN') : (language === 'rw' ? 'BYASOHOTSE' : 'STOCK OUT')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                        {tx.product_name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={isIn ? 'text-[#16A34A] dark:text-[#0ECB81]' : 'text-[#D97706] dark:text-[#F0B90B]'}>
                          {isIn ? '+' : '-'}{tx.quantity} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-[#F0F3F6] tabular-nums">
                        RWF {Math.round(tx.total_cost || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-[#A0AAB8]">
                        {tx.party_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-[#707A8A] font-mono text-[11px]">
                        {tx.recorded_by_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-[#A0AAB8] max-w-xs truncate" title={tx.notes}>
                        {tx.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
