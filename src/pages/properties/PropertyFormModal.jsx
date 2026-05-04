import React from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { MALAYSIA_STATES, PROPERTY_TYPES } from '../../data/malaysiaData';
import { Button, Dialog, Select, SegmentedControl } from '../../components/ui';
import { isPropertyFieldVisible } from './propertyConfig';

export default function PropertyFormModal({
    isOpen,
    editingId,
    form,
    config,
    councils,
    isHighRise,
    isLanded,
    onChange,
    onClose,
    onSubmit,
}) {
    const coOwnerTotal = form.coOwners.reduce((sum, owner) => sum + (owner.splitPercent || 0), 0);

    function updateCoOwner(index, updates) {
        const nextCoOwners = [...form.coOwners];
        nextCoOwners[index] = { ...nextCoOwners[index], ...updates };
        onChange('coOwners', nextCoOwners);
    }

    function addCoOwner() {
        onChange('coOwners', [
            ...form.coOwners,
            {
                id: crypto.randomUUID(),
                name: '',
                splitPercent: 0,
                isPrimary: form.coOwners.length === 0,
            },
        ]);
    }

    function setPrimaryCoOwner(index) {
        onChange('coOwners', form.coOwners.map((owner, ownerIndex) => ({
            ...owner,
            isPrimary: ownerIndex === index,
        })));
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title={editingId ? 'Edit Property' : 'Add Property'}
            size="lg"
        >
            <form onSubmit={onSubmit}>
                <div className="form-section-header">Basic Information</div>

                <div className="form-group">
                    <label>Property Nickname *</label>
                    <input
                        type="text"
                        placeholder='e.g. "Taman Melati Condo A-12-3"'
                        value={form.nickname}
                        onChange={e => onChange('nickname', e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Property Type *</label>
                        <Select
                            value={form.type}
                            onChange={val => onChange('type', val)}
                            options={PROPERTY_TYPES}
                        />
                    </div>
                    {isPropertyFieldVisible(config, 'strata') && (
                        <div className="form-group">
                            <label>
                                Strata Title
                                {config.strata.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <SegmentedControl
                                options={[
                                    { value: 'no', label: 'Non-Strata' },
                                    { value: 'yes', label: 'Strata' },
                                ]}
                                value={form.strata ? 'yes' : 'no'}
                                onChange={val => onChange('strata', val === 'yes')}
                            />
                        </div>
                    )}
                </div>

                <div className="form-section-header">Location</div>

                <div className="form-row">
                    <div className="form-group">
                        <label>State</label>
                        <Select
                            value={form.state}
                            onChange={val => onChange('state', val)}
                            options={[{ value: '', label: 'Select state' }, ...MALAYSIA_STATES.map(s => ({ value: s.name, label: s.name }))]}
                            placeholder="Select state"
                        />
                    </div>
                    <div className="form-group">
                        <label>Local Council <span className="optional-tag">(Optional)</span></label>
                        <Select
                            value={form.localCouncil}
                            onChange={val => onChange('localCouncil', val)}
                            options={[{ value: '', label: 'Select council' }, ...councils.map(c => ({ value: c, label: c }))]}
                            placeholder="Select council"
                            disabled={!form.state}
                        />
                    </div>
                </div>

                <div className="form-section-header">
                    {isHighRise ? 'Unit Details' : isLanded ? 'Address Details' : 'Property Details'}
                </div>

                <div className="form-row">
                    {isPropertyFieldVisible(config, 'lotNumber') && (
                        <div className="form-group">
                            <label>
                                {config.lotNumber?.label || 'Lot Number'}
                                {config.lotNumber?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="text"
                                placeholder={config.lotNumber?.placeholder || 'e.g. Lot 123'}
                                value={form.lotNumber}
                                onChange={e => onChange('lotNumber', e.target.value)}
                            />
                        </div>
                    )}
                    {isPropertyFieldVisible(config, 'unitNumber') && (
                        <div className="form-group">
                            <label>
                                {config.unitNumber?.label || 'Unit Number'}
                                {config.unitNumber?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="text"
                                placeholder={config.unitNumber?.placeholder || 'e.g. A-12-3'}
                                value={form.unitNumber}
                                onChange={e => onChange('unitNumber', e.target.value)}
                            />
                        </div>
                    )}
                    {isPropertyFieldVisible(config, 'blockTower') && (
                        <div className="form-group">
                            <label>
                                {config.blockTower?.label || 'Block / Tower'}
                                {config.blockTower?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="text"
                                placeholder={config.blockTower?.placeholder || 'e.g. Tower A'}
                                value={form.blockTower}
                                onChange={e => onChange('blockTower', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="form-row">
                    {isPropertyFieldVisible(config, 'floor') && (
                        <div className="form-group">
                            <label>
                                Floor Level
                                {config.floor?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 12"
                                value={form.floor}
                                onChange={e => onChange('floor', e.target.value)}
                            />
                        </div>
                    )}
                    {isPropertyFieldVisible(config, 'storeys') && (
                        <div className="form-group">
                            <label>
                                Number of Storeys
                                {config.storeys?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 2"
                                value={form.storeys}
                                onChange={e => onChange('storeys', e.target.value)}
                                min="1"
                            />
                        </div>
                    )}
                </div>

                <div className="form-section-header">
                    Size & Specifications <span className="optional-tag">(Optional)</span>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Built-up Size (sqft) <span className="optional-tag">(Optional)</span></label>
                        <input
                            type="number"
                            placeholder="e.g. 1200"
                            value={form.builtUpSqft}
                            onChange={e => onChange('builtUpSqft', e.target.value)}
                        />
                    </div>
                    {isPropertyFieldVisible(config, 'landSizeSqft') && (
                        <div className="form-group">
                            <label>
                                Land Size (sqft)
                                {config.landSizeSqft?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 1650"
                                value={form.landSizeSqft}
                                onChange={e => onChange('landSizeSqft', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="form-row">
                    {isPropertyFieldVisible(config, 'bedrooms') && (
                        <div className="form-group">
                            <label>
                                Bedrooms
                                {config.bedrooms?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 3"
                                value={form.bedrooms}
                                onChange={e => onChange('bedrooms', e.target.value)}
                                min="0"
                            />
                        </div>
                    )}
                    {isPropertyFieldVisible(config, 'bathrooms') && (
                        <div className="form-group">
                            <label>
                                Bathrooms
                                {config.bathrooms?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 2"
                                value={form.bathrooms}
                                onChange={e => onChange('bathrooms', e.target.value)}
                                min="0"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Parking Bays <span className="optional-tag">(Optional)</span></label>
                        <input
                            type="number"
                            placeholder="e.g. 2"
                            value={form.parkingCount}
                            onChange={e => onChange('parkingCount', e.target.value)}
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Year Built <span className="optional-tag">(Optional)</span></label>
                        <input
                            type="number"
                            placeholder="e.g. 2015"
                            value={form.yearBuilt}
                            onChange={e => onChange('yearBuilt', e.target.value)}
                        />
                    </div>
                    {isPropertyFieldVisible(config, 'furnished') && (
                        <div className="form-group">
                            <label>
                                Furnished
                                {config.furnished?.show === 'optional' && <span className="optional-tag">(Optional)</span>}
                            </label>
                            <Select
                                value={form.furnished}
                                onChange={val => onChange('furnished', val)}
                                options={[
                                    { value: '', label: 'Select' },
                                    { value: 'unfurnished', label: 'Unfurnished' },
                                    { value: 'partial', label: 'Partially Furnished' },
                                    { value: 'fully', label: 'Fully Furnished' },
                                ]}
                                placeholder="Select"
                            />
                        </div>
                    )}
                </div>

                <div className="form-section-header">Additional</div>

                <div className="form-group">
                    <label>Notes <span className="optional-tag">(Optional)</span></label>
                    <textarea
                        placeholder="Any additional notes..."
                        value={form.notes}
                        onChange={e => onChange('notes', e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="co-owners-section">
                    <div className="co-owners-header">
                        <label className="co-owners-label">
                            <Users size={14} /> Co-Owners <span className="optional-tag">(Optional)</span>
                        </label>
                        <Button type="button" size="sm" variant="ghost" onClick={addCoOwner}>
                            <Plus size={14} /> Add
                        </Button>
                    </div>

                    {form.coOwners.length > 0 ? (
                        <div className="co-owner-list">
                            {form.coOwners.map((owner, idx) => (
                                <div key={owner.id} className="co-owner-row">
                                    <input
                                        type="text"
                                        placeholder="Owner name"
                                        value={owner.name}
                                        onChange={e => updateCoOwner(idx, { name: e.target.value })}
                                    />
                                    <input
                                        className="co-owner-percent-input"
                                        type="number"
                                        placeholder="%"
                                        value={owner.splitPercent}
                                        min={0}
                                        max={100}
                                        onChange={e => updateCoOwner(idx, { splitPercent: Number(e.target.value) || 0 })}
                                    />
                                    <span className="co-owner-percent-symbol">%</span>
                                    <label className="co-owner-primary">
                                        <input
                                            type="radio"
                                            name="primary-owner"
                                            checked={owner.isPrimary}
                                            onChange={() => setPrimaryCoOwner(idx)}
                                        />
                                        Primary
                                    </label>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onChange('coOwners', form.coOwners.filter((_, ownerIndex) => ownerIndex !== idx))}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}

                            {coOwnerTotal !== 100 && (
                                <span className={`co-owner-total ${coOwnerTotal > 100 ? 'danger' : 'warning'}`}>
                                    Split total: {coOwnerTotal}% (should be 100%)
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="co-owner-empty">No co-owners - you are the sole owner</span>
                    )}
                </div>

                <div className="modal-footer property-form-footer">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary">
                        {editingId ? 'Save Changes' : 'Add Property'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
