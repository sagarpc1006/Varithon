import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  AlertTriangle,
  Radio,
  MapPin,
  BarChart3,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
  UserCheck,
  Package,
  Send,
  CheckCircle2,
  Clock,
  Navigation2,
  Menu,
  X,
  Sparkles,
  Siren,
  Bell,
  MoreVertical,
  Plus
} from "lucide-react";
import { UserSession, Language } from "../types";
import { VariMitraLogo } from "./VariMitraLogo";
import { LanguageDropdown } from "./LanguageDropdown";
import { authService } from "../services/auth";
import { WariMap } from "./WariMap";
import { SOSInbox } from "../pages/admin/SOSInbox";
import { AdminVolunteers } from "./AdminVolunteers";
import { AlertBroadcast } from "../pages/admin/AlertBroadcast";
import { NearbyServicesMap } from "./NearbyServicesMap";
import { CrowdAnalytics } from "../pages/admin/CrowdAnalytics";
import { ProfileView } from "./ProfileView";
import { api } from "../services/api";

interface AdminDashboardProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
}

type AdminView =
  | "command-center"
  | "volunteers"
  | "sos-inbox"
  | "alert-broadcast"
  | "nearby-services"
  | "crowd-analytics"
  | "profile";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session: initialSession,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const [session, setSession] = useState<UserSession>(initialSession);
  const [currentView, setCurrentView] = useState<AdminView>("command-center");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Broadcast Form State
  const [targetZone, setTargetZone] = useState("All Zones");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Live SOS Incidents State
  const [activeSOSCount, setActiveSOSCount] = useState<number>(0);
  const [incidents, setIncidents] = useState([
    {
      id: "INC-092",
      type: "Medical Emergency",
      icon: Heart,
      iconColor: "text-rose-500 bg-rose-50 border-rose-200",
      location: "Saswad Geofence",
      status: "ACTIVE",
      statusColor: "bg-red-50 text-red-700 border-red-200 font-bold",
      time: "Just now",
    },
    {
      id: "INC-091",
      type: "Lost Item / Person",
      icon: Users,
      iconColor: "text-amber-500 bg-amber-50 border-amber-200",
      location: "Alandi Palkhi Route",
      status: "ACTIVE",
      statusColor: "bg-red-50 text-red-700 border-red-200 font-bold",
      time: "5 mins ago",
    },
  ]);

  // Fetch live SOS reports count
  useEffect(() => {
    const fetchSOSCount = async () => {
      try {
        const data = await api.get<any[]>('/sos/nearby/');
        if (Array.isArray(data)) {
          const activeReports = data.filter(r => r.status === 'active' || r.status === 'open' || r.status === 'acknowledged');
          setActiveSOSCount(activeReports.length);
          if (data.length > 0) {
            setIncidents(
              data.slice(0, 5).map((r) => {
                const isMed = r.type === 'medical';
                const isLost = r.type === 'lost_item' || r.type === 'lost_person';
                const rawStatus = (r.status || 'active').toLowerCase();
                const displayStatus = rawStatus === 'resolved' ? 'RESOLVED' : rawStatus === 'acknowledged' ? 'RESPONDED' : 'ACTIVE';
                const statusColor = rawStatus === 'resolved'
                  ? 'bg-green-50 text-green-700 border-green-200 font-bold'
                  : rawStatus === 'acknowledged'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                  : 'bg-red-50 text-red-700 border-red-200 font-bold';

                return {
                  id: `SOS-${r.id}`,
                  type: isMed ? 'Medical Emergency' : isLost ? 'Lost Item / Person' : r.type === 'restroom' ? 'Restroom Assistance' : 'General Issue',
                  icon: isMed ? Heart : isLost ? Users : Package,
                  iconColor: isMed ? 'text-rose-500 bg-rose-50 border-rose-200' : isLost ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-blue-500 bg-blue-50 border-blue-200',
                  location: `${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}`,
                  status: displayStatus,
                  statusColor,
                  time: 'Live',
                };
              })
            );
          }
        }
      } catch (err) {
        console.warn("Could not fetch SOS count in admin:", err);
      }
    };

    fetchSOSCount();
    const interval = setInterval(fetchSOSCount, 8000);
    return () => clearInterval(interval);
  }, []);

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState([
    {
      id: 1,
      tag: "Pilgrims",
      text: "Sant Dnyaneshwar Palkhi entered Saswad halt area (65,000+ devotees registered)",
      time: "Just now",
      color: "bg-orange-500",
    },
    {
      id: 2,
      tag: "Medical Seva",
      text: "Medical Camp #4 treated heat exhaustion patient; dispatched to mobile clinic",
      time: "4 mins ago",
      color: "bg-rose-500",
    },
    {
      id: 3,
      tag: "Volunteers",
      text: "Battalion Bravo assigned to Diverted Route near Dive Ghat",
      time: "12 mins ago",
      color: "bg-purple-500",
    },
    {
      id: 4,
      tag: "Broadcast",
      text: "High water station alert sent to Sector 3 volunteers",
      time: "25 mins ago",
      color: "bg-emerald-500",
    },
  ]);

  const handleSignOut = async () => {
    await authService.logout();
    onSignOut();
  };

  const handleSendQuickBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcasting(true);
    try {
      await api.post("/alerts/broadcast", {
        alert_type: "announcement",
        title: `Broadcast [${targetZone}]`,
        message: broadcastMessage,
        priority: "high",
        radius_km: 25.0,
      });

      setBroadcastSuccess(true);
      setBroadcastMessage("");
      setTimeout(() => setBroadcastSuccess(false), 3500);

      // Add to activity log
      setActivityLogs((prev) => [
        {
          id: Date.now(),
          tag: "Broadcast",
          text: `Alert broadcast sent to ${targetZone}: "${broadcastMessage.slice(0, 45)}..."`,
          time: "Just now",
          color: "bg-orange-500",
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Broadcast failed:", err);
    } finally {
      setBroadcasting(false);
    }
  };

  // Get Initials for avatar
  const getInitials = (nameStr: string) => {
    if (!nameStr) return "SA";
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
        {/* Top: Logo & System Title */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Shield size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  Seva Admin
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                  Central Monitoring
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
            {/* 1. Command Center */}
            <button
              id="nav-command-center"
              onClick={() => {
                setCurrentView("command-center");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "command-center"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Activity size={16} />
              <span>Command Center</span>
            </button>

            {/* 2. Telemetry (Volunteers) */}
            <button
              id="nav-volunteers"
              onClick={() => {
                setCurrentView("volunteers");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "volunteers"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Users size={16} />
              <span>Telemetry (Volunteers)</span>
            </button>

            {/* 3. Incidents (SOS) */}
            <button
              id="nav-incidents"
              onClick={() => {
                setCurrentView("sos-inbox");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "sos-inbox"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={16} />
                <span>Incidents (SOS)</span>
              </div>
              {activeSOSCount > 0 && (
                <span className="text-[10px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                  {activeSOSCount}
                </span>
              )}
            </button>

            {/* 4. Update Emergency Alerts */}
            <button
              id="nav-broadcast"
              onClick={() => {
                setCurrentView("alert-broadcast");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "alert-broadcast"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Radio size={16} />
              <span>Update Emergency Alerts</span>
            </button>

            {/* 5. Global Map */}
            <button
              id="nav-global-map"
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
              <MapPin size={16} />
              <span>Global Map</span>
            </button>

            {/* 6. Crowd Analytics */}
            <button
              id="nav-crowd-analytics"
              onClick={() => {
                setCurrentView("crowd-analytics");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentView === "crowd-analytics"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <BarChart3 size={16} />
              <span>Live Crowd Analytics</span>
            </button>
          </nav>
        </div>

        {/* Bottom of Sidebar: Emergency Broadcast & Profile Badge */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
          {/* Big Red Emergency Broadcast Button */}
          <button
            id="btn-sidebar-emergency-broadcast"
            onClick={() => {
              setCurrentView("alert-broadcast");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-extrabold py-3 px-3.5 rounded-xl shadow-md shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <AlertTriangle size={15} />
            <span>Emergency Broadcast</span>
          </button>

          {/* User Profile Badge (Click to open ProfileView) */}
          <div
            id="btn-sidebar-profile"
            onClick={() => {
              setCurrentView("profile");
              setMobileMenuOpen(false);
            }}
            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 transition-colors">
                {getInitials(session.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-orange-600 transition-colors">
                  {session.name || "Seva User"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono leading-tight">
                  ID: SVA-{String(session.id || 8921).padStart(4, "0")}
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
                {currentView === "command-center"
                  ? "Dashboard"
                  : currentView === "volunteers"
                  ? "Telemetry (Volunteers)"
                  : currentView === "sos-inbox"
                  ? "Active SOS Incidents"
                  : currentView === "alert-broadcast"
                  ? "Emergency Broadcast"
                  : currentView === "nearby-services"
                  ? "Global Map & Nearby Services"
                  : currentView === "crowd-analytics"
                  ? "Live Crowd Analytics"
                  : "Admin Profile"}
              </h2>
            </div>
          </div>

          {/* Center/Right Search Bar & Controls */}
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
                placeholder="Search logs, IDs, zones..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/80 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 transition-all"
              />
            </div>

            {/* Language Dropdown */}
            <LanguageDropdown
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              variant="light"
            />

            {/* Settings Gear Button (Opens Profile) */}
            <button
              id="btn-admin-settings"
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
          {currentView === "sos-inbox" ? (
            <SOSInbox onBackToCommandMap={() => setCurrentView("command-center")} />
          ) : currentView === "volunteers" ? (
            <AdminVolunteers
              session={session}
              language={language}
              onBack={() => setCurrentView("command-center")}
            />
          ) : currentView === "alert-broadcast" ? (
            <AlertBroadcast onBack={() => setCurrentView("command-center")} />
          ) : currentView === "nearby-services" ? (
            <NearbyServicesMap
              onBack={() => setCurrentView("command-center")}
              variant="admin"
            />
          ) : currentView === "crowd-analytics" ? (
            <CrowdAnalytics
              session={session}
              onBack={() => setCurrentView("command-center")}
            />
          ) : currentView === "profile" ? (
            <ProfileView
              session={session}
              language={language}
              onLanguageChange={onLanguageChange}
              onUpdateSession={(updated) => setSession(updated)}
              onBack={() => setCurrentView("command-center")}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              {/* ════════════════ TOP 4 KPI CARDS ════════════════ */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Active Responders */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Active Responders
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      1,248
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      ↑12%
                    </span>
                  </div>
                </div>

                {/* 2. Active Incidents */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      Active Incidents
                    </span>
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      14
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                      13 pending
                    </span>
                  </div>
                </div>

                {/* 3. System Health */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      System Health
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Shield size={14} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      99.8%
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Optimal
                    </span>
                  </div>
                </div>

                {/* 4. Highlighted Network Saturation */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-orange-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-100">
                      Network Saturation
                    </span>
                    <Activity size={16} className="text-white opacity-80" />
                  </div>
                  <div className="mt-3">
                    <span className="text-lg sm:text-xl font-black text-white block leading-tight">
                      Zone B
                    </span>
                    <span className="text-xs font-bold text-orange-100 opacity-90">
                      Heavy Density
                    </span>
                  </div>
                </div>
              </section>

              {/* ════════════════ MAIN 2-COLUMN SECTION ════════════════ */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── LEFT COLUMN (7 COLS): Incidents Table + Live Map ── */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Active Incidents Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        Active Incidents
                      </h3>
                      <button
                        onClick={() => setCurrentView("sos-inbox")}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-3">ID</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {incidents.map((inc) => {
                            const IconComponent = inc.icon;
                            return (
                              <tr
                                key={inc.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-3 font-mono font-bold text-slate-700">
                                  {inc.id}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center border ${inc.iconColor}`}
                                    >
                                      <IconComponent size={12} />
                                    </div>
                                    <span className="font-bold text-slate-800">
                                      {inc.type}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  {inc.location}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase border ${inc.statusColor}`}
                                  >
                                    {inc.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => setCurrentView("sos-inbox")}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                  >
                                    <MoreVertical size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Live Coverage Map Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          Live Route Coverage Map
                        </h3>
                      </div>

                      <button
                        onClick={() => setCurrentView("nearby-services")}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Manage Services</span>
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
                </div>

                {/* ── RIGHT COLUMN (4 COLS): Quick Broadcast + Activity Log ── */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Quick Broadcast Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
                        <Send size={15} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Quick Broadcast
                      </h3>
                    </div>

                    {broadcastSuccess && (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                        <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                        <span>Broadcast sent to all field responders!</span>
                      </div>
                    )}

                    <form onSubmit={handleSendQuickBroadcast} className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Target Zone
                        </label>
                        <select
                          value={targetZone}
                          onChange={(e) => setTargetZone(e.target.value)}
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                        >
                          <option value="All Zones">All Zones</option>
                          <option value="Alandi - Sector 1">Alandi - Sector 1</option>
                          <option value="Pune Camp - Sector 2">Pune Camp - Sector 2</option>
                          <option value="Saswad - Sector 3">Saswad - Sector 3</option>
                          <option value="Jejuri - Sector 4">Jejuri - Sector 4</option>
                          <option value="Lonand - Sector 5">Lonand - Sector 5</option>
                          <option value="Pandharpur - Core">Pandharpur - Core</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Message
                        </label>
                        <textarea
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Enter alert message..."
                          rows={3}
                          required
                          className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none"
                        />
                      </div>

                      <button
                        id="btn-admin-quick-broadcast"
                        type="submit"
                        disabled={broadcasting}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>{broadcasting ? "Broadcasting..." : "Send Broadcast"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Activity Log Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Activity Log
                      </h3>
                      <Clock size={15} className="text-slate-400" />
                    </div>

                    <div className="flex flex-col gap-3">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${log.color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800 text-[11px]">
                                {log.tag}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {log.time}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                              {log.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="text-center py-3 text-[11px] text-slate-400 border-t border-slate-200 font-medium tracking-wide">
          VariMitra Admin · Seva Central Monitoring · जय हरी विठ्ठल 🙏
        </footer>
      </div>
    </div>
  );
};
