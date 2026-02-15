import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { UTILITY_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Droplets, Edit3, Trash2 } from 'lucide-react';

const EMPTY = { propertyId: '', utilityType: 'tnb', accountNickname: '', meterHolder: 'owner', paidBy: 'tenant', reimbursementNeeded: false, averageAmount: '', lastPaidDate: '', billingCycle: 'monthly' };

export default function Utilities() {
    const { utilityRecords, addUtilityRecord, updateUtilityRecord, deleteUtilityRecord, properties } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);

    function openAdd() { setForm({ ...EMPTY, propertyId: properties[0]?.id || '' }); setEditingId(null); setShowForm(true); }
    function openEdit(u) { setForm({ propertyId: u.propertyId || '', utilityType: u.utilityType || 'tnb', accountNickname: u.accountNickname || '', meterHolder: u.meterHolder || 'owner', paidBy: u.paidBy || 'tenant', reimbursementNeeded: u.reimbursementNeeded || false, averageAmount: u.averageAmount || '', lastPaidDate: u.lastPaidDate || '', billingCycle: u.billingCycle || 'monthly' }); setEditingId(u.id); setShowForm(true); }
    function handleSubmit(e) { e.preventDefault(); const d = { ...form, averageAmount: Number(form.averageAmount) || 0 }; if (editingId) updateUtilityRecord(editingId, d); else addUtilityRecord(d); setShowForm(false); }

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="section-header"><div><h1 className="section-title">Utilities</h1><p className="section-subtitle">TNB, Water, Indah Water tracking</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Utility</button></div>

            {utilityRecords.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {utilityRecords.map(u => {
                        const prop = properties.find(p => p.id === u.propertyId);
                        const uType = UTILITY_TYPES.find(t => t.value === u.utilityType);
                        return (
                            <div key={u.id} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{u.accountNickname || uType?.label || u.utilityType}</span>
                                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{prop?.nickname || '—'} · {u.billingCycle} · Paid by {u.paidBy}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, display: 'block' }}>~{formatCurrency(u.averageAmount)}/mo</span>
                                        {u.lastPaidDate && <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Last paid {formatDate(u.lastPaidDate)}</span>}
                                    </div>
                                    {u.reimbursementNeeded && <span className="badge badge-warning">Reimburse</span>}
                                    <button className="btn-icon" onClick={() => openEdit(u)}><Edit3 size={16} /></button>
                                    <button className="btn-icon" onClick={() => setDeleteId(u.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state"><Droplets size={56} /><h3>No utility records</h3><p>Track electricity, water, and sewage billing.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Utility</button></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Utility' : 'Add Utility'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row"><div className="form-group"><label>Property</label><select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))}><option value="">Select</option>{properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></div><div className="form-group"><label>Utility Type</label><select value={form.utilityType} onChange={e => setForm(p => ({ ...p, utilityType: e.target.value }))}>{UTILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div></div>
                    <div className="form-group"><label>Account Nickname</label><input type="text" placeholder="e.g. TNB - Unit A-12-3" value={form.accountNickname} onChange={e => setForm(p => ({ ...p, accountNickname: e.target.value }))} /></div>
                    <div className="form-row"><div className="form-group"><label>Meter Holder</label><select value={form.meterHolder} onChange={e => setForm(p => ({ ...p, meterHolder: e.target.value }))}><option value="owner">Owner</option><option value="tenant">Tenant</option></select></div><div className="form-group"><label>Paid By</label><select value={form.paidBy} onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}><option value="tenant">Tenant</option><option value="landlord">Landlord</option></select></div></div>
                    <div className="form-row"><div className="form-group"><label>Average Amount (RM/mo)</label><input type="number" placeholder="120" value={form.averageAmount} onChange={e => setForm(p => ({ ...p, averageAmount: e.target.value }))} /></div><div className="form-group"><label>Billing Cycle</label><select value={form.billingCycle} onChange={e => setForm(p => ({ ...p, billingCycle: e.target.value }))}><option value="monthly">Monthly</option><option value="bimonthly">Bi-monthly</option></select></div></div>
                    <div className="form-row"><div className="form-group"><label>Last Paid Date</label><input type="date" value={form.lastPaidDate} onChange={e => setForm(p => ({ ...p, lastPaidDate: e.target.value }))} /></div><div className="form-group"><label>Reimbursement Needed?</label><select value={form.reimbursementNeeded ? 'yes' : 'no'} onChange={e => setForm(p => ({ ...p, reimbursementNeeded: e.target.value === 'yes' }))}><option value="no">No</option><option value="yes">Yes</option></select></div></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button></div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteUtilityRecord(deleteId); setDeleteId(null); }} title="Delete Utility" message="Remove this utility record?" />
        </div>
    );
}
