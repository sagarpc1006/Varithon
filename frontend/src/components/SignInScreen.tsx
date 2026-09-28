import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Building2,
  KeyRound,
  ArrowRight,
  UserPlus,
  Info,
  Radio,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Footprints,
} from 'lucide-react';
import wariTempleBottomImg from '../assets/images/wari_temple_bottom.jpg';
import templeBgImg from '../assets/images/pandharpur_wari_full_bg_1787548239851.jpg';
import { Language, PortalType, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';
import { PilgrimBadgeIcon, VolunteerBadgeIcon, AdminBadgeIcon, GoogleIcon } from './PortalIcons';
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

// Ornate Corner Mandala SVG Pattern matching the mockup
const MandalaCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 160"
    className={`absolute top-0 right-0 pointer-events-none select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.4" stroke="#f59e0b" strokeWidth="1">
      {/* Concentric rings from top-right corner (160, 0) */}
      <circle cx="160" cy="0" r="28" strokeDasharray="2 3" />
      <circle cx="160" cy="0" r="48" strokeWidth="1.2" />
      <circle cx="160" cy="0" r="68" strokeDasharray="3 3" />
      <circle cx="160" cy="0" r="88" strokeWidth="1.2" />
      <circle cx="160" cy="0" r="108" strokeDasharray="2 4" />
      <circle cx="160" cy="0" r="128" strokeWidth="1.5" />
      <circle cx="160" cy="0" r="148" strokeDasharray="3 3" />

      {/* Radial petals / spokes */}
      <path d="M160,0 L90,140" opacity="0.5" />
      <path d="M160,0 L60,110" opacity="0.5" />
      <path d="M160,0 L30,80" opacity="0.5" />
      <path d="M160,0 L10,40" opacity="0.5" />

      {/* Scalloped petal arches */}
      <path d="M160,48 Q140,55 135,70 Q130,55 112,48" strokeWidth="1" />
      <path d="M112,48 Q100,68 85,75 Q90,58 72,68" strokeWidth="1" />
      <path d="M160,88 Q130,100 115,120 Q120,95 95,110" strokeWidth="1" />
      <path d="M160,128 Q120,145 90,155" strokeWidth="1.2" />

      {/* Tiny decorative dots */}
      <circle cx="140" cy="20" r="1.5" fill="#f59e0b" />
      <circle cx="120" cy="35" r="1.5" fill="#f59e0b" />
      <circle cx="100" cy="55" r="1.5" fill="#f59e0b" />
      <circle cx="80" cy="80" r="1.5" fill="#f59e0b" />
      <circle cx="60" cy="110" r="1.5" fill="#f59e0b" />
      <circle cx="130" cy="45" r="2" fill="#f59e0b" />
      <circle cx="110" cy="70" r="2" fill="#f59e0b" />
      <circle cx="85" cy="100" r="2" fill="#f59e0b" />
    </g>
  </svg>
);

export const SignInScreen: React.FC<SignInScreenProps> = ({
  language,
  onLanguageChange,
  activePortal,
  onPortalChange,
  onBackToHome,
  onLoginSuccess,
}) => {
  const t = translations[language];

  // Auth tab: Sign In vs Create Account
  const [authTab, setAuthTab] = useState<'signin' | 'create'>('signin');

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

  // Register form states (inline in Create Account tab)
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regDepartment, setRegDepartment] = useState('Food & Annachatra Seva');
  const [regSquadId, setRegSquadId] = useState('SQD-FOOD-101');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGoogleRegistering, setIsGoogleRegistering] = useState(false);

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

  // Smooth Tab Switchers with Bidirectional Data Transfer (prevents re-typing)
  const switchToCreateTab = (ident?: string) => {
    if (ident) {
      setRegIdentifier(ident);
    } else {
      const currentVal =
        activePortal === 'pilgrim'
          ? mobileNumber
          : activePortal === 'volunteer'
          ? volunteerIdentifier
          : emailId;
      if (currentVal && !regIdentifier) setRegIdentifier(currentVal);
    }
    if (password && !regPassword) setRegPassword(password);
    setPromptBanner(null);
    setAuthTab('create');
  };

  const switchToSignInTab = () => {
    if (regIdentifier) {
      if (activePortal === 'pilgrim' && !mobileNumber) setMobileNumber(regIdentifier);
      else if (activePortal === 'volunteer' && !volunteerIdentifier) setVolunteerIdentifier(regIdentifier);
      else if (activePortal === 'admin' && !emailId) setEmailId(regIdentifier);
    }
    if (regPassword && !password) setPassword(regPassword);
    setPromptBanner(null);
    setAuthTab('signin');
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
      const session = await authService.login(identifier, password, activePortal);

      // SECURITY GUARD: Strictly verify session role matches active portal
      if (session && session.role !== activePortal) {
        await authService.logout();
        showToast(`Security Violation: Mismatched role (${session.role}) for ${activePortal} portal. Access denied.`, 'error');
        return;
      }

      // Handle volunteer pending approval
      if (session && !session.is_approved) {
        setPendingVolunteer({
          name: session.name || 'Field Sevekar',
          identifier: identifier,
          department: session.department || 'Food & Annachatra Seva',
          squad_id: session.squad_id || 'SQD-FOOD-101',
          requested_at: 'Just now',
          userId: session.id,
        });
        showToast('Volunteer access request is awaiting Admin approval ⏳', 'info');
        return;
      }

      showToast(`Welcome back, ${session.name}!`);
      onLoginSuccess(session);
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
          message: `This account (${err.data?.name || identifier}) has Admin / Seva Team privileges. For security reasons, Admin accounts must sign in via the Admin Command Center.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account is registered for Admin Portal. Switch portal to login.', 'error');
      } else if (code === 'ROLE_MISMATCH_VOLUNTEER') {
        setPromptBanner({
          type: 'role_mismatch_volunteer',
          message: `This account (${err.data?.name || identifier}) is registered as a Volunteer / Sevekar account. Please use the Volunteer Portal.`,
          identifier,
          name: err.data?.name,
        });
        showToast('This account belongs to Volunteer Portal. Switch portal to login.', 'error');
      } else if (code === 'ROLE_MISMATCH_PILGRIM') {
        setPromptBanner({
          type: 'role_mismatch_pilgrim',
          message: `Access denied: This account is registered as a Pilgrim / Warkari account. Please use the Pilgrim Portal.`,
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

      // SECURITY GUARD: Strictly verify session role matches active portal
      if (session && session.role !== activePortal) {
        await authService.logout();
        showToast(`Security Violation: Mismatched role (${session.role}) for ${activePortal} portal. Access denied.`, 'error');
        return;
      }

      // Handle volunteer pending approval
      if (session && !session.is_approved && session.role === 'volunteer') {
        setPendingVolunteer({
          name: session.name || 'Field Sevekar',
          identifier: session.email || session.identifier,
          department: session.department || 'General Field Seva',
          squad_id: session.squad_id || 'PENDING-ASSIGNMENT',
          requested_at: 'Just now',
          userId: session.id,
        });
        showToast('Volunteer access request is awaiting Admin approval ⏳', 'info');
        return;
      }

      showToast(`Welcome back, ${session.name}!`);
      onLoginSuccess(session);
    } catch (err: any) {
      const code = err.code || err.data?.code;
      if (code === 'VOLUNTEER_PENDING_APPROVAL') {
        if (err?.data?.session) {
          const s = err.data.session;
          setPendingVolunteer({
            name: s.name || 'Field Sevekar',
            identifier: s.identifier || s.email,
            department: s.department || 'General Field Seva',
            squad_id: s.squad_id || 'PENDING-ASSIGNMENT',
            requested_at: 'Just now',
            userId: s.id,
          });
        }
        showToast('Volunteer request received. Awaiting Admin confirmation.', 'info');
        return;
      }
      if (code === 'ROLE_MISMATCH_ADMIN') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_admin',
          message: `This Google account is registered as an Admin / Seva Team account. For security reasons, Admin accounts must sign in via the Admin Command Center.`,
          identifier: err.data?.name || 'Admin',
          name: err.data?.name,
        });
        showToast('Access Denied: This account has Admin privileges. Switch to Admin Portal.', 'error');
        return;
      }
      if (code === 'ROLE_MISMATCH_VOLUNTEER') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_volunteer',
          message: `This Google account is registered as a Volunteer / Sevekar account. Please use the Volunteer Portal.`,
          identifier: err.data?.name || 'Volunteer',
          name: err.data?.name,
        });
        showToast('Access Denied: This account belongs to Volunteer Portal. Switch to Volunteer Portal.', 'error');
        return;
      }
      if (code === 'ROLE_MISMATCH_PILGRIM') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_pilgrim',
          message: `Access denied: This account is registered as a Pilgrim / Warkari account. Please use the Pilgrim Portal.`,
          identifier: err.data?.name || 'Pilgrim',
          name: err.data?.name,
        });
        showToast('Access Denied: This account belongs to Pilgrim Portal. Switch to Pilgrim Portal.', 'error');
        return;
      }
      showToast(err.message || 'Google sign-in failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Inline Register Form Submit (Create Account tab)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regIdentifier.trim() || !regPassword) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (activePortal === 'pilgrim') {
      const cleanPhone = regIdentifier.replace(/[\s\-\+\(\)]/g, '');
      if (cleanPhone.length < 10) {
        showToast('Please enter a valid 10-digit mobile number for registration.', 'error');
        return;
      }
    }

    if (regPassword.length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      const session = await authService.register(
        regName.trim(),
        regIdentifier.trim(),
        regPassword,
        activePortal,
        regOrg.trim() || undefined,
        activePortal === 'volunteer' ? regDepartment : undefined,
        activePortal === 'volunteer' ? regSquadId : undefined
      );

      // SECURITY GUARD: Strictly verify session role matches active portal
      if (session && session.role !== activePortal) {
        await authService.logout();
        showToast(`Security Violation: Mismatched role (${session.role}) for ${activePortal} portal. Access denied.`, 'error');
        return;
      }

      // Handle volunteer pending approval
      if (session && !session.is_approved && activePortal === 'volunteer') {
        setPendingVolunteer({
          name: session.name || regName.trim(),
          identifier: session.email || regIdentifier.trim(),
          department: regDepartment,
          squad_id: regSquadId,
          organization: regOrg,
          requested_at: 'Just now',
          userId: session.id,
        });
        showToast('Volunteer access request submitted! Awaiting Admin approval ⏳', 'info');
        return;
      }

      showToast(`Account created successfully! Welcome, ${session.name}! 🎉`);
      onLoginSuccess(session);
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // 4. Handle Google Sign-Up (Quick Registration)
  const handleGoogleSignUp = async () => {
    setIsGoogleRegistering(true);
    try {
      const session = await authService.googleLogin(activePortal);

      // SECURITY GUARD: Strictly verify session role matches active portal
      if (session && session.role !== activePortal) {
        await authService.logout();
        showToast(`Security Violation: Mismatched role (${session.role}) for ${activePortal} portal. Access denied.`, 'error');
        return;
      }

      // Handle volunteer pending approval
      if (session && !session.is_approved && session.role === 'volunteer') {
        setPendingVolunteer({
          name: session.name || 'Field Sevekar',
          identifier: session.email || session.identifier,
          department: session.department || 'General Field Seva',
          squad_id: session.squad_id || 'PENDING-ASSIGNMENT',
          requested_at: 'Just now',
          userId: session.id,
        });
        showToast('Volunteer access request submitted via Google! Awaiting Admin approval ⏳', 'info');
        return;
      }

      const roleLabel = session.role === 'admin' ? 'Admin' : session.role === 'volunteer' ? 'Volunteer' : 'Pilgrim';
      showToast(`Account created with Google! Welcome, ${session.name}! Routing to ${roleLabel} dashboard...`);
      onLoginSuccess(session);
    } catch (err: any) {
      const code = err.code || err.data?.code;
      if (code === 'VOLUNTEER_PENDING_APPROVAL') {
        if (err?.data?.session) {
          const s = err.data.session;
          setPendingVolunteer({
            name: s.name || 'Field Sevekar',
            identifier: s.identifier || s.email,
            department: s.department || 'General Field Seva',
            squad_id: s.squad_id || 'PENDING-ASSIGNMENT',
            requested_at: 'Just now',
            userId: s.id,
          });
        }
        showToast('Volunteer request received via Google. Please wait for Admin approval.', 'info');
        return;
      }
      if (code === 'ROLE_MISMATCH_ADMIN') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_admin',
          message: `This Google account is already registered as an Admin / Seva Team account. Please use the Admin Command Center to sign in.`,
          identifier: err.data?.name || 'Admin',
          name: err.data?.name,
        });
        showToast('Access Denied: This account has Admin privileges. Switch to Admin Portal.', 'error');
        return;
      }
      if (code === 'ROLE_MISMATCH_VOLUNTEER') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_volunteer',
          message: `This Google account is registered as a Volunteer / Sevekar account. Please use the Volunteer Portal.`,
          identifier: err.data?.name || 'Volunteer',
          name: err.data?.name,
        });
        showToast('Access Denied: This account belongs to Volunteer Portal. Switch to Volunteer Portal.', 'error');
        return;
      }
      if (code === 'ROLE_MISMATCH_PILGRIM') {
        try { await authService.logout(); } catch {}
        setPromptBanner({
          type: 'role_mismatch_pilgrim',
          message: `Access denied: This account is registered as a Pilgrim / Warkari account. Please use the Pilgrim Portal.`,
          identifier: err.data?.name || 'Pilgrim',
          name: err.data?.name,
        });
        showToast('Access Denied: This account belongs to Pilgrim Portal. Switch to Pilgrim Portal.', 'error');
        return;
      }
      showToast(err.message || 'Google sign-up failed. Please try again.', 'error');
    } finally {
      setIsGoogleRegistering(false);
    }
  };

  // 5. Handle Forgot Password - Request OTP
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

  // 6. Handle Forgot Password - Reset with OTP
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

  // Stable portal configurations matching the mockup styles
  const portalConfig = {
    pilgrim: {
      heading: authTab === 'signin' ? 'Welcome Back, Warkari!' : 'Create Pilgrim Account',
      subtitle: 'Sign in to continue your journey with VariMitra',
      signInBtn: 'Sign In as Pilgrim',
      createBtn: 'Create Pilgrim Account',
      activeTabBg: 'bg-[#ffedd5]',
      activeTabText: 'text-[#ea580c]',
      btnBg: 'bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c]',
      focusRing: 'focus-within:border-[#f97316] focus-within:ring-[#f97316]/20',
      forgotColor: 'text-[#ea580c] hover:text-[#c2410c]',
      linkHighlight: 'text-[#ea580c]',
      badgeBg: 'bg-[#ffedd5]',
      badgeText: 'text-[#ea580c]',
    },
    volunteer: {
      heading: authTab === 'signin' ? 'Welcome, Sevekar!' : 'Register as Volunteer',
      subtitle: 'Sign in to access your seva dashboard',
      signInBtn: 'Sign In as Volunteer',
      createBtn: 'Register as Sevekar',
      activeTabBg: 'bg-[#dcfce7]',
      activeTabText: 'text-[#15803d]',
      btnBg: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
      focusRing: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
      forgotColor: 'text-emerald-600 hover:text-emerald-700',
      linkHighlight: 'text-emerald-600',
      badgeBg: 'bg-[#dcfce7]',
      badgeText: 'text-[#15803d]',
    },
    admin: {
      heading: authTab === 'signin' ? 'Admin Command Center' : 'Request Admin Access',
      subtitle: 'Sign in to access administrative controls',
      signInBtn: 'Sign In as Admin',
      createBtn: 'Submit Admin Request',
      activeTabBg: 'bg-slate-100',
      activeTabText: 'text-slate-900',
      btnBg: 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black',
      focusRing: 'focus-within:border-slate-500 focus-within:ring-slate-500/20',
      forgotColor: 'text-slate-700 hover:text-slate-900',
      linkHighlight: 'text-slate-800',
      badgeBg: 'bg-[#e0e7ff]',
      badgeText: 'text-[#1e293b]',
    },
  }[activePortal];

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden font-sans text-slate-800 bg-[#fdfaf6]">
      {/* Full Screen Cinematic Panoramic Background with Soft Blur & Warm Daylight Veil (matches user screenshot) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src={templeBgImg}
          alt="Lord Vitthal Temple Background"
          className="w-full h-full object-cover object-center filter blur-[4px] scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Soft daylight / warm amber translucent veil matching mockup */}
        <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-amber-50/20 to-[#fdfaf6]/70" />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium border animate-toast-bounce max-w-[90vw] ${
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
          <button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
        <button
          id="btn-back-to-home"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ea580c] hover:text-[#c2410c] transition-colors py-1.5 px-2 rounded-lg cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.backToHome}</span>
        </button>

        <div className="flex-1 flex justify-center cursor-pointer" onClick={onBackToHome}>
          <VariMitraLogo tagline={t.tagline} size={42} fontSize={24} />
        </div>

        <div className="flex justify-end">
          <LanguageDropdown currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </header>

      {/* Main Content Area — Stable vertical anchoring prevents jumping */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-4 pt-3 pb-8 max-w-md mx-auto w-full">
        {/* The Exact Mockup Card with Distinct Visible Border */}
        <div
          id="auth-card"
          className="w-full bg-white/95 backdrop-blur-md rounded-3xl pt-6 px-6 sm:px-7 pb-0 shadow-[0_20px_50px_-10px_rgba(234,88,12,0.22),0_0_0_1px_rgba(251,146,60,0.3)] border-2 border-orange-300/80 relative overflow-hidden transition-shadow duration-200"
        >
          {/* Top-Right Decorative Mandala Watermark (from mockup) */}
          <MandalaCorner className="w-36 h-36 -top-2 -right-2" />

          {/* Top Badge Icon (Peach circle with orange walking pilgrim carrying flag) */}
          <div className="flex justify-center mb-3 relative z-10">
            {activePortal === 'pilgrim' ? (
              <div className="w-16 h-16 rounded-full bg-[#ffedd5] flex items-center justify-center text-[#ea580c] shadow-xs">
                <PilgrimBadgeIcon size="lg" className="w-16 h-16" />
              </div>
            ) : activePortal === 'volunteer' ? (
              <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d] shadow-xs">
                <VolunteerBadgeIcon size="lg" className="w-16 h-16" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#1e293b] shadow-xs">
                <AdminBadgeIcon size="lg" className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Title and Subtitle — Fixed min-height to guarantee zero layout shifts */}
          <div className="text-center mb-5 relative z-10 min-h-[58px] flex flex-col justify-center">
            <h1 id="signin-title" className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
              {portalConfig.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {portalConfig.subtitle}
            </p>
          </div>

          {/* Tab Switcher: [ Sign In ] [ Create Account ] */}
          <div className="flex items-center bg-[#f1f5f9] rounded-full p-1 mb-5 relative z-10">
            <button
              id="tab-signin"
              type="button"
              onClick={switchToSignInTab}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                authTab === 'signin'
                  ? `${portalConfig.activeTabBg} ${portalConfig.activeTabText} shadow-xs`
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-create"
              type="button"
              onClick={() => switchToCreateTab()}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                authTab === 'create'
                  ? `${portalConfig.activeTabBg} ${portalConfig.activeTabText} shadow-xs`
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Contextual Alert / Prompt Banner */}
          {promptBanner && (
            <div
              id="auth-prompt-banner"
              className={`mb-4 p-3 rounded-2xl border text-xs font-medium relative z-10 ${
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
              <div className="flex items-start gap-2">
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
                  {promptBanner.type === 'not_found' && (
                    <button
                      type="button"
                      onClick={() => switchToCreateTab(promptBanner.identifier || '')}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account with this number</span>
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
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch to Admin Portal</span>
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
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Switch to Volunteer Portal</span>
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
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      <Footprints className="w-3.5 h-3.5 text-white" />
                      <span>Switch to Pilgrim Portal</span>
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

          {/* Pending Volunteer Approval Live Radar Card */}
          {pendingVolunteer ? (
            <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl border border-emerald-500/40 shadow-xl space-y-4 text-center relative z-10 mb-4">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  ⏳ Awaiting Admin Confirmation
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  Volunteer Access Request Transmitted
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                  Central Command is reviewing your Sevekar request. As soon as confirmed, this screen will automatically open with command privileges.
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs space-y-1.5 text-left">
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
              </div>

              <div className="pt-1 flex flex-col gap-2">
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
          ) : authTab === 'signin' ? (
            /* ==================== SIGN IN TAB ==================== */
            <div className="relative z-10">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                {/* Mobile Number / Identifier Field */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {activePortal === 'pilgrim'
                      ? 'Mobile Number'
                      : activePortal === 'volunteer'
                      ? 'Volunteer ID or Mobile'
                      : 'Email Address'}
                  </label>
                  <div
                    className={`relative flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                  >
                    {activePortal === 'pilgrim' ? (
                      <>
                        <div className="flex items-center gap-1 text-slate-700 pr-2.5 border-r border-slate-200 shrink-0 select-none">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span className="text-xs font-bold text-slate-700">+91</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </div>
                        <Phone className="w-4 h-4 text-slate-400 ml-2.5 mr-2 shrink-0" />
                        <input
                          id="input-mobile-number"
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileNumber(e.target.value);
                            if (promptBanner) setPromptBanner(null);
                          }}
                          placeholder="Enter your mobile number"
                          maxLength={14}
                          required
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    ) : activePortal === 'volunteer' ? (
                      <>
                        <Phone className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
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
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
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
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {t.passwordLabel}
                  </label>
                  <div
                    className={`relative flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                  >
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="input-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (promptBanner) setPromptBanner(null);
                      }}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
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
                  <div className="flex justify-end mt-1.5">
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
                      className={`text-xs font-semibold cursor-pointer transition-colors ${portalConfig.forgotColor}`}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Main CTA Button: Sign In as Pilgrim -> */}
                <button
                  id="btn-submit-signin"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-2 py-3 px-4 ${portalConfig.btnBg} text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>{portalConfig.signInBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  OR
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Google Sign-In Button */}
              <button
                id="btn-google-signin"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Continue with Google</div>
                  <div className="text-[10px] text-slate-400 font-normal">Auto-detected & signed in</div>
                </div>
              </button>

              {/* Footer Switch to Create Account */}
              <div className="mt-4 text-center text-xs text-slate-500">
                <span>
                  New here?{' '}
                  <button
                    type="button"
                    id="btn-switch-to-create"
                    onClick={() => switchToCreateTab()}
                    className={`font-bold ${portalConfig.linkHighlight} hover:underline cursor-pointer`}
                  >
                    {activePortal === 'pilgrim'
                      ? 'Create Pilgrim Account'
                      : activePortal === 'volunteer'
                      ? 'Register as Sevekar'
                      : 'Request Admin Account'}
                  </button>
                </span>
              </div>
            </div>
          ) : (
            /* ==================== CREATE ACCOUNT TAB ==================== */
            <div className="relative z-10">
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Full Name *</label>
                  <div
                    className={`flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                  >
                    <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="input-register-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rameshwar Shinde"
                      required
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Number / Credential */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {activePortal === 'pilgrim'
                      ? 'Mobile Number (10 digits) *'
                      : activePortal === 'volunteer'
                      ? 'Mobile Number or Email *'
                      : 'Official Work Email *'}
                  </label>
                  <div
                    className={`flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                  >
                    {activePortal === 'pilgrim' ? (
                      <>
                        <div className="flex items-center gap-1 text-slate-700 pr-2.5 border-r border-slate-200 shrink-0 select-none">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span className="text-xs font-bold text-slate-700">+91</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </div>
                        <Phone className="w-4 h-4 text-slate-400 ml-2.5 mr-2 shrink-0" />
                        <input
                          id="input-register-phone"
                          type="tel"
                          value={regIdentifier}
                          onChange={(e) => setRegIdentifier(e.target.value)}
                          placeholder="9876543210"
                          maxLength={14}
                          required
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    ) : activePortal === 'volunteer' ? (
                      <>
                        <Phone className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                        <input
                          id="input-register-volunteer-id"
                          type="text"
                          value={regIdentifier}
                          onChange={(e) => setRegIdentifier(e.target.value)}
                          placeholder="9823114455 or sevekar@varimitra.org"
                          required
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                        <input
                          id="input-register-admin-email"
                          type="email"
                          value={regIdentifier}
                          onChange={(e) => setRegIdentifier(e.target.value)}
                          placeholder="officer@varimitra.org"
                          required
                          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Department for Volunteers (Only displayed in Volunteer Portal) */}
                {activePortal === 'volunteer' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                      Seva Squad Department *
                    </label>
                    <div
                      className={`flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                    >
                      <Building2 className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
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
                        className="w-full bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="Food & Annachatra Seva">🍲 Annachatra & Food Distribution</option>
                        <option value="First-Aid & Medical Response">🚑 First-Aid & Medical Emergency</option>
                        <option value="Clean Drinking Water Fleet">💧 Clean Drinking Water Supply</option>
                        <option value="Night Shelter & Tentage">⛺ Night Shelter & Rest Areas</option>
                        <option value="Eco-Sanitation & Swachh Wari">🧹 Eco-Sanitation & Swachh Wari</option>
                        <option value="Crowd & Traffic Marshals">🚦 Crowd Flow & Route Marshal</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Password *</label>
                  <div
                    className={`relative flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 transition-all ring-2 ring-transparent ${portalConfig.focusRing}`}
                  >
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      id="input-register-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Set password (min. 4 characters)"
                      required
                      minLength={4}
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-2 shrink-0"
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-submit-register"
                  type="submit"
                  disabled={isRegistering || isGoogleRegistering}
                  className={`w-full mt-2 py-3 px-4 ${portalConfig.btnBg} text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75`}
                >
                  {isRegistering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>{portalConfig.createBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  OR
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Google Sign-Up Button */}
              <button
                id="btn-google-signup-modal"
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleRegistering || isRegistering}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group disabled:opacity-60"
              >
                {isGoogleRegistering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-orange-500/40 border-t-orange-600 rounded-full animate-spin shrink-0" />
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold text-slate-800">Creating with Google...</div>
                      <div className="text-[10px] text-slate-400 font-normal">Setting up profile</div>
                    </div>
                  </>
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Sign up with Google</div>
                      <div className="text-[10px] text-slate-400 font-normal">Instant access — no password needed</div>
                    </div>
                  </>
                )}
              </button>

              {/* Footer Switch back to Sign In */}
              <div className="mt-4 text-center text-xs text-slate-500">
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    id="btn-switch-to-signin"
                    onClick={switchToSignInTab}
                    className={`font-bold ${portalConfig.linkHighlight} hover:underline cursor-pointer`}
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* Bottom Temple & Pilgrimage Artwork (matches mockup bottom illustration) */}
          <div className="relative w-[calc(100%+3rem)] sm:w-[calc(100%+3.5rem)] -mx-6 sm:-mx-7 mt-4 h-32 sm:h-36 overflow-hidden rounded-b-3xl select-none pointer-events-none">
            <img
              src={wariTempleBottomImg}
              alt="Pandharpur Wari Pilgrimage"
              className="w-full h-full object-cover object-bottom"
            />
            {/* Top gradient fade into card background */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white" />
          </div>
        </div>

        {/* Portal Switcher — Prominent and clear below the card */}
        <div className="mt-5 text-center text-sm sm:text-base text-slate-700 font-medium">
          {activePortal === 'pilgrim' ? (
            <span>
              Not a Pilgrim?{' '}
              <button
                type="button"
                onClick={() => onPortalChange('volunteer')}
                className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                Volunteer Login
              </button>
              <span className="mx-2 text-slate-400">·</span>
              <button
                type="button"
                onClick={() => onPortalChange('admin')}
                className="font-bold text-slate-800 hover:text-black hover:underline cursor-pointer"
              >
                Admin Login
              </button>
            </span>
          ) : activePortal === 'volunteer' ? (
            <span>
              Not a Volunteer?{' '}
              <button
                type="button"
                onClick={() => onPortalChange('pilgrim')}
                className="font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline cursor-pointer"
              >
                Pilgrim Login
              </button>
              <span className="mx-2 text-slate-400">·</span>
              <button
                type="button"
                onClick={() => onPortalChange('admin')}
                className="font-bold text-slate-800 hover:text-black hover:underline cursor-pointer"
              >
                Admin Login
              </button>
            </span>
          ) : (
            <span>
              Not an Admin?{' '}
              <button
                type="button"
                onClick={() => onPortalChange('pilgrim')}
                className="font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline cursor-pointer"
              >
                Pilgrim Login
              </button>
              <span className="mx-2 text-slate-400">·</span>
              <button
                type="button"
                onClick={() => onPortalChange('volunteer')}
                className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                Volunteer Login
              </button>
            </span>
          )}
        </div>
      </main>

      {/* Forgot Password / OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-modal-backdrop">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 relative animate-modal-card">
            <button
              type="button"
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
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${portalConfig.btnBg}`}
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
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white shadow-sm cursor-pointer ${portalConfig.btnBg}`}
                >
                  {isForgotSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
