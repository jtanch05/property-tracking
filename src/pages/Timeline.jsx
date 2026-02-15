import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatDate, formatRelativeDate, formatCurrency } from '../utils/formatters';
import { Clock, FileText, Wallet, Receipt, Shield, Wrench, AlertCircle, Bell, Calendar, MessageCircle, Download, Landmark } from 'lucide-react';
import { generateSingleICS, generateBulkICS, downloadICS } from '../utils/calendar';
import { sendSelfReminder } from '../utils/whatsapp';
import './Timeline.css';

const ICON_MAP = {
    agreement_expiry: FileText,
    agreement_expired: FileText,
    rent_overdue: Wallet,
    tax_due: Receipt,
    insurance_expiry: Shield,
    maintenance_open: Wrench,
    scheduled_maintenance: Wrench,
    management_fee_due: Landmark,
};

const COLOR_MAP = {
    danger: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--info)',
    success: 'var(--success)',
};

export default function Timeline() {
    const { alerts } = useApp();
    const [filterType, setFilterType] = useState('all');

    const types = [...new Set(alerts.map(a => a.type))];
    const filtered = filterType === 'all' ? alerts : alerts.filter(a => a.type === filterType);

    // Group by month
    const grouped = {};
    filtered.forEach(a => {
        const month = a.date?.slice(0, 7) || 'Unknown';
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(a);
    });

    const months = Object.keys(grouped).sort();

    function exportSingleAlert(alert) {
        const ics = generateSingleICS(alert);
        downloadICS(ics, `proptrack-${alert.type}`);
    }

    function exportAllAlerts() {
        if (filtered.length === 0) return;
        const ics = generateBulkICS(filtered);
        downloadICS(ics, 'proptrack-all-alerts');
    }

    return (
        <div className="timeline-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Timeline & Alerts</h1>
                    <p className="section-subtitle">{alerts.length} alerts across all properties</p>
                </div>
                {alerts.length > 0 && (
                    <button className="btn btn-secondary" onClick={exportAllAlerts} title="Export all to calendar">
                        <Calendar size={16} /> Export All .ics
                    </button>
                )}
            </div>

            {alerts.length > 0 && (
                <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="filter-tabs">
                        <button className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType('all')}>All</button>
                        {types.map(t => (
                            <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType(t)}>
                                {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {months.length > 0 ? (
                <div className="timeline-list">
                    {months.map(month => (
                        <div key={month} className="timeline-group">
                            <div className="timeline-month">
                                {new Date(month + '-01').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="timeline-items">
                                {grouped[month].map(alert => {
                                    const Icon = ICON_MAP[alert.type] || AlertCircle;
                                    return (
                                        <div key={alert.id} className="timeline-item">
                                            <div className="timeline-dot" style={{ background: COLOR_MAP[alert.severity] || 'var(--text-tertiary)' }} />
                                            <div className="timeline-icon" style={{ color: COLOR_MAP[alert.severity] }}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="timeline-content">
                                                <span className="timeline-title">{alert.title}</span>
                                                <span className="timeline-message">{alert.message}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                <span className="timeline-date">{formatRelativeDate(alert.date)}</span>
                                                <button className="btn-icon" title="Export to calendar" onClick={() => exportSingleAlert(alert)} style={{ padding: 4 }}>
                                                    <Calendar size={14} />
                                                </button>
                                                <button className="btn-icon" title="WhatsApp self-reminder" onClick={() => sendSelfReminder(alert)} style={{ padding: 4 }}>
                                                    <MessageCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Bell size={56} />
                    <h3>No alerts</h3>
                    <p>When you add properties, agreements, and other records, alerts will appear here.</p>
                </div>
            )}
        </div>
    );
}
