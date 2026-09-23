import { api } from './api';
import { PortalType, UserSession } from '../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  firebaseSignOut,
  type FirebaseUser,
} from './firebase';

const SESSION_KEY = 'varimitra_user_session';

export interface LoginResponse {
  message: string;
  session: UserSession;
  status?: string;
  code?: string;
}

export interface RegisterResponse {
  message: string;
  session: UserSession;
  status?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  demo_otp?: string;
  identifier: string;
}

/**
 * Human-readable mapping for Firebase Authentication error codes.
 */
export function mapFirebaseError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid credentials. Please verify your password.';
    case 'auth/user-not-found':
      return 'No registered account found with these credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email or mobile number already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the administrator.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google Sign-In was cancelled.';
    case 'auth/popup-blocked':
      return 'Google Sign-In popup was blocked by browser. Please enable popups.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Please enable Email/Password or Google in Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console. Please add localhost to Authorized Domains.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Normalizes user input (email or 10-digit mobile number) to Firebase Email Auth identity format.
 */
export function identifierToEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const cleanDigits = trimmed.replace(/\D/g, '');
  return `${cleanDigits || trimmed}@varimitra.org`;
}

export const authService = {
  // 1. Firebase Email/Password Sign-In
  async login(identifier: string, password: string, role: PortalType): Promise<UserSession> {
    const email = identifierToEmail(identifier);
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (fbErr: any) {
      const friendlyMsg = mapFirebaseError(fbErr);
      const customErr: any = new Error(friendlyMsg);
      customErr.code = fbErr?.code;
      throw customErr;
    }

    const firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken();

    // Synchronize verified ID token with Django backend
    try {
      const res = await api.post<LoginResponse>('/auth/firebase/', {
        id_token: idToken,
        role: role,
      });

      if (res && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
      throw new Error('Authentication failed: No session returned from server.');
    } catch (syncErr: any) {
      if (syncErr?.data?.code === 'VOLUNTEER_PENDING_APPROVAL' && syncErr?.data?.session) {
        return syncErr.data.session;
      }
      throw syncErr;
    }
  },

  // 2. Firebase Registration
  async register(
    name: string,
    identifier: string,
    password: string,
    role: PortalType,
    organization?: string,
    department?: string,
    squad_id?: string
  ): Promise<UserSession> {
    const email = identifierToEmail(identifier);
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
    } catch (fbErr: any) {
      const friendlyMsg = mapFirebaseError(fbErr);
      const customErr: any = new Error(friendlyMsg);
      customErr.code = fbErr?.code;
      throw customErr;
    }

    const firebaseUser = userCredential.user;
    const idToken = await firebaseUser.getIdToken(true);

    // Synchronize verified ID token with Django backend
    const res = await api.post<RegisterResponse>('/auth/firebase/', {
      id_token: idToken,
      role: role,
      name: name,
      organization: organization || '',
      department: department || '',
      squad_id: squad_id || '',
    });

    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Registration failed: No session returned from server.');
  },

  // 3. Firebase Google Authentication
  async googleLogin(role: PortalType): Promise<UserSession> {
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (popupErr: any) {
      const friendlyMsg = mapFirebaseError(popupErr);
      const customErr: any = new Error(friendlyMsg);
      customErr.code = popupErr?.code;
      throw customErr;
    }

    const user = result.user;
    const idToken = await user.getIdToken();

    // Send token to Django backend for verification
    const res = await api.post<LoginResponse>('/auth/firebase/', {
      id_token: idToken,
      role: role,
    });

    if (res && res.session) {
      this.saveSession(res.session);
      return res.session;
    }
    throw new Error('Google authentication exchange failed with server.');
  },

  // 4. Synchronize Firebase User with Django Backend
  async syncFirebaseUser(firebaseUser: FirebaseUser, fallbackRole?: PortalType): Promise<UserSession | null> {
    try {
      const stored = this.getStoredSession();
      const preferredRole = fallbackRole || stored?.role || 'pilgrim';
      const idToken = await firebaseUser.getIdToken();
      const res = await api.post<LoginResponse>('/auth/firebase/', {
        id_token: idToken,
        role: preferredRole,
      });

      if (res && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
    } catch (err: any) {
      console.warn('Backend sync for Firebase user:', err?.message || err);
      // If server explicitly rejected token as 401, clear invalid session
      if (err?.status === 401) {
        this.clearSession();
        return null;
      }
      // If volunteer pending approval, still load session
      if (err?.data?.session) {
        this.saveSession(err.data.session);
        return err.data.session;
      }
    }
    return this.getStoredSession();
  },

  // 5. Password Reset via Firebase / Backend
  async forgotPassword(identifier: string, role: PortalType): Promise<ForgotPasswordResponse> {
    const email = identifierToEmail(identifier);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (fbErr: any) {
      console.info('Firebase sendPasswordResetEmail note:', fbErr?.code || fbErr?.message);
    }

    return api.post<ForgotPasswordResponse>('/auth/forgot-password/', {
      identifier,
      role,
    });
  },

  // 6. Reset Password with OTP
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password/', {
      identifier,
      otp,
      new_password: newPassword,
    });
  },

  // 7. Get Current Session from Backend
  async getProfile(): Promise<UserSession | null> {
    try {
      const res = await api.get<{ authenticated: boolean; session: UserSession | null }>('/auth/me/');
      if (res && res.authenticated && res.session) {
        this.saveSession(res.session);
        return res.session;
      }
    } catch {
      // Backend unavailable or unauthenticated
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
  ): Promise<{ message: string; status: string; request: any; session?: UserSession }> {
    const email = identifierToEmail(identifier);
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/email-already-in-use') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch {
          const friendlyMsg = mapFirebaseError(fbErr);
          const customErr: any = new Error(friendlyMsg);
          customErr.code = fbErr?.code;
          throw customErr;
        }
      } else {
        const friendlyMsg = mapFirebaseError(fbErr);
        const customErr: any = new Error(friendlyMsg);
        customErr.code = fbErr?.code;
        throw customErr;
      }
    }

    const user = userCredential.user;
    const idToken = await user.getIdToken(true);

    const res = await api.post<LoginResponse>('/auth/firebase/', {
      id_token: idToken,
      role: 'volunteer',
      name: name,
      organization: organization || 'Pandharpur Wari Seva Mandal',
      department: department || 'Food & Annachatra Seva',
      squad_id: squad_id || 'SQD-FOOD-101',
    });

    if (res && res.session) {
      this.saveSession(res.session);
      return {
        message: res.message || 'Volunteer access request submitted.',
        status: res.status || 'pending',
        request: {
          id: res.session.id,
          name: res.session.name,
          identifier: res.session.identifier,
          department: res.session.department,
          squad_id: res.session.squad_id,
          organization: res.session.organization,
        },
        session: res.session,
      };
    }
    throw new Error('Volunteer request registration failed: No session returned.');
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

  // 10. Complete Logout (Firebase Auth + Django Session + LocalStorage)
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
