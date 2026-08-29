import React, { useState } from "react";
import {
  Activity,
  MapPin,
  Stethoscope,
  BellRing,
  Users,
  AlertTriangle,
  Search,
  Settings,
  LogOut,
  Navigation2,
  ChevronRight,
  Shield,
  Menu,
  X,
  Compass,
  Heart,
  Droplets,
  Radio,
  MessageSquare,
  Sparkles,
  PhoneCall,
  CloudSun
} from "lucide-react";
import { UserSession, Language } from "../types";
import { VariMitraLogo } from "./VariMitraLogo";
import { LanguageDropdown } from "./LanguageDropdown";
import { authService } from "../services/auth";
import { WariMap } from "./WariMap";
import { SOSPage } from "../pages/user/SOSPage";
import { NearbyServicesMap } from "./NearbyServicesMap";
import { AlertsFeed } from "../pages/user/AlertsFeed";
import { UserGroupsOverview } from "./groups/UserGroupsOverview";
import { UserGroupChat } from "./groups/UserGroupChat";
import { ProfileView } from "./ProfileView";
import { WeatherView } from "./WeatherView";

interface UserDashboardProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
}

type UserView =
  | "dashboard"
  | "live-map"
  | "nearby-services"
  | "alerts"
  | "groups"
  | "group-chat"
  | "weather"
  | "sos"
  | "profile";

export const UserDashboard: React.FC<UserDashboardProps> = ({
  session: initialSession,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const [session, setSession] = useState<UserSession>(initialSession);
  const [currentView, setCurrentView] = useState<UserView>("dashboard");
  const [activeChatGroupId, setActiveChatGroupId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await authService.logout();
    onSignOut();
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "WU";
    const parts = nameStr.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-[#f3f5f8] text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* ════════════════ LEFT SIDEBAR ════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top: Logo & Portal Title */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <span className="text-xl">🚩</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  VariMitra
                </h1>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none mt-0.5">
                  Pilgrim Portal
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 flex flex-col gap-1.5">
            {/* 1. Pilgrim Hub */}
            <button
              id="nav-pilgrim-hub"
              onClick={() => {
                setCurrentView("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Activity size={16} />
              <span>Pilgrim Hub</span>
            </button>

            {/* 2. Live Palkhi Map */}
            <button
              id="nav-palkhi-map"
              onClick={() => {
                setCurrentView("live-map");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "live-map"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Compass size={16} />
              <span>Live Palkhi Route</span>
            </button>

            {/* 3. Nearby Services */}
            <button
              id="nav-nearby-services"
              onClick={() => {
                setCurrentView("nearby-services");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "nearby-services"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Stethoscope size={16} />
              <span>Nearby Seva Services</span>
            </button>

            {/* 4. Alerts Feed */}
            <button
              id="nav-alerts-feed"
              onClick={() => {
                setCurrentView("alerts");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "alerts"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <BellRing size={16} />
                <span>Emergency Alerts</span>
              </div>
              <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                Live
              </span>
            </button>

            {/* 5. Dindi Groups */}
            <button
              id="nav-dindi-groups"
              onClick={() => {
                setCurrentView("groups");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "groups" || currentView === "group-chat"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Users size={16} />
              <span>Dindi Community</span>
            </button>

            {/* 6. Route Weather */}
            <button
              id="nav-route-weather"
              onClick={() => {
                setCurrentView("weather");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "weather"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <CloudSun size={16} />
              <span>Route Weather</span>
            </button>

            {/* 7. Emergency SOS Help */}
            <button
              id="nav-emergency-sos"
              onClick={() => {
                setCurrentView("sos");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "sos"
                  ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-red-600/25"
                  : "text-red-600 hover:text-red-700 hover:bg-red-50"
              }`}
            >
              <AlertTriangle size={16} />
              <span>Emergency SOS Help</span>
            </button>
          </nav>
        </div>

        {/* Bottom of Sidebar: Profile Badge */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          {/* User Profile Badge (Click to open ProfileView) */}
          <div
            id="btn-sidebar-user-profile"
            onClick={() => {
              setCurrentView("profile");
              setMobileMenuOpen(false);
            }}
            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 transition-colors">
                {getInitials(session.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-orange-600 transition-colors">
                  {session.name || "Warkari Devotee"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono leading-tight">
                  ID: WKR-{String(session.id || 1008).padStart(4, "0")}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSignOut();
              }}
              title="Sign Out"
              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════ MAIN CONTENT WRAPPER ════════════════ */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* ── TOP HEADER BAR ── */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight capitalize">
                {currentView === "dashboard"
                  ? "Pilgrim Dashboard"
                  : currentView === "live-map"
                  ? "Live Palkhi Route Map"
                  : currentView === "nearby-services"
                  ? "Nearby Seva & Resources"
                  : currentView === "alerts"
                  ? "Emergency Safety Alerts"
                  : currentView === "groups"
                  ? "Dindi Community Groups"
                  : currentView === "group-chat"
                  ? "Dindi Live Chat"
                  : currentView === "weather"
                  ? "Live Route Weather Station"
                  : currentView === "sos"
                  ? "Emergency SOS Dispatch"
                  : "Pilgrim Profile"}
              </h2>
            </div>
          </div>

          {/* Center/Right Controls */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search halts, medical camps, dindis..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/80 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all"
              />
            </div>

            {/* Language Dropdown */}
            <LanguageDropdown
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              variant="light"
            />

            {/* Settings / Profile Button */}
            <button
              id="btn-user-settings"
              onClick={() => setCurrentView("profile")}
              title="Profile & Settings"
              className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-orange-600 transition-all cursor-pointer"
            >
              <Settings size={17} />
            </button>
          </div>
        </header>

        {/* ── MAIN BODY CONTENT ── */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {currentView === "sos" ? (
            <SOSPage onBackToDashboard={() => setCurrentView("dashboard")} />
          ) : currentView === "nearby-services" ? (
            <NearbyServicesMap
              onBack={() => setCurrentView("dashboard")}
              variant="user"
            />
          ) : currentView === "alerts" ? (
            <AlertsFeed onBack={() => setCurrentView("dashboard")} />
          ) : currentView === "weather" ? (
            <WeatherView
              session={session}
              language={language}
              onBack={() => setCurrentView("dashboard")}
            />
          ) : currentView === "group-chat" && activeChatGroupId ? (
            <UserGroupChat
              initialGroupId={activeChatGroupId}
              session={session}
              language={language}
              onBack={() => setCurrentView("groups")}
            />
          ) : currentView === "groups" ? (
            <UserGroupsOverview
              onBack={() => setCurrentView("dashboard")}
              session={session}
              language={language}
              onOpenChat={(groupId) => {
                setActiveChatGroupId(groupId);
                setCurrentView("group-chat");
              }}
            />
          ) : currentView === "live-map" ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Palkhi Telemetry & Route Progress
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Back to Hub
                </button>
              </div>
              <div className="relative w-full" style={{ height: "65vh" }}>
                <WariMap className="absolute inset-0" />
              </div>
            </div>
          ) : currentView === "profile" ? (
            <ProfileView
              session={session}
              language={language}
              onLanguageChange={onLanguageChange}
              onUpdateSession={(updated) => setSession(updated)}
              onBack={() => setCurrentView("dashboard")}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              {/* ════════════════ TOP 4 KPI CARDS ════════════════ */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Active Palkhi Progress */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Active Palkhi
                    </span>
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Compass size={14} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block leading-tight">
                      Saswad Halt
                    </span>
                    <span className="text-xs font-bold text-orange-600">
                      Sant Dnyaneshwar Palkhi
                    </span>
                  </div>
                </div>

                {/* 2. Next Halt ETA */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Next Stop
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MapPin size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Jejuri
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      ETA ~4.5h
                    </span>
                  </div>
                </div>

                {/* 3. Nearby Seva Facilities */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Nearby Seva
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Stethoscope size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      38+
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Camps Active
                    </span>
                  </div>
                </div>

                {/* 4. Highlighted Safety Status */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-100">
                      Route Condition
                    </span>
                    <Shield size={16} className="text-white opacity-80" />
                  </div>
                  <div className="mt-3">
                    <span className="text-lg sm:text-xl font-black text-white block leading-tight">
                      Optimal Route
                    </span>
                    <span className="text-xs font-bold text-emerald-100 opacity-90">
                      Clear Weather & Medical Patrols
                    </span>
                  </div>
                </div>
              </section>

              {/* ════════════════ MAIN 2-COLUMN SECTION ════════════════ */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── LEFT COLUMN (8 COLS): Live Map & Seva Overview ── */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Live Map Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          Live Palkhi Route Map
                        </h3>
                      </div>

                      <button
                        onClick={() => setCurrentView("nearby-services")}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Nearby Facilities</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div
                      className="relative w-full"
                      style={{ height: "320px", minHeight: "300px" }}
                    >
                      <WariMap className="absolute inset-0" />
                    </div>
                  </div>

                  {/* 5 Feature Quick-Pills for Pilgrims */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button
                      id="btn-user-nearby-services-pill"
                      onClick={() => setCurrentView("nearby-services")}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-300 shadow-xs flex flex-col items-center gap-2 text-center group cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Stethoscope size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Nearby Seva</p>
                        <p className="text-[10px] text-slate-500">Food, Water, Doctor</p>
                      </div>
                    </button>

                    <button
                      id="btn-user-alerts-pill"
                      onClick={() => setCurrentView("alerts")}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-red-300 shadow-xs flex flex-col items-center gap-2 text-center group cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BellRing size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Live Alerts</p>
                        <p className="text-[10px] text-slate-500">Weather & Detours</p>
                      </div>
                    </button>

                    <button
                      id="btn-user-weather-pill"
                      onClick={() => setCurrentView("weather")}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 shadow-xs flex flex-col items-center gap-2 text-center group cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CloudSun size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Route Weather</p>
                        <p className="text-[10px] text-slate-500">Live Halts Forecast</p>
                      </div>
                    </button>

                    <button
                      id="btn-user-groups-pill"
                      onClick={() => setCurrentView("groups")}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-purple-300 shadow-xs flex flex-col items-center gap-2 text-center group cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Dindi Groups</p>
                        <p className="text-[10px] text-slate-500">Chat with Members</p>
                      </div>
                    </button>

                    <button
                      id="btn-user-sos-pill"
                      onClick={() => setCurrentView("sos")}
                      className="p-3.5 bg-white rounded-xl border border-red-200 hover:border-red-400 shadow-xs flex flex-col items-center gap-2 text-center group cursor-pointer transition-all hover:-translate-y-0.5 bg-red-50/40"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-red-600/30">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-red-700">Emergency SOS</p>
                        <p className="text-[10px] text-red-500">1-Tap Help Dispatch</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (4 COLS): Emergency Contacts & Community Stream ── */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Emergency Helpline Box */}
                  <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl shadow-md p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <PhoneCall size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          Wari Emergency Helplines
                        </h3>
                        <p className="text-[10px] text-red-100">24/7 Field Seva Assistance</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 text-xs">
                        <span>Central Police Command:</span>
                        <a href="tel:112" className="font-mono font-bold text-white underline">112</a>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 text-xs">
                        <span>Ambulance & Medical:</span>
                        <a href="tel:108" className="font-mono font-bold text-white underline">108</a>
                      </div>
                      <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2 text-xs">
                        <span>VariMitra Field Seva:</span>
                        <a href="tel:18002092026" className="font-mono font-bold text-white underline">1800-209-2026</a>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentView("sos")}
                      className="w-full mt-2 bg-white text-red-600 font-extrabold text-xs py-2.5 rounded-xl shadow-xs hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Launch Emergency SOS
                    </button>
                  </div>

                  {/* Pilgrim Safety Guidelines */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-orange-500" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Wari Pilgrim Guidelines
                      </h3>
                    </div>

                    <ul className="text-xs text-slate-600 flex flex-col gap-2.5 pl-1">
                      <li className="flex items-start gap-2">
                        <Droplets size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>Stay hydrated — refill drinking water at verified Seva stalls.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <span>Keep your Dindi group chat active to avoid getting lost in crowd surges.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Stethoscope size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>Free medical camps and foot care centers available every 2-3 km.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="text-center py-3 text-[11px] text-slate-400 border-t border-slate-200 font-medium tracking-wide">
          VariMitra · Pilgrim Seva Hub · जय हरी विठ्ठल 🙏
        </footer>
      </div>
    </div>
  );
};
