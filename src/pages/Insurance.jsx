import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { INSURANCE_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatRelativeDate } from '../utils/formatters';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Shield, Edit3, Trash2 } from 'lucide-react';

const EMPTY = { propertyId: '', insuranceType: 'fire', provider: '', coverageAmount: '', startDate: '', expiryDate: '' };

export default function Insurance() {
    const { insuranceRecords, addInsuranceRecord, updateInsuranceRecord, deleteInsuranceRecord, properties } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);

    function openAdd() { setForm({ ...EMPTY, propertyId: properties[0]?.id || '' }); setEditingId(null); setShowForm(true); }
    function openEdit(i) { setForm({ propertyId: i.propertyId || '', insuranceType: i.insuranceType || 'fire', provider: i.provider || '', coverageAmount: i.coverageAmount || '', startDate: i.startDate || '', expiryDate: i.expiryDate || '' }); setEditingId(i.id); setShowForm(true); }
    function handleSubmit(e) { e.preventDefault(); const d = { ...form, coverageAmount: Number(form.coverageAmount) || 0 }; if (editingId) updateInsuranceRecord(editingId, d); else addInsuranceRecord(d); setShowForm(false); }

    function getExpiryBadge(date) {
        if (!date) return null;
        const days = differenceInDays(parseISO(date), new Date());
        if (days < 0) return { label: 'Expired', color: 'danger' };
        if (days <= 30) return { label: `${days}d left`, color: 'danger' };
        if (days <= 60) return { label: `${days}d left`, color: 'warning' };
        return { label: `${days}d left`, color: 'success' };
    }

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="section-header"><div><h1 className="section-title">Insurance</h1><p className="section-subtitle">Fire, Houseowner & Landlord coverage</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Insurance</button></div>

            {insuranceRecords.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {insuranceRecords.map(ins => {
                        const prop = properties.find(p => p.id === ins.propertyId);
                        const iType = INSURANCE_TYPES.find(t => t.value === ins.insuranceType);
                        const badge = getExpiryBadge(ins.expiryDate);
                        return (
                            <div key={ins.id} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{iType?.label || ins.insuranceType}</span>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{prop?.nickname || '—'} · {ins.provider || '—'}</span>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Coverage: {formatCurrency(ins.coverageAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>{formatDate(ins.startDate)} — {formatDate(ins.expiryDate)}</span>
                                    </div>
                                    {badge && <span className={`badge badge-${badge.color}`}>{badge.label}</span>}
                                    <button className="btn-icon" onClick={() => openEdit(ins)}><Edit3 size={16} /></button>
                                    <button className="btn-icon" onClick={() => setDeleteId(ins.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state"><Shield size={56} /><h3>No insurance records</h3><p>Track insurance policies and expiry dates.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Insurance</button></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Insurance' : 'Add Insurance'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row"><div className="form-group"><label>Property</label><select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))}><option value="">Select</option>{properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></div><div className="form-group"><label>Insurance Type</label><select value={form.insuranceType} onChange={e => setForm(p => ({ ...p, insuranceType: e.target.value }))}>{INSURANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div></div>
                    <div className="form-row"><div className="form-group"><label>Provider</label><input type="text" placeholder="e.g. Allianz Malaysia" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} /></div><div className="form-group"><label>Coverage Amount (RM)</label><input type="number" placeholder="500000" value={form.coverageAmount} onChange={e => setForm(p => ({ ...p, coverageAmount: e.target.value }))} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div><div className="form-group"><label>Expiry Date</label><input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} /></div></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button></div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteInsuranceRecord(deleteId); setDeleteId(null); }} title="Delete Insurance" message="Remove this insurance record?" />
        </div>
    );
}
