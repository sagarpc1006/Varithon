import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SOSActionButtonProps {
  type: string;
  onClick: () => void;
  isLoading?: boolean;
}

export const SOSActionButton: React.FC<SOSActionButtonProps> = ({ type, onClick, isLoading = false }) => {
  const normType = type.toLowerCase();

  // Medical Emergency: Filled dark gold/olive button with "Respond →"
  if (normType === 'medical') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className="h-10 px-4 rounded-lg bg-[#765606] hover:bg-[#624603] active:scale-97 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-2xs hover:shadow-xs transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
        aria-label="Respond to Medical Emergency"
      >
        <span>Respond</span>
        <ArrowRight size={14} className="stroke-[2.5]" />
      </button>
    );
  }

  // Lost Person: Filled gold/yellow button with "Respond"
  if (normType === 'lost_person' || normType === 'lost_item') {
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className="h-10 px-5 rounded-lg bg-[#EAB308] hover:bg-[#CA8A04] active:scale-97 text-[#241F1A] text-xs sm:text-sm font-semibold tracking-wide shadow-2xs hover:shadow-xs transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-60"
        aria-label="Respond to Lost Person alert"
      >
        <span>Respond</span>
      </button>
    );
  }

  // General Issue / Restroom: Outlined button with "View Details"
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="h-10 px-4 rounded-lg bg-transparent border border-[#D8CDBE] hover:border-[#B8ACA0] hover:bg-[#FAF7F3] active:scale-97 text-[#241F1A] text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 flex items-center justify-center cursor-pointer disabled:opacity-60"
      aria-label="View Emergency Details"
    >
      <span>View Details</span>
    </button>
  );
};
