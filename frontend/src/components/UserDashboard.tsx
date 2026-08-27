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

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const t = LABELS[language];
  const [mapRefreshing, setMapRefreshing] = useState(false);

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

        {/* ── MAP SECTION ── */}
        <section className="relative w-full rounded-2xl overflow-hidden border border-orange-100 shadow-lg" style={{ minHeight: "280px", height: "38vh", maxHeight: "420px" }}>
          {/* Map background – decorative SVG wari route map placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4e8] via-[#f0f7ee] to-[#e4f0fb]">
            {/* Subtle grid lines like a map */}
            <svg width="100%" height="100%" className="opacity-30">
              <defs>
                <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />
              {/* Palkhi Route line */}
              <path
                d="M 80 220 Q 180 160 280 180 Q 380 200 460 150 Q 540 100 640 130 Q 720 155 820 120"
                stroke="#f97316"
                strokeWidth="3"
                fill="none"
                strokeDasharray="10 5"
                className="opacity-70"
              />
              {/* Checkpoints */}
              {[
                { cx: 80, cy: 220 }, { cx: 280, cy: 180 }, { cx: 460, cy: 150 },
                { cx: 640, cy: 130 }, { cx: 820, cy: 120 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="6" fill="#f97316" opacity="0.8" />
              ))}
              {/* Current position pulse ring */}
              <circle cx="460" cy="150" r="14" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.5">
                <animate attributeName="r" from="10" to="22" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* Place labels overlay */}
            <div className="absolute left-[5%] bottom-8 text-[10px] font-bold text-slate-500">Pune</div>
            <div className="absolute left-[29%] bottom-12 text-[10px] font-bold text-slate-500">Saswad</div>
            <div className="absolute left-[48%] top-10 text-[10px] font-bold text-orange-600">● Jejuri</div>
            <div className="absolute left-[66%] top-8 text-[10px] font-bold text-slate-500">Lonand</div>
            <div className="absolute right-[6%] top-6 text-[10px] font-bold text-slate-500">Pandharpur</div>
          </div>

          {/* Map Top Bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-white/80 to-transparent backdrop-blur-xs z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">{t.map}</span>
              <span className="hidden sm:inline text-[10px] text-slate-400">— {t.mapSub}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">
                <Wifi size={9} />
                {t.liveRoute}
              </div>
              <button
                id="map-refresh-btn"
                onClick={handleMapRefresh}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/70 border border-slate-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <RefreshCw size={12} className={`text-slate-500 ${mapRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Map Bottom Pill – current location */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-orange-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md z-10">
            <MapPin size={11} className="text-orange-500" />
            Jejuri Checkpoint · 2h 15m to Pandharpur
          </div>
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
          />

        </section>
      </main>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="text-center py-3 text-[10px] text-slate-400 border-t border-orange-50 font-medium tracking-wide">
        VariMitra · Wari Seva Technology · जय हरी विठ्ठल 🙏
      </footer>
    </div>
  );
};
