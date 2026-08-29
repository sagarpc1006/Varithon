import React, { useEffect, useRef, useState, useTransition } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Send,
  RefreshCw,
  TrendingUp,
  Gauge,
  Compass,
  MapPin,
  Flame,
  Layers,
  ChevronRight,
  Droplets
} from 'lucide-react';
import { api } from '../../services/api';
import { UserSession } from '../../types';

// Leaflet default icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface ZoneData {
  id: number;
  name: string;
  name_mr?: string;
  latitude: number;
  longitude: number;
  max_safe_capacity: number;
  person_count: number;
  density_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  current_status: 'low' | 'medium' | 'high' | 'critical';
  movement_direction: string;
  movement_speed_kmh: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface CrowdSummary {
  total_active_pilgrims: string;
  pilgrims_growth_rate: string;
  high_risk_count: number;
  high_risk_regions: string[];
  active_alerts_count: number;
  available_volunteers: number;
  total_volunteers_capacity: number;
}

interface HistoryReading {
  id: string | number;
  person_count: number;
  density_level: string;
  time_label: string;
  recorded_at: string;
}

interface CrowdAlertItem {
  id: number;
  zone: number;
  zone_name: string;
  latitude?: number;
  longitude?: number;
  title: string;
  description: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  action_type: string;
  created_at: string;
}

interface CrowdAnalyticsProps {
  session?: UserSession;
  onBack: () => void;
}

export const CrowdAnalytics: React.FC<CrowdAnalyticsProps> = ({ session, onBack }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  // Data States
  const [summary, setSummary] = useState<CrowdSummary>({
    total_active_pilgrims: '1.2M',
    pilgrims_growth_rate: '+5% vs last hour',
    high_risk_count: 3,
    high_risk_regions: ['Jejuri', 'Saswad', 'Walhe'],
    active_alerts_count: 12,
    available_volunteers: 4500,
    total_volunteers_capacity: 5000,
  });

  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [historyRange, setHistoryRange] = useState<'1h' | '6h' | 'today'>('6h');
  const [historyReadings, setHistoryReadings] = useState<HistoryReading[]>([]);
  const [alerts, setAlerts] = useState<CrowdAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [routesData, setRoutesData] = useState<any[]>([]);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);

  // Map Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  // Deployment Form State
  const [deployCount, setDeployCount] = useState('20');
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<string | null>(null);

  // 1. Fetch initial summary, zones, alerts, and authentic wari routes
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [sumRes, zonesRes, alertsRes, routesRes] = await Promise.allSettled([
        api.get<CrowdSummary>('crowdflow/summary/'),
        api.get<ZoneData[]>('crowdflow/zones/density/'),
        api.get<CrowdAlertItem[]>('crowdflow/alerts/threshold/'),
        fetch('/api/wari-2025/').then((r) => r.json()),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }

      if (routesRes.status === 'fulfilled' && routesRes.value && Array.isArray(routesRes.value.routes)) {
        setRoutesData(routesRes.value.routes);
      }

      if (zonesRes.status === 'fulfilled' && Array.isArray(zonesRes.value) && zonesRes.value.length > 0) {
        setZones(zonesRes.value);
        if (!selectedZone) {
          // Default to Jejuri if available, otherwise first high risk or first zone
          const jejuri = zonesRes.value.find((z) => z.name.toLowerCase().includes('jejuri'));
          const defaultZ = jejuri || zonesRes.value.find((z) => z.risk_score >= 70) || zonesRes.value[0];
          setSelectedZone(defaultZ);
        } else {
          // Refresh current selected zone
          const updated = zonesRes.value.find((z) => z.id === selectedZone.id);
          if (updated) setSelectedZone(updated);
        }
      }

      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
        setAlerts(alertsRes.value);
      }
    } catch (err) {
      console.error('Error fetching crowd analytics:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 800);
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 15000); // 15s auto-poll
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch history for selected zone
  useEffect(() => {
    if (!selectedZone) return;
    const fetchHistory = async () => {
      try {
        const hist = await api.get<HistoryReading[]>(`crowdflow/zones/${selectedZone.id}/history/?range=${historyRange}`);
        if (Array.isArray(hist) && hist.length > 0) {
          setHistoryReadings(hist);
        }
      } catch (err) {
        console.error('Error fetching zone history:', err);
      }
    };
    fetchHistory();
  }, [selectedZone?.id, historyRange]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    // Center map along the Palkhi route (Pune -> Pandharpur)
    const map = L.map(mapContainer.current, {
      center: [18.25, 74.35],
      zoom: 9,
      minZoom: 7,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    // OpenStreetMap raster tiles — free, no API key, zero watermarks
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // 4. Render Markers, Heatmap & Multi-Colored Routes when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || zones.length === 0) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (routeLayersRef.current) {
      routeLayersRef.current.remove();
      routeLayersRef.current = null;
    }
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.remove();
      heatmapLayerRef.current = null;
    }

    const heatGroup = L.layerGroup();
    const routeGroup = L.layerGroup();

    // 4.1 Draw authentic Palkhi Routes
    if (showRoute) {
      if (routesData.length > 0) {
        routesData.forEach((rt) => {
          const rPoints: [number, number][] = [];
          rt.stops?.forEach((st: any) => {
            if (st.lat && st.lon) rPoints.push([st.lat, st.lon]);
          });
          if (rPoints.length > 1) {
            L.polyline(rPoints, {
              color: rt.color || '#F97316',
              weight: 3.5,
              opacity: 0.85,
              dashArray: '7, 5',
            }).addTo(routeGroup);
          }
        });
      } else {
        const zonePoints: [number, number][] = zones.map((z) => [z.latitude, z.longitude]);
        if (zonePoints.length > 1) {
          L.polyline(zonePoints, {
            color: '#F97316',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '7, 5',
          }).addTo(routeGroup);
        }
      }
      routeGroup.addTo(map);
      routeLayersRef.current = routeGroup;
    }

    // 4.2 Render Zone Density Markers & Heat Circles
    zones.forEach((z) => {
      // Color mapping
      let color = '#10B981'; // Green
      let glowColor = 'rgba(16, 185, 129, 0.4)';

      if (z.risk_score >= 80 || z.density_level === 'critical') {
        color = '#EF4444'; // Red
        glowColor = 'rgba(239, 68, 68, 0.6)';
      } else if (z.risk_score >= 60 || z.density_level === 'high') {
        color = '#F97316'; // Amber / Orange
        glowColor = 'rgba(249, 115, 22, 0.5)';
      } else if (z.risk_score >= 30 || z.density_level === 'medium') {
        color = '#EAB308'; // Yellow
        glowColor = 'rgba(234, 179, 8, 0.4)';
      }

      const isSelected = selectedZone?.id === z.id;

      // Custom HTML Marker with pulsating radar effect
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 44px; height: 44px;">
          ${
            z.risk_score >= 60
              ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${glowColor}; animation-duration: 2s;"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center rounded-full shadow-lg transition-transform duration-200 group-hover:scale-125 ${
            isSelected ? 'ring-4 ring-orange-500 ring-offset-2 scale-110' : ''
          }" style="width: 28px; height: 28px; background-color: ${color}; border: 2.5px solid white;">
            <span class="text-[9px] font-black text-white leading-none">${z.risk_score}</span>
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-white whitespace-nowrap shadow-sm pointer-events-none">
            ${z.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'crowd-marker-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([z.latitude, z.longitude], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        handleSelectZone(z, true);
      });

      markersRef.current[z.id] = marker;

      // Add radiant gradient circle for simulated heatmap layer
      const radius = z.risk_score >= 80 ? 4000 : z.risk_score >= 60 ? 3000 : 2000;
      const heatCircle = L.circle([z.latitude, z.longitude], {
        radius,
        color: 'transparent',
        fillColor: color,
        fillOpacity: z.risk_score >= 80 ? 0.45 : z.risk_score >= 60 ? 0.35 : 0.2,
      });
      heatGroup.addLayer(heatCircle);
    });

    if (showHeatmap) {
      heatGroup.addTo(map);
      heatmapLayerRef.current = heatGroup;
    }
  }, [zones, routesData, selectedZone?.id, showHeatmap, showRoute]);

  // Smooth Zoom to Selected Zone
  const handleSelectZone = (zone: ZoneData, shouldFly = true) => {
    setSelectedZone(zone);
    if (shouldFly && mapInstance.current) {
      mapInstance.current.flyTo([zone.latitude, zone.longitude], 13, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  };

  // Deploy Volunteers Action
  const handleDeploy = async () => {
    if (!selectedZone) return;
    setDeploying(true);
    setDeploySuccess(null);
    try {
      const res = await api.post<{ message: string }>(`crowdflow/zones/${selectedZone.id}/deploy/`, {
        volunteer_count: parseInt(deployCount, 10),
        notes: `Dispatched from live crowd analytics dashboard for ${selectedZone.name}`,
      });
      setDeploySuccess(`Dispatched ${deployCount} volunteers to ${selectedZone.name}!`);
      fetchData();
      setTimeout(() => setDeploySuccess(null), 4000);
    } catch (err: any) {
      setDeploySuccess(err?.message || 'Failed to dispatch volunteers.');
    } finally {
      setDeploying(false);
    }
  };

  // Simulation Tick (Demo Action)
  const handleSimulateTick = async () => {
    setRefreshing(true);
    try {
      await api.post('crowdflow/simulate-tick/', {});
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  // Helper for risk badge styling
  const getRiskBadge = (score: number) => {
    if (score >= 80) return { label: 'Critical', bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', lightBg: 'bg-red-50' };
    if (score >= 60) return { label: 'High', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', lightBg: 'bg-amber-50' };
    if (score >= 30) return { label: 'Medium', bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-200', lightBg: 'bg-yellow-50' };
    return { label: 'Low', bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', lightBg: 'bg-emerald-50' };
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans">

      {/* ════ TOP ADMIN HEADER & SUB-NAVIGATION ════ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">

          {/* Left: Back & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              id="crowd-analytics-back-btn"
              onClick={onBack}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft size={16} />
              Command Center
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-800 leading-none flex items-center gap-2">
                Live Crowd Analytics
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time density, bottleneck detection & auto-dispatch</p>
            </div>
          </div>

          {/* Right: Refresh & Simulate Demo Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-tick"
              onClick={handleSimulateTick}
              disabled={refreshing}
              title="Simulate live crowd movement"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 px-3 py-2 rounded-xl shadow-sm transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-500' : 'text-slate-500'} />
              <span className="hidden sm:inline">Simulate Stream</span>
            </button>

            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 relative">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {summary.active_alerts_count}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN DASHBOARD CONTAINER ════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-5">

        {/* ── 1. TOP 4 METRIC CARDS ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">

          {/* TOTAL ACTIVE PILGRIMS */}
          <div className="rounded-2xl p-4 bg-white/95 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active Pilgrims</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {summary.total_active_pilgrims}
              </span>
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} />
                {summary.pilgrims_growth_rate}
              </p>
            </div>
            <span className="text-[10px] text-slate-400">Live aggregated sensor stream</span>
          </div>

          {/* HIGH-RISK REGIONS */}
          <div className="rounded-2xl p-4 bg-white/95 border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">High-Risk Regions</span>
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
                {summary.high_risk_count}
              </span>
              <p className="text-xs font-bold text-slate-600 truncate mt-0.5">
                {summary.high_risk_regions.join(', ')}
              </p>
            </div>
            <span className="text-[10px] text-red-500 font-semibold">Immediate flow diversion recommended</span>
          </div>

          {/* ACTIVE ALERTS */}
          <div className="rounded-2xl p-4 bg-white/95 border border-amber-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Active Alerts</span>
              <Bell size={15} className="text-amber-500" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
                {summary.active_alerts_count}
              </span>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Requires field response</p>
            </div>
            <span className="text-[10px] text-slate-400">Updated across 15 zones</span>
          </div>

          {/* AVAILABLE VOLUNTEERS */}
          <div className="rounded-2xl p-4 bg-white/95 border border-violet-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Available Volunteers</span>
              <Users size={15} className="text-violet-500" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {summary.available_volunteers.toLocaleString()}
              </span>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-full rounded-full"
                  style={{ width: `${(summary.available_volunteers / summary.total_volunteers_capacity) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Ready for instant dispatch</span>
          </div>
        </section>

        {/* ── 2. MAIN 2-COLUMN SECTION: MAP & SELECTED REGION PANEL ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT: WARI ROUTE INTELLIGENCE MAP (7 or 8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 rounded-3xl bg-white/95 border border-slate-200/80 shadow-md p-4 sm:p-5 flex flex-col gap-4">

            {/* Map Header & Layer Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 leading-tight">Wari Route Intelligence</h2>
                <p className="text-xs text-slate-400">Click any stop point to smoothly zoom & inspect congestion</p>
              </div>

              {/* Layer Toggle Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    showHeatmap ? 'bg-orange-500 text-white shadow-sm' : 'hover:bg-slate-200'
                  }`}
                >
                  <Flame size={12} />
                  Heatmap
                </button>
                <button
                  onClick={() => setShowRoute(!showRoute)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    showRoute ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-200'
                  }`}
                >
                  <Layers size={12} />
                  Route
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner" style={{ minHeight: '440px', height: '54vh' }}>
              <div ref={mapContainer} className="w-full h-full" />

              {/* Floating Top-Left Status Overlay */}
              <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-xl shadow-md text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Palkhi Telemetry Active
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>Sunny, 32°C</span>
                  <span>·</span>
                  <span className="font-semibold text-orange-600">30% Completed</span>
                </div>
              </div>

              {/* Floating Map Legend */}
              <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-md flex items-center gap-3 text-[10px] font-bold text-slate-700">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
              </div>
            </div>

            {/* Quick Segment Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Jump to:</span>
              {zones.map((z) => {
                const badge = getRiskBadge(z.risk_score);
                const isSelected = selectedZone?.id === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => handleSelectZone(z, true)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border whitespace-nowrap transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-800 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.bg}`} />
                    <span>{z.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{z.risk_score}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED REGION DETAILS & DEPLOYMENT PANEL (5 or 4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            {selectedZone ? (
              <div className="rounded-3xl bg-white/95 border border-slate-200/80 shadow-md p-5 flex flex-col gap-4">

                {/* Region Title & Severity Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Selected Region</span>
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight flex items-baseline gap-2">
                      {selectedZone.name}
                      {selectedZone.name_mr && (
                        <span className="text-sm font-normal text-slate-400 font-serif">({selectedZone.name_mr})</span>
                      )}
                    </h3>
                  </div>

                  {(() => {
                    const badge = getRiskBadge(selectedZone.risk_score);
                    return (
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${badge.lightBg} ${badge.text} border ${badge.border}`}>
                        <AlertTriangle size={12} />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                {/* 2x2 Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Users</span>
                    <p className="text-lg font-extrabold text-slate-800 leading-snug mt-0.5">
                      {selectedZone.person_count?.toLocaleString() || '45,210'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Score</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-lg font-black ${
                        selectedZone.risk_score >= 80 ? 'text-red-600' : selectedZone.risk_score >= 60 ? 'text-orange-600' : 'text-emerald-600'
                      }`}>
                        {selectedZone.risk_score}
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Gauge size={10} /> Avg Speed
                    </span>
                    <p className="text-base font-bold text-slate-800 leading-snug mt-0.5">
                      {selectedZone.movement_speed_kmh} km/h
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Compass size={10} /> Direction
                    </span>
                    <p className="text-xs font-bold text-slate-800 leading-snug truncate mt-1" title={selectedZone.movement_direction}>
                      {selectedZone.movement_direction}
                    </p>
                  </div>
                </div>

                {/* Risk Progress Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Congestion Risk Level</span>
                    <span>{selectedZone.risk_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedZone.risk_score >= 80
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : selectedZone.risk_score >= 60
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      }`}
                      style={{ width: `${selectedZone.risk_score}%` }}
                    />
                  </div>
                </div>

                {/* ── CROWD DENSITY HISTORY CHART (Last 6hrs) ── */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">Crowd Density History</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg p-0.5">
                      {(['1h', '6h', 'today'] as const).map((rng) => (
                        <button
                          key={rng}
                          onClick={() => setHistoryRange(rng)}
                          className={`px-2 py-0.5 rounded ${
                            historyRange === rng ? 'bg-orange-500 text-white font-black' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {rng === 'today' ? 'Today' : rng.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Bar / Area Chart */}
                  <div className="h-28 w-full flex items-end justify-between gap-1.5 pt-4 pb-1">
                    {historyReadings.length > 0 ? (
                      historyReadings.slice(-8).map((hr, idx, arr) => {
                        const isLast = idx === arr.length - 1;
                        const maxCap = selectedZone.max_safe_capacity || 50000;
                        const percent = Math.min(100, Math.max(15, Math.round((hr.person_count / maxCap) * 100)));
                        const isHigh = percent >= 75;
                        return (
                          <div key={hr.id || idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                              {hr.person_count.toLocaleString()} ({hr.time_label})
                            </div>
                            <div
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                isHigh
                                  ? 'bg-gradient-to-t from-red-500 to-rose-600'
                                  : percent >= 50
                                  ? 'bg-gradient-to-t from-amber-400 to-orange-500'
                                  : 'bg-gradient-to-t from-orange-200 to-orange-300'
                              } ${isLast ? 'ring-2 ring-orange-500 shadow-sm' : ''}`}
                              style={{ height: `${percent}%` }}
                            />
                            <span className="text-[9px] font-bold text-slate-400 leading-none">
                              {isLast ? 'Now' : hr.time_label.split(':')[0] + 'h'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        Loading history...
                      </div>
                    )}
                  </div>
                </div>

                {/* ── QUICK DEPLOYMENT SECTION ── */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <span className="text-xs font-extrabold text-slate-700">Quick Volunteer Deployment</span>
                  <div className="flex items-center gap-2">
                    <select
                      id="deploy-volunteer-select"
                      value={deployCount}
                      onChange={(e) => setDeployCount(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-400"
                    >
                      <option value="10">10 Volunteers</option>
                      <option value="20">20 Volunteers</option>
                      <option value="50">50 Volunteers</option>
                      <option value="100">100 Volunteers</option>
                    </select>

                    <button
                      id="btn-deploy-to-region"
                      onClick={handleDeploy}
                      disabled={deploying}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      <Send size={13} />
                      {deploying ? 'Deploying...' : `Deploy to ${selectedZone.name}`}
                    </button>
                  </div>

                  {deploySuccess && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                      <span>{deploySuccess}</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-slate-400">
                Select a zone on the map to inspect details
              </div>
            )}
          </div>
        </section>

        {/* ── 3. AUTOMATIC CROWD ALERTS (BOTTOM SECTION) ── */}
        <section className="rounded-3xl bg-white/95 border border-slate-200/80 shadow-md p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-800">Automatic Crowd Alerts</h2>
              <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-0.5 rounded-full">
                {alerts.length} Active
              </span>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
            >
              Refresh Alerts
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.length > 0 ? (
              alerts.map((al) => {
                const isCritical = al.risk_level === 'critical' || al.risk_score >= 80;
                return (
                  <div
                    key={al.id}
                    className={`rounded-2xl p-4 border flex items-start justify-between gap-3 transition-all ${
                      isCritical
                        ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                        : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {al.title.toLowerCase().includes('water') ? (
                          <Droplets size={18} />
                        ) : (
                          <AlertTriangle size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
                            {al.title}
                          </h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            Risk: {al.risk_score}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {al.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                      <button
                        onClick={() => {
                          const targetZone = zones.find((z) => z.id === al.zone || z.name.toLowerCase() === al.zone_name?.toLowerCase());
                          if (targetZone) handleSelectZone(targetZone, true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm"
                      >
                        Map
                      </button>
                      <button
                        onClick={() => {
                          const targetZone = zones.find((z) => z.id === al.zone || z.name.toLowerCase() === al.zone_name?.toLowerCase());
                          if (targetZone) {
                            handleSelectZone(targetZone, true);
                            handleDeploy();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-white text-xs font-extrabold transition-all shadow-sm ${
                          isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                      >
                        {al.action_type || 'Deploy'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 col-span-2 text-center">No high-risk congestion alerts at this moment.</p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};
