import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { AGREEMENT_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, FileText, Edit3, Trash2, Shield, ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function Agreements() {
    const { agreements, addAgreement, updateAgreement, deleteAgreement, properties, tenants, deposits, addDeposit, updateDeposit, deleteDeposit } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_AGREEMENT);
    const [deleteId, setDeleteId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Deposit form state
    const [showDepositForm, setShowDepositForm] = useState(false);
    const [depositTarget, setDepositTarget] = useState(null); // agreementId
    const [depositForm, setDepositForm] = useState({ type: 'security', amount: '', status: 'held', notes: '' });
    const [editingDepositId, setEditingDepositId] = useState(null);

    function openAdd() {
        setForm({ ...EMPTY_AGREEMENT, propertyId: properties[0]?.id || '' });
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

    function handleSubmit(e) {
        e.preventDefault();
        const data = {
            ...form,
            rentAmount: Number(form.rentAmount) || 0,
            noticePeriodMonths: Number(form.noticePeriodMonths) || 2,
        };
        if (editingId) updateAgreement(editingId, data);
        else addAgreement(data);
        setShowForm(false);
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

    return (
        <div className="agreements-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Tenancy Agreements</h1>
                    <p className="section-subtitle">{agreements.length} records</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Agreement</button>
            </div>

            {agreements.length > 0 ? (
                <div className="agreement-list">
                    {agreements.map(a => {
                        const prop = properties.find(p => p.id === a.propertyId);
                        const tenant = tenants.find(t => t.id === a.tenantId);
                        const expiry = getExpiryInfo(a.endDate);
                        const agreementDeposits = deposits.filter(d => d.agreementId === a.id);
                        const totalDeposits = agreementDeposits.filter(d => d.status === 'held').reduce((s, d) => s + (d.amount || 0), 0);
                        const isExpanded = expandedId === a.id;

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
                            <select value={form.propertyId} onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value, tenantId: '' }))} required>
                                <option value="">Select</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tenant</label>
                            <select value={form.tenantId} onChange={e => setForm(prev => ({ ...prev, tenantId: e.target.value }))}>
                                <option value="">Select</option>
                                {propTenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Agreement Type</label>
                            <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}>
                                {AGREEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notice Period (months)</label>
                            <input type="number" value={form.noticePeriodMonths} onChange={e => setForm(prev => ({ ...prev, noticePeriodMonths: e.target.value }))} min={1} max={6} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} required /></div>
                        <div className="form-group"><label>End Date *</label><input type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Monthly Rent (RM)</label><input type="number" placeholder="1500" value={form.rentAmount} onChange={e => setForm(prev => ({ ...prev, rentAmount: e.target.value }))} /></div>
                        <div className="form-group">
                            <label>Renewal Option</label>
                            <select value={form.renewalOption ? 'yes' : 'no'} onChange={e => setForm(prev => ({ ...prev, renewalOption: e.target.value === 'yes' }))}>
                                <option value="no">No</option><option value="yes">Yes</option>
                            </select>
                        </div>
                    </div>
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
                        <select value={depositForm.type} onChange={e => setDepositForm(p => ({ ...p, type: e.target.value }))}>
                            {DEPOSIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Amount (RM)</label>
                        <input type="number" placeholder="3000" value={depositForm.amount} onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={depositForm.status} onChange={e => setDepositForm(p => ({ ...p, status: e.target.value }))}>
                            <option value="held">Held</option>
                            <option value="partially_refunded">Partially Refunded</option>
                            <option value="refunded">Refunded</option>
                            <option value="forfeited">Forfeited</option>
                        </select>
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
