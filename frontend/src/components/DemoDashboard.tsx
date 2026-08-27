import React from 'react';
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
} from 'lucide-react';
import { Language, UserSession } from '../types';
import { translations } from '../translations';
import { VariMitraLogo } from './VariMitraLogo';

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

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col justify-between font-sans text-slate-800">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <VariMitraLogo tagline="" className="items-start" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{session.name}</p>
              <p className="text-[11px] text-slate-500 font-medium capitalize">
                {isPilgrim ? 'Warkari Devotee' : 'Seva Team Administrator'}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Welcome Banner */}
        <div
          className={`p-6 sm:p-7 rounded-3xl text-white shadow-lg relative overflow-hidden ${
            isPilgrim
              ? 'bg-gradient-to-r from-[#ea580c] via-[#f97316] to-amber-600'
              : 'bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-slate-800'
          }`}
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
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                LIVE
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isPilgrim ? 'Current Palkhi Stop' : 'Palkhi Fleet Position'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPilgrim ? 'Saswad Checkpoint -> Jejuri Pavan Khind' : 'Route Segment 4: 12.4 km ahead of schedule'}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                Active
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isPilgrim ? 'Nearest Medical & Water Seva' : 'Emergency SOS Response'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPilgrim ? 'Mobile Ambulance 400m ahead on Left' : '0 Pending Critical Alerts | 18 Units on Standby'}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
                {isPilgrim ? 'VariMitra AI Voice Helper' : 'Crowd Density AI Insights'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPilgrim ? 'Ask questions in Marathi, Hindi or English' : 'Normal flow at Ringan ground (Level 1)'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
