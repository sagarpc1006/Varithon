import React from 'react';
import { Megaphone, CloudLightning, RouteOff, Clock } from 'lucide-react';

export interface AlertData {
  id: number;
  type: 'announcement' | 'weather_alert' | 'route_change';
  title: string;
  message: string;
  zone_lat?: number | null;
  zone_lng?: number | null;
  radius_km?: number | null;
  created_by_name?: string;
  created_at: string;
}

const TYPE_META: Record<AlertData['type'], {
  icon: React.ReactNode;
  label: string;
  badgeClass: string;
  borderClass: string;
  glowClass: string;
  iconBg: string;
}> = {
  announcement: {
    icon: <Megaphone size={16} className="text-amber-700" />,
    label: 'Announcement',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    borderClass: 'border-amber-100',
    glowClass: 'bg-amber-300',
    iconBg: 'bg-amber-50',
  },
  weather_alert: {
    icon: <CloudLightning size={16} className="text-blue-700" />,
    label: 'Weather Alert',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    borderClass: 'border-blue-100',
    glowClass: 'bg-blue-300',
    iconBg: 'bg-blue-50',
  },
  route_change: {
    icon: <RouteOff size={16} className="text-violet-700" />,
    label: 'Route Change',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    borderClass: 'border-violet-100',
    glowClass: 'bg-violet-300',
    iconBg: 'bg-violet-50',
  },
};

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface AlertCardProps {
  alert: AlertData;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const meta = TYPE_META[alert.type];
  return (
    <div
      className={`relative rounded-2xl border ${meta.borderClass} bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Glow blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${meta.glowClass} opacity-10 blur-2xl pointer-events-none`} />

      <div className="p-4 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${meta.iconBg} flex items-center justify-center flex-shrink-0`}>
              {meta.icon}
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-[11px] flex-shrink-0 mt-0.5">
            <Clock size={11} />
            <span>{relativeTime(alert.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        {alert.title && (
          <p className="text-sm font-bold text-slate-800 leading-snug">{alert.title}</p>
        )}

        {/* Message */}
        <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>

        {/* Zone info (for location-scoped alerts) */}
        {alert.radius_km && (
          <p className="text-[11px] text-slate-400 font-medium">
            📍 Within {alert.radius_km} km of affected zone
          </p>
        )}

        {/* Footer */}
        {alert.created_by_name && (
          <p className="text-[11px] text-slate-400">by {alert.created_by_name}</p>
        )}
      </div>
    </div>
  );
};
