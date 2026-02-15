import React from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency, getStatusColor, formatRelativeDate } from '../utils/formatters';
import { Building2, Users, Wallet, AlertTriangle, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const { properties, filteredData, alerts, rentRecords, agreements } = useApp();
    const { tenants, rentRecords: filteredRent, maintenanceRecords } = filteredData;

    // Stats
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const totalProperties = properties.length;

    // Rent stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const thisMonthRent = filteredRent.filter(r => r.month === currentMonth);
    const totalExpected = thisMonthRent.reduce((sum, r) => sum + (r.amountDue || 0), 0);
    const totalCollected = thisMonthRent.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const totalOutstanding = totalExpected - totalCollected;

    // Occupancy
    const occupiedCount = properties.filter(p => {
        return tenants.some(t => t.propertyId === p.id && t.status === 'active');
    }).length;
    const vacantCount = totalProperties - occupiedCount;

    // Open maintenance
    const openMaintenance = maintenanceRecords.filter(m => m.status === 'open').length;

    // Urgent alerts (top 5)
    const urgentAlerts = alerts.slice(0, 5);

    return (
        <div className="dashboard">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Dashboard</h1>
                    <p className="section-subtitle">Overview of your properties</p>
                </div>
                <Link to="/properties" className="btn btn-primary">
                    <Plus size={16} />
                    Add Property
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        <Building2 size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Properties</span>
                        <span className="stat-value">{totalProperties}</span>
                        <span className="stat-detail">
                            <span className="badge badge-success">{occupiedCount} occupied</span>
                            {vacantCount > 0 && <span className="badge badge-danger">{vacantCount} vacant</span>}
                        </span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                        <Users size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Active Tenants</span>
                        <span className="stat-value">{activeTenants}</span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <Wallet size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Rent Collected</span>
                        <span className="stat-value">{formatCurrency(totalCollected)}</span>
                        {totalOutstanding > 0 && (
                            <span className="stat-detail">
                                <span className="badge badge-warning">{formatCurrency(totalOutstanding)} outstanding</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Open Issues</span>
                        <span className="stat-value">{openMaintenance}</span>
                        <span className="stat-detail">
                            <span className="badge badge-info">{alerts.length} alerts</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {urgentAlerts.length > 0 && (
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>⏰ Upcoming Alerts</h2>
                        <Link to="/timeline" className="btn btn-ghost btn-sm">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="alert-list">
                        {urgentAlerts.map(alert => (
                            <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                                <div className="alert-dot" />
                                <div className="alert-content">
                                    <span className="alert-title">{alert.title}</span>
                                    <span className="alert-message">{alert.message}</span>
                                </div>
                                <span className="alert-date">{formatRelativeDate(alert.date)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {totalProperties === 0 && (
                <div className="empty-state">
                    <Building2 size={56} />
                    <h3>No properties yet</h3>
                    <p>Start by adding your first property to track rent, taxes, and maintenance.</p>
                    <Link to="/properties" className="btn btn-primary">
                        <Plus size={16} />
                        Add Your First Property
                    </Link>
                </div>
            )}
        </div>
    );
}
