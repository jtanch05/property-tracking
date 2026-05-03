import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { formatCurrency, formatDate } from '../utils/formatters';
import { parseISO, addDays } from 'date-fns';
import { Receipt, Droplets, Shield, Landmark, Plus, Search, CheckCircle, Edit3, Trash2, FileText, BadgeCheck } from 'lucide-react';
import { exportToPDF } from '../utils/export';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ToggleGroup from '../components/common/ToggleGroup';
import CustomSelect from '../components/common/CustomSelect';
import { UTILITY_TYPES, INSURANCE_TYPES, MANAGEMENT_FEE_TYPES } from '../data/malaysiaData';

const CATEGORIES = {
    all: { label: 'All Expenses', icon: null },
    tax: { label: 'Taxes', icon: Receipt, color: 'var(--danger)', bg: 'var(--danger-bg)' },
    utility: { label: 'Utilities', icon: Droplets, color: 'var(--info)', bg: 'var(--info-bg)' },
    insurance: { label: 'Insurance', icon: Shield, color: 'var(--success)', bg: 'var(--success-bg)' },
    mgmt: { label: 'Mgmt Fees', icon: Landmark, color: 'var(--accent)', bg: 'var(--accent-bg)' }
};

export default function Expenses({ embeddedPropertyId = null }) {
    const {
        properties,
        taxRecords,
        utilityRecords,
        insuranceRecords,
        managementFees,
        addTaxRecord,
        addUtilityRecord,
        addInsuranceRecord,
        addManagementFee,
        updateTaxRecord,
        updateUtilityRecord,
        updateInsuranceRecord,
        updateManagementFee,
        deleteTaxRecord,
        deleteUtilityRecord,
        deleteInsuranceRecord,
        deleteManagementFee
    } = useApp();

    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [form, setForm] = useState({
        expenseCategory: 'utility',
        propertyId: embeddedPropertyId || (properties[0]?.id || ''),
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        specificType: '',
        notes: '',
        taxDeductible: null
    });

    function openAdd() {
        setForm({
            expenseCategory: 'utility',
            propertyId: embeddedPropertyId || (properties.length > 0 ? properties[0].id : ''),
            amount: '',
            date: new Date().toISOString().split('T')[0],
            status: 'paid',
            specificType: '',
            notes: '',
            taxDeductible: null
        });
        setEditingItem(null);
        setShowForm(true);
    }

    function openEdit(item) {
        setEditingItem(item);
        setForm({
            expenseCategory: item.type,
            propertyId: item.propertyId,
            amount: item.amount,
            date: item.date,
            status: item.status,
            specificType: item.raw.taxType || item.raw.type || item.raw.insuranceType || item.raw.feeType || '',
            notes: item.raw.notes || '',
            taxDeductible: item.raw.taxDeductible ?? null
        });
        setShowForm(true);
    }

    function handleDeleteConf() {
        if (!deleteItem) return;
        if (deleteItem.type === 'tax') deleteTaxRecord(deleteItem.id);
        if (deleteItem.type === 'utility') deleteUtilityRecord(deleteItem.id);
        if (deleteItem.type === 'insurance') deleteInsuranceRecord(deleteItem.id);
        if (deleteItem.type === 'mgmt') deleteManagementFee(deleteItem.id);
        setDeleteItem(null);
    }

    function handleSubmit(e) {
        e.preventDefault();
        const amt = Number(form.amount) || 0;
        const payload = { propertyId: form.propertyId, amount: amt, status: form.status, notes: form.notes, taxDeductible: form.taxDeductible };

        if (editingItem) {
            if (form.expenseCategory === 'tax') updateTaxRecord(editingItem.id, { ...payload, dueDate: form.date, paymentDate: form.status === 'paid' ? form.date : '', taxType: form.specificType, type: form.specificType });
            else if (form.expenseCategory === 'utility') updateUtilityRecord(editingItem.id, { ...payload, date: form.date, type: form.specificType || 'other' });
            else if (form.expenseCategory === 'insurance') updateInsuranceRecord(editingItem.id, { ...payload, coverageAmount: amt * 200, startDate: form.date, expiryDate: addDays(parseISO(form.date), 365).toISOString().split('T')[0], insuranceType: form.specificType || 'fire', premiumAmount: amt });
            else if (form.expenseCategory === 'mgmt') updateManagementFee(editingItem.id, { ...payload, nextDueDate: form.date, provider: 'Management Office', feeType: form.specificType || 'other', status: form.status === 'paid' ? 'active' : 'pending' });
        } else {
            if (form.expenseCategory === 'tax') addTaxRecord({ ...payload, dueDate: form.date, paymentDate: form.status === 'paid' ? form.date : '', taxType: form.specificType, type: form.specificType });
            else if (form.expenseCategory === 'utility') addUtilityRecord({ ...payload, date: form.date, type: form.specificType || 'other' });
            else if (form.expenseCategory === 'insurance') addInsuranceRecord({ ...payload, coverageAmount: amt * 200, startDate: form.date, expiryDate: addDays(parseISO(form.date), 365).toISOString().split('T')[0], insuranceType: form.specificType || 'fire', premiumAmount: amt });
            else if (form.expenseCategory === 'mgmt') addManagementFee({ ...payload, nextDueDate: form.date, provider: 'Management Office', feeType: form.specificType || 'other', status: form.status === 'paid' ? 'active' : 'pending' });
        }
        setShowForm(false);
        setEditingItem(null);
    }

    // Normalize all records into a standardized structure
    const allExpenses = useMemo(() => {
        const list = [];

        // Taxes
        taxRecords.forEach(r => list.push({
            id: r.id,
            type: 'tax',
            date: r.dueDate,
            amount: Number(r.amount),
            status: r.status,
            propertyId: r.propertyId,
            description: r.type === 'quit_rent' ? 'Quit Rent' : 'Assessment Tax',
            taxDeductible: r.taxDeductible ?? null,
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
            taxDeductible: r.taxDeductible ?? null,
            raw: r
        }));

        // Insurance
        insuranceRecords.forEach(r => list.push({
            id: r.id,
            type: 'insurance',
            date: r.startDate,
            amount: Number(r.premiumAmount || (Number(r.coverageAmount) * 0.005) || r.amount),
            status: 'active',
            propertyId: r.propertyId,
            description: `${r.insuranceType} Policy`,
            taxDeductible: r.taxDeductible ?? null,
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
            taxDeductible: r.taxDeductible ?? null,
            raw: r
        }));

        return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [taxRecords, utilityRecords, insuranceRecords, managementFees]);

    // Filtering
    const filteredExpenses = useMemo(() => {
        return allExpenses.filter(item => {
            if (embeddedPropertyId && item.propertyId !== embeddedPropertyId) return false;
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
    }, [allExpenses, embeddedPropertyId, filterCategory, searchTerm, properties]);

    const totalAmount = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handleMarkAsPaid = (item) => {
        const confirmMsg = `Mark ${item.description} as Paid?`;
        if (window.confirm(confirmMsg)) {
            const today = new Date().toISOString().split('T')[0];
            if (item.type === 'tax') updateTaxRecord(item.id, { status: 'paid', paymentDate: today });
            if (item.type === 'utility') updateUtilityRecord(item.id, { status: 'paid' });
            if (item.type === 'insurance') updateInsuranceRecord(item.id, { status: 'paid' });
            if (item.type === 'mgmt') updateManagementFee(item.id, { status: 'active' });
        }
    };

    const handleExportPDF = () => {
        const exportData = filteredExpenses.map(item => {
            const prop = properties.find(p => p.id === item.propertyId);
            return {
                category: CATEGORIES[item.type]?.label || item.type,
                description: item.description,
                property: prop ? prop.nickname : 'Unknown',
                date: formatDate(item.date),
                status: (item.status || 'Pending').toUpperCase(),
                deductible: item.taxDeductible === true ? 'Yes' : item.taxDeductible === false ? 'No' : '-',
                amount: formatCurrency(item.amount)
            };
        });

        exportData.push({
            category: 'TOTAL',
            description: '',
            property: '',
            date: '',
            status: '',
            deductible: '',
            amount: formatCurrency(totalAmount)
        });

        exportToPDF(exportData, 'expenses-report', 'Property Expenses Report');
    };

    const handleExportLHDN = () => {
        const deductibleItems = allExpenses.filter(item => item.taxDeductible === true);

        // Group by Year of Assessment (calendar year)
        const byYA = {};
        deductibleItems.forEach(item => {
            const year = item.date ? new Date(item.date).getFullYear() : 'Unknown';
            const ya = `YA ${year}`;
            if (!byYA[ya]) byYA[ya] = [];
            byYA[ya].push(item);
        });

        const exportData = [];
        Object.keys(byYA).sort().reverse().forEach(ya => {
            const items = byYA[ya];
            exportData.push({ category: ya, description: '--- Year of Assessment ---', property: '', date: '', status: '', amount: '' });
            items.forEach(item => {
                const prop = properties.find(p => p.id === item.propertyId);
                exportData.push({
                    category: CATEGORIES[item.type]?.label || item.type,
                    description: item.description,
                    property: prop ? prop.nickname : 'Unknown',
                    date: formatDate(item.date),
                    status: (item.status || '').toUpperCase(),
                    amount: formatCurrency(item.amount)
                });
            });
            const subtotal = items.reduce((sum, i) => sum + (i.amount || 0), 0);
            exportData.push({ category: '', description: '', property: '', date: '', status: `${ya} Subtotal`, amount: formatCurrency(subtotal) });
        });

        const grandTotal = deductibleItems.reduce((sum, i) => sum + (i.amount || 0), 0);
        exportData.push({ category: 'GRAND TOTAL', description: '', property: '', date: '', status: '', amount: formatCurrency(grandTotal) });

        exportToPDF(exportData, 'lhdn-allowable-deductions', 'LHDN Allowable Deductions Report');
    };

    return (
        <div style={embeddedPropertyId ? {} : { maxWidth: 1400, margin: '0 auto' }}>
            {!embeddedPropertyId && (
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Expenses</h1>
                        <p className="section-subtitle">Track taxes, utilities, insurance and management fees</p>
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
                        <button className="btn btn-outline" onClick={handleExportPDF}>
                            <FileText size={16} /> Export PDF
                        </button>
                        <button className="btn btn-outline" onClick={handleExportLHDN} title="Export LHDN Allowable Deductions Report">
                            <BadgeCheck size={16} /> LHDN Report
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}>
                            <Plus size={16} /> Log Expense
                        </button>
                    </div>
                </div>
            )}

            {embeddedPropertyId && (
                <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 className="text-lg font-semibold" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Property Expenses</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div className="search-box" style={{ margin: 0 }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                            <FileText size={14} /> Export
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openAdd}>
                            <Plus size={14} /> Log Expense
                        </button>
                    </div>
                </div>
            )}

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
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Property</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Deductible</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(item => {
                                    const CategoryConfig = CATEGORIES[item.type];
                                    const Icon = CategoryConfig.icon;
                                    const prop = properties.find(p => p.id === item.propertyId);

                                    return (
                                        <tr key={item.id} className="interactive-row" onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
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
                                                {item.status !== 'paid' && item.status !== 'active' ? (
                                                    <span
                                                        className={`badge badge-${item.status === 'overdue' ? 'danger' : 'warning'}`}
                                                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(item); }}
                                                        title="Click to mark as paid"
                                                    >
                                                        {item.status || 'Pending'}
                                                        <CheckCircle size={12} style={{ opacity: 0.7 }} />
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-success">
                                                        {item.status === 'active' ? 'Active' : 'Paid'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {item.taxDeductible === true && (
                                                    <span className="badge badge-success" style={{ fontSize: 11 }}>Yes</span>
                                                )}
                                                {item.taxDeductible === false && (
                                                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>No</span>
                                                )}
                                                {item.taxDeductible == null && (
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatCurrency(item.amount)}
                                            </td>
                                            <td>
                                                <div className="property-actions" style={{ opacity: 1, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Edit3 size={16} /></button>
                                                    <button className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        No expenses found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                    <td colSpan="6" style={{ textAlign: 'right' }}>Total</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalAmount)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingItem ? "Edit Expense" : "Log New Expense"} size="md">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Expense Category</label>
                        <CustomSelect
                            value={form.expenseCategory}
                            onChange={val => setForm(p => ({ ...p, expenseCategory: val, specificType: val === 'tax' ? 'cukai_pintu' : '' }))}
                            options={[
                                { value: 'utility', label: 'Utilities (TNB, Water, etc)' },
                                { value: 'tax', label: 'Taxes (Cukai Pintu/Tanah)' },
                                { value: 'insurance', label: 'Insurance' },
                                { value: 'mgmt', label: 'Management Fee / Sinking Fund' },
                            ]}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Property</label>
                            <CustomSelect
                                value={form.propertyId}
                                onChange={val => setForm(p => ({ ...p, propertyId: val }))}
                                options={[{ value: '', label: 'Select Property' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                                disabled={!!embeddedPropertyId}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Amount (RM)</label>
                            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="0.00" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Expense Sub-type</label>
                            {form.expenseCategory === 'utility' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={UTILITY_TYPES} />}
                            {form.expenseCategory === 'tax' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={[{ value: 'cukai_pintu', label: 'Cukai Pintu (Assessment Tax)' }, { value: 'cukai_tanah', label: 'Cukai Tanah (Quit Rent)' }]} />}
                            {form.expenseCategory === 'insurance' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={INSURANCE_TYPES} />}
                            {form.expenseCategory === 'mgmt' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={MANAGEMENT_FEE_TYPES} />}
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <ToggleGroup
                                options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Unpaid / Pending' }]}
                                value={form.status}
                                onChange={val => setForm(p => ({ ...p, status: val }))}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tax Deductible (LHDN)</label>
                            <ToggleGroup
                                options={[
                                    { value: true, label: 'Yes' },
                                    { value: false, label: 'No' }
                                ]}
                                value={form.taxDeductible}
                                onChange={val => setForm(p => ({ ...p, taxDeductible: val }))}
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                                Per LHDN: quit rent, assessment tax, daily repairs, fire insurance premiums are deductible. Initial capital expenditure (first tenant ads, stamp duty) is NOT.
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes / Description (Optional)</label>
                        <input type="text" placeholder="e.g. Paid via JomPAY" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 24, padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        {editingItem && (
                            <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)', marginRight: 'auto' }} onClick={() => { setShowForm(false); setDeleteItem(editingItem); }}>Delete</button>
                        )}
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!form.propertyId}>{editingItem ? 'Save Changes' : 'Save Expense'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConf}
                title="Delete Expense"
                message={`Are you sure you want to delete this ${deleteItem?.description || 'expense'}? This action cannot be undone.`}
            />
        </div >
    );
}
