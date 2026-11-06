import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PaymentNotice } from '../../types';
import { ConfirmationModal } from './ConfirmationModal';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  Building,
  CreditCard,
  FileText,
  ShieldCheck,
  Power,
  Download
} from 'lucide-react';

interface PaymentNoticeManagerProps {
  defaultAcademicYear?: string;
}

export const PaymentNoticeManager: React.FC<PaymentNoticeManagerProps> = ({ defaultAcademicYear }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isDirector = user?.role === 'DIRECTOR';

  const [activeNotice, setActiveNotice] = useState<PaymentNotice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload & Form State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [title, setTitle] = useState<string>('Official Tuition & Boarding Fees Bank Payment Voucher (Academic Year 2026-2027)');
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear || '2026-2027');
  const [description, setDescription] = useState<string>(
    'Notice for parents of admitted students: All tuition and boarding fees must be deposited directly into the official IBB bank accounts listed below. Always indicate the student tracking reference on the bank slip.'
  );
  const [bankName, setBankName] = useState<string>('Bank of Kigali (BK)');
  const [accountNumber, setAccountNumber] = useState<string>('00040-0694231-89');
  const [accountName, setAccountName] = useState<string>('Institut Baptiste de Buberuka (IBB)');

  // Modal / Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/payment-notice');
      setActiveNotice(res.data?.notice || null);
    } catch (err) {
      console.error('Failed to fetch payment notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotice();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please upload a smaller optimized image.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) {
      setErrorMessage('Please select or upload a payment notice image.');
      return;
    }

    setPublishing(true);
    setErrorMessage(null);

    try {
      await api.post('/settings/payment-notice', {
        title,
        description,
        imageUrl: previewImage,
        bankName,
        accountNumber,
        accountName,
        academicYear: academicYear || defaultAcademicYear || '2026-2027',
      });

      setNoticeMessage('Parent Payment Notice image published successfully! It is now live on the public admissions page.');
      setIsUploadOpen(false);
      setPreviewImage('');
      fetchNotice();
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to publish payment notice.');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleActive = async () => {
    if (!activeNotice) return;
    try {
      const res = await api.put(`/settings/payment-notice/${activeNotice.id}/toggle`);
      setNoticeMessage(res.data?.message || 'Notice status updated.');
      fetchNotice();
      setTimeout(() => setNoticeMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to toggle notice visibility.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeNotice) return;
    try {
      await api.delete(`/settings/payment-notice/${activeNotice.id}`);
      setConfirmDeleteOpen(false);
      setNoticeMessage('Payment notice was successfully removed.');
      fetchNotice();
      setTimeout(() => setNoticeMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete payment notice.');
    }
  };

  if (!isDirector) {
    return (
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-center text-xs text-slate-500">
        Parent payment notice configuration is exclusively managed by the School Director.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#252B33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              Parent Payment Notice & Bank Voucher Image Management
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              DIRECTOR ONLY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#707A8A]">
            Upload, publish, replace, or deactivate the official school fees payment voucher image displayed on the public admissions page for parents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsUploadOpen(!isUploadOpen);
              if (!isUploadOpen && activeNotice) {
                setTitle(activeNotice.title);
                setDescription(activeNotice.description || '');
                setBankName(activeNotice.bank_name || 'Bank of Kigali (BK)');
                setAccountNumber(activeNotice.account_number || '00040-0694231-89');
                setAccountName(activeNotice.account_name || 'Institut Baptiste de Buberuka (IBB)');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4 stroke-[2.2]" />
            <span>{isUploadOpen ? 'Close Form' : activeNotice ? 'Replace Image / Notice' : 'Upload New Notice'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {noticeMessage && (
        <div className="m-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-[#065F46] dark:text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{noticeMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="m-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-[#991B1B] dark:text-[#F6465D] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Upload & Form Section */}
      {isUploadOpen && (
        <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-[#11151B]/80 border-b border-slate-200 dark:border-[#252B33] animate-fadeIn">
          <form onSubmit={handlePublish} className="space-y-4 max-w-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#F0F3F6] font-mono">
              Publish or Replace Parent Payment Notice
            </h4>

            {/* File Upload Dropzone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                Payment Voucher Image (PNG, JPG, WEBP, Max 5MB) *
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-[#2B3139] hover:border-[#FCD535] rounded-xl p-5 text-center bg-white dark:bg-[#181D24] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#202630] flex items-center justify-center text-slate-500 dark:text-[#A0AAB8]">
                    <Upload className="w-5 h-5 text-[#FCD535]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#F0F3F6]">
                    Click or drag payment slip image here
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    PNG, JPG, WEBP up to 5MB
                  </span>
                </div>
              </div>
            </div>

            {/* Live Image Preview */}
            {previewImage && (
              <div className="p-3 bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-[#707A8A]">
                  Image Preview:
                </span>
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-[#2B3139] max-h-64 flex items-center justify-center bg-slate-900/10">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-64 w-auto object-contain mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Title & Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Official Notice Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Primary Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  placeholder="e.g. Bank of Kigali (BK)"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  placeholder="e.g. 00040-0694231-89"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Account Beneficiary Name *
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  placeholder="e.g. Institut Baptiste de Buberuka (IBB)"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  Parent Instructions & Fee Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#252B33]">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-200 dark:hover:bg-[#202630] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing || !previewImage}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish to Admissions Page'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Currently Published Notice Display */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Loading published notice...
          </div>
        ) : !activeNotice ? (
          <div className="p-8 text-center text-slate-500 dark:text-[#707A8A] space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#202630] flex items-center justify-center mx-auto text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs">No active payment notice currently published.</p>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] rounded-xl cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Official Payment Voucher</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Notice Image Card */}
            <div className="lg:col-span-5 space-y-2">
              <div
                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-slate-100 dark:bg-[#11151B] aspect-4/3 flex items-center justify-center cursor-pointer group shadow-sm"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={activeNotice.image_url}
                  alt={activeNotice.title}
                  className="w-full h-full object-contain mx-auto group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Click to Enlarge Fullscreen</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1">
                <span>Aspect: Preserved</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeNotice?.image_url) return;
                    try {
                      const res = await fetch(activeNotice.image_url);
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `IBB_Payment_Notice_${activeNotice.academic_year || '2026'}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch {
                      const a = document.createElement('a');
                      a.href = activeNotice.image_url;
                      a.download = `IBB_Payment_Notice_${activeNotice.academic_year || '2026'}.png`;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#202630] hover:bg-[#FCD535] hover:text-slate-950 text-slate-700 dark:text-[#F0F3F6] font-sans font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            {/* Notice Metadata & Controls */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      activeNotice.is_active === 1
                        ? 'bg-emerald-500/15 text-[#065F46] dark:text-[#0ECB81] border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-[#202630] text-slate-600 dark:text-[#A0AAB8]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeNotice.is_active === 1 ? 'bg-[#0ECB81] animate-pulse' : 'bg-slate-400'}`} />
                      <span>{activeNotice.is_active === 1 ? 'LIVE ON ADMISSIONS PAGE' : 'HIDDEN / DISABLED'}</span>
                    </span>
                    {activeNotice.academic_year && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
                        {activeNotice.academic_year}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      ID #{activeNotice.id}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6]">
                    {activeNotice.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                      activeNotice.is_active === 1
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                    title={activeNotice.is_active === 1 ? 'Temporarily hide from parents' : 'Publish live to parents'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Remove Payment Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bank Coordinates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200/80 dark:border-[#252B33] text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#707A8A] block">
                    Designated Bank:
                  </span>
                  <strong className="text-slate-900 dark:text-[#F0F3F6] font-semibold">
                    {activeNotice.bank_name || 'Bank of Kigali (BK)'}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#707A8A] block">
                    Account Number:
                  </span>
                  <strong className="text-slate-900 dark:text-[#FCD535] font-mono font-bold">
                    {activeNotice.account_number || '00040-0694231-89'}
                  </strong>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-[#707A8A] block">
                    Account Beneficiary:
                  </span>
                  <strong className="text-slate-900 dark:text-[#F0F3F6] font-semibold">
                    {activeNotice.account_name || 'Institut Baptiste de Buberuka (IBB)'}
                  </strong>
                </div>
              </div>

              {activeNotice.description && (
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                  {activeNotice.description}
                </p>
              )}

              <div className="pt-2 text-[10px] font-mono text-slate-400 dark:text-[#707A8A] border-t border-slate-100 dark:border-[#252B33] flex items-center justify-between">
                <span>Published by: {activeNotice.uploaded_by_name || 'School Director'}</span>
                <span>{new Date(activeNotice.updated_at || activeNotice.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Fullscreen Zoom */}
      {lightboxOpen && activeNotice && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-[#2B3139] flex items-center justify-between bg-slate-50 dark:bg-[#11151B]">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {activeNotice.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="px-3 py-1 text-xs font-bold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-200 dark:hover:bg-[#202630] rounded-lg transition-colors cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-black/5 dark:bg-black/30">
              <img
                src={activeNotice.image_url}
                alt={activeNotice.title}
                className="max-h-[70vh] w-auto object-contain mx-auto shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Remove Parent Payment Notice?"
        message="Are you sure you want to delete this payment notice? It will immediately disappear from the public admissions page."
        confirmText="Yes, Remove Notice"
        cancelText="Cancel"
        confirmVariant="danger"
        iconType="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
