import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, FileText, Wallet,
    Receipt, Droplets, Shield, Wrench, Contact, Clock,
    Settings, ChevronLeft, ChevronRight, Bell, Menu, Landmark, TrendingUp
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';
import './Layout.css';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/properties', label: 'Properties', icon: Building2 },
    { path: '/tenants', label: 'Tenants', icon: Users },
    { path: '/agreements', label: 'Agreements', icon: FileText },
    { path: '/rent', label: 'Rent & Deposits', icon: Wallet },
    { path: '/taxes', label: 'Taxes', icon: Receipt },
    { path: '/utilities', label: 'Utilities', icon: Droplets },
    { path: '/insurance', label: 'Insurance', icon: Shield },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/management-fees', label: 'Mgmt Fees', icon: Landmark },
    { path: '/vendors', label: 'Vendors', icon: Contact },
    { path: '/cashflow', label: 'Cash Flow', icon: TrendingUp },
    { path: '/timeline', label: 'Timeline', icon: Clock },
    { path: '/settings', label: 'Settings', icon: Settings },
];

// Mobile bottom nav — show only the most important items
const MOBILE_NAV_ITEMS = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/properties', label: 'Properties', icon: Building2 },
    { path: '/rent', label: 'Rent', icon: Wallet },
    { path: '/timeline', label: 'Timeline', icon: Clock },
    { path: '/settings', label: 'More', icon: Menu },
];

export default function Layout({ children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { alerts, properties, settings, setSettings, selectedProperty } = useApp();

    const urgentAlerts = alerts.filter(a => a.severity === 'danger' || a.severity === 'warning');

    function handlePropertySwitch(e) {
        const val = e.target.value;
        setSettings(prev => ({ ...prev, selectedPropertyId: val || null }));
    }

    return (
        <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar (Desktop) */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Building2 size={24} className="logo-icon" />
                        {!sidebarCollapsed && <span className="logo-text">PropTrack</span>}
                    </div>
                    <button
                        className="btn-icon sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Property Switcher */}
                {!sidebarCollapsed && properties.length > 0 && (
                    <div className="sidebar-switcher">
                        <select
                            value={settings.selectedPropertyId || ''}
                            onChange={handlePropertySwitch}
                            className="property-select"
                        >
                            <option value="">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.nickname}</option>
                            ))}
                        </select>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            title={item.label}
                        >
                            <item.icon size={20} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-wrapper">
                {/* Top Bar */}
                <header className="topbar">
                    <div className="topbar-left">
                        {selectedProperty ? (
                            <div className="topbar-property">
                                <Building2 size={16} />
                                <span>{selectedProperty.nickname}</span>
                            </div>
                        ) : (
                            <span className="topbar-title">All Properties</span>
                        )}
                    </div>
                    <div className="topbar-right">
                        <NavLink to="/timeline" className="alert-bell">
                            <Bell size={20} />
                            {urgentAlerts.length > 0 && (
                                <span className="alert-count">{urgentAlerts.length}</span>
                            )}
                        </NavLink>
                    </div>
                </header>

                {/* Page Content */}
                <main className="main-content">
                    <div className="page-enter">
                        {children}
                    </div>
                </main>
            </div>

            {/* Bottom Nav (Mobile) */}
            <nav className="bottom-nav">
                {MOBILE_NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
