import React from 'react';
import { Flame, CheckCircle2, Loader2, Radio } from 'lucide-react';

interface SOSMainCardProps {
  onTriggerSOS: () => void;
  isSubmitting: boolean;
  alertSent: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export const SOSMainCard: React.FC<SOSMainCardProps> = ({
  onTriggerSOS,
  isSubmitting,
  alertSent,
  errorMessage,
  successMessage,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#D8CDBE] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-10 flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[460px]">
      
      {/* Top Title & Subtitle */}
      <div className="space-y-1.5 z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181716] flex items-center justify-center gap-2 font-sans">
          <span>Emergency</span>
          <span className="text-[#C51B1B]">SOS</span>
        </h1>
        <p className="text-base sm:text-lg text-[#514A40] font-normal">
          Tap immediately for urgent assistance
        </p>
      </div>

      {/* Center: Large Animated SOS Button Container */}
      <div className="relative my-8 flex items-center justify-center w-full min-h-[250px]">
        
        {/* Concentric Animated Ripple Rings (CSS Keyframes in index.css) */}
        {!isSubmitting && !alertSent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="w-[190px] h-[190px] rounded-full border-2 border-[#C51B1B]/40 animate-sos-ripple-1 absolute" />
            <div className="w-[190px] h-[190px] rounded-full border-2 border-[#C51B1B]/30 animate-sos-ripple-2 absolute" />
            <div className="w-[190px] h-[190px] rounded-full border-2 border-[#C51B1B]/20 animate-sos-ripple-3 absolute" />
          </div>
        )}

        {/* The Main SOS Button */}
        <button
          onClick={onTriggerSOS}
          disabled={isSubmitting}
          aria-label="Send Emergency SOS Alert Immediately"
          className={`relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center select-none text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-300/50 cursor-pointer ${
            alertSent
              ? 'bg-[#15803D] scale-100 shadow-[0_12px_30px_rgba(21,128,61,0.4)]'
              : isSubmitting
              ? 'bg-[#A91414] scale-95 opacity-90'
              : 'bg-[#C51B1B] hover:bg-[#A91414] hover:scale-105 active:scale-95 animate-sos-breathe'
          }`}
        >
          {isSubmitting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90">
                Sending...
              </span>
            </div>
          ) : alertSent ? (
            <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-75 duration-200">
              <CheckCircle2 className="w-12 h-12 text-white" />
              <span className="text-lg sm:text-xl font-extrabold tracking-wider">
                ALERT SENT
              </span>
              <span className="text-[11px] font-medium text-white/90">
                Help dispatched
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {/* Emergency Star Asterisk Icon */}
              <svg 
                viewBox="0 0 24 24" 
                className="w-12 h-12 sm:w-14 sm:h-14 fill-white text-white drop-shadow-sm"
                aria-hidden="true"
              >
                {/* 6-point Star of Life / Asterism Symbol */}
                <path d="M12 2C11.45 2 11 2.45 11 3V8.13L6.56 5.56C6.08 5.29 5.47 5.45 5.2 5.93C4.93 6.41 5.09 7.02 5.57 7.29L10.01 9.86L5.57 12.43C5.09 12.7 4.93 13.31 5.2 13.79C5.47 14.27 6.08 14.43 6.56 14.16L11 11.59V16.72C11 17.27 11.45 17.72 12 17.72C12.55 17.72 13 17.27 13 16.72V11.59L17.44 14.16C17.92 14.43 18.53 14.27 18.8 13.79C19.07 13.31 18.91 12.7 18.43 12.43L13.99 9.86L18.43 7.29C18.91 7.02 19.07 6.41 18.8 5.93C18.53 5.45 17.92 5.29 17.44 5.56L13 8.13V3C13 2.45 12.55 2 12 2Z" />
              </svg>
              
              {/* "SOS" bold text */}
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-white mt-1 drop-shadow">
                SOS
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Error or Success feedback toast */}
      {errorMessage && (
        <div className="w-full max-w-md mb-3 py-2 px-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium animate-in fade-in">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="w-full max-w-md mb-3 py-2 px-4 bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm rounded-xl font-medium animate-in fade-in flex items-center justify-center gap-2">
          <Radio size={16} className="animate-pulse text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Bottom Pill Instruction */}
      <div className="inline-flex items-center gap-2 bg-[#FDE0DD] text-[#A91414] px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-sm border border-red-100 select-none">
        <Flame size={16} className="text-[#C51B1B]" />
        <span>Tap to Alert Admin instantly</span>
      </div>

    </div>
  );
};
