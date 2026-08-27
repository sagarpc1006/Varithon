import React from 'react';
import { PlusSquare, Compass, Info, Users, AlertCircle, Sparkles } from 'lucide-react';

export type SOSCategory = 'medical' | 'lost_person' | 'lost_item' | 'issue' | 'general_issue' | 'restroom';

interface EmergencyTypeIconProps {
  type: string;
  className?: string;
}

export const EmergencyTypeIcon: React.FC<EmergencyTypeIconProps> = ({ type, className = 'w-4 h-4' }) => {
  const normType = type.toLowerCase();

  if (normType === 'medical') {
    return (
      <span className="text-[#B91C1C] inline-flex items-center justify-center">
        {/* Red Medical First Aid Bag / Cross Icon */}
        <svg viewBox="0 0 24 24" className={`${className} fill-none`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </span>
    );
  }

  if (normType === 'lost_person' || normType === 'lost_item') {
    return (
      <span className="text-[#E67E16] inline-flex items-center justify-center">
        {/* Orange Compass / Search Person Icon */}
        <svg viewBox="0 0 24 24" className={`${className} fill-none`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </span>
    );
  }

  if (normType === 'restroom') {
    return (
      <span className="text-[#2563EB] inline-flex items-center justify-center">
        <Users className={className} />
      </span>
    );
  }

  // Default: General Issue / Issue
  return (
    <span className="text-[#8C751A] inline-flex items-center justify-center">
      {/* Olive/Yellow Info / Alert Icon */}
      <svg viewBox="0 0 24 24" className={`${className} fill-none`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
      </svg>
    </span>
  );
};
