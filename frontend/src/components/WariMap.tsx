/**
 * WariMap — interactive Leaflet map powered by OpenStreetMap tiles (no API key required).
 * Includes "VIEW PALKHI ROUTE" interactive selector.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, ChevronDown, Check, X } from 'lucide-react';

// Fix Leaflet's broken default icon paths when bundled with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Stop {
  day: number;
  date: string;
  place: string;
  district: string;
  note: string;
  lat: number;
  lon: number;
  type: string;
  coordinate_confidence: 'high' | 'medium' | 'approximate';
}

interface Route {
  id: string;
  saint: string;
  start_location: string;
  color: string;
  distance_km_approx?: number;
  stops: Stop[];
}

interface WariMapProps {
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dnyaneshwar: 'Sant Dnyaneshwar Maharaj (Alandi)',
  tukaram: 'Sant Tukaram Maharaj (Dehu)',
  eknath: 'Sant Eknath Maharaj (Paithan)',
  nivruttinath: 'Sant Nivruttinath Maharaj (Trimbakeshwar)',
  muktabai: 'Sant Muktabai (Muktainagar)',
  sopandev: 'Sant Sopandev Maharaj (Baramati)',
};

// Build an SVG circle icon for each stop
function makeStopIcon(color: string, isApproximate: boolean) {
  const size = 14;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}"
        fill="${color}"
        stroke="white"
        stroke-width="${isApproximate ? '1.5' : '2'}"
        stroke-dasharray="${isApproximate ? '2,1' : 'none'}"
        opacity="0.92"
      />
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export const WariMap: React.FC<WariMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroups = useRef<Record<string, L.LayerGroup>>({});

  const [routes, setRoutes] = useState<Route[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState(false);

  // 1. Fetch wari locations from Django API
  useEffect(() => {
    fetch('/api/wari-2025/')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.routes)) {
          setRoutes(data.routes);
          const init: Record<string, boolean> = {};
          data.routes.forEach((r: Route) => { init[r.id] = true; });
          setVisible(init);
        } else {
          console.error('[WariMap] Unexpected data shape:', data);
        }
      })
      .catch((err) => console.error('[WariMap] Fetch error:', err));
  }, []);

  // 2. Initialize Leaflet map once container is ready
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      center: [18.0, 74.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap raster tiles — free, no API key
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstance.current = map;
  }, []);

  // 3. Draw routes + markers whenever data arrives
  useEffect(() => {
    if (!mapInstance.current || routes.length === 0) return;
    const map = mapInstance.current;

    // Clear old layers
    Object.values(layerGroups.current).forEach((lg) => lg.removeFrom(map));
    layerGroups.current = {};

    const allLatLngs: L.LatLng[] = [];

    routes.forEach((route) => {
      const lg = L.layerGroup().addTo(map);
      layerGroups.current[route.id] = lg;

      const latLngs: L.LatLng[] = [];

      route.stops.forEach((stop) => {
        if (!stop.lat || !stop.lon) return;
        const ll = L.latLng(stop.lat, stop.lon);
        latLngs.push(ll);
        allLatLngs.push(ll);

        const icon = makeStopIcon(route.color, stop.coordinate_confidence === 'approximate');

        const formattedDate = new Date(stop.date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        });

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 160px; padding: 4px;">
            <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              ${stop.coordinate_confidence === 'approximate' ? '⚠️ ' : ''}${stop.place}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: ${route.color}; margin-bottom: 4px;">
              Day ${stop.day} — ${formattedDate}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              ${stop.note}
            </div>
            <div style="font-size: 10px; color: #94a3b8;">
              ${stop.district} · ${stop.type}
              ${stop.coordinate_confidence === 'approximate' ? '<br/><em>*Approximate location</em>' : ''}
            </div>
          </div>`;

        L.marker(ll, { icon })
          .bindPopup(popupContent, { maxWidth: 240 })
          .addTo(lg);
      });

      // Draw route polyline connecting stops in order
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: route.color,
          weight: 3,
          opacity: 0.8,
          dashArray: '8, 5',
        }).addTo(lg);
      }
    });

    // Fit map to show all stops
    if (allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] });
    }
  }, [routes]);

  // 4. Toggle route layer visibility
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    Object.entries(layerGroups.current).forEach(([id, lg]) => {
      if (visible[id]) {
        if (!map.hasLayer(lg)) lg.addTo(map);
      } else {
        if (map.hasLayer(lg)) lg.removeFrom(map);
      }
    });
  }, [visible]);

  const toggleRoute = (id: string) =>
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeCount = Object.values(visible).filter(Boolean).length;

  const toggleAll = () => {
    const allActive = activeCount === routes.length;
    const updated: Record<string, boolean> = {};
    routes.forEach((r) => { updated[r.id] = !allActive; });
    setVisible(updated);
  };

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      {/* Leaflet map renders here */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* "VIEW PALKHI ROUTE" Control & Menu */}
      {routes.length > 0 && (
        <div className="absolute bottom-3 right-3 z-[1000] flex flex-col items-end">
          
          {/* Expanded Route Selection Modal / Popover */}
          {isRouteMenuOpen && (
            <div className="mb-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-orange-200/90 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                    <Layers size={13} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">Select Palkhi Routes</h4>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">{activeCount} of {routes.length} routes active</p>
                  </div>
                </div>
                <button
                  id="close-palkhi-route-modal-btn"
                  onClick={() => setIsRouteMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Quick Select / Deselect Action */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Available Palkhis</span>
                <button
                  id="toggle-all-palkhi-routes-btn"
                  onClick={toggleAll}
                  className="text-[10.5px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                >
                  {activeCount === routes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* List of Palkhi Routes with Toggle Checkboxes */}
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {routes.map((route) => {
                  const isSelected = !!visible[route.id];
                  return (
                    <div
                      key={route.id}
                      id={`palkhi-route-toggle-${route.id}`}
                      onClick={() => toggleRoute(route.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-orange-50/70 border-orange-200 shadow-xs'
                          : 'bg-slate-50/50 border-slate-200/60 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-md mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: isSelected ? route.color : '#cbd5e1',
                        }}
                      >
                        {isSelected && <Check size={11} className="text-white stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                          {ROUTE_LABELS[route.id] ?? route.saint}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {route.start_location} → Pandharpur · {route.stops?.length || 0} stops
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Done button */}
              <button
                id="apply-palkhi-routes-btn"
                onClick={() => setIsRouteMenuOpen(false)}
                className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
              >
                Apply & View Map
              </button>
            </div>
          )}

          {/* Trigger Button: "VIEW PALKHI ROUTE" */}
          <button
            id="view-palkhi-route-btn"
            onClick={() => setIsRouteMenuOpen((prev) => !prev)}
            className="group flex items-center gap-2 bg-white/95 hover:bg-white text-slate-800 hover:text-orange-600 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg border border-orange-200/90 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <Layers size={14} className="text-orange-500 group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide uppercase text-[11px]">VIEW PALKHI ROUTE</span>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {activeCount}/{routes.length}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 group-hover:text-orange-600 transition-transform duration-200 ${
                isRouteMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
