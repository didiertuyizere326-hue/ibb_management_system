import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Application } from '../../types';
import { DocumentModal } from '../../components/common/DocumentModal';
import { ExportControls } from '../../components/common/ExportControls';
import { PaymentNoticeManager } from '../../components/common/PaymentNoticeManager';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  FileText,
  CreditCard
} from 'lucide-react';

export const DirectorAdmissions: React.FC = () => {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'applications' | 'paymentNotice'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admissions', {
        params: {
          status: statusFilter,
          level: levelFilter,
          department: deptFilter,
          search: searchQuery || undefined,
        },
      });
      setApplications(res.data?.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, levelFilter, deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admissions/${id}/decision`, {
        decision: 'Approved',
      });
      setActionNotice(language === 'rw' ? 'Dosiyeti yemejwe neza. Umunyeshuri yanditswe mu gitabo cy’abanyeshuri bemerewe.' : 'Application approved successfully. Student enrolled in official academic register.');
      fetchApplications();
      if (selectedApp?.id === id) {
        setSelectedApp(null);
      }
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || (language === 'rw' ? 'Kwemezwa byanze.' : 'Failed to approve application.'));
      setTimeout(() => setErrorNotice(null), 4000);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingAppId) return;
    if (!rejectionReason.trim()) {
      setErrorNotice(language === 'rw' ? 'Gusobanura impamvu ni itegeko mu kwanga dosiyeti.' : 'A clear institutional reason is mandatory when rejecting an application.');
      return;
    }

    try {
      await api.put(`/admissions/${rejectingAppId}/decision`, {
        decision: 'Rejected',
        reason: rejectionReason.trim(),
      });
      setActionNotice(language === 'rw' ? 'Dosiyeti yanzwe kandi impamvu yanditswe mu gitabo cy’ubuyobozi.' : 'Application rejected with official record justification.');
      setRejectingAppId(null);
      setRejectionReason('');
      fetchApplications();
      if (selectedApp?.id === rejectingAppId) {
        setSelectedApp(null);
      }
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err.response?.data?.error || (language === 'rw' ? 'Guhakana dosiyeti byanze.' : 'Failed to record rejection.'));
      setTimeout(() => setErrorNotice(null), 4000);
    }
  };

  // Export columns config
  const exportColumns = [
    { header: language === 'rw' ? 'Kode y’Ubusabe' : 'Tracking Number', key: 'tracking_number' },
    { header: language === 'rw' ? 'Amazina y’Umunyeshuri' : 'Student Full Name', key: 'student_name' },
    { header: language === 'rw' ? 'Igitsina' : 'Gender', key: 'gender' },
    { header: language === 'rw' ? 'Telefone' : 'Phone', key: 'phone' },
    { header: language === 'rw' ? 'Urwego' : 'Level', key: 'academic_level' },
    { header: language === 'rw' ? 'Ishami' : 'Department', key: 'department' },
    { header: language === 'rw' ? 'Amanota S3 (%)' : 'S3 Marks (%)', key: 's3_marks' },
    { header: language === 'rw' ? 'Imiterere' : 'Status', key: 'status' },
    { header: language === 'rw' ? 'Impamvu y’Icyemezo' : 'Decision Reason', key: 'decision_reason' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {t('admissionsEvalTitle')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              {language === 'rw' ? 'UBURYO BW’UMUYOBOZI' : 'DIRECTOR AUTHORIZED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {t('admissionsEvalDesc')}
          </p>
        </div>

        {/* Export and Print Controls */}
        <ExportControls
          title={language === 'rw' ? 'Igitabo cy’Abasabye Kwiga IBB' : 'Student Admissions Ledger'}
          data={applications}
          columns={exportColumns}
          fileNamePrefix="IBB_Admissions"
        />
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{actionNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-[#991B1B] dark:text-[#F6465D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorNotice}</span>
        </div>
      )}

      {/* SECTION TABS: Applications Dossiers vs Parent Payment Notice Image */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#252B33]">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'border-[#D97706] dark:border-[#FCD535] text-[#92400E] dark:text-[#FCD535]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F0F3F6]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('applicationsLedgerTab')} ({applications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paymentNotice')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'paymentNotice'
              ? 'border-[#D97706] dark:border-[#FCD535] text-[#92400E] dark:text-[#FCD535]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F0F3F6]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('paymentNoticeTab')}</span>
        </button>
      </div>

      {activeTab === 'paymentNotice' ? (
        <PaymentNoticeManager />
      ) : (
        <>
          {/* FILTER & SEARCH BAR (Level 3 Surface) */}
          <div className="bg-white dark:bg-[#181D24] rounded-xl p-3.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap items-center gap-3">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchApplicant')}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535]"
          />
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">{t('filterStatus')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="Pending">{language === 'rw' ? 'Bitegerejwe' : 'Pending'}</option>
            <option value="Under Review">{language === 'rw' ? 'Gusuzumwa' : 'Under Review'}</option>
            <option value="Approved">{language === 'rw' ? 'Byemejwe' : 'Approved'}</option>
            <option value="Rejected">{language === 'rw' ? 'Byanzwe' : 'Rejected'}</option>
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">{t('filterLevel')}:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allLevels')}</option>
            <option value="L3">L3</option>
            <option value="L4">L4</option>
            <option value="L5">L5</option>
          </select>
        </div>

        {/* Dept Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">{t('filterDept')}:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{t('allDepartments')}</option>
            <option value="Software Development">{language === 'rw' ? 'Ikoranabuhanga (Software)' : 'Software Development'}</option>
            <option value="Automobile Technology">{language === 'rw' ? 'Ubukanishi bw’Ibinyabiziga' : 'Automobile Technology'}</option>
          </select>
        </div>

      </div>

      {/* APPLICATIONS TABLE (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            {language === 'rw' ? 'Gushakisha dosiyeti z’abasaba kwiga...' : 'Filtering admission registers...'}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">{t('emptyState')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">{t('tblTracking')}</th>
                  <th className="py-3 px-4 font-bold">{t('tblCandidateName')}</th>
                  <th className="py-3 px-4 font-bold">{t('tblLevelTrade')}</th>
                  <th className="py-3 px-4 font-bold text-right">{t('tblS3Marks')}</th>
                  <th className="py-3 px-4 font-bold text-center">{t('tblBoarding')}</th>
                  <th className="py-3 px-4 font-bold text-center">{t('tblStatus')}</th>
                  <th className="py-3 px-4 font-bold text-right">{t('tblDecisionActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#3B82F6] dark:text-[#FCD535]">
                      {app.tracking_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                      {app.student_name}
                      <span className="block text-[10px] text-slate-400 dark:text-[#707A8A] font-mono font-normal">
                        {app.phone} · {app.residence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                      <span className="font-bold text-slate-900 dark:text-[#F0F3F6] font-mono">{app.academic_level}</span> · {app.department === 'Software Development' ? (language === 'rw' ? 'Software' : 'Software Dev') : (language === 'rw' ? 'Auto Tech' : 'Auto Tech')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={app.s3_marks >= 80 ? 'text-[#0ECB81]' : 'text-slate-700 dark:text-[#F0F3F6]'}>
                        {app.s3_marks}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {app.qualifies_boarding === 1 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                          {language === 'rw' ? 'Acumbika' : 'Eligible'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">
                          {language === 'rw' ? 'Umutaha' : 'Day Scholar'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        app.status === 'Approved'
                          ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                          : app.status === 'Pending'
                          ? 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30'
                          : app.status === 'Under Review'
                          ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                          : 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30'
                      }`}>
                        {app.status === 'Approved' && language === 'rw' ? 'Yemejwe'
                          : app.status === 'Pending' && language === 'rw' ? 'Bitegerejwe'
                          : app.status === 'Under Review' && language === 'rw' ? 'Gusuzumwa'
                          : app.status === 'Rejected' && language === 'rw' ? 'Yanzwe'
                          : app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-md border border-slate-200 dark:border-[#2B3139] inline-flex items-center gap-1 transition-colors"
                          title={language === 'rw' ? 'Suzuma dosiyeti yose n’inyandiko zashyizweho' : 'Inspect application dossier and documents'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('btnInspect')}</span>
                        </button>

                        {app.status !== 'Approved' && (
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-[#0ECB81] hover:bg-[#0bb372] rounded-md shadow-xs transition-colors"
                            title={language === 'rw' ? 'Emeza kwandikwa ako kanya' : 'Approve admission directly'}
                          >
                            {t('btnApprove')}
                          </button>
                        )}

                        {app.status !== 'Rejected' && (
                          <button
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setRejectionReason('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#F6465D] hover:bg-[#F6465D]/15 rounded-md border border-[#F6465D]/30 transition-colors"
                            title={language === 'rw' ? 'Hakana dosiyeti' : 'Reject application'}
                          >
                            {t('btnReject')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* INSPECTION MODAL */}
      {selectedApp && (
        <DocumentModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={(id) => handleApprove(id)}
          onReject={(id) => {
            setRejectingAppId(id);
            setSelectedApp(null);
          }}
        />
      )}

      {/* REJECTION REASON MODAL (Level 4 Elevated: #202630) */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6] flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#F6465D]" />
              {language === 'rw' ? 'Impamvu Yemewe yo Kwanga Dosiyeti' : 'Official Rejection Justification'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
              {language === 'rw'
                ? 'Amabwiriza y’ishuri asaba gutanga ibisobanuro byemewe (urugero: amanota ya S3 ari munsi y’ibipimo, umubare w’abanyeshuri wuzuye, cyangwa inyandiko zidahuye).'
                : 'Institutional policy requires documenting a valid administrative rationale (e.g. S3 score below cutoff, department quota exceeded, document discrepancy).'}
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={language === 'rw' ? 'Urugero: Amanota y’ikizamini cya Leta S3 ari munsi y’ibikenewe mu mwaka w’amashuri 2026-2027.' : 'e.g. S3 national exam score below departmental threshold for Academic Year 2026-2027.'}
              required
              className="w-full p-3 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#F6465D]"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#252B33]">
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors"
              >
                {language === 'rw' ? 'Hagarika' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F6465D] hover:bg-[#d93b50] rounded-lg shadow-sm transition-colors"
              >
                {language === 'rw' ? 'Emeza Kwanga' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
