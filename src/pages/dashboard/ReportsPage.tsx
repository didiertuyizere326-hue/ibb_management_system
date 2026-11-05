import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { ExportControls } from '../../components/common/ExportControls';
import {
  FileBarChart2,
  Calendar,
  Filter,
  Download,
  Printer,
  Table as TableIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [datasetKey, setDatasetKey] = useState<string>('approved_students');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('Approved Students Register');
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
        { header: 'Admission Ref', key: 'tracking_number' },
        { header: 'Student Name', key: 'student_name' },
        { header: 'Gender', key: 'gender' },
        { header: 'Level', key: 'academic_level' },
        { header: 'Department', key: 'department' },
        { header: 'S3 Score (%)', key: 's3_marks' },
        { header: 'Boarding', key: 'qualifies_boarding', format: (v: number) => v === 1 ? 'Boarding' : 'Day' },
        { header: 'Phone', key: 'phone' },
      ];
    }
    if (datasetKey === 'admissions_all') {
      return [
        { header: 'Tracking Ref', key: 'tracking_number' },
        { header: 'Student Name', key: 'student_name' },
        { header: 'Level', key: 'academic_level' },
        { header: 'Department', key: 'department' },
        { header: 'S3 Score (%)', key: 's3_marks' },
        { header: 'Status', key: 'status' },
        { header: 'Decision Reason', key: 'decision_reason' },
        { header: 'Date Applied', key: 'created_at' },
      ];
    }
    if (datasetKey === 'stock_in') {
      return [
        { header: 'Tx ID', key: 'id' },
        { header: 'Product', key: 'product_name' },
        { header: 'Supplier', key: 'supplier_name' },
        { header: 'Quantity', key: 'quantity' },
        { header: 'Unit', key: 'unit' },
        { header: 'Unit Cost (RWF)', key: 'unit_cost' },
        { header: 'Total Cost (RWF)', key: 'total_cost' },
        { header: 'Date', key: 'transaction_date' },
        { header: 'Recorded By', key: 'recorded_by' },
      ];
    }
    if (datasetKey === 'stock_out') {
      return [
        { header: 'Tx ID', key: 'id' },
        { header: 'Product', key: 'product_name' },
        { header: 'Quantity', key: 'quantity' },
        { header: 'Unit', key: 'unit' },
        { header: 'Date', key: 'transaction_date' },
        { header: 'Time (CAT)', key: 'transaction_time' },
        { header: 'Issued By', key: 'issued_by' },
        { header: 'Notes / Reason', key: 'notes' },
      ];
    }
    if (datasetKey === 'inventory_valuation') {
      return [
        { header: 'Food Product', key: 'name' },
        { header: 'Category', key: 'category' },
        { header: 'Available Stock', key: 'current_stock', format: (v: number, row: any) => `${v?.toLocaleString() || 0} ${row?.unit || ''}` },
        { header: 'Reference Capacity', key: 'reference_quantity', format: (v: number, row: any) => `${v?.toLocaleString() || 0} ${row?.unit || ''}` },
        { header: 'Remaining %', key: 'remaining_percentage', format: (v: number) => `${v !== undefined ? v : 0}%` },
        { header: 'Stock Status', key: 'stock_status', format: (v: string) => v === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : v === 'LOW_STOCK' ? 'LOW RESERVE' : 'SUFFICIENT' },
        { header: 'Avg Cost (RWF)', key: 'avg_unit_cost', format: (v: number) => `RWF ${Math.round(v || 0).toLocaleString()}` },
        { header: 'Total Value (RWF)', key: 'total_value', format: (v: number) => `RWF ${Math.round(v || 0).toLocaleString()}` },
      ];
    }
    return [
      { header: 'Supplier Name', key: 'name' },
      { header: 'Contact Person', key: 'contact_person' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Category', key: 'category' },
      { header: 'Total Deliveries', key: 'total_deliveries' },
    ];
  };

  const columns = getColumns();

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
              ? 'Amakuru yandikwa mu bubiko, ibitabo by’amategeko, igitabo cy’ibicuruzwa n’ingengabihe yo gucapa.'
              : 'Exportable database datasets, compliance registers, stock procurement ledger, and print-ready schedules.'}
          </p>
        </div>

        <ExportControls
          title={reportTitle}
          data={reportData}
          columns={columns}
          fileNamePrefix={`IBB_${datasetKey}`}
        />
      </div>

      {/* DATASET SELECTOR SEGMENTED CONTROL (Binance Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl p-1.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap gap-1.5 no-print">
        {[
          { key: 'approved_students', label: language === 'rw' ? 'Abemerewe Kwiga' : 'Approved Students Register' },
          { key: 'admissions_all', label: language === 'rw' ? 'Abasabye Bose' : 'All Admissions Ledger' },
          { key: 'stock_in', label: language === 'rw' ? 'Ibyinjijwe mu Bubiko' : 'Stock In Deliveries' },
          { key: 'stock_out', label: language === 'rw' ? 'Ibisohoka buri Munsi' : 'Daily Stock Out Issues' },
          { key: 'inventory_valuation', label: language === 'rw' ? 'Agaciro k’Ububiko' : 'Food Reserves & Valuation' },
          { key: 'suppliers', label: language === 'rw' ? 'Abagemuzi b’Ibiribwa' : 'Suppliers Directory' },
        ].map((tab) => (
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

      {/* REPORT CONTENT CARD (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        
        {/* Printable Official Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#252B33] bg-slate-50/60 dark:bg-[#11151B] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#707A8A] font-mono block">
              INSTITUT BAPTISTE DE BUBERUKA (IBB) · OFFICIAL AUDITED REPORT
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-[#F0F3F6] mt-0.5">
              {reportTitle}
            </h2>
          </div>
          <div className="text-right text-xs font-mono text-slate-500 dark:text-[#707A8A]">
            <span>Records: <strong className="text-slate-900 dark:text-[#F0F3F6]">{reportData.length}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Querying database records...
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#707A8A]">
            No records found for this report dataset.
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
