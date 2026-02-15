import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency, formatDate } from '../utils/formatters';
import { parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Receipt, Droplets, Shield, Landmark, Wrench, Plus, Filter, Search, CheckCircle, AlertTriangle } from 'lucide-react';

const CATEGORIES = {
    all: { label: 'All Expenses', icon: null },
    tax: { label: 'Taxes', icon: Receipt, color: 'var(--danger)', bg: 'var(--danger-bg)' },
    utility: { label: 'Utilities', icon: Droplets, color: 'var(--info)', bg: 'var(--info-bg)' },
    insurance: { label: 'Insurance', icon: Shield, color: 'var(--success)', bg: 'var(--success-bg)' },
    mgmt: { label: 'Mgmt Fees', icon: Landmark, color: 'var(--accent)', bg: 'var(--accent-bg)' },
    maintenance: { label: 'Maintenance', icon: Wrench, color: 'var(--warning)', bg: 'var(--warning-bg)' }
};

export default function Expenses() {
    const {
        properties,
        taxRecords,
        utilityRecords,
        insuranceRecords,
        managementFees,
        maintenanceRecords
    } = useApp();

    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Normalize all records into a standardized structure
    const allExpenses = useMemo(() => {
        const list = [];

        // Taxes
        taxRecords.forEach(r => list.push({
            id: r.id,
            type: 'tax',
            date: r.dueDate,
            amount: Number(r.amount),
            status: r.status, // paid, pending, overdue
            propertyId: r.propertyId,
            description: r.type === 'quit_rent' ? 'Quit Rent' : 'Assessment Tax',
            raw: r
        }));

        // Utilities
        utilityRecords.forEach(r => list.push({
            id: r.id,
            type: 'utility',
            date: r.date,
            amount: Number(r.amount),
            status: r.status,
            propertyId: r.propertyId,
            description: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Bill`,
            raw: r
        }));

        // Insurance
        insuranceRecords.forEach(r => list.push({
            id: r.id,
            type: 'insurance',
            date: r.startDate, // Using start date as the expense date
            amount: Number(r.coverageAmount) * 0.005, // Estimated premium? Or we need a specific 'cost' field
            status: 'active',
            propertyId: r.propertyId,
            description: `${r.insuranceType} Policy`,
            raw: r
        }));

        // Management Fees
        managementFees.forEach(r => list.push({
            id: r.id,
            type: 'mgmt',
            date: r.nextDueDate,
            amount: Number(r.amount),
            status: r.status,
            propertyId: r.propertyId,
            description: `${r.provider} Fee`,
            raw: r
        }));

        // Maintenance
        maintenanceRecords.forEach(r => list.push({
            id: r.id,
            type: 'maintenance',
            date: r.reportedDate,
            amount: Number(r.cost),
            status: r.status === 'closed' ? 'paid' : 'pending',
            propertyId: r.propertyId,
            description: r.description,
            raw: r
        }));

        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [taxRecords, utilityRecords, insuranceRecords, managementFees, maintenanceRecords]);

    // Filtering
    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(item => {
            if (filterCategory !== 'all' && item.type !== filterCategory) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const prop = properties.find(p => p.id === item.propertyId);
                const propName = prop ? prop.nickname.toLowerCase() : '';
                return (
                    item.description.toLowerCase().includes(term) ||
                    propName.includes(term) ||
                    formatCurrency(item.amount).includes(term)
                );
            }
            return true;
        });
    }, [allExpenses, filterCategory, searchTerm, properties]);

    const totalAmount = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Expenses</h1>
                    <p className="section-subtitle">Track taxes, utilities, insurance, fees & repairs</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs" style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto' }}>
                {Object.entries(CATEGORIES).map(([key, config]) => {
                    const Icon = config.icon;
                    const isActive = filterCategory === key;
                    return (
                        <button
                            key={key}
                            className={`filter-tab ${isActive ? 'active' : ''}`}
                            onClick={() => setFilterCategory(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: isActive ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {Icon && <Icon size={16} />}
                            <span>{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Expenses List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Property</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(item => {
                                    const CategoryConfig = CATEGORIES[item.type];
                                    const Icon = CategoryConfig.icon;
                                    const prop = properties.find(p => p.id === item.propertyId);

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    color: CategoryConfig.color,
                                                    fontWeight: 500
                                                }}>
                                                    <div style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        background: CategoryConfig.bg,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <span style={{ fontSize: 13 }}>{CategoryConfig.label}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{item.description}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                                {prop ? prop.nickname : 'Unknown'}
                                            </td>
                                            <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                                {formatDate(item.date)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${item.status === 'paid' || item.status === 'active' ? 'success' : item.status === 'overdue' ? 'danger' : 'warning'}`}>
                                                    {item.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        No expenses found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                    <td colSpan="5" style={{ textAlign: 'right' }}>Total</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalAmount)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div >
    );
}
