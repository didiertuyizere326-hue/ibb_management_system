import React, { useState, useEffect } from 'react';
import { Application } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  FileText,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface DocumentModalProps {
  application: Application | null;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  const { language } = useLanguage();

  // Attached Document Zoom & Inspection Viewer State
  const [inspectDoc, setInspectDoc] = useState<{ url: string; title: string; type: 'slip' | 'passport' } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'contain' | 'width'>('contain');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Keyboard shortcut: Escape closes inspectDoc if open, else closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectDoc) {
          setInspectDoc(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectDoc, onClose]);

  const openInspect = (url: string, title: string, type: 'slip' | 'passport') => {
    setInspectDoc({ url, title, type });
    setZoomLevel(1);
    setFitMode('contain');
    setIsFullscreen(false);
  };

  const handleDownloadDoc = async () => {
    if (!inspectDoc?.url) return;
    try {
      const res = await fetch(inspectDoc.url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const isPdf = inspectDoc.url.toLowerCase().endsWith('.pdf') || blob.type.includes('pdf');
      a.download = `${application?.tracking_number || 'IBB'}_${inspectDoc.type}.${isPdf ? 'pdf' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = inspectDoc.url;
      a.download = `${application?.tracking_number || 'IBB'}_${inspectDoc.type}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!application) return null;

  const isPdf = inspectDoc?.url?.toLowerCase()?.endsWith('.pdf') || inspectDoc?.url?.includes('application/pdf');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white dark:bg-[#202630] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-[#2B3139] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between bg-slate-50 dark:bg-[#181D24]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6]">
                  {application.student_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#707A8A] font-mono">
                  {application.tracking_number} · {application.academic_level} {application.department}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Key Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
                <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block font-mono">
                  {language === 'rw' ? 'Amanota S3' : 'S3 Score'}
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums">
                  {application.s3_marks}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
                <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block font-mono">
                  {language === 'rw' ? 'Amacumbi' : 'Boarding Status'}
                </span>
                <span className={`text-xs font-mono font-bold ${application.qualifies_boarding ? 'text-[#0ECB81]' : 'text-slate-600 dark:text-[#A0AAB8]'}`}>
                  {application.qualifies_boarding
                    ? (language === 'rw' ? 'Acumbika (≥80%)' : 'Eligible (≥80%)')
                    : (language === 'rw' ? 'Umutaha' : 'Day Scholar')}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
                <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block font-mono">
                  {language === 'rw' ? 'Igitsina' : 'Gender'}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6]">
                  {application.gender === 'Male' && language === 'rw' ? 'Gabo' : application.gender === 'Female' && language === 'rw' ? 'Gore' : application.gender}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139]">
                <span className="text-[11px] text-slate-500 dark:text-[#707A8A] block font-mono">
                  {language === 'rw' ? 'Imiterere' : 'Status'}
                </span>
                <span className="text-xs font-mono font-bold text-[#3B82F6] dark:text-[#FCD535]">
                  {application.status === 'Approved' && language === 'rw' ? 'Yemejwe'
                    : application.status === 'Pending' && language === 'rw' ? 'Bitegerejwe'
                    : application.status === 'Under Review' && language === 'rw' ? 'Gusuzumwa'
                    : application.status === 'Rejected' && language === 'rw' ? 'Yanzwe'
                    : application.status}
                </span>
              </div>
            </div>

            {/* Personal & Family Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Itariki y’Amavuko:' : 'DOB:'} <strong className="text-slate-800 dark:text-[#F0F3F6]">{application.date_of_birth}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Se:' : 'Father:'} <strong className="text-slate-800 dark:text-[#F0F3F6]">{application.father_name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Nyina:' : 'Mother:'} <strong className="text-slate-800 dark:text-[#F0F3F6]">{application.mother_name}</strong></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Telefone:' : 'Phone:'} <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono">{application.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Imeli:' : 'Email:'} <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono">{application.email}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-[#A0AAB8]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                  <span>{language === 'rw' ? 'Aho Batuye:' : 'Residence:'} <strong className="text-slate-800 dark:text-[#F0F3F6]">{application.residence}</strong></span>
                </div>
              </div>
            </div>

            {/* Document Previews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
                  {language === 'rw' ? 'Inyandiko n’Ibyemezo Byashyizweho' : 'Attached Verification Documents'}
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {language === 'rw' ? 'Kanda ku ifoto kugira ngo uyagure' : 'Click image to inspect & zoom'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* S3 Result Slip */}
                <div className="border border-slate-200 dark:border-[#2B3139] rounded-xl p-3 bg-slate-50 dark:bg-[#181D24] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#3B82F6] dark:text-[#FCD535]" />
                      {language === 'rw' ? 'Icyemezo cy’Amanota S3' : 'S3 Result Slip'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">NESA Verified</span>
                  </div>

                  {application.result_slip_url ? (
                    <div
                      onClick={() => openInspect(application.result_slip_url!, 'NESA S3 Official Result Slip', 'slip')}
                      className="h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#11151B] flex items-center justify-center relative group cursor-pointer hover:border-[#FCD535] transition-all"
                      title="Click to inspect and zoom"
                    >
                      <img
                        src={application.result_slip_url}
                        alt="S3 Result Slip"
                        className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-5 h-5 text-[#FCD535]" />
                        <span>{language === 'rw' ? 'Kanda hano uzumye' : 'Click to Inspect / Zoom'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 rounded-lg border border-dashed border-slate-300 dark:border-[#2B3139] flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-[#707A8A] mb-2" />
                      <span className="text-xs text-slate-600 dark:text-[#A0AAB8]">
                        {language === 'rw' ? 'Icyemezo kiri mu biro bya IBB' : 'Physical slip filed at IBB Registrar'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#707A8A] mt-1 font-mono">
                        {language === 'rw' ? 'Amanota:' : 'Score:'} {application.s3_marks}% Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Passport Photo */}
                <div className="border border-slate-200 dark:border-[#2B3139] rounded-xl p-3 bg-slate-50 dark:bg-[#181D24] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
                      {language === 'rw' ? 'Ifoto ya Pasiporo' : 'Passport Photo'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">Identity File</span>
                  </div>

                  {application.passport_photo_url ? (
                    <div
                      onClick={() => openInspect(application.passport_photo_url!, 'Official Student Passport Photo', 'passport')}
                      className="h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#11151B] flex items-center justify-center relative group cursor-pointer hover:border-[#FCD535] transition-all"
                      title="Click to inspect and zoom"
                    >
                      <img
                        src={application.passport_photo_url}
                        alt="Student Portrait"
                        className="max-h-full max-w-full object-contain group-hover:scale-102 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-2xs">
                        <ZoomIn className="w-5 h-5 text-[#FCD535]" />
                        <span>{language === 'rw' ? 'Kanda hano uzumye' : 'Click to Inspect / Zoom'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 rounded-lg border border-dashed border-slate-300 dark:border-[#2B3139] flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#FCD535]/20 text-slate-900 dark:text-[#FCD535] font-bold text-lg flex items-center justify-center mb-2 font-mono">
                        {application.student_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-[#F0F3F6] font-semibold">{application.student_name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-[#707A8A]">
                        {language === 'rw' ? 'Ifoto iri muri dosiyeti' : 'Portrait on student file'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Notes if already taken */}
            {application.decision_reason && (
              <div className="p-3 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/30 text-xs">
                <span className="font-bold text-[#F0B90B] block mb-1">
                  {language === 'rw' ? 'Impamvu n’Ibyemezo by’Ibiro:' : 'Official Review Notes:'}
                </span>
                <p className="text-slate-800 dark:text-[#F0F3F6] leading-relaxed">
                  {application.decision_reason}
                </p>
              </div>
            )}

          </div>

          {/* Modal Footer with Actions */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#252B33] flex items-center justify-between bg-slate-50 dark:bg-[#181D24]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-200 dark:hover:bg-[#262D38] rounded-lg transition-colors cursor-pointer"
            >
              {language === 'rw' ? 'Funga' : 'Close'}
            </button>

            {application.status !== 'Approved' && onApprove && onReject && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReject(application.id)}
                  className="px-3 py-2 text-xs font-semibold text-[#F6465D] bg-[#F6465D]/10 hover:bg-[#F6465D]/20 border border-[#F6465D]/30 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'rw' ? 'Hakana ubihe impamvu' : 'Reject with Reason'}
                </button>
                <button
                  onClick={() => onApprove(application.id)}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#0ECB81] hover:bg-[#0bb372] rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {language === 'rw' ? 'Emeza Kwandikwa' : 'Approve Admission'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* TASK 5: PROFESSIONAL IMAGE & DOCUMENT ZOOM VIEWER */}
      {/* ======================================================== */}
      {inspectDoc && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fadeIn">
          {/* Zoom Viewer Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 bg-slate-900/90 border border-slate-700/60 rounded-2xl text-white shadow-2xl mb-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD535] shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  {inspectDoc.title}
                </h4>
                <span className="text-[10px] font-mono text-slate-400 block truncate">
                  {application.student_name} ({application.tracking_number})
                </span>
              </div>
            </div>

            {/* Interactive Zoom Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isPdf && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="px-2 py-1 text-xs font-mono font-bold text-[#FCD535] bg-black/50 rounded-lg min-w-[52px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(4, prev + 0.25))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1);
                      setFitMode('contain');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFitMode((prev) => (prev === 'contain' ? 'width' : 'contain'))}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    title="Toggle Fit Mode (Screen vs Width)"
                  >
                    {fitMode === 'contain' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{fitMode === 'contain' ? 'Fit Width' : 'Fit Screen'}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FCD535] hover:bg-[#E5A910] text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                title="Download original document"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'rw' ? 'Kandukura' : 'Download'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-1"
                title="Close Viewer (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Display Canvas */}
          <div className="flex-1 overflow-auto rounded-2xl bg-black/60 border border-slate-800 flex items-center justify-center p-4 relative select-none">
            {isPdf ? (
              <iframe
                src={inspectDoc.url}
                title={inspectDoc.title}
                className="w-full h-full rounded-xl border border-slate-700"
              />
            ) : (
              <div className="flex items-center justify-center min-w-full min-h-full">
                <img
                  src={inspectDoc.url}
                  alt={inspectDoc.title}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className={`rounded-lg shadow-2xl object-contain max-h-[80vh] ${
                    fitMode === 'width' ? 'w-full max-h-none' : 'max-w-full'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
