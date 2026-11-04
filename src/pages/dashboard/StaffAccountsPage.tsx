import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Staff, StaffRole } from '../../types';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  Edit2,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const StaffAccountsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'ACCOUNTANT' as StaffRole,
    position: 'Assistant Accountant',
    phone: '',
    permittedModules: 'all',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      setStaffList(res.data?.staff || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'ACCOUNTANT',
      position: 'Staff Officer',
      phone: '',
      permittedModules: 'all',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (st: Staff) => {
    setEditingStaff(st);
    setFormData({
      fullName: st.full_name,
      email: st.email,
      password: '',
      role: st.role,
      position: st.position,
      phone: st.phone || '',
      permittedModules: st.permitted_modules || 'all',
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, {
          fullName: formData.fullName,
          role: formData.role,
          position: formData.position,
          phone: formData.phone,
          permittedModules: formData.permittedModules,
        });
        setNotice(`Permissions for "${formData.fullName}" updated.`);
      } else {
        await api.post('/staff', formData);
        setNotice(`Staff account "${formData.fullName}" provisioned successfully.`);
      }
      setIsModalOpen(false);
      fetchStaff();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save staff credentials.');
    }
  };

  const handleToggleStatus = async (st: Staff) => {
    if (st.id === currentUser?.id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    try {
      const res = await api.patch(`/staff/${st.id}/toggle-status`);
      setNotice(res.data.message);
      fetchStaff();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              Staff Accounts & Access Control
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              RBAC SECURITY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            Director super-admin provisioning, role-based access control (RBAC), and session privileges.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-all duration-150 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Provision New Staff Account</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* STAFF TABLE (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Loading staff authorization roster...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A]">
            No staff records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">Staff Member</th>
                  <th className="py-3 px-4 font-bold">Assigned Role</th>
                  <th className="py-3 px-4 font-bold">Official Position</th>
                  <th className="py-3 px-4 font-bold">Phone Contact</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F0F3F6]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-[#202630] border border-slate-300 dark:border-[#2B3139] shrink-0 flex items-center justify-center">
                          {st.avatar_url ? (
                            <img src={st.avatar_url} alt={st.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-slate-900 dark:text-[#FCD535] bg-[#FCD535]/20">
                              {st.full_name?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <span>{st.full_name}</span>
                          <span className="block text-[10px] text-slate-400 dark:text-[#707A8A] font-mono font-normal">{st.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        st.role === 'DIRECTOR'
                          ? 'bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30'
                          : st.role === 'ACCOUNTANT'
                          ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                          : 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30'
                      }`}>
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8]">
                      {st.position}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-[#707A8A] font-mono text-[11px]">
                      {st.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        st.is_active === 1
                          ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                          : 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30'
                      }`}>
                        {st.is_active === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-[#FCD535] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-md transition-colors"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {st.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(st)}
                            className={`p-1.5 rounded-md transition-colors ${
                              st.is_active === 1
                                ? 'text-slate-400 hover:text-[#F6465D] hover:bg-[#F6465D]/15'
                                : 'text-[#0ECB81] hover:bg-[#0ECB81]/15'
                            }`}
                            title={st.is_active === 1 ? 'Disable Staff Account' : 'Activate Staff Account'}
                          >
                            {st.is_active === 1 ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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

      {/* MODAL (Level 4 Elevated: #202630) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FCD535]" />
                {editingStaff ? 'Edit Staff Permissions' : 'Provision Staff Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Uwimana Claire"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              {!editingStaff && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                      Email Address (Sign-In Username) *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@ibb.ac.rw"
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                      Initial Strong Password *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="ANIMATOR">ANIMATOR</option>
                    <option value="DIRECTOR">DIRECTOR (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Official Position *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Chief Accountant"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Telephone Contact
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+250 788 000 000"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#252B33]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-colors"
                >
                  {editingStaff ? 'Save Changes' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
