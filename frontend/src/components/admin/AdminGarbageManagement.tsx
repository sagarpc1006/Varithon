import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
  MapPin,
  Truck,
  Sparkles,
  Shield,
  Clock,
  Layers,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { wariService } from '../../services/wari';
import { GarbageDustbinData, GarbageSummaryData } from '../../types';

export const AdminGarbageManagement: React.FC = () => {
  const [dustbins, setDustbins] = useState<GarbageDustbinData[]>([]);
  const [summary, setSummary] = useState<GarbageSummaryData>({
    total_count: 0,
    critical_count: 0,
    operational_count: 0,
    avg_fill_percent: 0,
    active_squads_count: 6,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'operational' | 'plastic' | 'organic'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Dustbin Modal Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameMr, setNewNameMr] = useState('');
  const [newCategory, setNewCategory] = useState<'ORGANIC_DRY' | 'PLASTIC_ONLY' | 'BIO_MEDICAL' | 'COMMUNITY_COMPACTOR'>('ORGANIC_DRY');
  const [newLocation, setNewLocation] = useState('Saswad Checkpoint Palkhi Ground');
  const [newLatitude, setNewLatitude] = useState(18.3444);
  const [newLongitude, setNewLongitude] = useState(74.0305);
  const [newCapacity, setNewCapacity] = useState(240);
  const [newFillLevel, setNewFillLevel] = useState(20);
  const [newSquad, setNewSquad] = useState('Swachh Wari Squad 02');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const fetchDustbins = async () => {
    setIsLoading(true);
    try {
      const res = await wariService.getDustbins();
      if (res) {
        if (res.dustbins) setDustbins(res.dustbins);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e: any) {
      console.error('Failed to fetch garbage dustbins:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDustbins();
    const interval = setInterval(fetchDustbins, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleEmptyDustbin = async (id: number, name: string) => {
    setActionLoadingId(id);
    try {
      const res = await wariService.emptyDustbin(id);
      setFeedback({
        message: `🧹 Dustbin "${name}" marked as emptied & sanitized! Fill level reset to 0%.`,
        type: 'success',
      });
      // Optimistic update
      setDustbins((prev) =>
        prev.map((d) => (d.id === id ? { ...d, fill_level_percent: 0, status: 'CLEANED', reported_overflow_count: 0 } : d))
      );
      fetchDustbins();
    } catch (e: any) {
      setFeedback({ message: e?.message || 'Failed to empty dustbin', type: 'error' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDispatchSquad = (dustbin: GarbageDustbinData) => {
    setFeedback({
      message: `🚨 Emergency Dispatch Notification sent to ${dustbin.assigned_squad} for ${dustbin.name} (${dustbin.location_name})!`,
      type: 'success',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteDustbin = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this dustbin location?')) return;
    setActionLoadingId(id);
    try {
      await wariService.deleteDustbin(id);
      setDustbins((prev) => prev.filter((d) => d.id !== id));
      setFeedback({ message: 'Dustbin point deactivated.', type: 'success' });
      fetchDustbins();
    } catch (e: any) {
      setFeedback({ message: e?.message || 'Failed to delete dustbin', type: 'error' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCreateDustbin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLocation.trim()) {
      setFeedback({ message: 'Please enter dustbin name and location.', type: 'error' });
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await wariService.createDustbin({
        name: newName.trim(),
        name_mr: newNameMr.trim() || newName.trim(),
        category: newCategory,
        location_name: newLocation.trim(),
        latitude: Number(newLatitude),
        longitude: Number(newLongitude),
        capacity_liters: Number(newCapacity),
        fill_level_percent: Number(newFillLevel),
        assigned_squad: newSquad.trim() || 'Swachh Wari Squad 01',
        status: Number(newFillLevel) >= 80 ? 'NEEDS_EMPTYING' : 'OPERATIONAL',
      });

      setFeedback({ message: `✅ New dustbin "${newName}" registered successfully!`, type: 'success' });
      setShowAddModal(false);
      // Reset form
      setNewName('');
      setNewNameMr('');
      fetchDustbins();
    } catch (e: any) {
      setFeedback({ message: e?.message || 'Failed to create dustbin point', type: 'error' });
    } finally {
      setIsSubmittingNew(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredDustbins = dustbins
    .filter((d) => {
      if (filter === 'critical') return d.status === 'NEEDS_EMPTYING' || d.status === 'OVERFLOWING' || d.fill_level_percent >= 80;
      if (filter === 'operational') return d.status === 'OPERATIONAL' || d.status === 'CLEANED';
      if (filter === 'plastic') return d.category === 'PLASTIC_ONLY';
      if (filter === 'organic') return d.category === 'ORGANIC_DRY';
      return true;
    })
    .filter((d) =>
      searchTerm
        ? d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.assigned_squad.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO BANNER & STATS ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
              <Trash2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Garbage & Dustbin Management (स्वच्छ वारी)
                </h1>
                {summary.critical_count > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-md">
                    <AlertTriangle size={13} />
                    <span>{summary.critical_count} Critical Overflow Alert</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Central command tracking for waste disposal hubs, real-time dustbin fill levels, Swachhata squads dispatch, and pilgrim overflow reports along the Palkhi route.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <button
              id="btn-add-dustbin"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Dustbin Point</span>
            </button>

            <button
              onClick={fetchDustbins}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Dustbin Hubs</p>
            <p className="text-2xl font-black text-white mt-0.5">{summary.total_count}</p>
            <p className="text-[10px] text-emerald-400 font-medium mt-1">Active on Palkhi Route</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Critical / Full Bins</p>
            <p className="text-2xl font-black text-rose-400 mt-0.5">{summary.critical_count}</p>
            <p className="text-[10px] text-rose-300 font-medium mt-1">Requires immediate cleaning</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Operational & Clean</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{summary.operational_count}</p>
            <p className="text-[10px] text-emerald-300 font-medium mt-1">Ready for pilgrim use</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Avg Fill Level</p>
            <p className="text-2xl font-black text-amber-300 mt-0.5">{summary.avg_fill_percent}%</p>
            <p className="text-[10px] text-slate-300 font-medium mt-1">6 Active Sanitation Squads</p>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Hubs ({dustbins.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'critical'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Critical Overflow ({summary.critical_count})
          </button>
          <button
            onClick={() => setFilter('operational')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'operational'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Operational ({summary.operational_count})
          </button>
          <button
            onClick={() => setFilter('organic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'organic'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Wet & Dry
          </button>
          <button
            onClick={() => setFilter('plastic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'plastic'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Plastic Crusher
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by dustbin name, landmark, squad..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* ── DUSTBINS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDustbins.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Matching Dustbin Locations</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No dustbins matched your selected filter. Click "+ Add Dustbin Point" to register a new sanitation hub.
            </p>
          </div>
        ) : (
          filteredDustbins.map((d) => {
            const isCritical = d.status === 'OVERFLOWING' || d.status === 'NEEDS_EMPTYING' || d.fill_level_percent >= 80;
            const isCleaned = d.status === 'CLEANED' || d.fill_level_percent <= 20;

            const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
              ORGANIC_DRY: { label: 'Wet & Dry Dual Bins', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              PLASTIC_ONLY: { label: 'Plastic Crusher & Collector', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
              BIO_MEDICAL: { label: 'Sanitary & Medical Waste', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
              COMMUNITY_COMPACTOR: { label: 'Community Mega Compactor', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
            };

            const catInfo = categoryLabels[d.category] || categoryLabels.ORGANIC_DRY;
            const isActioning = actionLoadingId === d.id;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border transition-all flex flex-col justify-between gap-4 ${
                  isCritical
                    ? 'border-rose-300 ring-2 ring-rose-500/15'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${catInfo.bg} ${catInfo.color}`}>
                      {catInfo.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {d.reported_overflow_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black animate-pulse border border-rose-300">
                          ⚠️ {d.reported_overflow_count} User Reports
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isCleaned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>

                  {/* Dustbin Title & Location */}
                  <div className="mt-3">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">{d.name}</h3>
                    {d.name_mr && <p className="text-xs text-slate-500 font-medium">{d.name_mr}</p>}

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 font-medium">
                      <MapPin size={14} className="text-emerald-600 shrink-0" />
                      <span>{d.location_name}</span>
                    </div>
                  </div>

                  {/* Dynamic Fill Level Progress Meter */}
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Layers size={13} className="text-slate-400" />
                        <span>Live Fill Level</span>
                      </span>
                      <span
                        className={`font-black ${
                          isCritical ? 'text-rose-600' : d.fill_level_percent > 50 ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {d.fill_level_percent}% Full ({Math.round((d.capacity_liters * d.fill_level_percent) / 100)}L / {d.capacity_liters}L)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical
                            ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                            : d.fill_level_percent > 50
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${Math.max(5, d.fill_level_percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Squad: <strong>{d.assigned_squad}</strong></span>
                      <span>GPS: <strong>{d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>Cleaned: {d.last_cleaned_at ? 'Recent' : 'Today'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCritical && (
                      <button
                        onClick={() => handleDispatchSquad(d)}
                        title="Dispatch Assigned Squad"
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Truck size={13} />
                        <span>Dispatch Squad</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleEmptyDustbin(d.id, d.name)}
                      disabled={isActioning}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>Mark Emptied / Cleaned</span>
                    </button>

                    <button
                      onClick={() => handleDeleteDustbin(d.id)}
                      disabled={isActioning}
                      title="Deactivate Dustbin Point"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── ADD DUSTBIN MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Register New Dustbin Point
                  </h3>
                  <p className="text-xs text-slate-300">
                    Add waste disposal hub & assign Swachhata squads
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateDustbin} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Dustbin Point Name (English) *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Saswad Palkhi Ground Green Hub 02"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  नाव (मराठीत)
                </label>
                <input
                  type="text"
                  value={newNameMr}
                  onChange={(e) => setNewNameMr(e.target.value)}
                  placeholder="उदा. सासवड पालखी मैदान हरित कचराकुंडी ०२"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Waste Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  >
                    <option value="ORGANIC_DRY">Wet & Dry Dual Bins</option>
                    <option value="PLASTIC_ONLY">Plastic Bottle Crusher</option>
                    <option value="BIO_MEDICAL">Sanitary & Medical Waste</option>
                    <option value="COMMUNITY_COMPACTOR">Community Mega Compactor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Capacity (Liters) *
                  </label>
                  <select
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  >
                    <option value="120">120 Liters (Mini)</option>
                    <option value="240">240 Liters (Standard)</option>
                    <option value="360">360 Liters (Medium)</option>
                    <option value="500">500 Liters (High Capacity)</option>
                    <option value="1000">1000 Liters (Mega Compactor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Location Landmark *
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Saswad Checkpoint Ground, Path B"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Latitude Coordinates
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLatitude}
                    onChange={(e) => setNewLatitude(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Longitude Coordinates
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLongitude}
                    onChange={(e) => setNewLongitude(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Assigned Swachhata Squad
                  </label>
                  <input
                    type="text"
                    value={newSquad}
                    onChange={(e) => setNewSquad(e.target.value)}
                    placeholder="e.g. Swachh Wari Squad 02"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Initial Fill Level (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newFillLevel}
                    onChange={(e) => setNewFillLevel(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Saving...' : 'Register Dustbin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
