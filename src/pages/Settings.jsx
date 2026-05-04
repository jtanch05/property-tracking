import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import { useAuth } from '../context/AuthProvider';
import { downloadBackup, importData, exportFullStatement } from '../utils/export';
import { getStorageSize } from '../utils/storage';
import { Settings as SettingsIcon, Download, Upload, Trash2, Moon, Sun, Shield, FileText, Bell, Copy, Check, Calendar, Link, Unlink } from 'lucide-react';
import './Settings.css';

export default function Settings() {
    const {
        settings, setSettings,
        properties, tenants, agreements, rentRecords, taxRecords, utilityRecords,
        insuranceRecords, maintenanceRecords, vendors, managementFees, payouts, deposits,
        addProperty, addTenant, addAgreement, addRentRecord, addTaxRecord, addUtilityRecord,
        addInsuranceRecord, addMaintenanceRecord, addVendor, addManagementFee, addPayout, addDeposit,
        deleteProperty, deleteTenant, deleteAgreement, deleteRentRecord, deleteTaxRecord,
        deleteUtilityRecord, deleteInsuranceRecord, deleteMaintenanceRecord, deleteVendor,
        deleteManagementFee, deletePayout, deleteDeposit,
    } = useApp();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [alertEmail, setAlertEmail] = useState(settings.alertEmail || '');
    const [emailSaved, setEmailSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [notificationFrequency, setNotificationFrequency] = useState(settings.notificationFrequency || 'weekly');
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

    const backupData = {
        properties,
        tenants,
        agreements,
        rentRecords,
        taxRecords,
        utilityRecords,
        insuranceRecords,
        maintenanceRecords,
        vendors,
        managementFees,
        payouts,
        deposits,
        settings,
    };

    const collectionActions = [
        { key: 'properties', items: properties, add: addProperty, remove: deleteProperty },
        { key: 'tenants', items: tenants, add: addTenant, remove: deleteTenant },
        { key: 'agreements', items: agreements, add: addAgreement, remove: deleteAgreement },
        { key: 'rentRecords', items: rentRecords, add: addRentRecord, remove: deleteRentRecord },
        { key: 'taxRecords', items: taxRecords, add: addTaxRecord, remove: deleteTaxRecord },
        { key: 'utilityRecords', items: utilityRecords, add: addUtilityRecord, remove: deleteUtilityRecord },
        { key: 'insuranceRecords', items: insuranceRecords, add: addInsuranceRecord, remove: deleteInsuranceRecord },
        { key: 'maintenanceRecords', items: maintenanceRecords, add: addMaintenanceRecord, remove: deleteMaintenanceRecord },
        { key: 'vendors', items: vendors, add: addVendor, remove: deleteVendor },
        { key: 'managementFees', items: managementFees, add: addManagementFee, remove: deleteManagementFee },
        { key: 'payouts', items: payouts, add: addPayout, remove: deletePayout },
        { key: 'deposits', items: deposits, add: addDeposit, remove: deleteDeposit },
    ];

    function handleExport() {
        downloadBackup(backupData);
    }

    function handleImport() {
        fileInputRef.current?.click();
    }

    function handleFileSelected(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = importData(ev.target.result);
            if (result.success) {
                restoreBackup(result.data)
                    .then(() => alert(`Imported successfully! Keys restored: ${result.keys.join(', ')}`))
                    .catch(err => alert(`Import failed: ${err.message}`));
            } else {
                alert(`Import failed: ${result.error}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    async function restoreBackup(data) {
        for (const action of collectionActions) {
            const imported = data[action.key];
            if (!Array.isArray(imported)) continue;
            for (const item of imported) {
                await action.add(item);
            }
        }

        if (data.settings && typeof data.settings === 'object') {
            await setSettings(data.settings);
        }
    }

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

    function handleSaveAlertEmail() {
        setSettings(prev => ({ ...prev, alertEmail, notificationFrequency }));
        setEmailSaved(true);
        setTimeout(() => setEmailSaved(false), 2500);
    }

    function handleCopyUID() {
        if (user?.uid) {
            navigator.clipboard.writeText(user.uid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
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

    const sizeKB = (new Blob([JSON.stringify(backupData)]).size / 1024 || getStorageSize() / 1024).toFixed(1);

    return (
        <div className="settings-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Settings</h1>
                    <p className="section-subtitle">App preferences and data management</p>
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
                                <span className="settings-desc">Currently using {settings.theme} mode</span>
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
                            <div className="settings-icon-wrapper">
                                <Download size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Export Backup</span>
                                <span className="settings-desc">Download all data as JSON ({sizeKB} KB)</span>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export</button>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Upload size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Import Backup</span>
                                <span className="settings-desc">Restore data from a JSON backup file</span>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleImport}>Import</button>
                        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelected} />
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper danger">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Clear All Data</span>
                                <span className="settings-desc">Permanently delete all stored data</span>
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
                                <span className="settings-label">Export Full Statement</span>
                                <span className="settings-desc">Download a detailed PDF covering all properties, finances, expenses &amp; operations</span>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleFullStatementPDF}>Export PDF</button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="settings-section">
                <h2 className="settings-section-title">Email Notifications</h2>
                <div className="card settings-card">
                    <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Bell size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Alert Email</span>
                                <span className="settings-desc">Daily digest of overdue rent, expiring agreements, tax due dates &amp; more</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={alertEmail}
                                onChange={e => setAlertEmail(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSaveAlertEmail}>
                                {emailSaved ? <><Check size={14} /> Saved!</> : 'Save'}
                            </button>
                        </div>
                    </div>

                    <div className="settings-divider" />

                    {/* Notification Frequency */}
                    <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Bell size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Notification Frequency</span>
                                <span className="settings-desc">How often you want to receive alert emails</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                { value: 'daily', label: '📅 Daily' },
                                { value: 'weekly', label: '📆 Weekly' },
                                { value: 'biweekly', label: '📆 Every 2 weeks' },
                                { value: 'monthly', label: '🗓️ Monthly' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    className={`btn btn-sm ${notificationFrequency === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setNotificationFrequency(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {notificationFrequency === 'daily' && 'You\'ll get an email every day if there are alerts.'}
                            {notificationFrequency === 'weekly' && 'You\'ll get an email once a week (every 7 days).'}
                            {notificationFrequency === 'biweekly' && 'You\'ll get an email every 2 weeks.'}
                            {notificationFrequency === 'monthly' && 'You\'ll get an email once a month.'}
                        </div>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Shield size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Your User ID</span>
                                <span className="settings-desc">Needed when setting up Make.com automation. Copy and paste into the Body content field.</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                            <code style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.uid || 'Not logged in'}
                            </code>
                            <button className="btn btn-outline btn-sm" onClick={handleCopyUID}>
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>
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
                                <span className="settings-label">
                                    {calendarConnected ? '✅ Connected to Google Calendar' : 'Connect Google Calendar'}
                                </span>
                                <span className="settings-desc">
                                    {calendarConnected
                                        ? 'Alerts are automatically synced to your Google Calendar every day. Events appear with reminders.'
                                        : 'Allow PropTrack to create events directly in your Google Calendar. Alerts appear automatically — no manual import needed.'}
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

                    <div className="settings-divider" />

                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Shield size={20} />
                            </div>
                            <div>
                                <span className="settings-label">Privacy</span>
                                <span className="settings-desc">PropTrack only creates/updates alert events. It cannot read, edit or delete your existing Google Calendar events.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="settings-section">
                <h2 className="settings-section-title">About</h2>
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <div className="settings-icon-wrapper">
                                <Shield size={20} />
                            </div>
                            <div>
                                <span className="settings-label">PropTrack MY</span>
                                <span className="settings-desc">v1.0 · Malaysia Property Management · Cloud sync with Firebase</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
