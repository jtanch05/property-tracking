import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { AGREEMENT_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ToggleGroup from '../components/common/ToggleGroup';
import CustomSelect from '../components/common/CustomSelect';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToPDF } from '../utils/export';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, FileText, Edit3, Trash2, Shield, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import './Agreements.css';

const EMPTY_AGREEMENT = {
    propertyId: '', tenantId: '', type: '1_year',
    startDate: '', endDate: '', rentAmount: '',
    noticePeriodMonths: 2, renewalOption: false,
};

const DEPOSIT_TYPES = [
    { value: 'security', label: 'Security Deposit' },
    { value: 'utility', label: 'Utility Deposit' },
    { value: 'access_card', label: 'Access Card Deposit' },
    { value: 'key', label: 'Key Deposit' },
    { value: 'other', label: 'Other' },
];

export default function Agreements({ embeddedPropertyId = null }) {
    const { agreements, addAgreement, updateAgreement, deleteAgreement, properties, tenants, deposits, addDeposit, updateDeposit, deleteDeposit, rentRecords, addRentRecord } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_AGREEMENT);
    const [deleteId, setDeleteId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Deposit form state
    const [showDepositForm, setShowDepositForm] = useState(false);
    const [depositTarget, setDepositTarget] = useState(null);
    const [depositForm, setDepositForm] = useState({ type: 'security', amount: '', status: 'held', notes: '' });
    const [editingDepositId, setEditingDepositId] = useState(null);

    function openAdd() {
        setForm({ ...EMPTY_AGREEMENT, propertyId: embeddedPropertyId || properties[0]?.id || '' });
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(a) {
        setForm({
            propertyId: a.propertyId || '', tenantId: a.tenantId || '', type: a.type || '1_year',
            startDate: a.startDate || '', endDate: a.endDate || '', rentAmount: a.rentAmount || '',
            noticePeriodMonths: a.noticePeriodMonths ?? 2, renewalOption: a.renewalOption || false,
        });
        setEditingId(a.id);
        setShowForm(true);
    }

    /**
     * Generate monthly rent records for every month in the agreement period.
     * Skips months that already have a rent record for the same property + tenant.
     */
    async function generateRentRecords(agreementId, data) {
        if (!data.startDate || !data.endDate || !data.rentAmount) return;

        const start = parseISO(data.startDate);
        const end = parseISO(data.endDate);
        const months = [];

        // Build list of YYYY-MM strings from start to end
        let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= endMonth) {
            months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
            cursor.setMonth(cursor.getMonth() + 1);
        }

        // For each month, check if a rent record already exists
        for (const month of months) {
            const exists = rentRecords.some(r =>
                r.propertyId === data.propertyId &&
                r.tenantId === data.tenantId &&
                r.month === month
            );
            if (!exists) {
                await addRentRecord({
                    propertyId: data.propertyId,
                    tenantId: data.tenantId,
                    agreementId: agreementId,
                    month,
                    amountDue: Number(data.rentAmount) || 0,
                    amountPaid: 0,
                    status: 'unpaid',
                    paymentDate: '',
                    paymentMethod: 'transfer',
                    notes: '',
                    deductions: [],
                });
            }
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        // Close form IMMEDIATELY to prevent double-click
        setShowForm(false);
        const data = {
            ...form,
            rentAmount: Number(form.rentAmount) || 0,
            noticePeriodMonths: Number(form.noticePeriodMonths) || 2,
        };
        if (editingId) {
            await updateAgreement(editingId, data);
            await generateRentRecords(editingId, data);
        } else {
            const newId = await addAgreement(data);
            if (newId) {
                await generateRentRecords(newId, data);
            }
        }
    }

    function getExpiryInfo(endDate) {
        if (!endDate) return null;
        const days = differenceInDays(parseISO(endDate), new Date());
        if (days < 0) return { label: 'Expired', severity: 'danger' };
        if (days <= 30) return { label: `${days}d left`, severity: 'danger' };
        if (days <= 90) return { label: `${days}d left`, severity: 'warning' };
        return { label: `${days}d left`, severity: 'success' };
    }

    // Deposit helpers
    function openAddDeposit(agreementId) {
        setDepositTarget(agreementId);
        setDepositForm({ type: 'security', amount: '', status: 'held', notes: '' });
        setEditingDepositId(null);
        setShowDepositForm(true);
    }

    function openEditDeposit(dep) {
        setDepositTarget(dep.agreementId);
        setDepositForm({ type: dep.type || 'security', amount: dep.amount || '', status: dep.status || 'held', notes: dep.notes || '' });
        setEditingDepositId(dep.id);
        setShowDepositForm(true);
    }

    function handleDepositSubmit(e) {
        e.preventDefault();
        const agreement = agreements.find(a => a.id === depositTarget);
        const data = {
            ...depositForm,
            amount: Number(depositForm.amount) || 0,
            agreementId: depositTarget,
            propertyId: agreement?.propertyId || '',
            tenantId: agreement?.tenantId || '',
        };
        if (editingDepositId) updateDeposit(editingDepositId, data);
        else addDeposit(data);
        setShowDepositForm(false);
    }

    function refundDeposit(dep) {
        updateDeposit(dep.id, { status: 'refunded', refundDate: new Date().toISOString().split('T')[0] });
    }

    function getDepositTypeLabel(type) {
        return DEPOSIT_TYPES.find(t => t.value === type)?.label || type;
    }

    const propTenants = form.propertyId ? tenants.filter(t => t.propertyId === form.propertyId) : [];

    const filteredAgreements = agreements.filter(a => embeddedPropertyId ? a.propertyId === embeddedPropertyId : true);

    return (
        <div className={embeddedPropertyId ? "agreements-embedded" : "agreements-page"}>
            {!embeddedPropertyId && (
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Tenancy Agreements</h1>
                        <p className="section-subtitle">{agreements.length} records</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => exportToPDF(agreements, 'Tenancy-Agreements', 'Tenancy Agreements Report')}
                            disabled={agreements.length === 0}
                        >
                            <FileText size={16} /> Export PDF
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}>
                            <Plus size={16} /> Add Agreement
                        </button>
                    </div>
                </div>
            )}

            {embeddedPropertyId && (
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Lease Agreements</h3>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                        <Plus size={14} /> New Agreement
                    </button>
                </div>
            )}

            {filteredAgreements.length > 0 ? (
                <div className="agreement-list">
                    {filteredAgreements.map(a => {
                        const prop = properties.find(p => p.id === a.propertyId);
                        const tenant = tenants.find(t => t.id === a.tenantId);
                        const expiry = getExpiryInfo(a.endDate);
                        const agreementDeposits = deposits.filter(d => d.agreementId === a.id);
                        const totalDeposits = agreementDeposits.filter(d => d.status === 'held').reduce((s, d) => s + (d.amount || 0), 0);
                        const isExpanded = expandedId === a.id;

                        // Rent collection progress for this agreement
                        const linkedRent = rentRecords.filter(r => r.agreementId === a.id);
                        const paidCount = linkedRent.filter(r => r.status === 'paid').length;
                        const totalMonths = linkedRent.length;
                        const collectedAmount = linkedRent.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);

                        return (
                            <div key={a.id} className="card agreement-card">
                                <div className="agreement-header">
                                    <div>
                                        <h3 className="agreement-prop">{prop?.nickname || 'Unknown'}</h3>
                                        <span className="agreement-tenant">{tenant?.name || '—'}</span>
                                    </div>
                                    <div className="agreement-actions">
                                        {expiry && <span className={`badge badge-${expiry.severity}`}>{expiry.label}</span>}
                                        <button className="btn-icon" onClick={() => openEdit(a)}><Edit3 size={16} /></button>
                                        <button className="btn-icon" onClick={() => setDeleteId(a.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="agreement-details">
                                    <div className="agreement-detail"><span className="detail-label">Period</span><span>{formatDate(a.startDate)} — {formatDate(a.endDate)}</span></div>
                                    <div className="agreement-detail"><span className="detail-label">Rent</span><span>{formatCurrency(a.rentAmount)}/mo</span></div>
                                    <div className="agreement-detail"><span className="detail-label">Deposits Held</span><span>{formatCurrency(totalDeposits)}</span></div>
                                    <div className="agreement-detail"><span className="detail-label">Notice</span><span>{a.noticePeriodMonths} months</span></div>
                                </div>

                                {/* Rent Collection Progress */}
                                {totalMonths > 0 && (
                                    <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Rent Collection
                                            </span>
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                                {paidCount}/{totalMonths} months · {formatCurrency(collectedAmount)}
                                            </span>
                                        </div>
                                        <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${totalMonths > 0 ? (paidCount / totalMonths) * 100 : 0}%`,
                                                background: paidCount === totalMonths ? 'var(--success)' : 'var(--accent)',
                                                borderRadius: 2,
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Deposits Section */}
                                <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--font-xs)', padding: '4px 8px' }}
                                        onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                                        <Shield size={14} /> Deposits ({agreementDeposits.length})
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {isExpanded && (
                                        <div style={{ marginTop: 8 }}>
                                            {agreementDeposits.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {agreementDeposits.map(dep => (
                                                        <div key={dep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{getDepositTypeLabel(dep.type)}</span>
                                                                {dep.notes && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{dep.notes}</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontWeight: 600 }}>{formatCurrency(dep.amount)}</span>
                                                                <span className={`badge badge-${dep.status === 'held' ? 'warning' : dep.status === 'refunded' ? 'success' : 'neutral'}`}
                                                                    style={{ fontSize: 'var(--font-xs)' }}>{dep.status}</span>
                                                                {dep.status === 'held' && (
                                                                    <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: 'var(--font-xs)' }}
                                                                        onClick={() => refundDeposit(dep)}>
                                                                        <ArrowUp size={12} /> Refund
                                                                    </button>
                                                                )}
                                                                <button className="btn-icon" onClick={() => openEditDeposit(dep)}><Edit3 size={14} /></button>
                                                                <button className="btn-icon" onClick={() => deleteDeposit(dep.id)}><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', margin: '4px 0' }}>No deposits recorded</p>
                                            )}
                                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => openAddDeposit(a.id)}>
                                                <Plus size={14} /> Add Deposit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <FileText size={56} />
                    <h3>No agreements yet</h3>
                    <p>Record tenancy agreement details (no file uploads needed).</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Agreement</button>
                </div>
            )}

            {/* Agreement Form Modal */}
            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Agreement' : 'Add Agreement'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Property *</label>
                            <CustomSelect
                                value={form.propertyId}
                                onChange={val => setForm(prev => ({ ...prev, propertyId: val, tenantId: '' }))}
                                options={[{ value: '', label: 'Select' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                                placeholder="Select"
                                disabled={!!embeddedPropertyId}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tenant</label>
                            <CustomSelect
                                value={form.tenantId}
                                onChange={val => setForm(prev => ({ ...prev, tenantId: val }))}
                                options={[{ value: '', label: 'Select' }, ...propTenants.map(t => ({ value: t.id, label: t.name }))]}
                                placeholder="Select"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Agreement Type</label>
                            <CustomSelect
                                value={form.type}
                                onChange={val => {
                                    const updated = { ...form, type: val };
                                    // Auto-calculate end date if start date exists
                                    if (val !== 'custom' && updated.startDate) {
                                        const start = parseISO(updated.startDate);
                                        const monthsMap = { '6_months': 6, '1_year': 12, '2_years': 24, '3_years': 36 };
                                        const m = monthsMap[val] || 12;
                                        const end = new Date(start.getFullYear(), start.getMonth() + m, start.getDate());
                                        updated.endDate = end.toISOString().split('T')[0];
                                    }
                                    setForm(updated);
                                }}
                                options={AGREEMENT_TYPES}
                            />
                        </div>
                        <div className="form-group">
                            <label>Notice Period (months)</label>
                            <input type="number" value={form.noticePeriodMonths} onChange={e => setForm(prev => ({ ...prev, noticePeriodMonths: e.target.value }))} min={1} max={6} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input type="date" value={form.startDate} onChange={e => {
                                const startDate = e.target.value;
                                const updated = { ...form, startDate };
                                // Auto-calculate end date based on type
                                if (form.type !== 'custom' && startDate) {
                                    const start = parseISO(startDate);
                                    const monthsMap = { '6_months': 6, '1_year': 12, '2_years': 24, '3_years': 36 };
                                    const m = monthsMap[form.type] || 12;
                                    const end = new Date(start.getFullYear(), start.getMonth() + m, start.getDate());
                                    updated.endDate = end.toISOString().split('T')[0];
                                }
                                setForm(updated);
                            }} required />
                        </div>
                        <div className="form-group">
                            <label>End Date {form.type === 'custom' ? '*' : '(auto)'}</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} required disabled={form.type !== 'custom'} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Monthly Rent (RM)</label><input type="number" placeholder="1500" value={form.rentAmount} onChange={e => setForm(prev => ({ ...prev, rentAmount: e.target.value }))} /></div>
                        <div className="form-group">
                            <label>Renewal Option</label>
                            <ToggleGroup
                                options={[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                ]}
                                value={form.renewalOption ? 'yes' : 'no'}
                                onChange={val => setForm(prev => ({ ...prev, renewalOption: val === 'yes' }))}
                            />
                        </div>
                    </div>

                    {/* Preview of months to be generated */}
                    {form.startDate && form.endDate && form.rentAmount && (
                        <div style={{ margin: 'var(--space-md) 0', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {(() => {
                                const start = parseISO(form.startDate);
                                const end = parseISO(form.endDate);
                                let count = 0;
                                let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
                                const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
                                while (cursor <= endMonth) { count++; cursor.setMonth(cursor.getMonth() + 1); }
                                return (
                                    <span>
                                        💡 Saving will auto-generate <strong>{count} monthly rent records</strong> at {formatCurrency(Number(form.rentAmount))} each
                                        {editingId && <span style={{ color: 'var(--text-tertiary)' }}> (existing records won't be duplicated)</span>}
                                    </span>
                                );
                            })()}
                        </div>
                    )}

                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Agreement'}</button>
                    </div>
                </form>
            </Modal>

            {/* Deposit Form Modal */}
            <Modal isOpen={showDepositForm} onClose={() => setShowDepositForm(false)} title={editingDepositId ? 'Edit Deposit' : 'Add Deposit'} size="sm">
                <form onSubmit={handleDepositSubmit}>
                    <div className="form-group">
                        <label>Deposit Type</label>
                        <CustomSelect
                            value={depositForm.type}
                            onChange={val => setDepositForm(p => ({ ...p, type: val }))}
                            options={DEPOSIT_TYPES}
                        />
                    </div>
                    <div className="form-group">
                        <label>Amount (RM)</label>
                        <input type="number" placeholder="3000" value={depositForm.amount} onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <CustomSelect
                            value={depositForm.status}
                            onChange={val => setDepositForm(p => ({ ...p, status: val }))}
                            options={[
                                { value: 'held', label: 'Held' },
                                { value: 'partially_refunded', label: 'Partially Refunded' },
                                { value: 'refunded', label: 'Refunded' },
                                { value: 'forfeited', label: 'Forfeited' },
                            ]}
                        />
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <input type="text" placeholder="Optional notes" value={depositForm.notes} onChange={e => setDepositForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowDepositForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingDepositId ? 'Save' : 'Add Deposit'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteAgreement(deleteId); setDeleteId(null); }} title="Delete Agreement" message="Remove this agreement record?" />
        </div>
    );
}
