import React, { useState, useRef, useEffect } from 'react';
import {
  LogIn,
  ChevronDown,
  Shield,
  ArrowRight,
  Footprints,
} from 'lucide-react';
import { Language, PortalType } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';

interface HomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSelectPortal: (portal: PortalType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onLanguageChange,
  onSelectPortal,
}) => {
  const t = translations[language];
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement>(null);

  // Close login dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target as Node)) {
        setShowLoginMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden font-sans select-none bg-black">
      {/* Full Screen Cinematic Panoramic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/pandharpur_wari_full_bg_1787548239851.jpg"
          alt="Lord Vitthal Temple and Pandharpur Wari Pilgrimage"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform scale-100 filter brightness-95 contrast-105"
        />
        {/* Soft Vignette and Gradient Overlay for perfect typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75 pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Top Header / Navigation Bar */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-2 flex items-center justify-between">
        {/* Left empty balance spacer */}
        <div className="w-24 sm:w-48 hidden md:block" />

        {/* Center: VariMitra Logo & Tagline */}
        <div className="flex-1 flex justify-center cursor-pointer" onClick={() => onSelectPortal('pilgrim')}>
          <VariMitraLogo variant="dark" tagline={t.tagline} />
        </div>

        {/* Right: Login / Sign Up Button & Language Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-3 justify-end">
          {/* Login / Sign Up Dropdown Trigger */}
          <div className="relative" ref={loginMenuRef}>
            <button
              id="btn-top-login-signup"
              type="button"
              onClick={() => setShowLoginMenu(!showLoginMenu)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-[#ea580c] hover:bg-[#d94806] rounded-full shadow-lg shadow-orange-950/40 border border-orange-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span>Login / Sign Up</span>
              <ChevronDown className={`w-3 h-3 text-white/80 transition-transform duration-200 ${showLoginMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Login / Sign Up Selection Popover */}
            {showLoginMenu && (
              <div
                id="login-selection-popover"
                className="absolute right-0 mt-2.5 w-64 sm:w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-white"
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
                    Select Your Portal
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    Choose account type to proceed
                  </p>
                </div>

                {/* Option 1: Pilgrim / Warkari Login */}
                <button
                  id="btn-popover-pilgrim"
                  onClick={() => {
                    setShowLoginMenu(false);
                    onSelectPortal('pilgrim');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                      <Footprints className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                        Pilgrim / Warkari
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Login or register as devotee
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Option 2: Admin / Seva Team Login */}
                <button
                  id="btn-popover-admin"
                  onClick={() => {
                    setShowLoginMenu(false);
                    onSelectPortal('admin');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors group text-left cursor-pointer mt-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        Admin / Seva Team
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Authorized officer login
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown (Glassmorphic) */}
          <LanguageDropdown
            currentLanguage={language}
            onLanguageChange={onLanguageChange}
            variant="glass"
          />
        </div>
      </header>

      {/* Main Center Area: Exact Sacred Chant & Titles from Screenshot */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-8 max-w-4xl mx-auto my-auto">
        {/* Sacred Chant: ॥ विठ्ठल विठ्ठल जय हरी विठ्ठल ॥ */}
        <div className="space-y-3 sm:space-y-4">
          <h1
            id="sacred-devanagari-hero-chant"
            className="font-devanagari text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex items-center justify-center gap-2 sm:gap-4 flex-wrap"
          >
            <span className="text-[#f97316] font-bold">॥</span>
            <span className="text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              {t.chant.replace(/॥/g, '').trim()}
            </span>
            <span className="text-[#f97316] font-bold">॥</span>
          </h1>

          {/* Subtitle: Smart. Safe. Spiritual. */}
          <p
            id="hero-tagline-smart"
            className="text-lg sm:text-2xl md:text-[28px] font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          >
            {t.smartSafeSpiritual}
          </p>

          {/* Subtext: Your AI-powered companion for a safe and blessed Wari. */}
          <p
            id="hero-companion-desc"
            className="text-xs sm:text-base md:text-lg text-slate-200/95 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] px-2"
          >
            {t.heroSubtext}
          </p>
        </div>
      </main>
    </div>
  );
};
