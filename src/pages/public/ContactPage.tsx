import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ referenceNumber: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/contact', formData);
      setSuccessInfo({ referenceNumber: res.data.referenceNumber });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || (language === 'rw' ? 'Kohereza ubutumwa byanze. Reba murandasi yawe.' : 'Failed to transmit message. Please check connection.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 lg:py-16 bg-slate-50 dark:bg-[#0B0E11] min-h-screen text-slate-900 dark:text-[#F0F3F6] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FCD535] block mb-2">
            {language === 'rw' ? 'Twandikire / Tubaze' : 'Get in Touch'}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('contactTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AAB8] mt-2 leading-relaxed">
            {t('contactSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coordinates Card (Level 3 Surface) */}
          <div className="lg:col-span-1 bg-white dark:bg-[#181D24] rounded-3xl p-8 border border-slate-200 dark:border-[#2B3139] shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Aho Ishuri Riherereye' : 'Campus Coordinates'}
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-[#A0AAB8]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#2B3139]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-[#F0F3F6] mb-0.5">
                    {language === 'rw' ? 'Aho Ishuri Riri' : 'Physical Campus'}
                  </strong>
                  <span>{language === 'rw' ? "Akarere ka Burera, Intara y'Amajyaruguru, Rwanda" : 'Buberuka District, Northern Province, Rwanda'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#2B3139]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-[#F0F3F6] mb-0.5">
                    {language === 'rw' ? 'Telefone' : 'Telephone'}
                  </strong>
                  <span>+250 788 123 456 ({language === 'rw' ? 'Ibiro by’Umuyobozi' : 'Director Office'})</span>
                  <br />
                  <span>+250 788 234 567 ({language === 'rw' ? 'Ubucungamari n’Ukwandika' : 'Accounts & Registrar'})</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#2B3139]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-[#F0F3F6] mb-0.5">
                    {language === 'rw' ? 'Imeli Yemewe' : 'Official Inquiries'}
                  </strong>
                  <span>info@ibb.ac.rw · admissions@ibb.ac.rw</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#202630] text-[#3B82F6] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#2B3139]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900 dark:text-[#F0F3F6] mb-0.5">
                    {language === 'rw' ? 'Amasaha y’Akazi' : 'Administration Office Hours'}
                  </strong>
                  <span>{language === 'rw' ? 'Kuwa Mbere – Kuwa Gatanu: 08:00 – 17:00 CAT' : 'Monday – Friday: 08:00 – 17:00 CAT'}</span>
                  <br />
                  <span>{language === 'rw' ? 'Kuwa Gatandatu: 09:00 – 12:30 CAT' : 'Saturday: 09:00 – 12:30 CAT'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#202630] border border-slate-200 dark:border-[#2B3139] text-xs text-slate-700 dark:text-[#A0AAB8]">
              {language === 'rw'
                ? 'Gusura ishuri ku babyeyi no kugenzura abanyeshuri bikorwa mu minsi y’akazi kuva 09:00 kugeza 16:00.'
                : 'Parent visits and student admission interviews are conducted weekdays from 09:00 to 16:00.'}
            </div>
          </div>

          {/* Form Card (Level 3 Surface) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#181D24] rounded-3xl p-8 border border-slate-200 dark:border-[#2B3139] shadow-sm">
            
            {successInfo ? (
              <div className="text-center py-12 space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-[#0ECB81]/10 text-[#0ECB81] flex items-center justify-center mx-auto border border-[#0ECB81]/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('messageSentSuccess')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#A0AAB8] max-w-md mx-auto leading-relaxed">
                  Your message has been assigned tracking code:
                </p>
                <div className="inline-block px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#202630] text-[#FCD535] border border-transparent dark:border-[#2B3139] font-mono font-bold text-sm">
                  {successInfo.referenceNumber}
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setSuccessInfo(null)}
                    className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-slate-100 dark:bg-[#202630] hover:bg-slate-200 dark:hover:bg-[#262D38] border border-transparent dark:border-[#2B3139] rounded-lg cursor-pointer transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-rose-700 dark:text-[#F6465D] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('contactName')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Alphonse Gatete"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('contactEmail')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@domain.com"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('contactPhone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+250 788 000 000"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                      {t('contactSubject')} *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. Inquiries on L3 Boarding Fees"
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                    {t('contactMessage')} *
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide details about your academic or institutional inquiry..."
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] disabled:opacity-50 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Transmitting...' : t('sendMessage')}</span>
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
