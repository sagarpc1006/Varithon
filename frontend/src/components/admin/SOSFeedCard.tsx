import React from 'react';
import { EmergencyTypeIcon } from './EmergencyTypeIcon';
import { SOSActionButton } from './SOSActionButton';
import { ArrowUpRight } from 'lucide-react';

export interface FeedItemData {
  id: number;
  type: string;
  categoryTitle: string;
  reporterName: string;
  variMitraId: string;
  distanceKm: number;
  timeAgo: string;
  description?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  adminReply?: string | null;
  mobile?: string;
  isNew?: boolean;
}

interface SOSFeedCardProps {
  item: FeedItemData;
  onActionClick: (item: FeedItemData) => void;
}

export const SOSFeedCard: React.FC<SOSFeedCardProps> = ({ item, onActionClick }) => {
  const normType = item.type.toLowerCase();

  // Determine left border color and text color based on emergency category
  let leftBorderClass = 'border-l-[#8C751A]';
  let categoryTextColor = 'text-[#8C751A]';

  if (normType === 'medical') {
    leftBorderClass = 'border-l-[#B91C1C]';
    categoryTextColor = 'text-[#B91C1C]';
  } else if (normType === 'lost_person' || normType === 'lost_item') {
    leftBorderClass = 'border-l-[#E67E16]';
    categoryTextColor = 'text-[#E67E16]';
  } else if (normType === 'restroom') {
    leftBorderClass = 'border-l-[#2563EB]';
    categoryTextColor = 'text-[#2563EB]';
  }

  return (
    <div
      className={`bg-[#FFFDFC] rounded-[10px] border border-[#D8CDBE] border-l-4 ${leftBorderClass} p-4 sm:p-4.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between gap-3 ${
        item.isNew ? 'ring-2 ring-red-300/60 animate-in fade-in slide-in-from-top-3 duration-300' : ''
      }`}
    >
      {/* ── Top Row: Category + Time Received ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-[13px] tracking-tight">
          <EmergencyTypeIcon type={item.type} className="w-4 h-4" />
          <span className={categoryTextColor}>{item.categoryTitle}</span>
        </div>
        <span className="text-xs text-[#7A7165] font-medium shrink-0">
          {item.timeAgo}
        </span>
      </div>

      {/* ── Middle Row: Person Name + VariMitra ID ── */}
      <div>
        <h4 className="text-base sm:text-[17px] font-bold text-[#241F1A] tracking-tight leading-snug">
          {item.reporterName}{' '}
          <span className="text-xs sm:text-sm font-semibold text-[#5A5248] font-mono">
            ({item.variMitraId})
          </span>
        </h4>
        {item.description && (
          <p className="text-xs text-[#514A40] mt-1 line-clamp-1 italic bg-[#FAF7F3] px-2 py-0.5 rounded border border-[#EBE3D7]">
            "{item.description}"
          </p>
        )}
      </div>

      {/* ── Bottom Row: Distance + Action Button ── */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Distance from Admin with Arrow */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#514A40]">
          <ArrowUpRight size={16} className="text-[#7A7165] stroke-[2.5]" />
          <span>{item.distanceKm.toFixed(1)} km away</span>
        </div>

        {/* Action Button */}
        <SOSActionButton
          type={item.type}
          onClick={() => onActionClick(item)}
        />
      </div>
    </div>
  );
};
