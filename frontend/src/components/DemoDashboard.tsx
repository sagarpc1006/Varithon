import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Bot,
  AlertTriangle,
  Radio,
  Users,
  Compass,
  HeartPulse,
  LogOut,
  Calendar,
  Sparkles,
  Volume2,
  Navigation,
  RefreshCw,
  Send,
  X,
  CheckCircle2,
  Shield,
  Droplets,
  Utensils,
  Home,
  PhoneCall,
  Activity,
  Bell,
  User as UserIcon,
  Settings,
  LayoutDashboard,
  FileText,
  UserCheck,
  Menu,
} from 'lucide-react';
import {
  Language,
  UserSession,
  PalkhiLocationData,
  SevaResourceData,
  CrowdDensityData,
  AIChatMessage,
  NavTabType,
} from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { wariService } from '../services/wari';
import { authService } from '../services/auth';
import { UserGroupsOverview } from './groups/UserGroupsOverview';
import { UserGroupChat } from './groups/UserGroupChat';
import { AdminGroupManagement } from './groups/AdminGroupManagement';
import { AdminGroupDetail } from './groups/AdminGroupDetail';
import { AdminVolunteers } from './AdminVolunteers';

interface DemoDashboardProps {
  session: UserSession;
  language: Language;
  onSignOut: () => void;
}

export const DemoDashboard: React.FC<DemoDashboardProps> = ({
  session,
  language,
  onSignOut,
}) => {
  const t = translations[language];
  const isPilgrim = session.role === 'pilgrim';

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTabType>(
    isPilgrim ? 'groups' : 'admin_groups'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Group Subview States
  const [selectedUserChatGroupId, setSelectedUserChatGroupId] = useState<number | null>(null);
  const [adminSelectedGroupId, setAdminSelectedGroupId] = useState<number | null>(null);

  // Live Backend Data States
  const [loading, setLoading] = useState(true);
  const [palkhi, setPalkhi] = useState<PalkhiLocationData | null>(null);
  const [resources, setResources] = useState<SevaResourceData[]>([]);
  const [crowd, setCrowd] = useState<CrowdDensityData | null>(null);
  const [pendingAlertsCount, setPendingAlertsCount] = useState<number>(0);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  // Active Category Filter for Resources
  const [activeResourceCategory, setActiveResourceCategory] = useState<string>('ALL');

  // Emergency SOS Modal State
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosType, setSOSType] = useState('MEDICAL');
  const [sosLocation, setSOSLocation] = useState('Saswad Checkpoint Near Camp 4');
  const [sosDesc, setSOSDesc] = useState('');
  const [isSubmittingSOS, setIsSubmittingSOS] = useState(false);
  const [sosSuccessMessage, setSosSuccessMessage] = useState<string | null>(null);

  // AI Assistant Drawer/Modal State
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        language === 'mr'
          ? `जय हरी विठ्ठल, ${session.name}! 🙏 मी वारीमित्र एआय आहे. पालखी मार्ग, पाणी स्टॉल, किंवा रुग्णवाहिकेबद्दल काहीही विचारा.`
          : language === 'hi'
          ? `जय हरि विट्ठल, ${session.name}! 🙏 मैं वारीमित्र एआई हूँ। पालखी की स्थिति, जल सेवा या चिकित्सा सहायता के बारे में पूछें।`
          : `Jai Hari Vitthal, ${session.name}! 🙏 I am your VariMitra AI companion. Ask me anything about live Palkhi tracking, water stalls, or medical emergency support.`,
      timestamp: 'Now',
    },
  ]);

  // Load telemetry from Django backend
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overview, resList] = await Promise.all([
        wariService.getDashboardOverview(),
        wariService.getResources(),
      ]);

      if (overview) {
        if (overview.palkhi) setPalkhi(overview.palkhi);
        if (overview.crowd_status) setCrowd(overview.crowd_status);
        setPendingAlertsCount(overview.pending_alerts_count || 0);
      }
      if (resList && resList.length > 0) {
        setResources(resList);
      }
      setBackendConnected(true);
    } catch (err) {
      console.warn('Dashboard live API fetch fallback:', err);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle SOS Dispatch
  const handleTriggerSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSOS(true);
    try {
      const res = await wariService.triggerSOS({
        alert_type: sosType,
        caller_name: session.name,
        caller_phone: session.mobile_number || session.identifier,
        location_name: sosLocation,
        description: sosDesc || 'Devotee requested immediate assistance via VariMitra app.',
      });
      setSosSuccessMessage(res.message);
      setPendingAlertsCount((prev) => prev + 1);
      setTimeout(() => {
        setSosSuccessMessage(null);
        setShowSOSModal(false);
        setSOSDesc('');
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch SOS alert. Please dial 108 or 112 directly!');
    } finally {
      setIsSubmittingSOS(false);
    }
  };

  // Handle AI Chat Submit
  const handleSendAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await wariService.sendAIChatMessage(query, language, session.name);
      const botMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: res.timestamp || 'Now',
        category: res.category,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text:
          language === 'mr'
            ? 'पालखी सध्या सासवड ते जेजुरी दरम्यान मार्गस्थ आहे. तातडीच्या मदतीसाठी १०८ वर संपर्क साधा.'
            : 'Palkhi is moving steadily towards Jejuri. For direct emergency contact, call 108 (Ambulance) or 112.',
        timestamp: 'Now',
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleLogoutClick = async () => {
    await authService.logout();
    onSignOut();
  };

  const filteredResources =
    activeResourceCategory === 'ALL'
      ? resources
      : resources.filter((r) => r.category === activeResourceCategory);

  // User Navigation Items matching visual reference
  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracking', label: 'Live Tracking', icon: Compass },
    { id: 'seva', label: 'Seva & Facilities', icon: HeartPulse },
    { id: 'groups', label: 'Groups', icon: Users, badge: 'NEW' },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: 3 },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Admin Navigation Items matching visual reference
  const adminNavItems = [
    { id: 'admin_overview', label: 'Admin Dashboard', icon: Shield },
    { id: 'admin_overview', label: 'Overview', icon: Activity },
    { id: 'admin_monitoring', label: 'Live Monitoring', icon: Radio },
    { id: 'admin_volunteers', label: 'Volunteers', icon: Users },
    { id: 'admin_groups', label: 'Groups', icon: Users },
    { id: 'admin_announcements', label: 'Announcements', icon: Volume2 },
    { id: 'admin_reports', label: 'Reports & Alerts', icon: AlertTriangle },
    { id: 'admin_users', label: 'Users', icon: UserCheck },
    { id: 'admin_logs', label: 'System Logs', icon: FileText },
    { id: 'admin_settings', label: 'Settings', icon: Settings },
  ];

  const currentNavItems = isPilgrim ? userNavItems : adminNavItems;

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors bg-[#faf7f2] text-slate-800"
    >
      {/* Top Header Bar matching visual reference */}
      <header
        className="border-b border-slate-200/90 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs bg-white text-slate-800"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <VariMitraLogo tagline="" className="items-start" />
          </div>

          <div className="flex items-center gap-3">
            {/* Live API Status Pill */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Django REST API Connected</span>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh Live Telemetry"
              className="p-2 rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">
                {session.name}
              </p>
              <p className="text-[11px] font-medium capitalize text-slate-500">
                {isPilgrim ? 'Warkari Devotee' : 'Seva Team Administrator'}
              </p>
            </div>

            <button
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout: Left Navigation Sidebar + Right Content Area */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex">
        {/* Left Sidebar Navigation matching visual preview */}
        <aside
          className="w-60 shrink-0 p-4 border-r border-slate-200/90 hidden lg:flex flex-col justify-between bg-[#faf7f2]"
        >
          <nav className="space-y-1.5">
            {currentNavItems.map((item, idx) => {
              const IconComp = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'groups' && activeTab === 'groups') ||
                (item.id === 'admin_groups' && activeTab === 'admin_groups');

              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    setActiveTab(item.id as NavTabType);
                    if (item.id === 'groups') setSelectedUserChatGroupId(null);
                    if (item.id === 'admin_groups') setAdminSelectedGroupId(null);
                    if (item.id === 'ai') setShowAIChat(true);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-100/80 text-orange-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {item.count && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <div
              className="relative w-64 max-w-[80%] h-full p-4 shadow-2xl z-50 flex flex-col justify-between bg-white text-slate-800"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <VariMitraLogo tagline="" />
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {currentNavItems.map((item, idx) => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={() => {
                          setActiveTab(item.id as NavTabType);
                          setMobileSidebarOpen(false);
                          if (item.id === 'groups') setSelectedUserChatGroupId(null);
                          if (item.id === 'admin_groups') setAdminSelectedGroupId(null);
                          if (item.id === 'ai') setShowAIChat(true);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Right Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden min-w-0">
          {/* ======================================================== */}
          {/* USER (PILGRIM) GROUPS ROUTING */}
          {/* ======================================================== */}
          {isPilgrim && activeTab === 'groups' && (
            <div>
              {selectedUserChatGroupId ? (
                <UserGroupChat
                  initialGroupId={selectedUserChatGroupId}
                  session={session}
                  language={language}
                  onBack={() => setSelectedUserChatGroupId(null)}
                />
              ) : (
                <UserGroupsOverview
                  session={session}
                  language={language}
                  onOpenChat={(groupId) => setSelectedUserChatGroupId(groupId)}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ADMIN GROUPS ROUTING */}
          {/* ======================================================== */}
          {!isPilgrim && (activeTab === 'admin_groups' || (activeTab === 'groups' && !isPilgrim)) && (
            <div>
              {adminSelectedGroupId ? (
                <AdminGroupDetail
                  groupId={adminSelectedGroupId}
                  session={session}
                  language={language}
                  onBack={() => setAdminSelectedGroupId(null)}
                />
              ) : (
                <AdminGroupManagement
                  session={session}
                  language={language}
                  onManageGroup={(groupId) => setAdminSelectedGroupId(groupId)}
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ADMIN VOLUNTEER DEPARTMENT SQUADS ROUTING */}
          {/* ======================================================== */}
          {!isPilgrim && activeTab === 'admin_volunteers' && (
            <AdminVolunteers
              session={session}
              language={language}
              onOpenEmergencySOS={() => setShowSOSModal(true)}
            />
          )}

          {/* ======================================================== */}
          {/* OTHER TABS: DASHBOARD / OVERVIEW / TRACKING / SEVA */}
          {/* ======================================================== */}
          {activeTab !== 'groups' && activeTab !== 'admin_groups' && activeTab !== 'admin_volunteers' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div
                className="p-6 sm:p-7 rounded-3xl text-white shadow-lg relative overflow-hidden bg-gradient-to-r from-[#ea580c] via-[#f97316] to-amber-600"
              >
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isPilgrim ? 'Live Wari Companion Active' : 'Seva Operations Live Terminal'}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                    {isPilgrim ? `जय हरी विठ्ठल, ${session.name}!` : `Welcome, ${session.name}`}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                    {isPilgrim
                      ? 'Your journey with Shri Sant Dnyaneshwar Maharaj & Sant Tukaram Maharaj Palkhi is tracked safely with live checkpoints, clean water stalls, and 24/7 medical seva.'
                      : 'Real-time telemetry, volunteer distribution, route congestion monitoring, and emergency SOS incident dispatch are operational.'}
                  </p>

                  {/* Quick Action Buttons on Banner */}
                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowSOSModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-600 font-bold text-xs sm:text-sm rounded-xl shadow-md hover:bg-rose-50 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Trigger Emergency SOS</span>
                    </button>

                    <button
                      onClick={() => setShowAIChat(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black/25 hover:bg-black/35 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Ask AI Companion</span>
                    </button>

                    <button
                      onClick={() => setActiveTab(isPilgrim ? 'groups' : 'admin_groups')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>{isPilgrim ? 'Explore Groups' : 'Manage Groups'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Palkhi Live Status */}
                <div
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      {palkhi?.status || 'LIVE'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isPilgrim ? 'Current Palkhi Stop' : 'Palkhi Fleet Position'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {palkhi
                        ? `${palkhi.current_stop} ➔ ${palkhi.next_stop}`
                        : 'Saswad Checkpoint -> Jejuri Pavan Khind'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Next ETA: {palkhi?.eta_next_stop || '2 hrs 15 mins'}</span>
                    <span className="font-semibold text-orange-600">{palkhi?.schedule_status || '12.4 km ahead'}</span>
                  </div>
                </div>

                {/* Card 2: Emergency & Medical */}
                <div
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                      {isPilgrim ? '24/7 Support' : `${pendingAlertsCount} Alerts`}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isPilgrim ? 'Nearest Medical & Water Seva' : 'Emergency SOS Response'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {isPilgrim
                        ? 'Mobile Ambulance 400m ahead on Left (Dial 108)'
                        : `${pendingAlertsCount} Pending Critical Alerts | 18 Quick Response Units Active`}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Ambulance: 108</span>
                    <button
                      onClick={() => setShowSOSModal(true)}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Send SOS
                    </button>
                  </div>
                </div>

                {/* Card 3: AI Companion & Crowd Density */}
                <div
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                      24/7 AI
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isPilgrim ? 'VariMitra AI Voice & Chat' : 'Crowd Density AI Insights'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {crowd
                        ? `${crowd.location_name}: ${crowd.flow_speed}`
                        : 'Normal flow at Ringan ground (Level 1)'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{crowd?.active_volunteers_count || 32} Volunteers</span>
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      Open AI Chat ➔
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Seva Resources Section */}
              <section
                className="rounded-3xl p-5 sm:p-6 border border-slate-200/90 bg-white shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                      Live Seva & Checkpoint Facilities
                    </h2>
                    <p className="text-xs text-slate-500">
                      Verified locations along the Sant Dnyaneshwar & Sant Tukaram Palkhi routes
                    </p>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { id: 'ALL', label: 'All Services' },
                      { id: 'MEDICAL', label: 'Medical' },
                      { id: 'WATER', label: 'Water' },
                      { id: 'FOOD', label: 'Food / Prasad' },
                      { id: 'SHELTER', label: 'Shelters' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResourceCategory(tab.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          activeResourceCategory === tab.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resources Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResources.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            res.category === 'MEDICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : res.category === 'WATER'
                              ? 'bg-blue-100 text-blue-700'
                              : res.category === 'FOOD'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {res.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {res.distance_meters}m away
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {res.name}
                        </h4>
                        {res.name_mr && (
                          <p className="text-xs text-slate-500 font-devanagari">{res.name_mr}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{res.location_name}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">{res.capacity_or_supplies}</span>
                        <a
                          href={`tel:${res.contact_number}`}
                          className="inline-flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{res.contact_number}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Emergency SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-200 relative text-slate-900">
            <button
              onClick={() => setShowSOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Emergency SOS Dispatch</h3>
                <p className="text-xs text-slate-500">Direct alert to Wari Seva Medical & Police</p>
              </div>
            </div>

            {sosSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-emerald-800">{sosSuccessMessage}</p>
                <p className="text-xs text-emerald-600">
                  Quick response team has been alerted with your coordinates.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTriggerSOS} className="space-y-3.5 mt-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Incident Type
                  </label>
                  <select
                    value={sosType}
                    onChange={(e) => setSOSType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                  >
                    <option value="MEDICAL">Medical Emergency (रुग्णवाहिका)</option>
                    <option value="LOST_PERSON">Lost Person / Child (हरवलेली व्यक्ती)</option>
                    <option value="CROWD_DENSITY">Crowd Crush Risk (गर्दी नियंत्रण)</option>
                    <option value="ACCIDENT">Accident (अपघात)</option>
                    <option value="GENERAL">General Urgent Help (तातडीची मदत)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Current Location / Landmark
                  </label>
                  <input
                    type="text"
                    value={sosLocation}
                    onChange={(e) => setSOSLocation(e.target.value)}
                    placeholder="e.g. Near Saswad Dindi Camp 4"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Additional Details
                  </label>
                  <textarea
                    rows={2}
                    value={sosDesc}
                    onChange={(e) => setSOSDesc(e.target.value)}
                    placeholder="Describe condition, number of people needing help..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSOS}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingSOS ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Dispatching SOS Alert...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Dispatch SOS Now</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Chat Modal / Drawer */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[540px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">VariMitra 24/7 AI Companion</h3>
                  <p className="text-[11px] text-white/80">
                    Multilingual (मराठी • हिंदी • English)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf7f2]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-[#ea580c] text-white rounded-br-none shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-200" />
                    <span>VariMitra AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Quick Queries */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => setChatInput('पालखी सध्या कुठे आहे?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                🚩 पालखी स्थान
              </button>
              <button
                onClick={() => setChatInput('Emergency numbers and medical help')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                🏥 Medical & SOS
              </button>
              <button
                onClick={() => setChatInput('पंढरपूर दर्शन वेळ माहिती')}
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                🙏 दर्शन वेळ
              </button>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendAIChat} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your question in Marathi, Hindi or English..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="submit"
                className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
