import React, { useEffect, useRef } from 'react';
import { AlertTriangle, LogOut, Globe, CheckCircle2, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  iconType?: 'logout' | 'website' | 'warning' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  iconType = 'warning',
  loading = false,
  onConfirm,
  onClose,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press and trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Autofocus confirm button for convenience
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (iconType) {
      case 'logout':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D] border border-rose-200 dark:border-[#F6465D]/30 flex items-center justify-center shrink-0 shadow-xs">
            <LogOut className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'website':
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#3B82F6]/15 text-[#1769FF] dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30 flex items-center justify-center shrink-0 shadow-xs">
            <Globe className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-[#F6465D]/15 text-[#DC2626] dark:text-[#F6465D] border border-rose-200 dark:border-[#F6465D]/30 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#FCD535]/15 text-[#D97706] dark:text-[#FCD535] border border-amber-200 dark:border-[#FCD535]/30 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-[#DC2626] hover:bg-[#B91C1C] dark:bg-[#F6465D] dark:hover:bg-[#E03B50] text-white shadow-sm shadow-rose-500/20';
      case 'warning':
        return 'bg-[#D97706] hover:bg-[#B45309] dark:bg-[#F0B90B] dark:hover:bg-[#D4A30A] text-white dark:text-slate-950 shadow-sm shadow-amber-500/20';
      case 'primary':
      default:
        return 'bg-[#1769FF] hover:bg-blue-700 dark:bg-[#FCD535] dark:hover:bg-[#E5A910] text-white dark:text-slate-950 font-bold shadow-sm shadow-blue-500/20';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#202630] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-2xl p-6 overflow-hidden relative transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 dark:text-[#707A8A] hover:text-slate-700 dark:hover:text-[#F0F3F6] hover:bg-slate-100 dark:hover:bg-[#262D38] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {renderIcon()}

          <div className="flex-1 min-w-0 pr-6">
            <h3
              id="confirmation-modal-title"
              className="text-base font-extrabold text-[#172033] dark:text-[#F0F3F6] tracking-tight leading-snug"
            >
              {title}
            </h3>
            <p className="mt-2 text-xs text-[#64748B] dark:text-[#A0AAB8] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#E8EDF4] dark:border-[#252B33] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-[#172033] dark:text-[#F0F3F6] bg-slate-100 dark:bg-[#262D38] hover:bg-slate-200 dark:hover:bg-[#2F3746] rounded-xl border border-transparent dark:border-[#2B3139] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-2 ${getConfirmButtonClasses()}`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
