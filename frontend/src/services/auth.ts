import { api } from './api';
import { PortalType, UserSession } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
} from './firebase';

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
  // 1. Standard Login (Mobile Number or Email + Password)
  async login(identifier: string, password: string, role: PortalType): Promise<UserSession> {
    // Firebase owns email/password accounts; phone-based accounts remain Django-authenticated.
    if (identifier.includes('@')) {
      return this.firebaseEmailLogin(identifier, password, role);
    }
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

  // 2. Register New User (Pilgrim with Mobile Number or Admin with Email)
  async register(
    name: string,
    identifier: string,
    password: string,
    role: PortalType,
    organization?: string
  ): Promise<UserSession> {
    // If identifier is an email address, try creating account in Firebase Auth as well
    if (identifier.includes('@')) {
      try {
        await createUserWithEmailAndPassword(auth, identifier.trim(), password);
      } catch (fbErr: any) {
        console.warn('Firebase createUser note (handled gracefully):', fbErr?.code || fbErr?.message);
      }
    }

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

  // 3. Google Sign-In with Firebase Authentication (with robust fallback)
  async googleLogin(role: PortalType, email?: string, name?: string): Promise<UserSession> {
    try {
      // Step A: Attempt Firebase Google Sign-In popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Step B: Synchronize with Django backend via /auth/firebase-login/
      const res = await api.post<LoginResponse>('/auth/firebase-login/', {
        email: user.email || email || `${user.uid}@varimitra.org`,
        name: user.displayName || name || (role === 'pilgrim' ? 'Warkari Devotee' : 'Seva Team Officer'),
        uid: user.uid,
        role: role,
        phone_number: user.phoneNumber || '',
        photo_url: user.photoURL || '',
        id_token: idToken,
      });

      if (res && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
      throw new Error('Firebase session exchange failed with backend.');
    } catch (error: any) {
      const errCode = error?.code || '';
      const errMsg = error?.message || '';

      // Do not silently fall back to the legacy Django Google endpoint. It
      // bypasses Firebase account selection and conceals configuration errors.
      if (
        errCode === 'auth/configuration-not-found' ||
        errCode === 'auth/operation-not-allowed' ||
        errCode === 'auth/unauthorized-domain' ||
        errMsg.includes('configuration-not-found') ||
        errMsg.includes('operation-not-allowed')
      ) {
        throw new Error(
          `Firebase Google sign-in is unavailable (${errCode || errMsg}). ` +
          'Enable the Google provider and authorize this domain in Firebase Console.'
        );
      }

      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        throw new Error('Google Sign-In was cancelled.');
      }
      if (errCode === 'auth/popup-blocked') {
        throw new Error('Google Sign-In popup was blocked by browser. Please enable popups for this site.');
      }

      // Bubble up backend role mismatches or custom errors
      if (error?.response?.data?.error) {
        const customErr: any = new Error(error.response.data.error);
        customErr.code = error.response.data.code;
        customErr.data = error.response.data;
        throw customErr;
      }
      if (error?.message) {
        throw error;
      }
      throw new Error('Google authentication failed. Please try again.');
    }
  },

  // 4. Firebase Email/Password Login
  async firebaseEmailLogin(email: string, password: string, role: PortalType): Promise<UserSession> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const res = await api.post<LoginResponse>('/auth/firebase-login/', {
        email: user.email || email,
        name: user.displayName || email.split('@')[0],
        uid: user.uid,
        role: role,
        id_token: idToken,
      });

      if (res && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
      throw new Error('Authentication failed.');
    } catch (err: any) {
      // Do not fall back to legacy credentials: Firebase is the authority for
      // email/password accounts and role approval must be enforced server-side.
      throw err;
    }
  },

  // 5. Forgot Password (supports Firebase Reset Email & OTP)
  async forgotPassword(identifier: string, role: PortalType): Promise<ForgotPasswordResponse> {
    if (identifier.includes('@')) {
      try {
        await sendPasswordResetEmail(auth, identifier.trim());
      } catch (fbErr: any) {
        console.warn('Firebase sendPasswordResetEmail note:', fbErr?.code || fbErr?.message);
      }
    }

    return api.post<ForgotPasswordResponse>('/auth/forgot-password/', {
      identifier,
      role,
    });
  },

  // 6. Reset Password with OTP/Code
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password/', {
      identifier,
      otp,
      new_password: newPassword,
    });
  },

  // 7. Check Current Session / Me
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

  // 8. Update Profile
  async updateProfile(data: Partial<UserSession> & { dindi_number?: string; emergency_contact?: string }): Promise<UserSession> {
    const res = await api.patch<{ message: string; session: UserSession }>('/auth/me/', data);
    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Failed to update profile.');
  },

  // 9. Volunteer Access Request & Approval Workflow
  async requestVolunteerAccess(
    name: string,
    identifier: string,
    password: string,
    organization?: string,
    department?: string,
    squad_id?: string
  ): Promise<{ message: string; status: string; request: any }> {
    return api.post('/auth/volunteer-request/', {
      name,
      identifier,
      password,
      organization: organization || 'Pandharpur Wari Seva Mandal',
      department: department || 'Food & Annachatra Seva',
      squad_id: squad_id || 'SQD-FOOD-101',
    });
  },

  async checkVolunteerStatus(identifier: string): Promise<{
    exists: boolean;
    is_approved: boolean;
    approval_status: string;
    session?: UserSession;
    name?: string;
    department?: string;
  }> {
    return api.get(`/auth/volunteer-status/?identifier=${encodeURIComponent(identifier)}`);
  },

  async getVolunteerRequests(): Promise<{
    pending_count: number;
    total_count: number;
    requests: any[];
  }> {
    return api.get('/auth/admin/volunteer-requests/');
  },

  async approveVolunteerRequest(userId: number): Promise<{ message: string; approval_status: string; is_approved: boolean }> {
    return api.post(`/auth/admin/volunteer-requests/${userId}/approve/`, {});
  },

  async rejectVolunteerRequest(userId: number): Promise<{ message: string; approval_status: string; is_approved: boolean }> {
    return api.post(`/auth/admin/volunteer-requests/${userId}/reject/`, {});
  },

  // 10. Logout (Clears both Firebase Auth & Django Session)
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }

    try {
      await api.post('/auth/logout/');
    } catch (e) {
      console.warn('Backend logout note:', e);
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
