import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export type FilterCategory = 'all' | 'active' | 'acknowledged' | 'resolved';

interface SOSFilterProps {
  activeFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  isOpen: boolean;
  onToggle: () => void;
  counts: {
    all: number;
    active: number;
    acknowledged: number;
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
  const options: { id: FilterCategory; label: string; count: number; color?: string; badgeColor?: string }[] = [
    { id: 'all', label: 'ALL', count: counts.all },
    { id: 'active', label: 'ACTIVE', count: counts.active, color: 'text-red-700 font-bold', badgeColor: 'bg-red-100 text-red-800' },
    { id: 'acknowledged', label: 'ACKNOWLEDGED / RESPONDED', count: counts.acknowledged, color: 'text-blue-700 font-bold', badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'resolved', label: 'RESOLVED', count: counts.resolved, color: 'text-green-700 font-bold', badgeColor: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="relative">
      {/* Filter Trigger Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
          isOpen || activeFilter !== 'all'
            ? 'border-[#8A6800] bg-amber-50 text-[#8A6800] shadow-xs'
            : 'border-[#D8CDBE] bg-white text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3]'
        }`}
        aria-label="Filter Live SOS Feed"
        title="Filter emergency alerts by status"
      >
        <SlidersHorizontal size={14} />
        <span className="hidden sm:inline">
          {activeFilter === 'all' ? 'All Alerts' : activeFilter === 'acknowledged' ? 'Responded' : activeFilter.toUpperCase()}
        </span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#D8CDBE] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center justify-between">
            <span>Filter By Status</span>
            <span className="text-[10px] text-gray-400 font-normal">Real-time</span>
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
                  <span className={opt.color || 'font-medium'}>{opt.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${opt.badgeColor || 'bg-gray-100 text-gray-700'}`}>
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
