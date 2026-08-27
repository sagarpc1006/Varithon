import React from 'react';
import { BriefcaseMedical, AlertCircle, Users, HelpCircle, Sparkles } from 'lucide-react';

export type HelpType = 'medical' | 'issue' | 'restroom' | 'lost_item';

interface SpecificHelpSectionProps {
  onSelectCategory: (category: HelpType) => void;
  activeCategory?: HelpType | null;
}

export const SpecificHelpSection: React.FC<SpecificHelpSectionProps> = ({
  onSelectCategory,
  activeCategory,
}) => {
  const categories = [
    {
      id: 'medical' as HelpType,
      title: 'Medical Help',
      marathi: 'वैद्यकीय मदत',
      badgeBg: 'bg-[#C51B1B]',
      badgeColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" stroke="none">
          <path d="M19 6h-3V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM10 4h4v2h-4V4zm3 10h2v2h-2v2h-2v-2H9v-2h2v-2h2v2z" />
        </svg>
      ),
    },
    {
      id: 'issue' as HelpType,
      title: 'Report Issue',
      marathi: 'समस्या नोंदवा',
      badgeBg: 'bg-[#F7C52A]',
      badgeColor: 'text-[#3A2A00]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
        </svg>
      ),
    },
    {
      id: 'restroom' as HelpType,
      title: 'Find Restroom',
      marathi: 'शौचालय शोधा',
      badgeBg: 'bg-[#7A8E77]',
      badgeColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
          <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4 7c0-.55.45-1 1-1h6c.55 0 1 .45 1 1v5h-2v7h-4v-7H8V9z" />
        </svg>
      ),
    },
    {
      id: 'lost_item' as HelpType,
      title: 'Lost Item',
      marathi: 'हरवलेली वस्तू',
      badgeBg: 'bg-[#C2B5A5]',
      badgeColor: 'text-[#302720]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M4 14a8 8 0 0 1 16 0" />
        </svg>
      ),
    },
  ];

  return (
    <section className="space-y-6 pt-4">
      {/* Section Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181716] font-sans">
        Need Specific Help? / विशिष्ट मदत हवी आहे?
      </h2>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`bg-white rounded-2xl border ${
                isSelected ? 'border-[#C51B1B] ring-2 ring-red-100 shadow-md' : 'border-[#D8CDBE]'
              } p-6 sm:p-7 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group`}
            >
              {/* Circular Badge Icon */}
              <div
                className={`w-16 h-16 rounded-full ${cat.badgeBg} ${cat.badgeColor} flex items-center justify-center mb-4 group-hover:scale-108 transition-transform duration-200 shadow-sm`}
              >
                {cat.icon}
              </div>

              {/* Title & Marathi Translation */}
              <h3 className="text-lg sm:text-[19px] font-bold text-[#181716] tracking-tight">
                {cat.title}
              </h3>
              <p className="text-sm font-medium text-[#514A40] mt-1 font-devanagari">
                {cat.marathi}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
