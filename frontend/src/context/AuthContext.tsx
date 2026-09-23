import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, onAuthStateChanged, type FirebaseUser } from '../services/firebase';
import { authService } from '../services/auth';
import { PortalType, UserSession } from '../types';

export interface AuthContextType {
  user: FirebaseUser | null;
  session: UserSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, role: PortalType) => Promise<UserSession>;
  register: (
    name: string,
    identifier: string,
    password: string,
    role: PortalType,
    organization?: string,
    department?: string,
    squad_id?: string
  ) => Promise<UserSession>;
  loginWithGoogle: (role: PortalType) => Promise<UserSession>;
  logout: () => Promise<void>;
  updateSession: (session: UserSession | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to Firebase Auth state as the single source of truth
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Synchronize with Django backend and fetch verified profile
          const appSession = await authService.syncFirebaseUser(firebaseUser);
          if (isMounted) {
            setSession(appSession);
          }
        } catch (err) {
          console.warn('AuthContext: Error synchronizing session with Django:', err);
        }
      } else {
        setUser(null);
        setSession(null);
        authService.clearSession();
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string, role: PortalType): Promise<UserSession> => {
    const userSession = await authService.login(identifier, password, role);
    setSession(userSession);
    setUser(auth.currentUser);
    return userSession;
  }, []);

  const register = useCallback(
    async (
      name: string,
      identifier: string,
      password: string,
      role: PortalType,
      organization?: string,
      department?: string,
      squad_id?: string
    ): Promise<UserSession> => {
      const userSession = await authService.register(
        name,
        identifier,
        password,
        role,
        organization,
        department,
        squad_id
      );
      setSession(userSession);
      setUser(auth.currentUser);
      return userSession;
    },
    []
  );

  const loginWithGoogle = useCallback(async (role: PortalType): Promise<UserSession> => {
    const userSession = await authService.googleLogin(role);
    setSession(userSession);
    setUser(auth.currentUser);
    return userSession;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setSession(null);
  }, []);

  const updateSession = useCallback((newSession: UserSession | null) => {
    setSession(newSession);
    if (newSession) {
      authService.saveSession(newSession);
    } else {
      authService.clearSession();
    }
  }, []);

  const isAuthenticated = useMemo(() => {
    return Boolean(user && session);
  }, [user, session]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated,
      login,
      register,
      loginWithGoogle,
      logout,
      updateSession,
    }),
    [user, session, loading, isAuthenticated, login, register, loginWithGoogle, logout, updateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
