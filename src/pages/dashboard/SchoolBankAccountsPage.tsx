import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SchoolBankAccount } from '../../types';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Star,
  Power,
  Building,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export const SchoolBankAccountsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAuthorized = user?.role === 'ACCOUNTANT' || user?.role === 'DIRECTOR';
  const isAccountant = user?.role === 'ACCOUNTANT';

  const [accounts, setAccounts] = useState<SchoolBankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<SchoolBankAccount | null>(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<SchoolBankAccount | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: 'Institut Baptiste de Buberuka (IBB)',
    institutionName: 'Institut Baptiste de Buberuka',
    branch: '',
    swiftCode: '',
    currency: 'RWF',
    paymentInstructions: 'Include student applicant tracking ID on the bank deposit slip or mobile transfer note.',
    isPrimary: false,
    isActive: true,
    displayOrder: 1,
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/bank-accounts');
      setAccounts(res.data?.accounts || []);
    } catch (err: any) {
      console.error('Failed to load bank accounts:', err);
      setError(err.response?.data?.error || 'Failed to load school bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountNumber: '',
      accountHolder: 'Institut Baptiste de Buberuka (IBB)',
      institutionName: 'Institut Baptiste de Buberuka',
      branch: '',
      swiftCode: '',
      currency: 'RWF',
      paymentInstructions: 'Include student applicant tracking ID on the bank deposit slip or mobile transfer note.',
      isPrimary: accounts.length === 0,
      isActive: true,
      displayOrder: accounts.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (acc: SchoolBankAccount) => {
    setEditingAccount(acc);
    setFormData({
      bankName: acc.bank_name,
      accountNumber: acc.account_number,
      accountHolder: acc.account_holder,
      institutionName: acc.institution_name,
      branch: acc.branch || '',
      swiftCode: acc.swift_code || '',
      currency: acc.currency || 'RWF',
      paymentInstructions: acc.payment_instructions || '',
      isPrimary: acc.is_primary === 1,
      isActive: acc.is_active === 1,
      displayOrder: acc.display_order || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName.trim() || !formData.accountNumber.trim()) {
      setError('Bank name and account number are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingAccount) {
        await api.put(`/settings/bank-accounts/${editingAccount.id}`, formData);
        setNotice(`Bank account "${formData.bankName}" updated successfully.`);
      } else {
        await api.post('/settings/bank-accounts', formData);
        setNotice(`Bank account "${formData.bankName}" registered successfully.`);
      }
      setIsModalOpen(false);
      fetchAccounts();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save bank account.');
      setTimeout(() => setError(null), 4500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (acc: SchoolBankAccount) => {
    try {
      const res = await api.put(`/settings/bank-accounts/${acc.id}/toggle`);
      setNotice(res.data?.message || 'Account status updated.');
      fetchAccounts();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle account status.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleSetPrimary = async (acc: SchoolBankAccount) => {
    try {
      await api.put(`/settings/bank-accounts/${acc.id}`, { isPrimary: true });
      setNotice(`${acc.bank_name} is now the primary payment channel.`);
      fetchAccounts();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set primary account.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAccountTarget) return;
    try {
      await api.delete(`/settings/bank-accounts/${deleteAccountTarget.id}`);
      setNotice(`Account ${deleteAccountTarget.bank_name} removed successfully.`);
      setDeleteAccountTarget(null);
      fetchAccounts();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account.');
      setTimeout(() => setError(null), 4000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-2xl mx-auto rounded-2xl bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-center space-y-3 mt-10">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Permission Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-[#A0AAB8]">
          School bank account configuration is strictly restricted to the Chief Accountant and School Director.
        </p>
      </div>
    );
  }

  const activeCount = accounts.filter((a) => a.is_active === 1).length;

  return (
    <div className="space-y-6 max-w-6xl animate-fadeIn">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-[#252B33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              School Bank Accounts & Payment Channels
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              ACCOUNTANT MANAGED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            Configure institutional bank accounts and mobile merchant codes displayed on the public parent payment notice page.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3139] text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] transition-colors cursor-pointer"
            title="Refresh bank accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-[#065F46] dark:text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-[#991B1B] dark:text-[#F6465D] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">Total Accounts</div>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{accounts.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#0ECB81] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">Active on Public Portal</div>
            <div className="text-xl font-black text-emerald-600 dark:text-[#0ECB81] tabular-nums">{activeCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">Primary Channel</div>
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
              {accounts.find((a) => a.is_primary === 1)?.bank_name || 'None Selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Accounts Table / Cards */}
      <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#252B33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FCD535]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6]">
              Configured Payment Channels & Bank Institutions
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {accounts.length} {accounts.length === 1 ? 'channel' : 'channels'} registered
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#202630] flex items-center justify-center mx-auto text-slate-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-xs">No school bank accounts have been configured yet.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Bank Account</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#252B33]">
            {accounts.map((acc) => {
              const isPrimary = acc.is_primary === 1;
              const isActive = acc.is_active === 1;

              return (
                <div
                  key={acc.id}
                  className={`p-5 sm:p-6 transition-colors hover:bg-slate-50/70 dark:hover:bg-[#1E2329]/50 ${
                    !isActive ? 'opacity-60 bg-slate-50/40 dark:bg-[#14181E]/40' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Bank Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-[#F0F3F6]">
                          {acc.bank_name}
                        </span>

                        {isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/20 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/40">
                            <Star className="w-3 h-3 fill-[#FCD535]" />
                            <span>PRIMARY</span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-500/15 text-[#065F46] dark:text-[#0ECB81] border border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#0ECB81]' : 'bg-slate-400'}`} />
                          <span>{isActive ? 'ACTIVE ON PORTAL' : 'DISABLED'}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8]">
                          {acc.currency || 'RWF'}
                        </span>
                      </div>

                      {/* Account Number with 1-click copy */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139]">
                          <span className="text-[10px] font-mono uppercase text-slate-400">Account No:</span>
                          <span className="font-mono text-sm font-black text-slate-900 dark:text-[#FCD535] tracking-wide">
                            {acc.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.account_number, acc.id)}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedId === acc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {acc.branch && (
                          <span className="text-xs text-slate-500 dark:text-[#A0AAB8]">
                            Branch: <strong className="text-slate-700 dark:text-slate-300">{acc.branch}</strong>
                          </span>
                        )}

                        {acc.swift_code && (
                          <span className="text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
                            SWIFT: <strong className="text-slate-700 dark:text-slate-300">{acc.swift_code}</strong>
                          </span>
                        )}
                      </div>

                      {/* Beneficiary & Instructions */}
                      <div className="text-xs text-slate-600 dark:text-[#A0AAB8] space-y-0.5">
                        <div>
                          Beneficiary:{' '}
                          <span className="font-semibold text-slate-800 dark:text-[#F0F3F6]">
                            {acc.account_holder}
                          </span>
                        </div>
                        {acc.payment_instructions && (
                          <div className="text-[11px] text-slate-500 dark:text-[#707A8A] italic">
                            Parent Note: {acc.payment_instructions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-[#252B33]">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(acc)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#202630] text-slate-700 dark:text-[#A0AAB8] hover:bg-[#FCD535]/20 hover:text-[#B37800] dark:hover:text-[#FCD535] transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Set as primary payment channel"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Make Primary</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleActive(acc)}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title={isActive ? 'Disable account from public display' : 'Activate account for parents'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(acc)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-[#202630] text-slate-700 dark:text-[#A0AAB8] hover:bg-slate-200 dark:hover:bg-[#2B3139] transition-colors cursor-pointer"
                        title="Edit account details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteAccountTarget(acc)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Parent Preview Card */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#14181E] border border-slate-200 dark:border-[#252B33] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6] font-mono">
              Live Parent Preview on Admissions Page
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">Synchronized directly with public admissions page</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.filter((a) => a.is_active === 1).map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-xl bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-[#F0F3F6]">{acc.bank_name}</span>
                {acc.is_primary === 1 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FCD535]/20 text-[#B37800] dark:text-[#FCD535]">
                    PRIMARY
                  </span>
                )}
              </div>
              <div className="font-mono text-sm font-black text-slate-900 dark:text-[#FCD535]">
                {acc.account_number}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-[#A0AAB8]">
                {acc.account_holder} {acc.branch ? `(${acc.branch})` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-[#181D24] rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6]">
                {editingAccount ? 'Edit School Bank Account' : 'Register New Payment Channel'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Bank / Channel Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Kigali, Equity Bank, MTN MoMo Pay"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                    Account / Merchant Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 00040-0694231-89"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="RWF">RWF (Rwanda Francs)</option>
                    <option value="USD">USD (US Dollars)</option>
                    <option value="EUR">EUR (Euros)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Account Holder / Beneficiary Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Institut Baptiste de Buberuka (IBB)"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Musanze Branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                    SWIFT / BIC Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BKIORWRW"
                    value={formData.swiftCode}
                    onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Parent Payment Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include student applicant tracking ID on the bank deposit slip"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-[#F0F3F6]">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FCD535] focus:ring-[#FCD535]"
                  />
                  <span>Mark as Primary Payment Channel</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-[#F0F3F6]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FCD535] focus:ring-[#FCD535]"
                  />
                  <span>Publish to Parents (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-[#252B33]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteAccountTarget)}
        title="Delete School Bank Account?"
        message={`Are you sure you want to remove ${deleteAccountTarget?.bank_name} (${deleteAccountTarget?.account_number})? This action will be audited and removed from public view.`}
        confirmText="Yes, Delete Account"
        cancelText="Cancel"
        confirmVariant="danger"
        iconType="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteAccountTarget(null)}
      />
    </div>
  );
};
