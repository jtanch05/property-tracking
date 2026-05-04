import React from 'react';
import {
    ArrowLeft,
    Building2,
    Edit3,
    FileText,
    Home,
    Receipt,
    Users,
    Wallet,
    Wrench,
} from 'lucide-react';
import { PROPERTY_TYPES } from '../../data/malaysiaData';
import { Button } from '../../components/ui';
import Tenants from '../Tenants';
import Agreements from '../Agreements';
import RentLedger from '../RentLedger';
import Expenses from '../Expenses';
import Maintenance from '../Maintenance';

const WORKSPACE_TABS = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'agreements', label: 'Agreements', icon: FileText },
    { id: 'rent', label: 'Ledger', icon: Wallet },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
];

function PropertyOverview({ property, onEdit }) {
    return (
        <div className="hub-overview">
            <div className="hub-overview-header">
                <h3>Property Information</h3>
                <Button variant="secondary" size="sm" onClick={() => onEdit(property)}>
                    <Edit3 size={14} /> Edit
                </Button>
            </div>

            <div className="hub-stats-grid">
                <div className="hub-stat-card">
                    <div className="hub-stat-label">Type</div>
                    <div className="hub-stat-value">
                        {PROPERTY_TYPES.find(t => t.value === property.type)?.label || property.type}
                    </div>
                </div>

                <div className="hub-stat-card">
                    <div className="hub-stat-label">Title Type</div>
                    <div className="hub-stat-value">
                        {property.strata ? 'Strata' : 'Non-Strata'}
                    </div>
                </div>

                {property.state && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Location</div>
                        <div className="hub-stat-value">
                            {property.state}
                            {property.localCouncil && <span className="hub-stat-sub">{property.localCouncil}</span>}
                        </div>
                    </div>
                )}

                {(property.unitNumber || property.lotNumber || property.blockTower || property.floor) && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Address / Unit</div>
                        <div className="hub-stat-value">
                            {[
                                property.unitNumber && `Unit ${property.unitNumber}`,
                                property.floor && `Level ${property.floor}`,
                                property.blockTower && `${property.blockTower}`,
                                property.lotNumber && `${property.lotNumber}`
                            ].filter(Boolean).join(', ')}
                        </div>
                    </div>
                )}

                {(property.builtUpSqft || property.landSizeSqft) && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Size</div>
                        <div className="hub-stat-value">
                            {property.builtUpSqft && (
                                <div>Built-up: {Number(property.builtUpSqft).toLocaleString()} <span className="hub-stat-unit">sqft</span></div>
                            )}
                            {property.landSizeSqft && (
                                <div>Land: {Number(property.landSizeSqft).toLocaleString()} <span className="hub-stat-unit">sqft</span></div>
                            )}
                        </div>
                    </div>
                )}

                {(property.bedrooms || property.bathrooms) && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Rooms</div>
                        <div className="hub-stat-value">
                            {property.bedrooms ? `${property.bedrooms} bed` : ''}
                            {property.bedrooms && property.bathrooms ? ' · ' : ''}
                            {property.bathrooms ? `${property.bathrooms} bath` : ''}
                        </div>
                    </div>
                )}

                {property.storeys && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Storeys</div>
                        <div className="hub-stat-value">
                            {property.storeys}
                        </div>
                    </div>
                )}

                {property.parkingCount > 0 && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Parking</div>
                        <div className="hub-stat-value">
                            {property.parkingCount} <span className="hub-stat-unit">bay{property.parkingCount > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                )}

                {property.yearBuilt && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Year Built</div>
                        <div className="hub-stat-value">{property.yearBuilt}</div>
                    </div>
                )}

                {property.furnished && (
                    <div className="hub-stat-card">
                        <div className="hub-stat-label">Furnished</div>
                        <div className="hub-stat-value" style={{ textTransform: 'capitalize' }}>
                            {property.furnished === 'partial' ? 'Partially Furnished' : property.furnished === 'fully' ? 'Fully Furnished' : 'Unfurnished'}
                        </div>
                    </div>
                )}
            </div>

            {property.coOwners && property.coOwners.length > 0 && (
                <div className="hub-notes" style={{ marginBottom: property.notes ? 0 : '32px', borderBottom: property.notes ? 'none' : undefined }}>
                    <div className="hub-stat-label hub-notes-label">Co-Owners</div>
                    <div className="hub-notes-text">
                        {property.coOwners.map((owner, i) => (
                            <div key={owner.id || i} style={{ marginBottom: '4px' }}>
                                <strong>{owner.name || 'Unnamed'}</strong> ({owner.splitPercent}%)
                                {owner.isPrimary && <span className="badge badge-info" style={{ fontSize: '10px', marginLeft: '6px', padding: '2px 6px' }}>Primary</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {property.notes && (
                <div className="hub-notes">
                    <div className="hub-stat-label hub-notes-label">Notes</div>
                    <p className="hub-notes-text">{property.notes}</p>
                </div>
            )}
        </div>
    );
}

function WorkspaceBody({ activeTab, property, onEdit }) {
    if (activeTab === 'overview') {
        return <PropertyOverview property={property} onEdit={onEdit} />;
    }

    if (activeTab === 'tenants') {
        return <Tenants embeddedPropertyId={property.id} />;
    }

    if (activeTab === 'agreements') {
        return <Agreements embeddedPropertyId={property.id} />;
    }

    if (activeTab === 'rent') {
        return <RentLedger embeddedPropertyId={property.id} />;
    }

    if (activeTab === 'expenses') {
        return <Expenses embeddedPropertyId={property.id} />;
    }

    if (activeTab === 'maintenance') {
        return <Maintenance embeddedPropertyId={property.id} />;
    }

    return null;
}

export default function PropertyWorkspace({
    property,
    activeTab,
    onTabChange,
    onBack,
    onEdit,
}) {
    return (
        <div className={`detail-pane ${property ? 'open' : ''}`}>
            {property ? (
                <div className="detail-pane-inner">
                    <div className="detail-header">
                        <div className="detail-header-top">
                            <Button
                                type="button"
                                className="detail-back-btn"
                                variant="ghost"
                                onClick={onBack}
                                title="Back to properties"
                            >
                                <ArrowLeft size={18} />
                            </Button>
                            <div className="detail-header-title">
                                <h2>{property.nickname}</h2>
                            </div>
                        </div>

                        <div className="detail-tabs">
                            {WORKSPACE_TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => onTabChange(tab.id)}
                                    >
                                        <Icon size={14} /> {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="detail-body">
                        <WorkspaceBody activeTab={activeTab} property={property} onEdit={onEdit} />
                    </div>
                </div>
            ) : (
                <div className="detail-pane-empty">
                    <Building2 size={48} className="empty-icon" />
                    <h3>No property selected</h3>
                    <p>Select a property from the list to view its details.</p>
                </div>
            )}
        </div>
    );
}
