import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Info,
  Lock,
  Globe,
  AlertTriangle,
  ChevronDown,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  X,
  Radio,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { GroupData, UserSession, Language } from '../../types';
import { groupsService } from '../../services/groups';

interface UserGroupsOverviewProps {
  session: UserSession;
  language: Language;
  onOpenChat: (groupId: number) => void;
}

export const UserGroupsOverview: React.FC<UserGroupsOverviewProps> = ({
  session,
  language,
  onOpenChat,
}) => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Modal State for Create / Join Group
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupRoute, setNewGroupRoute] = useState<string>('Saswad Checkpoint -> Jejuri');
  const [newGroupType, setNewGroupType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [newGroupColor, setNewGroupColor] = useState<string>('orange');
  const [joinCode, setJoinCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupsService.getGroups(searchQuery, filterType);
      if (res && res.groups) {
        setGroups(res.groups);
        if (res.groups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(res.groups[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setSubmitting(true);
    try {
      const res = await groupsService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        route_info: newGroupRoute.trim(),
        group_type: newGroupType,
        icon_color: newGroupColor,
      });
      setActionSuccess('Group created successfully! You are now the Group Admin.');
      setTimeout(() => {
        setActionSuccess(null);
        setShowModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroups();
        if (res.group) {
          setSelectedGroupId(res.group.id);
        }
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
    const targetId = selectedGroupId || (groups[0] && groups[0].id);
    if (!targetId) return;

    setSubmitting(true);
    try {
      await groupsService.joinGroup(targetId);
      setActionSuccess('Joined group successfully!');
      setTimeout(() => {
        setActionSuccess(null);
        setShowModal(false);
        fetchGroups();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to join group');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'border-purple-200',
          badge: 'bg-purple-50 text-purple-700',
        };
      case 'green':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700',
        };
      case 'rose':
        return {
          bg: 'bg-rose-100',
          text: 'text-rose-600',
          border: 'border-rose-200',
          badge: 'bg-rose-50 text-rose-700',
        };
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-200',
          badge: 'bg-blue-50 text-blue-700',
        };
      case 'amber':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-600',
          border: 'border-amber-200',
          badge: 'bg-amber-50 text-amber-700',
        };
      case 'orange':
      default:
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          border: 'border-orange-200',
          badge: 'bg-orange-50 text-orange-700',
        };
    }
  };

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '10:30 AM';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:30 AM';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Header, Subtitle, Search, Filter, Create/Join Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Wari Community Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Connect, share updates and help fellow Warkaris on the route.
          </p>
        </div>

        {/* Search, Filter & Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs"
            />
          </form>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs cursor-pointer"
            >
              <option value="all">All Groups</option>
              <option value="public">Public Groups</option>
              <option value="joined">My Joined Groups</option>
              <option value="private">Private Groups</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Create / Join Group Button */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create / Join Group</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Left Groups List + Right Selected Group Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Group Cards List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3.5">
          {loading && groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading Wari Community Groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No groups found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search or create a new group.</p>
            </div>
          ) : (
            groups.map((group) => {
              const colorInfo = getColorClasses(group.icon_color);
              const isSelected = selectedGroup && selectedGroup.id === group.id;
              const unreadCount = group.unread_count || 0;

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative ${
                    isSelected
                      ? 'bg-white border-orange-500 shadow-md ring-2 ring-orange-500/10'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left Avatar & Group Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {group.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                        {group.route_info || group.description || 'Wari Route Updates'}
                      </p>
                    </div>
                  </div>

                  {/* Right Badges & Count */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {/* Public / Private Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        group.group_type === 'PUBLIC'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {group.group_type === 'PUBLIC' ? 'Public' : 'Private'}
                    </span>

                    {/* Member Count */}
                    <div className="text-right min-w-[75px]">
                      <p className="text-xs font-bold text-slate-800">
                        {group.members_count || 128}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">members</p>
                    </div>

                    {/* Unread Badge (Red circle matching preview image) */}
                    {unreadCount > 0 ? (
                      <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs animate-pulse">
                        {unreadCount}
                      </div>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Footer note matching preview image */}
          <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block shrink-0" />
            <span>Unread messages are shown in red</span>
          </div>
        </div>

        {/* Right Column: Selected Group Quick Preview Card (5 cols on lg) */}
        {selectedGroup && (
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 lg:sticky lg:top-24">
            {/* Header with Name, Member count & Info Icon */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {selectedGroup.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedGroup.members_count || 128} members
                  </p>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedGroup.route_info}
                  </span>
                </div>
              </div>

              <button
                title="Group Details"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Messages Section */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Messages
              </h4>

              <div className="space-y-2.5 min-h-[190px]">
                {selectedGroup.recent_messages && selectedGroup.recent_messages.length > 0 ? (
                  selectedGroup.recent_messages.map((msg, idx) => {
                    const isAnnouncement = msg.message_type === 'ANNOUNCEMENT';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-3 rounded-2xl text-xs transition-all ${
                          isAnnouncement
                            ? 'bg-rose-50/80 border border-rose-200/80 text-rose-900'
                            : 'bg-slate-50/80 border border-slate-200/60 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {isAnnouncement ? (
                              <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                                ⚠️
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                {msg.sender_name ? msg.sender_name.charAt(0) : 'W'}
                              </div>
                            )}
                            <span className={`font-bold ${isAnnouncement ? 'text-rose-700' : 'text-slate-900'}`}>
                              {msg.sender_name || 'Devotee'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                    <p>No recent messages yet in this group.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Big Action Button: Open Chat (Solid Orange) */}
            <div className="pt-2">
              <button
                onClick={() => onOpenChat(selectedGroup.id)}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#d94e08] hover:to-[#ea580c] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Open Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Join Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Wari Community Group</h3>
                <p className="text-xs text-slate-500 font-medium">Create a new group or join with invite</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setModalTab('create')}
                className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'create'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                + Create New Group
              </button>
              <button
                onClick={() => setModalTab('join')}
                className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'join'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Join with Group
              </button>
            </div>

            {actionSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-emerald-800">{actionSuccess}</p>
              </div>
            ) : modalTab === 'create' ? (
              <form onSubmit={handleCreateGroup} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Alandi Dindi Seva Group"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Route / Sector Description
                  </label>
                  <input
                    type="text"
                    value={newGroupRoute}
                    onChange={(e) => setNewGroupRoute(e.target.value)}
                    placeholder="e.g. Saswad Checkpoint -> Jejuri"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                      Group Privacy
                    </label>
                    <select
                      value={newGroupType}
                      onChange={(e) => setNewGroupType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                    >
                      <option value="PUBLIC">Public (Any Warkari)</option>
                      <option value="PRIVATE">Private (Invite Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                      Theme Color
                    </label>
                    <select
                      value={newGroupColor}
                      onChange={(e) => setNewGroupColor(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                    >
                      <option value="orange">Orange (Dindi)</option>
                      <option value="purple">Purple (Route)</option>
                      <option value="green">Green (Volunteer)</option>
                      <option value="rose">Rose (Medical)</option>
                      <option value="blue">Blue (Family)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Purpose & Guidelines
                  </label>
                  <textarea
                    rows={2}
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Describe group purpose, coordination rules..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Creating Group...</span>
                    </>
                  ) : (
                    <span>Create Community Group</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinByCode} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Select Group to Join
                  </label>
                  <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.group_type}) - {g.members_count} members
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Invite Code (Optional for Public)
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter 6-digit invite code for private groups"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Joining Group...</span>
                    </>
                  ) : (
                    <span>Join Group</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
