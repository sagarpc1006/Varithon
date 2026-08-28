import React, { useState } from 'react';
import {
  Users,
  Utensils,
  Home,
  Droplets,
  HeartPulse,
  Sparkles,
  Radio,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Activity,
  AlertTriangle,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { Language, UserSession } from '../types';

interface AdminVolunteersProps {
  session: UserSession;
  language: Language;
  onOpenEmergencySOS?: () => void;
}

export interface VolunteerSquad {
  id: string;
  name: string;
  name_mr?: string;
  category: 'Food' | 'Shelter' | 'Water' | 'Medical' | 'Sanitation';
  lead: string;
  lead_phone: string;
  task: string;
  task_mr?: string;
  members_count: number;
  members_breakdown: string;
  location: string;
  distance: string;
  status: 'ON DUTY' | 'MOBILIZING' | 'STANDBY' | 'DISPATCHED';
  last_updated: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  vehicle?: string;
}

const INITIAL_SQUADS: VolunteerSquad[] = [
  {
    id: 'SQD-FOOD-101',
    name: 'Annachatra & Maha-Prasad Seva Squad Alpha',
    name_mr: 'अन्नछत्र व महाप्रसाद वाटप पथक अ',
    category: 'Food',
    lead: 'Rameshwar Shinde (Senior Sevekar)',
    lead_phone: '+91 9823114455',
    task: 'Coordinating hot khichdi, tea and drinking water distribution at Saswad Bypass Toll Chowk. Managing dining queue for 3,500+ warkaris.',
    task_mr: 'सासवड टोलनाका येथे गरम खिचडी व चहा वाटप आणि ३५००+ भाविकांसाठी दर्शन रांग व्यवस्थापन.',
    members_count: 28,
    members_breakdown: '6 Drivers, 22 Food Sevekars',
    location: 'Saswad Bypass Toll Chowk • Sector 2B',
    distance: '350m from Saswad Main Gate',
    status: 'ON DUTY',
    last_updated: 'Updated 2 mins ago',
    priority: 'HIGH',
    vehicle: '2 Food Trucks (MH-12-FK-4412)',
  },
  {
    id: 'SQD-SHLT-204',
    name: 'Night Shelter & Tentage Logistics Unit',
    name_mr: 'रात्र मुक्काम तंबू व निवास व्यवस्था पथक',
    category: 'Shelter',
    lead: 'Dattatray Gaikwad (Camp Commandant)',
    lead_phone: '+91 9922334455',
    task: 'Setting up waterproof bedding, lighting towers, mobile charging docks, and rest tents at Saswad ZP School Ground for arriving dindis.',
    task_mr: 'सासवड जिल्हा परिषद मैदानावर वाटरप्रूफ तंबू, वीज व मोबाईल चार्जिंगची तात्पुरती व्यवस्था.',
    members_count: 22,
    members_breakdown: '4 Electricians, 18 Camp Volunteers',
    location: 'Saswad ZP School Ground • Sector 3A',
    distance: '800m ahead • Sector 3A',
    status: 'MOBILIZING',
    last_updated: 'Updated 5 mins ago',
    priority: 'NORMAL',
    vehicle: '1 Generator Trailer (MH-14-GH-9011)',
  },
  {
    id: 'SQD-WATR-305',
    name: 'Rapid Drinking Water Replenishment Fleet',
    name_mr: 'स्वच्छ पिण्याच्या पाण्याचे टँकर व वाटप पथक',
    category: 'Water',
    lead: 'Suresh More (Logistics In-charge)',
    lead_phone: '+91 9422001122',
    task: 'Refilling 5,000L RO potable cold water stalls along Bapdev Ghat descent. Deploying mobile water refill backpacks to Dindi #14.',
    task_mr: 'बापदेव घाट उतारावर ५००० लि. आरओ थंड पाणी स्टॉल भरणे व दिंडी क्र. १४ मध्ये पाणी वाटप.',
    members_count: 16,
    members_breakdown: '8 Tanker Operators, 8 Dispenser Crew',
    location: 'Bapdev Ghat Descent • Tent 3',
    distance: '250m away • Bapdev Ghat Section',
    status: 'ON DUTY',
    last_updated: 'Updated Just now',
    priority: 'HIGH',
    vehicle: '3 Water Tankers (5000L RO Cap)',
  },
  {
    id: 'SQD-MED-402',
    name: 'First-Aid & Ambulance Quick Response Team',
    name_mr: 'वैद्यकीय आपत्कालीन व प्रथमोपचार पथक',
    category: 'Medical',
    lead: 'Dr. Anjali Deshmukh (Emergency Physician)',
    lead_phone: '108 / +91 9890123456',
    task: 'Treating blister wounds, dehydration, checking vitals and administering ORS near Saswad Ghat Checkpoint #2. Direct telemetry with 108 ambulance.',
    task_mr: 'सासवड चेकपॉईंट २ जवळ वारकऱ्यांचे बीपी, डिहायड्रेशन व पायांच्या फोडांवर औषधोपचार.',
    members_count: 12,
    members_breakdown: '2 Doctors, 4 Nurses, 6 Paramedics',
    location: 'Saswad Bypass (400m on Left) • Sector 2B',
    distance: '400m on Left • Saswad Sector',
    status: 'ON DUTY',
    last_updated: 'Updated 1 min ago',
    priority: 'CRITICAL',
    vehicle: '1 Advanced Life Support Ambulance (#7)',
  },
  {
    id: 'SQD-SANI-508',
    name: 'Eco-Sanitation & Swachh Wari Cleanliness Squad',
    name_mr: 'स्वच्छ वारी निर्मल पथक व कचरा व्यवस्थापन',
    category: 'Sanitation',
    lead: 'Mahesh Patil (Cleanliness Coordinator)',
    lead_phone: '+91 9765432109',
    task: 'Operating mobile bio-toilet servicing units, clearing pilgrim route corridor, and deploying color-coded waste segregation bins across resting sectors.',
    task_mr: 'बायो-टॉयलेट्सची स्वच्छता, रस्ता सफाई व ओला-सुका कचरा वर्गीकरण डस्टबिन व्यवस्थापन.',
    members_count: 34,
    members_breakdown: '4 Machine Ops, 30 Green Volunteers',
    location: 'Saswad Ringan & Palkhi Resting Corridor',
    distance: '600m ahead • Sector 2C Ground',
    status: 'ON DUTY',
    last_updated: 'Updated 4 mins ago',
    priority: 'NORMAL',
    vehicle: '2 Bio-Suction Vans, 4 Electric Carts',
  },
];

export const AdminVolunteers: React.FC<AdminVolunteersProps> = ({
  session,
  language,
  onOpenEmergencySOS,
}) => {
  const [squads, setSquads] = useState<VolunteerSquad[]>(INITIAL_SQUADS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dispatch Modal State
  const [selectedSquadForDispatch, setSelectedSquadForDispatch] = useState<VolunteerSquad | null>(null);
  const [dispatchSector, setDispatchSector] = useState<string>('Saswad Checkpoint #2 (Ghat Section)');
  const [dispatchTaskNote, setDispatchTaskNote] = useState<string>('');
  const [dispatchPriority, setDispatchPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    { id: 'All', label: 'All', icon: Users },
    { id: 'Food', label: 'Food', icon: Utensils },
    { id: 'Shelter', label: 'Shelter', icon: Home },
    { id: 'Water', label: 'Water', icon: Droplets },
    { id: 'Medical', label: 'Medical', icon: HeartPulse },
    { id: 'Sanitation', label: 'Sanitation', icon: Sparkles },
  ];

  // Filter squads based on category and search
  const filteredSquads = squads.filter((squad) => {
    const matchesCategory = selectedCategory === 'All' || squad.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      squad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      squad.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      squad.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      squad.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalVolunteers = squads.reduce((acc, sq) => acc + sq.members_count, 0);

  const handleOpenDispatchModal = (squad: VolunteerSquad) => {
    setSelectedSquadForDispatch(squad);
    setDispatchTaskNote(`Priority deployment for ${squad.category} support at ${squad.location}. Immediate response requested.`);
    setDispatchPriority(squad.priority);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSquadForDispatch) return;

    setIsDispatching(true);
    setTimeout(() => {
      // Update the squad in state
      setSquads((prev) =>
        prev.map((sq) =>
          sq.id === selectedSquadForDispatch.id
            ? {
                ...sq,
                status: 'DISPATCHED',
                last_updated: 'Dispatched Just now',
                location: dispatchSector,
                priority: dispatchPriority,
                task: dispatchTaskNote || sq.task,
              }
            : sq
        )
      );

      setToastMessage(`⚡ ${selectedSquadForDispatch.id} (${selectedSquadForDispatch.category}) dispatched to ${dispatchSector} successfully!`);
      setIsDispatching(false);
      setSelectedSquadForDispatch(null);

      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 600);
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Food':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Shelter':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Water':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Medical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Sanitation':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-orange-50 text-orange-800 border-orange-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return Utensils;
      case 'Shelter':
        return Home;
      case 'Water':
        return Droplets;
      case 'Medical':
        return HeartPulse;
      case 'Sanitation':
        return Sparkles;
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header & Live Auto-Dispatch Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              Volunteer Department Squads
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-200/90 shadow-xs">
              {squads.length} Active Squads ({totalVolunteers} Volunteers)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time telemetry, squad positioning, mobile resources, and rapid coordination across pilgrimage sectors.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Squad Auto-Dispatch Active Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>Squad Auto-Dispatch Active</span>
          </div>

          <button
            onClick={() => {
              setSquads([...INITIAL_SQUADS]);
              setToastMessage('Volunteer squad telemetry refreshed from central command.');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            title="Refresh Squad Telemetry"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-header Bar: Department Duty Feed + LIVE & Category Filter Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                  Department Duty Feed
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-white animate-pulse tracking-wider">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Showing live sector coverage & task assignments
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad, lead, sector..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons matching reference */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === 'All'
                ? squads.length
                : squads.filter((s) => s.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-orange-50/80 text-slate-600 hover:text-orange-900 border border-slate-200/90'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Squad Cards Grid matching reference layout */}
      <div className="space-y-4">
        {filteredSquads.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Volunteer Squads Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No squads match your current category or search query. Try clearing the filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSquads.map((squad) => {
            const CategoryIcon = getCategoryIcon(squad.category);
            const badgeStyle = getCategoryBadgeStyle(squad.category);

            return (
              <div
                key={squad.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Category, Squad Name, ID, Status, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Category Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${badgeStyle}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{squad.category}</span>
                    </span>

                    {/* Squad ID */}
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                      {squad.id}
                    </span>

                    {/* Priority Badge if Critical/High */}
                    {squad.priority === 'CRITICAL' && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-black uppercase tracking-wider">
                        CRITICAL PRIORITY
                      </span>
                    )}
                    {squad.priority === 'HIGH' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>

                  {/* Status & Time */}
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        squad.status === 'DISPATCHED'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : squad.status === 'MOBILIZING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span>{squad.status}</span>
                    </span>

                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{squad.last_updated}</span>
                    </span>
                  </div>
                </div>

                {/* Squad Title & Marathi Subtitle */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {squad.name}
                  </h3>
                  {squad.name_mr && (
                    <p className="text-xs text-orange-700 font-devanagari font-bold mt-0.5">
                      {squad.name_mr}
                    </p>
                  )}
                </div>

                {/* Task Description Box */}
                <div className="p-3.5 rounded-2xl bg-[#faf7f2] border border-orange-200/60 space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-orange-800">
                    Current Task & Operational Order:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {squad.task}
                  </p>
                  {squad.task_mr && (
                    <p className="text-xs text-slate-500 font-devanagari leading-relaxed">
                      {squad.task_mr}
                    </p>
                  )}
                </div>

                {/* Squad Details Grid: Lead, Members, Distance/Location, Vehicle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Lead & Contact */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Squad Lead
                    </span>
                    <p className="font-bold text-slate-900 truncate">{squad.lead}</p>
                    <a
                      href={`tel:${squad.lead_phone}`}
                      className="text-orange-600 hover:text-orange-700 font-bold inline-flex items-center gap-1 text-[11px]"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{squad.lead_phone}</span>
                    </a>
                  </div>

                  {/* Members Strength */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Active Volunteers
                    </span>
                    <p className="font-bold text-slate-900">
                      {squad.members_count} Members Active
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{squad.members_breakdown}</p>
                  </div>

                  {/* Distance & Sector */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Sector & Distance
                    </span>
                    <p className="font-bold text-slate-900 truncate">{squad.distance}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>{squad.location}</span>
                    </p>
                  </div>

                  {/* Mobile Fleet / Equipment */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Assigned Vehicles
                    </span>
                    <p className="font-bold text-slate-900 truncate">{squad.vehicle || 'Standard Kit'}</p>
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Radio Linked
                    </span>
                  </div>
                </div>

                {/* Bottom Actions: Respond & Dispatch */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Activity className="w-4 h-4 text-orange-500" />
                    <span>Real-time GPS Tracking: Sector Checkpoint Transponder #04</span>
                  </div>

                  <button
                    onClick={() => handleOpenDispatchModal(squad)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Respond & Dispatch</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Respond & Dispatch Interactive Modal */}
      {selectedSquadForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative space-y-4">
            <button
              onClick={() => setSelectedSquadForDispatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Respond & Dispatch Squad
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Issue live route mobilization orders to {selectedSquadForDispatch.id}
                </p>
              </div>
            </div>

            {/* Selected Squad Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">{selectedSquadForDispatch.name}</span>
                <span className="px-2 py-0.5 rounded-md font-bold bg-orange-100 text-orange-800 text-[10px]">
                  {selectedSquadForDispatch.category}
                </span>
              </div>
              <p className="text-slate-500">
                Lead: <strong>{selectedSquadForDispatch.lead}</strong> • Strength: {selectedSquadForDispatch.members_count} volunteers
              </p>
            </div>

            {/* Dispatch Form */}
            <form onSubmit={handleConfirmDispatch} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  Target Sector / Deployment Location *
                </label>
                <select
                  value={dispatchSector}
                  onChange={(e) => setDispatchSector(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                >
                  <option value="Saswad Checkpoint #2 (Ghat Section)">Saswad Checkpoint #2 (Ghat Section)</option>
                  <option value="Saswad ZP School Resting Camp #8">Saswad ZP School Resting Camp #8</option>
                  <option value="Bapdev Ghat Descent (Stall 12 Area)">Bapdev Ghat Descent (Stall 12 Area)</option>
                  <option value="Jejuri Entrance Toll Plaza Corridor">Jejuri Entrance Toll Plaza Corridor</option>
                  <option value="Ringan Ground Main Assembly Gate">Ringan Ground Main Assembly Gate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Priority Level
                  </label>
                  <select
                    value={dispatchPriority}
                    onChange={(e) => setDispatchPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Telemetry Channel
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="VHF Seva Channel 4 (Auto-Link)"
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  Action Order & Operational Notes *
                </label>
                <textarea
                  rows={3}
                  value={dispatchTaskNote}
                  onChange={(e) => setDispatchTaskNote(e.target.value)}
                  placeholder="Specify duty instructions, priority warkari group, or medical/water requirements..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedSquadForDispatch(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-600/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isDispatching ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Dispatching Squad...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirm & Mobilize Squad</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
