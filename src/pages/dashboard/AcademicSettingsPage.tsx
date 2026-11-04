import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Sliders, CheckCircle2, AlertCircle, Save, ShieldCheck, CreditCard, Image as ImageIcon } from 'lucide-react';
import { PaymentNoticeManager } from '../../components/common/PaymentNoticeManager';

export const AcademicSettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'criteria' | 'notice'>('criteria');
  const [settings, setSettings] = useState({
    min_admission_marks: 55.0,
    boarding_threshold: 80.0,
    auto_reject_below_min: 0,
    academic_year: '2026-2027',
    is_admission_open: 1,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings/academic');
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Failed to load academic settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      await api.put('/settings/academic', {
        minAdmissionMarks: settings.min_admission_marks,
        boardingThreshold: settings.boarding_threshold,
        autoRejectBelowMin: settings.auto_reject_below_min === 1,
        academicYear: settings.academic_year,
        isAdmissionOpen: settings.is_admission_open === 1,
      });
      setNotice('Institutional academic grading and admission criteria updated successfully.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update settings.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fadeIn">
      
      <div className="pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
            Academic & Admission Settings
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
            DIRECTOR PORTAL
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
          Configure institutional cutoff criteria, admission grading policies, and publish the official parent fee voucher notice image.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'criteria'
                ? 'bg-[#FCD535] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#1E2329] text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Grading Criteria & Cutoffs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notice')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'notice'
                ? 'bg-[#FCD535] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#1E2329] text-slate-600 dark:text-[#A0AAB8] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Parent Payment Notice Image</span>
          </button>
        </div>
      </div>

      {activeTab === 'notice' ? (
        <PaymentNoticeManager defaultAcademicYear={settings.academic_year} />
      ) : (
        <>
          {notice && (
            <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{notice}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-[#991B1B] dark:text-[#F6465D] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="bg-white dark:bg-[#181D24] rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-[#2B3139] shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Minimum Admission Marks */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                Minimum Admission Cutoff Score (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={settings.min_admission_marks}
                  onChange={(e) => setSettings({ ...settings, min_admission_marks: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                />
                <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400 dark:text-[#707A8A]">%</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#707A8A]">
                Applicants below this score require special Director review or rejection. Initial rule: &lt;50% is failing.
              </span>
            </div>

            {/* Boarding Threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                Boarding Qualification Threshold (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={settings.boarding_threshold}
                  onChange={(e) => setSettings({ ...settings, boarding_threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono tabular-nums focus:outline-none focus:border-[#FCD535]"
                />
                <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400 dark:text-[#707A8A]">%</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#707A8A]">
                Applicants scoring above this mark automatically qualify for priority campus dormitory consideration (Policy: &ge;80%).
              </span>
            </div>

            {/* Academic Session */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                Active Academic Year
              </label>
              <input
                type="text"
                value={settings.academic_year}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              />
              <span className="text-[10px] text-slate-500 dark:text-[#707A8A]">
                Printed on official admission approval letters and campus registers.
              </span>
            </div>

            {/* Admissions Intake Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                Public Online Admissions Status
              </label>
              <select
                value={settings.is_admission_open}
                onChange={(e) => setSettings({ ...settings, is_admission_open: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
              >
                <option value={1}>Open for New Registrations</option>
                <option value={0}>Closed (Registration Window Concluded)</option>
              </select>
              <span className="text-[10px] text-slate-500 dark:text-[#707A8A]">
                Controls the active status of the public application portal.
              </span>
            </div>

          </div>

          {/* Auto Reject Toggle */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#252B33]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_reject_below_min === 1}
                onChange={(e) => setSettings({ ...settings, auto_reject_below_min: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 rounded text-[#FCD535] mt-0.5 focus:ring-[#FCD535]"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-[#F0F3F6] block">
                  Enable Automatic System Rejection Below Minimum Cutoff Score
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#A0AAB8] leading-relaxed block mt-0.5">
                  When enabled, applications submitted with an S3 score strictly below the configured cutoff ({settings.min_admission_marks}%) will be automatically marked as Rejected with the policy explanation recorded.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#252B33] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] disabled:opacity-50 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Save Academic Policy Settings'}</span>
            </button>
          </div>

        </form>
      </div>
        </>
      )}

    </div>
  );
};
