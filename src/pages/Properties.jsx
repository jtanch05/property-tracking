import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { LOCAL_COUNCILS } from '../data/localCouncils';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PropertyList from './properties/PropertyList';
import PropertyWorkspace from './properties/PropertyWorkspace';
import PropertyFormModal from './properties/PropertyFormModal';
import {
    EMPTY_PROPERTY,
    getPropertyFieldConfig,
    normalizePropertyForm,
    propertyToForm,
} from './properties/propertyConfig';
import './Properties.css';

export default function Properties() {
    const { properties, addProperty, updateProperty, deleteProperty, tenants } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_PROPERTY);
    const [deleteId, setDeleteId] = useState(null);
    const [search, setSearch] = useState('');

    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId) || null, [properties, selectedPropertyId]);
    const [activeTab, setActiveTab] = useState('overview');

    const filteredProperties = properties.filter(p =>
        p.nickname.toLowerCase().includes(search.toLowerCase()) ||
        p.state?.toLowerCase().includes(search.toLowerCase()) ||
        p.type?.toLowerCase().includes(search.toLowerCase())
    );

    const config = useMemo(() => getPropertyFieldConfig(form.type), [form.type]);

    function openAdd() {
        setForm(EMPTY_PROPERTY);
        setEditingId(null);
        setShowForm(true);
        setSelectedPropertyId(null); // Close panel if open
    }

    function openEdit(prop) {
        setForm(propertyToForm(prop));
        setEditingId(prop.id);
        setShowForm(true);
    }

    function openPropertyHub(prop) {
        setSelectedPropertyId(prop.id);
        setActiveTab('overview');
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.nickname.trim()) return;

        const data = normalizePropertyForm(form);

        if (editingId) {
            updateProperty(editingId, data);
        } else {
            addProperty(data);
        }
        setShowForm(false);
        setEditingId(null);
    }

    async function handleDelete() {
        if (deleteId) {
            await deleteProperty(deleteId);
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
                const newConfig = getPropertyFieldConfig(value);
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
        <div className="split-layout">
            <PropertyList
                properties={properties}
                filteredProperties={filteredProperties}
                tenants={tenants}
                selectedPropertyId={selectedProperty?.id}
                search={search}
                onSearchChange={setSearch}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={setDeleteId}
                onSelect={openPropertyHub}
            />

            <PropertyWorkspace
                property={selectedProperty}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={() => setSelectedPropertyId(null)}
                onEdit={openEdit}
            />

            <PropertyFormModal
                isOpen={showForm}
                editingId={editingId}
                form={form}
                config={config}
                councils={councils}
                isHighRise={isHighRise}
                isLanded={isLanded}
                onChange={handleChange}
                onClose={() => setShowForm(false)}
                onSubmit={handleSubmit}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Property"
                message="Are you sure you want to delete this property? All associated tenants, agreements, rent, expenses, maintenance, payouts, and deposits will also be permanently deleted."
            />
        </div>
    );
}
