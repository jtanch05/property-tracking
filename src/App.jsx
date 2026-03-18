import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { AppProvider, useApp } from './context/AppProvider';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';

const Landing = lazy(() => import('./pages/Landing'));
// Pages - Lazy Loaded
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const Tenants = lazy(() => import('./pages/Tenants'));
const Agreements = lazy(() => import('./pages/Agreements'));
const Expenses = lazy(() => import('./pages/Expenses'));
const RentLedger = lazy(() => import('./pages/RentLedger'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Vendors = lazy(() => import('./pages/Vendors'));
const CashFlow = lazy(() => import('./pages/CashFlow'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Settings = lazy(() => import('./pages/Settings'));

function ThemeInitializer({ children }) {
  const { settings } = useApp();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div className="loading-spinner" />
      <span>Loading PropTrack...</span>
    </div>
  );
}

function AuthGate() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AppProvider>
      <ThemeInitializer>
        <AppContent />
      </ThemeInitializer>
    </AppProvider>
  );
}

function AppContent() {
  const { dataLoading } = useApp();

  if (dataLoading) return <LoadingScreen />;

  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/agreements" element={<Agreements />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/rent" element={<RentLedger />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/cashflow" element={<CashFlow />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={
            <div className="empty-state" style={{ minHeight: '60vh' }}>
              <h3>Page Not Found</h3>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          } />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
