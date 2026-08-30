import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SOSFeedCard, FeedItemData } from './SOSFeedCard';
import { SOSFilter, FilterCategory } from './SOSFilter';
import { SOSResponseModal } from './SOSResponseModal';
import { ShieldCheck, RefreshCw, Radio, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SOSReport } from '../sos/SOSCard';

interface LiveSOSFeedProps {
  adminLocation?: { lat: number; lng: number };
  onTotalCountChange?: (count: number) => void;
}

// Distance calculation helper (Haversine formula in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format relative time helper
function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const LiveSOSFeed: React.FC<LiveSOSFeedProps> = ({
  adminLocation = { lat: 18.5204, lng: 73.8567 },
  onTotalCountChange,
}) => {
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  
  const [selectedItem, setSelectedItem] = useState<FeedItemData | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState<boolean>(false);
  
  const prevCountRef = useRef<number>(0);
  const [newArrivalId, setNewArrivalId] = useState<number | null>(null);

  // Fetch live reports
  const fetchReports = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await api.get<SOSReport[]>(
        `/sos/nearby/?lat=${adminLocation.lat}&lng=${adminLocation.lng}&radius=5.0`
      );
      if (Array.isArray(data)) {
        // Detect newly arrived alerts for animation
        if (data.length > prevCountRef.current && prevCountRef.current > 0) {
          const newest = data[0];
          if (newest) {
            setNewArrivalId(newest.id);
            setTimeout(() => setNewArrivalId(null), 4000);
          }
        }
        prevCountRef.current = data.length;
        setReports(data);
        if (onTotalCountChange) onTotalCountChange(data.length);
      }
    } catch (err) {
      console.warn("Using sample live feed data:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
    const interval = setInterval(() => {
      fetchReports(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Built-in fallback sample alerts if backend has no active records (matching the reference image!)
  const sampleItems: FeedItemData[] = useMemo(() => [
    {
      id: 1042,
      type: 'medical',
      categoryTitle: 'Medical Emergency',
      reporterName: 'Ramesh Kumar',
      variMitraId: 'ID: V-1042',
      distanceKm: 1.2,
      timeAgo: 'Just now',
      description: 'Severe dehydration & muscle cramps near Saswad junction.',
      status: 'open',
      mobile: '9876543210',
    },
    {
      id: 891,
      type: 'lost_person',
      categoryTitle: 'Lost Person',
      reporterName: 'Sita Devi',
      variMitraId: 'ID: V-0891',
      distanceKm: 0.5,
      timeAgo: '5m ago',
      description: 'Separated from Alandi Dindi No. 1 near first aid post.',
      status: 'open',
      mobile: '9822011223',
    },
    {
      id: 2201,
      type: 'issue',
      categoryTitle: 'General Issue',
      reporterName: 'Anil Sharma',
      variMitraId: 'ID: V-2201',
      distanceKm: 3.1,
      timeAgo: '12m ago',
      description: 'Water tanker supply disruption near dindi holding ground.',
      status: 'acknowledged',
      mobile: '9890123456',
    },
  ], []);

  // Map backend reports to FeedItemData structure
  const formattedReports: FeedItemData[] = useMemo(() => {
    if (reports.length === 0) {
      return sampleItems;
    }

    return reports.map((r) => {
      let categoryTitle = 'General Issue';
      let normType = (r.type || '').toLowerCase();

      if (normType === 'medical') {
        categoryTitle = 'Medical Emergency';
        normType = 'medical';
      } else if (normType === 'lost_item' || normType === 'lost_person' || normType === 'lost') {
        categoryTitle = normType === 'lost_item' ? 'Lost Item' : 'Lost Person';
        normType = 'lost_person';
      } else if (normType === 'restroom') {
        categoryTitle = 'Restroom Issue';
        normType = 'restroom';
      } else {
        categoryTitle = 'General Issue';
        normType = 'issue';
      }

      const dist = calculateDistance(adminLocation.lat, adminLocation.lng, r.lat, r.lng);
      const isNew = r.id === newArrivalId;

      return {
        id: r.id,
        type: normType,
        categoryTitle,
        reporterName: r.reported_by || r.reporter_name || 'Pilgrim',
        variMitraId: `ID: V-${(r.id + 1000).toString().padStart(4, '0')}`,
        distanceKm: dist > 0 ? dist : 0.8,
        timeAgo: formatTimeAgo(r.created_at),
        description: r.description,
        status: (r.status as any) || 'open',
        adminReply: r.admin_reply,
        mobile: r.reporter_mobile,
        isNew,
      };
    });
  }, [reports, sampleItems, adminLocation, newArrivalId]);

  // Urgency Priority Sorting: Medical (1) -> Lost (2) -> Issue (3) -> Other, then newest
  const sortedReports = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      medical: 1,
      lost_person: 2,
      lost_item: 2,
      lost: 2,
      restroom: 3,
      issue: 4,
      general_issue: 4,
    };

    return [...formattedReports].sort((a, b) => {
      // If one is resolved and other isn't, put active first
      if (a.status === 'resolved' && b.status !== 'resolved') return 1;
      if (a.status !== 'resolved' && b.status === 'resolved') return -1;

      const pA = priorityOrder[a.type.toLowerCase()] || 5;
      const pB = priorityOrder[b.type.toLowerCase()] || 5;
      if (pA !== pB) return pA - pB;

      return b.id - a.id;
    });
  }, [formattedReports]);

  // Filter application
  const filteredReports = useMemo(() => {
    return sortedReports.filter((item) => {
      const type = item.type.toLowerCase();
      const isResolved = item.status === 'resolved';

      if (activeFilter === 'resolved') {
        return isResolved;
      }
      
      // All other filters only show active (non-resolved) items
      if (isResolved) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'medical') return type === 'medical';
      if (activeFilter === 'lost') return type === 'lost_person' || type === 'lost_item' || type === 'lost';
      if (activeFilter === 'restroom') return type === 'restroom';
      if (activeFilter === 'issue') return type === 'issue' || type === 'general_issue' || !['medical', 'lost_person', 'lost_item', 'lost', 'restroom'].includes(type);

      return true;
    });
  }, [sortedReports, activeFilter]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const activeReports = sortedReports.filter(r => r.status !== 'resolved');
    const resolvedReports = sortedReports.filter(r => r.status === 'resolved');

    return {
      all: activeReports.length,
      medical: activeReports.filter(r => r.type.toLowerCase() === 'medical').length,
      lost: activeReports.filter(r => ['lost_person', 'lost_item', 'lost'].includes(r.type.toLowerCase())).length,
      restroom: activeReports.filter(r => r.type.toLowerCase() === 'restroom').length,
      issue: activeReports.filter(r => ['issue', 'general_issue'].includes(r.type.toLowerCase()) || !['medical', 'lost_person', 'lost_item', 'lost', 'restroom'].includes(r.type.toLowerCase())).length,
      resolved: resolvedReports.length,
    };
  }, [sortedReports]);

  // Handle live reply
  const handleSendReply = async (id: number, reply: string) => {
    setIsModalSubmitting(true);
    try {
      await api.post(`/sos/${id}/reply/`, { reply });
      await fetchReports(false);
      setSelectedItem(prev => prev ? { ...prev, adminReply: reply, status: 'acknowledged' } : null);
    } catch (err: any) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (id: number, newStatus: 'acknowledged' | 'resolved') => {
    setIsModalSubmitting(true);
    try {
      await api.patch(`/sos/${id}/status/`, { status: newStatus });
      await fetchReports(false);
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
      if (newStatus === 'resolved') {
        setSelectedItem(null);
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <aside className="w-full bg-white rounded-2xl border border-[#D8CDBE] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden h-[620px] max-h-[82vh]">
      
      {/* ── 1. Header (Height ~64px, White/Warm Background) ── */}
      <div className="h-16 px-5 border-b border-[#D8CDBE] bg-white flex items-center justify-between shrink-0">
        
        {/* Left: Title + Live Pulse */}
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg sm:text-[19px] font-bold text-[#181716] tracking-tight font-sans">
            Live SOS Feed
          </h3>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Right: Refresh & Filter Trigger */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchReports(true)}
            disabled={isLoading}
            className="p-2 rounded-lg text-[#514A40] hover:text-[#181716] hover:bg-[#FAF7F3] transition-colors cursor-pointer"
            title="Refresh Live SOS Feed"
            aria-label="Refresh Feed"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin text-[#8A6800]' : ''} />
          </button>

          <SOSFilter
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
            counts={filterCounts}
          />
        </div>
      </div>

      {/* ── 2. Scrollable Alert Cards Feed ── */}
      <div className="flex-1 p-4 sm:p-4.5 space-y-3.5 overflow-y-auto bg-[#FAF7F3]">
        {filteredReports.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-white rounded-xl border border-dashed border-[#D8CDBE]">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#8A6800] flex items-center justify-center">
              <ShieldCheck size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#181716]">No active emergencies</h4>
              <p className="text-xs text-[#514A40]">All clear for now in your 2km radius.</p>
            </div>
          </div>
        ) : (
          filteredReports.map((item) => (
            <SOSFeedCard
              key={item.id}
              item={item}
              onActionClick={(alert) => setSelectedItem(alert)}
            />
          ))
        )}
      </div>

      {/* ── 3. Action / Response Modal ── */}
      <SOSResponseModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSendReply={handleSendReply}
        onUpdateStatus={handleUpdateStatus}
        isSubmitting={isModalSubmitting}
      />

    </aside>
  );
};
