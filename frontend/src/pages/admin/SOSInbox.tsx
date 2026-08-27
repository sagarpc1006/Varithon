import React, { useState } from 'react';
import { LiveSOSFeed } from '../../components/admin/LiveSOSFeed';
import { Shield, ArrowLeft, Radio, AlertCircle } from 'lucide-react';

interface SOSInboxProps {
  onBackToCommandMap?: () => void;
}

export const SOSInbox: React.FC<SOSInboxProps> = ({ onBackToCommandMap }) => {
  const [totalActive, setTotalActive] = useState<number>(3);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#D8CDBE] shadow-2xs">
        <div className="flex items-center gap-3">
          {onBackToCommandMap && (
            <button
              onClick={onBackToCommandMap}
              className="p-2 rounded-xl border border-[#D8CDBE] bg-white hover:bg-[#FAF7F3] text-[#514A40] transition-colors cursor-pointer"
              title="Back to Command Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#181716] tracking-tight">
                SOS Command Inbox
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#B91C1C]">
                {totalActive} Active Alerts
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#514A40]">
              Real-time pilgrim distress monitoring within your 2.0 km sector geofence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <Radio size={14} className="animate-pulse text-emerald-600" />
          <span>FCM Live Dispatch Active</span>
        </div>
      </div>

      {/* Main Feed Container (Right Panel in Screenshot) */}
      <div className="max-w-2xl mx-auto">
        <LiveSOSFeed
          onTotalCountChange={setTotalActive}
        />
      </div>

    </div>
  );
};
