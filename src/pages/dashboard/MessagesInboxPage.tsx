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

      {/* Messages List (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Loading inbox messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">No contact inquiries found matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#252B33]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessageModal(msg)}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors cursor-pointer ${
                  msg.status === 'New' ? 'bg-[#FCD535]/5 border-l-2 border-[#FCD535]' : ''
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#3B82F6] dark:text-[#FCD535] font-bold">
                      {msg.reference_number}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F0F3F6]">
                      {msg.sender_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                      msg.status === 'New'
                        ? 'bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30'
                        : msg.status === 'Replied'
                        ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                        : 'bg-slate-100 text-slate-600 dark:bg-[#11151B] dark:text-[#707A8A]'
                    }`}>
                      {msg.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 dark:text-[#F0F3F6]">
                    {msg.subject}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#A0AAB8] line-clamp-1">
                    {msg.message}
                  </p>
                </div>

                <div className="text-right sm:text-right text-[11px] text-slate-400 dark:text-[#707A8A] font-mono shrink-0">
                  <span>{new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL & REPLY MODAL (Level 4 Elevated: #202630) */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-xl p-6 max-w-lg w-full border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#FCD535] font-bold">
                  {activeMessage.reference_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6]">
                  {activeMessage.subject}
                </h3>
              </div>
              <button onClick={() => setActiveMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139]">
                <div>
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">From:</span>
                  <strong className="text-slate-800 dark:text-[#F0F3F6]">{activeMessage.sender_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Email:</span>
                  <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono">{activeMessage.sender_email}</strong>
                </div>
                {activeMessage.sender_phone && (
                  <div>
                    <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Phone:</span>
                    <strong className="text-slate-800 dark:text-[#F0F3F6] font-mono">{activeMessage.sender_phone}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 dark:text-[#707A8A] block text-[10px]">Submitted:</span>
                  <span className="font-mono text-slate-600 dark:text-[#A0AAB8]">
                    {new Date(activeMessage.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-[#2B3139] bg-white dark:bg-[#181D24] leading-relaxed text-slate-700 dark:text-[#F0F3F6]">
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

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#252B33]">
                  <button
                    type="button"
                    onClick={() => setActiveMessage(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors"
                  >
                    {language === 'rw' ? 'Funga' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-colors"
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
