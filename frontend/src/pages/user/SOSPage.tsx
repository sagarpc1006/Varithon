import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyHeader } from '../../components/emergency/EmergencyHeader';
import { SOSMainCard } from '../../components/emergency/SOSMainCard';
import { LiveStatusCard } from '../../components/emergency/LiveStatusCard';
import { DirectLinesCard } from '../../components/emergency/DirectLinesCard';
import { SpecificHelpSection, HelpType } from '../../components/emergency/SpecificHelpSection';
import { EmergencyFooter } from '../../components/emergency/EmergencyFooter';
import { EmergencyCategoryModal } from '../../components/emergency/EmergencyCategoryModal';
import { EmergencyHistoryView } from '../../components/emergency/EmergencyHistoryView';
import { EmergencyProtocolModal } from '../../components/emergency/EmergencyModals';
import { SOSReport } from '../../components/sos/SOSCard';
import { api } from '../../services/api';
import { authService } from '../../services/auth';
import { UserSession } from '../../types';
import { MapPin, Phone, Hospital, ShieldCheck, LifeBuoy } from 'lucide-react';

interface SOSPageProps {
  onBackToDashboard?: () => void;
}

export const SOSPage: React.FC<SOSPageProps> = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'map' | 'resources'>('dashboard');
  const [session, setSession] = useState<UserSession | null>(null);
  
  const [myReports, setMyReports] = useState<SOSReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);

  // SOS Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alertSent, setAlertSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Category Modal State
  const [selectedCategory, setSelectedCategory] = useState<HelpType | null>(null);
  const [isProtocolOpen, setIsProtocolOpen] = useState<boolean>(false);

  // Load user session
  useEffect(() => {
    const s = authService.getStoredSession();
    setSession(s);
    fetchMyReports();

    // Auto-poll history for admin replies every 15s
    const timer = setInterval(() => {
      fetchMyReports(false);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Fetch reports from backend
  const fetchMyReports = async (showLoading = true) => {
    if (showLoading) setIsLoadingReports(true);
    try {
      const data = await api.get<SOSReport[]>('/sos/my-reports/');
      setMyReports(data || []);
    } catch (err) {
      console.warn("Could not fetch reports:", err);
    } finally {
      if (showLoading) setIsLoadingReports(false);
    }
  };

  // Central SOS Trigger with Geolocation
  const sendSOS = useCallback(async (type: string = 'medical', description: string = '') => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const executePost = async (latitude: number, longitude: number) => {
      try {
        await api.post('/sos/report/', {
          type,
          description,
          lat: latitude,
          lng: longitude,
        });

        setAlertSent(true);
        setSuccessMessage("Emergency alert sent! Live location shared with nearby response team.");
        fetchMyReports(false);

        // Reset alert sent state after 5 seconds
        setTimeout(() => {
          setAlertSent(false);
        }, 5000);
      } catch (err: any) {
        setErrorMessage(err?.message || "Failed to dispatch SOS alert. Please try again or call 100/108.");
      } finally {
        setIsSubmitting(false);
        setSelectedCategory(null);
      }
    };

    if (!navigator.geolocation) {
      // Fallback default coordinates (Pune/Wari route) if geolocation unsupported
      await executePost(18.5204, 73.8567);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await executePost(pos.coords.latitude, pos.coords.longitude);
      },
      async () => {
        // Fallback gracefully to pilgrimage sector coordinate
        await executePost(18.5204, 73.8567);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [isSubmitting]);

  // Main Emergency Button Click
  const handleMainSOSClick = () => {
    sendSOS('medical', '');
  };

  // Specific Help Category Submission
  const handleCategorySubmit = async (type: string, description: string) => {
    await sendSOS(type, description);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#181716] flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* ══════════════════ 1. HEADER / NAVIGATION ══════════════════ */}
      <EmergencyHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSOSClick={handleMainSOSClick}
        session={session}
        historyCount={myReports.filter(r => r.status !== 'resolved').length}
        onBackToMain={onBackToDashboard}
      />

      {/* ══════════════════ 2. MAIN BODY ══════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab 1: Main Emergency Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-200">
            
            {/* 2-Column Emergency Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left: Main Emergency SOS Card (65% width on desktop) */}
              <div className="lg:col-span-8 flex flex-col">
                <SOSMainCard
                  onTriggerSOS={handleMainSOSClick}
                  isSubmitting={isSubmitting}
                  alertSent={alertSent}
                  errorMessage={errorMessage}
                  successMessage={successMessage}
                />
              </div>

              {/* Right: Status & Direct Lines (35% width on desktop) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <LiveStatusCard
                  distanceText="You are within 2km of Admin Support."
                />
                <DirectLinesCard />
              </div>

            </div>

            {/* Bottom: Specific Help Section (4 Cards Grid) */}
            <SpecificHelpSection
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              activeCategory={selectedCategory}
            />

          </div>
        )}

        {/* Tab 2: Emergency History View */}
        {activeTab === 'history' && (
          <EmergencyHistoryView
            reports={myReports}
            onRefresh={() => fetchMyReports(true)}
            isLoading={isLoadingReports}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Tab 3: Support Map View */}
        {activeTab === 'map' && (
          <div className="space-y-6 max-w-5xl mx-auto py-2">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8CDBE]">
              <div>
                <h2 className="text-2xl font-bold text-[#181716] tracking-tight">Support Map & Medical Seva Posts</h2>
                <p className="text-sm text-[#514A40]">Nearby first-aid posts, water stations, and mobile rescue teams</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-sm font-semibold text-[#C51B1B] hover:underline"
              >
                ← Back to SOS
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8CDBE] p-6 shadow-sm space-y-6">
              <div className="w-full h-72 rounded-xl bg-gradient-to-br from-[#f1faee] via-[#f8f9fa] to-[#e8f4f8] border border-[#E9E2DB] flex items-center justify-center relative overflow-hidden">
                {/* Decorative Map Visual */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#181716_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="z-10 text-center space-y-2 p-4">
                  <div className="w-12 h-12 bg-[#C51B1B] text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-pulse">
                    <MapPin size={24} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">Palkhi Marg Live Geofence Active</h3>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    GPS live sync connects you directly with the nearest <strong>Saswad Sector Emergency Camp</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E9E2DB]">
                  <div className="flex items-center gap-2 text-[#C51B1B] font-bold text-sm mb-1">
                    <Hospital size={18} />
                    <span>Medical Camp #4</span>
                  </div>
                  <p className="text-xs text-gray-600">Saswad Old Highway • 450m away</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E9E2DB]">
                  <div className="flex items-center gap-2 text-[#3A2A00] font-bold text-sm mb-1">
                    <ShieldCheck size={18} />
                    <span>Police Seva Marshal</span>
                  </div>
                  <p className="text-xs text-gray-600">Dindi No. 12 Sector • 600m away</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#E9E2DB]">
                  <div className="flex items-center gap-2 text-[#15803D] font-bold text-sm mb-1">
                    <LifeBuoy size={18} />
                    <span>Ambulance Unit #7</span>
                  </div>
                  <p className="text-xs text-gray-600">On Standby • Response ETA ~ 3 mins</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Resources View */}
        {activeTab === 'resources' && (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className="flex items-center justify-between pb-4 border-b border-[#D8CDBE]">
              <div>
                <h2 className="text-2xl font-bold text-[#181716] tracking-tight">Pilgrimage Safety Resources</h2>
                <p className="text-sm text-[#514A40]">Emergency guidelines, hydration advisories, and helpline contacts</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-sm font-semibold text-[#C51B1B] hover:underline"
              >
                ← Back to SOS
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-[#D8CDBE] p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-lg text-[#181716] flex items-center gap-2">
                  <Phone size={18} className="text-[#C51B1B]" />
                  Emergency Directory
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex justify-between py-1 border-b border-gray-100">
                    <span>Central Wari Control Room:</span>
                    <strong className="text-gray-900">1800-233-2026</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-gray-100">
                    <span>Disaster Management Cell:</span>
                    <strong className="text-gray-900">1077</strong>
                  </li>
                  <li className="flex justify-between py-1 border-b border-gray-100">
                    <span>Women's Safety Helpline:</span>
                    <strong className="text-gray-900">1091</strong>
                  </li>
                  <li className="flex justify-between py-1">
                    <span>Fire & Rescue:</span>
                    <strong className="text-gray-900">101</strong>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#D8CDBE] p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-lg text-[#181716] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#15803D]" />
                  First-Aid & Health Tips
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  • Stay hydrated with ORS / lemon water available at designated Warkari seva pandals.<br />
                  • If feeling dizziness or heat exhaustion, visit the nearest mobile medical tent.<br />
                  • Keep your identity badge or dindi registration number handy.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════ 3. FOOTER ══════════════════ */}
      <EmergencyFooter
        onOpenProtocol={() => setIsProtocolOpen(true)}
      />

      {/* ══════════════════ 4. MODALS & POPUPS ══════════════════ */}
      <EmergencyCategoryModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onSubmit={handleCategorySubmit}
        isSubmitting={isSubmitting}
      />

      <EmergencyProtocolModal
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
      />

    </div>
  );
};
