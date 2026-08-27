import { api } from './api';
import {
  PalkhiLocationData,
  SevaResourceData,
  CrowdDensityData,
  EmergencyAlertData,
  Language,
} from '../types';

export interface DashboardOverviewResponse {
  palkhi: PalkhiLocationData | null;
  pending_alerts_count: number;
  nearest_medical: SevaResourceData | null;
  nearest_water: SevaResourceData | null;
  crowd_status: CrowdDensityData | null;
  system_status: string;
}

export interface PalkhiResponse {
  primary_palkhi: PalkhiLocationData | null;
  all_palkhis: PalkhiLocationData[];
}

export interface ResourcesResponse {
  resources: SevaResourceData[];
}

export interface CrowdResponse {
  crowd_status: CrowdDensityData[];
}

export interface SOSResponse {
  message: string;
  alert: EmergencyAlertData;
  emergency_contact: string;
}

export interface AIChatResponse {
  reply: string;
  category: string;
  timestamp: string;
}

export const wariService = {
  // 1. Live Palkhi Location & Route Telemetry
  async getPalkhiLocations(): Promise<PalkhiResponse> {
    return api.get<PalkhiResponse>('/maps/palkhi/');
  },

  // 2. Dashboard Aggregated Data
  async getDashboardOverview(): Promise<DashboardOverviewResponse> {
    return api.get<DashboardOverviewResponse>('/dashboard/overview/');
  },

  // 3. Seva Resources (Medical, Water, Food, Shelter, Sanitation)
  async getResources(category?: string): Promise<SevaResourceData[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await api.get<ResourcesResponse>(`/resources/${query}`);
    return res.resources || [];
  },

  // 4. Crowd Density & Bottleneck Alerts
  async getCrowdDensity(): Promise<CrowdDensityData[]> {
    const res = await api.get<CrowdResponse>('/crowdflow/');
    return res.crowd_status || [];
  },

  // 5. Emergency SOS Trigger
  async triggerSOS(data: {
    alert_type: string;
    caller_name: string;
    caller_phone: string;
    location_name: string;
    description?: string;
  }): Promise<SOSResponse> {
    return api.post<SOSResponse>('/sos/', data);
  },

  // 6. Multilingual AI Assistant Chat
  async sendAIChatMessage(
    message: string,
    language: Language,
    userName?: string
  ): Promise<AIChatResponse> {
    return api.post<AIChatResponse>('/ai/chat/', {
      message,
      language,
      user_name: userName || '',
    });
  },
};
