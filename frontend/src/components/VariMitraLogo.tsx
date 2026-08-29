import React from 'react';
import officialLogoImg from '../assets/images/varimitra_official_logo_1787736835217.jpg';
import wordmarkImg from '../assets/images/varimitra_wordmark_clean.png';

interface VariMitraLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  tagline?: string;
  showEmblemOnly?: boolean;
  size?: number;
  fontSize?: number;
}

export const VariMitraLogo: React.FC<VariMitraLogoProps> = ({
  className = '',
  variant = 'light',
  tagline = 'YOUR SPIRITUAL PILGRIMAGE COMPANION',
  showEmblemOnly = false,
  size,
  fontSize,
}) => {
  const isDark = variant === 'dark';
  
  // Sizing calculations:
  // In the wordmark image (aspect ratio ~2.3:1), text height is ~60% of total image height.
  // To produce 42px - 48px font size, default image height is set to 70px (mobile ~42px font) to 80px (desktop ~48px font).
  const customImgHeight = fontSize ? Math.round(fontSize / 0.6) : (size ? Math.round(size * 1.35) : undefined);
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;
  const wordmarkHeightClass = customImgHeight ? '' : 'h-[70px] sm:h-[76px] md:h-[80px]';
  const wordmarkStyle = customImgHeight ? { height: `${customImgHeight}px` } : undefined;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-3.5 sm:gap-4.5">
        {/* Sacred Vitthal Emblem */}
        <div 
          className={`relative ${size ? '' : 'w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px]'} flex-shrink-0 group`}
          style={sizeStyle}
        >
          {/* Subtle warm spiritual backglow */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-600/40 via-orange-500/30 to-yellow-400/40 blur-xs transition-all group-hover:scale-105" />

          {/* Double Bronze-Gold Ring Frame */}
          <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-b from-[#d4af37] via-[#996515] to-[#5c3a0d] shadow-lg shadow-black/40 ring-1 ring-amber-400/40 overflow-hidden bg-white">
            <img
              src={officialLogoImg}
              alt="VariMitra Sacred Emblem"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Brand Name Wordmark (42-48px font size: वारी + Kalash & Tilak + Mitra) */}
        {!showEmblemOnly && (
          <div className="flex flex-col items-start justify-center">
            <div className="flex items-center">
              <img
                src={wordmarkImg}
                alt="वारी Mitra"
                className={`${wordmarkHeightClass} w-auto object-contain max-w-[280px] sm:max-w-[340px] md:max-w-[390px] ${
                  isDark
                    ? 'drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_0_14px_rgba(255,255,255,0.5)] brightness-105'
                    : 'drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.1)]'
                }`}
                style={wordmarkStyle}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Subtitle / Tagline below the brand name */}
            {tagline && (
              <span
                className={`text-[10px] sm:text-[12px] font-bold tracking-[0.18em] uppercase mt-0.5 whitespace-nowrap ${
                  isDark
                    ? 'text-amber-200/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                    : 'text-[#5c6b7d]'
                }`}
              >
                {tagline}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};





