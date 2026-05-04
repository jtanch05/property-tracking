import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { MAINTENANCE_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ToggleGroup from '../components/common/ToggleGroup';
import CustomSelect from '../components/common/CustomSelect';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Wrench, Edit3, Trash2, CheckCircle, Clock, FileText } from 'lucide-react';
import { exportToPDF } from '../utils/export';

const EMPTY = { propertyId: '', issueType: 'plumbing', description: '', reportedDate: '', vendorId: '', cost: '', status: 'open', resolvedDate: null, isScheduled: false, scheduledType: '', nextDueDate: '' };

export default function Maintenance({ embeddedPropertyId = null }) {
    const { maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, properties, vendors } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);
    const [filter, setFilter] = useState('all');

    const filtered = maintenanceRecords
        .filter(m => embeddedPropertyId ? m.propertyId === embeddedPropertyId : true)
        .filter(m => filter === 'all' || m.status === filter)
        .sort((a, b) => (b.reportedDate || '').localeCompare(a.reportedDate || ''));

    function openAdd() { setForm({ ...EMPTY, propertyId: embeddedPropertyId || properties[0]?.id || '', reportedDate: new Date().toISOString().split('T')[0] }); setEditingId(null); setShowForm(true); }
    function openEdit(m) { setForm({ propertyId: m.propertyId || '', issueType: m.issueType || 'plumbing', description: m.description || '', reportedDate: m.reportedDate || '', vendorId: m.vendorId || '', cost: m.cost || '', status: m.status || 'open', resolvedDate: m.resolvedDate || '', isScheduled: m.isScheduled || false, scheduledType: m.scheduledType || '', nextDueDate: m.nextDueDate || '' }); setEditingId(m.id); setShowForm(true); }
    function handleSubmit(e) { e.preventDefault(); const d = { ...form, cost: Number(form.cost) || 0 }; if (editingId) updateMaintenanceRecord(editingId, d); else addMaintenanceRecord(d); setShowForm(false); }

    const handleExportPDF = () => {
        const exportData = filtered.map(m => {
            const prop = properties.find(p => p.id === m.propertyId);
            const vendor = vendors.find(v => v.id === m.vendorId);
            const mType = MAINTENANCE_TYPES.find(t => t.value === m.issueType);
            return {
                property: prop?.nickname || 'Unknown',
                issueType: mType?.label || m.issueType,
                description: m.description || '—',
                reportedDate: formatDate(m.reportedDate),
                status: m.status.toUpperCase(),
                cost: formatCurrency(m.cost),
                vendor: vendor?.name || '—',
                resolvedDate: m.status === 'closed' ? formatDate(m.resolvedDate) : '—'
            };
        });
        exportToPDF(exportData, 'maintenance-report', 'Property Maintenance Report');
    };

    return (
        <div style={embeddedPropertyId ? {} : { maxWidth: 1400, margin: '0 auto' }}>
            {!embeddedPropertyId && (
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Maintenance</h1>
                        <p className="section-subtitle">{maintenanceRecords.filter(m => m.status === 'open').length} open issues</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-outline" onClick={handleExportPDF}>
                            <FileText size={16} /> Export PDF
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}>
                            <Plus size={16} /> Log Issue
                        </button>
                    </div>
                </div>
            )}

            {embeddedPropertyId && (
                <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 className="text-lg font-semibold" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Property Maintenance</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                            <FileText size={14} /> Export
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openAdd}>
                            <Plus size={14} /> Log Issue
                        </button>
                    </div>
                </div>
            )}

            {maintenanceRecords.length > 0 && (
                <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="filter-tabs">{['all', 'open', 'closed'].map(f => <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}</button>)}</div>
                </div>
            )}

            {filtered.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                    <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Property</th>
                                    <th>Vendor</th>
                                    <th>Reported</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Cost</th>
                                    <th style={{ width: 80 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(m => {
                                    const prop = properties.find(p => p.id === m.propertyId);
                                    const vendor = vendors.find(v => v.id === m.vendorId);
                                    const mType = MAINTENANCE_TYPES.find(t => t.value === m.issueType);
                                    return (
                                        <tr key={m.id} className="interactive-row" onClick={() => openEdit(m)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 500
                                                }}>
                                                    <div style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        background: 'var(--bg-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        <Wrench size={14} />
                                                    </div>
                                                    <span style={{ fontSize: 13 }}>{mType?.label || m.issueType}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{m.description || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                                {prop?.nickname || '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                                {vendor?.name || '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                                {formatDate(m.reportedDate)}
                                            </td>
                                            <td>
                                                {m.status === 'open' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className="badge badge-warning">Open</span>
                                                        <button
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--success)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '4px',
                                                                borderRadius: '50%',
                                                                transition: 'background 0.2s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--success-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateMaintenanceRecord(m.id, { status: 'closed', resolvedDate: new Date().toISOString().split('T')[0] });
                                                            }}
                                                            title="Mark as resolved"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="badge badge-success">Closed</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {m.cost > 0 ? formatCurrency(m.cost) : '—'}
                                            </td>
                                            <td>
                                                <div className="property-actions" style={{ opacity: 1, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(m); }}><Edit3 size={16} /></button>
                                                    <button className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : maintenanceRecords.length === 0 ? (
                <div className="empty-state"><Wrench size={56} /><h3>No maintenance records</h3><p>Log repairs, services, and scheduled maintenance.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Log Issue</button></div>
            ) : (
                <div className="empty-state"><Wrench size={48} /><h3>No {filter} issues</h3></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Maintenance' : 'Log Maintenance Issue'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row"><div className="form-group"><label>Property</label><CustomSelect value={form.propertyId} onChange={val => setForm(p => ({ ...p, propertyId: val }))} options={[{ value: '', label: 'Select' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]} placeholder="Select" disabled={!!embeddedPropertyId} /></div><div className="form-group"><label>Issue Type</label><CustomSelect value={form.issueType} onChange={val => setForm(p => ({ ...p, issueType: val }))} options={MAINTENANCE_TYPES} /></div></div>
                    <div className="form-group"><label>Description</label><input type="text" placeholder="Describe the issue" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="form-row"><div className="form-group"><label>Reported Date</label><input type="date" value={form.reportedDate} onChange={e => setForm(p => ({ ...p, reportedDate: e.target.value }))} /></div><div className="form-group"><label>Vendor</label><CustomSelect value={form.vendorId} onChange={val => setForm(p => ({ ...p, vendorId: val }))} options={[{ value: '', label: 'Select' }, ...vendors.map(v => ({ value: v.id, label: v.name }))]} placeholder="Select" /></div></div>
                    <div className="form-row"><div className="form-group"><label>Cost (RM)</label><input type="number" placeholder="150" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} /></div><div className="form-group"><label>Status</label><ToggleGroup options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]} value={form.status} onChange={val => setForm(p => ({ ...p, status: val }))} /></div></div>
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
