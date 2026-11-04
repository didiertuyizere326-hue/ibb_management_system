import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { PaymentNotice } from '../../types';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  School,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  Building,
  Eye,
  X,
  ShieldCheck,
  ZoomIn
} from 'lucide-react';

export const AdmissionsPage: React.FC = () => {
  const { t } = useLanguage();

  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);
  const [noticeLoading, setNoticeLoading] = useState<boolean>(true);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [bankCopied, setBankCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchPaymentNotice = async () => {
      try {
        setNoticeLoading(true);
        const res = await api.get('/settings/payment-notice');
        if (res.data?.notice && res.data.notice.is_active === 1) {
          setPaymentNotice(res.data.notice);
        } else {
          setPaymentNotice(null);
        }
      } catch (err) {
        console.error('Failed to load payment notice:', err);
      } finally {
        setNoticeLoading(false);
      }
    };
    fetchPaymentNotice();
  }, []);

  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    gender: 'Male',
    fatherName: '',
    motherName: '',
    phone: '',
    email: '',
    residence: '',
    previousSchool: '',
    academicLevel: 'L3',
    department: 'Software Development',
    s3Marks: '',
    resultSlipUrl: '',
    passportPhotoUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    trackingNumber: string;
    status: string;
    qualifiesBoarding: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert uploaded image to base64 preview string
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'resultSlipUrl' | 'passportPhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected file size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, [fieldName]: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.studentName || !formData.dateOfBirth || !formData.phone || !formData.email || !formData.residence || !formData.previousSchool || !formData.s3Marks) {
      setErrorMsg('Please fill in all mandatory application fields marked with *');
      return;
    }

    const marks = parseFloat(formData.s3Marks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      setErrorMsg('Please enter a valid S3 marks percentage between 0 and 100.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/admissions/apply', formData);
      setSubmissionSuccess({
        trackingNumber: res.data.trackingNumber,
        status: res.data.status,
        qualifiesBoarding: res.data.qualifiesBoarding,
      });

      // Celebration confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // no-op
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit application. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingNumber = () => {
    if (!submissionSuccess?.trackingNumber) return;
    navigator.clipboard.writeText(submissionSuccess.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-12 lg:py-16 bg-slate-50 dark:bg-[#0B0E11] min-h-screen text-slate-900 dark:text-[#F0F3F6] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SUCCESS CONFIRMATION STATE */}
        {submissionSuccess ? (
          <div className="bg-white dark:bg-[#181D24] rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-[#2B3139] shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-[#0ECB81]/10 text-[#0ECB81] flex items-center justify-center mx-auto shadow-sm border border-[#0ECB81]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('appSuccessTitle')}
            </h2>

            <p className="text-sm text-slate-600 dark:text-[#A0AAB8] max-w-xl mx-auto leading-relaxed">
              {t('appSuccessMsg')}
            </p>

            {/* Tracking Number Banner (Binance Elevated Surface) */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] max-w-md mx-auto space-y-2">
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-[#A0AAB8] block tracking-wider">
                {t('yourTrackingNumber')}
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#FCD535] font-mono tracking-wider tabular-nums">
                  {submissionSuccess.trackingNumber}
                </span>
                <button
                  onClick={copyTrackingNumber}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-[#262D38] rounded-lg border border-slate-200 dark:border-[#2B3139] shadow-xs transition-colors cursor-pointer"
                  title="Copy tracking number"
                >
                  {copied ? <Check className="w-4 h-4 text-[#0ECB81]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#707A8A]">
                {t('keepTrackingSafe')}
              </p>
            </div>

            {/* Boarding Note */}
            {submissionSuccess.qualifiesBoarding && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#0ECB81]/10 border border-emerald-200 dark:border-[#0ECB81]/30 text-xs text-emerald-800 dark:text-[#0ECB81] max-w-md mx-auto font-medium">
                ★ Your S3 score qualifies you for priority school boarding accommodation consideration!
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={`/track?ref=${submissionSuccess.trackingNumber}`}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <span>Track Application Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmissionSuccess(null);
                  setFormData({
                    studentName: '',
                    dateOfBirth: '',
                    gender: 'Male',
                    fatherName: '',
                    motherName: '',
                    phone: '',
                    email: '',
                    residence: '',
                    previousSchool: '',
                    academicLevel: 'L3',
                    department: 'Software Development',
                    s3Marks: '',
                    resultSlipUrl: '',
                    passportPhotoUrl: '',
                  });
                }}
                className="px-5 py-3 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-slate-100 dark:bg-[#202630] hover:bg-slate-200 dark:hover:bg-[#262D38] border border-transparent dark:border-[#2B3139] rounded-xl transition-colors cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* OFFICIAL TUITION & BOARDING FEES PAYMENT NOTICE (PUBLIC TO PARENTS) */}
            {paymentNotice && (
              <div className="mb-8 bg-white dark:bg-[#181D24] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-lg animate-fadeIn overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#252B33]">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-[#0ECB81] flex items-center justify-center">
                        <CreditCard className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#0ECB81] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {t('paymentNoticeTitle')}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {paymentNotice.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
                      {t('paymentNoticeSubtitle')}
                    </p>
                  </div>

                  {/* Quick Copy Coordinates Badge */}
                  <div className="shrink-0 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] space-y-1 min-w-[240px]">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-[#707A8A] uppercase font-semibold">
                      {paymentNotice.bank_name || 'Bank of Kigali (BK)'}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-[#FCD535] tabular-nums">
                        {paymentNotice.account_number || '00040-0694231-89'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (paymentNotice.account_number) {
                            navigator.clipboard.writeText(paymentNotice.account_number);
                            setBankCopied(true);
                            setTimeout(() => setBankCopied(false), 2000);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#262D38] border border-slate-200 dark:border-[#2B3139] text-slate-600 dark:text-[#F0F3F6] hover:text-[#0ECB81] transition-colors cursor-pointer"
                        title={t('copyAccount')}
                      >
                        {bankCopied ? <Check className="w-3.5 h-3.5 text-[#0ECB81]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-[#A0AAB8] truncate">
                      {paymentNotice.account_name || 'Institut Baptiste de Buberuka'}
                    </div>
                  </div>
                </div>

                {/* Voucher Image + Parent Instructions Layout */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Preserved Aspect Ratio Image Display */}
                  <div className="lg:col-span-7">
                    <div
                      className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2B3139] bg-slate-100 dark:bg-[#11151B] p-2 flex items-center justify-center cursor-pointer group shadow-sm transition-all"
                      onClick={() => setLightboxOpen(true)}
                      title={t('zoomVoucher')}
                    >
                      <img
                        src={paymentNotice.image_url}
                        alt={paymentNotice.title}
                        className="w-full max-h-[360px] object-contain rounded-xl mx-auto group-hover:scale-101 transition-transform duration-200"
                      />
                      {/* Hover Overlay Hint */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold rounded-xl backdrop-blur-xs">
                        <ZoomIn className="w-4 h-4 text-[#FCD535]" />
                        <span>{t('zoomVoucher')}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                      <span>★ Official IBB Bank Voucher</span>
                      <span className="flex items-center gap-1 text-[#3B82F6] dark:text-[#FCD535]">
                        <Eye className="w-3 h-3" />
                        <span>Click voucher image to enlarge</span>
                      </span>
                    </div>
                  </div>

                  {/* Instructions details */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-[#FCD535]/10 border border-amber-500/20 dark:border-[#FCD535]/20 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-[#FCD535] text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>{t('paymentNoticeInstructions')}</span>
                      </div>
                      <p className="text-xs text-amber-950 dark:text-[#EAECEF] leading-relaxed">
                        {paymentNotice.description || 'All tuition, school boarding fees, and registration contributions must be deposited directly to the authorized school bank account. Cash payments at school gates are not accepted.'}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-[#A0AAB8]">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-[#202630] text-slate-700 dark:text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <span>Deposit into Bank of Kigali under <strong>IBB Buberuka</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-[#202630] text-slate-700 dark:text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <span>Write candidate full name and tracking reference on the bank slip remark.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-[#202630] text-slate-700 dark:text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <span>Present the original stamped bank slip at the Accountant office upon term reporting.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICATION FORM */}
            <div className="bg-white dark:bg-[#181D24] rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-[#2B3139] shadow-xl space-y-8">
              
              {/* Header */}
              <div className="border-b border-slate-200 dark:border-[#2B3139] pb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535]">
                  Official Enrollment 2026-2027
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {t('admissionsHeading')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] mt-2 leading-relaxed">
                  {t('admissionsSubheading')}
                </p>
              </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-rose-700 dark:text-[#F6465D] flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section 1: Student Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-[#A0AAB8] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FCD535]" />
                  1. Student Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('studentFullName')} *
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      placeholder="e.g. Mugisha Didier"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('dob')} *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('gender')} *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    >
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('residence')} *
                    </label>
                    <input
                      type="text"
                      name="residence"
                      value={formData.residence}
                      onChange={handleInputChange}
                      placeholder="e.g. Burera, Buberuka Sector"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parents & Contacts */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#2B3139]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-[#A0AAB8] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#FCD535]" />
                  2. Parents & Contact Coordinates
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('fatherName')} *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      placeholder="Father's full name"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('motherName')} *
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      placeholder="Mother's full name"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('phone')} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+250 788 000 000"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('email')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="family@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Choices & S3 Marks */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#2B3139]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-[#A0AAB8] flex items-center gap-2">
                  <School className="w-4 h-4 text-[#FCD535]" />
                  3. Academic Background & Requested Program
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('previousSchool')} *
                    </label>
                    <input
                      type="text"
                      name="previousSchool"
                      value={formData.previousSchool}
                      onChange={handleInputChange}
                      placeholder="e.g. GS Nyakinama Musanze"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('academicLevel')} *
                    </label>
                    <select
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    >
                      <option value="L3">Level 3 (L3 - First Year TVET)</option>
                      <option value="L4">Level 4 (L4 - Intermediate Year)</option>
                      <option value="L5">Level 5 (L5 - Final Diploma Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('department')} *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    >
                      <option value="Software Development">Software Development (Full-Stack & Web)</option>
                      <option value="Automobile Technology">Automobile Technology (Diagnostics & Mechanics)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('s3Marks')} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        name="s3Marks"
                        value={formData.s3Marks}
                        onChange={handleInputChange}
                        placeholder="e.g. 78.5"
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 font-mono tabular-nums pr-8 transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 dark:text-[#707A8A]">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-[#707A8A] mt-1 block">
                      {t('s3MarksHelp')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Document Uploads */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#2B3139]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-[#A0AAB8] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#FCD535]" />
                  4. Verification Document Uploads
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Result Slip Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                      {t('resultSlip')}
                    </label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-[#2B3139] hover:border-[#FCD535] rounded-2xl p-4 text-center transition-colors relative bg-slate-50/50 dark:bg-[#11151B]/50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'resultSlipUrl')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {formData.resultSlipUrl ? (
                        <div className="space-y-2">
                          <img
                            src={formData.resultSlipUrl}
                            alt="Result Slip Preview"
                            className="h-28 mx-auto object-contain rounded-lg border border-slate-200 dark:border-[#2B3139]"
                          />
                          <span className="text-[11px] text-[#0ECB81] font-semibold block">
                            ✓ Document Selected
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <FileText className="w-8 h-8 text-slate-400 dark:text-[#707A8A] mx-auto" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] block">
                            Click to upload S3 Result Slip
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] block">
                            PNG, JPG or PDF up to 5MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passport Photo Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                      {t('passportPhoto')}
                    </label>
                    <div className="border-2 border-dashed border-slate-200 dark:border-[#2B3139] hover:border-[#FCD535] rounded-2xl p-4 text-center transition-colors relative bg-slate-50/50 dark:bg-[#11151B]/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'passportPhotoUrl')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {formData.passportPhotoUrl ? (
                        <div className="space-y-2">
                          <img
                            src={formData.passportPhotoUrl}
                            alt="Passport Preview"
                            className="h-28 w-24 mx-auto object-cover rounded-lg border border-slate-200 dark:border-[#2B3139]"
                          />
                          <span className="text-[11px] text-[#0ECB81] font-semibold block">
                            ✓ Photograph Selected
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <User className="w-8 h-8 text-slate-400 dark:text-[#707A8A] mx-auto" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] block">
                            Click to upload Passport Photo
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-[#707A8A] block">
                            Recent 1:1 portrait photo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-6 border-t border-slate-200 dark:border-[#2B3139] flex items-center justify-between">
                <Link to="/" className="text-xs text-slate-500 dark:text-[#A0AAB8] hover:text-slate-800 dark:hover:text-[#F0F3F6]">
                  Cancel and return home
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] disabled:opacity-50 rounded-xl shadow-lg shadow-[#FCD535]/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? t('submitting') : t('submitApplication')}
                </button>
              </div>

            </form>
          </div>
        </>
        )}

      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR VOUCHER IMAGE */}
      {lightboxOpen && paymentNotice && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-white dark:bg-[#181D24] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-[#2B3139] flex items-center justify-between bg-slate-50 dark:bg-[#11151B]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FCD535]" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {paymentNotice.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-[#202630] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[78vh] flex items-center justify-center bg-black/5 dark:bg-black/40">
              <img
                src={paymentNotice.image_url}
                alt={paymentNotice.title}
                className="max-h-[74vh] w-auto object-contain mx-auto shadow-lg rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
