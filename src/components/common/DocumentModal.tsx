import React from 'react';
import { Application } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, FileText, UserCheck, Calendar, Phone, Mail, MapPin, GraduationCap } from 'lucide-react';

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
  if (!application) return null;

  return (
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
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] rounded-lg transition-colors"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#707A8A]">
              {language === 'rw' ? 'Inyandiko n’Ibyemezo Byashyizweho' : 'Attached Verification Documents'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* S3 Result Slip */}
              <div className="border border-slate-200 dark:border-[#2B3139] rounded-lg p-3 bg-slate-50 dark:bg-[#181D24]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#3B82F6] dark:text-[#FCD535]" />
                    {language === 'rw' ? 'Icyemezo cy’Amanota S3' : 'S3 Result Slip'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">NESA Verified</span>
                </div>
                {application.result_slip_url ? (
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#11151B] flex items-center justify-center">
                    <img
                      src={application.result_slip_url}
                      alt="S3 Result Slip"
                      className="max-h-full max-w-full object-contain"
                    />
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
              <div className="border border-slate-200 dark:border-[#2B3139] rounded-lg p-3 bg-slate-50 dark:bg-[#181D24]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#0ECB81]" />
                    {language === 'rw' ? 'Ifoto ya Pasiporo' : 'Passport Photo'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">Identity File</span>
                </div>
                {application.passport_photo_url ? (
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#11151B] flex items-center justify-center">
                    <img
                      src={application.passport_photo_url}
                      alt="Student Portrait"
                      className="max-h-full max-w-full object-contain"
                    />
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
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-200 dark:hover:bg-[#262D38] rounded-lg transition-colors"
          >
            {language === 'rw' ? 'Funga' : 'Close'}
          </button>

          {application.status !== 'Approved' && onApprove && onReject && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onReject(application.id)}
                className="px-3 py-2 text-xs font-semibold text-[#F6465D] bg-[#F6465D]/10 hover:bg-[#F6465D]/20 border border-[#F6465D]/30 rounded-lg transition-colors"
              >
                {language === 'rw' ? 'Hakana ubihe impamvu' : 'Reject with Reason'}
              </button>
              <button
                onClick={() => onApprove(application.id)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#0ECB81] hover:bg-[#0bb372] rounded-lg shadow-sm transition-colors"
              >
                {language === 'rw' ? 'Emeza Kwandikwa' : 'Approve Admission'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
