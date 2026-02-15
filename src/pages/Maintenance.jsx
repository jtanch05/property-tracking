import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { MAINTENANCE_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Wrench, Edit3, Trash2, CheckCircle, Clock } from 'lucide-react';

const EMPTY = { propertyId: '', issueType: 'plumbing', description: '', reportedDate: '', vendorId: '', cost: '', status: 'open', resolvedDate: null, isScheduled: false, scheduledType: '', nextDueDate: '' };

export default function Maintenance() {
    const { maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, properties, vendors } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);
    const [filter, setFilter] = useState('all');

    const filtered = maintenanceRecords.filter(m => filter === 'all' || m.status === filter).sort((a, b) => (b.reportedDate || '').localeCompare(a.reportedDate || ''));

    function openAdd() { setForm({ ...EMPTY, propertyId: properties[0]?.id || '', reportedDate: new Date().toISOString().split('T')[0] }); setEditingId(null); setShowForm(true); }
    function openEdit(m) { setForm({ propertyId: m.propertyId || '', issueType: m.issueType || 'plumbing', description: m.description || '', reportedDate: m.reportedDate || '', vendorId: m.vendorId || '', cost: m.cost || '', status: m.status || 'open', resolvedDate: m.resolvedDate || '', isScheduled: m.isScheduled || false, scheduledType: m.scheduledType || '', nextDueDate: m.nextDueDate || '' }); setEditingId(m.id); setShowForm(true); }
    function handleSubmit(e) { e.preventDefault(); const d = { ...form, cost: Number(form.cost) || 0 }; if (editingId) updateMaintenanceRecord(editingId, d); else addMaintenanceRecord(d); setShowForm(false); }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="section-header"><div><h1 className="section-title">Maintenance</h1><p className="section-subtitle">{maintenanceRecords.filter(m => m.status === 'open').length} open issues</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log Issue</button></div>

            {maintenanceRecords.length > 0 && (
                <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="filter-tabs">{['all', 'open', 'closed'].map(f => <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}</button>)}</div>
                </div>
            )}

            {filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(m => {
                        const prop = properties.find(p => p.id === m.propertyId);
                        const vendor = vendors.find(v => v.id === m.vendorId);
                        const mType = MAINTENANCE_TYPES.find(t => t.value === m.issueType);
                        return (
                            <div key={m.id} className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.status === 'open' ? 'var(--warning-bg)' : 'var(--success-bg)', color: m.status === 'open' ? 'var(--warning)' : 'var(--success)' }}>
                                        {m.status === 'open' ? <Clock size={18} /> : <CheckCircle size={18} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{m.description || mType?.label || m.issueType}</span>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{prop?.nickname || '—'} · {mType?.label || m.issueType}{vendor ? ` · ${vendor.name}` : ''}</span>
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>Reported {formatDate(m.reportedDate)}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {m.cost > 0 && <span style={{ fontWeight: 700 }}>{formatCurrency(m.cost)}</span>}
                                    <span className={`badge badge-${m.status === 'open' ? 'warning' : 'success'}`}>{m.status}</span>
                                    {m.status === 'open' && <button className="btn btn-sm btn-primary" onClick={() => updateMaintenanceRecord(m.id, { status: 'closed', resolvedDate: new Date().toISOString().split('T')[0] })}>Close</button>}
                                    <button className="btn-icon" onClick={() => openEdit(m)}><Edit3 size={16} /></button>
                                    <button className="btn-icon" onClick={() => setDeleteId(m.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : maintenanceRecords.length === 0 ? (
                <div className="empty-state"><Wrench size={56} /><h3>No maintenance records</h3><p>Log repairs, services, and scheduled maintenance.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log Issue</button></div>
            ) : (
                <div className="empty-state"><Wrench size={48} /><h3>No {filter} issues</h3></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Maintenance' : 'Log Maintenance Issue'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row"><div className="form-group"><label>Property</label><select value={form.propertyId} onChange={e => setForm(p => ({ ...p, propertyId: e.target.value }))}><option value="">Select</option>{properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></div><div className="form-group"><label>Issue Type</label><select value={form.issueType} onChange={e => setForm(p => ({ ...p, issueType: e.target.value }))}>{MAINTENANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div></div>
                    <div className="form-group"><label>Description</label><input type="text" placeholder="Describe the issue" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="form-row"><div className="form-group"><label>Reported Date</label><input type="date" value={form.reportedDate} onChange={e => setForm(p => ({ ...p, reportedDate: e.target.value }))} /></div><div className="form-group"><label>Vendor</label><select value={form.vendorId} onChange={e => setForm(p => ({ ...p, vendorId: e.target.value }))}><option value="">Select</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div></div>
                    <div className="form-row"><div className="form-group"><label>Cost (RM)</label><input type="number" placeholder="150" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} /></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}><option value="open">Open</option><option value="closed">Closed</option></select></div></div>
                    {form.status === 'closed' && <div className="form-group"><label>Resolved Date</label><input type="date" value={form.resolvedDate || ''} onChange={e => setForm(p => ({ ...p, resolvedDate: e.target.value }))} /></div>}
                    <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.isScheduled} onChange={e => setForm(p => ({ ...p, isScheduled: e.target.checked }))} style={{ width: 'auto' }} /> Scheduled / Recurring Maintenance</label></div>
                    {form.isScheduled && <div className="form-row"><div className="form-group"><label>Scheduled Type</label><input type="text" placeholder="e.g. Air-con service" value={form.scheduledType} onChange={e => setForm(p => ({ ...p, scheduledType: e.target.value }))} /></div><div className="form-group"><label>Next Due Date</label><input type="date" value={form.nextDueDate} onChange={e => setForm(p => ({ ...p, nextDueDate: e.target.value }))} /></div></div>}
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button></div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteMaintenanceRecord(deleteId); setDeleteId(null); }} title="Delete Maintenance" message="Remove this maintenance record?" />
        </div>
    );
}
