import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { MALAYSIA_STATES, PROPERTY_TYPES } from '../data/malaysiaData';
import { LOCAL_COUNCILS } from '../data/localCouncils';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Plus, Building2, Edit3, Trash2, MapPin, Layers, Car, Search, Users, Home, BedDouble, Bath, Ruler } from 'lucide-react';
import './Properties.css';

// --- Field visibility config per property type ---
// 'show' = visible, 'hide' = hidden, 'optional' = visible but marked optional
const FIELD_CONFIG = {
    condo: {
        strata: { show: true, default: true },
        unitNumber: { show: true, label: 'Unit Number', placeholder: 'e.g. A-12-3' },
        blockTower: { show: true, label: 'Block / Tower', placeholder: 'e.g. Tower A' },
        floor: { show: true },
        lotNumber: { show: false },
        landSizeSqft: { show: false },
        storeys: { show: false },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    landed_terrace: {
        strata: { show: false, default: false },
        unitNumber: { show: false },
        blockTower: { show: false },
        floor: { show: false },
        lotNumber: { show: true, label: 'House / Lot No.', placeholder: 'e.g. No. 23' },
        landSizeSqft: { show: true },
        storeys: { show: true },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    landed_semi: {
        strata: { show: false, default: false },
        unitNumber: { show: false },
        blockTower: { show: false },
        floor: { show: false },
        lotNumber: { show: true, label: 'House / Lot No.', placeholder: 'e.g. No. 8' },
        landSizeSqft: { show: true },
        storeys: { show: true },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    landed_bungalow: {
        strata: { show: false, default: false },
        unitNumber: { show: false },
        blockTower: { show: false },
        floor: { show: false },
        lotNumber: { show: true, label: 'House / Lot No.', placeholder: 'e.g. No. 1' },
        landSizeSqft: { show: true },
        storeys: { show: true },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    landed_townhouse: {
        strata: { show: true, default: true },
        unitNumber: { show: true, label: 'Unit Number', placeholder: 'e.g. TH-05' },
        blockTower: { show: 'optional' },
        floor: { show: 'optional' },
        lotNumber: { show: false },
        landSizeSqft: { show: false },
        storeys: { show: true },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    shoplot: {
        strata: { show: 'optional', default: false },
        unitNumber: { show: true, label: 'Lot / Unit No.', placeholder: 'e.g. G-01' },
        blockTower: { show: false },
        floor: { show: true },
        lotNumber: { show: false },
        landSizeSqft: { show: true },
        storeys: { show: true },
        bedrooms: { show: false },
        bathrooms: { show: 'optional' },
        furnished: { show: false },
    },
    studio: {
        strata: { show: true, default: true },
        unitNumber: { show: true, label: 'Unit Number', placeholder: 'e.g. B-5-2' },
        blockTower: { show: true, label: 'Block / Tower', placeholder: 'e.g. Block B' },
        floor: { show: true },
        lotNumber: { show: false },
        landSizeSqft: { show: false },
        storeys: { show: false },
        bedrooms: { show: true },
        bathrooms: { show: true },
        furnished: { show: true },
    },
    other: {
        strata: { show: 'optional', default: false },
        unitNumber: { show: 'optional', label: 'Unit / Lot Number', placeholder: 'e.g. A-1' },
        blockTower: { show: 'optional' },
        floor: { show: 'optional' },
        lotNumber: { show: 'optional', label: 'Lot Number', placeholder: 'e.g. Lot 123' },
        landSizeSqft: { show: 'optional' },
        storeys: { show: 'optional' },
        bedrooms: { show: 'optional' },
        bathrooms: { show: 'optional' },
        furnished: { show: 'optional' },
    },
};

function getConfig(type) {
    return FIELD_CONFIG[type] || FIELD_CONFIG.other;
}

function isVisible(config, field) {
    const f = config[field];
    return f && f.show !== false;
}

const EMPTY_PROPERTY = {
    nickname: '',
    type: 'condo',
    state: '',
    localCouncil: '',
    strata: true,
    yearBuilt: '',
    unitNumber: '',
    blockTower: '',
    floor: '',
    lotNumber: '',
    landSizeSqft: '',
    builtUpSqft: '',
    storeys: '',
    bedrooms: '',
    bathrooms: '',
    parkingCount: '',
    furnished: '',
    notes: '',
    coOwners: [],
};

export default function Properties() {
    const { properties, addProperty, updateProperty, deleteProperty, tenants } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_PROPERTY);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');

    const filteredProperties = properties.filter(p =>
        p.nickname.toLowerCase().includes(search.toLowerCase()) ||
        p.state?.toLowerCase().includes(search.toLowerCase()) ||
        p.type?.toLowerCase().includes(search.toLowerCase())
    );

    const config = useMemo(() => getConfig(form.type), [form.type]);

    function openAdd() {
        setForm(EMPTY_PROPERTY);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(prop) {
        setForm({
            nickname: prop.nickname || '',
            type: prop.type || 'condo',
            state: prop.state || '',
            localCouncil: prop.localCouncil || '',
            strata: prop.strata ?? false,
            yearBuilt: prop.yearBuilt || '',
            unitNumber: prop.unitNumber || '',
            blockTower: prop.blockTower || '',
            floor: prop.floor || '',
            lotNumber: prop.lotNumber || '',
            landSizeSqft: prop.landSizeSqft || '',
            builtUpSqft: prop.builtUpSqft || '',
            storeys: prop.storeys || '',
            bedrooms: prop.bedrooms || '',
            bathrooms: prop.bathrooms || '',
            parkingCount: prop.parkingCount || '',
            furnished: prop.furnished || '',
            notes: prop.notes || '',
            coOwners: prop.coOwners || [],
        });
        setEditingId(prop.id);
        setShowForm(true);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.nickname.trim()) return;

        const data = {
            ...form,
            yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
            floor: form.floor ? Number(form.floor) : null,
            builtUpSqft: form.builtUpSqft ? Number(form.builtUpSqft) : null,
            landSizeSqft: form.landSizeSqft ? Number(form.landSizeSqft) : null,
            storeys: form.storeys ? Number(form.storeys) : null,
            bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
            bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            parkingCount: form.parkingCount ? Number(form.parkingCount) : 0,
        };

        if (editingId) {
            updateProperty(editingId, data);
        } else {
            addProperty(data);
        }
        setShowForm(false);
        setEditingId(null);
    }

    function handleDelete() {
        if (deleteId) {
            deleteProperty(deleteId);
            setDeleteId(null);
        }
    }

    function handleChange(field, value) {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            // Reset local council when state changes
            if (field === 'state') next.localCouncil = '';
            // Auto-set strata and clear irrelevant fields when type changes
            if (field === 'type') {
                const newConfig = getConfig(value);
                if (newConfig.strata && newConfig.strata.default !== undefined) {
                    next.strata = newConfig.strata.default;
                }
                // Clear fields that are hidden for the new type
                if (!newConfig.unitNumber?.show) next.unitNumber = '';
                if (!newConfig.blockTower?.show) next.blockTower = '';
                if (!newConfig.floor?.show) next.floor = '';
                if (!newConfig.lotNumber?.show) next.lotNumber = '';
                if (!newConfig.landSizeSqft?.show) next.landSizeSqft = '';
                if (!newConfig.storeys?.show) next.storeys = '';
                if (!newConfig.bedrooms?.show) next.bedrooms = '';
                if (!newConfig.bathrooms?.show) next.bathrooms = '';
                if (!newConfig.furnished?.show) next.furnished = '';
            }
            return next;
        });
    }

    const councils = form.state ? (LOCAL_COUNCILS[form.state] || []) : [];

    // Helper to check if type is "high-rise"
    const isHighRise = ['condo', 'studio', 'landed_townhouse'].includes(form.type);
    const isLanded = ['landed_terrace', 'landed_semi', 'landed_bungalow'].includes(form.type);

    return (
        <div className="properties-page">
            <div className="section-header">
                <div>
                    <h1 className="section-title">Properties</h1>
                    <p className="section-subtitle">{properties.length} properties registered</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} />
                    Add Property
                </button>
            </div>

            {/* Search */}
            {properties.length > 0 && (
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
            )}

            {/* Property List */}
            {filteredProperties.length > 0 ? (
                <div className="property-grid">
                    {filteredProperties.map(prop => {
                        const activeTenant = tenants.find(t => t.propertyId === prop.id && t.status === 'active');
                        const propType = PROPERTY_TYPES.find(t => t.value === prop.type);
                        return (
                            <div key={prop.id} className="card property-card">
                                <div className="property-card-header">
                                    <div className="property-icon">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="property-actions">
                                        <button className="btn-icon" onClick={() => openEdit(prop)} title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="btn-icon" onClick={() => setDeleteId(prop.id)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="property-name">{prop.nickname}</h3>
                                <div className="property-meta">
                                    {propType && <span className="badge badge-neutral">{propType.label}</span>}
                                    {prop.strata && <span className="badge badge-info">Strata</span>}
                                    {prop.furnished && prop.furnished !== 'unfurnished' && (
                                        <span className="badge badge-neutral">{prop.furnished === 'fully' ? 'Furnished' : 'Partial'}</span>
                                    )}
                                    {activeTenant ? (
                                        <span className="badge badge-success">Occupied</span>
                                    ) : (
                                        <span className="badge badge-danger">Vacant</span>
                                    )}
                                </div>

                                <div className="property-details">
                                    {prop.state && (
                                        <div className="detail-item">
                                            <MapPin size={14} />
                                            <span>{prop.state}{prop.localCouncil ? ` · ${prop.localCouncil}` : ''}</span>
                                        </div>
                                    )}
                                    {prop.builtUpSqft && (
                                        <div className="detail-item">
                                            <Layers size={14} />
                                            <span>
                                                {prop.builtUpSqft} sqft
                                                {prop.landSizeSqft ? ` (land: ${prop.landSizeSqft} sqft)` : ''}
                                                {prop.floor ? ` · Floor ${prop.floor}` : ''}
                                            </span>
                                        </div>
                                    )}
                                    {(prop.bedrooms || prop.bathrooms) && (
                                        <div className="detail-item">
                                            <BedDouble size={14} />
                                            <span>
                                                {prop.bedrooms ? `${prop.bedrooms} bed` : ''}
                                                {prop.bedrooms && prop.bathrooms ? ' · ' : ''}
                                                {prop.bathrooms ? `${prop.bathrooms} bath` : ''}
                                            </span>
                                        </div>
                                    )}
                                    {prop.parkingCount > 0 && (
                                        <div className="detail-item">
                                            <Car size={14} />
                                            <span>{prop.parkingCount} parking</span>
                                        </div>
                                    )}
                                </div>

                                {activeTenant && (
                                    <div className="property-tenant">
                                        <span className="tenant-label">Tenant:</span>
                                        <span className="tenant-name">{activeTenant.name}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : properties.length === 0 ? (
                <div className="empty-state">
                    <Building2 size={56} />
                    <h3>No properties yet</h3>
                    <p>Add your first property to get started with tracking rent, taxes, and maintenance.</p>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={16} />
                        Add Property
                    </button>
                </div>
            ) : (
                <div className="empty-state">
                    <Search size={48} />
                    <h3>No results</h3>
                    <p>No properties match "{search}"</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingId ? 'Edit Property' : 'Add Property'}
                size="lg"
            >
                <form onSubmit={handleSubmit}>
                    {/* --- Section: Basic Info --- */}
                    <div className="form-section-header">Basic Information</div>

                    <div className="form-group">
                        <label>Property Nickname *</label>
                        <input
                            type="text"
                            placeholder='e.g. "Taman Melati Condo A-12-3"'
                            value={form.nickname}
                            onChange={e => handleChange('nickname', e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Property Type *</label>
                            <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                                {PROPERTY_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        {isVisible(config, 'strata') && (
                            <div className="form-group">
                                <label>
                                    Strata Title
                                    {config.strata.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <select value={form.strata ? 'yes' : 'no'} onChange={e => handleChange('strata', e.target.value === 'yes')}>
                                    <option value="no">Non-Strata</option>
                                    <option value="yes">Strata</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* --- Section: Location --- */}
                    <div className="form-section-header">Location</div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>State</label>
                            <select value={form.state} onChange={e => handleChange('state', e.target.value)}>
                                <option value="">Select state</option>
                                {MALAYSIA_STATES.map(s => (
                                    <option key={s.code} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Local Council <span className="optional-tag">Optional</span></label>
                            <select value={form.localCouncil} onChange={e => handleChange('localCouncil', e.target.value)} disabled={!form.state}>
                                <option value="">Select council</option>
                                {councils.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* --- Section: Unit / Address Details (dynamic) --- */}
                    <div className="form-section-header">
                        {isHighRise ? 'Unit Details' : isLanded ? 'Address Details' : 'Property Details'}
                    </div>

                    <div className="form-row">
                        {isVisible(config, 'lotNumber') && (
                            <div className="form-group">
                                <label>
                                    {config.lotNumber?.label || 'Lot Number'}
                                    {config.lotNumber?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder={config.lotNumber?.placeholder || 'e.g. Lot 123'}
                                    value={form.lotNumber}
                                    onChange={e => handleChange('lotNumber', e.target.value)}
                                />
                            </div>
                        )}
                        {isVisible(config, 'unitNumber') && (
                            <div className="form-group">
                                <label>
                                    {config.unitNumber?.label || 'Unit Number'}
                                    {config.unitNumber?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder={config.unitNumber?.placeholder || 'e.g. A-12-3'}
                                    value={form.unitNumber}
                                    onChange={e => handleChange('unitNumber', e.target.value)}
                                />
                            </div>
                        )}
                        {isVisible(config, 'blockTower') && (
                            <div className="form-group">
                                <label>
                                    {config.blockTower?.label || 'Block / Tower'}
                                    {config.blockTower?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder={config.blockTower?.placeholder || 'e.g. Tower A'}
                                    value={form.blockTower}
                                    onChange={e => handleChange('blockTower', e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        {isVisible(config, 'floor') && (
                            <div className="form-group">
                                <label>
                                    Floor Level
                                    {config.floor?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 12"
                                    value={form.floor}
                                    onChange={e => handleChange('floor', e.target.value)}
                                />
                            </div>
                        )}
                        {isVisible(config, 'storeys') && (
                            <div className="form-group">
                                <label>
                                    Number of Storeys
                                    {config.storeys?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={form.storeys}
                                    onChange={e => handleChange('storeys', e.target.value)}
                                    min="1"
                                />
                            </div>
                        )}
                    </div>

                    {/* --- Section: Size & Rooms --- */}
                    <div className="form-section-header">Size & Specifications <span className="optional-tag">Optional</span></div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Built-up Size (sqft) <span className="optional-tag">Optional</span></label>
                            <input
                                type="number"
                                placeholder="e.g. 1200"
                                value={form.builtUpSqft}
                                onChange={e => handleChange('builtUpSqft', e.target.value)}
                            />
                        </div>
                        {isVisible(config, 'landSizeSqft') && (
                            <div className="form-group">
                                <label>
                                    Land Size (sqft)
                                    {config.landSizeSqft?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1650"
                                    value={form.landSizeSqft}
                                    onChange={e => handleChange('landSizeSqft', e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        {isVisible(config, 'bedrooms') && (
                            <div className="form-group">
                                <label>
                                    Bedrooms
                                    {config.bedrooms?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 3"
                                    value={form.bedrooms}
                                    onChange={e => handleChange('bedrooms', e.target.value)}
                                    min="0"
                                />
                            </div>
                        )}
                        {isVisible(config, 'bathrooms') && (
                            <div className="form-group">
                                <label>
                                    Bathrooms
                                    {config.bathrooms?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={form.bathrooms}
                                    onChange={e => handleChange('bathrooms', e.target.value)}
                                    min="0"
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Parking Bays <span className="optional-tag">Optional</span></label>
                            <input
                                type="number"
                                placeholder="e.g. 2"
                                value={form.parkingCount}
                                onChange={e => handleChange('parkingCount', e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Year Built <span className="optional-tag">Optional</span></label>
                            <input
                                type="number"
                                placeholder="e.g. 2015"
                                value={form.yearBuilt}
                                onChange={e => handleChange('yearBuilt', e.target.value)}
                            />
                        </div>
                        {isVisible(config, 'furnished') && (
                            <div className="form-group">
                                <label>
                                    Furnished
                                    {config.furnished?.show === 'optional' && <span className="optional-tag">Optional</span>}
                                </label>
                                <select value={form.furnished} onChange={e => handleChange('furnished', e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="partial">Partially Furnished</option>
                                    <option value="fully">Fully Furnished</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* --- Section: Notes --- */}
                    <div className="form-section-header">Additional</div>

                    <div className="form-group">
                        <label>Notes <span className="optional-tag">Optional</span></label>
                        <textarea
                            placeholder="Any additional notes..."
                            value={form.notes}
                            onChange={e => handleChange('notes', e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Co-Owners Section */}
                    <div className="co-owners-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={{ fontWeight: 600, margin: 0 }}><Users size={14} style={{ marginRight: 4 }} /> Co-Owners <span className="optional-tag">Optional</span></label>
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => handleChange('coOwners', [...form.coOwners, { id: crypto.randomUUID(), name: '', splitPercent: 0, isPrimary: form.coOwners.length === 0 }])}>
                                <Plus size={14} /> Add
                            </button>
                        </div>
                        {form.coOwners.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {form.coOwners.map((owner, idx) => (
                                    <div key={owner.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                        <input type="text" placeholder="Owner name" value={owner.name} style={{ flex: 1 }}
                                            onChange={e => { const arr = [...form.coOwners]; arr[idx] = { ...arr[idx], name: e.target.value }; handleChange('coOwners', arr); }} />
                                        <input type="number" placeholder="%" value={owner.splitPercent} style={{ width: 70 }} min={0} max={100}
                                            onChange={e => { const arr = [...form.coOwners]; arr[idx] = { ...arr[idx], splitPercent: Number(e.target.value) || 0 }; handleChange('coOwners', arr); }} />
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>%</span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-xs)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            <input type="radio" name="primary-owner" checked={owner.isPrimary}
                                                onChange={() => { const arr = form.coOwners.map((o, i) => ({ ...o, isPrimary: i === idx })); handleChange('coOwners', arr); }} />
                                            Primary
                                        </label>
                                        <button type="button" className="btn-icon" onClick={() => handleChange('coOwners', form.coOwners.filter((_, i) => i !== idx))}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(() => {
                                    const total = form.coOwners.reduce((s, o) => s + (o.splitPercent || 0), 0);
                                    return total !== 100 && form.coOwners.length > 0 ? (
                                        <span style={{ fontSize: 'var(--font-xs)', color: total > 100 ? 'var(--danger)' : 'var(--warning)' }}>
                                            ⚠ Split total: {total}% (should be 100%)
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                        )}
                        {form.coOwners.length === 0 && (
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>No co-owners — you are the sole owner</span>
                        )}
                    </div>

                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Save Changes' : 'Add Property'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Property"
                message="Are you sure you want to delete this property? All associated records (tenants, rent, taxes, etc.) will remain but won't be linked."
            />
        </div>
    );
}
