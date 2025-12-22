
import React from 'react';
import { Helmet } from 'react-helmet';
import AuthPage from '@/pages/AuthPage';
import MainApp from '@/pages/MainApp';
import OnboardingPage from '@/pages/OnboardingPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';

const AppContent = () => {
  const { user, loading } = useAuth();
  const path = window.location.pathname;
  const isOnboarding = path === '/onboarding' || path === '/auth/callback';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isOnboarding) {
    return <OnboardingPage />;
  }

  return (
    <>
      <Helmet>
        <title>Community Platform - Connect, Share, Explore</title>
        <meta name="description" content="Join our vibrant community platform to connect with friends, share moments, join groups, and explore our online shop." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {!user ? (
          <AuthPage />
        ) : (
          <MainApp currentUser={user} />
        )}
        <Toaster />
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
