import { apiService } from './api';
import {
  GroupData,
  GroupMemberData,
  GroupMessageData,
  MessageReportData,
  GroupStatsData,
} from '../types';

export const groupsService = {
  // 1. Groups listing and filtering
  async getGroups(query?: string, filter?: string): Promise<{ count: number; groups: GroupData[] }> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filter && filter !== 'all') params.append('filter', filter);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiService.get<{ count: number; groups: GroupData[] }>(`/groups/${queryString}`);
  },

  // 2. Single group details
  async getGroup(id: number): Promise<GroupData> {
    return apiService.get<GroupData>(`/groups/${id}/`);
  },

  // 3. Create group
  async createGroup(payload: {
    name: string;
    description?: string;
    group_type?: 'PUBLIC' | 'PRIVATE';
    route_info?: string;
    icon_color?: string;
  }): Promise<{ message: string; group: GroupData }> {
    return apiService.post<{ message: string; group: GroupData }>('/groups/', payload);
  },

  // 4. Update group
  async updateGroup(id: number, payload: Partial<GroupData>): Promise<{ message: string; group: GroupData }> {
    return apiService.patch<{ message: string; group: GroupData }>(`/groups/${id}/`, payload);
  },

  // 5. Deactivate / Delete group
  async deleteGroup(id: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/groups/${id}/`);
  },

  // 6. Join or Leave group
  async joinGroup(id: number): Promise<{ message: string; is_member: boolean }> {
    return apiService.post<{ message: string; is_member: boolean }>(`/groups/${id}/join/`, { action: 'join' });
  },

  async leaveGroup(id: number): Promise<{ message: string; is_member: boolean }> {
    return apiService.post<{ message: string; is_member: boolean }>(`/groups/${id}/join/`, { action: 'leave' });
  },

  // 7. Messages
  async getMessages(groupId: number): Promise<{ group_id: number; group_name: string; messages: GroupMessageData[] }> {
    return apiService.get<{ group_id: number; group_name: string; messages: GroupMessageData[] }>(`/groups/${groupId}/messages/`);
  },

  async sendMessage(groupId: number, payload: {
    content: string;
    sender_name?: string;
    sender_role?: string;
    message_type?: string;
  }): Promise<{ message: string; data: GroupMessageData }> {
    return apiService.post<{ message: string; data: GroupMessageData }>(`/groups/${groupId}/messages/`, payload);
  },

  // 8. Admin Announcement
  async sendAnnouncement(groupId: number, content: string, senderName: string = 'Admin'): Promise<{ message: string; data: GroupMessageData }> {
    return apiService.post<{ message: string; data: GroupMessageData }>(`/groups/${groupId}/announcements/`, {
      content,
      sender_name: senderName,
    });
  },

  // 9. Pin / Delete / Report
  async togglePinMessage(groupId: number, messageId: number, isPinned: boolean): Promise<{ message: string; is_pinned: boolean }> {
    return apiService.patch<{ message: string; is_pinned: boolean }>(`/groups/${groupId}/messages/${messageId}/`, {
      is_pinned: isPinned,
    });
  },

  async deleteMessage(groupId: number, messageId: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/groups/${groupId}/messages/${messageId}/`);
  },

  async reportMessage(groupId: number, messageId: number, reason: string): Promise<{ message: string; report: MessageReportData }> {
    return apiService.post<{ message: string; report: MessageReportData }>(`/groups/${groupId}/messages/${messageId}/report/`, {
      reason,
    });
  },

  // 10. Members
  async getMembers(groupId: number): Promise<{ group_id: number; count: number; members: GroupMemberData[] }> {
    return apiService.get<{ group_id: number; count: number; members: GroupMemberData[] }>(`/groups/${groupId}/members/`);
  },

  async addMember(groupId: number, userId: number, role: 'ADMIN' | 'MODERATOR' | 'MEMBER' = 'MEMBER'): Promise<{ message: string; member: GroupMemberData }> {
    return apiService.post<{ message: string; member: GroupMemberData }>(`/groups/${groupId}/members/`, {
      user_id: userId,
      role,
    });
  },

  async updateMemberRole(groupId: number, userId: number, role: 'ADMIN' | 'MODERATOR' | 'MEMBER'): Promise<{ message: string; member: GroupMemberData }> {
    return apiService.patch<{ message: string; member: GroupMemberData }>(`/groups/${groupId}/members/${userId}/`, {
      role,
    });
  },

  async removeMember(groupId: number, userId: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/groups/${groupId}/members/${userId}/`);
  },

  // 11. Admin Stats & Reports
  async getAdminStats(): Promise<GroupStatsData> {
    return apiService.get<GroupStatsData>('/admin/groups/stats/');
  },

  async getAdminReports(groupId?: number): Promise<{ total_reports: number; reports: MessageReportData[] }> {
    const query = groupId ? `?group_id=${groupId}` : '';
    return apiService.get<{ total_reports: number; reports: MessageReportData[] }>(`/admin/groups/reports/${query}`);
  },

  async resolveAdminReport(
    reportId: number,
    action: 'resolve' | 'dismiss' | 'delete_message',
    actionTaken?: string
  ): Promise<{ message: string; report: MessageReportData }> {
    return apiService.post<{ message: string; report: MessageReportData }>(`/admin/groups/reports/${reportId}/`, {
      action,
      action_taken: actionTaken,
    });
  },

  // 12. WebSocket real-time connection helper
  createWebSocketConnection(groupId: number, onMessage: (event: any) => void): {
    send: (payload: any) => void;
    close: () => void;
  } {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Django backend runs on 8000
    const wsUrl = `${protocol}//${host}:8000/ws/groups/${groupId}/`;

    let ws: WebSocket | null = null;
    let isClosed = false;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMessage(data);
        } catch (err) {
          console.warn('WS parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('WS connection notice:', e);
      };

      ws.onclose = () => {
        if (!isClosed) {
          // Reconnect attempt after 3 seconds
          setTimeout(() => {
            if (!isClosed) {
              this.createWebSocketConnection(groupId, onMessage);
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('WebSocket init exception:', err);
    }

    return {
      send: (payload: any) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      },
      close: () => {
        isClosed = true;
        if (ws) {
          ws.close();
        }
      },
    };
  },
};
