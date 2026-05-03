import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency } from '../utils/formatters';
import CustomSelect from '../components/common/CustomSelect';
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

            {/* Header */}
            <div className="section-header">
                <div>
                    <h1 className="section-title">Cash Flow</h1>
                    <p className="section-subtitle">Income & expenses over time</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ width: '280px' }}>
                    <CustomSelect
                        variant="filter"
                        value={filterProp}
                        onChange={setFilterProp}
                        options={[{ value: '', label: 'All Properties' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                        placeholder="All Properties"
                    />
                </div>
                <div className="filter-tabs">
                    {[{ v: 'month', l: 'Month' }, { v: 'quarter', l: 'Quarter' }, { v: 'year', l: 'Year' }].map(r => (
                        <button key={r.v} className={`btn btn-sm ${range === r.v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRange(r.v)}>{r.l}</button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                {/* Income */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Income</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>{formatCurrency(totalIncome)}</span>
                    </div>
                    <div style={{ marginTop: 10, height: 3, background: 'var(--bg-hover)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: totalIncome > 0 ? '100%' : '0%', background: 'var(--success)', borderRadius: 99, opacity: 0.7 }} />
                    </div>
                </div>

                {/* Expenses */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Expenses</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)', lineHeight: 1 }}>{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div style={{ marginTop: 10, height: 3, background: 'var(--bg-hover)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: totalIncome > 0 ? `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` : '0%', background: 'var(--danger)', borderRadius: 99, opacity: 0.7 }} />
                    </div>
                </div>

                {/* Net */}
                <div className="card" style={{ padding: '20px 24px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Net Profit</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
                            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                        </span>
                    </div>
                    <div style={{ marginTop: 10, height: 3, background: 'var(--bg-hover)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: totalIncome > 0 ? `${Math.max(Math.min((Math.abs(netProfit) / totalIncome) * 100, 100), 0)}%` : '0%', background: netProfit >= 0 ? 'var(--success)' : 'var(--danger)', borderRadius: 99, opacity: 0.7 }} />
                    </div>
                </div>
            </div>

            {/* Chart + Breakdown side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-md)', alignItems: 'start' }}>

                {/* Bar Chart */}
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Monthly Breakdown</h3>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success)', opacity: 0.8 }} />
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Income</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--danger)', opacity: 0.8 }} />
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Expenses</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart area */}
                    <div style={{ position: 'relative' }}>
                        {/* Horizontal grid lines */}
                        {[100, 75, 50, 25].map(pct => (
                            <div key={pct} style={{ position: 'absolute', top: `${(100 - pct) / 100 * 160}px`, left: 0, right: 0, borderTop: '1px dashed var(--border)', opacity: 0.4 }} />
                        ))}

                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 160, position: 'relative', zIndex: 1 }}>
                            {monthlyData.map((d, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%' }}>
                                        <div
                                            style={{ flex: 1, background: 'var(--success)', borderRadius: '3px 3px 0 0', height: `${Math.max((d.income / maxBar) * 160, d.income > 0 ? 3 : 0)}px`, opacity: 0.75, transition: 'height 0.4s ease', cursor: 'default' }}
                                            title={`${d.month} Income: ${formatCurrency(d.income)}`}
                                        />
                                        <div
                                            style={{ flex: 1, background: 'var(--danger)', borderRadius: '3px 3px 0 0', height: `${Math.max((d.expenses / maxBar) * 160, d.expenses > 0 ? 3 : 0)}px`, opacity: 0.75, transition: 'height 0.4s ease', cursor: 'default' }}
                                            title={`${d.month} Expenses: ${formatCurrency(d.expenses)}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Month labels */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                            {monthlyData.map((d, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Expenses</h3>

                    {totalExpenses === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)', textAlign: 'center', padding: '24px 0' }}>No expenses in this period</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { label: 'Maintenance', amount: maintenanceCosts },
                                { label: 'Taxes', amount: taxCosts },
                                { label: 'Insurance', amount: insuranceCosts },
                                { label: 'Management', amount: mgmtCosts },
                            ].filter(e => e.amount > 0).map((exp, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{exp.label}</span>
                                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{formatCurrency(exp.amount)}</span>
                                    </div>
                                    <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 99 }}>
                                        <div style={{ height: '100%', width: `${(exp.amount / totalExpenses) * 100}%`, background: 'var(--danger)', borderRadius: 99, opacity: 0.65 }} />
                                    </div>
                                </div>
                            ))}

                            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Total</span>
                                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
