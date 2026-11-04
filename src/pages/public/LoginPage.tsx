import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { api } from '../../services/api';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  Settings,
  Sparkles
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  // Google OAuth Configuration state
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('ibb_google_client_id') ||
      ''
    );
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [googleConfigStatus, setGoogleConfigStatus] = useState<{ configured: boolean; clientId: string | null } | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-slate-200 dark:bg-[#202630]' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) score++;

    if (score <= 2) return { label: 'Weak', score: 1, color: 'bg-[#F6465D]' };
    if (score <= 4) return { label: 'Medium', score: 2, color: 'bg-[#F0B90B]' };
    return { label: 'Strong', score: 3, color: 'bg-[#0ECB81]' };
  };

  const strength = getPasswordStrength(password);

  // Check backend Google configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/auth/google/config');
        setGoogleConfigStatus(res.data);
        if (res.data?.clientId && !googleClientId) {
          setGoogleClientId(res.data.clientId);
        }
      } catch {
        // Quiet fail
      }
    };
    fetchConfig();
  }, []);

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Initialize GIS when googleClientId is available
  useEffect(() => {
    const activeClientId = googleClientId || googleConfigStatus?.clientId;
    if (!activeClientId || typeof window === 'undefined') return;

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'continue_with',
              logo_alignment: 'left',
              width: '100%',
            });
          }
        } catch (e) {
          console.error('GIS init error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId, googleConfigStatus]);

  // Handle Google Credential Response from GIS
  const handleGoogleCredentialResponse = async (response: any) => {
    setErrorMsg(null);
    setGoogleNotice(null);
    setIsGoogleLoading(true);

    try {
      if (!response?.credential) {
        throw new Error('No identity token received from Google.');
      }

      const res = await api.post('/auth/google', {
        idToken: response.credential,
      });

      if (res.data?.token) {
        login(res.data.token, res.data.user);

        // Redirect to role-specific dashboard
        if (res.data.user.role === 'DIRECTOR') {
          navigate('/dashboard/director');
        } else if (res.data.user.role === 'ACCOUNTANT') {
          navigate('/dashboard/accountant/inventory');
        } else {
          navigate('/dashboard/animator');
        }
      }
    } catch (err: any) {
      const errorResponse = err.response?.data?.error;
      if (err.response?.status === 403) {
        setErrorMsg(
          errorResponse ||
            (language === 'rw'
              ? 'Iyi konti ya Google ntabwo yanditswe mu bakozi bemerewe kwinjira muri IBB.'
              : 'The Google account is not registered as an authorized IBB staff member.')
        );
      } else {
        setErrorMsg(errorResponse || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Click handler for Continue with Google button
  const handleGoogleButtonClick = () => {
    setErrorMsg(null);
    setGoogleNotice(null);

    const activeClientId = googleClientId || googleConfigStatus?.clientId;

    if (!activeClientId) {
      // Show professional configuration modal with Google Cloud Console instructions
      setIsConfigModalOpen(true);
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed()) {
            console.log('GIS prompt not displayed:', notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        setIsConfigModalOpen(true);
      }
    } else {
      setIsConfigModalOpen(true);
    }
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientIdInput.trim()) return;

    const trimmed = customClientIdInput.trim();
    setGoogleClientId(trimmed);
    localStorage.setItem('ibb_google_client_id', trimmed);
    setIsConfigModalOpen(false);
    setGoogleNotice('Google Client ID applied. You can now sign in with Google!');
    setTimeout(() => setGoogleNotice(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGoogleNotice(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      login(token, user);

      // Route directly to correct role-based dashboard
      if (user.role === 'DIRECTOR') {
        navigate('/dashboard/director');
      } else if (user.role === 'ACCOUNTANT') {
        navigate('/dashboard/accountant/inventory');
      } else {
        navigate('/dashboard/animator');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Fast Role Switcher for Test Review
  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg(null);
    setGoogleNotice(null);
  };

  return (
    <div className="min-h-screen py-10 sm:py-12 flex flex-col justify-center bg-slate-50 dark:bg-[#0B0E11] px-4 sm:px-6 lg:px-8 transition-colors relative">
      
      {/* Top right language switcher with flags */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FCD535] to-[#3B82F6] flex items-center justify-center text-[#0B0E11] shadow-lg font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#F0F3F6] tracking-tight">
            {t('loginTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8]">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#181D24] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-[#F6465D]/10 border border-rose-200 dark:border-[#F6465D]/30 text-xs text-rose-700 dark:text-[#F6465D] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorMsg}</span>
              </div>
            </div>
          )}

          {googleNotice && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 border border-blue-200 dark:border-[#3B82F6]/30 text-xs text-blue-900 dark:text-[#38BDF8] flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{googleNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1.5">
                {t('loginEmail')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@ibb.ac.rw"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#A0AAB8]">
                  {t('loginPassword')}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 dark:text-[#707A8A] hover:text-slate-600 dark:hover:text-[#F0F3F6] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#A0AAB8]">
                    <span>Password Strength:</span>
                    <span className="font-semibold">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#202630] rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-xs font-bold text-[#0B0E11] bg-[#FCD535] hover:bg-[#F0B90B] disabled:opacity-50 rounded-xl shadow-lg shadow-[#FCD535]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Credentials...' : t('loginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-[#2B3139] w-full" />
            <span className="bg-white dark:bg-[#181D24] px-3 text-[11px] text-slate-400 dark:text-[#707A8A] uppercase font-semibold">
              {language === 'rw' ? 'CYANGWA' : 'OR'}
            </span>
          </div>

          {/* Real Google Sign-In Integration */}
          <div className="space-y-2">
            <div ref={googleBtnContainerRef} className="w-full min-h-[40px] flex items-center justify-center" />
            
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-[#F0F3F6] bg-slate-50 dark:bg-[#202630] hover:bg-slate-100 dark:hover:bg-[#262D38] border border-slate-200 dark:border-[#2B3139] rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? t('googleSigningIn') : t('continueWithGoogle')}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 dark:text-[#707A8A]">
              <span>Google Identity OAuth 2.0</span>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[#1769FF] dark:text-[#FCD535] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>{googleClientId ? 'Configured' : 'Setup Guide'}</span>
              </button>
            </div>
          </div>

          {/* Quick Staff Testing Accounts */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#252B33]">
            <span className="block text-[11px] font-mono text-slate-400 dark:text-[#707A8A] uppercase font-bold tracking-wider mb-2 text-center">
              {t('demoLoginsTitle')}
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => fillCredentials('director@ibb.ac.rw', 'Director@2026!')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#11151B] hover:bg-[#FCD535]/10 border border-slate-200 dark:border-[#2B3139] text-center transition-colors cursor-pointer"
              >
                <span className="font-bold block text-slate-800 dark:text-[#FCD535]">Director</span>
                <span className="text-[10px] text-slate-400 dark:text-[#707A8A]">Executive</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('accountant@ibb.ac.rw', 'Accountant@2026!')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#11151B] hover:bg-[#FCD535]/10 border border-slate-200 dark:border-[#2B3139] text-center transition-colors cursor-pointer"
              >
                <span className="font-bold block text-slate-800 dark:text-[#FCD535]">Accountant</span>
                <span className="text-[10px] text-slate-400 dark:text-[#707A8A]">Finance</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('animator@ibb.ac.rw', 'Animator@2026!')}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#11151B] hover:bg-[#FCD535]/10 border border-slate-200 dark:border-[#2B3139] text-center transition-colors cursor-pointer"
              >
                <span className="font-bold block text-slate-800 dark:text-[#FCD535]">Animator</span>
                <span className="text-[10px] text-slate-400 dark:text-[#707A8A]">Stock Out</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Google Cloud Console Setup & Direct Client ID Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181D24] max-w-lg w-full rounded-2xl p-6 border border-slate-200 dark:border-[#2B3139] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#202630] flex items-center justify-center text-[#1769FF] dark:text-[#38BDF8]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F0F3F6]">
                    {t('googleConfigModalTitle')}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-[#A0AAB8]">
                    Google Identity Services OAuth 2.0 Web Client
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#A0AAB8] leading-relaxed">
              {t('googleConfigDesc')}
            </p>

            {/* Step-by-step instructions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] space-y-2 text-xs text-slate-700 dark:text-[#A0AAB8]">
              <span className="font-bold text-slate-900 dark:text-white block font-mono">
                {t('googleSteps')}
              </span>
              <p>{t('googleStep1')}</p>
              <p>{t('googleStep2')}</p>
              <div>
                <p>{t('googleStep3')}</p>
                <code className="mt-1 block p-1.5 rounded bg-white dark:bg-[#202630] font-mono text-[11px] text-[#1769FF] dark:text-[#FCD535] border border-slate-200 dark:border-[#2B3139] break-all select-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}
                </code>
              </div>
              <p>{t('googleStep4')}</p>
            </div>

            {/* Direct Client ID Input Form */}
            <form onSubmit={handleSaveCustomClientId} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#A0AAB8] mb-1">
                  {t('googleClientIdInput')}
                </label>
                <input
                  type="text"
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] font-mono placeholder-slate-400 focus:outline-none focus:border-[#FCD535]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-[#A0AAB8] hover:bg-slate-100 dark:hover:bg-[#202630] rounded-xl cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!customClientIdInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#FCD535] hover:bg-[#E5A910] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('googleSaveAndInit')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
