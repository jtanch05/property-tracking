import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthProvider';
import {
    LayoutDashboard, Building2, Users, FileText, Wallet, Wrench, Clock, Settings,
    Bell, ChevronLeft, Menu, Home, BarChart3, Receipt, HardHat, LogOut
} from 'lucide-react';
import './Layout.css';

const NAV_SECTIONS = [
    {
        label: 'Overview',
        items: [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/timeline', icon: Clock, label: 'Timeline' },
        ],
    },
    {
        label: 'Management',
        items: [
            { to: '/properties', icon: Building2, label: 'Properties' },
            { to: '/tenants', icon: Users, label: 'Tenants' },
            { to: '/agreements', icon: FileText, label: 'Agreements' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { to: '/rent', icon: Wallet, label: 'Rent Ledger' },
            { to: '/cashflow', icon: BarChart3, label: 'Cash Flow' },
        ],
    },
    {
        label: 'Expenses',
        items: [
            { to: '/expenses', icon: Receipt, label: 'Expenses' },
        ],
    },
    {
        label: 'Operations',
        items: [
            { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
            { to: '/vendors', icon: HardHat, label: 'Vendors' },
        ],
    },
    {
        label: 'System',
        items: [
            { to: '/settings', icon: Settings, label: 'Settings' },
        ],
    },
];

const BOTTOM_NAV = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/properties', icon: Building2, label: 'Properties' },
    { to: '/rent', icon: Wallet, label: 'Rent' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }) {
    const { properties, settings, setSettings, alerts, selectedProperty } = useApp();
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Close user menu on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handlePropertySwitch(e) {
        setSettings(prev => ({ ...prev, selectedPropertyId: e.target.value || null }));
    }

    return (
        <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Building2 size={22} className="logo-icon" />
                        {!collapsed && <span className="logo-text">PropTrack</span>}
                    </div>
                    <button className="btn-icon sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Property Switcher */}
                {!collapsed && properties.length > 0 && (
                    <div className="sidebar-switcher">
                        <select
                            className="property-select"
                            value={settings.selectedPropertyId || ''}
                            onChange={handlePropertySwitch}
                        >
                            <option value="">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.nickname}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Nav */}
                <nav className="sidebar-nav">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label} className="nav-section">
                            {!collapsed && <span className="nav-section-header">{section.label}</span>}
                            {section.items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.to === '/'}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon size={18} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Wrapper */}
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
                        <Link to="/timeline" className="alert-bell" title="Alerts">
                            <Bell size={18} />
                            {alerts.length > 0 && (
                                <span className="alert-count">{alerts.length > 9 ? '9+' : alerts.length}</span>
                            )}
                        </Link>

                        {/* User avatar & menu */}
                        <div className="user-menu-wrapper" ref={userMenuRef}>
                            <button className="user-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="user-avatar-fallback">
                                        {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </button>
                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <div className="user-dropdown-info">
                                        <span className="user-dropdown-name">{user?.displayName || 'User'}</span>
                                        <span className="user-dropdown-email">{user?.email}</span>
                                    </div>
                                    <button className="user-dropdown-item" onClick={() => { logout(); setShowUserMenu(false); }}>
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="main-content page-enter">
                    {children}
                </main>
            </div>

            {/* Bottom Nav (Mobile) */}
            <nav className="bottom-nav">
                {BOTTOM_NAV.map(item => {
                    const Icon = item.icon;
                    const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
