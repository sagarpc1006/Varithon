import React, { useEffect, useState } from 'react';
import { ArrowLeft, Megaphone, CloudLightning, Send, Siren } from 'lucide-react';
import { api } from '../../services/api';
import { AlertCard, AlertData } from '../../components/alerts/AlertCard';

interface AlertBroadcastProps {
  onBack: () => void;
}

type AlertType = 'announcement' | 'weather_alert';

const TYPE_OPTIONS: { value: AlertType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'announcement', label: 'Announcement', icon: <Megaphone size={16} />, desc: 'Sent to ALL pilgrims' },
  { value: 'weather_alert', label: 'Weather Alert', icon: <CloudLightning size={16} />, desc: 'Location-based' },
];

export const AlertBroadcast: React.FC<AlertBroadcastProps> = ({ onBack }) => {
  const [type, setType] = useState<AlertType>('announcement');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [zoneLat, setZoneLat] = useState('');
  const [zoneLng, setZoneLng] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [history, setHistory] = useState<AlertData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const isLocationBased = type !== 'announcement';

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.get<AlertData[]>('alerts/broadcast');
      setHistory(data);
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!message.trim()) { setFormError('Message is required.'); return; }
    if (isLocationBased && (!zoneLat || !zoneLng || !radiusKm)) {
      setFormError('Zone lat, lng and radius are required for this alert type.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = { type, title, message };
      if (isLocationBased) {
        payload.zone_lat = parseFloat(zoneLat);
        payload.zone_lng = parseFloat(zoneLng);
        payload.radius_km = parseFloat(radiusKm);
      }
      await api.post('alerts/broadcast', payload);
      setSuccess(true);
      setTitle(''); setMessage(''); setZoneLat(''); setZoneLng(''); setRadiusKm('10');
      setTimeout(() => setSuccess(false), 3000);
      loadHistory();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to broadcast alert.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          id="alert-broadcast-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-md">
          <Siren size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">Broadcast Alert</h1>
          <p className="text-xs text-slate-500">Compose and send a real-time alert to pilgrims</p>
        </div>
      </div>

      {/* Compose Form */}
      <form
        id="alert-broadcast-form"
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-100 bg-white/90 shadow-sm p-5 flex flex-col gap-4"
      >
        {/* Type selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alert Type</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150 ${
                  type === opt.value
                    ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {opt.icon}
                <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                <span className="text-[10px] text-slate-400 leading-none">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
          <input
            id="alert-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Road blocked near Pandharpur toll"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message <span className="text-red-400">*</span></label>
          <textarea
            id="alert-message-input"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the situation clearly for pilgrims…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors resize-none"
          />
        </div>

        {/* Zone inputs — only for location-based types */}
        {isLocationBased && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Affected Zone</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-semibold">Latitude</label>
                <input
                  id="alert-zone-lat"
                  type="number"
                  step="any"
                  value={zoneLat}
                  onChange={(e) => setZoneLat(e.target.value)}
                  placeholder="17.6868"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-semibold">Longitude</label>
                <input
                  id="alert-zone-lng"
                  type="number"
                  step="any"
                  value={zoneLng}
                  onChange={(e) => setZoneLng(e.target.value)}
                  placeholder="75.3249"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500 font-semibold">Radius</label>
                <span className="text-xs font-bold text-blue-700">{radiusKm} km</span>
              </div>
              <input
                id="alert-radius-slider"
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 km</span><span>50 km</span>
              </div>
            </div>
          </div>
        )}

        {/* Error / Success */}
        {formError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{formError}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-semibold">
            ✅ Alert broadcast successfully!
          </p>
        )}

        {/* Submit */}
        <button
          id="alert-broadcast-submit-btn"
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-sm py-3 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {submitting ? 'Broadcasting…' : 'Broadcast Alert'}
        </button>
      </form>

      {/* History */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-slate-700">Broadcast History</h2>
        {loadingHistory ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No alerts sent yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        )}
      </div>
    </div>
  );
};
