import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency, formatDate, formatRelativeDate, formatMonth } from '../utils/formatters';
import {
    Building2, Wallet, AlertTriangle, TrendingUp,
    Plus, ArrowRight, Receipt, Droplets, Shield, Landmark, Wrench,
    ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Activity, Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/common/Modal';
import './Dashboard.css';

export default function Dashboard() {
    const [showCashflowModal, setShowCashflowModal] = useState(false);
    const [showExpensesModal, setShowExpensesModal] = useState(false);

    const {
        properties, filteredData, alerts, rentRecords,
        taxRecords, utilityRecords, insuranceRecords, managementFees, maintenanceRecords
    } = useApp();
    const { tenants, rentRecords: filteredRent, maintenanceRecords: filteredMaintenance } = filteredData;

    // --- Stats ---
    const totalProperties = properties.length;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Rent stats
    const thisMonthRent = filteredRent.filter(r => r.month === currentMonth);
    const totalCollected = thisMonthRent.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const totalExpected = thisMonthRent.reduce((sum, r) => sum + (r.amountDue || 0), 0);
    const totalOutstanding = totalExpected - totalCollected;

    // --- Open maintenance (kept for reference in other calculations if needed) ---
    const openMaintenance = filteredMaintenance.filter(m => m.status === 'open').length;

    // --- Expense Calculations ---
    const expenseData = useMemo(() => {
        const categories = [
            { key: 'tax', label: 'Taxes', icon: Receipt, color: '#f87171', records: taxRecords.filter(r => r.status === 'paid'), getAmount: r => Number(r.amount) || 0 },
            { key: 'utility', label: 'Utilities', icon: Droplets, color: '#60a5fa', records: utilityRecords.filter(r => r.status === 'paid' || !r.status), getAmount: r => Number(r.amount) || 0 },
            { key: 'insurance', label: 'Insurance', icon: Shield, color: '#34d399', records: insuranceRecords, getAmount: r => Number(r.premium) || 0 },
            { key: 'mgmt', label: 'Mgmt Fees', icon: Landmark, color: '#666666', records: managementFees.filter(r => r.status === 'paid' || !r.status), getAmount: r => Number(r.amount) || 0 },
            { key: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#fbbf24', records: maintenanceRecords.filter(r => r.status === 'closed' || r.status === 'resolved'), getAmount: r => Number(r.cost) || 0 },
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

            const expenseForMonth = [
                ...taxRecords.filter(r => r.status === 'paid' && (r.dueDate || '').startsWith(month)),
                ...utilityRecords.filter(r => (r.status === 'paid' || !r.status) && (r.date || '').startsWith(month)),
                ...managementFees.filter(r => (r.status === 'paid' || !r.status) && (r.nextDueDate || '').startsWith(month)),
                ...maintenanceRecords.filter(r => (r.status === 'closed' || r.status === 'resolved') && (r.reportedDate || '').startsWith(month)),
            ].reduce((sum, r) => sum + (Number(r.amount) || Number(r.cost) || 0), 0);

            return { month, income, expense: expenseForMonth, net: income - expenseForMonth };
        });
    }, [rentRecords, taxRecords, utilityRecords, managementFees, maintenanceRecords]);

    const chartMax = Math.max(...monthlyTrend.map(m => Math.max(m.income, m.expense)), 1);

    // --- Recent Activity ---
    const recentActivity = useMemo(() => {
        const items = [];

        rentRecords.filter(r => r.status === 'paid').slice(-5).forEach(r => {
            items.push({
                id: `rent-${r.id}`,
                type: 'income',
                icon: Wallet,
                color: 'var(--success)',
                label: 'Rent collected',
                detail: formatMonth(r.month),
                amount: Number(r.amountPaid || r.amountDue) || 0,
                date: r.paidDate || r.month + '-01',
            });
        });

        taxRecords.filter(r => r.status === 'paid').slice(-3).forEach(r => {
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

        maintenanceRecords.filter(r => r.status === 'closed' || r.status === 'resolved').slice(-3).forEach(r => {
            items.push({
                id: `maint-${r.id}`,
                type: 'expense',
                icon: Wrench,
                color: '#fbbf24',
                label: r.description || 'Maintenance',
                detail: 'Resolved',
                amount: Number(r.cost) || 0,
                date: r.reportedDate,
            });
        });

        return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    }, [rentRecords, taxRecords, maintenanceRecords]);

    const allExpenses = useMemo(() => {
        const items = [];
        taxRecords.filter(r => r.status === 'paid').forEach(r => items.push({ id: `tax-${r.id}`, category: 'Tax', date: r.dueDate, amount: r.amount, desc: r.type }));
        utilityRecords.filter(r => r.status === 'paid' || !r.status).forEach(r => items.push({ id: `util-${r.id}`, category: 'Utility', date: r.date, amount: r.amount, desc: r.type }));
        insuranceRecords.forEach(r => items.push({ id: `ins-${r.id}`, category: 'Insurance', date: r.startDate, amount: r.premium, desc: r.provider }));
        managementFees.filter(r => r.status === 'paid' || !r.status).forEach(r => items.push({ id: `mgmt-${r.id}`, category: 'Mgmt Fee', date: r.nextDueDate, amount: r.amount, desc: 'Management Fee' }));
        maintenanceRecords.filter(r => r.status === 'closed' || r.status === 'resolved').forEach(r => items.push({ id: `maint-${r.id}`, category: 'Maintenance', date: r.reportedDate, amount: r.cost, desc: r.description }));
        return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [taxRecords, utilityRecords, insuranceRecords, managementFees, maintenanceRecords]);

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

            {/* Consolidated Stats Overview */}
            <div className="stats-overview">
                <div className="stat-item">
                    <span className="stat-label">Total Income</span>
                    <span className="stat-value">{formatCurrency(totalRentIncome)}</span>
                    {totalOutstanding > 0 && (
                        <span className="stat-detail">
                            <span style={{ color: 'var(--warning)', fontSize: 12 }}>{formatCurrency(totalOutstanding)} outstanding</span>
                        </span>
                    )}
                </div>

                <div className="stat-item clickable" onClick={() => setShowExpensesModal(true)}>
                    <span className="stat-label">Total Expenses</span>
                    <span className="stat-value">{formatCurrency(expenseData.grandTotal)}</span>
                    <ArrowRight size={16} className="stat-arrow" />
                </div>

                <div className="stat-item">
                    <span className="stat-label">Net Cash Flow</span>
                    <span className="stat-value" style={{ color: netCashFlow >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                    </span>
                </div>

                <div className="stat-item">
                    <span className="stat-label">Action Required</span>
                    <span className="stat-value">{alerts.length}</span>
                    {openMaintenance > 0 && (
                        <span className="stat-detail">
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>incl. {openMaintenance} maintenance</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Charts Row */}
            {totalProperties > 0 && (
                <div className="dashboard-grid asymmetric">
                    {/* Monthly Cash Flow */}
                    <div className="card" style={{ padding: 0 }}>
                        <div className="card-header">
                            <h2 className="card-title">Monthly Cash Flow</h2>
                            <button onClick={() => setShowCashflowModal(true)} className="btn btn-ghost btn-sm">
                                Details <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="chart-legend">
                                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Income</span>
                                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--text-tertiary)' }} /> Expenses</span>
                            </div>
                            <div className="bar-chart">
                                {monthlyTrend.map(m => (
                                    <div key={m.month} className="bar-group">
                                        <div className="bars">
                                            {m.income > 0 && <div className="bar bar-income" style={{ height: `${(m.income / chartMax) * 120}px` }} title={`Income: ${formatCurrency(m.income)}`} />}
                                            {m.expense > 0 && <div className="bar bar-expense" style={{ height: `${(m.expense / chartMax) * 120}px` }} title={`Expenses: ${formatCurrency(m.expense)}`} />}
                                        </div>
                                        <span className="bar-label">{new Date(m.month + '-01').toLocaleDateString('en', { month: 'short' })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="card" style={{ padding: 0 }}>
                        <div className="card-header">
                            <h2 className="card-title">Expense Breakdown</h2>
                            <button onClick={() => setShowExpensesModal(true)} className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="card-body">
                            {expenseData.grandTotal > 0 ? (
                                <div className="expense-breakdown">
                                    {expenseData.breakdown.filter(c => c.total > 0).map(cat => {
                                        const pct = Math.round((cat.total / expenseData.grandTotal) * 100);
                                        return (
                                            <div key={cat.key} className="breakdown-row">
                                                <div className="breakdown-label">
                                                    <span>{cat.label}</span>
                                                </div>
                                                <div className="breakdown-bar-track">
                                                    <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: 'var(--text-tertiary)' }} />
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
                                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-tertiary)' }}>
                                    <p style={{ fontSize: 13 }}>No expenses recorded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Activity + Alerts */}
            {totalProperties > 0 && (
                <div className="dashboard-grid">
                    {/* Recent Activity */}
                    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header">
                            <h2 className="card-title">Recent Activity</h2>
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            {recentActivity.length > 0 ? (
                                <div className="activity-list">
                                    {recentActivity.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.id} className="activity-item">
                                                <div className="activity-icon" style={{ color: 'var(--text-tertiary)' }}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="activity-info">
                                                    <span className="activity-label">{item.label}</span>
                                                    <span className="activity-detail">{item.detail}</span>
                                                </div>
                                                <div className="activity-right">
                                                    <span className="activity-amount" style={{ color: item.type === 'income' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                                    </span>
                                                    <span className="activity-date">{formatDate(item.date)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)', height: '100%' }}>
                                    <p style={{ fontSize: 13 }}>No activity yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Alerts */}
                    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header">
                            <h2 className="card-title">Upcoming Alerts</h2>
                            <Link to="/timeline" className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div style={{ flex: 1 }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)', height: '100%' }}>
                                    <p style={{ fontSize: 13 }}>No alerts — all clear</p>
                                </div>
                            )}
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

            <Modal isOpen={showCashflowModal} onClose={() => setShowCashflowModal(false)} title="Monthly Cash Flow Details">
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Month</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Income</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Expenses</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyTrend.map(m => (
                                <tr key={m.month} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 8px' }}>{new Date(m.month + '-01').toLocaleDateString('en', { month: 'long', year: 'numeric' })}</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--success)' }}>{formatCurrency(m.income)}</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--danger)' }}>{formatCurrency(m.expense)}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: m.net >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>

            <Modal isOpen={showExpensesModal} onClose={() => setShowExpensesModal(false)} title="All Expenses">
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allExpenses.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 8px' }}>{formatDate(e.date) || '-'}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span className="badge badge-neutral">{e.category}</span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>{e.desc}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(e.amount || 0)}</td>
                                </tr>
                            ))}
                            {allExpenses.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No expenses recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
}
