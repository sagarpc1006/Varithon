export type Language = 'en' | 'mr' | 'hi';

export type ScreenType = 'home' | 'signin';

export type PortalType = 'pilgrim' | 'volunteer' | 'admin';

export interface UserSession {
  id?: number;
  role: PortalType;
  identifier: string;
  name: string;
  email?: string;
  mobile_number?: string;
  organization?: string;
  department?: string;
  squad_id?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  is_approved?: boolean;
  has_admin_access?: boolean;
}

export interface VolunteerRequestItem {
  id: number;
  user_id: number;
  username: string;
  name: string;
  email?: string;
  mobile_number?: string;
  identifier: string;
  organization: string;
  department: string;
  squad_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_approved: boolean;
  requested_at: string;
  approved_at?: string | null;
}

export interface PalkhiLocationData {
  id: number;
  palkhi_name: string;
  palkhi_name_mr: string;
  current_stop: string;
  current_stop_mr: string;
  next_stop: string;
  next_stop_mr: string;
  latitude: number;
  longitude: number;
  status: 'LIVE' | 'HALTED' | 'NIGHT_STAY';
  distance_covered_km: number;
  total_distance_km: number;
  eta_next_stop: string;
  schedule_status: string;
  is_active: boolean;
  updated_at: string;
}

export interface SevaResourceData {
  id: number;
  name: string;
  name_mr?: string;
  category: 'MEDICAL' | 'WATER' | 'FOOD' | 'SHELTER' | 'SANITATION' | 'DUSTBIN';
  location_name: string;
  distance_meters: number;
  contact_number: string;
  is_active: boolean;
  capacity_or_supplies: string;
}

export interface GarbageDustbinData {
  id: number;
  name: string;
  name_mr?: string;
  category: 'ORGANIC_DRY' | 'PLASTIC_ONLY' | 'BIO_MEDICAL' | 'COMMUNITY_COMPACTOR';
  category_display?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity_liters: number;
  fill_level_percent: number;
  status: 'OPERATIONAL' | 'NEEDS_EMPTYING' | 'OVERFLOWING' | 'CLEANED';
  status_display?: string;
  assigned_squad: string;
  reported_overflow_count: number;
  is_active: boolean;
  last_cleaned_at: string;
  created_at: string;
  updated_at: string;
}

export interface GarbageSummaryData {
  total_count: number;
  critical_count: number;
  operational_count: number;
  avg_fill_percent: number;
  active_squads_count: number;
}

export interface CrowdDensityData {
  id: number;
  location_name: string;
  density_level: 'NORMAL' | 'MODERATE' | 'HEAVY' | 'CRITICAL';
  flow_speed: string;
  recommended_action: string;
  active_volunteers_count: number;
}

export interface EmergencyAlertData {
  id?: number;
  alert_type: string;
  caller_name: string;
  caller_phone: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  status?: string;
  priority?: string;
  dispatched_unit?: string;
  created_at?: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  category?: string;
}

export type NavTabType =
  | 'dashboard'
  | 'tracking'
  | 'seva'
  | 'groups'
  | 'ai'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'admin_overview'
  | 'admin_monitoring'
  | 'admin_volunteers'
  | 'admin_groups'
  | 'admin_announcements'
  | 'admin_reports'
  | 'admin_users'
  | 'admin_logs'
  | 'admin_settings';

export interface GroupMessageData {
  id: number;
  group: number;
  sender?: number | null;
  sender_name: string;
  sender_role: string;
  message_type: 'TEXT' | 'ANNOUNCEMENT' | 'SYSTEM' | 'IMAGE';
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  reports_count?: number;
}

export interface GroupMemberData {
  id: number;
  user: number;
  username: string;
  name: string;
  email?: string;
  mobile_number?: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joined_at: string;
  last_read_at?: string;
  is_muted?: boolean;
}

export interface MessageReportData {
  id: number;
  message: number;
  message_content: string;
  message_sender_name: string;
  group_id: number;
  group_name: string;
  reported_by: number;
  reported_by_name: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  action_taken?: string;
  created_at: string;
  resolved_at?: string;
}

export interface GroupData {
  id: number;
  name: string;
  description: string;
  group_type: 'PUBLIC' | 'PRIVATE';
  route_info: string;
  icon_color: 'orange' | 'purple' | 'green' | 'rose' | 'blue' | 'amber';
  created_by?: number;
  is_active: boolean;
  allow_member_posts: boolean;
  invite_code?: string;
  created_at: string;
  updated_at: string;
  members_count: number;
  active_members_count: number;
  messages_count: number;
  today_messages_count: number;
  reports_count: number;
  unread_count: number;
  is_member: boolean;
  my_role?: 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
  last_message?: {
    id: number;
    content: string;
    sender_name: string;
    sender_role: string;
    message_type: string;
    created_at: string;
  } | null;
  recent_messages?: Array<{
    id: number;
    content: string;
    sender_name: string;
    sender_role: string;
    message_type: string;
    created_at: string;
  }>;
}

export interface GroupStatsData {
  total_groups: number;
  total_members: number;
  active_members: number;
  pending_reports: number;
  total_messages: number;
  today_messages: number;
}

