import React, { useRef } from 'react';
import { useApp } from '../context/AppProvider';
import { downloadBackup, importData } from '../utils/export';
import { clearAllStorage, getStorageSize } from '../utils/storage';
import { Settings as SettingsIcon, Download, Upload, Trash2, Moon, Sun, Shield } from 'lucide-react';
import './Settings.css';

export default function Settings() {
    const { settings, setSettings } = useApp();
    const fileInputRef = useRef(null);

    function toggleTheme() {
        const next = settings.theme === 'dark' ? 'light' : 'dark';
        setSettings(prev => ({ ...prev, theme: next }));
        document.documentElement.setAttribute('data-theme', next);
    }

    function handleExport() {
        downloadBackup();
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
                alert(`Imported successfully! Keys restored: ${result.keys.join(', ')}`);
                window.location.reload();
            } else {
                alert(`Import failed: ${result.error}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleClearAll() {
        if (confirm('⚠️ This will delete ALL your data permanently. Are you sure?')) {
            if (confirm('Really sure? This cannot be undone.')) {
                clearAllStorage();
                window.location.reload();
            }
        }
    }

    const sizeKB = (getStorageSize() / 1024).toFixed(1);

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
                            {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            <div>
                                <span className="settings-label">Theme</span>
                                <span className="settings-desc">Currently using {settings.theme} mode</span>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                            Switch to {settings.theme === 'dark' ? 'Light' : 'Dark'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="settings-section">
                <h2 className="settings-section-title">Data Management</h2>
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <Download size={20} />
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
                            <Upload size={20} />
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
                            <Trash2 size={20} style={{ color: 'var(--danger)' }} />
                            <div>
                                <span className="settings-label">Clear All Data</span>
                                <span className="settings-desc">Permanently delete all stored data</span>
                            </div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={handleClearAll}>Clear All</button>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="settings-section">
                <h2 className="settings-section-title">About</h2>
                <div className="card settings-card">
                    <div className="settings-item">
                        <div className="settings-item-info">
                            <Shield size={20} />
                            <div>
                                <span className="settings-label">PropTrack MY</span>
                                <span className="settings-desc">v1.0 · Malaysia Property Management · No data leaves your device</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
