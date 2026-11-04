import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StockSchedule } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert,
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';

export const StockSchedulesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAccountant = user?.role === 'ACCOUNTANT';
  const isDirector = user?.role === 'DIRECTOR';

  const [schedules, setSchedules] = useState<StockSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [kigaliTime, setKigaliTime] = useState<string>('');
  const [scheduleStatus, setScheduleStatus] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StockSchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '06:00',
    endTime: '08:00',
    daysOfWeek: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    isActive: true,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deletion confirmation modal
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStatusAndSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/schedule-status');
      setScheduleStatus(res.data);
      setSchedules(res.data?.configuredSchedules || []);
      setKigaliTime(res.data?.kigaliTime || '');
    } catch (err) {
      console.error('Failed to load schedule status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndSchedules();
    const interval = setInterval(fetchStatusAndSchedules, 10000);
    return () => clearInterval(interval);
  }, []);

  const openAddModal = (template?: 'morning' | 'evening') => {
    setEditingSchedule(null);
    setErrorMsg(null);
    if (template === 'morning') {
      setFormData({
        name: 'Morning Kitchen Supply Window',
        startTime: '06:00',
        endTime: '08:00',
        daysOfWeek: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        isActive: true,
      });
    } else if (template === 'evening') {
      setFormData({
        name: 'Evening Dinner Supply Window',
        startTime: '17:00',
        endTime: '18:30',
        daysOfWeek: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        isActive: true,
      });
    } else {
      setFormData({
        name: 'Custom Kitchen Window',
        startTime: '06:00',
        endTime: '08:00',
        daysOfWeek: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (sch: StockSchedule) => {
    setEditingSchedule(sch);
    setErrorMsg(null);
    setFormData({
      name: sch.name,
      startTime: sch.start_time,
      endTime: sch.end_time,
      daysOfWeek: sch.days_of_week,
      isActive: sch.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAccountant) {
      setErrorMsg('Unauthorized: Only the Chief Accountant is permitted to modify Stock Out schedules.');
      return;
    }

    try {
      if (editingSchedule) {
        await api.put(`/settings/schedules/${editingSchedule.id}`, formData);
        setNotice(`Schedule "${formData.name}" updated successfully.`);
      } else {
        await api.post('/settings/schedules', formData);
        setNotice(`Schedule "${formData.name}" configured successfully.`);
      }
      setIsModalOpen(false);
      fetchStatusAndSchedules();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save schedule.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || !isAccountant) return;
    setDeleting(true);
    try {
      await api.delete(`/settings/schedules/${deleteId}`);
      setNotice('Schedule removed successfully.');
      setDeleteId(null);
      fetchStatusAndSchedules();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete schedule.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#172033] dark:text-[#F0F3F6] tracking-tight">
              {t('stockWorkingHours')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#059669]/10 text-[#059669] dark:bg-[#FCD535]/15 dark:text-[#FCD535] border border-[#059669]/20 dark:border-[#FCD535]/30">
              AFRICA/KIGALI ENFORCED
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A0AAB8] mt-1">
            {isAccountant
              ? 'Accountant configuration portal for kitchen issuing periods and working hour validation.'
              : 'Official working windows for kitchen food issues enforced by the Chief Accountant.'}
          </p>
        </div>

        {/* Action Controls: Accountant only */}
        {isAccountant ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white dark:text-slate-950 bg-[#1769FF] hover:bg-blue-700 dark:bg-[#FCD535] dark:hover:bg-[#E5A910] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('addSchedule')}</span>
            </button>
          </div>
        ) : isDirector ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#181D24] border border-[#E2E8F0] dark:border-[#2B3139] text-[11px] font-mono font-semibold text-[#64748B] dark:text-[#A0AAB8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1769FF] dark:text-[#FCD535]" />
            <span>{t('schedulesReadOnlyDirector')}</span>
          </div>
        ) : null}
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#059669] dark:text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* DIRECTOR AUDIT & AUTHORITY BANNER */}
      {isDirector && (
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-[#3B82F6]/10 border border-blue-200 dark:border-[#3B82F6]/30 text-xs text-[#172033] dark:text-[#F0F3F6] flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-[#1769FF] dark:text-[#3B82F6] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-[#1769FF] dark:text-[#3B82F6]">
              Chief Accountant Schedule Governance
            </strong>
            <p className="text-[#64748B] dark:text-[#A0AAB8] leading-relaxed">
              {t('schedulesAccountantOnly')} You can monitor all active windows, configured times, and audit histories below.
            </p>
          </div>
        </div>
      )}

      {/* ACCOUNTANT QUICK TEMPLATE STRIP */}
      {isAccountant && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181D24] border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#A0AAB8]">
            <Calendar className="w-4 h-4 text-[#1769FF] dark:text-[#FCD535]" />
            <span className="font-semibold text-[#172033] dark:text-[#F0F3F6]">Quick Period Presets:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAddModal('morning')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#202630] hover:bg-slate-200 dark:hover:bg-[#262D38] text-[#172033] dark:text-[#F0F3F6] border border-[#E2E8F0] dark:border-[#2B3139] transition-colors cursor-pointer"
            >
              + {t('morningWindow')} (06:00 - 08:00)
            </button>
            <button
              onClick={() => openAddModal('evening')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#202630] hover:bg-slate-200 dark:hover:bg-[#262D38] text-[#172033] dark:text-[#F0F3F6] border border-[#E2E8F0] dark:border-[#2B3139] transition-colors cursor-pointer"
            >
              + {t('eveningWindow')} (17:00 - 18:30)
            </button>
          </div>
        </div>
      )}

      {/* LIVE TIMEZONE & ENFORCEMENT BANNER (White theme: #FFFFFF, Dark theme: #181D24) */}
      <div className="bg-white dark:bg-[#181D24] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            scheduleStatus?.isPermitted
              ? 'bg-[#059669]/15 text-[#059669] dark:bg-[#0ECB81]/20 dark:text-[#0ECB81]'
              : 'bg-[#D97706]/15 text-[#D97706] dark:bg-[#F0B90B]/20 dark:text-[#F0B90B]'
          }`}>
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                scheduleStatus?.isPermitted
                  ? 'bg-[#059669]/15 text-[#059669] dark:bg-[#0ECB81]/15 dark:text-[#0ECB81] border border-[#059669]/30 dark:border-[#0ECB81]/30'
                  : 'bg-[#D97706]/15 text-[#D97706] dark:bg-[#F0B90B]/15 dark:text-[#F0B90B] border border-[#D97706]/30 dark:border-[#F0B90B]/30'
              }`}>
                {scheduleStatus?.isPermitted ? 'WINDOW CURRENTLY OPEN' : 'WINDOW CURRENTLY CLOSED'}
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#707A8A] font-mono">Timezone: Africa/Kigali (CAT)</span>
            </div>

            <p className="text-xs text-[#172033] dark:text-[#A0AAB8] font-medium">
              {scheduleStatus?.reason || 'Loading schedule validation...'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-right shrink-0">
          <span className="text-[10px] text-[#64748B] dark:text-[#707A8A] block uppercase font-mono font-bold">Server Clock</span>
          <span className="text-lg font-bold text-[#172033] dark:text-[#F0F3F6] font-mono tabular-nums">
            {scheduleStatus?.kigaliTime || '00:00'} CAT
          </span>
        </div>

      </div>

      {/* SCHEDULES LIST (White theme: #FFFFFF, Dark theme: #181D24) */}
      <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8EDF4] dark:border-[#252B33] bg-[#F8FAFC] dark:bg-[#11151B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-[#F0F3F6]">
              Authorized Stock Out Working Periods
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-[#202630] text-[#64748B] dark:text-[#A0AAB8]">
              {schedules.length}
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] font-mono">
            {isAccountant ? 'Configurable by You' : 'Governance: Chief Accountant'}
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] dark:text-[#707A8A] space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-[#707A8A]" />
            <p>No active schedules configured. Stock Out will remain locked until a window is added.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8EDF4] dark:divide-[#252B33]">
            {schedules.map((sch) => (
              <div
                key={sch.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-[#172033] dark:text-[#F0F3F6]">
                      {sch.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        sch.is_active === 1
                          ? 'bg-[#059669]/10 text-[#059669] dark:bg-[#0ECB81]/15 dark:text-[#0ECB81] border border-[#059669]/20 dark:border-[#0ECB81]/30'
                          : 'bg-slate-100 text-[#64748B] dark:bg-[#11151B] dark:text-[#707A8A]'
                      }`}
                    >
                      {sch.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-[#707A8A] font-mono">
                    <span className="font-bold text-[#172033] dark:text-[#FCD535]">
                      {sch.start_time} – {sch.end_time} CAT
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px]">{sch.days_of_week}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-[#1769FF] dark:text-[#FCD535]" />
                      <span>{sch.updated_by_name || 'Uwimana Claire (Chief Accountant)'}</span>
                    </span>
                  </div>
                </div>

                {/* Accountant Edit / Delete Controls */}
                {isAccountant ? (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(sch)}
                      className="p-2 text-[#64748B] hover:text-[#1769FF] dark:hover:text-[#FCD535] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors cursor-pointer"
                      title={t('editSchedule')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(sch.id)}
                      className="p-2 text-[#64748B] hover:text-[#DC2626] dark:hover:text-[#F6465D] hover:bg-rose-50 dark:hover:bg-[#F6465D]/15 rounded-lg transition-colors cursor-pointer"
                      title={t('deleteSchedule')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-mono self-end sm:self-center">
                    View Only
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCOUNTANT MODAL (Level 4: #FFFFFF in light, #202630 in dark) */}
      {isModalOpen && isAccountant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-2xl p-6 max-w-md w-full border border-[#E2E8F0] dark:border-[#2B3139] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF4] dark:border-[#252B33] pb-3">
              <h3 className="text-base font-bold text-[#172033] dark:text-[#F0F3F6] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1769FF] dark:text-[#FCD535]" />
                {editingSchedule ? t('editSchedule') : t('addSchedule')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#F6465D]/15 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                  Schedule Name / Purpose *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Morning Kitchen Supply Window"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                    Opening Time (CAT) *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                    Closing Time (CAT) *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                  Applicable Days
                </label>
                <input
                  type="text"
                  value={formData.daysOfWeek}
                  onChange={(e) => setFormData({ ...formData, daysOfWeek: e.target.value })}
                  placeholder="Mon,Tue,Wed,Thu,Fri,Sat,Sun"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1769FF] dark:text-[#FCD535] focus:ring-[#1769FF] dark:focus:ring-[#FCD535]"
                  />
                  <span className="text-xs font-semibold text-[#172033] dark:text-[#A0AAB8]">
                    Window is Active and Enforced by Stock Out API
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF4] dark:border-[#252B33]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#64748B] dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white dark:text-slate-950 bg-[#1769FF] hover:bg-blue-700 dark:bg-[#FCD535] dark:hover:bg-[#E5A910] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Schedule */}
      <ConfirmationModal
        isOpen={deleteId !== null}
        title={t('deleteSchedule')}
        message={t('deleteScheduleConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        confirmVariant="danger"
        iconType="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteId(null)}
      />

    </div>
  );
};
