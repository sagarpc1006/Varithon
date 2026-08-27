import React from 'react';
import officialLogoImg from '../assets/images/varimitra_official_logo_1787736835217.jpg';

interface VariMitraLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  tagline?: string;
  showEmblemOnly?: boolean;
}

export const VariMitraLogo: React.FC<VariMitraLogoProps> = ({
  className = '',
  variant = 'light',
  tagline = 'YOUR SPIRITUAL PILGRIMAGE COMPANION',
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Sacred Bronze-Gold Circular Vitthal & Flame Emblem */}
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 group">
          {/* Subtle warm spiritual backglow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-600/40 via-orange-500/30 to-yellow-400/40 blur-xs transition-all group-hover:scale-105" />

          {/* Double Bronze-Gold Ring Frame */}
          <div className="relative w-full h-full rounded-full p-[1.5px] bg-gradient-to-b from-[#d4af37] via-[#996515] to-[#5c3a0d] shadow-lg shadow-black/40 ring-1 ring-amber-400/40 overflow-hidden">
            <img
              src={officialLogoImg}
              alt="VariMitra Sacred Emblem"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Brand Name Typography Lockup */}
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center tracking-tight leading-none">
            {/* "Vari" */}
            <span
              className={`text-2xl sm:text-[28px] font-extrabold tracking-tight ${
                isDark ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-[#0e2a47]'
              }`}
            >
              Vari
            </span>

            {/* "Mitra" with Kalash on 'i' */}
            <div className="relative inline-flex items-baseline">
              {/* Shikhara / Kalash motif crowning the 'i' */}
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#f97316] drop-shadow-xs">
                M
              </span>
              <div className="relative inline-flex flex-col items-center">
                {/* Temple Shikhara crowning the letter 'i' */}
                <svg
                  viewBox="0 0 20 20"
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 drop-shadow-xs"
                  fill="currentColor"
                >
                  <path d="M10 1 L12 5 L11 5 L13 10 L10 12 L7 10 L9 5 L8 5 Z" />
                  <circle cx="10" cy="1" r="1" fill="#fef08a" />
                </svg>
                <span className="text-2xl sm:text-[28px] font-extrabold text-[#f97316]">
                  i
                </span>
              </div>
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#f97316] drop-shadow-xs">
                tra
              </span>
            </div>
          </div>

          {/* Subtitle / Tagline below the brand name */}
          {tagline && (
            <span
              className={`text-[9px] sm:text-[10.5px] font-bold tracking-[0.14em] uppercase mt-0.5 whitespace-nowrap ${
                isDark
                  ? 'text-amber-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  : 'text-[#475569]'
              }`}
            >
              {tagline}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};




