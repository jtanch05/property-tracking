import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppProvider';
import { parseISO, addDays } from 'date-fns';
import { UTILITY_TYPES, INSURANCE_TYPES, MANAGEMENT_FEE_TYPES } from '../../data/malaysiaData';
import Modal from './Modal';
import ToggleGroup from './ToggleGroup';
import CustomSelect from './CustomSelect';

export default function ExpenseFormModal({ isOpen, onClose, initialPropertyId = '' }) {
    const { properties, addTaxRecord, addUtilityRecord, addInsuranceRecord, addManagementFee } = useApp();

    const [form, setForm] = useState({
        expenseCategory: 'utility',
        propertyId: initialPropertyId || (properties.length > 0 ? properties[0].id : ''),
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        specificType: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                expenseCategory: 'utility',
                propertyId: initialPropertyId || (properties.length > 0 ? properties[0].id : ''),
                amount: '',
                date: new Date().toISOString().split('T')[0],
                status: 'paid',
                specificType: '',
                notes: ''
            });
        }
    }, [isOpen, initialPropertyId, properties]);

    function handleSubmit(e) {
        e.preventDefault();
        const amt = Number(form.amount) || 0;
        const payload = { propertyId: form.propertyId, amount: amt, status: form.status, notes: form.notes };

        if (form.expenseCategory === 'tax') {
            addTaxRecord({ ...payload, dueDate: form.date, paymentDate: form.status === 'paid' ? form.date : '', taxType: form.specificType, type: form.specificType });
        } else if (form.expenseCategory === 'utility') {
            addUtilityRecord({ ...payload, date: form.date, type: form.specificType || 'other' });
        } else if (form.expenseCategory === 'insurance') {
            addInsuranceRecord({ ...payload, coverageAmount: amt * 200, startDate: form.date, expiryDate: addDays(parseISO(form.date), 365).toISOString().split('T')[0], insuranceType: form.specificType || 'fire', premiumAmount: amt });
        } else if (form.expenseCategory === 'mgmt') {
            addManagementFee({ ...payload, nextDueDate: form.date, provider: 'Management Office', feeType: form.specificType || 'other', status: form.status === 'paid' ? 'active' : 'pending' });
        }
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log New Expense" size="md">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Expense Category</label>
                    <CustomSelect
                        value={form.expenseCategory}
                        onChange={val => setForm(p => ({ ...p, expenseCategory: val, specificType: val === 'tax' ? 'cukai_pintu' : '' }))}
                        options={[
                            { value: 'utility', label: 'Utilities (TNB, Water, etc)' },
                            { value: 'tax', label: 'Taxes (Cukai Pintu/Tanah)' },
                            { value: 'insurance', label: 'Insurance' },
                            { value: 'mgmt', label: 'Management Fee / Sinking Fund' },
                        ]}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Property</label>
                        <CustomSelect
                            value={form.propertyId}
                            onChange={val => setForm(p => ({ ...p, propertyId: val }))}
                            options={[{ value: '', label: 'Select Property' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                            disabled={!!initialPropertyId}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Amount (RM)</label>
                        <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="0.00" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Expense Sub-type</label>
                        {form.expenseCategory === 'utility' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={UTILITY_TYPES} />}
                        {form.expenseCategory === 'tax' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={[{ value: 'cukai_pintu', label: 'Cukai Pintu (Assessment Tax)' }, { value: 'cukai_tanah', label: 'Cukai Tanah (Quit Rent)' }]} />}
                        {form.expenseCategory === 'insurance' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={INSURANCE_TYPES} />}
                        {form.expenseCategory === 'mgmt' && <CustomSelect value={form.specificType} onChange={v => setForm(p => ({ ...p, specificType: v }))} options={MANAGEMENT_FEE_TYPES} />}
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                    </div>
                </div>

                <div className="form-group">
                    <label>Status</label>
                    <ToggleGroup
                        options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Unpaid / Pending' }]}
                        value={form.status}
                        onChange={val => setForm(p => ({ ...p, status: val }))}
                    />
                </div>

                <div className="form-group">
                    <label>Notes / Description (Optional)</label>
                    <input type="text" placeholder="e.g. Paid via JomPAY" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <div className="modal-footer" style={{ marginTop: 24, padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={!form.propertyId}>Save Expense</button>
                </div>
            </form>
        </Modal>
    );
}
