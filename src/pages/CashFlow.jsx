import React, { useCallback, useMemo, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency } from '../utils/formatters';
import CustomSelect from '../components/common/CustomSelect';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';
import './CashFlow.css';

export default function CashFlow() {
    const { properties, rentRecords, taxRecords, utilityRecords, insuranceRecords, maintenanceRecords, managementFees } = useApp();
    const [filterProp, setFilterProp] = useState('');
    const [range, setRange] = useState('year'); // 'month', 'quarter', 'year'

    const rangeMonths = range === 'month' ? 1 : range === 'quarter' ? 3 : 12;
    const { startDate, endDate, months } = useMemo(() => {
        const now = new Date();
        const start = subMonths(startOfMonth(now), rangeMonths - 1);
        const end = endOfMonth(now);
        return {
            startDate: start,
            endDate: end,
            months: eachMonthOfInterval({ start, end }),
        };
    }, [rangeMonths]);

    const matchesProperty = useCallback(
        (record) => !filterProp || record.propertyId === filterProp,
        [filterProp]
    );

    // Income: paid rent in range
    const incomeData = useMemo(() => {
        return rentRecords
            .filter(matchesProperty)
            .filter(r => r.status === 'paid' && r.paymentDate)
            .filter(r => {
                const d = parseISO(r.paymentDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            });
    }, [rentRecords, matchesProperty, startDate, endDate]);

    const totalIncome = incomeData.reduce((s, r) => s + (r.amountPaid || 0), 0);

    // Expenses: maintenance costs
    const maintenanceCosts = useMemo(() => {
        return maintenanceRecords
            .filter(matchesProperty)
            .filter(m => m.cost > 0 && m.reportedDate)
            .filter(m => {
                const d = parseISO(m.reportedDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, m) => s + (m.cost || 0), 0);
    }, [maintenanceRecords, matchesProperty, startDate, endDate]);

    // Expenses: taxes paid
    const taxCosts = useMemo(() => {
        return taxRecords
            .filter(matchesProperty)
            .filter(t => t.status === 'paid' && t.amount && t.dueDate)
            .filter(t => {
                const d = parseISO(t.dueDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, t) => s + (t.amount || 0), 0);
    }, [taxRecords, matchesProperty, startDate, endDate]);

    // Expenses: insurance
    const insuranceCosts = useMemo(() => {
        return insuranceRecords
            .filter(matchesProperty)
            .filter(ins => ins.startDate)
            .filter(ins => {
                const d = parseISO(ins.startDate);
                return isWithinInterval(d, { start: startDate, end: endDate });
            })
            .reduce((s, ins) => s + (Number(ins.premiumAmount ?? ins.premium ?? ins.amount ?? 0)), 0);
    }, [insuranceRecords, matchesProperty, startDate, endDate]);

    // Expenses: management fees (annualized from frequency)
    const mgmtCosts = useMemo(() => {
        return managementFees
            .filter(matchesProperty)
            .filter(f => f.status === 'paid' || f.status === 'active')
            .filter(f => !f.nextDueDate || f.status === 'active' || isWithinInterval(parseISO(f.nextDueDate), { start: startDate, end: endDate }))
            .reduce((s, f) => {
                const amt = Number(f.amount) || 0;
                if (f.status === 'paid') return s + amt;
                if (f.frequency === 'monthly') return s + amt * rangeMonths;
                if (f.frequency === 'quarterly') return s + amt * Math.ceil(rangeMonths / 3);
                if (f.frequency === 'yearly') return s + (rangeMonths >= 12 ? amt : amt * rangeMonths / 12);
                return s + amt;
            }, 0);
    }, [managementFees, matchesProperty, rangeMonths, startDate, endDate]);

    const totalExpenses = maintenanceCosts + taxCosts + insuranceCosts + mgmtCosts;
    const netProfit = totalIncome - totalExpenses;

    // Monthly breakdown for chart
    const monthlyData = useMemo(() => {
        return months.map(month => {
            const monthStr = format(month, 'yyyy-MM');

            const income = rentRecords
                .filter(matchesProperty)
                .filter(r => r.status === 'paid' && r.month === monthStr)
                .reduce((s, r) => s + (r.amountPaid || 0), 0);

            const maintenance = maintenanceRecords
                .filter(matchesProperty)
                .filter(m => m.cost > 0 && m.reportedDate && format(parseISO(m.reportedDate), 'yyyy-MM') === monthStr)
                .reduce((s, m) => s + (m.cost || 0), 0);

            const tax = taxRecords
                .filter(matchesProperty)
                .filter(t => t.status === 'paid' && t.amount && t.dueDate && format(parseISO(t.dueDate), 'yyyy-MM') === monthStr)
                .reduce((s, t) => s + (Number(t.amount) || 0), 0);

            const utilities = utilityRecords
                .filter(matchesProperty)
                .filter(u => (u.status === 'paid' || !u.status) && u.date && format(parseISO(u.date), 'yyyy-MM') === monthStr)
                .reduce((s, u) => s + (Number(u.amount) || 0), 0);

            const insurance = insuranceRecords
                .filter(matchesProperty)
                .filter(ins => ins.startDate && format(parseISO(ins.startDate), 'yyyy-MM') === monthStr)
                .reduce((s, ins) => s + (Number(ins.premiumAmount ?? ins.premium ?? ins.amount ?? 0)), 0);

            const management = managementFees
                .filter(matchesProperty)
                .filter(f => (f.status === 'paid' || !f.status) && f.nextDueDate && format(parseISO(f.nextDueDate), 'yyyy-MM') === monthStr)
                .reduce((s, f) => s + (Number(f.amount) || 0), 0);

            const expenses = maintenance + tax + utilities + insurance + management;

            return { month: format(month, 'MMM'), income, expenses };
        });
    }, [months, rentRecords, taxRecords, utilityRecords, insuranceRecords, maintenanceRecords, managementFees, matchesProperty]);

    const maxBar = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)), 1);

    return (
        <div className="cashflow-page">

            {/* Header */}
            <div className="section-header">
                <div>
                    <h1 className="section-title">Cash Flow</h1>
                    <p className="section-subtitle">Income & expenses over time</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="cashflow-filter-select">
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
            <div className="cashflow-kpi-grid">
                {/* Income */}
                <div className="card cashflow-kpi-card">
                    <span className="cashflow-kpi-label">Total Income</span>
                    <div className="cashflow-kpi-value-row">
                        <span className="cashflow-kpi-value income">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="cashflow-meter">
                        <div className="cashflow-meter-fill income" style={{ width: totalIncome > 0 ? '100%' : '0%' }} />
                    </div>
                </div>

                {/* Expenses */}
                <div className="card cashflow-kpi-card">
                    <span className="cashflow-kpi-label">Total Expenses</span>
                    <div className="cashflow-kpi-value-row">
                        <span className="cashflow-kpi-value expense">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="cashflow-meter">
                        <div className="cashflow-meter-fill expense" style={{ width: totalIncome > 0 ? `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` : '0%' }} />
                    </div>
                </div>

                {/* Net */}
                <div className="card cashflow-kpi-card">
                    <span className="cashflow-kpi-label">Net Profit</span>
                    <div className="cashflow-kpi-value-row">
                        <span className={`cashflow-kpi-value ${netProfit >= 0 ? 'positive' : 'negative'}`}>
                            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
                        </span>
                    </div>
                    <div className="cashflow-meter">
                        <div className={`cashflow-meter-fill ${netProfit >= 0 ? 'positive' : 'negative'}`} style={{ width: totalIncome > 0 ? `${Math.max(Math.min((Math.abs(netProfit) / totalIncome) * 100, 100), 0)}%` : '0%' }} />
                    </div>
                </div>
            </div>

            {/* Chart + Breakdown side by side */}
            <div className="cashflow-content-grid">

                {/* Bar Chart */}
                <div className="card cashflow-card">
                    <div className="cashflow-card-header">
                        <h3 className="cashflow-card-title">Monthly Breakdown</h3>
                        <div className="cashflow-legend">
                            <div className="cashflow-legend-item">
                                <div className="cashflow-legend-dot income" />
                                <span>Income</span>
                            </div>
                            <div className="cashflow-legend-item">
                                <div className="cashflow-legend-dot expense" />
                                <span>Expenses</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart area */}
                    <div className="cashflow-chart">
                        {/* Horizontal grid lines */}
                        {[100, 75, 50, 25].map(pct => (
                            <div key={pct} className="cashflow-grid-line" style={{ top: `${(100 - pct) / 100 * 160}px` }} />
                        ))}

                        <div className="cashflow-bars">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="cashflow-bar-group">
                                    <div className="cashflow-bar-pair">
                                        <div
                                            className="cashflow-bar income"
                                            style={{ height: `${Math.max((d.income / maxBar) * 160, d.income > 0 ? 3 : 0)}px` }}
                                            title={`${d.month} Income: ${formatCurrency(d.income)}`}
                                        />
                                        <div
                                            className="cashflow-bar expense"
                                            style={{ height: `${Math.max((d.expenses / maxBar) * 160, d.expenses > 0 ? 3 : 0)}px` }}
                                            title={`${d.month} Expenses: ${formatCurrency(d.expenses)}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Month labels */}
                        <div className="cashflow-month-labels">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="cashflow-month-label">{d.month}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="card cashflow-card">
                    <h3 className="cashflow-card-title">Expenses</h3>

                    {totalExpenses === 0 ? (
                        <p className="cashflow-empty">No expenses in this period</p>
                    ) : (
                        <div className="cashflow-expense-list">
                            {[
                                { label: 'Maintenance', amount: maintenanceCosts },
                                { label: 'Taxes', amount: taxCosts },
                                { label: 'Insurance', amount: insuranceCosts },
                                { label: 'Management', amount: mgmtCosts },
                            ].filter(e => e.amount > 0).map((exp, i) => (
                                <div key={i}>
                                    <div className="cashflow-expense-row">
                                        <span className="cashflow-expense-label">{exp.label}</span>
                                        <span className="cashflow-expense-amount">{formatCurrency(exp.amount)}</span>
                                    </div>
                                    <div className="cashflow-expense-track">
                                        <div className="cashflow-expense-fill" style={{ width: `${(exp.amount / totalExpenses) * 100}%` }} />
                                    </div>
                                </div>
                            ))}

                            <div className="cashflow-total-row">
                                <span>Total</span>
                                <strong>{formatCurrency(totalExpenses)}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
