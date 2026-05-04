import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import { useAuth } from '../context/AuthProvider';
import { exportFullStatement } from '../utils/export';
import { Trash2, Moon, FileText, Calendar, Info, Link, Sun, Unlink } from 'lucide-react';
import './Settings.css';

export default function Settings() {
    const {
        settings, setSettings,
        properties, tenants, agreements, rentRecords, taxRecords, utilityRecords,
        insuranceRecords, maintenanceRecords, vendors, managementFees, payouts, deposits,
        deleteProperty, deleteTenant, deleteAgreement, deleteRentRecord, deleteTaxRecord,
        deleteUtilityRecord, deleteInsuranceRecord, deleteMaintenanceRecord, deleteVendor,
        deleteManagementFee, deletePayout, deleteDeposit,
    } = useApp();
    const { user } = useAuth();
    const initialCalendarStatus = new URLSearchParams(window.location.search).get('calendar');
    const [calendarStatus, setCalendarStatus] = useState(initialCalendarStatus);
    const [calendarConnected, setCalendarConnected] = useState(
        initialCalendarStatus === 'success' || settings.googleCalendarConnected || false
    );

    // Check if we're returning from Google OAuth (URL will have ?calendar=success or ?calendar=error)
    useEffect(() => {
        if (initialCalendarStatus) {
            if (initialCalendarStatus === 'success') {
                setSettings(prev => ({ ...prev, googleCalendarConnected: true }));
            }
            window.history.replaceState({}, '', window.location.pathname);
            const timeoutId = setTimeout(() => setCalendarStatus(null), 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [initialCalendarStatus, setSettings]);

    function toggleTheme() {
        const next = settings.theme === 'dark' ? 'light' : 'dark';
        setSettings(prev => ({ ...prev, theme: next }));
        document.documentElement.setAttribute('data-theme', next);
    }

    const collectionActions = [
        { items: properties, remove: deleteProperty },
        { items: tenants, remove: deleteTenant },
        { items: agreements, remove: deleteAgreement },
        { items: rentRecords, remove: deleteRentRecord },
        { items: taxRecords, remove: deleteTaxRecord },
        { items: utilityRecords, remove: deleteUtilityRecord },
        { items: insuranceRecords, remove: deleteInsuranceRecord },
        { items: maintenanceRecords, remove: deleteMaintenanceRecord },
        { items: vendors, remove: deleteVendor },
        { items: managementFees, remove: deleteManagementFee },
        { items: payouts, remove: deletePayout },
        { items: deposits, remove: deleteDeposit },
    ];

    async function handleClearAll() {
        if (confirm('⚠️ This will delete ALL your data permanently. Are you sure?')) {
            if (confirm('Really sure? This cannot be undone.')) {
                for (const action of collectionActions) {
                    await Promise.all(action.items.map(item => action.remove(item.id)));
                }
                await setSettings({
                    theme: settings.theme || 'dark',
                    selectedPropertyId: null,
                    pinEnabled: false,
                    pin: null,
                });
            }
        }
    }

    function handleFullStatementPDF() {
        exportFullStatement({ properties, tenants, agreements, rentRecords, taxRecords, utilityRecords, insuranceRecords, maintenanceRecords, managementFees, deposits });
    }

    async function handleConnectGoogleCalendar() {
        if (!user?.uid) return;
        const token = await user.getIdToken();
        window.location.href = `/api/auth/google?token=${encodeURIComponent(token)}`;
    }

    async function handleDisconnectGoogleCalendar() {
        setCalendarConnected(false);
        setSettings(prev => ({ ...prev, googleCalendarConnected: false }));
        const token = user ? await user.getIdToken() : null;
        fetch('/api/auth/google-disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        }).catch(err => console.error('Google Calendar disconnect failed:', err));
    }

    return (
        <div className="settings-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Settings</h1>
                </div>
            </div>

            {/* Appearance */}
            <div className="settings-section">
                <h2 className="settings-section-title">Appearance</h2>
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <span className="settings-label">Theme</span>
                            </div>
                        </div>
                        <label className="theme-switch" title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'}`}>
                            <input
                                type="checkbox"
                                checked={settings.theme === 'dark'}
                                onChange={toggleTheme}
                            />
                            <div className="switch-track">
                                <div className="switch-thumb" />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="settings-section">
                <h2 className="settings-section-title">Data Management</h2>
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper danger">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <span className="settings-label settings-label-row">
                                    Clear All Data
                                    <button
                                        type="button"
                                        className="settings-info-trigger"
                                        aria-label="Clear all data details"
                                    >
                                        <Info size={14} />
                                        <span className="settings-tooltip" role="tooltip">
                                            Permanently delete all stored data. This cannot be undone.
                                        </span>
                                    </button>
                                </span>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleClearAll}>Clear All</button>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <FileText size={20} />
                            </div>
                            <div>
                                <span className="settings-label settings-label-row">
                                    Export Full Statement
                                    <button
                                        type="button"
                                        className="settings-info-trigger"
                                        aria-label="Export full statement details"
                                    >
                                        <Info size={14} />
                                        <span className="settings-tooltip" role="tooltip">
                                            Download a detailed PDF covering all properties, finances, expenses and operations.
                                        </span>
                                    </button>
                                </span>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleFullStatementPDF}>Export PDF</button>
                    </div>
                </div>
            </div>

            {/* Google Calendar */}
            <div className="settings-section">
                <h2 className="settings-section-title">Google Calendar</h2>
                <div className="card settings-card">

                    {/* Status banner after OAuth redirect */}
                    {calendarStatus === 'success' && (
                        <div style={{ background: 'var(--success-bg, #f0fdf4)', border: '1px solid var(--success, #888888)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, color: 'var(--success, #888888)', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                            ✅ Google Calendar connected! Alerts will sync automatically every day.
                        </div>
                    )}
                    {calendarStatus === 'denied' && (
                        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 'var(--font-sm)' }}>
                            ❌ Google Calendar access was denied. You can try again anytime.
                        </div>
                    )}
                    {calendarStatus && calendarStatus !== 'success' && calendarStatus !== 'denied' && (
                        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 'var(--font-sm)' }}>
                            ❌ Something went wrong. Please try again or contact support.
                        </div>
                    )}

                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className={`settings-icon-wrapper ${calendarConnected ? 'success' : ''}`}>
                                <Calendar size={20} />
                            </div>
                            <div>
                                <span className="settings-label settings-label-row">
                                    {calendarConnected ? '✅ Connected to Google Calendar' : 'Connect Google Calendar'}
                                    <button
                                        type="button"
                                        className="settings-info-trigger"
                                        aria-label="Google Calendar details"
                                    >
                                        <Info size={14} />
                                        <span className="settings-tooltip" role="tooltip">
                                            {calendarConnected
                                                ? 'Alerts are automatically synced to your Google Calendar every day. Events appear with reminders.'
                                                : 'Allow PropTrack to create events directly in your Google Calendar. Alerts appear automatically with no manual import needed.'}
                                        </span>
                                    </button>
                                </span>
                            </div>
                        </div>
                        {calendarConnected ? (
                            <button className="btn btn-secondary btn-sm" onClick={handleDisconnectGoogleCalendar}>
                                <Unlink size={14} /> Disconnect
                            </button>
                        ) : (
                            <button className="btn btn-primary btn-sm" onClick={handleConnectGoogleCalendar} disabled={!user?.uid}>
                                <Link size={14} /> Connect
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
