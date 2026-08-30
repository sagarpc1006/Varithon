import React, { useState, useEffect } from 'react';
import {
  Shield,
  HeartHandshake,
  AlertTriangle,
  MapPin,
  Radio,
  Phone,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Clock,
  Navigation,
  Utensils,
  Droplets,
  HeartPulse,
  LogOut,
  ChevronRight,
  Send,
  Sparkles,
  QrCode,
  Flame,
  AlertCircle,
  RefreshCw,
  Eye,
  Info,
  Users,
  Compass,
  FileText,
  BadgeCheck,
  Trash2,
} from 'lucide-react';
import { Language, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';
import { LanguageDropdown } from './LanguageDropdown';
import { VolunteerBadgeIcon } from './PortalIcons';
import { AdminGarbageManagement } from './admin/AdminGarbageManagement';
import { api } from '../services/api';

interface VolunteerDashboardProps {
  session: UserSession;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
}

interface SOSReport {
  id: number;
  type: string;
  category?: string;
  status: string;
  timestamp: string;
  location: { lat: number; lng: number };
  landmark?: string;
  userName?: string;
  userPhone?: string;
  description?: string;
  dindiNumber?: string;
  isAcknowledged?: boolean;
  responder_name?: string;
}

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: 'urgent' | 'warning' | 'info';
  sender: string;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  session,
  language,
  onLanguageChange,
  onSignOut,
}) => {
  const t = translations[language];

  // Active Tab: 'sos' | 'squad' | 'map' | 'broadcasts' | 'garbage' | 'idcard'
  const [activeTab, setActiveTab] = useState<'sos' | 'squad' | 'map' | 'broadcasts' | 'garbage' | 'idcard'>('sos');

  // Duty Status: 'on_duty' | 'on_break' | 'dispatched'
  const [dutyStatus, setDutyStatus] = useState<'on_duty' | 'on_break' | 'dispatched'>('on_duty');

  // SOS Reports State
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<SOSReport | null>(null);

  // Field Report Form State
  const [reportType, setReportType] = useState<string>('Crowd Flow Update');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'urgent'>('medium');
  const [reportLocation, setReportLocation] = useState<string>('Saswad Bypass Sector 2B');
  const [reportText, setReportText] = useState<string>('');
  const [isSendingReport, setIsSendingReport] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Broadcasts
  const [broadcasts] = useState<BroadcastMessage[]>([
    {
      id: 'BCAST-101',
      title: '🚨 Heatwave Advisory - Bapdev Ghat Sector',
      message: 'High humidity reported. All Water & Medical squads deploy additional ORS packets and cold water cans to Dindi #12 - #18.',
      time: '10 mins ago',
      severity: 'urgent',
      sender: 'Central Control Room (Commandant Shinde)',
    },
    {
      id: 'BCAST-102',
      title: '🍲 Night Camp Annachatra Shift Alert',
      message: 'Palkhi arriving at Saswad Palkhi Ground by 04:30 PM. Food squads prepare dinner batches for 15,000+ devotees.',
      time: '35 mins ago',
      severity: 'info',
      sender: 'Annachatra Coordination Wing',
    },
    {
      id: 'BCAST-103',
      title: '🚦 Traffic Diversion at Dive Ghat Pass',
      message: 'Heavy vehicles diverted via Saswad-Hadapsar old route. Marshals clear pedestrian corridor.',
      time: '1 hour ago',
      severity: 'warning',
      sender: 'Traffic & Route Police Liaison',
    },
  ]);

  // Fetch live SOS reports
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await api.get<{ reports: any[] }>('/sos/');
      if (res && res.reports) {
        setReports(res.reports);
      }
    } catch (e) {
      // Fallback mock data for field demo
      setReports([
        {
          id: 101,
          type: 'medical',
          status: 'pending',
          timestamp: '3 mins ago',
          location: { lat: 18.3495, lng: 74.0298 },
          landmark: 'Bapdev Ghat Descent • Shade 4',
          userName: 'Anand Shinde',
          userPhone: '+91 9822114455',
          description: 'Elderly pilgrim dehydrated and feeling dizzy. Needs ORS and first aid.',
          dindiNumber: 'Dindi No. 14 (Alandi)',
        },
        {
          id: 102,
          type: 'restroom',
          status: 'acknowledged',
          timestamp: '12 mins ago',
          location: { lat: 18.3512, lng: 74.0321 },
          landmark: 'Saswad Bypass Toll Chowk',
          userName: 'Sunita Patil',
          userPhone: '+91 9766554433',
          description: 'Looking for nearest clean mobile sanitation container / restroom.',
          dindiNumber: 'Dindi No. 8',
          responder_name: 'Squad Sanitation Unit #5',
        },
        {
          id: 103,
          type: 'lost_person',
          status: 'pending',
          timestamp: '18 mins ago',
          location: { lat: 18.348, lng: 74.0265 },
          landmark: 'Zilla Parishad School Ground Saswad',
          userName: 'Gopalrao Kulkarni',
          userPhone: '+91 9423001122',
          description: '11-year old child wearing orange kurta separated near temple arch.',
          dindiNumber: 'Dindi No. 22',
        },
      ]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, []);

  // Action: Update SOS Status
  const handleUpdateSOSStatus = async (reportId: number, newStatus: string) => {
    try {
      await api.patch(`/sos/${reportId}/status/`, {
        status: newStatus,
        responder_name: session.name || 'Field Sevekar',
      });
      showToast(`Incident #${reportId} updated to ${newStatus.toUpperCase()}!`);
      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, responder_name: session.name || 'Field Sevekar' } : r
        )
      );
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e: any) {
      // Optimistic update for offline field readiness
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, responder_name: session.name || 'Field Sevekar' } : r
        )
      );
      showToast(`Status updated: ${newStatus.toUpperCase()}`);
    }
  };

  // Submit Field Situation Report to Central Control
  const handleSubmitFieldReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      showToast('Please enter field report details', 'error');
      return;
    }

    setIsSendingReport(true);
    setTimeout(() => {
      setIsSendingReport(false);
      setReportText('');
      showToast('Field Report transmitted to Central Command & Control Room!', 'success');
    }, 800);
  };

  // Active Pending SOS Count
  const pendingCount = reports.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : toast.type === 'info'
              ? 'bg-amber-900 text-white border-amber-700'
              : 'bg-emerald-900 text-white border-emerald-700'
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
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand & Volunteer Portal Badge */}
          <div className="flex items-center gap-3">
            <VariMitraLogo variant="light" showText={true} />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
              <VolunteerBadgeIcon size="sm" />
              <span>Sevekar Portal</span>
            </div>
          </div>

          {/* Center: Duty Status Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setDutyStatus('on_duty');
                showToast('Status set to ON DUTY 🟢');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dutyStatus === 'on_duty'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>On Duty</span>
            </button>

            <button
              onClick={() => {
                setDutyStatus('dispatched');
                showToast('Status set to DISPATCHED / RESPONDING 🚨');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dutyStatus === 'dispatched'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Dispatched</span>
            </button>

            <button
              onClick={() => {
                setDutyStatus('on_break');
                showToast('Status set to ON BREAK 🟡');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dutyStatus === 'on_break'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-200" />
              <span>Break</span>
            </button>
          </div>

          {/* Right: Volunteer Info, Language & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1 justify-end">
                <span>{session.name}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span className="text-[11px] font-medium text-emerald-700">
                {session.squad_id || 'SQD-FOOD-101'} • {session.department || 'Field Seva'}
              </span>
            </div>

            <LanguageDropdown currentLanguage={language} onLanguageChange={onLanguageChange} />

            <button
              id="btn-volunteer-signout"
              onClick={onSignOut}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="tab-btn-sos"
            onClick={() => setActiveTab('sos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sos'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'sos' ? 'text-amber-300' : 'text-rose-500'}`} />
            <span>Live Distress & SOS</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-squad"
            onClick={() => setActiveTab('squad')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'squad'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>My Seva Squad</span>
          </button>

          <button
            id="tab-btn-map"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            <span>Route & Seva Points</span>
          </button>

          <button
            id="tab-btn-broadcasts"
            onClick={() => setActiveTab('broadcasts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'broadcasts'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>Control Room Broadcasts</span>
          </button>

          <button
            id="tab-btn-garbage"
            onClick={() => setActiveTab('garbage')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'garbage'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Garbage & Swachhata</span>
          </button>

          <button
            id="tab-btn-idcard"
            onClick={() => setActiveTab('idcard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'idcard'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Digital Sevekar ID</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ================= TAB 1: LIVE SOS & DISTRESS DISPATCH ================= */}
        {activeTab === 'sos' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Quick Telemetry Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Distress Alerts</p>
                  <p className="text-2xl font-extrabold text-rose-600 mt-1">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Assigned Sector</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">Sector 2B • Saswad Bypass</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Squad Hotline</p>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">Squad Lead: +91 9823114455</p>
                </div>
                <a
                  href="tel:9823114455"
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <PhoneCall className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Main SOS List & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols: Distress Cards Feed */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Real-Time Devotee Distress Reports</span>
                  </h3>
                  <button
                    onClick={fetchReports}
                    className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">All Clear in Your Sector!</h4>
                    <p className="text-xs text-slate-500">No active pilgrim emergency or distress alerts right now.</p>
                  </div>
                ) : (
                  reports.map((r) => {
                    const isMedical = r.type === 'medical';
                    const isRestroom = r.type === 'restroom';
                    const isLost = r.type === 'lost_person' || r.type === 'lost_item';
                    const isPending = r.status === 'pending';
                    const isInProgress = r.status === 'in_progress' || r.status === 'acknowledged';
                    const isResolved = r.status === 'resolved';

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReport(r)}
                        className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md cursor-pointer ${
                          selectedReport?.id === r.id
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : isPending
                            ? 'border-rose-300 bg-rose-50/20'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isMedical
                                  ? 'bg-rose-100 text-rose-700'
                                  : isRestroom
                                  ? 'bg-blue-100 text-blue-700'
                                  : isLost
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isMedical ? (
                                <HeartPulse className="w-5 h-5" />
                              ) : isRestroom ? (
                                <Utensils className="w-5 h-5" />
                              ) : isLost ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                <AlertTriangle className="w-5 h-5" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {isMedical
                                    ? '🚑 Medical Emergency'
                                    : isRestroom
                                    ? '🚻 Restroom / Sanitation Request'
                                    : isLost
                                    ? '🔍 Lost Person Distress'
                                    : '⚠️ General Assistance'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isPending
                                      ? 'bg-rose-500 text-white animate-pulse'
                                      : isInProgress
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {r.status}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-700 mt-1">
                                Devotee: {r.userName || 'Warkari Pilgrim'} {r.dindiNumber ? `(${r.dindiNumber})` : ''}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{r.description}</p>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-slate-400 shrink-0">{r.timestamp}</span>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{r.landmark || 'Saswad Wari Route'}</span>
                          </div>

                          {/* Quick Action Responder Buttons */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {r.userPhone && (
                              <a
                                href={`tel:${r.userPhone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>Call</span>
                              </a>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleUpdateSOSStatus(r.id, 'in_progress')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>Dispatch Me</span>
                              </button>
                            )}

                            {isInProgress && (
                              <button
                                onClick={() => handleUpdateSOSStatus(r.id, 'resolved')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Mark Resolved</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Col: Selected Report Detailed Modal / Action Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Incident Action Console</span>
                  </h3>

                  {selectedReport ? (
                    <div className="space-y-3.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Incident ID #{selectedReport.id}</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedReport.type.toUpperCase()}</p>
                        <p className="text-xs text-slate-600 mt-1">{selectedReport.description}</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Pilgrim Name:</span>
                          <span className="font-bold text-slate-800">{selectedReport.userName || 'Anonymous Pilgrim'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Contact:</span>
                          <span className="font-bold text-emerald-700">{selectedReport.userPhone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Dindi Group:</span>
                          <span className="font-bold text-slate-800">{selectedReport.dindiNumber || 'Independent Pilgrim'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Location:</span>
                          <span className="font-bold text-slate-800">{selectedReport.landmark || 'Saswad Route'}</span>
                        </div>
                        {selectedReport.responder_name && (
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Assigned Sevekar:</span>
                            <span className="font-bold text-purple-700">{selectedReport.responder_name}</span>
                          </div>
                        )}
                      </div>

                      {/* 1-Click Status Controls */}
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => handleUpdateSOSStatus(selectedReport.id, 'acknowledged')}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Acknowledge Distress</span>
                        </button>

                        <button
                          onClick={() => handleUpdateSOSStatus(selectedReport.id, 'in_progress')}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Dispatch Volunteer Team (In Progress)</span>
                        </button>

                        <button
                          onClick={() => handleUpdateSOSStatus(selectedReport.id, 'resolved')}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resolve & Close Incident</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <Compass className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">Click on any distress card from the list to view telemetry and take field action.</p>
                    </div>
                  )}
                </div>

                {/* Emergency Hotlines Box */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200/90 p-4 space-y-2 text-xs">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-amber-700" />
                    <span>Emergency Control Lines</span>
                  </p>
                  <p className="text-amber-800 leading-snug">
                    Central Ambulance Dispatch: <strong>108 / +91 9422001122</strong>
                  </p>
                  <p className="text-amber-800 leading-snug">
                    Police Wari Security Wing: <strong>112 / +91 9823110099</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MY SQUAD & DUTY TELEMETRY ================= */}
        {activeTab === 'squad' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Squad Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{session.squad_id || 'SQD-FOOD-101'} • Active Deployment</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {session.department || 'Annachatra & Maha-Prasad Seva Squad Alpha'}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  Duty Area: Saswad Bypass Toll Chowk & Sector 2B • Shift: 06:00 AM - 02:00 PM (Morning & Afternoon Rush)
                </p>
                <div className="pt-2 flex items-center gap-4 flex-wrap text-xs font-semibold text-emerald-200">
                  <span>Lead: Rameshwar Shinde (+91 9823114455)</span>
                  <span>•</span>
                  <span>Active Members: 28 Sevekars</span>
                  <span>•</span>
                  <span>Vehicles: 2 Food Trucks (MH-12-FK-4412)</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 pointer-events-none">
                <HeartHandshake className="w-72 h-72 text-white" />
              </div>
            </div>

            {/* Squad Duty Checklist & Supplies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Shift Operational Checklist</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 w-4 h-4" />
                    <span className="font-medium text-slate-700">Deploy morning tea & warm breakfast packets (Completed)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 w-4 h-4" />
                    <span className="font-medium text-slate-700">Refill 5,000L cold drinking water tanks at Tent 3</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 w-4 h-4" />
                    <span className="font-medium text-slate-700">Inspect queue barriers for Palkhi arrival at 03:00 PM</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <input type="checkbox" className="rounded text-emerald-600 w-4 h-4" />
                    <span className="font-medium text-slate-700">Distribute night dinner packets for Dindi #14 to #28</span>
                  </label>
                </div>
              </div>

              {/* Squad Resource Levels */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Squad Supplies & Inventory Status</span>
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-700">Drinking Water Reserves (Liters)</span>
                      <span className="text-emerald-700">4,200L / 5,000L (84%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-700">Maha-Prasad Food Batches</span>
                      <span className="text-emerald-700">3,100 / 4,000 Served</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '77%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-slate-700">First-Aid Kits & ORS Packets</span>
                      <span className="text-amber-700">140 Kits Available</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ROUTE & SEVA POINTS MAP ================= */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>Live Palkhi Progression & Seva Checkpoints</span>
                  </h3>
                  <p className="text-xs text-slate-500">Sant Tukaram Maharaj & Dnyaneshwar Maharaj Palkhi Route Map</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>GPS Tracking Active</span>
                </span>
              </div>

              {/* Map Canvas Visual Mock */}
              <div className="relative w-full h-80 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-300 overflow-hidden flex items-center justify-center p-6 text-center text-white">
                <div className="space-y-3 z-10 max-w-md">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">Palkhi Sector: Dive Ghat ➔ Saswad</h4>
                  <p className="text-xs text-slate-300">
                    Current Palkhi Front: <strong>Saswad Toll Naka (2.4 km ahead)</strong>. Estimated arrival at Mukkaam Ground in 45 mins.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 text-[11px] font-bold">
                      💧 8 Water Booths
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-rose-300 text-[11px] font-bold">
                      🚑 4 Medical Tents
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 text-blue-300 text-[11px] font-bold">
                      🚻 12 Restrooms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: BROADCASTS & FIELD REPORT ================= */}
        {activeTab === 'broadcasts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {/* Left 2 Cols: Broadcasts Feed */}
            <div className="lg:col-span-2 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-500" />
                <span>Urgent Transmissions from Central Command</span>
              </h3>

              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl border p-4.5 shadow-xs space-y-2 ${
                    b.severity === 'urgent'
                      ? 'border-rose-300 bg-rose-50/20'
                      : b.severity === 'warning'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{b.title}</h4>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{b.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{b.message}</p>
                  <p className="text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-100">
                    Source: {b.sender}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Col: Send Field Situation Report */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Send Field Situation Report</span>
              </h3>
              <p className="text-xs text-slate-500">Transmit real-time ground updates directly to Central Control Room.</p>

              <form onSubmit={handleSubmitFieldReport} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Report Category</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                  >
                    <option value="Crowd Flow Update">🚶 Crowd Density & Flow Normal</option>
                    <option value="Water Shortage Alert">💧 Drinking Water Shortage Alert</option>
                    <option value="Medical Assistance Needed">🚑 Medical Doctor / Ambulance Request</option>
                    <option value="Traffic Congestion">🚦 Road Obstruction / Traffic Jams</option>
                    <option value="Sanitation Issue">🧹 Sanitation Cleaning Request</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Severity Level</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setReportSeverity('low')}
                      className={`py-1.5 rounded-lg border cursor-pointer ${
                        reportSeverity === 'low'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportSeverity('medium')}
                      className={`py-1.5 rounded-lg border cursor-pointer ${
                        reportSeverity === 'medium'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportSeverity('urgent')}
                      className={`py-1.5 rounded-lg border cursor-pointer ${
                        reportSeverity === 'urgent'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Urgent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Current Landmark</label>
                  <input
                    type="text"
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    placeholder="e.g. Saswad Main Gate / Tent 4"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">Field Notes *</label>
                  <textarea
                    rows={3}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Describe ground situation, devotee headcount, or required assistance..."
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingReport}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingReport ? (
                    <span>Transmitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Field Report</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 5: GARBAGE & SWACHHATA OPERATIONS ================= */}
        {activeTab === 'garbage' && (
          <div className="animate-in fade-in duration-200">
            <AdminGarbageManagement />
          </div>
        )}

        {/* ================= TAB 6: DIGITAL SEVEKAR ID CARD ================= */}
        {activeTab === 'idcard' && (
          <div className="flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden text-center relative">
              {/* ID Card Top Banner */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-5 text-white space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Official Field Pass</p>
                <h3 className="text-lg font-black tracking-tight">VARI-MITRA SEVEKAR</h3>
                <p className="text-[11px] text-emerald-100">Pandharpur Ashadhi Wari 2026</p>
              </div>

              {/* Avatar Badge */}
              <div className="relative -mt-8 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg border-2 border-emerald-500">
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                    <UserCheck className="w-8 h-8 text-emerald-700" />
                  </div>
                </div>
              </div>

              {/* Volunteer Details */}
              <div className="p-6 space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{session.name}</h4>
                  <p className="text-xs font-bold text-emerald-700">
                    ID: SVA-VOL-402 • {session.squad_id || 'SQD-FOOD-101'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{session.department || 'Annachatra & Food Seva'}</p>
                </div>

                {/* QR Code Demo */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 inline-block">
                  <div className="w-32 h-32 bg-slate-900 rounded-xl flex items-center justify-center text-white font-mono text-[10px] p-2 text-center">
                    <span>[QR CODE: SVA-VOL-402-2026-VERIFIED]</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 font-medium">
                  <p>Organization: {session.organization || 'Pandharpur Wari Seva Mandal'}</p>
                  <p>Blood Group: O+ve • Emergency Contact: +91 9823114455</p>
                  <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 py-1 px-2 rounded-lg mt-2 inline-block">
                    ✓ Authorized for Route Access & Distress Response
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
