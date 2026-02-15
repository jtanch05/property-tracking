import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { VENDOR_SERVICE_TYPES } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate } from '../utils/formatters';
import { Plus, Contact, Edit3, Trash2, Phone, Star, Search } from 'lucide-react';

const EMPTY = { name: '', serviceType: 'general', phone: '', rating: 0, notes: '', lastUsedDate: '' };

export default function Vendors() {
    const { vendors, addVendor, updateVendor, deleteVendor } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');

    const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.serviceType?.toLowerCase().includes(search.toLowerCase()));

    function openAdd() { setForm(EMPTY); setEditingId(null); setShowForm(true); }
    function openEdit(v) { setForm({ name: v.name || '', serviceType: v.serviceType || 'general', phone: v.phone || '', rating: v.rating || 0, notes: v.notes || '', lastUsedDate: v.lastUsedDate || '' }); setEditingId(v.id); setShowForm(true); }
    function handleSubmit(e) { e.preventDefault(); if (!form.name.trim()) return; const d = { ...form, rating: Number(form.rating) || 0 }; if (editingId) updateVendor(editingId, d); else addVendor(d); setShowForm(false); }

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="section-header"><div><h1 className="section-title">Vendors</h1><p className="section-subtitle">{vendors.length} saved contacts</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Vendor</button></div>

            {vendors.length > 0 && (
                <div className="search-bar" style={{ marginBottom: 'var(--space-lg)' }}><Search size={18} className="search-icon" /><input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" /></div>
            )}

            {filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
                    {filtered.map(v => {
                        const sType = VENDOR_SERVICE_TYPES.find(t => t.value === v.serviceType);
                        return (
                            <div key={v.id} className="card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontWeight: 600, fontSize: 'var(--font-md)' }}>{v.name}</span>
                                    <div style={{ display: 'flex', gap: 2 }}><button className="btn-icon" onClick={() => openEdit(v)}><Edit3 size={16} /></button><button className="btn-icon" onClick={() => setDeleteId(v.id)}><Trash2 size={16} /></button></div>
                                </div>
                                <span className="badge badge-neutral">{sType?.label || v.serviceType}</span>
                                {v.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}><Phone size={14} />{v.phone}</div>}
                                {v.rating > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= v.rating ? 'var(--warning)' : 'none'} color={i <= v.rating ? 'var(--warning)' : 'var(--text-tertiary)'} />)}</div>}
                                {v.notes && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginTop: 8 }}>{v.notes}</p>}
                                {v.lastUsedDate && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Last used: {formatDate(v.lastUsedDate)}</span>}
                            </div>
                        );
                    })}
                </div>
            ) : vendors.length === 0 ? (
                <div className="empty-state"><Contact size={56} /><h3>No vendors</h3><p>Save plumber, electrician, and contractor contacts.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Vendor</button></div>
            ) : (
                <div className="empty-state"><Search size={40} /><h3>No results</h3></div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Vendor' : 'Add Vendor'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Name *</label><input type="text" placeholder="Vendor name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus /></div>
                    <div className="form-row"><div className="form-group"><label>Service Type</label><select value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}>{VENDOR_SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div className="form-group"><label>Phone</label><input type="tel" placeholder="+60191234567" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div></div>
                    <div className="form-row"><div className="form-group"><label>Rating (1-5)</label><input type="number" min={0} max={5} value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} /></div><div className="form-group"><label>Last Used</label><input type="date" value={form.lastUsedDate} onChange={e => setForm(p => ({ ...p, lastUsedDate: e.target.value }))} /></div></div>
                    <div className="form-group"><label>Notes</label><textarea placeholder="Any notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add'}</button></div>
                </form>
            </Modal>
            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteVendor(deleteId); setDeleteId(null); }} title="Delete Vendor" message="Remove this vendor?" />
        </div>
    );
}
