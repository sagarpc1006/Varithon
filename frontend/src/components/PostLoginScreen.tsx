import React from "react";
import { LogOut, Footprints, Shield, Construction } from "lucide-react";
import { UserSession, Language } from "../types";
import { VariMitraLogo } from "./VariMitraLogo";
import { authService } from "../services/auth";

interface PostLoginScreenProps {
  session: UserSession;
  language: Language;
  onSignOut: () => void;
}

export const PostLoginScreen: React.FC<PostLoginScreenProps> = ({
  session,
  language,
  onSignOut,
}) => {
  const isPilgrim = session.role === "pilgrim";

  const greeting =
    language === "mr"
      ? `जय हरी विठ्ठल, ${session.name}!`
      : language === "hi"
      ? `जय हरि विट्ठल, ${session.name}!`
      : `Jai Hari Vitthal, ${session.name}!`;

  const roleLabel = isPilgrim
    ? language === "mr" ? "वारकरी पोर्टल" : language === "hi" ? "वारकरी पोर्टल" : "Pilgrim Portal"
    : language === "mr" ? "प्रशासन पोर्टल" : language === "hi" ? "प्रशासन पोर्टल" : "Admin Portal";

  const comingSoonText =
    language === "mr" ? "लवकरच येत आहे" : language === "hi" ? "जल्द आ रहा है" : "Coming Soon";

  const underBuildText =
    language === "mr"
      ? "हे पोर्टल सध्या बांधकामाधीन आहे. कृपया लवकरच परत या."
      : language === "hi"
      ? "यह पोर्टल अभी निर्माणाधीन है। कृपया जल्द वापस आएं।"
      : "This portal is currently under construction. Please check back soon.";

  const handleSignOut = async () => {
    await authService.logout();
    onSignOut();
  };

  const pilgrimFeatures = ["📍 Live Palkhi Tracking", "🆘 SOS Emergency", "🤖 AI Companion", "💧 Seva Resources"];
  const adminFeatures = ["📊 Crowd Analytics", "🚨 Alert Management", "🗺️ Route Control", "📋 Admin Reports"];
  const features = isPilgrim ? pilgrimFeatures : adminFeatures;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VariMitraLogo size={36} />
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest leading-none">
                {roleLabel}
              </p>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">
                {session.name}
              </p>
            </div>
          </div>
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-500 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl transition-all duration-200"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 shadow-sm">
          {isPilgrim ? <Footprints size={14} /> : <Shield size={14} />}
          {roleLabel}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 text-center leading-tight mb-3">
          {greeting} 🙏
        </h1>
        <p className="text-slate-500 text-center text-sm sm:text-base mb-12 max-w-md">
          {underBuildText}
        </p>

        <div className="relative bg-white border border-orange-100 rounded-3xl shadow-xl px-10 py-12 flex flex-col items-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-lg mb-6 animate-bounce">
            <Construction size={36} className="text-white" />
          </div>
          <span className="text-4xl font-black tracking-tighter text-slate-800 mb-2">
            {comingSoonText}
          </span>
          <p className="text-slate-400 text-xs text-center mt-1">
            {isPilgrim
              ? "Palkhi tracking, SOS, AI companion & more."
              : "Admin tools, crowd analytics, alerts & reports."}
          </p>
          <div className="mt-8 w-full bg-orange-50 rounded-full h-2 overflow-hidden border border-orange-100">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-300 rounded-full animate-pulse"
              style={{ width: "65%" }}
            />
          </div>
          <p className="text-xs text-orange-500 font-semibold mt-2">65% complete</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-10 justify-center">
          {features.map((tag) => (
            <span
              key={tag}
              className="text-xs font-semibold bg-white text-slate-600 border border-slate-200 rounded-full px-3 py-1 shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-slate-400 border-t border-orange-50">
        VariMitra · Powered by Wari Seva Technology · 2025
      </footer>
    </div>
  );
};
