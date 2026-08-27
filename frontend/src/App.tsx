import React, { useState } from 'react';
import { Language, ScreenType, PortalType, UserSession } from './types';
import { HomeScreen } from './components/HomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { DemoDashboard } from './components/DemoDashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activePortal, setActivePortal] = useState<PortalType>('pilgrim');
  const [language, setLanguage] = useState<Language>('en');
  const [session, setSession] = useState<UserSession | null>(null);

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
    setCurrentScreen('signin');
  };

  if (session) {
    return (
      <DemoDashboard
        session={session}
        language={language}
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
