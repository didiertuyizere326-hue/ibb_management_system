import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import {
  UserCircle,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  Eye,
  EyeOff,
  RotateCcw,
  Camera,
  Mail,
  Briefcase,
  Phone,
  User
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  // Cancel profile edits
  const handleCancelProfile = () => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
      setProfileError(null);
      setProfileNotice(null);
    }
  };

  // Profile image upload reader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('Selected image exceeds 3MB limit. Please choose a smaller portrait photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-slate-200 dark:bg-[#202630]' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score++;

    if (score <= 2) return { label: 'Weak', score: 1, color: 'bg-[#DC2626] dark:bg-[#F6465D]' };
    if (score <= 4) return { label: 'Medium', score: 2, color: 'bg-[#D97706] dark:bg-[#F0B90B]' };
    return { label: 'Strong', score: 3, color: 'bg-[#059669] dark:bg-[#0ECB81]' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice(null);
    setProfileError(null);

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      setProfileSaving(false);
      return;
    }

    try {
      const res = await api.put('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({ full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl.trim() });
      }

      setProfileNotice(t('profileSuccess'));
      setTimeout(() => setProfileNotice(null), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassNotice(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Please complete all three password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must contain at least 8 characters.');
      return;
    }

    setPassSaving(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPassNotice(t('passwordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassNotice(null), 5000);
    } catch (err: any) {
      setPassError(err.response?.data?.error || 'Failed to change password. Please verify your current password.');
    } finally {
      setPassSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn">
      
      {/* Page Header */}
      <div className="pb-3 border-b border-[#E2E8F0] dark:border-[#252B33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#172033] dark:text-[#F0F3F6] tracking-tight">
              {t('profileManagement')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1769FF]/10 text-[#1769FF] dark:bg-[#FCD535]/15 dark:text-[#FCD535] border border-[#1769FF]/20 dark:border-[#FCD535]/30">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#A0AAB8] mt-1">
            Manage your personal staff identity, telephone coordinates, and bcrypt-secured password credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] dark:text-[#707A8A]">
          <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#0ECB81]" />
          <span>Role Protected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ======================================================== */}
        {/* CARD 1: PERSONAL PROFILE DETAILS */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF4] dark:border-[#252B33]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 text-[#1769FF] dark:text-[#3B82F6] flex items-center justify-center font-bold">
                <UserCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033] dark:text-[#F0F3F6]">
                  Personal Staff Information
                </h3>
                <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] font-mono">
                  {user.role} · {user.position}
                </span>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-[#202630] text-[#64748B] dark:text-[#A0AAB8]">
              ID: #{user.id}
            </span>
          </div>

          {profileNotice && (
            <div className="p-3.5 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#059669] dark:text-[#0ECB81] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{profileNotice}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
            {/* Avatar Preview & Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-2">
                {t('profilePhotoLabel')}
              </label>
              
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#E2E8F0] dark:border-[#2B3139] bg-slate-100 dark:bg-[#202630] shrink-0 shadow-xs">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#172033] dark:text-[#FCD535] bg-[#FCD535]/20">
                      {fullName?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#1769FF] dark:text-[#FCD535] bg-blue-50 dark:bg-[#FCD535]/10 hover:bg-blue-100 dark:hover:bg-[#FCD535]/15 border border-blue-200 dark:border-[#FCD535]/30 rounded-lg cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="text-[11px] text-slate-400 hover:text-[#DC2626] transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
              </div>
            </div>

            {/* Official Email (Read-only Institutional ID) */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                Official Institutional Email (Immutable)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#64748B] dark:text-[#707A8A] font-mono cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-[#707A8A] mt-0.5 block font-mono">
                System staff credential. Cannot be modified directly.
              </span>
            </div>

            {/* Official Role & Position (Read-only RBAC) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                  Assigned Role
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={user.role}
                    disabled
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#64748B] dark:text-[#707A8A] font-mono cursor-not-allowed uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                  Official Position
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={user.position}
                    disabled
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#64748B] dark:text-[#707A8A] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Telephone Contact */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                Telephone Coordinates
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] font-mono focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
              </div>
            </div>

            {/* Action Buttons: Save & Cancel */}
            <div className="pt-3 border-t border-[#E8EDF4] dark:border-[#252B33] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelProfile}
                disabled={profileSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#262D38] rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('cancelEditing')}</span>
              </button>

              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 bg-[#1769FF] hover:bg-blue-700 dark:bg-[#FCD535] dark:hover:bg-[#E5A910] disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{profileSaving ? 'Saving...' : t('saveProfile')}</span>
              </button>
            </div>

          </form>

        </div>

        {/* ======================================================== */}
        {/* CARD 2: SECURE BCRYPT PASSWORD CHANGE */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#181D24] rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#2B3139] shadow-xs space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF4] dark:border-[#252B33]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#0ECB81]/15 text-[#059669] dark:text-[#0ECB81] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172033] dark:text-[#F0F3F6]">
                  {t('changePassword')}
                </h3>
                <span className="text-[11px] text-[#64748B] dark:text-[#707A8A] font-mono">
                  Bcrypt Hash Security Standard
                </span>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#059669]/10 text-[#059669] dark:bg-[#0ECB81]/15 dark:text-[#0ECB81]">
              SHA256+BCRYPT
            </span>
          </div>

          {passNotice && (
            <div className="p-3.5 rounded-xl bg-[#059669]/10 border border-[#059669]/30 text-xs text-[#059669] dark:text-[#0ECB81] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{passNotice}</span>
            </div>
          )}

          {passError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-[#DC2626] dark:text-[#F6465D] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            
            {/* Current Password with Show/Hide */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                {t('currentPassword')} *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password with Show/Hide & Strength */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                {t('newPassword')} *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars with upper, lower, number, symbol"
                  required
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#707A8A]">
                    <span>Password Strength:</span>
                    <span className="font-bold text-[#172033] dark:text-[#F0F3F6]">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#11151B] rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password with Show/Hide */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-[#A0AAB8] mb-1">
                {t('confirmNewPassword')} *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-[#E2E8F0] dark:border-[#2B3139] text-[#172033] dark:text-[#F0F3F6] focus:outline-none focus:border-[#1769FF] dark:focus:border-[#FCD535]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <span className="text-[10px] text-[#DC2626] dark:text-[#F6465D] mt-1 block">
                  Passwords do not match yet.
                </span>
              )}
            </div>

            {/* Submit Password */}
            <div className="pt-3 border-t border-[#E8EDF4] dark:border-[#252B33] flex items-center justify-end">
              <button
                type="submit"
                disabled={passSaving || (!!confirmPassword && newPassword !== confirmPassword)}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white dark:text-slate-950 bg-[#059669] hover:bg-emerald-700 dark:bg-[#FCD535] dark:hover:bg-[#E5A910] disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{passSaving ? 'Validating Hash...' : t('changePassword')}</span>
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
