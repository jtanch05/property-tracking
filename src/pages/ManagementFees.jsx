import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { MANAGEMENT_FEE_TYPES, FEE_FREQUENCIES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Landmark, Edit3, Trash2, Repeat, DollarSign } from 'lucide-react';

const EMPTY = {
    propertyId: '', feeType: 'condo_maintenance', description: '',
    amount: '', percentOfRent: '', frequency: 'monthly',
    lastPaidDate: '', nextDueDate: '', status: 'active',
};

export default function ManagementFees() {
    const { managementFees, addManagementFee, updateManagementFee, deleteManagementFee, properties, agreements } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);
    const [filterProp, setFilterProp] = useState('');

    const filtered = managementFees
        .filter(f => !filterProp || f.propertyId === filterProp)
        .sort((a, b) => (a.feeType || '').localeCompare(b.feeType || ''));

    // Calculate monthly totals
    const monthlyTotal = useMemo(() => {
        return filtered.filter(f => f.status === 'active').reduce((sum, f) => {
            const amt = Number(f.amount) || 0;
            if (f.frequency === 'monthly') return sum + amt;
            if (f.frequency === 'quarterly') return sum + amt / 3;
            if (f.frequency === 'yearly') return sum + amt / 12;
            return sum;
        }, 0);
    }, [filtered]);

    // For agent fees, get rent amount
    function getRentForProperty(propertyId) {
        const agreement = agreements.find(a => a.propertyId === propertyId);
        return agreement?.rentAmount || 0;
    }

    function openAdd() {
        setForm({ ...EMPTY, propertyId: properties[0]?.id || '' });
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(f) {
        setForm({
            propertyId: f.propertyId || '', feeType: f.feeType || 'condo_maintenance',
            description: f.description || '', amount: f.amount || '',
            percentOfRent: f.percentOfRent || '', frequency: f.frequency || 'monthly',
            lastPaidDate: f.lastPaidDate || '', nextDueDate: f.nextDueDate || '',
            status: f.status || 'active',
        });
        setEditingId(f.id);
        setShowForm(true);
    }

    function handleSubmit(e) {
        e.preventDefault();
        let data = { ...form, amount: Number(form.amount) || 0, percentOfRent: Number(form.percentOfRent) || 0 };
        // Auto-calculate agent fee from rent %
        if (data.feeType === 'agent_fee' && data.percentOfRent > 0) {
            const rent = getRentForProperty(data.propertyId);
            data.amount = Math.round(rent * data.percentOfRent / 100);
        }
        if (editingId) updateManagementFee(editingId, data);
        else addManagementFee(data);
        setShowForm(false);
    }

    function getFrequencyLabel(freq) {
        return FEE_FREQUENCIES.find(f => f.value === freq)?.label || freq;
    }

    function getFeeTypeLabel(type) {
        return MANAGEMENT_FEE_TYPES.find(t => t.value === type)?.label || type;
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Management Fees</h1>
                    <p className="section-subtitle">
                        {managementFees.filter(f => f.status === 'active').length} active fees · {formatCurrency(monthlyTotal)}/mo
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Fee</button>
            </div>

            {managementFees.length > 0 && properties.length > 1 && (
                <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                    <select className="filter-select" value={filterProp} onChange={e => setFilterProp(e.target.value)} style={{ maxWidth: 240 }}>
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                    </select>
                </div>
            )}

            {filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(fee => {
                        const prop = properties.find(p => p.id === fee.propertyId);
                        const isAgent = fee.feeType === 'agent_fee';
                        return (
                            <div key={fee.id} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: fee.status === 'inactive' ? 0.5 : 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                                        {isAgent ? <DollarSign size={18} /> : <Landmark size={18} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{fee.description || getFeeTypeLabel(fee.feeType)}</span>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                                            {prop?.nickname || '—'} · {getFrequencyLabel(fee.frequency)}
                                            {isAgent && fee.percentOfRent > 0 ? ` · ${fee.percentOfRent}% of rent` : ''}
                                        </span>
                                        {fee.nextDueDate && (
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                                Next due: {formatDate(fee.nextDueDate)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontWeight: 700, fontSize: 'var(--font-md)' }}>{formatCurrency(fee.amount)}</span>
                                    <span className={`badge badge-${fee.status === 'active' ? 'success' : 'neutral'}`}>{fee.status}</span>
                                    <button className="btn-icon" onClick={() => openEdit(fee)}><Edit3 size={16} /></button>
                                    <button className="btn-icon" onClick={() => setDeleteId(fee.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Monthly Summary Card */}
                    <div className="card" style={{ padding: '20px 24px', marginTop: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Total Monthly Cost</span>
                                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                                    Across {filtered.filter(f => f.status === 'active').length} active fees
                                </p>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 'var(--font-xl)', color: 'var(--accent)' }}>
                                {formatCurrency(monthlyTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <Landmark size={56} />
                    <h3>No management fees</h3>
                    <p>Track condo maintenance fees, agent commissions, and recurring property costs.</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Fee</button>
                </div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Management Fee' : 'Add Management Fee'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Property *</label>
                            <select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))} required>
                                <option value="">Select</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fee Type</label>
                            <select value={form.feeType} onChange={e => setForm(p => ({ ...p, feeType: e.target.value }))}>
                                {MANAGEMENT_FEE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input type="text" placeholder="e.g. Monthly condo maintenance" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Amount (RM)</label>
                            <input type="number" placeholder="350" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        {form.feeType === 'agent_fee' && (
                            <div className="form-group">
                                <label>% of Rent</label>
                                <input type="number" placeholder="8" value={form.percentOfRent} onChange={e => setForm(p => ({ ...p, percentOfRent: e.target.value }))} min={0} max={100} step={0.5} />
                                {form.propertyId && form.percentOfRent > 0 && (
                                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                        = {formatCurrency(getRentForProperty(form.propertyId) * Number(form.percentOfRent) / 100)}/mo based on current rent
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="form-group">
                            <label>Frequency</label>
                            <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                                {FEE_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Last Paid Date</label>
                            <input type="date" value={form.lastPaidDate} onChange={e => setForm(p => ({ ...p, lastPaidDate: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Next Due Date</label>
                            <input type="date" value={form.nextDueDate} onChange={e => setForm(p => ({ ...p, nextDueDate: e.target.value }))} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Fee'}</button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteManagementFee(deleteId); setDeleteId(null); }} title="Delete Fee" message="Remove this management fee?" />
        </div>
    );
}
