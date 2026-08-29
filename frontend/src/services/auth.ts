import { api } from './api';
import { PortalType, UserSession } from '../types';

const SESSION_KEY = 'varimitra_user_session';

export interface LoginResponse {
  message: string;
  session: UserSession;
}

export interface RegisterResponse {
  message: string;
  session: UserSession;
}

export interface ForgotPasswordResponse {
  message: string;
  demo_otp?: string;
  identifier: string;
}

export const authService = {
  // 1. Sign In
  async login(identifier: string, password: string, role: PortalType): Promise<UserSession> {
    const res = await api.post<LoginResponse>('/auth/login/', {
      identifier,
      password,
      role,
    });
    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Authentication failed: No session returned.');
  },

  // 2. Register
  async register(
    name: string,
    identifier: string,
    password: string,
    role: PortalType,
    organization?: string
  ): Promise<UserSession> {
    const res = await api.post<RegisterResponse>('/auth/register/', {
      name,
      identifier,
      password,
      role,
      organization,
    });
    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Registration failed: No session returned.');
  },

  // 3. Google Sign In
  async googleLogin(role: PortalType, email?: string, name?: string): Promise<UserSession> {
    const res = await api.post<LoginResponse>('/auth/google/', {
      role,
      email: email || (role === 'pilgrim' ? 'warkari.bhakt@varimitra.org' : 'seva.officer@varimitra.org'),
      name: name || (role === 'pilgrim' ? 'Warkari Devotee' : 'Seva Team Officer'),
    });
    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Google Sign-In failed.');
  },

  // 4. Forgot Password
  async forgotPassword(identifier: string, role: PortalType): Promise<ForgotPasswordResponse> {
    return api.post<ForgotPasswordResponse>('/auth/forgot-password/', {
      identifier,
      role,
    });
  },

  // 5. Reset Password
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password/', {
      identifier,
      otp,
      new_password: newPassword,
    });
  },

  // 6. Check Current Session / Me
  async getProfile(): Promise<UserSession | null> {
    try {
      const res = await api.get<{ authenticated: boolean; session: UserSession | null }>('/auth/me/');
      if (res.authenticated && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
    } catch {
      // Return cached session if offline
    }
    return this.getStoredSession();
  },

  // 7. Update Profile
  async updateProfile(data: Partial<UserSession> & { dindi_number?: string; emergency_contact?: string }): Promise<UserSession> {
    const res = await api.patch<{ message: string; session: UserSession }>('/auth/me/', data);
    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Failed to update profile.');
  },

  // 8. Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      this.clearSession();
    }
  },

  // Session Storage Management
  getStoredSession(): UserSession | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveSession(session: UserSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear session from localStorage:', e);
    }
  },
};
