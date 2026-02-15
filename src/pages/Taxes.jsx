import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { MALAYSIA_STATES } from '../data/malaysiaData';
import { LOCAL_COUNCILS, CUKAI_TANAH_DUE, CUKAI_TAKSIRAN_CYCLES } from '../data/localCouncils';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatRelativeDate } from '../utils/formatters';
import { Plus, Receipt, Edit3, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const EMPTY_TAX = { propertyId: '', taxType: 'cukai_tanah', state: '', localCouncil: '', amount: '', dueDate: '', status: 'unpaid', paymentCycle: 'yearly' };

export default function Taxes() {
    const { taxRecords, addTaxRecord, updateTaxRecord, deleteTaxRecord, properties } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_TAX);
    const [deleteId, setDeleteId] = useState(null);

    function openAdd() {
        setForm({ ...EMPTY_TAX, propertyId: properties[0]?.id || '' });
        setEditingId(null); setShowForm(true);
    }
    function openEdit(t) {
        setForm({ propertyId: t.propertyId || '', taxType: t.taxType || 'cukai_tanah', state: t.state || '', localCouncil: t.localCouncil || '', amount: t.amount || '', dueDate: t.dueDate || '', status: t.status || 'unpaid', paymentCycle: t.paymentCycle || 'yearly' });
        setEditingId(t.id); setShowForm(true);
    }
    function handleSubmit(e) {
        e.preventDefault();
        const data = { ...form, amount: Number(form.amount) || 0 };
        if (editingId) updateTaxRecord(editingId, data); else addTaxRecord(data);
        setShowForm(false);
    }

    const councils = form.state ? (LOCAL_COUNCILS[form.state] || []) : [];

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="section-header">
                <div><h1 className="section-title">Taxes</h1><p className="section-subtitle">Cukai Tanah & Cukai Taksiran</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Tax Record</button>
            </div>

            {taxRecords.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {taxRecords.map(t => {
                        const prop = properties.find(p => p.id === t.propertyId);
                        return (
                            <div key={t.id} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.status === 'paid' ? 'var(--success-bg)' : 'var(--warning-bg)', color: t.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
                                        {t.status === 'paid' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{t.taxType === 'cukai_tanah' ? 'Cukai Tanah' : 'Cukai Taksiran'}</span>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{prop?.nickname || '—'} · {t.state || '—'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, display: 'block' }}>{formatCurrency(t.amount)}</span>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Due {formatDate(t.dueDate)}</span>
                                    </div>
                                    <span className={`badge badge-${t.status === 'paid' ? 'success' : 'warning'}`}>{t.status}</span>
                                    {t.status !== 'paid' && <button className="btn btn-sm btn-primary" onClick={() => updateTaxRecord(t.id, { status: 'paid' })}>Mark Paid</button>}
                                    <button className="btn-icon" onClick={() => openEdit(t)}><Edit3 size={16} /></button>
                                    <button className="btn-icon" onClick={() => setDeleteId(t.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state"><Receipt size={56} /><h3>No tax records</h3><p>Track Cukai Tanah and Cukai Taksiran payments.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Tax Record</button></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Tax' : 'Add Tax Record'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Property</label><select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))}><option value="">Select</option>{properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Tax Type</label><select value={form.taxType} onChange={e => setForm(p => ({ ...p, taxType: e.target.value }))}><option value="cukai_tanah">Cukai Tanah</option><option value="cukai_taksiran">Cukai Taksiran</option></select></div>
                        <div className="form-group"><label>State</label><select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value, localCouncil: '' }))}><option value="">Select</option>{MALAYSIA_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}</select></div>
                    </div>
                    {form.taxType === 'cukai_taksiran' && <div className="form-row"><div className="form-group"><label>Local Council</label><select value={form.localCouncil} onChange={e => setForm(p => ({ ...p, localCouncil: e.target.value }))}><option value="">Select</option>{councils.map(c => <option key={c} value={c}>{c}</option>)}</select></div><div className="form-group"><label>Payment Cycle</label><select value={form.paymentCycle} onChange={e => setForm(p => ({ ...p, paymentCycle: e.target.value }))}>{CUKAI_TAKSIRAN_CYCLES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div></div>}
                    <div className="form-row">
                        <div className="form-group"><label>Amount (RM)</label><input type="number" placeholder="150" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                        <div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
                    </div>
                    <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button></div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteTaxRecord(deleteId); setDeleteId(null); }} title="Delete Tax Record" message="Remove this tax record?" />
        </div>
    );
}
