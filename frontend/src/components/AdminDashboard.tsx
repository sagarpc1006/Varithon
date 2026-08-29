import React, { useState } from "react";
import {
  LogOut,
  Users,
  Package,
  Stethoscope,
  BellRing,
  Siren,
  BarChart3,
  MapPin,
  RefreshCw,
  Wifi,
  Navigation2,
  ChevronRight,
  Shield,
} from "lucide-react";
import { UserSession, Language } from "../types";
import { VariMitraLogo } from "./VariMitraLogo";
import { LanguageDropdown } from "./LanguageDropdown";
import { authService } from "../services/auth";
import { WariMap } from "./WariMap";

interface AdminDashboardProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
}

const LABELS = {
  en: {
    volunteers: "Volunteers Group",
    volunteersDesc: "Manage seva volunteers",
    resources: "Resources & Logistics",
    resourcesDesc: "Track supplies & deployment",
    nearbyServices: "Nearby Services",
    nearbyDesc: "Medical, water & food points",
    alertsReceived: "Alerts Received",
    alertsDesc: "Review incoming SOS alerts",
    updateAlerts: "Update Emergency Alerts",
    updateDesc: "Broadcast critical notices",
    crowdAnalytics: "Live Crowd Analytics",
    crowdDesc: "Real-time density monitoring",
    map: "Command Map",
    mapSub: "Palkhi route · Field ops overview",
    signOut: "Sign Out",
    liveRoute: "Live",
    location: "Field Active",
    adminPortal: "Admin Portal",
  },
  mr: {
    volunteers: "स्वयंसेवक गट",
    volunteersDesc: "सेवा स्वयंसेवकांचे व्यवस्थापन",
    resources: "संसाधने व लॉजिस्टिक",
    resourcesDesc: "पुरवठा व तैनाती ट्रॅक करा",
    nearbyServices: "जवळचे सेवा",
    nearbyDesc: "वैद्यकीय, पाणी व अन्न केंद्रे",
    alertsReceived: "प्राप्त अलर्ट",
    alertsDesc: "आलेले एसओएस अलर्ट पहा",
    updateAlerts: "आपत्कालीन अलर्ट अपडेट",
    updateDesc: "महत्त्वाच्या सूचना प्रसारित करा",
    crowdAnalytics: "थेट गर्दी विश्लेषण",
    crowdDesc: "रिअल-टाइम घनता निरीक्षण",
    map: "कमांड नकाशा",
    mapSub: "पालखी मार्ग · क्षेत्र ऑपरेशन",
    signOut: "बाहेर पडा",
    liveRoute: "थेट",
    location: "क्षेत्र सक्रिय",
    adminPortal: "प्रशासन पोर्टल",
  },
  hi: {
    volunteers: "स्वयंसेवक समूह",
    volunteersDesc: "सेवा स्वयंसेवकों का प्रबंधन",
    resources: "संसाधन और लॉजिस्टिक्स",
    resourcesDesc: "आपूर्ति और तैनाती ट्रैक करें",
    nearbyServices: "पास की सेवाएं",
    nearbyDesc: "चिकित्सा, जल और खाद्य केंद्र",
    alertsReceived: "प्राप्त अलर्ट",
    alertsDesc: "आने वाले SOS अलर्ट देखें",
    updateAlerts: "आपातकालीन अलर्ट अपडेट",
    updateDesc: "महत्वपूर्ण सूचनाएं प्रसारित करें",
    crowdAnalytics: "लाइव भीड़ विश्लेषण",
    crowdDesc: "रीयल-टाइम घनत्व निगरानी",
    map: "कमांड मानचित्र",
    mapSub: "पालखी मार्ग · क्षेत्र संचालन",
    signOut: "साइन आउट",
    liveRoute: "लाइव",
    location: "क्षेत्र सक्रिय",
    adminPortal: "प्रशासन पोर्टल",
  },
};

interface ActionCardProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  colorClass: string;
  glowClass: string;
  borderClass: string;
  badgeCount?: number;
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  id, icon, label, desc, colorClass, glowClass, borderClass, badgeCount, onClick
}) => (
  <button
    id={id}
    onClick={onClick}
    className={`group relative flex flex-col items-start gap-2 w-full rounded-2xl p-4 sm:p-5 bg-white/85 backdrop-blur-sm border ${borderClass} shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer overflow-hidden text-left`}
  >
    {/* Color glow */}
    <div className={`absolute -top-5 -right-5 w-24 h-24 rounded-full ${glowClass} opacity-15 group-hover:opacity-30 transition-opacity blur-2xl`} />

    <div className="flex items-center justify-between w-full z-10">
      <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
        {icon}
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badgeCount}
        </span>
      )}
    </div>

    <div className="z-10">
      <p className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
    </div>

    <ChevronRight size={14} className="absolute bottom-4 right-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
  </button>
);

import { SOSInbox } from '../pages/admin/SOSInbox';
import { AdminVolunteers } from './AdminVolunteers';
import { CrowdAnalytics } from '../pages/admin/CrowdAnalytics';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const t = LABELS[language];
  const [mapRefreshing, setMapRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'sos-inbox' | 'volunteers' | 'crowd-analytics'>('dashboard');

  const handleSignOut = async () => {
    await authService.logout();
    onSignOut();
  };

  const handleMapRefresh = () => {
    setMapRefreshing(true);
    setTimeout(() => setMapRefreshing(false), 1200);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans">

      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Left: Logo + Admin Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <VariMitraLogo variant="light" />
            <div className="hidden sm:flex flex-col ml-1">
              <div className="flex items-center gap-1.5">
                <Shield size={10} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">
                  {t.adminPortal}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[180px]">
                {session.name}
              </span>
            </div>
          </div>

          {/* Center: Field Status */}
          <div className="hidden md:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <Navigation2 size={11} />
            {t.location}
          </div>

          {/* Right: Language + Sign Out */}
          <div className="flex items-center gap-2">
            <LanguageDropdown
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              variant="light"
            />
            <button
              id="admin-signout-btn"
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

      {/* ═══ MAIN BODY ═══ */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-5">
        {currentView === 'sos-inbox' ? (
          <SOSInbox onBackToCommandMap={() => setCurrentView('dashboard')} />
        ) : currentView === 'volunteers' ? (
          <AdminVolunteers session={session} language={language} onBack={() => setCurrentView('dashboard')} />
        ) : currentView === 'crowd-analytics' ? (
          <CrowdAnalytics session={session} onBack={() => setCurrentView('dashboard')} />
        ) : (
          <>
            {/* ── COMMAND MAP ── */}
            <section
              className="relative w-full rounded-2xl overflow-hidden border border-blue-100 shadow-lg"
              style={{ minHeight: "260px", height: "35vh", maxHeight: "400px" }}
            >
              <WariMap className="absolute inset-0" />
            </section>

            {/* ── 2x3 ADMIN ACTION GRID ── */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4">

              {/* Row 1 */}
              <ActionCard
                id="btn-volunteers-group"
                icon={<Users size={20} className="text-white" />}
                label={t.volunteers}
                desc={t.volunteersDesc}
                colorClass="bg-gradient-to-br from-violet-500 to-purple-700"
                glowClass="bg-violet-400"
                borderClass="border-violet-100 hover:border-violet-300"
                onClick={() => setCurrentView('volunteers')}
              />
              <ActionCard
                id="btn-resources-logistics"
                icon={<Package size={20} className="text-white" />}
                label={t.resources}
                desc={t.resourcesDesc}
                colorClass="bg-gradient-to-br from-teal-500 to-emerald-600"
                glowClass="bg-teal-400"
                borderClass="border-teal-100 hover:border-teal-300"
              />

              {/* Row 2 */}
              <ActionCard
                id="btn-admin-nearby-services"
                icon={<Stethoscope size={20} className="text-white" />}
                label={t.nearbyServices}
                desc={t.nearbyDesc}
                colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
                glowClass="bg-emerald-400"
                borderClass="border-emerald-100 hover:border-emerald-300"
              />
              <ActionCard
                id="btn-alerts-received"
                icon={<BellRing size={20} className="text-white" />}
                label={t.alertsReceived}
                desc={t.alertsDesc}
                badgeCount={3}
                colorClass="bg-gradient-to-br from-amber-500 to-orange-500"
                glowClass="bg-amber-400"
                borderClass="border-amber-100 hover:border-amber-300"
                onClick={() => setCurrentView('sos-inbox')}
              />

              {/* Row 3 */}
              <ActionCard
                id="btn-update-emergency-alerts"
                icon={<Siren size={20} className="text-white" />}
                label={t.updateAlerts}
                desc={t.updateDesc}
                colorClass="bg-gradient-to-br from-red-500 to-rose-700"
                glowClass="bg-red-400"
                borderClass="border-red-100 hover:border-red-300"
              />
              <ActionCard
                id="btn-crowd-analytics"
                icon={<BarChart3 size={20} className="text-white" />}
                label={t.crowdAnalytics}
                desc={t.crowdDesc}
                colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
                glowClass="bg-blue-400"
                borderClass="border-blue-100 hover:border-blue-300"
                onClick={() => setCurrentView('crowd-analytics')}
              />

            </section>
          </>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="text-center py-3 text-[10px] text-slate-400 border-t border-orange-50 font-medium tracking-wide">
        VariMitra Admin · Wari Seva Command Centre · जय हरी विठ्ठल 🙏
      </footer>
    </div>
  );
};
