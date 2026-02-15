import React, { useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency, formatDate, formatRelativeDate, formatMonth } from '../utils/formatters';
import {
    Building2, Users, Wallet, AlertTriangle, TrendingUp, TrendingDown,
    Plus, ArrowRight, Receipt, Droplets, Shield, Landmark, Wrench,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
    const {
        properties, filteredData, alerts, rentRecords, agreements,
        taxRecords, utilityRecords, insuranceRecords, managementFees, maintenanceRecords
    } = useApp();
    const { tenants, rentRecords: filteredRent, maintenanceRecords: filteredMaintenance } = filteredData;

    // --- Stats ---
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const totalProperties = properties.length;

    // Current month
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Rent stats
    const thisMonthRent = filteredRent.filter(r => r.month === currentMonth);
    const totalCollected = thisMonthRent.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const totalExpected = thisMonthRent.reduce((sum, r) => sum + (r.amountDue || 0), 0);
    const totalOutstanding = totalExpected - totalCollected;

    // Occupancy
    const occupiedCount = properties.filter(p =>
        tenants.some(t => t.propertyId === p.id && t.status === 'active')
    ).length;
    const vacantCount = totalProperties - occupiedCount;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;

    // Open maintenance
    const openMaintenance = filteredMaintenance.filter(m => m.status === 'open').length;

    // --- Expense Calculations ---
    const expenseData = useMemo(() => {
        const categories = [
            { key: 'tax', label: 'Taxes', icon: Receipt, color: '#f87171', records: taxRecords, getAmount: r => Number(r.amount) || 0 },
            { key: 'utility', label: 'Utilities', icon: Droplets, color: '#60a5fa', records: utilityRecords, getAmount: r => Number(r.amount) || 0 },
            { key: 'insurance', label: 'Insurance', icon: Shield, color: '#34d399', records: insuranceRecords, getAmount: r => Number(r.premium) || 0 },
            { key: 'mgmt', label: 'Mgmt Fees', icon: Landmark, color: '#a78bfa', records: managementFees, getAmount: r => Number(r.amount) || 0 },
            { key: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#fbbf24', records: maintenanceRecords, getAmount: r => Number(r.cost) || 0 },
        ];

        let grandTotal = 0;
        const breakdown = categories.map(cat => {
            const total = cat.records.reduce((sum, r) => sum + cat.getAmount(r), 0);
            grandTotal += total;
            return { ...cat, total };
        });

        return { breakdown, grandTotal };
    }, [taxRecords, utilityRecords, insuranceRecords, managementFees, maintenanceRecords]);

    // All-time rent income
    const totalRentIncome = rentRecords
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);

    const netCashFlow = totalRentIncome - expenseData.grandTotal;

    // --- Monthly Trend (last 6 months) ---
    const monthlyTrend = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toISOString().slice(0, 7));
        }

        return months.map(month => {
            const income = rentRecords
                .filter(r => r.month === month && r.status === 'paid')
                .reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0);

            // Simple heuristic: expenses dated in this month
            const expenseForMonth = [
                ...taxRecords.filter(r => (r.dueDate || '').startsWith(month)),
                ...utilityRecords.filter(r => (r.date || '').startsWith(month)),
                ...managementFees.filter(r => (r.nextDueDate || '').startsWith(month)),
                ...maintenanceRecords.filter(r => (r.reportedDate || '').startsWith(month)),
            ].reduce((sum, r) => sum + (Number(r.amount) || Number(r.cost) || 0), 0);

            return { month, income, expense: expenseForMonth, net: income - expenseForMonth };
        });
    }, [rentRecords, taxRecords, utilityRecords, managementFees, maintenanceRecords]);

    // Max value for chart scaling
    const chartMax = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

    // --- Recent Activity ---
    const recentActivity = useMemo(() => {
        const items = [];

        rentRecords.slice(-5).forEach(r => {
            items.push({
                id: `rent-${r.id}`,
                type: 'income',
                icon: Wallet,
                color: 'var(--success)',
                label: `Rent ${r.status === 'paid' ? 'collected' : 'recorded'}`,
                detail: formatMonth(r.month),
                amount: Number(r.amountPaid || r.amountDue) || 0,
                date: r.paidDate || r.month + '-01',
            });
        });

        taxRecords.slice(-3).forEach(r => {
            items.push({
                id: `tax-${r.id}`,
                type: 'expense',
                icon: Receipt,
                color: '#f87171',
                label: r.type === 'quit_rent' ? 'Quit Rent' : 'Assessment Tax',
                detail: 'Tax Payment',
                amount: Number(r.amount) || 0,
                date: r.dueDate,
            });
        });

        maintenanceRecords.slice(-3).forEach(r => {
            items.push({
                id: `maint-${r.id}`,
                type: 'expense',
                icon: Wrench,
                color: '#fbbf24',
                label: r.description || 'Maintenance',
                detail: r.status === 'open' ? 'Open' : 'Resolved',
                amount: Number(r.cost) || 0,
                date: r.reportedDate,
            });
        });

        return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    }, [rentRecords, taxRecords, maintenanceRecords]);

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

            {/* Stats Grid — 2 rows of 3 */}
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
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Income</span>
                        <span className="stat-value">{formatCurrency(totalRentIncome)}</span>
                        {totalOutstanding > 0 && (
                            <span className="stat-detail">
                                <span className="badge badge-warning">{formatCurrency(totalOutstanding)} outstanding</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <ArrowDownRight size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">{formatCurrency(expenseData.grandTotal)}</span>
                        <span className="stat-detail">
                            <Link to="/expenses" className="badge badge-neutral" style={{ cursor: 'pointer', textDecoration: 'none' }}>View breakdown →</Link>
                        </span>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: netCashFlow >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Net Cash Flow</span>
                        <span className="stat-value" style={{ color: netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                        </span>
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

            {/* Two Column Layout */}
            {totalProperties > 0 && (
                <div className="dashboard-grid">
                    {/* Monthly Cash Flow Chart */}
                    <div className="dashboard-section">
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>
                                <BarChart3 size={18} style={{ marginRight: 6 }} />
                                Monthly Cash Flow
                            </h2>
                            <Link to="/cashflow" className="btn btn-ghost btn-sm">
                                Details <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="card" style={{ padding: 'var(--space-lg)' }}>
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--success)' }} /> Income</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--danger)' }} /> Expenses</span>
                            </div>
                            <div className="bar-chart">
                                {monthlyTrend.map(m => (
                                    <div key={m.month} className="bar-group">
                                        <div className="bars">
                                            <div
                                                className="bar bar-income"
                                                style={{ height: `${Math.max((m.income / chartMax) * 120, 2)}px` }}
                                                title={`Income: ${formatCurrency(m.income)}`}
                                            />
                                            <div
                                                className="bar bar-expense"
                                                style={{ height: `${Math.max((m.expense / chartMax) * 120, 2)}px` }}
                                                title={`Expenses: ${formatCurrency(m.expense)}`}
                                            />
                                        </div>
                                        <span className="bar-label">{new Date(m.month + '-01').toLocaleDateString('en', { month: 'short' })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="dashboard-section">
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>
                                <PieChart size={18} style={{ marginRight: 6 }} />
                                Expense Breakdown
                            </h2>
                            <Link to="/expenses" className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="card" style={{ padding: 'var(--space-lg)' }}>
                            {expenseData.grandTotal > 0 ? (
                                <div className="expense-breakdown">
                                    {expenseData.breakdown.filter(c => c.total > 0).map(cat => {
                                        const pct = Math.round((cat.total / expenseData.grandTotal) * 100);
                                        const Icon = cat.icon;
                                        return (
                                            <div key={cat.key} className="breakdown-row">
                                                <div className="breakdown-label">
                                                    <Icon size={16} style={{ color: cat.color }} />
                                                    <span>{cat.label}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: cat.color }} />
                                                </div>
                                                <div className="breakdown-value">
                                                    <span className="breakdown-amount">{formatCurrency(cat.total)}</span>
                                                    <span className="breakdown-pct">{pct}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="breakdown-total">
                                        <span>Total</span>
                                        <span>{formatCurrency(expenseData.grandTotal)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                                    <Receipt size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                    <p>No expenses recorded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity + Alerts side by side */}
            {totalProperties > 0 && (
                <div className="dashboard-grid">
                    {/* Recent Activity */}
                    <div className="dashboard-section">
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>
                                <Activity size={18} style={{ marginRight: 6 }} />
                                Recent Activity
                            </h2>
                        </div>
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {recentActivity.length > 0 ? (
                                <div className="activity-list">
                                    {recentActivity.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.id} className="activity-item">
                                                <div className="activity-icon" style={{ color: item.color }}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="activity-info">
                                                    <span className="activity-label">{item.label}</span>
                                                    <span className="activity-detail">{item.detail}</span>
                                                </div>
                                                <div className="activity-right">
                                                    <span className={`activity-amount ${item.type === 'income' ? 'income' : 'expense'}`}>
                                                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                                    </span>
                                                    <span className="activity-date">{formatDate(item.date)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                                    <Activity size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                    <p>No activity yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="dashboard-section">
                        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
                            <h2 className="section-title" style={{ fontSize: 'var(--font-lg)' }}>⏰ Upcoming Alerts</h2>
                            <Link to="/timeline" className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        {urgentAlerts.length > 0 ? (
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
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                                <AlertTriangle size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                                <p>No alerts — all clear!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Occupancy Bar */}
            {totalProperties > 0 && (
                <div className="dashboard-section">
                    <div className="card occupancy-card">
                        <div className="occupancy-header">
                            <span className="occupancy-label">Occupancy Rate</span>
                            <span className="occupancy-value">{occupancyRate}%</span>
                        </div>
                        <div className="occupancy-bar-track">
                            <div
                                className="occupancy-bar-fill"
                                style={{
                                    width: `${occupancyRate}%`,
                                    background: occupancyRate >= 80 ? 'var(--success)' : occupancyRate >= 50 ? 'var(--warning)' : 'var(--danger)',
                                }}
                            />
                        </div>
                        <div className="occupancy-details">
                            <span>{occupiedCount} of {totalProperties} occupied</span>
                            {vacantCount > 0 && <span style={{ color: 'var(--danger)' }}>{vacantCount} vacant</span>}
                        </div>
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
