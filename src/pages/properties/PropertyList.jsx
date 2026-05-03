import React from 'react';
import { Building2, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui';

export default function PropertyList({
    properties,
    filteredProperties,
    tenants,
    selectedPropertyId,
    search,
    onSearchChange,
    onAdd,
    onEdit,
    onDelete,
    onSelect,
}) {
    return (
        <div className="list-pane">
            <div className="list-pane-header">
                <div>
                    <h1 className="list-pane-title">Properties</h1>
                    <span className="list-pane-subtitle">{properties.length} properties</span>
                </div>
                <Button size="icon" variant="ghost" onClick={onAdd} title="Add Property">
                    <Plus size={18} />
                </Button>
            </div>

            {properties.length > 0 && (
                <div className="list-pane-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>
            )}

            <div className="list-pane-items">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map(prop => {
                        const activeTenant = tenants.find(t => t.propertyId === prop.id && t.status === 'active');
                        const isSelected = selectedPropertyId === prop.id;

                        return (
                            <div
                                key={prop.id}
                                className={`list-item ${isSelected ? 'active' : ''}`}
                                onClick={() => onSelect(prop)}
                            >
                                <div className="list-item-icon">
                                    <Building2 size={16} />
                                </div>
                                <div className="list-item-main">
                                    <h3 className="list-item-title">{prop.nickname}</h3>
                                    <div className="list-item-meta">
                                        {prop.state && <span>{prop.state}</span>}
                                        {activeTenant && <span className="status-dot success" title="Occupied" />}
                                    </div>
                                </div>
                                <div className="list-item-actions">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); onEdit(prop); }}
                                        title="Edit"
                                    >
                                        <Edit3 size={14} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="btn-icon-danger"
                                        onClick={(e) => { e.stopPropagation(); onDelete(prop.id); }}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="list-pane-empty">
                        <p>No properties found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
