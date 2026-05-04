import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { PAYMENT_METHODS } from '../data/malaysiaData';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomSelect from '../components/common/CustomSelect';
import { formatCurrency, formatMonth, formatDate } from '../utils/formatters';
import { differenceInDays, parseISO } from 'date-fns';
import { Plus, Wallet, Edit3, Trash2, CheckCircle, Clock, AlertCircle, MessageCircle, Minus, FileText, ChevronDown, ChevronRight, CalendarClock, XCircle } from 'lucide-react';
import { sendRentReminder } from '../utils/whatsapp';
import { exportToPDF } from '../utils/export';
import './RentLedger.css';

const EMPTY_RENT = {
    propertyId: '', tenantId: '', agreementId: '', month: '', amountDue: '', amountPaid: '',
    status: 'unpaid', paymentDate: '', paymentMethod: 'transfer', notes: '',
    deductions: [],
};

export default function RentLedger({ embeddedPropertyId = null }) {
    const { rentRecords, addRentRecord, updateRentRecord, deleteRentRecord, properties, tenants, agreements, maintenanceRecords, payouts, addPayout, updatePayout } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_RENT);
    const [deleteId, setDeleteId] = useState(null);
    const [showClearAll, setShowClearAll] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProp, setFilterProp] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [showCollected, setShowCollected] = useState(false);
    const [showUpcoming, setShowUpcoming] = useState(false);

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const filtered = rentRecords
        .filter(r => embeddedPropertyId ? r.propertyId === embeddedPropertyId : true)
        .filter(r => filterStatus === 'all' || r.status === filterStatus)
        .filter(r => !filterProp || r.propertyId === filterProp)
        .sort((a, b) => b.month.localeCompare(a.month));

    // Split into three smart groups
    const overdueAndDue = filtered.filter(r => r.status !== 'paid' && r.month <= currentMonth);
    const upcoming = filtered.filter(r => r.status !== 'paid' && r.month > currentMonth);
    const collected = filtered.filter(r => r.status === 'paid');
    const collectedTotal = collected.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);
    const upcomingTotal = upcoming.reduce((s, r) => s + (Number(r.amountDue) || 0), 0);

    const availableDeductions = useMemo(() => {
        if (!form.propertyId) return [];
        return maintenanceRecords
            .filter(m => m.propertyId === form.propertyId && m.cost > 0)
            .filter(m => {
                const alreadyLinked = form.deductions.some(d => d.maintenanceId === m.id);
                return !alreadyLinked;
            });
    }, [form.propertyId, maintenanceRecords, form.deductions]);

    function openAdd() {
        const now = new Date();
        setForm({ ...EMPTY_RENT, propertyId: embeddedPropertyId || properties[0]?.id || '', month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` });
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(r) {
        setForm({
            propertyId: r.propertyId || '', tenantId: r.tenantId || '', month: r.month || '',
            amountDue: r.amountDue || '', amountPaid: r.amountPaid || '',
            status: r.status || 'unpaid', paymentDate: r.paymentDate || '',
            paymentMethod: r.paymentMethod || 'transfer', notes: r.notes || '',
            deductions: r.deductions || [],
        });
        setEditingId(r.id);
        setShowForm(true);
    }

    function quickPay(r) {
        const deductionTotal = (r.deductions || []).reduce((s, d) => s + (d.amount || 0), 0);
        const netAmount = (r.amountDue || 0) - deductionTotal;
        updateRentRecord(r.id, {
            status: 'paid',
            amountPaid: netAmount,
            paymentDate: new Date().toISOString().split('T')[0],
        });
        autoGeneratePayouts(r, netAmount);
    }

    function autoGeneratePayouts(rentRecord, netAmount) {
        const prop = properties.find(p => p.id === rentRecord.propertyId);
        if (!prop?.coOwners || prop.coOwners.length === 0) return;
        prop.coOwners.forEach(owner => {
            const payoutAmount = Math.round(netAmount * owner.splitPercent / 100);
            addPayout({
                propertyId: rentRecord.propertyId,
                rentRecordId: rentRecord.id,
                coOwnerId: owner.id,
                ownerName: owner.name,
                amount: payoutAmount,
                splitPercent: owner.splitPercent,
                status: owner.isPrimary ? 'paid' : 'pending',
                paidDate: owner.isPrimary ? new Date().toISOString().split('T')[0] : '',
                month: rentRecord.month,
                notes: '',
            });
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const amountDue = Number(form.amountDue) || 0;
        const amountPaid = Number(form.amountPaid) || 0;
        const deductionTotal = form.deductions.reduce((s, d) => s + (d.amount || 0), 0);
        const netAmount = amountDue - deductionTotal;

        let computedStatus = 'unpaid';
        if (amountPaid > 0 && amountPaid < netAmount) computedStatus = 'partial';
        else if (amountPaid >= netAmount && netAmount > 0) computedStatus = 'paid';
        else if (amountPaid > 0 && netAmount <= 0) computedStatus = 'paid';

        const data = { ...form, amountDue, amountPaid, status: computedStatus };
        if (editingId) updateRentRecord(editingId, data);
        else addRentRecord(data);
        setShowForm(false);
    }

    function addDeduction(maintenance) {
        setForm(prev => ({
            ...prev,
            deductions: [...prev.deductions, {
                id: crypto.randomUUID(),
                maintenanceId: maintenance.id,
                description: maintenance.description || maintenance.issueType,
                amount: maintenance.cost || 0,
            }],
        }));
    }

    function removeDeduction(deductionId) {
        setForm(prev => ({
            ...prev,
            deductions: prev.deductions.filter(d => d.id !== deductionId),
        }));
    }

    function getDaysOverdue(record) {
        if (record.status === 'paid') return 0;
        const due = parseISO(`${record.month}-01`);
        return Math.max(0, differenceInDays(new Date(), due));
    }

    const totalDue = filtered.reduce((s, r) => s + (r.amountDue || 0), 0);
    const totalDeductions = filtered.reduce((s, r) => s + ((r.deductions || []).reduce((ds, d) => ds + (d.amount || 0), 0)), 0);
    const totalPaid = filtered.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);

    const propTenants = form.propertyId ? tenants.filter(t => t.propertyId === form.propertyId) : [];
    const formDeductionTotal = form.deductions.reduce((s, d) => s + (d.amount || 0), 0);
    const formNetAmount = (Number(form.amountDue) || 0) - formDeductionTotal;

    const handleExportPDF = () => {
        const exportData = filtered.map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            const tenant = tenants.find(t => t.id === r.tenantId);
            const deductions = r.deductions || [];
            const deductionTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);
            const netAmount = (r.amountDue || 0) - deductionTotal;

            return {
                month: formatMonth(r.month),
                property: prop?.nickname || 'Unknown Property',
                tenant: tenant?.name || 'Unknown Tenant',
                status: (r.status || 'UNPAID').toUpperCase(),
                amountDue: formatCurrency(r.amountDue),
                deductions: deductionTotal > 0 ? formatCurrency(deductionTotal) : '—',
                netAmount: formatCurrency(netAmount),
                paymentDate: r.status === 'paid' ? formatDate(r.paymentDate) : '—',
                method: PAYMENT_METHODS.find(m => m.value === r.paymentMethod)?.label || r.paymentMethod
            };
        });

        exportToPDF(exportData, 'rent-ledger-report', 'Rent Ledger Statement');
    };

    function renderRentCard(r) {
        const prop = properties.find(p => p.id === r.propertyId);
        const tenant = tenants.find(t => t.id === r.tenantId);
        const overdue = getDaysOverdue(r);
        const deductions = r.deductions || [];
        const deductionTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);
        const netAmount = (r.amountDue || 0) - deductionTotal;
        const isExpanded = expandedId === r.id;
        const rentPayouts = payouts.filter(p => p.rentRecordId === r.id);

        return (
            <div key={r.id} className={`card rent-card ${r.status}`}>
                <div className="rent-row">
                    <div className="rent-left">
                        <div className={`rent-status-icon ${r.status}`}>
                            {r.status === 'paid' ? <CheckCircle size={18} /> : overdue > 0 ? <AlertCircle size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="rent-info">
                            <span className="rent-month">{formatMonth(r.month)}</span>
                            <span className="rent-prop">{prop?.nickname || '—'}</span>
                            {overdue > 0 && r.status !== 'paid' && <span className="rent-overdue">{overdue} days overdue</span>}
                        </div>
                    </div>

                    <div className="rent-amounts">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {deductionTotal > 0 && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatCurrency(r.amountDue)}</span>}
                            <span className="rent-amount">{formatCurrency(netAmount)}</span>
                            {r.status === 'partial' && <span style={{ fontSize: 'var(--font-xs)', color: 'var(--warning)', fontWeight: 600 }}>Balance: {formatCurrency(netAmount - r.amountPaid)}</span>}
                        </div>
                        {(r.status === 'paid' || r.status === 'partial') && <span className="rent-paid-date">{r.status === 'paid' ? 'Paid' : 'Partially Paid'} {formatDate(r.paymentDate)}</span>}
                    </div>

                    <div className="rent-actions">
                        {r.status !== 'paid' && (
                            <>
                                <button className="btn btn-sm btn-primary" onClick={() => quickPay(r)}>Mark Paid</button>
                                {tenant?.phone && (
                                    <button className="btn-icon" title="Send WhatsApp reminder" onClick={() => sendRentReminder(tenant, r, prop)}>
                                        <MessageCircle size={16} />
                                    </button>
                                )}
                            </>
                        )}
                        <button className="btn-icon" onClick={() => openEdit(r)}><Edit3 size={16} /></button>
                        <button className="btn-icon" onClick={() => setDeleteId(r.id)}><Trash2 size={16} /></button>
                    </div>
                </div>

                {(deductions.length > 0 || rentPayouts.length > 0) && (
                    <div>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 'var(--font-xs)' }} onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                            {isExpanded ? '▾ Hide details' : `▸ ${deductions.length > 0 ? `${deductions.length} deduction(s)` : ''}${rentPayouts.length > 0 ? ` · ${rentPayouts.length} payout(s)` : ''}`}
                        </button>
                        {isExpanded && (
                            <div style={{ marginTop: 8, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)' }}>
                                {deductions.length > 0 && (
                                    <div style={{ marginBottom: rentPayouts.length > 0 ? 12 : 0 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</span>
                                        {deductions.map((d, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                <span style={{ color: 'var(--warning)' }}>− {d.description}</span>
                                                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>−{formatCurrency(d.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rentPayouts.length > 0 && (
                                    <div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Split</span>
                                        {rentPayouts.map(p => (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                                <span>{p.ownerName} ({p.splitPercent}%)</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</span>
                                                    <span className={`badge badge-${p.status === 'paid' ? 'success' : 'warning'}`} style={{ fontSize: 'var(--font-xs)' }}>{p.status}</span>
                                                    {p.status === 'pending' && (
                                                        <button className="btn btn-sm btn-ghost" style={{ padding: '2px 6px', fontSize: 'var(--font-xs)' }}
                                                            onClick={() => updatePayout(p.id, { status: 'paid', paidDate: new Date().toISOString().split('T')[0] })}>
                                                            ✓ Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={embeddedPropertyId ? "rent-page-embedded" : "rent-page"}>
            {!embeddedPropertyId && (
                <div className="section-header">
                    <div>
                        <h1 className="section-title">Rent Ledger</h1>
                        <p className="section-subtitle">
                            {formatCurrency(totalPaid)} collected of {formatCurrency(totalDue)}
                            {totalDeductions > 0 && <span style={{ color: 'var(--warning)' }}> (−{formatCurrency(totalDeductions)} deductions)</span>}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {filtered.length > 0 && (
                            <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setShowClearAll(true)}>
                                <XCircle size={16} /> Clear All
                            </button>
                        )}
                        <button className="btn btn-outline" onClick={handleExportPDF}>
                            <FileText size={16} /> Export PDF
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Record</button>
                    </div>
                </div>
            )}

            {embeddedPropertyId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Rent Ledger</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {filtered.length > 0 && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setShowClearAll(true)}>
                                <XCircle size={14} /> Clear All
                            </button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                            <FileText size={14} /> Export
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openAdd}>
                            <Plus size={14} /> Add Record
                        </button>
                    </div>
                </div>
            )}

            {rentRecords.length > 0 && (
                <div className="filter-bar">
                    {!embeddedPropertyId && (
                        <div style={{ width: '280px' }}>
                            <CustomSelect
                                variant="filter"
                                value={filterProp}
                                onChange={setFilterProp}
                                options={[{ value: '', label: 'All Properties' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                                placeholder="All Properties"
                            />
                        </div>
                    )}
                    <div className="filter-tabs">
                        {['all', 'paid', 'unpaid', 'partial'].map(f => (
                            <button key={f} className={`btn btn-sm ${filterStatus === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterStatus(f)}>
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filtered.length > 0 ? (
                <div className="rent-list">
                    {/* Section 1: Overdue & Due Now — always expanded */}
                    {overdueAndDue.length > 0 && (
                        <div>
                            <div className="rent-section-header">
                                <div className="rent-section-label" style={{ color: 'var(--danger)' }}>
                                    <AlertCircle size={14} />
                                    Overdue & Due Now ({overdueAndDue.length})
                                </div>
                            </div>
                            {overdueAndDue.sort((a, b) => a.month.localeCompare(b.month)).map(r => renderRentCard(r))}
                        </div>
                    )}

                    {/* Section 2: Upcoming — collapsed by default, compact rows */}
                    {upcoming.length > 0 && (
                        <div style={{ marginTop: overdueAndDue.length > 0 ? 'var(--space-lg)' : 0 }}>
                            <button
                                className="rent-section-toggle"
                                onClick={() => setShowUpcoming(prev => !prev)}
                                type="button"
                            >
                                <div className="rent-section-label" style={{ color: 'var(--text-secondary)' }}>
                                    {showUpcoming ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <CalendarClock size={14} />
                                    Upcoming ({upcoming.length} months)
                                </div>
                                <span className="rent-section-summary">{formatCurrency(upcomingTotal)} scheduled</span>
                            </button>
                            {showUpcoming && (
                                <div className="rent-upcoming-list">
                                    {upcoming.sort((a, b) => a.month.localeCompare(b.month)).map(r => {
                                        const prop = properties.find(p => p.id === r.propertyId);
                                        const deductions = r.deductions || [];
                                        const deductionTotal = deductions.reduce((s, d) => s + (d.amount || 0), 0);
                                        const netAmount = (r.amountDue || 0) - deductionTotal;
                                        return (
                                            <div key={r.id} className="rent-upcoming-row" onClick={() => openEdit(r)}>
                                                <div className="rent-upcoming-left">
                                                    <span className="rent-upcoming-month">{formatMonth(r.month)}</span>
                                                    <span className="rent-upcoming-prop">{prop?.nickname || '—'}</span>
                                                </div>
                                                <div className="rent-upcoming-right">
                                                    <span className="rent-upcoming-amount">{formatCurrency(netAmount)}</span>
                                                    <div className="rent-upcoming-actions">
                                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Edit3 size={14} /></button>
                                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 3: Collected — collapsed by default */}
                    {collected.length > 0 && (
                        <div style={{ marginTop: (overdueAndDue.length > 0 || upcoming.length > 0) ? 'var(--space-lg)' : 0 }}>
                            <button
                                className="rent-section-toggle"
                                onClick={() => setShowCollected(prev => !prev)}
                                type="button"
                            >
                                <div className="rent-section-label" style={{ color: 'var(--success)' }}>
                                    {showCollected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <CheckCircle size={14} />
                                    Collected ({collected.length})
                                </div>
                                <span className="rent-section-summary">{formatCurrency(collectedTotal)} received</span>
                            </button>
                            {showCollected && collected.map(r => renderRentCard(r))}
                        </div>
                    )}

                    {overdueAndDue.length === 0 && upcoming.length === 0 && collected.length === 0 && (
                        <div className="empty-state">
                            <Wallet size={56} />
                            <h3>No matching records</h3>
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state">
                    <Wallet size={56} />
                    <h3>No rent records</h3>
                    <p>Create a Tenancy Agreement to auto-generate monthly records, or add one manually.</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Record</button>
                </div>
            )}

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Rent Record' : 'Add Rent Record'} size="lg">
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Property *</label>
                            <CustomSelect
                                value={form.propertyId}
                                onChange={val => setForm(p => ({ ...p, propertyId: val, tenantId: '' }))}
                                options={[{ value: '', label: 'Select' }, ...properties.map(p => ({ value: p.id, label: p.nickname }))]}
                                placeholder="Select"
                                disabled={!!embeddedPropertyId}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tenant</label>
                            <CustomSelect
                                value={form.tenantId}
                                onChange={val => {
                                    const tenantAgreement = agreements.find(a => a.tenantId === val && a.status === 'active');
                                    setForm(p => ({
                                        ...p,
                                        tenantId: val,
                                        amountDue: tenantAgreement ? tenantAgreement.rentAmount : p.amountDue
                                    }));
                                }}
                                options={[{ value: '', label: 'Select' }, ...propTenants.map(t => ({ value: t.id, label: t.name }))]}
                                placeholder="Select"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Month *</label><input type="month" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} required /></div>
                        <div className="form-group"><label>Amount Due (RM)</label><input type="number" value={form.amountDue} onChange={e => setForm(p => ({ ...p, amountDue: e.target.value }))} placeholder="1500" /></div>
                    </div>

                    <div style={{ margin: 'var(--space-md) 0', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <label style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                                <Minus size={16} color="var(--warning)" /> Deductions
                            </label>
                        </div>
                        {form.deductions.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                {form.deductions.map(d => (
                                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                        <span style={{ fontSize: 'var(--font-sm)' }}>{d.description}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--warning)' }}>−{formatCurrency(d.amount)}</span>
                                            <button type="button" className="btn-icon" onClick={() => removeDeduction(d.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {availableDeductions.length > 0 ? (
                            <CustomSelect
                                onChange={val => { const m = availableDeductions.find(x => x.id === val); if (m) addDeduction(m); }}
                                value=""
                                options={[{ value: '', label: '+ Link maintenance repair...' }, ...availableDeductions.map(m => ({ value: m.id, label: `${m.description || m.issueType} — ${formatCurrency(m.cost)}` }))]}
                                placeholder="+ Link maintenance repair..."
                            />
                        ) : form.propertyId ? (
                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>No maintenance records available for deduction</span>
                        ) : null}
                        {formDeductionTotal > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600 }}>Net Collectible</span>
                                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(formNetAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {Number(form.amountPaid) >= formNetAmount && formNetAmount > 0 ? (
                                    <><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> Paid</>
                                ) : Number(form.amountPaid) > 0 ? (
                                    <><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} /> Partial</>
                                ) : (
                                    <><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-tertiary)' }} /> Unpaid</>
                                )}
                            </div>
                        </div>
                        <div className="form-group"><label>Payment Date</label><input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Payment Method</label>
                            <CustomSelect
                                value={form.paymentMethod}
                                onChange={val => setForm(p => ({ ...p, paymentMethod: val }))}
                                options={PAYMENT_METHODS}
                            />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <label>Amount Paid (RM)</label>
                                <button type="button" onClick={() => setForm(p => ({ ...p, amountPaid: formNetAmount, paymentDate: p.paymentDate || new Date().toISOString().split('T')[0] }))} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--font-xs)', cursor: 'pointer', fontWeight: 600 }}>Paid in Full</button>
                            </div>
                            <input type="number" value={form.amountPaid} onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} placeholder={formDeductionTotal > 0 ? String(formNetAmount) : '1500'} />
                        </div>
                    </div>
                    <div className="form-group"><label>Notes</label><input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" /></div>
                    <div className="modal-footer" style={{ padding: 'var(--space-md) 0 0', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Add Record'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteRentRecord(deleteId); setDeleteId(null); }} title="Delete Rent Record" message="Remove this rent record?" />
            <ConfirmDialog
                isOpen={showClearAll}
                onClose={() => setShowClearAll(false)}
                onConfirm={() => {
                    const targetRecords = embeddedPropertyId
                        ? rentRecords.filter(r => r.propertyId === embeddedPropertyId)
                        : filtered;
                    targetRecords.forEach(r => deleteRentRecord(r.id));
                    setShowClearAll(false);
                }}
                title="Clear All Rent Records"
                message={`This will permanently delete ${embeddedPropertyId ? rentRecords.filter(r => r.propertyId === embeddedPropertyId).length : filtered.length} rent record(s). This action cannot be undone.`}
            />
        </div>
    );
}
