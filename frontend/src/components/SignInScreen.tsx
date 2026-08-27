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
  Flame,
  BellRing,
  Shield,
  Footprints,
  CheckCircle2,
  X,
  Phone,
} from 'lucide-react';
import { Language, PortalType, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';
import { PilgrimBadgeIcon, AdminBadgeIcon, GoogleIcon } from './PortalIcons';

interface SignInScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activePortal: PortalType;
  onPortalChange: (portal: PortalType) => void;
  onBackToHome: () => void;
  onLoginSuccess: (session: UserSession) => void;
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

  // Form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const identifier = activePortal === 'pilgrim' ? (mobileNumber || '9876543210') : (emailId || 'seva.admin@varimitra.org');
      const name = activePortal === 'pilgrim' ? 'Warkari Dnyandev' : 'Seva Admin Officer';

      onLoginSuccess({
        role: activePortal,
        identifier,
        name,
      });
      showToast(`Successfully signed in as ${activePortal === 'pilgrim' ? 'Pilgrim / Warkari' : 'Admin / Seva Team'}`);
    }, 600);
  };

  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        role: activePortal,
        identifier: 'google.user@varimitra.org',
        name: activePortal === 'pilgrim' ? 'Warkari Bhakt' : 'Seva Team Coordinator',
      });
      showToast(`Google Sign-in authenticated for ${activePortal === 'pilgrim' ? 'Warkari' : 'Seva Team'}`);
    }, 600);
  };

  return (
    <div className="relative min-h-screen bg-wari-wave-pattern flex flex-col justify-between overflow-x-hidden font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
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
          <LanguageDropdown
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </header>

      {/* Center Sign In Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-lg mx-auto w-full">
        {/* Main Heading */}
        <div className="text-center space-y-1.5 mb-5">
          <h1
            id="signin-title"
            className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight"
          >
            {t.signInHeading}
          </h1>
          
          {/* Subtle Decorative Star/Sparkle */}
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <div className="h-[1px] w-6 bg-amber-400/60" />
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <div className="h-[1px] w-6 bg-amber-400/60" />
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {t.choosePortal}
          </p>
        </div>

        {/* Segmented Switcher (Pilgrim vs Admin) */}
        <div
          id="portal-tab-selector"
          className="w-full max-w-md bg-white p-1 rounded-full border border-slate-200/90 shadow-sm flex items-center justify-between gap-1 mb-6"
        >
          {/* Pilgrim Tab */}
          <button
            id="tab-btn-pilgrim"
            type="button"
            onClick={() => onPortalChange('pilgrim')}
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
            onClick={() => onPortalChange('admin')}
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
          <div className="flex flex-col items-center text-center space-y-1.5 mb-6">
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

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Input 1: Mobile Number for Pilgrim OR Email ID for Admin */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {activePortal === 'pilgrim' ? (
                    <User className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                {activePortal === 'pilgrim' ? (
                  <input
                    id="input-mobile-number"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder={t.mobileNumberPlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                ) : (
                  <input
                    id="input-email-id"
                    type="email"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                  />
                )}
              </div>
            </div>

            {/* Input 2: Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
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
                  onClick={() => setShowForgotModal(true)}
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
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-75 ${
                activePortal === 'pilgrim'
                  ? 'bg-[#ea580c] hover:bg-[#d94806]'
                  : 'bg-[#1e293b] hover:bg-[#0f172a]'
              }`}
            >
              {isSubmitting ? 'Signing in...' : activePortal === 'pilgrim' ? t.signInPilgrimBtn : t.signInAdminBtn}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
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
          <div className="mt-6 text-center text-xs text-slate-500">
            {activePortal === 'pilgrim' ? (
              <span>
                {t.newHere}{' '}
                <button
                  type="button"
                  id="btn-create-pilgrim-account"
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
                  className="font-bold text-[#1e293b] hover:underline cursor-pointer"
                >
                  {t.requestAccess}
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Feature Highlights Bar (Matching exact screenshot footer) */}
      <footer className="relative z-10 w-full bg-[#edeae1]/80 backdrop-blur-sm border-t border-[#ded9cb] py-5 px-4 sm:px-6 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Feature 1: AI Assistant */}
          <div id="feature-ai-assistant" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-200/90 text-slate-700 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.aiAssistantTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                {t.aiAssistantDesc}
              </p>
            </div>
          </div>

          {/* Feature 2: Live Location */}
          <div id="feature-live-location" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center flex-shrink-0 shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.liveLocationTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                {t.liveLocationDesc}
              </p>
            </div>
          </div>

          {/* Feature 3: Emergency SOS */}
          <div id="feature-emergency-sos" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center flex-shrink-0 shadow-xs font-bold text-lg">
              <span className="leading-none text-rose-600 font-extrabold">*</span>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.emergencySosTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                {t.emergencySosDesc}
              </p>
            </div>
          </div>

          {/* Feature 4: Smart Alerts */}
          <div id="feature-smart-alerts" className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center flex-shrink-0 shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {t.smartAlertsTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                {t.smartAlertsDesc}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {t.forgotPassword}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your {activePortal === 'pilgrim' ? 'registered mobile number' : 'official email ID'} to receive an OTP reset link.
            </p>
            <input
              type={activePortal === 'pilgrim' ? 'tel' : 'email'}
              placeholder={activePortal === 'pilgrim' ? '9876543210' : 'admin@varimitra.org'}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <button
              onClick={() => {
                setShowForgotModal(false);
                showToast('OTP sent successfully to your number/email!');
              }}
              className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm ${
                activePortal === 'pilgrim' ? 'bg-[#ea580c]' : 'bg-[#1e293b]'
              }`}
            >
              Send Reset Code
            </button>
          </div>
        </div>
      )}

      {/* Register / Request Access Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {activePortal === 'pilgrim' ? 'Create Warkari Account' : 'Request Seva Team Admin Access'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {activePortal === 'pilgrim'
                ? 'Join thousands of Warkaris for real-time tracking, medical support, and food & shelter spots.'
                : 'Submit your temple trust or volunteer organization credentials for admin clearance.'}
            </p>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Full Name (पूर्ण नाव)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              />
              <input
                type={activePortal === 'pilgrim' ? 'tel' : 'email'}
                placeholder={activePortal === 'pilgrim' ? 'Mobile Number' : 'Work Email Address'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              />
              {activePortal === 'admin' && (
                <input
                  type="text"
                  placeholder="Dindi / Organization / Police / Medical Unit"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                />
              )}
              <input
                type="password"
                placeholder="Set New Password"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                setShowRegisterModal(false);
                showToast(
                  activePortal === 'pilgrim'
                    ? 'Account created! Welcome to VariMitra.'
                    : 'Access request submitted for verification!'
                );
              }}
              className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm ${
                activePortal === 'pilgrim' ? 'bg-[#ea580c]' : 'bg-[#1e293b]'
              }`}
            >
              {activePortal === 'pilgrim' ? 'Register Pilgrim' : 'Submit Access Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
