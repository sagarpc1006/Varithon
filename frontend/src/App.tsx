import React, { useState, useEffect } from 'react';
import { Language, ScreenType, PortalType, UserSession } from './types';
import { HomeScreen } from './components/HomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { UserDashboard } from './components/UserDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { authService } from './services/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activePortal, setActivePortal] = useState<PortalType>('pilgrim');
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Load existing session on initial mount
  useEffect(() => {
    async function initSession() {
      try {
        const existingSession = await authService.getProfile();
        if (existingSession) {
          setSession(existingSession);
        }
      } catch (err) {
        console.warn('Session init:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    initSession();
  }, []);

  // Quick navigation handlers
  const handleSelectPortalFromHome = (portal: PortalType) => {
    setActivePortal(portal);
    setCurrentScreen('signin');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
  };

  const handleSignOut = () => {
    setSession(null);
    setCurrentScreen('home');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Connecting to VariMitra Services...</p>
        </div>
      </div>
    );
  }

  if (session) {
    if (session.role === 'pilgrim') {
      return (
        <UserDashboard
          session={session}
          language={language}
          onLanguageChange={setLanguage}
          onSignOut={handleSignOut}
        />
      );
    }
    if (session.role === 'volunteer') {
      return (
        <VolunteerDashboard
          session={session}
          language={language}
          onLanguageChange={setLanguage}
          onSignOut={handleSignOut}
        />
      );
    }
    // Admin dashboard
    return (
      <AdminDashboard
        session={session}
        language={language}
        onLanguageChange={setLanguage}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#faf7f2]">
      {/* Screen 1: Dashboard / Home */}
      {currentScreen === 'home' && (
        <HomeScreen
          language={language}
          onLanguageChange={setLanguage}
          onSelectPortal={handleSelectPortalFromHome}
        />
      )}

      {/* Screen 2 & 3: Sign In (Pilgrim or Admin) */}
      {currentScreen === 'signin' && (
        <SignInScreen
          language={language}
          onLanguageChange={setLanguage}
          activePortal={activePortal}
          onPortalChange={setActivePortal}
          onBackToHome={handleBackToHome}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
