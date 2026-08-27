import React from 'react';

// Saffron Pilgrim Icon (Warkari walking with saffron flag / stick)
export const PilgrimBadgeIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    hero: 'w-20 h-20',
  }[size];

  return (
    <div className={`rounded-full bg-[#ffedd5] flex items-center justify-center text-[#ea580c] shadow-sm flex-shrink-0 ${sizeClasses} ${className}`}>
      <svg viewBox="0 0 48 48" className="w-3/5 h-3/5 fill-current" stroke="none">
        {/* Head */}
        <circle cx="27" cy="10" r="4.5" />
        {/* Torso */}
        <path d="M22 17 C20 17 18 19 18 22 L20 32 L24 32 L23 23 L27 21 L30 32 L34 31 L30 19 C29 17.5 27.5 17 26 17 Z" />
        {/* Walking Legs */}
        {/* Front Leg stepping forward */}
        <path d="M20 31 L15 42 L19 43 L23 33 Z" />
        {/* Back Leg */}
        <path d="M28 31 L32 42 L28 43 L25 33 Z" />
        {/* Walking Staff / Dindi Flag pole */}
        <line x1="14" y1="12" x2="14" y2="44" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        {/* Saffron Pataka Flag atop staff */}
        <path d="M14 12 L7 16 L14 20 Z" fill="#ea580c" />
        {/* Arm holding staff */}
        <path d="M23 20 L15 24 L16 26 L23 22 Z" />
      </svg>
    </div>
  );
};

// Admin / Seva Team Badge Icon (Navy blue shield with person)
export const AdminBadgeIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'hero'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    hero: 'w-20 h-20',
  }[size];

  return (
    <div className={`rounded-full bg-[#e0e7ff] flex items-center justify-center text-[#1e293b] shadow-sm flex-shrink-0 ${sizeClasses} ${className}`}>
      <svg viewBox="0 0 48 48" className="w-3/5 h-3/5 fill-current" stroke="none">
        {/* Shield background */}
        <path
          d="M24 6 L38 12 V24 C38 33 32 40 24 44 C16 40 10 33 10 24 V12 L24 6 Z"
          fill="#1e293b"
        />
        {/* Person silhouette inside shield */}
        <circle cx="24" cy="18" r="4.5" fill="#ffffff" />
        <path
          d="M17 31 C17 26.5 20.2 24 24 24 C27.8 24 31 26.5 31 31 C31 33 29 35 24 35 C19 35 17 33 17 31 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
};

// Official Google 'G' Icon
export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);
