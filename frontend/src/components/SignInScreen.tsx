import React, { useState, useEffect } from 'react';
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
  Bell,
  Shield,
  Footprints,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Phone,
  Building2,
  KeyRound,
  ArrowRight,
  UserPlus,
  Info,
  Radio,
  UserCheck,
  Users,
} from 'lucide-react';
import templeBgImg from '../assets/images/pandharpur_wari_full_bg_1787548239851.jpg';
import { Language, PortalType, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';
import { PilgrimBadgeIcon, VolunteerBadgeIcon, AdminBadgeIcon, GoogleIcon } from './PortalIcons';
import { authService } from '../services/auth';
import { api } from '../services/api';

interface SignInScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activePortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
  onBackToHome: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

interface PromptBanner {
  type: 'not_found' | 'role_mismatch_admin' | 'role_mismatch_volunteer' | 'role_mismatch_pilgrim' | 'invalid_creds';
  message: string;
  identifier?: string;
  name?: string;
}

interface PendingVolunteerData {
  name: string;
  identifier: string;
  department: string;
  squad_id: string;
  organization?: string;
  requested_at?: string;
  userId?: number;
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
  const [volunteerIdentifier, setVolunteerIdentifier] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-card prompt & alert banner
  const [promptBanner, setPromptBanner] = useState<PromptBanner | null>(null);

  // Live Volunteer Approval Waiting State
  const [pendingVolunteer, setPendingVolunteer] = useState<PendingVolunteerData | null>(null);

  // Register modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regDepartment, setRegDepartment] = useState('Food & Annachatra Seva');
  const [regSquadId, setRegSquadId] = useState('SQD-FOOD-101');
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

  // Live Polling Effect for Volunteer Approval
  useEffect(() => {
    if (!pendingVolunteer) return;

    const interval = setInterval(async () => {
      try {
        const res = await authService.checkVolunteerStatus(pendingVolunteer.identifier);
        if (res && res.is_approved && res.session) {
          showToast(`🎉 Volunteer Request Approved by Admin! Welcome, ${res.session.name}!`);
          setPendingVolunteer(null);
          onLoginSuccess(res.session);
        }
      } catch (e) {
        // Continue polling silently
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingVolunteer, onLoginSuccess]);

  // Simulate Instant Admin Confirmation for quick testing
  const handleSimulateAdminApproval = async () => {
    if (!pendingVolunteer) return;
    try {
      if (pendingVolunteer.userId) {
        await authService.approveVolunteerRequest(pendingVolunteer.userId);
      }
      const res = await authService.checkVolunteerStatus(pendingVolunteer.identifier);
      if (res && res.session) {
        showToast('🎉 Volunteer Request Approved! Access granted as Admin.');
        setPendingVolunteer(null);
        onLoginSuccess(res.session);
      }
    } catch (e: any) {
      showToast(e?.message || 'Error simulating approval', 'error');
    }
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

    const identifier =
      activePortal === 'pilgrim'
        ? mobileNumber.trim()
        : activePortal === 'volunteer'
        ? volunteerIdentifier.trim()
        : emailId.trim();

    if (!identifier) {
      showToast(
        activePortal === 'pilgrim'
          ? 'Please enter your mobile number'
          : activePortal === 'volunteer'
          ? 'Please enter your mobile number or volunteer email'
          : 'Please enter your email ID',
        'error'
      );
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
      const res: any = await api.post('/auth/login/', {
        identifier,
        password,
        role: activePortal,
      });

      if (res.status === 'pending_approval' || (res.session && !res.session.is_approved)) {
        setPendingVolunteer({
          name: res.session?.name || 'Field Sevekar',
          identifier: identifier,
          department: res.session?.department || 'Food & Annachatra Seva',
          squad_id: res.session?.squad_id || 'SQD-FOOD-101',
          requested_at: 'Just now',
          userId: res.session?.id,
        });
        showToast('Volunteer access request is awaiting Admin approval ⏳', 'info');
        return;
      }

      if (res && res.session) {
        authService.saveSession(res.session);
        showToast(`Welcome back, ${res.session.name}!`);
        onLoginSuccess(res.session);
      }
    } catch (err: any) {
      const code = err.code || err.data?.code;
      const message = err.message || 'Login failed. Please verify credentials.';

      if (code === 'USER_NOT_FOUND') {
        const notFoundMsg =
          activePortal === 'pilgrim'
            ? `No account found with mobile number +91 ${identifier}. Please create a new account to continue.`
            : activePortal === 'volunteer'
            ? `No Volunteer account found with "${identifier}". Please register as a field volunteer.`
            : `No Admin account found with email "${identifier}". Please request admin access.`;

        setPromptBanner({
          type: 'not_found',
          message: notFoundMsg,
          identifier,
        });
        showToast(
          activePortal === 'pilgrim'
            ? 'Mobile number not registered. Please create account.'
            : activePortal === 'volunteer'
            ? 'Volunteer account not found. Please register.'
            : 'Admin account not found.',
          'info'
        );
      } else if (code === 'ROLE_MISMATCH_ADMIN') {
        setPromptBanner({
          type: 'role_mismatch_admin',
          message: `This account (${err.data?.name || identifier}) is registered as an Admin / Seva Team account.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account is registered for Admin Portal. Switch portal to login.', 'error');
      } else if (code === 'ROLE_MISMATCH_VOLUNTEER') {
        setPromptBanner({
          type: 'role_mismatch_volunteer',
          message: `This account (${err.data?.name || identifier}) is registered as a Volunteer / Sevekar account.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account belongs to Volunteer Portal. Switch portal to login.', 'error');
      } else if (code === 'ROLE_MISMATCH_PILGRIM') {
        setPromptBanner({
          type: 'role_mismatch_pilgrim',
          message: `Access denied: This account is registered as a Pilgrim / Warkari account.`,
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
      // Backend auto-detects the user's true role — show a friendly message
      const roleLabel = session.role === 'admin' ? 'Admin' : session.role === 'volunteer' ? 'Volunteer' : 'Pilgrim';
      showToast(`Welcome back, ${session.name}! Routing to ${roleLabel} dashboard...`);
      onLoginSuccess(session);
    } catch (err: any) {
      if (err?.code === 'VOLUNTEER_PENDING_APPROVAL') {
        showToast('Volunteer request received. Please wait for Admin approval.', 'info');
        return;
      }
      // Handle any remaining role mismatch codes gracefully
      if (err?.data?.correct_role) {
        showToast(`Switching to ${err.data.correct_role} portal and retrying...`, 'info');
        try {
          const session = await authService.googleLogin(err.data.correct_role as any);
          onLoginSuccess(session);
          return;
        } catch {}
      }
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Registration & Volunteer Access Request
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
      if (activePortal === 'volunteer') {
        const res: any = await authService.requestVolunteerAccess(
          regName.trim(),
          regIdentifier.trim(),
          regPassword,
          regOrg.trim(),
          regDepartment,
          regSquadId
        );
        setShowRegisterModal(false);
        setPendingVolunteer({
          name: regName.trim(),
          identifier: regIdentifier.trim(),
          department: regDepartment,
          squad_id: regSquadId,
          organization: regOrg.trim(),
          requested_at: 'Just now',
          userId: res?.request?.id,
        });
        showToast('Volunteer Request Transmitted to Admin! Awaiting confirmation.');
        return;
      }

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
      else if (activePortal === 'volunteer') setVolunteerIdentifier(forgotIdentifier);
      else setEmailId(forgotIdentifier);
    } catch (err: any) {
      showToast(err.message || 'Password reset failed. Check OTP.', 'error');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Helper to split portal title like "Pilgrim / Warkari" into two stacked lines matching the UI design
  const renderPortalLabel = (title: string) => {
    const parts = title.split(' / ');
    if (parts.length === 2) {
      return (
        <span className="text-left leading-[1.15] inline-block">
          <span className="block text-[11px] sm:text-xs font-semibold">{parts[0]} /</span>
          <span className="block text-[11px] sm:text-xs font-semibold">{parts[1]}</span>
        </span>
      );
    }
    return <span className="text-xs sm:text-sm font-semibold">{title}</span>;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans text-slate-800">
      {/* Panoramic Soft-Blurred Sacred Pandharpur Temple Photographic Background with Warm Sunset Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src={templeBgImg}
          alt="Lord Vitthal Temple Background"
          className="w-full h-full object-cover object-center filter blur-[5px] scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft daylight / warm amber translucent veil matching mockup */}
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-amber-50/25 to-[#faf6ef]/60" />
      </div>

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
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between">
        {/* Left: Back to Home button */}
        <button
          id="btn-back-to-home"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ea580c] hover:text-[#c2410c] transition-colors py-1.5 px-2 rounded-lg cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.backToHome}</span>
        </button>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center cursor-pointer" onClick={onBackToHome}>
          <VariMitraLogo tagline={t.tagline} size={48} fontSize={28} />
        </div>

        {/* Right: Language Dropdown */}
        <div className="flex justify-end">
          <LanguageDropdown currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </header>

      {/* Center Sign In Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-xl mx-auto w-full">
        {/* Main Heading */}
        <div className="text-center space-y-1 mb-5">
          <h1 id="signin-title" className="text-3xl sm:text-[34px] font-bold text-slate-900 tracking-tight">
            {t.signInHeading}
          </h1>

          {/* Saffron & Gold Decorative Sparkle Motif */}
          <div className="flex items-center justify-center gap-2 py-0.5 my-1 text-amber-500">
            <div className="h-[1.5px] w-6 bg-gradient-to-r from-transparent to-amber-500/80" />
            <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <div className="h-[1.5px] w-6 bg-gradient-to-l from-transparent to-amber-500/80" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">{t.choosePortal}</p>
        </div>

        {/* Segmented Switcher (Pilgrim vs Volunteer vs Admin) */}
        <div
          id="portal-tab-selector"
          className="w-full max-w-[460px] bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-1 mb-6"
        >
          {/* Pilgrim Tab */}
          <button
            id="tab-btn-pilgrim"
            type="button"
            onClick={() => {
              onPortalChange('pilgrim');
              setPromptBanner(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activePortal === 'pilgrim'
                ? 'bg-gradient-to-r from-orange-500 to-[#ea580c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${activePortal === 'pilgrim' ? 'bg-white/20 text-white' : 'text-orange-500'}`}>
              <Footprints className="w-3.5 h-3.5" />
            </div>
            {renderPortalLabel(t.pilgrimTitle)}
          </button>

          {/* Volunteer Tab */}
          <button
            id="tab-btn-volunteer"
            type="button"
            onClick={() => {
              onPortalChange('volunteer');
              setPromptBanner(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activePortal === 'volunteer'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${activePortal === 'volunteer' ? 'bg-white/20 text-white' : 'text-teal-600'}`}>
              <Users className="w-3.5 h-3.5" />
            </div>
            {renderPortalLabel(t.volunteerTitle)}
          </button>

          {/* Admin Tab */}
          <button
            id="tab-btn-admin"
            type="button"
            onClick={() => {
              onPortalChange('admin');
              setPromptBanner(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${activePortal === 'admin' ? 'bg-white/20 text-white' : 'text-slate-600'}`}>
              <Shield className="w-3.5 h-3.5" />
            </div>
            {renderPortalLabel(t.adminTitle)}
          </button>
        </div>

        {/* Auth Card Container */}
        <div
          id="auth-card"
          className="w-full max-w-[460px] bg-white rounded-[32px] p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-white/80 transition-all duration-300 relative"
        >
          {/* Top Badge Icon & Portal Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-2">
              {activePortal === 'pilgrim' ? (
                <PilgrimBadgeIcon size="md" />
              ) : activePortal === 'volunteer' ? (
                <VolunteerBadgeIcon size="md" />
              ) : (
                <AdminBadgeIcon size="md" />
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activePortal === 'pilgrim'
                ? t.pilgrimSignInTitle
                : activePortal === 'volunteer'
                ? t.volunteerSignInTitle
                : t.adminSignInTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activePortal === 'pilgrim'
                ? t.pilgrimWelcome
                : activePortal === 'volunteer'
                ? t.volunteerWelcome
                : t.adminWelcome}
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
                  : promptBanner.type === 'role_mismatch_volunteer'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
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
                ) : promptBanner.type === 'role_mismatch_volunteer' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
                        {activePortal === 'pilgrim'
                          ? t.registerWithNumber
                          : activePortal === 'volunteer'
                          ? t.registerAsVolunteer
                          : t.requestWithEmail}
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

                  {promptBanner.type === 'role_mismatch_volunteer' && (
                    <button
                      type="button"
                      onClick={() => {
                        onPortalChange('volunteer');
                        setVolunteerIdentifier(promptBanner.identifier || '');
                        setPromptBanner(null);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>{t.switchToVolunteerPortal}</span>
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

          {/* Live Volunteer Approval Radar Card */}
          {pendingVolunteer ? (
            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl border border-emerald-500/40 shadow-xl space-y-4 text-center animate-in fade-in zoom-in-95">
              {/* Animated Radar Pulse */}
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                  ⏳ Awaiting Admin Confirmation
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  Volunteer Access Request Transmitted
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                  Central Command is reviewing your Sevekar request. As soon as the Admin confirms, this screen will automatically open with full administrative command privileges.
                </p>
              </div>

              {/* Request Card Telemetry */}
              <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-bold text-white">{pendingVolunteer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Credential:</span>
                  <span className="font-mono text-emerald-300">{pendingVolunteer.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Squad Department:</span>
                  <span className="font-semibold text-white">{pendingVolunteer.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Live Status:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Polling Central Command (3s)</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSimulateAdminApproval}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>⚡ Simulate Instant Admin Confirmation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPendingVolunteer(null)}
                  className="text-xs text-slate-400 hover:text-white underline py-1 cursor-pointer"
                >
                  Cancel & Return to Form
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Input 1: Mobile Number for Pilgrim OR Identifier for Volunteer OR Email ID for Admin */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {activePortal === 'pilgrim'
                    ? t.mobileNumberLabel
                    : activePortal === 'volunteer'
                    ? t.volunteerIdLabel
                    : t.emailLabel}
                </label>
                <div className="relative flex items-center bg-[#f8f9fb] border border-slate-200/90 rounded-2xl px-4 py-3.5 transition-all focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                  {activePortal === 'pilgrim' ? (
                    <div className="flex items-center gap-1.5 text-slate-500 mr-2.5 shrink-0">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-xs sm:text-sm font-semibold">+91</span>
                    </div>
                  ) : activePortal === 'volunteer' ? (
                    <Phone className="w-4 h-4 text-emerald-600 mr-3 shrink-0" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                  )}

                  {activePortal === 'pilgrim' ? (
                    <input
                      id="input-mobile-number"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        if (promptBanner) setPromptBanner(null);
                      }}
                      placeholder="9876543210"
                      maxLength={14}
                      required
                      className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  ) : activePortal === 'volunteer' ? (
                    <input
                      id="input-volunteer-identifier"
                      type="text"
                      value={volunteerIdentifier}
                      onChange={(e) => {
                        setVolunteerIdentifier(e.target.value);
                        if (promptBanner) setPromptBanner(null);
                      }}
                      placeholder="9823114455 or volunteer@varimitra.org"
                      required
                      className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
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
                      className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Input 2: Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  {t.passwordLabel}
                </label>
                <div className="relative flex items-center bg-[#f8f9fb] border border-slate-200/90 rounded-2xl px-4 py-3.5 transition-all focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                  <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
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
                    className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-2 shrink-0"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                      setForgotIdentifier(
                        activePortal === 'pilgrim'
                          ? mobileNumber
                          : activePortal === 'volunteer'
                          ? volunteerIdentifier
                          : emailId
                      );
                      setForgotStep('request');
                      setShowForgotModal(true);
                    }}
                    className={`text-xs font-semibold hover:underline cursor-pointer transition-colors ${
                      activePortal === 'pilgrim'
                        ? 'text-[#ea580c] hover:text-[#c2410c]'
                        : activePortal === 'volunteer'
                        ? 'text-[#16a34a] hover:text-[#15803d]'
                        : 'text-[#1e293b] hover:text-slate-900'
                    }`}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                id={
                  activePortal === 'pilgrim'
                    ? 'btn-submit-pilgrim'
                    : activePortal === 'volunteer'
                    ? 'btn-submit-volunteer'
                    : 'btn-submit-admin'
                }
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-5 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-[#ea580c] hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Connecting to Backend...</span>
                  </>
                ) : activePortal === 'pilgrim' ? (
                  t.signInPilgrimBtn
                ) : activePortal === 'volunteer' ? (
                  t.signInVolunteerBtn
                ) : (
                  t.signInAdminBtn
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-slate-200/80 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t.or}
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            id="btn-google-signin"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-slate-700 shadow-sm hover:shadow-md flex items-center gap-3 transition-all cursor-pointer group"
          >
            <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-800">{t.continueWithGoogle}</div>
              <div className="text-xs text-slate-400 font-normal">Existing account? Auto-detected &amp; signed in</div>
            </div>
          </button>

          {/* Card Footer Register/Access Link */}
          <div className="mt-6 text-center text-xs text-slate-500">
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
            ) : activePortal === 'volunteer' ? (
              <span>
                {t.needVolunteerAccount}{' '}
                <button
                  type="button"
                  id="btn-create-volunteer-account"
                  onClick={() => openRegisterModalWithIdentifier(volunteerIdentifier)}
                  className="font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  {t.createVolunteerAccount}
                </button>
              </span>
            ) : (
              <span>
                {t.needAdminAccount}{' '}
                <button
                  type="button"
                  id="btn-request-admin-access"
                  onClick={() => openRegisterModalWithIdentifier(emailId)}
                  className="font-bold text-slate-900 hover:underline cursor-pointer"
                >
                  {t.requestAccess}
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

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
                  Enter your registered {activePortal === 'pilgrim' ? 'mobile number' : 'official email or phone'} to receive an OTP reset code.
                </p>
                <input
                  type={activePortal === 'pilgrim' ? 'tel' : 'text'}
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder={
                    activePortal === 'pilgrim'
                      ? '9876543210'
                      : activePortal === 'volunteer'
                      ? '9823114455 or volunteer@varimitra.org'
                      : 'admin@varimitra.org'
                  }
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${
                    activePortal === 'pilgrim'
                      ? 'bg-[#ea580c] hover:bg-[#d94806]'
                      : activePortal === 'volunteer'
                      ? 'bg-[#16a34a] hover:bg-[#15803d]'
                      : 'bg-[#1e293b] hover:bg-[#0f172a]'
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
                    activePortal === 'pilgrim'
                      ? 'bg-[#ea580c] hover:bg-[#d94806]'
                      : activePortal === 'volunteer'
                      ? 'bg-[#16a34a] hover:bg-[#15803d]'
                      : 'bg-[#1e293b] hover:bg-[#0f172a]'
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
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
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
              ) : activePortal === 'volunteer' ? (
                <>
                  <VolunteerBadgeIcon size="sm" />
                  <span>Register as Field Volunteer / Sevekar</span>
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
                : activePortal === 'volunteer'
                ? 'Join emergency response, medical aid, food distribution, or crowd assistance seva squads along the Wari route.'
                : 'Submit your volunteer or seva team organization credentials for admin access.'}
            </p>
            <form onSubmit={handleRegisterSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full Name (e.g. Rameshwar Shinde)"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  {activePortal === 'pilgrim'
                    ? 'Mobile Number (10 digits) *'
                    : activePortal === 'volunteer'
                    ? 'Mobile Number or Email *'
                    : 'Work Email *'}
                </label>
                <input
                  type={activePortal === 'pilgrim' ? 'tel' : 'text'}
                  value={regIdentifier}
                  onChange={(e) => setRegIdentifier(e.target.value)}
                  placeholder={
                    activePortal === 'pilgrim'
                      ? '9876543210'
                      : activePortal === 'volunteer'
                      ? '9823114455 or sevekar@varimitra.org'
                      : 'officer@varimitra.org'
                  }
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {/* Department selector for Field Volunteers */}
              {activePortal === 'volunteer' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Seva Squad Department *
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => {
                      setRegDepartment(e.target.value);
                      if (e.target.value.includes('Food')) setRegSquadId('SQD-FOOD-101');
                      else if (e.target.value.includes('Medical')) setRegSquadId('SQD-MED-402');
                      else if (e.target.value.includes('Water')) setRegSquadId('SQD-WATR-305');
                      else if (e.target.value.includes('Shelter')) setRegSquadId('SQD-SHLT-204');
                      else if (e.target.value.includes('Sanitation')) setRegSquadId('SQD-SANI-508');
                      else setRegSquadId('SQD-CROWD-601');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 font-medium"
                  >
                    <option value="Food & Annachatra Seva">🍲 Annachatra & Food Distribution (SQD-FOOD-101)</option>
                    <option value="First-Aid & Medical Response">🚑 First-Aid & Medical Emergency (SQD-MED-402)</option>
                    <option value="Clean Drinking Water Fleet">💧 Clean Drinking Water Supply (SQD-WATR-305)</option>
                    <option value="Night Shelter & Tentage">⛺ Night Shelter & Rest Areas (SQD-SHLT-204)</option>
                    <option value="Eco-Sanitation & Swachh Wari">🧹 Eco-Sanitation & Swachh Wari (SQD-SANI-508)</option>
                    <option value="Crowd & Traffic Marshals">🚦 Crowd Flow & Route Marshal (SQD-CROWD-601)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  {activePortal === 'pilgrim'
                    ? 'Dindi / Mandal Name (Optional)'
                    : activePortal === 'volunteer'
                    ? 'Seva Mandal / NGO / Volunteer Group'
                    : 'Organization / Unit *'}
                </label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder={
                    activePortal === 'pilgrim'
                      ? 'Alandi Dindi No. 4 / Pune'
                      : activePortal === 'volunteer'
                      ? 'Pandharpur Wari Seva Samiti / Pune Youth Seva'
                      : 'Pandharpur Seva / Police / Medical'
                  }
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
                  activePortal === 'pilgrim'
                    ? 'bg-[#ea580c] hover:bg-[#d94806]'
                    : activePortal === 'volunteer'
                    ? 'bg-[#16a34a] hover:bg-[#15803d]'
                    : 'bg-[#1e293b] hover:bg-[#0f172a]'
                }`}
              >
                {isRegistering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Registering Account in Database...</span>
                  </>
                ) : activePortal === 'pilgrim' ? (
                  'Create Warkari Account & Sign In'
                ) : activePortal === 'volunteer' ? (
                  'Register as Sevekar & Sign In'
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
