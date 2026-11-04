import React from 'react';
import { Printer, Download } from 'lucide-react';

interface ExportControlsProps {
  title: string;
  data: any[];
  columns: { header: string; key: string; format?: (val: any, row?: any) => string }[];
  fileNamePrefix?: string;
  onPrint?: () => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  title,
  data,
  columns,
  fileNamePrefix = 'IBB_Report',
  onPrint,
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert('No records available in the filtered dataset to export.');
      return;
    }

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // CSV Header metadata banner
      let csvContent = `\uFEFF`; // UTF-8 BOM
      csvContent += `"INSTITUT BAPTISTE DE BUBERUKA (IBB) - OFFICIAL REPORT"\n`;
      csvContent += `"Report Title: ${title}"\n`;
      csvContent += `"Generated On: ${dateStr} ${timeStr} CAT"\n`;
      csvContent += `"Total Records: ${data.length}"\n\n`;

      // Column Headers
      const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`);
      csvContent += headers.join(',') + '\n';

      // Rows
      data.forEach((row) => {
        const rowValues = columns.map((col) => {
          let val = row[col.key];
          if (col.format) {
            val = col.format(val, row);
          }
          if (val === null || val === undefined) {
            val = '';
          }
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        });
        csvContent += rowValues.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate export file.');
    }
  };

  return (
    <div className="flex items-center gap-2 no-print shrink-0">
      <button
        onClick={handlePrint}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-white dark:bg-[#181D24] hover:bg-slate-50 dark:hover:bg-[#202630] border border-slate-200 dark:border-[#2B3139] rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
        title="Print formatted document view"
      >
        <Printer className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A]" />
        <span>Print</span>
      </button>

      <button
        onClick={handleExportCSV}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-[#F0F3F6] bg-slate-100 dark:bg-[#202630] hover:bg-slate-200 dark:hover:bg-[#262D38] border border-slate-200 dark:border-[#2B3139] rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
        title="Download CSV / Excel compatible spreadsheet"
      >
        <Download className="w-3.5 h-3.5 text-[#3B82F6] dark:text-[#FCD535]" />
        <span>Export CSV</span>
      </button>
    </div>
  );
};
