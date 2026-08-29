import React, { useState } from "react";
import {
  LogOut,
  MapPin,
  Stethoscope,
  BellRing,
  Users,
  PhoneCall,
  Globe,
  Navigation2,
  Wifi,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { UserSession, Language } from "../types";
import { VariMitraLogo } from "./VariMitraLogo";
import { LanguageDropdown } from "./LanguageDropdown";
import { authService } from "../services/auth";
import { WariMap } from "./WariMap";

interface UserDashboardProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
}

const LABELS = {
  en: {
    nearbyServices: "Nearby Services",
    nearbyDesc: "Find medical, water & food",
    alerts: "Alerts",
    alertsDesc: "Live crowd & route alerts",
    groups: "Groups",
    groupsDesc: "Connect with dindi groups",
    sos: "SOS",
    sosDesc: "Emergency assistance",
    map: "Live Map",
    mapSub: "Palkhi route & your location",
    signOut: "Sign Out",
    mapPlaceholder: "Map loading...",
    liveRoute: "Live Route",
    location: "Locating...",
  },
  mr: {
    nearbyServices: "जवळचे सेवा",
    nearbyDesc: "वैद्यकीय, पाणी व अन्न",
    alerts: "सतर्कता",
    alertsDesc: "थेट गर्दी व मार्ग अलर्ट",
    groups: "गट",
    groupsDesc: "दिंडी गटांशी जोडा",
    sos: "एसओएस",
    sosDesc: "तातडीची मदत",
    map: "थेट नकाशा",
    mapSub: "पालखी मार्ग व तुमचे स्थान",
    signOut: "बाहेर पडा",
    mapPlaceholder: "नकाशा लोड होत आहे...",
    liveRoute: "थेट मार्ग",
    location: "स्थान शोधत आहे...",
  },
  hi: {
    nearbyServices: "पास की सेवाएं",
    nearbyDesc: "चिकित्सा, जल और भोजन",
    alerts: "अलर्ट",
    alertsDesc: "लाइव भीड़ और मार्ग अलर्ट",
    groups: "समूह",
    groupsDesc: "दिंडी समूहों से जुड़ें",
    sos: "एसओएस",
    sosDesc: "आपातकालीन सहायता",
    map: "लाइव मैप",
    mapSub: "पालखी मार्ग और आपका स्थान",
    signOut: "साइन आउट",
    mapPlaceholder: "मानचित्र लोड हो रहा है...",
    liveRoute: "लाइव रूट",
    location: "स्थान खोज रहे हैं...",
  },
};

const QuickActionCard: React.FC<{
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  colorClass: string;
  glowClass: string;
  borderClass: string;
  onClick?: () => void;
}> = ({ id, icon, label, desc, colorClass, glowClass, borderClass, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className={`group relative flex flex-col items-start gap-2 w-full rounded-2xl p-4 sm:p-5 bg-white/80 backdrop-blur-sm border ${borderClass} shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer overflow-hidden`}
  >
    {/* subtle color glow behind card */}
    <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${glowClass} opacity-20 group-hover:opacity-35 transition-opacity blur-xl`} />
    <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
      {icon}
    </div>
    <div className="text-left z-10">
      <p className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
    </div>
    <ChevronRight size={14} className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
  </button>
);

import { SOSPage } from '../pages/user/SOSPage';
import { UserGroupsOverview } from './groups/UserGroupsOverview';
import { UserGroupChat } from './groups/UserGroupChat';
import { AlertsFeed } from '../pages/user/AlertsFeed';

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const t = LABELS[language];
  const [mapRefreshing, setMapRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'sos' | 'groups' | 'group-chat' | 'alerts'>('dashboard');
  const [activeChatGroupId, setActiveChatGroupId] = useState<number | null>(null);

  const handleSignOut = async () => {
    await authService.logout();
    onSignOut();
  };

  const handleMapRefresh = () => {
    setMapRefreshing(true);
    setTimeout(() => setMapRefreshing(false), 1200);
  };

  if (currentView === 'sos') {
    return <SOSPage onBackToDashboard={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans">

      {/* ════════════════ NAVBAR ════════════════ */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Left: Logo + User Info */}
          <div className="flex items-center gap-3 min-w-0">
            <VariMitraLogo variant="light" />
            <div className="hidden sm:flex flex-col ml-1">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                Pilgrim Portal
              </span>
              <span className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[160px]">
                {session.name}
              </span>
            </div>
          </div>

          {/* Center: Live location pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Navigation2 size={11} />
            {t.location}
          </div>

          {/* Right: Language + SignOut */}
          <div className="flex items-center gap-2">
            <LanguageDropdown
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              variant="light"
            />
            <button
              id="user-signout-btn"
              onClick={handleSignOut}
              title={t.signOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl transition-all duration-200"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════ MAIN BODY ════════════════ */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-5">
        {currentView === 'group-chat' && activeChatGroupId ? (
          <UserGroupChat
            initialGroupId={activeChatGroupId}
            session={session}
            language={language}
            onBack={() => setCurrentView('groups')}
          />
        ) : currentView === 'groups' ? (
          <UserGroupsOverview
            onBack={() => setCurrentView('dashboard')}
            session={session}
            language={language}
            onOpenChat={(groupId) => {
              setActiveChatGroupId(groupId);
              setCurrentView('group-chat');
            }}
          />
        ) : currentView === 'alerts' ? (
          <AlertsFeed onBack={() => setCurrentView('dashboard')} />
        ) : (
          <>
            {/* ── MAP SECTION ── */}
            <section className="relative w-full rounded-2xl overflow-hidden border border-orange-100 shadow-lg" style={{ minHeight: "280px", height: "38vh", maxHeight: "420px" }}>
              <WariMap className="w-full h-full" />
              <button
                id="btn-refresh-map"
                onClick={handleMapRefresh}
                title="Refresh Map"
                className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm border border-orange-200 text-orange-700 hover:bg-orange-500 hover:text-white p-2 rounded-xl shadow-md transition-all duration-200"
              >
                <RefreshCw size={15} className={mapRefreshing ? "animate-spin" : ""} />
              </button>
            </section>

            {/* ── QUICK ACTION BUTTONS 2×2 GRID ── */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4">

              {/* Nearby Services */}
              <QuickActionCard
                id="btn-nearby-services"
                icon={<Stethoscope size={20} className="text-white" />}
                label={t.nearbyServices}
                desc={t.nearbyDesc}
                colorClass="bg-gradient-to-br from-emerald-500 to-teal-600"
                glowClass="bg-emerald-400"
                borderClass="border-emerald-100 hover:border-emerald-300"
              />

              {/* Alerts */}
              <QuickActionCard
                id="btn-alerts"
                icon={<BellRing size={20} className="text-white" />}
                label={t.alerts}
                desc={t.alertsDesc}
                colorClass="bg-gradient-to-br from-amber-500 to-orange-500"
                glowClass="bg-amber-400"
                borderClass="border-amber-100 hover:border-amber-300"
                onClick={() => setCurrentView('alerts')}
              />

              {/* Groups */}
              <QuickActionCard
                id="btn-groups"
                icon={<Users size={20} className="text-white" />}
                label={t.groups}
                desc={t.groupsDesc}
                colorClass="bg-gradient-to-br from-violet-500 to-purple-600"
                glowClass="bg-violet-400"
                borderClass="border-violet-100 hover:border-violet-300"
                onClick={() => setCurrentView('groups')}
              />

              {/* SOS */}
              <QuickActionCard
                id="btn-sos"
                icon={<PhoneCall size={20} className="text-white" />}
                label={t.sos}
                desc={t.sosDesc}
                colorClass="bg-gradient-to-br from-red-500 to-rose-600"
                glowClass="bg-red-400"
                borderClass="border-red-100 hover:border-red-300"
                onClick={() => setCurrentView('sos')}
              />

            </section>
          </>
        )}
      </main>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="text-center py-3 text-[10px] text-slate-400 border-t border-orange-50 font-medium tracking-wide">
        VariMitra · Wari Seva Technology · जय हरी विठ्ठल 🙏
      </footer>
    </div>
  );
};
