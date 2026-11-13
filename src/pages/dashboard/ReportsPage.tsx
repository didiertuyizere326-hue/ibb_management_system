import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ExportControls } from '../../components/common/ExportControls';

export const ReportsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const defaultTab = user?.role === 'DIRECTOR' ? 'approved_students' : 'inventory_valuation';
  const [datasetKey, setDatasetKey] = useState<string>(defaultTab);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDataset = async (key: string) => {
    try {
      setLoading(true);
      const res = await api.get('/reports/export-data', {
        params: { dataset: key },
      });
      setReportTitle(res.data?.title || 'Report');
      setReportData(res.data?.records || []);
    } catch (err) {
      console.error('Failed to load export data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset(datasetKey);
  }, [datasetKey]);

  // Dynamic columns generator based on active dataset
  const getColumns = (): { header: string; key: string; format?: (val: any, row?: any) => string }[] => {
    if (datasetKey === 'approved_students') {
      return [
        { header: language === 'rw' ? 'Nimero' : 'Admission Ref', key: 'tracking_number' },
        { header: language === 'rw' ? 'Izina ry’Umunyeshuri' : 'Student Name', key: 'student_name' },
        { header: language === 'rw' ? 'Igitsina' : 'Gender', key: 'gender' },
        { header: language === 'rw' ? 'Urwego' : 'Level', key: 'academic_level' },
        { header: language === 'rw' ? 'Ishami' : 'Department', key: 'department' },
        { header: language === 'rw' ? 'Amanota S3 (%)' : 'S3 Score (%)', key: 's3_marks' },
        {
          header: language === 'rw' ? 'Amacumbi' : 'Boarding',
          key: 'qualifies_boarding',
          format: (v: number) => (v === 1 ? (language === 'rw' ? 'Arara mu Kigo' : 'Boarding') : (language === 'rw' ? 'Arataha' : 'Day')),
        },
        { header: language === 'rw' ? 'Terefone' : 'Phone', key: 'phone' },
      ];
    }
    if (datasetKey === 'admissions_all') {
      return [
        { header: language === 'rw' ? 'Nimero' : 'Tracking Ref', key: 'tracking_number' },
        { header: language === 'rw' ? 'Izina' : 'Student Name', key: 'student_name' },
        { header: language === 'rw' ? 'Urwego' : 'Level', key: 'academic_level' },
        { header: language === 'rw' ? 'Ishami' : 'Department', key: 'department' },
        { header: language === 'rw' ? 'Amanota S3 (%)' : 'S3 Score (%)', key: 's3_marks' },
        { header: language === 'rw' ? 'Imiterere' : 'Status', key: 'status' },
        { header: language === 'rw' ? 'Impamvu' : 'Decision Reason', key: 'decision_reason' },
        { header: language === 'rw' ? 'Itariki' : 'Date Applied', key: 'created_at' },
      ];
    }
    if (datasetKey === 'stock_in') {
      return [
        { header: 'ID', key: 'id' },
        { header: language === 'rw' ? 'Ikiribwa' : 'Product', key: 'product_name' },
        { header: language === 'rw' ? 'Uwagemuye' : 'Supplier', key: 'supplier_name' },
        { header: t('quantity'), key: 'quantity' },
        { header: t('unit'), key: 'unit' },
        { header: language === 'rw' ? 'Igiciro (RWF)' : 'Unit Cost (RWF)', key: 'unit_cost' },
        { header: language === 'rw' ? 'Igiteranyo (RWF)' : 'Total Cost (RWF)', key: 'total_cost' },
        { header: t('date'), key: 'transaction_date' },
        { header: language === 'rw' ? 'Wanditswe na' : 'Recorded By', key: 'recorded_by' },
      ];
    }
    if (datasetKey === 'stock_out') {
      return [
        { header: 'ID', key: 'id' },
        { header: language === 'rw' ? 'Ikiribwa' : 'Product', key: 'product_name' },
        { header: t('quantity'), key: 'quantity' },
        { header: t('unit'), key: 'unit' },
        { header: t('date'), key: 'transaction_date' },
        { header: language === 'rw' ? 'Isaha (CAT)' : 'Time (CAT)', key: 'transaction_time' },
        { header: language === 'rw' ? 'Umwaka' : 'Academic Year', key: 'academic_year' },
        { header: language === 'rw' ? 'Igihembwe' : 'Term', key: 'term_name' },
        { header: language === 'rw' ? 'Cyatanzwe na' : 'Issued By', key: 'issued_by' },
        { header: t('notes'), key: 'notes' },
      ];
    }
    if (datasetKey === 'inventory_valuation') {
      return [
        { header: t('colProduct'), key: 'name' },
        { header: language === 'rw' ? 'Icyiciro' : 'Category', key: 'category' },
        {
          header: t('colAvailable'),
          key: 'current_stock',
          format: (v: number, row: any) => `${v?.toLocaleString() || 0} ${row?.unit || ''}`,
        },
        {
          header: t('colBaseline'),
          key: 'reference_quantity',
          format: (v: number, row: any) => `${v?.toLocaleString() || 0} ${row?.unit || ''}`,
        },
        {
          header: t('colRemaining'),
          key: 'remaining_percentage',
          format: (v: number) => `${v !== undefined ? v : 0}%`,
        },
        {
          header: t('colStatus'),
          key: 'stock_status',
          format: (v: string) =>
            v === 'OUT_OF_STOCK'
              ? t('statusOutOfStock').toUpperCase()
              : v === 'LOW_STOCK'
              ? t('statusLow').toUpperCase()
              : t('statusSufficient').toUpperCase(),
        },
        {
          header: language === 'rw' ? 'Igiciro Mpuzandengo' : 'Avg Cost (RWF)',
          key: 'avg_unit_cost',
          format: (v: number) => `RWF ${Math.round(v || 0).toLocaleString()}`,
        },
        {
          header: language === 'rw' ? 'Agaciro Kose' : 'Total Value (RWF)',
          key: 'total_value',
          format: (v: number) => `RWF ${Math.round(v || 0).toLocaleString()}`,
        },
      ];
    }
    return [
      { header: t('colSupplierName'), key: 'name' },
      { header: t('colContactPerson'), key: 'contact_person' },
      { header: t('colTelephone'), key: 'phone' },
      { header: t('colEmail'), key: 'email' },
      { header: language === 'rw' ? 'Icyiciro' : 'Category', key: 'category' },
      { header: language === 'rw' ? 'Ibyagemuwe Byose' : 'Total Deliveries', key: 'total_deliveries' },
    ];
  };

  const columns = getColumns();

  const availableTabs = [
    ...(user?.role === 'DIRECTOR'
      ? [
          { key: 'approved_students', label: language === 'rw' ? 'Abemerewe Kwiga' : 'Approved Students Register' },
          { key: 'admissions_all', label: language === 'rw' ? 'Abasabye Bose' : 'All Admissions Ledger' },
        ]
      : []),
    { key: 'inventory_valuation', label: language === 'rw' ? 'Agaciro k’Ububiko' : 'Food Reserves & Valuation' },
    { key: 'stock_in', label: language === 'rw' ? 'Ibyinjijwe mu Bubiko' : 'Stock In Deliveries' },
    { key: 'stock_out', label: language === 'rw' ? 'Ibisohoka buri Munsi' : 'Daily Stock Out Issues' },
    { key: 'suppliers', label: language === 'rw' ? 'Abagemuzi b’Ibiribwa' : 'Suppliers Directory' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {language === 'rw' ? 'Raporo n’Igenzura ry’Ishuri' : 'Institutional Reports & Audits'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              CSV / PDF READY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {language === 'rw'
              ? 'Amakuru yandikwa mu bubiko, ibitabo by’ubugenzuzi, n’amadosiye ashobora gucapwa cyangwa kubikwa muri Excel.'
              : 'Exportable database datasets, compliance registers, stock movement logs, and print-ready institutional reports.'}
          </p>
        </div>

        <ExportControls
          title={reportTitle}
          data={reportData}
          columns={columns}
          fileNamePrefix={`IBB_${datasetKey}`}
        />
      </div>

      {/* DATASET SELECTOR */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl p-1.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap gap-1.5 no-print">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDatasetKey(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              datasetKey === tab.key
                ? 'bg-[#FCD535] text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] hover:text-slate-900 dark:hover:text-[#F0F3F6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT CARD */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#707A8A] font-mono block">
              INSTITUT BAPTISTE DE BUBERUKA (IBB) · {language === 'rw' ? 'RAPORO YEMEWE' : 'OFFICIAL AUDITED REPORT'}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-[#F0F3F6] mt-0.5">
              {reportTitle}
            </h2>
          </div>
          <div className="text-right text-xs font-mono text-slate-500 dark:text-[#707A8A]">
            <span>
              {language === 'rw' ? 'Imibare:' : 'Records:'}{' '}
              <strong className="text-slate-900 dark:text-[#F0F3F6]">{reportData.length}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            {t('loadingData')}
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#707A8A]">
            {t('emptyState')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-4 font-bold whitespace-nowrap">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {reportData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                    {columns.map((col, colIdx) => {
                      let val = row[col.key];
                      if (col.format) val = col.format(val, row);
                      return (
                        <td key={colIdx} className="py-3 px-4 text-slate-700 dark:text-[#A0AAB8] whitespace-nowrap">
                          {val !== null && val !== undefined ? String(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
