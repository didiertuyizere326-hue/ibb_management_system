import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Printer,
  GraduationCap,
  FileText,
  Calendar,
  Building,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';

export const TrackApplicationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const isStaffUser = isAuthenticated && !!user && ['DIRECTOR', 'ACCOUNTANT', 'ANIMATOR'].includes(user.role);
  const [searchParams] = useSearchParams();

  const [trackingNumber, setTrackingNumber] = useState<string>(
    searchParams.get('ref') || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [application, setApplication] = useState<any | null>(null);

  const fetchStatus = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setApplication(null);

    try {
      const res = await api.get(`/admissions/track/${ref.trim()}`);
      if (res.data?.application) {
        setApplication(res.data.application);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          `No application record found for tracking number "${ref}". Please check the reference code.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      fetchStatus(ref);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(trackingNumber);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="py-12 lg:py-16 bg-slate-50 dark:bg-[#0B0E11] min-h-screen text-slate-900 dark:text-[#F0F3F6] transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto no-print">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-2">
            Application Status Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('trackTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] mt-2 leading-relaxed">
            {t('trackSubtitle')}
          </p>
        </div>

        {/* Staff Inspection View Banner */}
        {isStaffUser && user && (
          <div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-[#3B82F6]/10 border border-blue-500/30 dark:border-[#3B82F6]/30 text-xs text-blue-900 dark:text-[#38BDF8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-[#3B82F6] dark:text-[#38BDF8] shrink-0" />
              <div>
                <strong className="block font-bold">
                  {language === 'rw' ? 'Uburyo bwo Gusuzuma ku Mukozi' : 'Staff Verification Mode'}
                </strong>
                <span className="text-slate-600 dark:text-[#A0AAB8]">
                  {language === 'rw'
                    ? `Wiyandikishije nka ${user.full_name} (${user.role}). Ushobora gushakisha no kureba ibyemezo by’abanyeshuri hano.`
                    : `Active staff session: ${user.full_name} (${user.role}). You may inspect tracking vouchers and status details.`}
                </span>
              </div>
            </div>
            <Link
              to={user.role === 'DIRECTOR' ? '/dashboard/director/admissions' : `/dashboard/${user.role.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-[11px] whitespace-nowrap transition-colors"
            >
              <span>{user.role === 'DIRECTOR' ? 'Admissions Management' : 'Return to Dashboard'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Search Bar (Binance Level 3 Surface) */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-[#2B3139] shadow-sm no-print">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3.5 top-3" />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter Reference (e.g. IBB-2026-0001)"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] uppercase font-mono tracking-wider focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {loading ? 'Verifying...' : t('checkStatusBtn')}
            </button>
          </form>

          {/* Sample quick test pills */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#A0AAB8]">
            <span>Test Codes:</span>
            {['IBB-2026-0001', 'IBB-2026-0002', 'IBB-2026-0004'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setTrackingNumber(code);
                  fetchStatus(code);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#202630] border border-transparent dark:border-[#2B3139] text-slate-700 dark:text-[#F0F3F6] hover:border-[#FCD535] text-[10px] font-mono cursor-pointer transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-rose-700 dark:text-[#F6465D] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* RESULTS CARD */}
        {application && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Status Header Banner */}
            <div className="bg-white dark:bg-[#181D24] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#2B3139]">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#FCD535]">
                    Tracking Number: {application.tracking_number}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {application.student_name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#A0AAB8]">
                    Program: {application.academic_level} · {application.department}
                  </p>
                </div>

                {/* Status Badges */}
                <div>
                  {application.status === 'Approved' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-[#0ECB81]/10 text-[#0ECB81] border border-emerald-200 dark:border-[#0ECB81]/30 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('statusApproved')}</span>
                    </div>
                  )}
                  {application.status === 'Pending' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-[#F0B90B]/10 text-[#F0B90B] border border-amber-200 dark:border-[#F0B90B]/30 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      <span>{t('statusPending')}</span>
                    </div>
                  )}
                  {application.status === 'Under Review' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-[#38BDF8]/10 text-[#38BDF8] border border-blue-200 dark:border-[#38BDF8]/30 font-bold text-xs">
                      <FileText className="w-4 h-4" />
                      <span>{t('statusReview')}</span>
                    </div>
                  )}
                  {application.status === 'Rejected' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 text-[#F6465D] border border-rose-200 dark:border-[#F6465D]/30 font-bold text-xs">
                      <XCircle className="w-4 h-4" />
                      <span>{t('statusRejected')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Specific Content */}
              {application.status === 'Approved' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#0ECB81]/10 border border-emerald-200/80 dark:border-[#0ECB81]/30 text-xs text-emerald-900 dark:text-[#0ECB81] leading-relaxed space-y-2">
                    <p className="font-semibold text-sm">
                      {language === 'rw'
                        ? 'Urakoze cyane! Ubusabe bwawe bwo kwiga bwaremejwe n’Umuyobozi w’Ishuri.'
                        : 'Congratulations! Your application has been approved by the School Director.'}
                    </p>
                    <p className="text-slate-700 dark:text-[#A0AAB8]">
                      {language === 'rw'
                        ? 'Wamaze kwemererwa kwiga muri Institut Baptiste de Buberuka mu mwaka w’amashuri 2026-2027. Kanda hasi wandukure ibaruwa y’agateganyo maze uzazane inyandiko z’umwimerere ku ishuri.'
                        : 'You are officially admitted into Institut Baptiste de Buberuka for the 2026-2027 Academic Year. Please print your provisional admission letter below and bring required physical documents to the school campus.'}
                    </p>
                    {application.qualifies_boarding === 1 && (
                      <div className="pt-1 font-bold text-[#0ECB81]">
                        {language === 'rw'
                          ? `✓ Amacumbi y’Ishuri: Wemerewe gucumbika mu kigo (Amanota ya S3: ${application.s3_marks}%)`
                          : `✓ Boarding Accommodation Status: Approved for School Dormitory (S3 Score: ${application.s3_marks}%)`}
                      </div>
                    )}
                  </div>

                  {/* PROVISIONAL ADMISSION LETTER FORMAT */}
                  <div className="p-8 border-2 border-slate-300 dark:border-[#2B3139] rounded-2xl bg-white dark:bg-[#202630] text-slate-900 dark:text-[#F0F3F6] space-y-6 shadow-sm print:shadow-none">
                    
                    {/* Official Letterhead */}
                    <div className="text-center pb-4 border-b border-slate-200 dark:border-[#2B3139] space-y-1">
                      <h3 className="text-base font-extrabold tracking-wide uppercase">
                        INSTITUT BAPTISTE DE BUBERUKA (IBB)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#A0AAB8]">
                        {language === 'rw' ? "Repubulika y'u Rwanda · Intara y'Amajyaruguru · Buberuka" : 'Republic of Rwanda · Northern Province · Buberuka'}
                      </p>
                      <p className="text-[11px] font-semibold text-[#FCD535]">
                        {language === 'rw' ? 'ICYEMEZO CY’AGATEGANYO CYO KWEMERERWA KWIGA — 2026-2027' : 'PROVISIONAL ADMISSION VOUCHER — ACADEMIC YEAR 2026-2027'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Amazina y’Umunyeshuri:' : 'Student Name:'}
                        </span>
                        <strong className="text-sm">{application.student_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Kode y’Icyemezo:' : 'Reference Code:'}
                        </span>
                        <strong className="text-sm font-mono text-[#FCD535]">{application.tracking_number}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Urwego Yemerewe:' : 'Admitted Level:'}
                        </span>
                        <strong>{application.academic_level}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Ishami:' : 'Department:'}
                        </span>
                        <strong>{application.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Amanota NESA S3:' : 'NESA S3 Verified Score:'}
                        </span>
                        <strong className="font-mono text-[#0ECB81]">{application.s3_marks}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">
                          {language === 'rw' ? 'Amacumbi:' : 'Accommodation:'}
                        </span>
                        <strong>
                          {application.qualifies_boarding
                            ? (language === 'rw' ? 'Umunyeshuri Ucumbika' : 'Boarding Student')
                            : (language === 'rw' ? 'Umunyeshuri Umutaha' : 'Day Scholar')}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-[#2B3139] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A0AAB8]">
                      <div>
                        <span>{language === 'rw' ? 'Byemejwe na:' : 'Approved by:'} <strong>Rev. Habimana Celestin</strong> ({language === 'rw' ? 'Umuyobozi w’Ishuri' : 'School Director'})</span>
                      </div>
                      <div className="font-mono text-[10px] text-[#FCD535]">
                        {language === 'rw' ? 'Kasi: IBB-BYEMEJWE-KU-MUGARAGARO' : 'Stamp: IBB-OFFICIAL-VERIFIED'}
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end no-print">
                    <button
                      onClick={handlePrintVoucher}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{t('printLetter')}</span>
                    </button>
                  </div>
                </div>
              )}

              {application.status === 'Rejected' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-rose-800 dark:text-[#F6465D] space-y-2">
                  <span className="font-bold block text-sm">
                    {t('rejectionReasonLabel')}
                  </span>
                  <p className="leading-relaxed text-slate-700 dark:text-[#F0F3F6]">
                    {application.decision_reason || (language === 'rw' ? 'Amanota ntabwo ahuye n’ibikenewe mu gipimo cy’uyu mwaka w’amashuri.' : 'Academic performance does not meet institutional quota requirements for this academic session.')}
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-[#F6465D] pt-2">
                    {language === 'rw'
                      ? 'Niba ukeneye ubusobanuro bwimbitse cyangwa inama, wagana ibiro by’Ushinzwe Amasomo muri IBB.'
                      : 'For additional counseling or clarification, please reach out directly to the IBB Academic Registrar.'}
                  </p>
                </div>
              )}

              {(application.status === 'Pending' || application.status === 'Under Review') && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-[#38BDF8]/10 border border-blue-200 dark:border-[#38BDF8]/30 text-xs text-blue-900 dark:text-[#38BDF8] space-y-2 leading-relaxed">
                  <p className="font-semibold">
                    {language === 'rw'
                      ? 'Ubusabe bwawe buracyasuzumwa n’Umuyobozi hamwe n’inama ishinzwe kwakira abanyeshuri.'
                      : 'Your application is currently being evaluated by the Director and admissions board.'}
                  </p>
                  <p className="text-slate-700 dark:text-[#A0AAB8]">
                    {language === 'rw'
                      ? `Isuzuma ry’amanota y’ikizamini cya Leta S3 hamwe n’imyanya iri mu mashami rirakomeje. Bika kode yawe y’ubusabe ${application.tracking_number} kugira ngo uzongere urebe aho dosiyeti yawe igeze.`
                      : `Verification of S3 national marks and class capacities is underway. Please retain your tracking reference ${application.tracking_number} to check back.`}
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
