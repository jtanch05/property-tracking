import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppProvider';
import Layout from './components/Layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Agreements from './pages/Agreements';
import RentLedger from './pages/RentLedger';
import Taxes from './pages/Taxes';
import Utilities from './pages/Utilities';
import Insurance from './pages/Insurance';
import Maintenance from './pages/Maintenance';
import Vendors from './pages/Vendors';
import ManagementFees from './pages/ManagementFees';
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

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ThemeInitializer>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/agreements" element={<Agreements />} />
              <Route path="/rent" element={<RentLedger />} />
              <Route path="/taxes" element={<Taxes />} />
              <Route path="/utilities" element={<Utilities />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/management-fees" element={<ManagementFees />} />
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
        </ThemeInitializer>
      </AppProvider>
    </BrowserRouter>
  );
}
