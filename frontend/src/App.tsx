import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Language, ScreenType, PortalType, UserSession } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded portal components for optimal cross-device performance & minimal initial bundle
const HomeScreen = lazy(() => import('./components/HomeScreen').then(m => ({ default: m.HomeScreen })));
const SignInScreen = lazy(() => import('./components/SignInScreen').then(m => ({ default: m.SignInScreen })));
const UserDashboard = lazy(() => import('./components/UserDashboard').then(m => ({ default: m.UserDashboard })));
const VolunteerDashboard = lazy(() => import('./components/VolunteerDashboard').then(m => ({ default: m.VolunteerDashboard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function ScreenFallback() {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600 tracking-wide">Connecting to VariMitra Services...</p>
      </div>
    </div>
  );
}

/**
 * Animated page transition wrapper.
 * Smoothly animates incoming screens with a clean single-run entrance transition,
 * preventing double-loading or flickering effects.
 */
function AnimatedPageTransition({
  currentScreen,
  children,
}: {
  currentScreen: ScreenType;
  children: React.ReactNode;
}) {
  return (
    <div key={currentScreen} className="w-full min-h-screen animate-page-enter">
      {children}
    </div>
  );
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activePortal, setActivePortal] = useState<PortalType>('pilgrim');
  const [language, setLanguage] = useState<Language>('en');

  const { session, loading, logout, updateSession } = useAuth();

  // Quick navigation handlers
  const handleSelectPortalFromHome = useCallback((portal: PortalType) => {
    setActivePortal(portal);
    setCurrentScreen('signin');
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleLoginSuccess = useCallback((userSession: UserSession) => {
    updateSession(userSession);
  }, [updateSession]);

  const handleSignOut = useCallback(async () => {
    await logout();
    setCurrentScreen('home');
  }, [logout]);

  if (loading) {
    return <ScreenFallback />;
  }

  if (session) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        {session.role === 'pilgrim' && (
          <UserDashboard
            session={session}
            language={language}
            onLanguageChange={setLanguage}
            onSignOut={handleSignOut}
          />
        )}
        {session.role === 'volunteer' && (
          <VolunteerDashboard
            session={session}
            language={language}
            onLanguageChange={setLanguage}
            onSignOut={handleSignOut}
          />
        )}
        {session.role === 'admin' && (
          <AdminDashboard
            session={session}
            language={language}
            onLanguageChange={setLanguage}
            onSignOut={handleSignOut}
          />
        )}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ScreenFallback />}>
      <div className="relative min-h-screen bg-[#faf7f2] overflow-hidden">
        <AnimatedPageTransition currentScreen={currentScreen}>
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
        </AnimatedPageTransition>
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
