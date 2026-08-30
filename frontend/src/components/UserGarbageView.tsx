import React, { useState, useEffect } from 'react';
import {
  Trash2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Shield,
  Heart,
  Layers,
  Send,
  Check,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { wariService } from '../services/wari';
import { GarbageDustbinData } from '../types';

interface UserGarbageViewProps {
  onOpenMap?: () => void;
}

export const UserGarbageView: React.FC<UserGarbageViewProps> = ({ onOpenMap }) => {
  const [dustbins, setDustbins] = useState<GarbageDustbinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportedId, setReportedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'organic' | 'plastic'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDustbins = async () => {
    setIsLoading(true);
    try {
      const res = await wariService.getDustbins();
      if (res && res.dustbins) {
        setDustbins(res.dustbins);
      }
    } catch (e: any) {
      console.error('Failed to fetch dustbins:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDustbins();
  }, []);

  const handleReportOverflow = async (id: number, name: string) => {
    setReportedId(id);
    try {
      const res = await wariService.reportOverflowDustbin(id);
      setFeedback(`🙏 धन्यवाद! "${name}" ची माहिती स्वच्छता कक्षाला पाठवली आहे. मदत पथक रवाना झाले आहे.`);
      setDustbins((prev) =>
        prev.map((d) => (d.id === id ? { ...d, fill_level_percent: 95, status: 'OVERFLOWING', reported_overflow_count: d.reported_overflow_count + 1 } : d))
      );
    } catch (e: any) {
      setFeedback(e?.message || 'Report submission failed.');
    } finally {
      setTimeout(() => {
        setReportedId(null);
        setFeedback(null);
      }, 5000);
    }
  };

  const filteredDustbins = dustbins
    .filter((d) => {
      if (filter === 'organic') return d.category === 'ORGANIC_DRY';
      if (filter === 'plastic') return d.category === 'PLASTIC_ONLY';
      return true;
    })
    .filter((d) =>
      searchTerm
        ? d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.location_name.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── SWACHHATA HERO BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-400/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-md shrink-0">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  स्वच्छ वारी, निर्मल वारी (Swachh Wari Mission)
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                  Active Cleanliness Drive
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                Find nearby eco-friendly dustbins, plastic crusher stations, and waste disposal points along the Palkhi route. Report overflowing dustbins with 1 click to keep the Wari pristine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <MapPin size={15} className="text-emerald-700" />
                <span>View on Map</span>
              </button>
            )}

            <button
              onClick={fetchDustbins}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Devotee Guidelines Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <span className="text-xl">🟢</span>
            <div>
              <p className="font-bold text-white">ओला कचरा (Wet Waste)</p>
              <p className="text-[11px] text-emerald-200">अन्न, केळीची साले हिरव्या कुंडीत टाका</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <span className="text-xl">🔵</span>
            <div>
              <p className="font-bold text-white">सुका कचरा (Dry Waste)</p>
              <p className="text-[11px] text-emerald-200">कागद, पुठ्ठे, प्लास्टिक निळ्या कुंडीत टाका</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <span className="text-xl">♻️</span>
            <div>
              <p className="font-bold text-white">प्लॅस्टिक मुक्ती (Plastic Free)</p>
              <p className="text-[11px] text-emerald-200">पाण्याच्या बाटल्या क्रशर पॉईंटवर जमा करा</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Points ({dustbins.length})
          </button>
          <button
            onClick={() => setFilter('organic')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'organic'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🟢 Wet & Dry Bins
          </button>
          <button
            onClick={() => setFilter('plastic')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'plastic'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            ♻️ Plastic Collectors
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by stop, landmark, dindi path..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* ── DUSTBINS LIST ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDustbins.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Dustbins Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching cleanliness points found in this section.
            </p>
          </div>
        ) : (
          filteredDustbins.map((d) => {
            const isFull = d.fill_level_percent >= 80 || d.status === 'OVERFLOWING';
            const isReporting = reportedId === d.id;

            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Category Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                      {d.category === 'PLASTIC_ONLY' ? '♻️ Plastic Crusher' : d.category === 'COMMUNITY_COMPACTOR' ? '🏭 Mega Compactor' : '🟢 Wet & Dry Bins'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isFull
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isFull ? 'Nearly Full' : 'Available'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{d.name}</h3>
                    {d.name_mr && <p className="text-xs text-slate-500 font-medium">{d.name_mr}</p>}

                    <div className="flex items-center gap-1 text-xs text-slate-600 pt-1 font-medium">
                      <MapPin size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{d.location_name}</span>
                    </div>
                  </div>

                  {/* Fill Level Meter */}
                  <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-500 text-[11px]">Fill Level:</span>
                      <span className={isFull ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
                        {d.fill_level_percent}% ({d.capacity_liters}L capacity)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${d.fill_level_percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 1-Click Overflow Report Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Squad: <strong>{d.assigned_squad}</strong>
                  </span>

                  <button
                    onClick={() => handleReportOverflow(d.id, d.name)}
                    disabled={isReporting}
                    title="Report if this dustbin is full or dirty"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isFull
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600'
                    }`}
                  >
                    <AlertTriangle size={13} className="text-rose-500" />
                    <span>Report Full</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
