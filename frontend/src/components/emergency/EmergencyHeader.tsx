import React, { useState } from 'react';
import { Bell, User, AlertTriangle, Menu, X } from 'lucide-react';
import { UserSession } from '../../types';
import { VariMitraLogo } from '../VariMitraLogo';

interface EmergencyHeaderProps {
  activeTab: 'dashboard' | 'history' | 'map' | 'resources';
  onTabChange: (tab: 'dashboard' | 'history' | 'map' | 'resources') => void;
  onSOSClick: () => void;
  session?: UserSession | null;
  historyCount?: number;
  onBackToMain?: () => void;
}

export const EmergencyHeader: React.FC<EmergencyHeaderProps> = ({
  activeTab,
  onTabChange,
  onSOSClick,
  session,
  historyCount = 0,
  onBackToMain,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#D8CDBE] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={onBackToMain}
          className="cursor-pointer select-none group"
          title="Return to VariMitra Home"
        >
          <VariMitraLogo variant="light" tagline="" />
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-8 h-full">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`relative py-6 px-1 text-[15px] font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-[#181716] font-semibold'
                : 'text-[#514A40] hover:text-[#181716]'
            }`}
          >
            Dashboard
            {activeTab === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#946E1B] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`relative py-6 px-1 text-[15px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-[#181716] font-semibold'
                : 'text-[#514A40] hover:text-[#181716]'
            }`}
          >
            Emergency History
            {historyCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-[#C51B1B]">
                {historyCount}
              </span>
            )}
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#946E1B] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`relative py-6 px-1 text-[15px] font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-[#181716] font-semibold'
                : 'text-[#514A40] hover:text-[#181716]'
            }`}
          >
            Support Map
            {activeTab === 'map' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#946E1B] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onTabChange('resources')}
            className={`relative py-6 px-1 text-[15px] font-medium transition-colors ${
              activeTab === 'resources'
                ? 'text-[#181716] font-semibold'
                : 'text-[#514A40] hover:text-[#181716]'
            }`}
          >
            Resources
            {activeTab === 'resources' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#946E1B] rounded-full" />
            )}
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-full text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3] transition-colors relative"
              aria-label="View notifications"
            >
              <Bell size={20} />
              {historyCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C51B1B] rounded-full ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#D8CDBE] p-3 z-50 text-sm animate-in fade-in zoom-in-95">
                <div className="font-semibold text-[#181716] border-b border-gray-100 pb-2 mb-2 flex justify-between items-center">
                  <span>Emergency Alerts</span>
                  <span className="text-xs text-gray-500">{historyCount} active</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {historyCount > 0 
                    ? `You have ${historyCount} SOS report(s) in process with the seva control room.`
                    : 'No new emergency alerts. GPS auto-dispatch is standby active.'}
                </p>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div 
            className="p-2 rounded-full text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3] transition-colors cursor-pointer"
            title={session?.name ? `Signed in as ${session.name}` : 'Pilgrim Profile'}
          >
            <User size={20} />
          </div>

          {/* Top SOS Alert Pill Button */}
          <button
            onClick={onSOSClick}
            className="hidden sm:flex items-center gap-2 bg-[#C51B1B] hover:bg-[#A91414] active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
            aria-label="Send Emergency SOS Alert"
          >
            <AlertTriangle size={16} className="fill-white/20" />
            <span>SOS Alert</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#514A40] hover:text-[#181716]"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#D8CDBE] px-4 py-3 space-y-2">
          <button
            onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'dashboard' ? 'bg-[#FAF7F3] text-[#946E1B] font-bold' : 'text-[#514A40]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { onTabChange('history'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${
              activeTab === 'history' ? 'bg-[#FAF7F3] text-[#946E1B] font-bold' : 'text-[#514A40]'
            }`}
          >
            <span>Emergency History</span>
            {historyCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-[#C51B1B]">
                {historyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { onTabChange('map'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'map' ? 'bg-[#FAF7F3] text-[#946E1B] font-bold' : 'text-[#514A40]'
            }`}
          >
            Support Map
          </button>
          <button
            onClick={() => { onTabChange('resources'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'resources' ? 'bg-[#FAF7F3] text-[#946E1B] font-bold' : 'text-[#514A40]'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => { onSOSClick(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-[#C51B1B] text-white text-sm font-bold py-2.5 rounded-xl shadow-sm mt-2"
          >
            <AlertTriangle size={16} />
            <span>SOS Alert</span>
          </button>
        </div>
      )}
    </header>
  );
};
