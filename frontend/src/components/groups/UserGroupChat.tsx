import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Users,
  Paperclip,
  Send,
  UserPlus,
  Info,
  MoreVertical,
  Check,
  CheckCheck,
  AlertTriangle,
  Flag,
  X,
  Radio,
  Sparkles,
  Shield,
  PhoneCall,
  LogOut,
  Smile,
  Image as ImageIcon,
} from 'lucide-react';
import { GroupData, GroupMessageData, GroupMemberData, UserSession, Language } from '../../types';
import { groupsService } from '../../services/groups';

interface UserGroupChatProps {
  initialGroupId: number;
  session: UserSession;
  language: Language;
  onBack: () => void;
}

export const UserGroupChat: React.FC<UserGroupChatProps> = ({
  initialGroupId,
  session,
  language,
  onBack,
}) => {
  const [activeGroupId, setActiveGroupId] = useState<number>(initialGroupId);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
  const [messages, setMessages] = useState<GroupMessageData[]>([]);
  const [members, setMembers] = useState<GroupMemberData[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [onlineCount, setOnlineCount] = useState<number>(38);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Modals & Drawers
  const [showInfoDrawer, setShowInfoDrawer] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [reportModalMessage, setReportModalMessage] = useState<GroupMessageData | null>(null);
  const [reportReason, setReportReason] = useState<string>('Misleading information or spam');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [newMemberUsername, setNewMemberUsername] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<{ send: (payload: any) => void; close: () => void } | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load all groups list for sidebar
  const loadSidebarGroups = async () => {
    try {
      const res = await groupsService.getGroups();
      if (res && res.groups) {
        setGroups(res.groups);
        const current = res.groups.find((g) => g.id === activeGroupId);
        if (current) setActiveGroup(current);
      }
    } catch (err) {
      console.warn('Sidebar groups fetch notice:', err);
    }
  };

  // Load messages and members for active group
  const loadGroupData = async (groupId: number) => {
    setLoading(true);
    try {
      const [grpRes, msgRes, memRes] = await Promise.all([
        groupsService.getGroup(groupId),
        groupsService.getMessages(groupId),
        groupsService.getMembers(groupId),
      ]);
      if (grpRes) setActiveGroup(grpRes);
      if (msgRes && msgRes.messages) setMessages(msgRes.messages);
      if (memRes && memRes.members) setMembers(memRes.members);
      setOnlineCount(grpRes ? grpRes.active_members_count || 38 : 38);
    } catch (err) {
      console.warn('Group data fetch notice:', err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    loadSidebarGroups();
  }, []);

  useEffect(() => {
    loadGroupData(activeGroupId);

    // Setup real-time WebSocket connection for active group
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = groupsService.createWebSocketConnection(activeGroupId, (event) => {
      if (event.type === 'new_message' && event.message) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });
        setTimeout(scrollToBottom, 100);
      } else if (event.type === 'message_deleted') {
        setMessages((prev) => prev.filter((m) => m.id !== event.message_id));
      } else if (event.type === 'pin_update') {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.message_id ? { ...m, is_pinned: event.is_pinned } : m))
        );
      }
    });

    wsRef.current = ws;
    setWsConnected(true);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeGroupId]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');

    // Optimistic UI message
    const tempId = Date.now();
    const optimisticMsg: GroupMessageData = {
      id: tempId,
      group: activeGroupId,
      sender: session.id || 1,
      sender_name: session.name || 'You',
      sender_role: session.role || 'pilgrim',
      message_type: 'TEXT',
      content: text,
      is_pinned: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      // Send via REST API (which also broadcasts to WebSockets)
      const res = await groupsService.sendMessage(activeGroupId, {
        content: text,
        sender_name: session.name,
        sender_role: session.role,
        message_type: 'TEXT',
      });

      if (res && res.data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
      }
    } catch (err) {
      console.warn('Message send fallback:', err);
    }
  };

  // Handle Report Message
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalMessage) return;

    try {
      await groupsService.reportMessage(activeGroupId, reportModalMessage.id, reportReason);
      setReportSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setReportModalMessage(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  // Handle Leave Group
  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await groupsService.leaveGroup(activeGroupId);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to leave group');
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

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'green':
        return 'bg-emerald-100 text-emerald-600';
      case 'rose':
        return 'bg-rose-100 text-rose-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'orange':
      default:
        return 'bg-orange-100 text-orange-600';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[580px] relative">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Active Group Avatar & Info */}
          {activeGroup && (
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl ${getColorClasses(
                  activeGroup.icon_color
                )} flex items-center justify-center shrink-0 shadow-xs`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {activeGroup.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{activeGroup.members_count || 128} members</span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online: {onlineCount}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Header Action Icons matching visual preview */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowAddMemberModal(true)}
            title="Add Member"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInfoDrawer(true)}
            title="Group Information"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More Options"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => {
                    setShowInfoDrawer(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Group Details</span>
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Group</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body: Left 'My Groups' Sidebar + Right Chat Stream */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: 'My Groups' (Hidden on small mobile when chatting) */}
        <div className="w-72 sm:w-80 border-r border-slate-200 bg-[#faf7f2]/70 hidden md:flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              My Groups
            </h3>
            <button
              onClick={onBack}
              title="Browse All Groups"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Group Chat List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {groups.map((grp) => {
              const isActive = grp.id === activeGroupId;
              const colorInfo = getColorClasses(grp.icon_color);
              const unread = grp.unread_count || 0;
              const lastSnippet = grp.last_message
                ? `${grp.last_message.sender_name}: ${grp.last_message.content}`
                : grp.route_info;

              return (
                <div
                  key={grp.id}
                  onClick={() => setActiveGroupId(grp.id)}
                  className={`p-3 sm:p-3.5 flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white border-l-4 border-orange-500 shadow-xs'
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl ${colorInfo} flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Users className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {grp.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {grp.last_message
                          ? formatMessageTime(grp.last_message.created_at)
                          : '10:30 AM'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                      {lastSnippet}
                    </p>
                  </div>

                  {unread > 0 && (
                    <div className="w-4.5 h-4.5 rounded-full bg-rose-600 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0 shadow-xs">
                      {unread}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Conversation Area */}
        <div className="flex-1 flex flex-col bg-[#fdfbf7] overflow-hidden">
          {/* Messages Scroll Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
                <Users className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-semibold">No messages yet. Say Jai Hari Vitthal! 🙏</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser =
                  msg.sender_name === session.name ||
                  msg.sender === session.id ||
                  (session.role === 'pilgrim' && msg.sender_role === 'pilgrim' && msg.sender_name === 'Yashraj');
                const isAnnouncement = msg.message_type === 'ANNOUNCEMENT';
                const isSystem = msg.message_type === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-3 py-1 bg-slate-200/70 text-slate-600 rounded-full text-[11px] font-semibold">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Official Admin Announcement Bubble (Red/Orange alert box)
                if (isAnnouncement) {
                  return (
                    <div key={msg.id} className="flex items-start gap-2.5 max-w-xl group">
                      {/* Red/Alert Avatar */}
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs mt-0.5">
                        ⚠️
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-rose-700">
                            {msg.sender_name || 'Admin'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatMessageTime(msg.created_at)}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase">
                            Announcement
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl rounded-tl-xs bg-rose-50 border border-rose-200/90 text-rose-950 text-xs sm:text-sm font-medium leading-relaxed shadow-xs">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Outgoing Current User Message Bubble (Greenish/Orange tint, right aligned)
                if (isCurrentUser) {
                  return (
                    <div key={msg.id} className="flex flex-col items-end group">
                      <div className="max-w-md sm:max-w-lg p-3.5 rounded-2xl rounded-tr-xs bg-[#e2f3df] sm:bg-[#d8edd4] text-slate-900 border border-emerald-200/70 text-xs sm:text-sm leading-relaxed shadow-xs space-y-1">
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium pt-0.5">
                          <span>{formatMessageTime(msg.created_at)}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Incoming Devotee Message Bubble (Left aligned with avatar)
                return (
                  <div key={msg.id} className="flex items-start gap-2.5 max-w-md sm:max-w-lg group">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-xs mt-0.5">
                      {msg.sender_name ? msg.sender_name.charAt(0) : 'W'}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-slate-900">
                            {msg.sender_name || 'Devotee'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </div>

                        {/* Report button on hover */}
                        <button
                          onClick={() => setReportModalMessage(msg)}
                          title="Report this message"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white text-slate-900 border border-slate-200/80 text-xs sm:text-sm leading-relaxed shadow-xs">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Attachment Icon */}
              <button
                type="button"
                title="Attach photo or location"
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Input Text Box */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />

              {/* Orange Send Button matching preview */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Group Info Drawer */}
      {showInfoDrawer && activeGroup && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">Group Info</h3>
                <button
                  onClick={() => setShowInfoDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-2">
                <div
                  className={`w-16 h-16 rounded-3xl ${getColorClasses(
                    activeGroup.icon_color
                  )} flex items-center justify-center mx-auto shadow-sm`}
                >
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{activeGroup.name}</h4>
                <p className="text-xs text-slate-500">{activeGroup.route_info}</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeGroup.group_type} Group
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Group Members ({members.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {mem.name ? mem.name.charAt(0) : 'W'}
                        </div>
                        <span className="font-bold text-slate-800">{mem.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 capitalize">
                        {mem.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleLeaveGroup}
                className="w-full py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Message Modal */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 relative">
            <button
              onClick={() => setReportModalMessage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Report Message</h3>
                <p className="text-xs text-slate-500">Flag inappropriate or misleading info</p>
              </div>
            </div>

            {reportSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-center space-y-1">
                <p className="text-sm font-bold text-emerald-800">Report submitted!</p>
                <p className="text-xs text-emerald-600">Admin moderation team will review this shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5">
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200 italic">
                  "{reportModalMessage.content}"
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase mb-1 block">
                    Reason for report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none"
                  >
                    <option value="Misleading route / checkpoint info">Misleading route / checkpoint info</option>
                    <option value="Spam / Advertisements">Spam / Advertisements</option>
                    <option value="Abusive or inappropriate content">Abusive or inappropriate content</option>
                    <option value="False emergency report">False emergency report</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                >
                  Submit Report to Admin
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
