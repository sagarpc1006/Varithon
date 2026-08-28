import React from 'react';
import { MapPin } from 'lucide-react';

interface LiveStatusCardProps {
  distanceText?: string;
  adminProximityKm?: number;
}

export const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  distanceText = "You are within 2km of Admin Support.",
}) => {
  return (
    <div className="bg-[#F7C52A] rounded-2xl p-6 sm:p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-[#3A2A00] flex flex-col justify-between space-y-4">
      
      {/* Header */}
      <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
        <MapPin size={22} className="text-[#3A2A00] fill-[#3A2A00]/20" />
        <h2 className="text-lg font-bold text-[#3A2A00]">Live Status</h2>
      </div>

      {/* Proximity Information */}
      <div className="space-y-3">
        <p className="text-base sm:text-[17px] font-medium leading-snug text-[#3A2A00]">
          {distanceText}
        </p>

        {/* Progress / Status Bar */}
        <div className="w-full h-2.5 bg-[#E2B118] rounded-full overflow-hidden relative">
          {/* Active section */}
          <div className="w-[30%] h-full bg-[#181716] rounded-full" />
        </div>
      </div>

      {/* Auto Location Caption */}
      <p className="text-xs sm:text-sm font-medium text-[#4A3705]">
        Location shared automatically upon alert.
      </p>

    </div>
  );
};
