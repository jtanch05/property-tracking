import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Plus, Users, Edit3, Trash2, Phone, Mail, Search, UserCheck, UserX } from 'lucide-react';
import './Tenants.css';

const EMPTY_TENANT = {
    propertyId: '',
    name: '',
    phone: '',
    email: '',
    status: 'active',
    moveInDate: '',
    moveOutDate: '',
    exitReason: '',
};

export default function Tenants() {
    const { tenants, addTenant, updateTenant, deleteTenant, properties } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_TENANT);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const filtered = tenants
        .filter(t => filter === 'all' || t.status === filter)
        .filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.phone?.includes(search) ||
            t.email?.toLowerCase().includes(search.toLowerCase())
        );

    function openAdd() {
        setForm({ ...EMPTY_TENANT, propertyId: properties[0]?.id || '' });
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(tenant) {
        setForm({
            propertyId: tenant.propertyId || '',
            name: tenant.name || '',
            phone: tenant.phone || '',
            email: tenant.email || '',
            status: tenant.status || 'active',
            moveInDate: tenant.moveInDate || '',
            moveOutDate: tenant.moveOutDate || '',
            exitReason: tenant.exitReason || '',
        });
        setEditingId(tenant.id);
        setShowForm(true);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) return;
        if (editingId) {
            updateTenant(editingId, form);
        } else {
            addTenant(form);
        }
        setShowForm(false);
    }

    return (
        <div className="tenants-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Tenants</h1>
                    <p className="section-subtitle">{tenants.filter(t => t.status === 'active').length} active tenants</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add Tenant
                </button>
            </div>

            {tenants.length > 0 && (
                <>
                    <div className="filter-bar">
                        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                        </div>
                        <div className="filter-tabs">
                            {['all', 'active', 'vacated'].map(f => (
                                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
                                    {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Vacated'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="tenant-list">
                        {filtered.map(tenant => {
                            const prop = properties.find(p => p.id === tenant.propertyId);
                            return (
                                <div key={tenant.id} className="card tenant-card">
                                    <div className="tenant-card-left">
                                        <div className={`tenant-avatar ${tenant.status === 'active' ? 'active' : 'vacated'}`}>
                                            {tenant.status === 'active' ? <UserCheck size={18} /> : <UserX size={18} />}
                                        </div>
                                        <div className="tenant-info">
                                            <span className="tenant-name">{tenant.name}</span>
                                            {prop && <span className="tenant-prop">{prop.nickname}</span>}
                                            <div className="tenant-contacts">
                                                {tenant.phone && <span className="tenant-contact"><Phone size={12} /> {tenant.phone}</span>}
                                                {tenant.email && <span className="tenant-contact"><Mail size={12} /> {tenant.email}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tenant-card-right">
                                        <span className={`badge badge-${tenant.status === 'active' ? 'success' : 'neutral'}`}>
                                            {tenant.status}
                                        </span>
                                        <div className="property-actions" style={{ opacity: 1 }}>
                                            <button className="btn-icon" onClick={() => openEdit(tenant)}><Edit3 size={16} /></button>
                                            <button className="btn-icon" onClick={() => setDeleteId(tenant.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="empty-state">
                                <Search size={40} />
                                <h3>No tenants found</h3>
                            </div>
                        )}
                    </div>
                </>
            )}

            {tenants.length === 0 && (
                <div className="empty-state">
                    <Users size={56} />
                    <h3>No tenants yet</h3>
                    <p>Add a tenant and link them to a property.</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Tenant</button>
                </div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Tenant' : 'Add Tenant'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Property *</label>
                        <select value={form.propertyId} onChange={e => setForm(prev => ({ ...prev, propertyId: e.target.value }))} required>
                            <option value="">Select property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Name (as per agreement) *</label>
                        <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required autoFocus />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="tel" placeholder="+60121234567" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                                <option value="active">Active</option>
                                <option value="vacated">Vacated</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Move-in Date</label>
                            <input type="date" value={form.moveInDate} onChange={e => setForm(prev => ({ ...prev, moveInDate: e.target.value }))} />
                        </div>
                    </div>
                    {form.status === 'vacated' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Move-out Date</label>
                                <input type="date" value={form.moveOutDate} onChange={e => setForm(prev => ({ ...prev, moveOutDate: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Exit Reason</label>
                                <input type="text" placeholder="Optional" value={form.exitReason} onChange={e => setForm(prev => ({ ...prev, exitReason: e.target.value }))} />
                            </div>
                        </div>
                    )}
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Tenant'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteTenant(deleteId); setDeleteId(null); }} title="Delete Tenant" message="Remove this tenant record? This cannot be undone." />
        </div>
    );
}
