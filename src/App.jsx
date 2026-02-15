import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { AppProvider, useApp } from './context/AppProvider';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';

// Pages
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Agreements from './pages/Agreements';
import Expenses from './pages/Expenses';
import RentLedger from './pages/RentLedger';
import Maintenance from './pages/Maintenance';
import Vendors from './pages/Vendors';
import CashFlow from './pages/CashFlow';
import Timeline from './pages/Timeline';
import Settings from './pages/Settings';

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
  if (!user) return <Login />;

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
