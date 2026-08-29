import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Globe,
  HeartHandshake,
  Hash,
  Contact,
  Sparkles,
} from 'lucide-react';
import { UserSession, Language } from '../types';
import { authService } from '../services/auth';

interface ProfileViewProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateSession: (updated: UserSession) => void;
  onBack: () => void;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  language,
  onLanguageChange,
  onUpdateSession,
  onBack,
  onSignOut,
}) => {
  const isAdmin = session.role === 'admin';
  const [name, setName] = useState(session.name || '');
  const [email, setEmail] = useState(session.email || '');
  const [mobileNumber, setMobileNumber] = useState(session.mobile_number || '');
  const [organization, setOrganization] = useState(session.organization || '');
  const [dindiNumber, setDindiNumber] = useState((session as any).dindi_number || '');
  const [emergencyContact, setEmergencyContact] = useState((session as any).emergency_contact || '');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute initials for avatar
  const getInitials = (nameStr: string) => {
    if (!nameStr) return isAdmin ? 'SA' : 'WU';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updated = await authService.updateProfile({
        name,
        email,
        mobile_number: mobileNumber,
        organization,
        dindi_number: dindiNumber,
        emergency_contact: emergencyContact,
      });
      onUpdateSession(updated);
      setSuccessMessage('Profile details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-3xl mx-auto pb-10">
      {/* Top Bar / Back */}
      <div className="flex items-center justify-between">
        <button
          id="btn-profile-back"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Command Center</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {isAdmin ? 'Admin Credentials & Profile' : 'Pilgrim Devotee Profile'}
        </span>
      </div>

      {/* Hero Profile Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl p-6 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-orange-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar circle */}
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
              isAdmin
                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/30'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
            }`}>
              {getInitials(name)}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online & Active" />
          </div>

          {/* User title details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{name || 'Warkari Devotee'}</h1>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              }`}>
                {isAdmin ? '🛡️ Seva Admin Officer' : '🚩 Registered Warkari'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              ID: <span className="font-mono text-slate-200">{isAdmin ? `SVA-${String(session.id || 8921).padStart(4, '0')}` : `WKR-${String(session.id || 1008).padStart(4, '0')}`}</span>
              {organization && ` · ${organization}`}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Shield size={12} className="text-orange-400" />
                Verified Credential
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Globe size={12} className="text-blue-400" />
                Language: {language === 'mr' ? 'मराठी' : language === 'hi' ? 'हिंदी' : 'English'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight">Account Information</h2>
            <p className="text-xs text-slate-500">Update your identity and communication details</p>
          </div>
          <Sparkles size={18} className="text-orange-500" />
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              Full Name
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sagar Patil"
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              Email Address
            </label>
            <input
              id="profile-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@varimitra.org"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              Mobile Number
            </label>
            <input
              id="profile-phone-input"
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Organization / Seva Mandal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building size={13} className="text-slate-400" />
              {isAdmin ? 'Seva Mandal / Department' : 'Dindi / Mandal Name'}
            </label>
            <input
              id="profile-org-input"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={isAdmin ? 'Pandharpur Wari Central Seva Command' : 'Alandi Dindi Mandal No. 1'}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Dindi Number (For Pilgrims / Field units) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={13} className="text-slate-400" />
              Dindi / Sector Unit Number
            </label>
            <input
              id="profile-dindi-input"
              type="text"
              value={dindiNumber}
              onChange={(e) => setDindiNumber(e.target.value)}
              placeholder="e.g. Dindi No. 12 (Saswad)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Emergency Contact */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Contact size={13} className="text-slate-400" />
              Emergency Contact Person / Phone
            </label>
            <input
              id="profile-emergency-input"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="e.g. Ramesh Patil (+91 9123456780)"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Language Preference Bar */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800">Interface Language</p>
              <p className="text-[11px] text-slate-500">Choose your preferred portal language</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['en', 'mr', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            id="btn-profile-signout"
            type="button"
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out of Account</span>
          </button>

          <button
            id="btn-profile-save"
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md px-6 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
