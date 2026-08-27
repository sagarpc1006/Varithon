export type Language = 'en' | 'mr' | 'hi';

export type ScreenType = 'home' | 'signin';

export type PortalType = 'pilgrim' | 'admin';

export interface UserSession {
  id?: number;
  role: PortalType;
  identifier: string;
  name: string;
  email?: string;
  mobile_number?: string;
  organization?: string;
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
  category: 'MEDICAL' | 'WATER' | 'FOOD' | 'SHELTER' | 'SANITATION';
  location_name: string;
  distance_meters: number;
  contact_number: string;
  is_active: boolean;
  capacity_or_supplies: string;
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
