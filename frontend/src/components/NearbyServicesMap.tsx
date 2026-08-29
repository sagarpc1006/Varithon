/**
 * NearbyServicesMap — interactive Leaflet map powered by OpenStreetMap tiles.
 * Displays Palkhi routes with uniform orange markers & connecting paths.
 *
 * - Admin variant: Click any orange stop to add or remove resources (Food, Water, Toilets, Restrooms, Medical)
 *   without auto-zooming out or resetting map state.
 * - User variant: Displays simple, clean vector SVG logos at the exact location of each resource,
 *   with comprehensive details in the popup.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  LocateFixed,
  Shield,
  HeartHandshake,
} from 'lucide-react';

// Fix Leaflet default icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Color & Config Constants ──
const PALKHI_ORANGE = '#ea580c';

export interface ResourceMeta {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  svgIcon: string;
}

export const RESOURCE_CONFIG: Record<string, ResourceMeta> = {
  FOOD: {
    key: 'FOOD',
    label: 'Food / Annachatra',
    shortLabel: 'Food',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  },
  WATER: {
    key: 'WATER',
    label: 'Clean Drinking Water',
    shortLabel: 'Water',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#7dd3fc',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  },
  TOILETS: {
    key: 'TOILETS',
    label: 'Toilets & Sanitation',
    shortLabel: 'Toilets',
    color: '#7c3aed',
    bgColor: '#faf5ff',
    borderColor: '#d8b4fe',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="4" r="2"/><path d="M6 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"/><circle cx="17" cy="4" r="2"/><path d="M14 21l2-7h2l2 7"/></svg>`,
  },
  RESTROOMS: {
    key: 'RESTROOMS',
    label: 'Restrooms & Night Shelter',
    shortLabel: 'Restrooms',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"/><path d="M9 21V12h6v9"/></svg>`,
  },
  MEDICAL: {
    key: 'MEDICAL',
    label: 'Medical Camp & Ambulance',
    shortLabel: 'Medical',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z"/></svg>`,
  },
  WASTE: {
    key: 'WASTE',
    label: 'Waste Management / Nirmal Wari',
    shortLabel: 'Waste',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
    svgIcon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  },
};

const RESOURCE_TYPES_LIST = Object.values(RESOURCE_CONFIG);

// ── Interfaces ──
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
  stops: Stop[];
}

export interface NearbyResourceData {
  id: number;
  resource_type: string;
  location_name: string;
  latitude: number;
  longitude: number;
  label: string;
  is_active: boolean;
  created_at: string;
}

// ── Marker Icon Builders ──
function makeStopWithResourcesIcon(
  stopResources: NearbyResourceData[],
  isApproximate: boolean
) {
  // If no resources at this stop, render clean orange dot
  if (stopResources.length === 0) {
    const size = 14;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}"
          fill="${PALKHI_ORANGE}" stroke="white"
          stroke-width="${isApproximate ? '1.5' : '2'}"
          stroke-dasharray="${isApproximate ? '2,1' : 'none'}" opacity="0.95" />
      </svg>`;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 4],
    });
  }

  // If resources exist, render orange center dot with attached clean resource mini-badges directly at exact location
  const badgesHtml = stopResources
    .slice(0, 6)
    .map((res) => {
      const cfg = RESOURCE_CONFIG[res.resource_type];
      if (!cfg) return '';
      return `<div style="
        width: 20px; height: 20px; border-radius: 50%;
        background: ${cfg.bgColor}; border: 1.5px solid ${cfg.color};
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      ">${cfg.svgIcon}</div>`;
    })
    .join('');

  const extraCount = stopResources.length > 6 ? `+${stopResources.length - 6}` : '';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <!-- Attached Resource Badges directly above the stop dot -->
      <div style="
        position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%);
        display: flex; align-items: center; gap: 2px;
        background: rgba(255, 255, 255, 0.95); border: 1px solid #cbd5e1;
        padding: 2px 4px; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        white-space: nowrap; pointer-events: none;
      ">
        ${badgesHtml}
        ${extraCount ? `<span style="font-size: 9px; font-weight: 800; color: #475569; padding-right: 2px;">${extraCount}</span>` : ''}
      </div>
      <!-- Exact location center dot -->
      <div style="
        width: 14px; height: 14px; border-radius: 50%;
        background: ${PALKHI_ORANGE}; border: 2.5px solid white;
        box-shadow: 0 0 0 1px rgba(234, 88, 12, 0.4), 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 18],
    popupAnchor: [0, -22],
  });
}

// ── Main Component ──
interface NearbyServicesMapProps {
  onBack: () => void;
  variant?: 'user' | 'admin';
}

export const NearbyServicesMap: React.FC<NearbyServicesMapProps> = ({ onBack, variant = 'user' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const palkhiLayerGroup = useRef<L.LayerGroup | null>(null);
  const hasFittedInitialBounds = useRef(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [resources, setResources] = useState<NearbyResourceData[]>([]);

  // Ref to hold latest resources so callbacks & popups never become stale
  const resourcesRef = useRef<NearbyResourceData[]>([]);
  resourcesRef.current = resources;

  const isAdmin = variant === 'admin';
  const themeBorder = isAdmin ? 'border-blue-100' : 'border-orange-100';
  const themeColor = isAdmin ? 'blue' : 'orange';

  // ── 1. Geolocation ──
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setUserLocation({ lat: 18.5204, lon: 73.8567 }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 18.5204, lon: 73.8567 });
    }
  }, []);

  // ── 2. Fetch Palkhi routes ──
  useEffect(() => {
    fetch('/api/wari-2025/')
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.routes)) {
          setRoutes(data.routes);
        }
      })
      .catch((err) => console.error('[NearbyServicesMap] Route fetch error:', err));
  }, []);

  // ── 3. Fetch resources ──
  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/nearby-resources/');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.resources)) {
          setResources(data.resources);
        }
      }
    } catch (err) {
      console.error('[NearbyServicesMap] Resource fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── 4. Init Leaflet map ──
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      center: [18.0, 74.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstance.current = map;

    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── 5. Add / Remove Resource Handlers (smooth, no zoom resets) ──
  const handleAddResource = useCallback(async (type: string, locationName: string, lat: number, lon: number) => {
    try {
      const res = await fetch('/api/nearby-resources/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_type: type, location_name: locationName, latitude: lat, longitude: lon }),
      });
      if (res.ok) {
        await fetchResources();
      }
    } catch (e) {
      console.error('Add resource error:', e);
    }
  }, [fetchResources]);

  const handleRemoveResource = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/nearby-resources/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        await fetchResources();
      }
    } catch (e) {
      console.error('Remove resource error:', e);
    }
  }, [fetchResources]);

  // ── 6. Popup Builders ──
  const buildAdminPopupContent = useCallback((stop: Stop, saint: string, currentLocResources: NearbyResourceData[]) => {
    const existingListHtml = currentLocResources.length > 0
      ? currentLocResources
          .map((r) => {
            const cfg = RESOURCE_CONFIG[r.resource_type] || {
              label: r.resource_type,
              color: '#475569',
              bgColor: '#f1f5f9',
              svgIcon: '',
            };
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 22px; height: 22px; border-radius: 6px; background: ${cfg.bgColor}; display: flex; align-items: center; justify-content: center;">
                    ${cfg.svgIcon}
                  </div>
                  <span style="font-size: 11.5px; font-weight: 700; color: #1e293b;">${cfg.label}</span>
                </div>
                <button
                  data-remove-id="${r.id}"
                  style="
                    display: inline-flex; align-items: center; gap: 3px;
                    background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;
                    border-radius: 6px; font-size: 10px; font-weight: 800;
                    padding: 3px 7px; cursor: pointer; transition: all 0.15s;
                  "
                >
                  ✕ Remove
                </button>
              </div>
            `;
          })
          .join('')
      : `<div style="font-size: 11px; color: #94a3b8; padding: 8px; text-align: center; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">No resources assigned yet</div>`;

    const existingTypes = new Set(currentLocResources.map((r) => r.resource_type));
    const availableToAdd = RESOURCE_TYPES_LIST.filter((rt) => !existingTypes.has(rt.key));

    const addButtonsHtml = availableToAdd.length > 0
      ? availableToAdd
          .map((rt) => `
            <button
              data-add-type="${rt.key}"
              style="
                display: inline-flex; align-items: center; gap: 6px;
                background: ${rt.bgColor}; color: ${rt.color}; border: 1px solid ${rt.borderColor};
                border-radius: 8px; font-size: 11px; font-weight: 700;
                padding: 6px 10px; cursor: pointer; transition: transform 0.1s;
              "
            >
              ${rt.svgIcon}
              <span>+ Add ${rt.shortLabel}</span>
            </button>
          `)
          .join('')
      : `<div style="font-size: 11px; color: #16a34a; font-weight: 600; text-align: center; padding: 4px;">All standard resources added!</div>`;

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 250px; max-width: 300px; padding: 2px;">
        <!-- Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.2;">
              📍 ${stop.place}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: ${PALKHI_ORANGE}; margin-top: 2px;">
              ${saint} · Day ${stop.day}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
              ${stop.district} · ${stop.type}
            </div>
          </div>
        </div>

        <!-- Active Resources Block -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; margin-bottom: 8px;">
          <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span>Current Resources</span>
            <span style="background: #e2e8f0; color: #334155; padding: 1px 5px; border-radius: 99px; font-size: 9px;">${currentLocResources.length}</span>
          </div>
          ${existingListHtml}
        </div>

        <!-- Add Resources Block -->
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 8px;">
          <div style="font-size: 10px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Customize Resources
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${addButtonsHtml}
          </div>
        </div>
      </div>
    `;
  }, []);

  const buildUserPopupContent = useCallback((stop: Stop, saint: string, currentLocResources: NearbyResourceData[]) => {
    const resourcesListHtml = currentLocResources.length > 0
      ? currentLocResources
          .map((r) => {
            const cfg = RESOURCE_CONFIG[r.resource_type] || {
              label: r.resource_type,
              color: '#16a34a',
              bgColor: '#f0fdf4',
              borderColor: '#86efac',
              svgIcon: '',
            };
            return `
              <div style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 4px;">
                <div style="width: 24px; height: 24px; border-radius: 6px; background: ${cfg.bgColor}; border: 1px solid ${cfg.borderColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${cfg.svgIcon}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 11.5px; font-weight: 700; color: #1e293b; line-height: 1.2;">${cfg.label}</div>
                  <div style="font-size: 9.5px; color: ${cfg.color}; font-weight: 600;">Available for Pilgrims</div>
                </div>
              </div>
            `;
          })
          .join('')
      : `<div style="font-size: 11px; color: #64748b; padding: 6px 8px; background: #f8fafc; border-radius: 8px;">No special seva points deployed here yet.</div>`;

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; max-width: 280px; padding: 2px;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
            📍 ${stop.place}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: ${PALKHI_ORANGE}; margin-top: 2px;">
            ${saint} — Day ${stop.day}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
            ${stop.district} · ${stop.type}
          </div>
        </div>

        <div style="font-size: 11px; color: #334155; margin-bottom: 8px; line-height: 1.35;">
          ${stop.note}
        </div>

        <!-- Seva Services available -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px;">
          <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span>Nearby Seva & Resources</span>
            <span style="background: #e2e8f0; color: #334155; padding: 1px 5px; border-radius: 99px; font-size: 9px;">${currentLocResources.length}</span>
          </div>
          ${resourcesListHtml}
        </div>
      </div>
    `;
  }, []);

  // ── 7. Render Routes & Markers with Exact Location Resources ──
  useEffect(() => {
    if (!mapInstance.current || routes.length === 0) return;
    const map = mapInstance.current;

    // Clear previous layer
    if (palkhiLayerGroup.current) {
      palkhiLayerGroup.current.removeFrom(map);
    }

    const lg = L.layerGroup().addTo(map);
    palkhiLayerGroup.current = lg;

    const allLatLngs: L.LatLng[] = [];

    routes.forEach((route) => {
      const routeLatLngs: L.LatLng[] = [];

      route.stops.forEach((stop) => {
        if (!stop.lat || !stop.lon) return;
        const ll = L.latLng(stop.lat, stop.lon);
        routeLatLngs.push(ll);
        allLatLngs.push(ll);

        // Find resources at this exact stop place name
        const stopResources = resources.filter(
          (r) => r.location_name.toLowerCase() === stop.place.toLowerCase() && r.is_active
        );

        // Icon with clean vector SVG logos at exact location
        const icon = makeStopWithResourcesIcon(
          stopResources,
          stop.coordinate_confidence === 'approximate'
        );

        const marker = L.marker(ll, { icon }).addTo(lg);

        if (isAdmin) {
          marker.on('click', () => {
            // Read latest resources from ref to avoid stale closures
            const currentLocResources = resourcesRef.current.filter(
              (r) => r.location_name.toLowerCase() === stop.place.toLowerCase() && r.is_active
            );

            const popupHtml = buildAdminPopupContent(stop, route.saint, currentLocResources);

            const popup = L.popup({
              maxWidth: 320,
              minWidth: 260,
              className: 'palkhi-admin-resource-popup',
              autoPan: true,
            })
              .setLatLng(ll)
              .setContent(popupHtml)
              .openOn(map);

            const attachHandlers = () => {
              const el = popup.getElement();
              if (!el) return;

              // Add resource buttons
              el.querySelectorAll<HTMLButtonElement>('[data-add-type]').forEach((btn) => {
                btn.onclick = async (e) => {
                  e.stopPropagation();
                  const type = btn.getAttribute('data-add-type')!;
                  btn.disabled = true;
                  btn.style.opacity = '0.5';
                  await handleAddResource(type, stop.place, stop.lat, stop.lon);
                  // Refresh popup content dynamically without closing or zooming out!
                  const updatedLocResources = resourcesRef.current.filter(
                    (r) => r.location_name.toLowerCase() === stop.place.toLowerCase() && r.is_active
                  );
                  popup.setContent(buildAdminPopupContent(stop, route.saint, updatedLocResources));
                  setTimeout(attachHandlers, 20);
                };
              });

              // Remove resource buttons
              el.querySelectorAll<HTMLButtonElement>('[data-remove-id]').forEach((btn) => {
                btn.onclick = async (e) => {
                  e.stopPropagation();
                  const id = parseInt(btn.getAttribute('data-remove-id')!, 10);
                  btn.disabled = true;
                  btn.style.opacity = '0.5';
                  await handleRemoveResource(id);
                  // Refresh popup content dynamically without closing or zooming out!
                  const updatedLocResources = resourcesRef.current.filter(
                    (r) => r.location_name.toLowerCase() === stop.place.toLowerCase() && r.is_active
                  );
                  popup.setContent(buildAdminPopupContent(stop, route.saint, updatedLocResources));
                  setTimeout(attachHandlers, 20);
                };
              });
            };

            setTimeout(attachHandlers, 30);
          });
        } else {
          // User click: shows nice clean details of all available resources
          marker.on('click', () => {
            const currentLocResources = resourcesRef.current.filter(
              (r) => r.location_name.toLowerCase() === stop.place.toLowerCase() && r.is_active
            );
            const popupHtml = buildUserPopupContent(stop, route.saint, currentLocResources);

            L.popup({
              maxWidth: 300,
              minWidth: 240,
              autoPan: true,
            })
              .setLatLng(ll)
              .setContent(popupHtml)
              .openOn(map);
          });
        }
      });

      // Orange polyline path
      if (routeLatLngs.length > 1) {
        L.polyline(routeLatLngs, {
          color: PALKHI_ORANGE,
          weight: 3,
          opacity: 0.85,
          dashArray: '8, 5',
        }).addTo(lg);
      }
    });

    // ── FIT BOUNDS ONLY ONCE on initial load to prevent automatic zooming out! ──
    if (!hasFittedInitialBounds.current && allLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] });
      hasFittedInitialBounds.current = true;
    }
  }, [routes, resources, isAdmin, handleAddResource, handleRemoveResource, buildAdminPopupContent, buildUserPopupContent]);

  // ── Navigation helpers ──
  const resetOverview = () => {
    mapInstance.current?.setView([18.0, 74.0], 7, { animate: true });
  };

  const zoomToUser = () => {
    if (mapInstance.current && userLocation) {
      mapInstance.current.setView([userLocation.lat, userLocation.lon], 13, { animate: true });
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            id="nearby-services-back-btn"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-${themeColor}-600 bg-white hover:bg-${themeColor}-50 border border-slate-200 hover:border-${themeColor}-200 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-xs`}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${isAdmin ? 'from-blue-600 to-indigo-700' : 'from-orange-500 to-amber-600'} flex items-center justify-center shadow-sm text-white`}>
              {isAdmin ? <Shield size={16} /> : <MapPin size={16} />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                {isAdmin ? 'Admin Resource Manager' : 'Nearby Services & Resources'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isAdmin
                  ? 'Click any orange stop on the route to add / remove seva resources'
                  : 'Live Palkhi stops with real-time food, water, sanitation, shelter, medical & waste management points'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-2">
          {userLocation && (
            <button
              id="btn-locate-user"
              onClick={zoomToUser}
              className={`flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-${themeColor}-600 bg-white hover:bg-${themeColor}-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs`}
              title="Zoom to My Location"
            >
              <LocateFixed size={13} className={isAdmin ? 'text-blue-500' : 'text-orange-500'} />
              <span className="hidden sm:inline">My Location</span>
            </button>
          )}
          <button
            id="btn-overview-map"
            onClick={resetOverview}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            title="Reset to State Overview"
          >
            <Maximize2 size={13} />
            <span>State Overview</span>
          </button>
        </div>
      </div>

      {/* ── Resource Legend with Simple Clean Logos ── */}
      <div className="flex items-center gap-2 flex-wrap bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mr-1">
          <HeartHandshake size={14} className="text-orange-500" />
          <span>Services:</span>
        </div>
        {RESOURCE_TYPES_LIST.map((rt) => {
          const count = resources.filter((r) => r.resource_type === rt.key).length;
          return (
            <div
              key={rt.key}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border shadow-2xs"
              style={{
                color: rt.color,
                borderColor: rt.borderColor,
                backgroundColor: rt.bgColor,
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: rt.svgIcon }} />
              <span>{rt.shortLabel}</span>
              {count > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold text-white"
                  style={{ backgroundColor: rt.color }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Map Container ── */}
      <section
        className={`relative w-full rounded-2xl overflow-hidden border ${themeBorder} shadow-xl bg-white`}
        style={{ minHeight: '400px', height: '60vh', maxHeight: '640px' }}
      >
        <div ref={mapContainer} className="absolute inset-0 z-0" />
      </section>
    </div>
  );
};
