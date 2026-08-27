import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export type FilterCategory = 'all' | 'medical' | 'lost' | 'issue' | 'resolved';

interface SOSFilterProps {
  activeFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  isOpen: boolean;
  onToggle: () => void;
  counts: {
    all: number;
    medical: number;
    lost: number;
    issue: number;
    resolved: number;
  };
}

export const SOSFilter: React.FC<SOSFilterProps> = ({
  activeFilter,
  onSelectFilter,
  isOpen,
  onToggle,
  counts,
}) => {
  const options: { id: FilterCategory; label: string; count: number; color?: string }[] = [
    { id: 'all', label: 'All Active', count: counts.all },
    { id: 'medical', label: 'Medical Emergency', count: counts.medical, color: 'text-[#B91C1C]' },
    { id: 'lost', label: 'Lost Person', count: counts.lost, color: 'text-[#E67E16]' },
    { id: 'issue', label: 'General Issue', count: counts.issue, color: 'text-[#8C751A]' },
    { id: 'resolved', label: 'Resolved Alerts', count: counts.resolved },
  ];

  return (
    <div className="relative">
      {/* Filter Trigger Button */}
      <button
        onClick={onToggle}
        className={`p-2 rounded-lg text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3] transition-colors border ${
          isOpen || activeFilter !== 'all' ? 'border-[#8A6800] bg-amber-50/50 text-[#8A6800]' : 'border-transparent'
        }`}
        aria-label="Filter Live SOS Feed"
        title="Filter emergency alerts"
      >
        {/* Filter Sliders / Funnel Lines Icon */}
        <SlidersHorizontal size={18} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#D8CDBE] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
            Filter Alerts
          </div>
          {options.map((opt) => {
            const isSelected = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectFilter(opt.id);
                  onToggle();
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-[#FAF7F3] font-bold text-[#181716]' : 'text-[#514A40] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <Check size={14} className="text-[#8A6800] stroke-[2.5]" />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span className={opt.color || ''}>{opt.label}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
