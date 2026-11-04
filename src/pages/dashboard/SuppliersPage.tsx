import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Supplier } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  X
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: 'Food & Provisions',
    isActive: true,
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/suppliers');
      setSuppliers(res.data?.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: 'Food & Provisions',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setFormData({
      name: supp.name,
      contactPerson: supp.contact_person || '',
      phone: supp.phone,
      email: supp.email || '',
      address: supp.address || '',
      category: supp.category,
      isActive: supp.is_active === 1,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/inventory/suppliers/${editingSupplier.id}`, formData);
        setNotice(`Supplier "${formData.name}" updated successfully.`);
      } else {
        await api.post('/inventory/suppliers', formData);
        setNotice(`Supplier "${formData.name}" registered.`);
      }
      setIsModalOpen(false);
      fetchSuppliers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save supplier.');
    }
  };

  const handleDelete = async (supp: Supplier) => {
    if (supp.total_deliveries && supp.total_deliveries > 0) {
      if (!window.confirm(`Supplier "${supp.name}" has ${supp.total_deliveries} historical deliveries. To protect auditing integrity, this will deactivate the supplier rather than delete historical records. Proceed?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to remove supplier "${supp.name}"?`)) return;
    }

    try {
      await api.delete(`/inventory/suppliers/${supp.id}`);
      setNotice(`Supplier ${supp.name} status updated.`);
      fetchSuppliers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update supplier status.');
    }
  };

  const exportColumns = [
    { header: 'Supplier Name', key: 'name' },
    { header: 'Contact Person', key: 'contact_person' },
    { header: 'Phone', key: 'phone' },
    { header: 'Email', key: 'email' },
    { header: 'Address', key: 'address' },
    { header: 'Category', key: 'category' },
    { header: 'Status', key: 'is_active', format: (val: number) => val === 1 ? 'Active' : 'Deactivated' },
    { header: 'Total Deliveries', key: 'total_deliveries' },
  ];

  const canManageSuppliers = user?.role === 'DIRECTOR' || user?.role === 'ACCOUNTANT';

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              Supplier Directory & Relationship Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              AUDITED VENDORS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            Procurement partners, delivery history, and historical financial audit protection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportControls
            title="Suppliers Directory & Relationship Report"
            data={suppliers}
            columns={exportColumns}
            fileNamePrefix="IBB_Suppliers"
          />

          {canManageSuppliers && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] rounded-lg shadow-sm transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Supplier</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-xs text-[#0ECB81] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* SUPPLIERS GRID (Level 3 Surfaces: #181D24) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Loading supplier directory...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <Truck className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">No registered suppliers found.</p>
          </div>
        ) : (
          suppliers.map((supp) => (
            <div
              key={supp.id}
              className={`bg-white dark:bg-[#181D24] rounded-xl p-5 border shadow-xs flex flex-col justify-between transition-all ${
                supp.is_active === 1
                  ? 'border-slate-200 dark:border-[#2B3139] hover:border-[#FCD535]/40'
                  : 'border-slate-200 dark:border-[#2B3139] opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#3B82F6] dark:text-[#FCD535] tracking-wider block truncate">
                      {supp.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6] truncate">
                      {supp.name}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                    supp.is_active === 1
                      ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                      : 'bg-slate-100 text-slate-500 dark:bg-[#11151B] dark:text-[#707A8A]'
                  }`}>
                    {supp.is_active === 1 ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-[#A0AAB8]">
                  {supp.contact_person && (
                    <div className="text-slate-800 dark:text-[#F0F3F6] font-semibold">
                      Rep: {supp.contact_person}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                    <span className="font-mono text-[11px]">{supp.phone}</span>
                  </div>
                  {supp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0" />
                      <span className="text-[11px] truncate">{supp.email}</span>
                    </div>
                  )}
                  {supp.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-[#707A8A] shrink-0 mt-0.5" />
                      <span className="text-[11px]">{supp.address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-400 dark:text-[#707A8A] font-mono border-t border-slate-100 dark:border-[#252B33]">
                  Total Deliveries: <strong className="text-slate-800 dark:text-[#F0F3F6]">{supp.total_deliveries || 0}</strong>
                </div>
              </div>

              {canManageSuppliers && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#252B33] flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(supp)}
                    className="inline-flex items-center gap-1 text-xs text-[#3B82F6] dark:text-[#FCD535] hover:underline font-semibold"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => handleDelete(supp)}
                    className="p-1.5 text-slate-400 hover:text-[#F6465D] hover:bg-[#F6465D]/15 rounded-md transition-colors"
                    title={supp.total_deliveries ? 'Deactivate supplier to preserve audit history' : 'Delete supplier'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL (Level 4 Elevated: #202630) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#202630] rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#252B33] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F0F3F6] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FCD535]" />
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Buberuka Farmers Cooperative"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Jean Karekezi"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+250 788 000 000"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#FCD535]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sales@domain.rw"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                  >
                    <option value="Agricultural Produce">Agricultural Produce</option>
                    <option value="Packaged & Dry Groceries">Packaged & Dry Groceries</option>
                    <option value="Grain Milling & Flour">Grain Milling & Flour</option>
                    <option value="Dairy & Livestock">Dairy & Livestock</option>
                    <option value="Hardware & Workshop Parts">Hardware & Workshop Parts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="District, Sector / Town"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              {editingSupplier && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#FCD535] focus:ring-[#FCD535]"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                      Supplier Account is Active
                    </span>
                  </label>
                </div>
              )}

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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
