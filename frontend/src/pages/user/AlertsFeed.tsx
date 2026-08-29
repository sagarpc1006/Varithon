import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BellRing, RefreshCw, WifiOff } from 'lucide-react';
import { api } from '../../services/api';
import { AlertCard, AlertData } from '../../components/alerts/AlertCard';

interface AlertsFeedProps {
  onBack: () => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const lastTimestampRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Try to get user geolocation once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => { /* silently skip if denied */ }
      );
    }
  }, []);

  const fetchAlerts = async (isInitial = false) => {
    if (!isInitial) setPolling(true);
    try {
      const params = new URLSearchParams();
      if (lastTimestampRef.current) params.set('since', lastTimestampRef.current);
      if (locationRef.current) {
        params.set('lat', String(locationRef.current.lat));
        params.set('lng', String(locationRef.current.lng));
      }
      const data = await api.get<AlertData[]>(`alerts/feed?${params.toString()}`);
      if (data.length > 0) {
        // Prepend new alerts; deduplicate by id
        setAlerts((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newOnes = data.filter((a) => !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
        // Track newest timestamp for delta polling
        lastTimestampRef.current = data[0].created_at;
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  useEffect(() => {
    fetchAlerts(true);
    intervalRef.current = setInterval(() => fetchAlerts(false), 20_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          id="alerts-feed-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-2">
          {polling && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <RefreshCw size={11} className="animate-spin" />
              Updating…
            </span>
          )}
          {lastUpdated && !polling && (
            <span className="text-[11px] text-slate-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
          <BellRing size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Live Alerts</h1>
          <p className="text-xs text-slate-500">Announcements · Weather · Route changes</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white/80 h-24 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <WifiOff size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={() => fetchAlerts(true)}
            className="text-xs font-semibold text-orange-500 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <BellRing size={36} className="text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No active alerts in your area</p>
          <p className="text-xs text-slate-400">We'll notify you as soon as something comes in</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};
