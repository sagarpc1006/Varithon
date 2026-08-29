import React, { useState } from 'react';
import {
  ChevronLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  MapPin,
  BellRing,
  Shield,
  Footprints,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Building2,
  KeyRound,
  ArrowRight,
  UserPlus,
  Info,
} from 'lucide-react';
import { Language, PortalType, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';
import { PilgrimBadgeIcon, AdminBadgeIcon, GoogleIcon } from './PortalIcons';
import { authService } from '../services/auth';

interface SignInScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activePortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
  onBackToHome: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

interface PromptBanner {
  type: 'not_found' | 'role_mismatch_admin' | 'role_mismatch_pilgrim' | 'invalid_creds';
  message: string;
  identifier?: string;
  name?: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  language,
  onLanguageChange,
  activePortal,
  onPortalChange,
  onBackToHome,
  onLoginSuccess,
}) => {
  const t = translations[language];

  // Sign in form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-card prompt & alert banner
  const [promptBanner, setPromptBanner] = useState<PromptBanner | null>(null);

  // Register modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Helper to open registration modal with pre-filled identifier
  const openRegisterModalWithIdentifier = (ident: string) => {
    setRegIdentifier(ident);
    setPromptBanner(null);
    setShowRegisterModal(true);
  };

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromptBanner(null);

    const identifier = activePortal === 'pilgrim' ? mobileNumber.trim() : emailId.trim();

    if (!identifier) {
      showToast(activePortal === 'pilgrim' ? 'Please enter your mobile number' : 'Please enter your email ID', 'error');
      return;
    }

    if (activePortal === 'pilgrim') {
      const cleanPhone = identifier.replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.length < 10 && !identifier.includes('@')) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
    }

    if (!password) {
      showToast('Please enter your password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await authService.login(identifier, password, activePortal);
      showToast(`Welcome back, ${session.name}!`);
      onLoginSuccess(session);
    } catch (err: any) {
      const code = err.code || err.data?.code;
      const message = err.message || 'Login failed. Please verify credentials.';

      if (code === 'USER_NOT_FOUND') {
        setPromptBanner({
          type: 'not_found',
          message: activePortal === 'pilgrim'
            ? `No account found with mobile number +91 ${identifier}. Please create a new account to continue.`
            : `No Admin account found with email "${identifier}". Please request admin access.`,
          identifier,
        });
        showToast(activePortal === 'pilgrim' ? 'Mobile number not registered. Please create account.' : 'Admin account not found.', 'info');
      } else if (code === 'ROLE_MISMATCH_ADMIN') {
        setPromptBanner({
          type: 'role_mismatch_admin',
          message: `This account (${err.data?.name || identifier}) is registered as an Admin / Seva Team account.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account is registered for Admin Portal. Switch portal to login.', 'error');
      } else if (code === 'ROLE_MISMATCH_PILGRIM') {
        setPromptBanner({
          type: 'role_mismatch_pilgrim',
          message: `Access denied: This account is registered as a Pilgrim / Warkari account and cannot access the Admin Portal.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account belongs to Pilgrim Portal. Switch portal to login.', 'error');
      } else {
        setPromptBanner({
          type: 'invalid_creds',
          message: message.includes('Invalid credentials') || message.includes('password')
            ? 'Incorrect password. Please verify your password or reset it.'
            : message,
        });
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setPromptBanner(null);
    try {
      const session = await authService.googleLogin(activePortal);
      showToast(`Google authenticated for ${session.name}`);
      onLoginSuccess(session);
    } catch (err: any) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regIdentifier.trim() || !regPassword.trim()) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    if (activePortal === 'pilgrim') {
      const clean = regIdentifier.trim().replace(/[\s\-\+\(\)]/g, '');
      if (clean.length < 10 && !regIdentifier.includes('@')) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
    }

    setIsRegistering(true);
    try {
      const session = await authService.register(
        regName.trim(),
        regIdentifier.trim(),
        regPassword,
        activePortal,
        regOrg.trim()
      );
      setShowRegisterModal(false);
      showToast(`Account created! Welcome to VariMitra, ${session.name}!`);
      onLoginSuccess(session);
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // 4. Handle Forgot Password - Request OTP
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      showToast('Please enter your mobile or email', 'error');
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const res = await authService.forgotPassword(forgotIdentifier.trim(), activePortal);
      showToast(res.message);
      if (res.demo_otp) {
        setForgotOtp(res.demo_otp);
      }
      setForgotStep('verify');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset code', 'error');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // 5. Handle Forgot Password - Reset with OTP
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) {
      showToast('Please enter the OTP code and new password', 'error');
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const res = await authService.resetPassword(forgotIdentifier.trim(), forgotOtp.trim(), newPassword);
      showToast(res.message);
      setShowForgotModal(false);
      setForgotStep('request');
      setPassword(newPassword);
      if (activePortal === 'pilgrim') setMobileNumber(forgotIdentifier);
      else setEmailId(forgotIdentifier);
    } catch (err: any) {
      showToast(err.message || 'Password reset failed. Check OTP.', 'error');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Quick Demo Auto-fill helpers
  const handleFillDemoPilgrim = () => {
    setMobileNumber('9876543210');
    setPassword('password');
    setPromptBanner(null);
    showToast('Demo Pilgrim credentials filled (Phone: 9876543210 / Password: password)', 'info');
  };

  const handleFillDemoAdmin = () => {
    setEmailId('admin@varimitra.org');
    setPassword('admin123');
    setPromptBanner(null);
    showToast('Demo Admin credentials filled (Email: admin@varimitra.org / Password: admin123)', 'info');
  };

  return (
    <div className="relative min-h-screen bg-[#faf7f2] flex flex-col justify-between overflow-x-hidden font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium border animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : toast.type === 'info'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        {/* Left: Back to Home button */}
        <button
          id="btn-back-to-home"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-amber-100/50 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-amber-600" />
          <span>{t.backToHome}</span>
        </button>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center cursor-pointer" onClick={onBackToHome}>
          <VariMitraLogo tagline={t.tagline} />
        </div>

        {/* Right: Language Dropdown */}
        <div className="flex justify-end">
          <LanguageDropdown currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </header>

      {/* Center Sign In Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-lg mx-auto w-full">
        {/* Main Heading */}
        <div className="text-center space-y-1.5 mb-5">
          <h1 id="signin-title" className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            {t.signInHeading}
          </h1>

          {/* Decorative Sparkle */}
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <div className="h-[1px] w-6 bg-amber-400/60" />
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <div className="h-[1px] w-6 bg-amber-400/60" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">{t.choosePortal}</p>
        </div>

        {/* Segmented Switcher (Pilgrim vs Admin) */}
        <div
          id="portal-tab-selector"
          className="w-full max-w-md bg-white p-1 rounded-full border border-slate-200/90 shadow-sm flex items-center justify-between gap-1 mb-5"
        >
          {/* Pilgrim Tab */}
          <button
            id="tab-btn-pilgrim"
            type="button"
            onClick={() => {
              onPortalChange('pilgrim');
              setPromptBanner(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activePortal === 'pilgrim'
                ? 'bg-[#ea580c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Footprints className={`w-4 h-4 ${activePortal === 'pilgrim' ? 'text-white' : 'text-orange-500'}`} />
            <span>{t.pilgrimTitle}</span>
          </button>

          {/* Admin Tab */}
          <button
            id="tab-btn-admin"
            type="button"
            onClick={() => {
              onPortalChange('admin');
              setPromptBanner(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className={`w-4 h-4 ${activePortal === 'admin' ? 'text-white' : 'text-slate-700'}`} />
            <span>{t.adminTitle}</span>
          </button>
        </div>

        {/* Auth Card Container */}
        <div
          id="auth-card"
          className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 transition-all duration-300 relative"
        >
          {/* Top Badge Icon & Portal Header */}
          <div className="flex flex-col items-center text-center space-y-1.5 mb-5">
            {activePortal === 'pilgrim' ? (
              <PilgrimBadgeIcon size="md" className="mb-1" />
            ) : (
              <AdminBadgeIcon size="md" className="mb-1" />
            )}

            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {activePortal === 'pilgrim' ? t.pilgrimSignInTitle : t.adminSignInTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {activePortal === 'pilgrim' ? t.pilgrimWelcome : t.adminWelcome}
            </p>
          </div>

          {/* Prompt / Alert Banner */}
          {promptBanner && (
            <div
              id="auth-prompt-banner"
              className={`mb-5 p-3.5 rounded-2xl border text-xs font-medium animate-in fade-in slide-in-from-top-2 ${
                promptBanner.type === 'not_found'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : promptBanner.type === 'role_mismatch_admin'
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : promptBanner.type === 'role_mismatch_pilgrim'
                  ? 'bg-orange-50 border-orange-300 text-orange-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {promptBanner.type === 'not_found' ? (
                  <UserPlus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : promptBanner.type === 'role_mismatch_admin' ? (
                  <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : promptBanner.type === 'role_mismatch_pilgrim' ? (
                  <Footprints className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="leading-snug">{promptBanner.message}</p>

                  {/* Contextual Action Button */}
                  {promptBanner.type === 'not_found' && (
                    <button
                      type="button"
                      onClick={() => openRegisterModalWithIdentifier(promptBanner.identifier || '')}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>
                        {activePortal === 'pilgrim' ? t.registerWithNumber : t.requestWithEmail}
                      </span>
                    </button>
                  )}

                  {promptBanner.type === 'role_mismatch_admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        onPortalChange('admin');
                        setEmailId(promptBanner.identifier || '');
                        setPromptBanner(null);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t.switchToAdminPortal}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {promptBanner.type === 'role_mismatch_pilgrim' && (
                    <button
                      type="button"
                      onClick={() => {
                        onPortalChange('pilgrim');
                        setMobileNumber(promptBanner.identifier || '');
                        setPromptBanner(null);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <Footprints className="w-3.5 h-3.5 text-white" />
                      <span>{t.switchToPilgrimPortal}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPromptBanner(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Input 1: Mobile Number for Pilgrim OR Email ID for Admin */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                {activePortal === 'pilgrim' ? t.mobileNumberLabel : t.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {activePortal === 'pilgrim' ? (
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      +91
                    </span>
                  ) : (
                    <Mail className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                {activePortal === 'pilgrim' ? (
                  <input
                    id="input-mobile-number"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      if (promptBanner) setPromptBanner(null);
                    }}
                    placeholder="9876543210 (10 digits)"
                    maxLength={14}
                    required
                    className="w-full pl-16 pr-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                ) : (
                  <input
                    id="input-email-id"
                    type="email"
                    value={emailId}
                    onChange={(e) => {
                      setEmailId(e.target.value);
                      if (promptBanner) setPromptBanner(null);
                    }}
                    placeholder="officer@varimitra.org"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                  />
                )}
              </div>
            </div>

            {/* Input 2: Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (promptBanner) setPromptBanner(null);
                  }}
                  placeholder={t.passwordPlaceholder}
                  required
                  className={`w-full pl-10 pr-11 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none transition-all ${
                    activePortal === 'pilgrim'
                      ? 'focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
                      : 'focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => {
                    setForgotIdentifier(activePortal === 'pilgrim' ? mobileNumber : emailId);
                    setForgotStep('request');
                    setShowForgotModal(true);
                  }}
                  className={`text-xs font-semibold hover:underline cursor-pointer transition-colors ${
                    activePortal === 'pilgrim'
                      ? 'text-[#ea580c] hover:text-[#c2410c]'
                      : 'text-[#1e293b] hover:text-slate-900'
                  }`}
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              id={activePortal === 'pilgrim' ? 'btn-submit-pilgrim' : 'btn-submit-admin'}
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-75 flex items-center justify-center gap-2 ${
                activePortal === 'pilgrim'
                  ? 'bg-[#ea580c] hover:bg-[#d94806]'
                  : 'bg-[#1e293b] hover:bg-[#0f172a]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Connecting to Backend...</span>
                </>
              ) : activePortal === 'pilgrim' ? (
                t.signInPilgrimBtn
              ) : (
                t.signInAdminBtn
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-slate-400">Testing Demo:</span>
            {activePortal === 'pilgrim' ? (
              <button
                type="button"
                id="btn-quick-pilgrim-demo"
                onClick={handleFillDemoPilgrim}
                className="font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-2.5 py-1 rounded-full cursor-pointer transition-colors border border-orange-200/60 flex items-center gap-1"
              >
                <span>⚡ Fill Demo Warkari (9876543210)</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-quick-admin-demo"
                onClick={handleFillDemoAdmin}
                className="font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors border border-slate-300/60 flex items-center gap-1"
              >
                <span>⚡ Fill Demo Admin (admin@varimitra.org)</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase font-medium">
              {t.or}
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            id="btn-google-signin"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:border-slate-300 flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>{t.continueWithGoogle}</span>
          </button>

          {/* Card Footer Register/Access Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {activePortal === 'pilgrim' ? (
              <span>
                {t.newHere}{' '}
                <button
                  type="button"
                  id="btn-create-pilgrim-account"
                  onClick={() => openRegisterModalWithIdentifier(mobileNumber)}
                  className="font-bold text-[#ea580c] hover:underline cursor-pointer"
                >
                  {t.createPilgrimAccount}
                </button>
              </span>
            ) : (
              <span>
                {t.needAdminAccount}{' '}
                <button
                  type="button"
                  id="btn-request-admin-access"
                  onClick={() => openRegisterModalWithIdentifier(emailId)}
                  className="font-bold text-[#1e293b] hover:underline cursor-pointer"
                >
                  {t.requestAccess}
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Feature Highlights Bar */}
      <footer className="relative z-10 w-full bg-[#edeae1]/80 backdrop-blur-sm border-t border-[#ded9cb] py-5 px-4 sm:px-6 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Feature 1: AI Assistant */}
          <div id="feature-ai-assistant" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-200/90 text-slate-700 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bot className="w-5 h-5 text-slate-700" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.aiAssistantTitle}</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">{t.aiAssistantDesc}</p>
            </div>
          </div>

          {/* Feature 2: Live Location */}
          <div id="feature-live-location" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center flex-shrink-0 shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.liveLocationTitle}</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">{t.liveLocationDesc}</p>
            </div>
          </div>

          {/* Feature 3: Emergency SOS */}
          <div id="feature-emergency-sos" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center flex-shrink-0 shadow-xs font-bold text-lg">
              <span className="leading-none text-rose-600 font-extrabold">*</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.emergencySosTitle}</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">{t.emergencySosDesc}</p>
            </div>
          </div>

          {/* Feature 4: Smart Alerts */}
          <div id="feature-smart-alerts" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center flex-shrink-0 shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.smartAlertsTitle}</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">{t.smartAlertsDesc}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password / OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-slate-800">
                {forgotStep === 'request' ? t.forgotPassword : 'Enter OTP & New Password'}
              </h3>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered {activePortal === 'pilgrim' ? 'mobile number' : 'official email ID'} to receive an OTP reset code.
                </p>
                <input
                  type={activePortal === 'pilgrim' ? 'tel' : 'email'}
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder={activePortal === 'pilgrim' ? '9876543210' : 'admin@varimitra.org'}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${
                    activePortal === 'pilgrim' ? 'bg-[#ea580c] hover:bg-[#d94806]' : 'bg-[#1e293b] hover:bg-[#0f172a]'
                  }`}
                >
                  {isForgotSubmitting ? 'Sending OTP...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Verification OTP code sent for <strong className="text-slate-700">{forgotIdentifier}</strong>.
                </p>
                <input
                  type="text"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="6-Digit OTP (e.g. 123456)"
                  maxLength={6}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center tracking-widest text-lg font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set New Password (min. 4 characters)"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${
                    activePortal === 'pilgrim' ? 'bg-[#ea580c] hover:bg-[#d94806]' : 'bg-[#1e293b] hover:bg-[#0f172a]'
                  }`}
                >
                  {isForgotSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Register / Request Access Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              {activePortal === 'pilgrim' ? (
                <>
                  <Footprints className="w-5 h-5 text-orange-600" />
                  <span>Create Warkari Account</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-slate-800" />
                  <span>Request Seva Team Admin Access</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {activePortal === 'pilgrim'
                ? 'Join thousands of Warkaris for real-time tracking, group chat, medical aid, and seva spots.'
                : 'Submit your volunteer or seva team organization credentials for admin access.'}
            </p>
            <form onSubmit={handleRegisterSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full Name (e.g. Tukaram Maharaj)"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  {activePortal === 'pilgrim' ? 'Mobile Number (10 digits) *' : 'Work Email *'}
                </label>
                <input
                  type={activePortal === 'pilgrim' ? 'tel' : 'email'}
                  value={regIdentifier}
                  onChange={(e) => setRegIdentifier(e.target.value)}
                  placeholder={activePortal === 'pilgrim' ? '9876543210' : 'officer@varimitra.org'}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  {activePortal === 'pilgrim' ? 'Dindi / Mandal Name (Optional)' : 'Organization / Unit *'}
                </label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder={activePortal === 'pilgrim' ? 'Alandi Dindi No. 4 / Pune' : 'Pandharpur Seva / Police / Medical'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Password *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Set Password (min. 4 characters)"
                  required
                  minLength={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className={`w-full mt-2 py-3 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                  activePortal === 'pilgrim' ? 'bg-[#ea580c] hover:bg-[#d94806]' : 'bg-[#1e293b] hover:bg-[#0f172a]'
                }`}
              >
                {isRegistering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Registering Account in Database...</span>
                  </>
                ) : activePortal === 'pilgrim' ? (
                  'Create Warkari Account & Sign In'
                ) : (
                  'Submit Access Request & Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
