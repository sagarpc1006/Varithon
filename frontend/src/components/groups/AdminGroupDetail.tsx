import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Send,
  Pin,
  Trash2,
  AlertTriangle,
  Download,
  UserPlus,
  Shield,
  CheckCircle2,
  X,
  Radio,
  Clock,
  MessageSquare,
  Flag,
  Settings,
  Bell,
  Check,
  Ban,
} from 'lucide-react';
import {
  GroupData,
  GroupMessageData,
  GroupMemberData,
  MessageReportData,
  UserSession,
  Language,
} from '../../types';
import { groupsService } from '../../services/groups';

interface AdminGroupDetailProps {
  groupId: number;
  session: UserSession;
  language: Language;
  onBack: () => void;
}

export const AdminGroupDetail: React.FC<AdminGroupDetailProps> = ({
  groupId,
  session,
  language,
  onBack,
}) => {
  const [group, setGroup] = useState<GroupData | null>(null);
  const [messages, setMessages] = useState<GroupMessageData[]>([]);
  const [members, setMembers] = useState<GroupMemberData[]>([]);
  const [reports, setReports] = useState<MessageReportData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'messages' | 'reports' | 'settings'>('messages');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Action States
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberUserId, setNewMemberUserId] = useState<number>(1);
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MODERATOR' | 'MEMBER'>('MEMBER');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Group settings form
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editRoute, setEditRoute] = useState<string>('');
  const [editAllowPosts, setEditAllowPosts] = useState<boolean>(true);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const [grpRes, msgRes, memRes, repRes] = await Promise.all([
        groupsService.getGroup(groupId),
        groupsService.getMessages(groupId),
        groupsService.getMembers(groupId),
        groupsService.getAdminReports(groupId),
      ]);
      if (grpRes) {
        setGroup(grpRes);
        setEditName(grpRes.name);
        setEditDesc(grpRes.description);
        setEditRoute(grpRes.route_info);
        setEditAllowPosts(grpRes.allow_member_posts);
      }
      if (msgRes && msgRes.messages) setMessages(msgRes.messages);
      if (memRes && memRes.members) setMembers(memRes.members);
      if (repRes && repRes.reports) setReports(repRes.reports);
    } catch (err) {
      console.warn('Admin group detail fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [groupId]);

  // Send Announcement
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setIsSubmitting(true);
    try {
      await groupsService.sendAnnouncement(groupId, announcementText.trim(), session.name || 'Admin');
      setActionSuccess('Official Announcement Dispatched & Pinned!');
      setAnnouncementText('');
      setTimeout(() => {
        setActionSuccess(null);
        setShowAnnouncementModal(false);
        fetchDetailData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pin / Unpin Message
  const handleTogglePin = async (messageId: number, currentPinned: boolean) => {
    try {
      await groupsService.togglePinMessage(groupId, messageId, !currentPinned);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: !currentPinned } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle pin');
    }
  };

  // Delete Message
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await groupsService.deleteMessage(groupId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete message');
    }
  };

  // Export Chat
  const handleExportChat = () => {
    const exportContent = messages
      .map(
        (m) =>
          `[${m.created_at}] ${m.sender_name} (${m.message_type}): ${m.content}`
      )
      .join('\n');
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group?.name || 'group'}_chat_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Deactivate Group
  const handleDeactivateGroup = async () => {
    if (!confirm(`Are you sure you want to deactivate ${group?.name}?`)) return;
    try {
      await groupsService.deleteGroup(groupId);
      alert('Group deactivated successfully.');
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate group');
    }
  };

  // Resolve Report
  const handleResolveReport = async (
    reportId: number,
    action: 'resolve' | 'dismiss' | 'delete_message'
  ) => {
    try {
      await groupsService.resolveAdminReport(reportId, action);
      fetchDetailData();
    } catch (err: any) {
      alert(err.message || 'Failed to process report');
    }
  };

  // Update Member Role
  const handleUpdateRole = async (userId: number, role: 'ADMIN' | 'MODERATOR' | 'MEMBER') => {
    try {
      await groupsService.updateMemberRole(groupId, userId, role);
      setMembers((prev) =>
        prev.map((m) => (m.user === userId ? { ...m, role } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member from group?')) return;
    try {
      await groupsService.removeMember(groupId, userId);
      setMembers((prev) => prev.filter((m) => m.user !== userId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await groupsService.updateGroup(groupId, {
        name: editName,
        description: editDesc,
        route_info: editRoute,
        allow_member_posts: editAllowPosts,
      });
      alert('Group settings saved successfully.');
      fetchDetailData();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
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
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Groups</span>
      </button>

      {/* Group Header Banner matching preview */}
      {group && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{group.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {group.group_type} Group • {group.members_count || 128} Members • Created on{' '}
                {new Date(group.created_at).toLocaleDateString([], {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm font-bold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: `Members (${members.length || group?.members_count || 128})` },
          { id: 'messages', label: `Messages (${messages.length || group?.messages_count || 542})` },
          { id: 'reports', label: `Reports (${reports.length || group?.reports_count || 0})` },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-orange-50/80 text-orange-700 border-b-2 border-orange-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Tab Content (8 cols) + Right Actions & Stats (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tab Views */}
        <div className="lg:col-span-8 space-y-4">
          {/* TAB 1: MESSAGES (MATCHING PREVIEW IMAGE) */}
          {activeTab === 'messages' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Message Moderation Feed
                </h3>
                <span className="text-xs text-slate-500">{messages.length} messages loaded</span>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading conversation stream...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">No messages in this group.</div>
                ) : (
                  messages.map((msg) => {
                    const isAnnouncement = msg.message_type === 'ANNOUNCEMENT';
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isAnnouncement
                            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                            : 'bg-slate-50/80 border-slate-200/90 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {isAnnouncement ? (
                              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                                ⚠️
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {msg.sender_name ? msg.sender_name.charAt(0) : 'W'}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs sm:text-sm font-black ${
                                    isAnnouncement ? 'text-rose-700' : 'text-slate-900'
                                  }`}
                                >
                                  {msg.sender_name || 'Devotee'}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {msg.is_pinned && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                                    Pinned
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm mt-1 leading-relaxed text-slate-700">
                                {msg.content}
                              </p>
                            </div>
                          </div>

                          {/* Admin Moderation Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                              title={msg.is_pinned ? 'Unpin message' : 'Pin message'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                msg.is_pinned
                                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete message"
                              className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Group Members ({members.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {members.map((mem) => (
                  <div
                    key={mem.id}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                        {mem.name ? mem.name.charAt(0) : 'W'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{mem.name}</p>
                        <p className="text-[11px] text-slate-500">{mem.mobile_number || mem.email || mem.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={mem.role}
                        onChange={(e) => handleUpdateRole(mem.user, e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-bold focus:bg-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Group Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(mem.user)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Flagged Messages & Reports Queue
                </h3>
              </div>

              {reports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800">No pending reports for this group!</p>
                  <p className="text-xs text-slate-500">All messages comply with Wari community guidelines.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 text-xs sm:text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Reason: {rep.reason}
                          </span>
                          <span className="text-slate-500 text-xs">
                            Reported by: <strong className="text-slate-800">{rep.reported_by_name}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(rep.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-rose-200/70 text-slate-700 italic">
                        "{rep.message_content}"
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'delete_message')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Delete Reported Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OVERVIEW */}
          {activeTab === 'overview' && group && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-xs sm:text-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Group Overview & Route Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 text-[11px] uppercase font-bold">Route Path</p>
                  <p className="text-slate-900 font-bold mt-1">{group.route_info}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 text-[11px] uppercase font-bold">Privacy Level</p>
                  <p className="text-slate-900 font-bold mt-1">{group.group_type} Group</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Description</p>
                <p className="text-slate-700 leading-relaxed">{group.description}</p>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Group Configuration Settings
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Route Information
                  </label>
                  <input
                    type="text"
                    value={editRoute}
                    onChange={(e) => setEditRoute(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="allowPosts"
                    checked={editAllowPosts}
                    onChange={(e) => setEditAllowPosts(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="allowPosts" className="text-slate-700 font-bold">
                    Allow all members to post messages
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-orange-600/20"
                >
                  Save Group Settings
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Group Actions & Group Statistics matching preview */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Group Actions matching preview layout */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Group Actions
            </h3>

            {/* 1. Send Announcement */}
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Announcement</span>
            </button>

            {/* 2. Pin Message */}
            <button
              onClick={() => {
                setActiveTab('messages');
                alert('Click the Pin icon next to any message in the feed to pin it.');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-orange-50/80 text-slate-700 hover:text-orange-900 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Pin className="w-4 h-4" />
              <span>Pin Message</span>
            </button>

            {/* 3. Add Members */}
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-orange-50/80 text-slate-700 hover:text-orange-900 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Members</span>
            </button>

            {/* 4. Export Chat */}
            <button
              onClick={handleExportChat}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-orange-50/80 text-slate-700 hover:text-orange-900 font-bold text-xs sm:text-sm border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Chat</span>
            </button>

            {/* 5. Deactivate Group (Red Outline) */}
            <button
              onClick={handleDeactivateGroup}
              className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              <span>Deactivate Group</span>
            </button>
          </div>

          {/* Card 2: Group Statistics matching preview layout */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Group Statistics
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm font-medium">
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Messages</span>
                <span className="font-bold text-slate-900">{group?.messages_count || 542}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Today's Messages</span>
                <span className="font-bold text-slate-900">{group?.today_messages_count || 68}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Active Members</span>
                <span className="font-bold text-emerald-600">
                  {group?.active_members_count || 38}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Reports</span>
                <span
                  className={`font-bold ${
                    reports.length > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  {reports.length || group?.reports_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Official Admin Announcement</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Broadcasts instant pinned alert to all members
                </p>
              </div>
            </div>

            {actionSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-emerald-800">{actionSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendAnnouncement} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Announcement Message *
                  </label>
                  <textarea
                    rows={4}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. ⚠️ Route temporarily crowded. Please stay on the left side..."
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                  ⚡ Announcements appear with prominent alert styling and are automatically pinned to the group top.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <span>Broadcast Announcement Now</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black mb-3 text-slate-900">Add Group Member</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await groupsService.addMember(groupId, newMemberUserId, newMemberRole);
                  alert('Member added successfully!');
                  setShowAddMemberModal(false);
                  fetchDetailData();
                } catch (err: any) {
                  alert(err.message || 'Failed to add member');
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  Select User / Devotee
                </label>
                <select
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                >
                  <option value={1}>Warkari Devotee #1 (Rahul Kulkarni)</option>
                  <option value={2}>Warkari Devotee #2 (Priya Patil)</option>
                  <option value={3}>Warkari Devotee #3 (Ramesh Shinde)</option>
                  <option value={4}>Warkari Devotee #4 (Sunil Jadhav)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                  Role Assignment
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-orange-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Group Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/25 cursor-pointer"
              >
                Add to Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
