import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import {
    LayoutDashboard, Building2, Clock, Settings,
    Bell, Home, LogOut, Check, Menu, ChevronLeft
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import ClientAutomation from '../common/ClientAutomation';
import './Layout.css';
import './Notifications.css';

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/properties', icon: Building2, label: 'Properties' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
];

const BOTTOM_NAV = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/properties', icon: Building2, label: 'Properties' },
    { to: '/timeline', icon: Clock, label: 'Timeline' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const userMenuRef = useRef(null);
    const notifMenuRef = useRef(null);

    const {
        permissionStatus, requestPermission,
        notifications, unreadCount, markAsRead, markAllAsRead
    } = useNotifications();

    useEffect(() => {
        function handleClickOutside(e) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (permissionStatus === 'default' && user) {
            // requestPermission(); 
        }
    }, [permissionStatus, user]);

    return (
        <div className={`layout ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            <ClientAutomation />

            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo" title="PropTrack">
                            <Building2 size={22} className="logo-icon" />
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

                    <div className="user-menu-wrapper" ref={notifMenuRef}>
                        <button
                            className="nav-item alert-bell"
                            title="Notifications"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={20} />
                            <span className="nav-label">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="alert-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notifications-dropdown slide-right-bottom">
                                <div className="notifications-header">
                                    <span className="notifications-title">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button className="btn-ghost btn-sm" onClick={markAllAsRead}>
                                            <Check size={14} /> Mark all read
                                        </button>
                                    )}
                                </div>
                                {permissionStatus === 'default' && (
                                    <div className="notifications-permission-banner">
                                        <p>Enable push notifications for rent reminders</p>
                                        <button className="btn btn-primary btn-sm" onClick={requestPermission}>Enable</button>
                                    </div>
                                )}
                                <div className="notifications-list">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`notification-item ${!n.read ? 'unread' : ''}`}
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <div className="notification-content">
                                                    <h4>{n.title}</h4>
                                                    <p>{n.body}</p>
                                                    <span className="notification-time">
                                                        {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {!n.read && <div className="notification-dot" />}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="notifications-empty">
                                            <Bell size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                                            <p>No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
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
