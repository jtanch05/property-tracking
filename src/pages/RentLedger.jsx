import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { PAYMENT_METHODS } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatMonth, formatDate, getStatusColor } from '../utils/formatters';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Wallet, Edit3, Trash2, CheckCircle, Clock, AlertCircle, MessageCircle, Minus } from 'lucide-react';
import { sendRentReminder } from '../utils/whatsapp';
import './RentLedger.css';

const EMPTY_RENT = {
    propertyId: '', tenantId: '', month: '', amountDue: '', amountPaid: '',
    status: 'unpaid', paymentDate: '', paymentMethod: 'transfer', notes: '',
    deductions: [],
};

export default function RentLedger() {
    const { rentRecords, addRentRecord, updateRentRecord, deleteRentRecord, properties, tenants, maintenanceRecords, payouts, addPayout, updatePayout } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_RENT);
    const [deleteId, setDeleteId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProp, setFilterProp] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = rentRecords
        .filter(r => filterStatus === 'all' || r.status === filterStatus)
        .filter(r => !filterProp || r.propertyId === filterProp)
        .sort((a, b) => b.month.localeCompare(a.month));

    // Available maintenance records that can be deducted (same property, has cost, status closed/open)
    const availableDeductions = useMemo(() => {
        if (!form.propertyId) return [];
        return maintenanceRecords
            .filter(m => m.propertyId === form.propertyId && m.cost > 0)
            .filter(m => {
                // Exclude already-linked ones (unless editing this record)
                const alreadyLinked = form.deductions.some(d => d.maintenanceId === m.id);
                return !alreadyLinked;
            });
    }, [form.propertyId, maintenanceRecords, form.deductions]);

    function openAdd() {
        const now = new Date();
        setForm({ ...EMPTY_RENT, propertyId: properties[0]?.id || '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` });
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(r) {
        setForm({
            propertyId: r.propertyId || '', tenantId: r.tenantId || '', month: r.month || '',
            amountDue: r.amountDue || '', amountPaid: r.amountPaid || '',
            status: r.status || 'unpaid', paymentDate: r.paymentDate || '',
            paymentMethod: r.paymentMethod || 'transfer', notes: r.notes || '',
            deductions: r.deductions || [],
        });
        setEditingId(r.id);
        setShowForm(true);
    }

    function quickPay(r) {
        const deductionTotal = (r.deductions || []).reduce((s, d) => s + (d.amount || 0), 0);
        const netAmount = (r.amountDue || 0) - deductionTotal;
        updateRentRecord(r.id, {
            status: 'paid',
            amountPaid: netAmount,
            paymentDate: new Date().toISOString().split('T')[0],
        });
        // Auto-generate payouts if property has co-owners
        autoGeneratePayouts(r, netAmount);
    }

    function autoGeneratePayouts(rentRecord, netAmount) {
        const prop = properties.find(p => p.id === rentRecord.propertyId);
        if (!prop?.coOwners || prop.coOwners.length === 0) return;
        prop.coOwners.forEach(owner => {
            const payoutAmount = Math.round(netAmount * owner.splitPercent / 100);
            addPayout({
                propertyId: rentRecord.propertyId,
                rentRecordId: rentRecord.id,
                coOwnerId: owner.id,
                ownerName: owner.name,
                amount: payoutAmount,
                splitPercent: owner.splitPercent,
                status: owner.isPrimary ? 'paid' : 'pending',
                paidDate: owner.isPrimary ? new Date().toISOString().split('T')[0] : '',
                month: rentRecord.month,
                notes: '',
            });
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const data = { ...form, amountDue: Number(form.amountDue) || 0, amountPaid: Number(form.amountPaid) || 0 };
        if (editingId) updateRentRecord(editingId, data);
        else addRentRecord(data);
        setShowForm(false);
    }

    function addDeduction(maintenance) {
        setForm(prev => ({
            ...prev,
            deductions: [...prev.deductions, {
                id: crypto.randomUUID(),
                maintenanceId: maintenance.id,
                description: maintenance.description || maintenance.issueType,
                amount: maintenance.cost || 0,
            }],
        }));
    }

    function removeDeduction(deductionId) {
        setForm(prev => ({
            ...prev,
            deductions: prev.deductions.filter(d => d.id !== deductionId),
        }));
    }

    function getDaysOverdue(record) {
        if (record.status === 'paid') return 0;
        const due = parseISO(`${record.month}-01`);
        return Math.max(0, differenceInDays(new Date(), due));
    }

    const totalDue = filtered.reduce((s, r) => s + (r.amountDue || 0), 0);
    const totalDeductions = filtered.reduce((s, r) => s + ((r.deductions || []).reduce((ds, d) => ds + (d.amount || 0), 0)), 0);
    const totalPaid = filtered.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amountPaid || 0), 0);

    const propTenants = form.propertyId ? tenants.filter(t => t.propertyId === form.propertyId) : [];
    const formDeductionTotal = form.deductions.reduce((s, d) => s + (d.amount || 0), 0);
    const formNetAmount = (Number(form.amountDue) || 0) - formDeductionTotal;

    return (
        <div className="rent-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Rent Ledger</h1>
                    <p className="section-subtitle">
                        {formatCurrency(totalPaid)} collected of {formatCurrency(totalDue)}
                        {totalDeductions > 0 && <span style={{ color: 'var(--warning)' }}> (−{formatCurrency(totalDeductions)} deductions)</span>}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Record</button>
            </div>

            {rentRecords.length > 0 && (
                <div className="filter-bar">
                    <select className="filter-select" value={filterProp} onChange={e => setFilterProp(e.target.value)}>
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                    </select>
                    <div className="filter-tabs">
                        {['all', 'paid', 'unpaid'].map(f => (
                            <button key={f} className={`btn btn-sm ${filterStatus === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus(f)}>
                                {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Unpaid'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filtered.length > 0 ? (
                <div className="rent-list">
                    {filtered.map(r => {
                        const prop = properties.find(p => p.id === r.propertyId);
                        const tenant = tenants.find(t => t.id === r.tenantId);
                        const overdue = getDaysOverdue(r);
                        const deductions = r.deductions || [];
                        const deductionTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);
                        const netAmount = (r.amountDue || 0) - deductionTotal;
                        const isExpanded = expandedId === r.id;

                        // Payouts for this rent record
                        const rentPayouts = payouts.filter(p => p.rentRecordId === r.id);

                        return (
                            <div key={r.id} className={`card rent-card ${r.status}`}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="rent-left">
                                        <div className={`rent-status-icon ${r.status}`}>
                                            {r.status === 'paid' ? <CheckCircle size={18} /> : overdue > 0 ? <AlertCircle size={18} /> : <Clock size={18} />}
                                        </div>
                                        <div className="rent-info">
                                            <span className="rent-month">{formatMonth(r.month)}</span>
                                            <span className="rent-prop">{prop?.nickname || '—'}</span>
                                            {overdue > 0 && r.status !== 'paid' && <span className="rent-overdue">{overdue} days overdue</span>}
                                        </div>
                                    </div>
                                    <div className="rent-right">
                                        <div className="rent-amounts">
                                            {deductionTotal > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatCurrency(r.amountDue)}</span>
                                                    <span className="rent-amount">{formatCurrency(netAmount)}</span>
                                                </div>
                                            ) : (
                                                <span className="rent-amount">{formatCurrency(r.amountDue)}</span>
                                            )}
                                            {r.status === 'paid' && <span className="rent-paid-date">Paid {formatDate(r.paymentDate)}</span>}
                                        </div>
                                        <div className="rent-actions">
                                            {r.status !== 'paid' && (
                                                <>
                                                    <button className="btn btn-sm btn-primary" onClick={() => quickPay(r)}>Mark Paid</button>
                                                    {tenant?.phone && (
                                                        <button className="btn-icon" title="Send WhatsApp reminder" onClick={() => sendRentReminder(tenant, r, prop)}>
                                                            <MessageCircle size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            <button className="btn-icon" onClick={() => openEdit(r)}><Edit3 size={16} /></button>
                                            <button className="btn-icon" onClick={() => setDeleteId(r.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* Deduction & Payout details (expandable) */}
                                {(deductions.length > 0 || rentPayouts.length > 0) && (
                                    <div>
                                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 'var(--font-xs)' }} onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                                            {isExpanded ? '▾ Hide details' : `▸ ${deductions.length > 0 ? `${deductions.length} deduction(s)` : ''}${rentPayouts.length > 0 ? ` · ${rentPayouts.length} payout(s)` : ''}`}
                                        </button>
                                        {isExpanded && (
                                            <div style={{ marginTop: 8, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)' }}>
                                                {deductions.length > 0 && (
                                                    <div style={{ marginBottom: rentPayouts.length > 0 ? 12 : 0 }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</span>
                                                        {deductions.map((d, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                                <span style={{ color: 'var(--warning)' }}>− {d.description}</span>
                                                                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>−{formatCurrency(d.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {rentPayouts.length > 0 && (
                                                    <div>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Split</span>
                                                        {rentPayouts.map(p => (
                                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                                                <span>{p.ownerName} ({p.splitPercent}%)</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</span>
                                                                    <span className={`badge badge-${p.status === 'paid' ? 'success' : 'warning'}`} style={{ fontSize: 'var(--font-xs)' }}>{p.status}</span>
                                                                    {p.status === 'pending' && (
                                                                        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: 'var(--font-xs)' }}
                                                                            onClick={() => updatePayout(p.id, { status: 'paid', paidDate: new Date().toISOString().split('T')[0] })}>
                                                                            ✓ Paid
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Wallet size={56} />
                    <h3>No rent records</h3>
                    <p>Track monthly rent payments here.</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Record</button>
                </div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Rent Record' : 'Add Rent Record'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Property *</label>
                            <select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value, tenantId: '' }))} required>
                                <option value="">Select</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tenant</label>
                            <select value={form.tenantId} onChange={e => setForm(p => ({ ...p, tenantId: e.target.value }))}>
                                <option value="">Select</option>
                                {propTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Month *</label><input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} required /></div>
                        <div className="form-group"><label>Amount Due (RM)</label><input type="number" value={form.amountDue} onChange={e => setForm(p => ({ ...p, amountDue: e.target.value }))} placeholder="1500" /></div>
                    </div>

                    {/* Deductions Section */}
                    <div style={{ margin: 'var(--space-md) 0', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={{ fontWeight: 600, margin: 0 }}><Minus size={14} style={{ marginRight: 4 }} /> Deductions</label>
                        </div>
                        {form.deductions.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                {form.deductions.map(d => (
                                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                        <span style={{ fontSize: 'var(--font-sm)' }}>{d.description}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--warning)' }}>−{formatCurrency(d.amount)}</span>
                                            <button type="button" className="btn-icon" onClick={() => removeDeduction(d.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {availableDeductions.length > 0 ? (
                            <select onChange={e => { const m = availableDeductions.find(x => x.id === e.target.value); if (m) addDeduction(m); e.target.value = ''; }} defaultValue="">
                                <option value="" disabled>+ Link maintenance repair...</option>
                                {availableDeductions.map(m => (
                                    <option key={m.id} value={m.id}>{m.description || m.issueType} — {formatCurrency(m.cost)}</option>
                                ))}
                            </select>
                        ) : form.propertyId ? (
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>No maintenance records available for deduction</span>
                        ) : null}
                        {formDeductionTotal > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>Net Collectible</span>
                                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(formNetAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="unpaid">Unpaid</option><option value="paid">Paid</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Payment Date</label><input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Payment Method</label>
                            <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Amount Paid (RM)</label><input type="number" value={form.amountPaid} onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} placeholder={formDeductionTotal > 0 ? String(formNetAmount) : '1500'} /></div>
                    </div>
                    <div className="form-group"><label>Notes</label><input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" /></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Record'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteRentRecord(deleteId); setDeleteId(null); }} title="Delete Rent Record" message="Remove this rent record?" />
        </div>
    );
}
