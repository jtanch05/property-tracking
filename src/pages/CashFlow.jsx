import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';

export default function CashFlow() {
    const { properties, rentRecords, taxRecords, insuranceRecords, maintenanceRecords, managementFees } = useApp();
    const [filterProp, setFilterProp] = useState('');
    const [range, setRange] = useState('year'); // 'month', 'quarter', 'year'

    // Date range
    const now = new Date();
    const rangeMonths = range === 'month' ? 1 : range === 'quarter' ? 3 : 12;
    const startDate = subMonths(startOfMonth(now), rangeMonths - 1);
    const endDate = endOfMonth(now);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Filter by property
    const propFilter = (r) => !filterProp || r.propertyId === filterProp;

    // Income: paid rent in range
    const incomeData = useMemo(() => {
        return rentRecords
            .filter(propFilter)
            .filter(r => r.status === 'paid' && r.paymentDate)
            .filter(r => {
                const d = parseISO(r.paymentDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            });
    }, [rentRecords, filterProp, startDate, endDate]);

    const totalIncome = incomeData.reduce((s, r) => s + (r.amountPaid || 0), 0);

    // Expenses: maintenance costs
    const maintenanceCosts = useMemo(() => {
        return maintenanceRecords
            .filter(propFilter)
            .filter(m => m.cost > 0 && m.reportedDate)
            .filter(m => {
                const d = parseISO(m.reportedDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, m) => s + (m.cost || 0), 0);
    }, [maintenanceRecords, filterProp, startDate, endDate]);

    // Expenses: taxes paid
    const taxCosts = useMemo(() => {
        return taxRecords
            .filter(propFilter)
            .filter(t => t.status === 'paid' && t.amount && t.dueDate)
            .filter(t => {
                const d = parseISO(t.dueDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, t) => s + (t.amount || 0), 0);
    }, [taxRecords, filterProp, startDate, endDate]);

    // Expenses: insurance
    const insuranceCosts = useMemo(() => {
        return insuranceRecords
            .filter(propFilter)
            .filter(ins => ins.startDate)
            .filter(ins => {
                const d = parseISO(ins.startDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, ins) => s + (ins.coverageAmount ? ins.coverageAmount * 0.005 : 0), 0); // Estimate ~0.5% of coverage as premium
    }, [insuranceRecords, filterProp, startDate, endDate]);

    // Expenses: management fees (annualized from frequency)
    const mgmtCosts = useMemo(() => {
        return managementFees
            .filter(propFilter)
            .filter(f => f.status === 'active')
            .reduce((s, f) => {
                const amt = Number(f.amount) || 0;
                if (f.frequency === 'monthly') return s + amt * rangeMonths;
                if (f.frequency === 'quarterly') return s + amt * Math.ceil(rangeMonths / 3);
                if (f.frequency === 'yearly') return s + (rangeMonths >= 12 ? amt : amt * rangeMonths / 12);
                return s + amt;
            }, 0);
    }, [managementFees, filterProp, rangeMonths]);

    const totalExpenses = maintenanceCosts + taxCosts + insuranceCosts + mgmtCosts;
    const netProfit = totalIncome - totalExpenses;

    // Monthly breakdown for chart
    const monthlyData = useMemo(() => {
        return months.map(month => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const monthStr = format(month, 'yyyy-MM');

            const income = rentRecords
                .filter(propFilter)
                .filter(r => r.status === 'paid' && r.month === monthStr)
                .reduce((s, r) => s + (r.amountPaid || 0), 0);

            const expenses = maintenanceRecords
                .filter(propFilter)
                .filter(m => m.cost > 0 && m.reportedDate && format(parseISO(m.reportedDate), 'yyyy-MM') === monthStr)
                .reduce((s, m) => s + (m.cost || 0), 0);

            return { month: format(month, 'MMM'), income, expenses };
        });
    }, [months, rentRecords, maintenanceRecords, filterProp]);

    const maxBar = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)), 1);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Cash Flow</h1>
                    <p className="section-subtitle">Income vs Expenses</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)', gap: 12 }}>
                <select className="filter-select" value={filterProp} onChange={e => setFilterProp(e.target.value)} style={{ maxWidth: 200 }}>
                    <option value="">All Properties</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                </select>
                <div className="filter-tabs">
                    {[{ v: 'month', l: 'This Month' }, { v: 'quarter', l: 'Quarter' }, { v: 'year', l: 'Year' }].map(r => (
                        <button key={r.v} className={`btn btn-sm ${range === r.v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRange(r.v)}>{r.l}</button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Income</span>
                        <span className="stat-value">{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <ArrowDownRight size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">{formatCurrency(totalExpenses)}</span>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: netProfit >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Net Profit</span>
                        <span className="stat-value" style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-md)' }}>Monthly Breakdown</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 180 }}>
                    {monthlyData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 140, width: '100%' }}>
                                <div style={{ flex: 1, background: 'var(--success)', borderRadius: '4px 4px 0 0', height: `${Math.max((d.income / maxBar) * 140, 2)}px`, opacity: 0.8, transition: 'height 0.3s ease' }} title={`Income: ${formatCurrency(d.income)}`} />
                                <div style={{ flex: 1, background: 'var(--danger)', borderRadius: '4px 4px 0 0', height: `${Math.max((d.expenses / maxBar) * 140, 2)}px`, opacity: 0.8, transition: 'height 0.3s ease' }} title={`Expenses: ${formatCurrency(d.expenses)}`} />
                            </div>
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{d.month}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)', opacity: 0.8 }} /><span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Income</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)', opacity: 0.8 }} /><span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Expenses</span></div>
                </div>
            </div>

            {/* Expense Breakdown */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--font-md)' }}>Expense Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        { label: 'Maintenance & Repairs', amount: maintenanceCosts, color: 'var(--warning)' },
                        { label: 'Taxes (Cukai)', amount: taxCosts, color: 'var(--danger)' },
                        { label: 'Insurance', amount: insuranceCosts, color: 'var(--info)' },
                        { label: 'Management Fees', amount: mgmtCosts, color: 'var(--accent)' },
                    ].filter(e => e.amount > 0).map((exp, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: exp.color }} />
                                <span>{exp.label}</span>
                            </div>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</span>
                        </div>
                    ))}
                    {totalExpenses === 0 && (
                        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>No expenses recorded in this period</p>
                    )}
                    {totalExpenses > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)', fontWeight: 700 }}>
                            <span>Total Expenses</span>
                            <span>{formatCurrency(totalExpenses)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
