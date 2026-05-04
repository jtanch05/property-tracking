import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import {
    LayoutDashboard, Building2, Clock, Settings,
    Home, LogOut, Menu, ChevronLeft, Contact
} from 'lucide-react';
import ClientAutomation from '../common/ClientAutomation';
import './Layout.css';

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/properties', icon: Building2, label: 'Properties' },
    { to: '/vendors', icon: Contact, label: 'Vendors' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
];

const BOTTOM_NAV = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/properties', icon: Building2, label: 'Properties' },
    { to: '/vendors', icon: Contact, label: 'Vendors' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    return (
        <div className={`layout ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            <ClientAutomation />

            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo" title="PropTrack">
                            <div className="sidebar-logo-icon">
                                <Building2 size={20} />
                            </div>
                            <span className="brand-label">PropTrack</span>
                        </div>
                        <button
                            className="sidebar-toggle"
                            type="button"
                            title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                            onClick={() => setSidebarExpanded(prev => !prev)}
                        >
                            {sidebarExpanded ? <ChevronLeft size={18} /> : <Menu size={18} />}
                        </button>
                    </div>

                    <nav className="sidebar-nav">
                        {NAV_ITEMS.map(item => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    title={item.label}
                                >
                                    <Icon size={20} />
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Settings">
                        <Settings size={20} />
                        <span className="nav-label">Settings</span>
                    </NavLink>

                    {/* User Profile */}
                    <div className="user-menu-wrapper" ref={userMenuRef}>
                        <button className="user-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                            <div className="user-avatar-circle">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="user-avatar-fallback">
                                        {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="user-name-label">{user?.displayName || user?.email || 'User'}</span>
                        </button>
                        {showUserMenu && (
                            <div className="user-dropdown slide-right-bottom">
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
            </aside>

            <main className="main-wrapper">
                {children}
            </main>

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
