import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { ContactMessage } from '../../types';
import { Inbox, Mail, Phone, Clock, CheckCircle2, MessageSquare, X } from 'lucide-react';

export const MessagesInboxPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'New' | 'Read' | 'Replied' | 'Closed'>('Read');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contact', {
        params: { status: statusFilter },
      });
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const openMessageModal = (msg: ContactMessage) => {
    setActiveMessage(msg);
    setReplyNotes(msg.reply_notes || '');
    setNewStatus(msg.status === 'New' ? 'Read' : msg.status);

    // Auto mark as Read on open if currently New
    if (msg.status === 'New') {
      api.put(`/contact/${msg.id}/status`, { status: 'Read' }).catch(() => {});
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessage) return;

    try {
      await api.put(`/contact/${activeMessage.id}/status`, {
        status: newStatus,
        replyNotes: replyNotes.trim(),
      });
      setNotice(language === 'rw' ? 'Imiterere y’ubutumwa yahinduwe neza.' : 'Message status updated.');
      setActiveMessage(null);
      fetchMessages();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || (language === 'rw' ? 'Guhindura byanze.' : 'Failed to update message.'));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              {language === 'rw' ? 'Ubutumwa n’Ibibazo by’Abasura Urubuga' : 'Contact Inquiries & Communications'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              {language === 'rw' ? 'UBUTUMWA RUSANGE' : 'PUBLIC INBOX'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            {language === 'rw'
              ? 'Ibibazo n’ubutumwa byoherejwe n’ababyeyi n’abanyeshuri binyuze ku rubuga rwa IBB hamwe no kubisubiza.'
              : 'Parent and student inquiries submitted through the IBB public portal with follow-up tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">
            {language === 'rw' ? 'Imiterere:' : 'Status:'}
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#181D24] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">{language === 'rw' ? 'Ubutumwa bwose' : 'All Messages'}</option>
            <option value="New">{language === 'rw' ? 'Bushya butarasomwa' : 'New Unread'}</option>
            <option value="Read">{language === 'rw' ? 'Bwarasomwe' : 'Read'}</option>
            <option value="Replied">{language === 'rw' ? 'Bwasubijwe' : 'Replied'}</option>
            <option value="Closed">{language === 'rw' ? 'Bwarangijwe' : 'Closed'}</option>
          </select>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white dark:bg-[#181D24] rounded-2xl border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs overflow-hidden max-w-full">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B] dark:text-[#A0AAB8] font-sans">
            {language === 'rw' ? 'Gufungura ubutumwa bwoherejwe...' : 'Loading inbox messages...'}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] dark:text-[#707A8A] space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-[#94A3B8] dark:text-[#707A8A]" />
            <p className="text-xs">
              {language === 'rw' ? 'Nta butumwa buhuye n’ibyashakishijwe bubonetse.' : 'No contact inquiries found matching criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#252B33]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessageModal(msg)}
                className={`p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-[#F3F7FF] dark:hover:bg-[#202630]/60 transition-colors cursor-pointer min-w-0 max-w-full ${
                  msg.status === 'New' ? 'bg-[#F3F7FF]/70 border-l-3 border-[#1769FF] dark:bg-[#FCD535]/5 dark:border-[#FCD535]' : ''
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1 max-w-full">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-sans text-[11px] text-[#1769FF] dark:text-[#FCD535] font-bold shrink-0">
                      {msg.reference_number}
                    </span>
                    <span className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate max-w-[200px] sm:max-w-xs">
                      {msg.sender_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider shrink-0 ${
                      msg.status === 'New'
                        ? 'bg-[#EAF2FF] text-[#1769FF] border border-[#BFDBFE] dark:bg-[#FCD535]/15 dark:text-[#FCD535] dark:border-[#FCD535]/30'
                        : msg.status === 'Replied'
                        ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] dark:bg-[#0ECB81]/15 dark:text-[#0ECB81] dark:border-[#0ECB81]/30'
                        : 'bg-[#F5F7FB] text-[#64748B] border border-[#E2E8F0] dark:bg-[#11151B] dark:text-[#707A8A]'
                    }`}>
                      {msg.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#172033] dark:text-[#F0F3F6] truncate break-words max-w-full">
                    {msg.subject}
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-[#A0AAB8] line-clamp-2 break-words break-all max-w-full">
                    {msg.message}
                  </p>
                </div>

                <div className="text-left sm:text-right text-[11px] text-[#64748B] dark:text-[#707A8A] font-sans shrink-0 self-start sm:self-auto tabular-nums">
                  <span>{new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL & REPLY MODAL (Level 4 Elevated: #202630) */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#202630] rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4 my-auto">
            
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#252B33] pb-3 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-[#FCD535] font-bold block">
                  {activeMessage.reference_number}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F0F3F6] break-words">
                  {activeMessage.subject}
                </h3>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] break-words">
                <div className="min-w-0">
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">From:</span>
                  <strong className="text-slate-800 dark:text-[#F0F3F6] truncate block">{activeMessage.sender_name}</strong>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Email:</span>
                  <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono break-all block">{activeMessage.sender_email}</strong>
                </div>
                {activeMessage.sender_phone && (
                  <div className="min-w-0">
                    <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Phone:</span>
                    <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono block">{activeMessage.sender_phone}</strong>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Submitted:</span>
                  <span className="font-mono text-slate-600 dark:text-[#A0AAB8] block">
                    {new Date(activeMessage.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3139] bg-slate-50/50 dark:bg-[#181D24] leading-relaxed text-slate-800 dark:text-[#F0F3F6] break-words whitespace-pre-wrap max-h-56 overflow-y-auto">
                {activeMessage.message}
              </div>

              {/* Status & Reply Notes Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {language === 'rw' ? 'Hindura Imiterere y’Ubutumwa' : 'Update Message Status'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="Read">{language === 'rw' ? 'Kugaragaza ko bwasomwe' : 'Mark as Read'}</option>
                    <option value="Replied">{language === 'rw' ? 'Kugaragaza ko bwasubijwe' : 'Mark as Replied'}</option>
                    <option value="Closed">{language === 'rw' ? 'Kugena ko bwarangiye' : 'Close Inquiry'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    {language === 'rw' ? 'Inyandiko y’Igisubizo / Icyakozwe' : 'Internal Reply / Follow-up Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={replyNotes}
                    onChange={(e) => setReplyNotes(e.target.value)}
                    placeholder={language === 'rw' ? 'Andika ubutumwa waganiriyeho n’umubyeyi cyangwa icyakozwe...' : 'Document call made to parent, email response sent, or next actions taken...'}
                    className="w-full p-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#252B33]">
                  <button
                    type="button"
                    onClick={() => setActiveMessage(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors cursor-pointer"
                  >
                    {language === 'rw' ? 'Funga' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {language === 'rw' ? 'Bika Impinduka' : 'Save Status Update'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
