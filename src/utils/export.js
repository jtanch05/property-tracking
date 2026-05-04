// JSON export/import for data backup
import { getStorageItem } from './storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DATA_KEYS = [
    'properties', 'tenants', 'agreements', 'rentRecords', 'taxRecords',
    'utilityRecords', 'insuranceRecords', 'maintenanceRecords',
    'vendors', 'managementFees', 'payouts', 'deposits', 'settings',
];

export function exportAllData(sourceData = null) {
    const data = {};
    DATA_KEYS.forEach(key => {
        const value = sourceData ? sourceData[key] : getStorageItem(key);
        if (value !== null && value !== undefined) data[key] = value;
    });
    data._exportedAt = new Date().toISOString();
    data._version = '1.0';
    return data;
}

export function downloadBackup(sourceData = null) {
    const data = exportAllData(sourceData);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proptrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!data._version) throw new Error('Invalid backup file: missing version');
        return { success: true, data, keys: Object.keys(data).filter(k => !k.startsWith('_')) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
        headers.map(h => {
            const val = item[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
}

export function exportToPDF(data, filename, title = 'Data Report') {
    if (!data || data.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
        headers.map(h => {
            const val = item[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
        })
    );
    autoTable(doc, {
        head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '))],
        body: rows,
        startY: 36,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ====================== FULL STATEMENT ======================

function fmtCurrency(val) {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
}

function fmtDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMonth(str) {
    if (!str) return '—';
    const [y, m] = str.split('-');
    return new Date(y, parseInt(m) - 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
}

function addSectionTitle(doc, title, color = [41, 128, 185]) {
    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 50;
    const startY = y > 270 ? (doc.addPage(), 18) : y;
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(title, 14, startY);
    doc.setTextColor(0);
    return startY + 6;
}

/**
 * Export a full comprehensive multi-section PDF statement covering
 * all property management categories.
 */
export function exportFullStatement({
    properties = [],
    tenants = [],
    rentRecords = [],
    taxRecords = [],
    utilityRecords = [],
    insuranceRecords = [],
    maintenanceRecords = [],
    managementFees = [],
    deposits = [],
}) {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleString('en-MY');
    const today = new Date().toISOString().split('T')[0];

    // ---- Cover Header ----
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 52, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Full Property Statement', 14, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(`PropTrack MY  ·  Generated: ${dateStr}`, 14, 34);
    doc.setTextColor(100, 180, 255);
    doc.text(`${properties.length} Properties  ·  ${tenants.length} Tenants  ·  ${rentRecords.length} Rent Records`, 14, 44);
    doc.setTextColor(0, 0, 0);

    // ---- 1. PROPERTIES ----
    const sec1Y = 60;
    doc.setFontSize(13);
    doc.setTextColor(41, 128, 185);
    doc.text('1. PROPERTIES', 14, sec1Y);
    doc.setTextColor(0);
    autoTable(doc, {
        head: [['Nickname', 'Address', 'Type', 'Purchase Price', 'Market Value', 'Status']],
        body: properties.map(p => [
            p.nickname || '—',
            [p.streetAddress, p.city].filter(Boolean).join(', ') || '—',
            p.type || p.propertyType || '—',
            fmtCurrency(p.purchasePrice),
            fmtCurrency(p.marketValue),
            (p.status || '—').toUpperCase(),
        ]),
        startY: sec1Y + 4,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // ---- 2. TENANTS ----
    const sec2Y = addSectionTitle(doc, '2. TENANTS', [39, 174, 96]);
    autoTable(doc, {
        head: [['Tenant', 'Property', 'Phone', 'Status', 'Move In', 'Move Out']],
        body: tenants.map(t => {
            const prop = properties.find(p => p.id === t.propertyId);
            return [t.name || '—', prop?.nickname || '—', t.phone || '—', (t.status || '—').toUpperCase(), fmtDate(t.moveInDate), t.moveOutDate ? fmtDate(t.moveOutDate) : 'Current'];
        }),
        startY: sec2Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 174, 96], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // ---- 3. RENT LEDGER ----
    const totalDue = rentRecords.reduce((s, r) => s + (r.amountDue || 0), 0);
    const totalCollected = rentRecords.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amountPaid || 0), 0);
    const sec3Y = addSectionTitle(doc, '3. RENT LEDGER (FINANCE)', [142, 68, 173]);
    autoTable(doc, {
        head: [['Month', 'Property', 'Tenant', 'Status', 'Amount Due', 'Amount Paid']],
        body: [...rentRecords].sort((a, b) => b.month.localeCompare(a.month)).map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            const tenant = tenants.find(t => t.id === r.tenantId);
            return [fmtMonth(r.month), prop?.nickname || '—', tenant?.name || '—', (r.status || '—').toUpperCase(), fmtCurrency(r.amountDue), r.status === 'paid' ? fmtCurrency(r.amountPaid) : '—'];
        }),
        foot: [['', '', '', 'TOTAL', fmtCurrency(totalDue), fmtCurrency(totalCollected)]],
        startY: sec3Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [142, 68, 173], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [230, 220, 240], fontStyle: 'bold' }
    });

    // ---- 4. TAXES ----
    const totalTax = taxRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const sec4Y = addSectionTitle(doc, '4. TAXES — Cukai Pintu / Cukai Tanah', [192, 57, 43]);
    autoTable(doc, {
        head: [['Property', 'Type', 'Due Date', 'Status', 'Amount']],
        body: [...taxRecords].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || '')).map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            return [prop?.nickname || '—', r.type === 'quit_rent' ? 'Cukai Tanah (Quit Rent)' : 'Cukai Pintu (Assessment Tax)', fmtDate(r.dueDate), (r.status || '—').toUpperCase(), fmtCurrency(r.amount)];
        }),
        foot: [['', '', '', 'TOTAL', fmtCurrency(totalTax)]],
        startY: sec4Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [192, 57, 43], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [245, 220, 220], fontStyle: 'bold' }
    });

    // ---- 5. UTILITIES ----
    const totalUtil = utilityRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const sec5Y = addSectionTitle(doc, '5. UTILITIES — TNB / Water / Indah Water', [211, 84, 0]);
    autoTable(doc, {
        head: [['Property', 'Type', 'Date', 'Status', 'Amount']],
        body: [...utilityRecords].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            const label = r.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) + ' Bill' : '—';
            return [prop?.nickname || '—', label, fmtDate(r.date), (r.status || '—').toUpperCase(), fmtCurrency(r.amount)];
        }),
        foot: [['', '', '', 'TOTAL', fmtCurrency(totalUtil)]],
        startY: sec5Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [211, 84, 0], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [250, 230, 210], fontStyle: 'bold' }
    });

    // ---- 6. INSURANCE ----
    const getInsurancePremium = r => Number(r.premiumAmount ?? r.premium ?? r.amount ?? 0);
    const totalInsure = insuranceRecords.reduce((s, r) => s + getInsurancePremium(r), 0);
    const sec6Y = addSectionTitle(doc, '6. INSURANCE — Fire / Landlord / MRTA', [22, 160, 133]);
    autoTable(doc, {
        head: [['Property', 'Type', 'Start Date', 'Expiry Date', 'Annual Premium']],
        body: insuranceRecords.map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            return [prop?.nickname || '—', r.insuranceType || '—', fmtDate(r.startDate), fmtDate(r.expiryDate), fmtCurrency(getInsurancePremium(r))];
        }),
        foot: [['', '', '', 'TOTAL PREMIUM', fmtCurrency(totalInsure)]],
        startY: sec6Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [210, 240, 235], fontStyle: 'bold' }
    });

    // ---- 7. MANAGEMENT FEES ----
    const totalMgmt = managementFees.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const sec7Y = addSectionTitle(doc, '7. MANAGEMENT FEES / SINKING FUND', [52, 73, 94]);
    autoTable(doc, {
        head: [['Property', 'Provider', 'Type', 'Next Due', 'Status', 'Amount']],
        body: managementFees.map(r => {
            const prop = properties.find(p => p.id === r.propertyId);
            return [prop?.nickname || '—', r.provider || '—', r.feeType || '—', fmtDate(r.nextDueDate), (r.status || '—').toUpperCase(), fmtCurrency(r.amount)];
        }),
        foot: [['', '', '', '', 'TOTAL', fmtCurrency(totalMgmt)]],
        startY: sec7Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 73, 94], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [220, 225, 235], fontStyle: 'bold' }
    });

    // ---- 8. MAINTENANCE ----
    const totalMaint = maintenanceRecords.reduce((s, m) => s + (Number(m.cost) || 0), 0);
    const sec8Y = addSectionTitle(doc, '8. MAINTENANCE & OPERATIONS', [241, 196, 15]);
    autoTable(doc, {
        head: [['Property', 'Issue Type', 'Description', 'Reported', 'Status', 'Cost']],
        body: [...maintenanceRecords].sort((a, b) => (b.reportedDate || '').localeCompare(a.reportedDate || '')).map(m => {
            const prop = properties.find(p => p.id === m.propertyId);
            return [prop?.nickname || '—', m.issueType || '—', m.description || '—', fmtDate(m.reportedDate), (m.status || '—').toUpperCase(), fmtCurrency(m.cost)];
        }),
        foot: [['', '', '', '', 'TOTAL COST', fmtCurrency(totalMaint)]],
        startY: sec8Y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 160, 10], textColor: 30 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: { fillColor: [250, 245, 210], fontStyle: 'bold' }
    });

    // ---- 9. DEPOSITS ----
    if (deposits.length > 0) {
        const totalDeposit = deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        const sec9Y = addSectionTitle(doc, '9. DEPOSITS', [127, 140, 141]);
        autoTable(doc, {
            head: [['Property', 'Tenant', 'Type', 'Amount', 'Status']],
            body: deposits.map(d => {
                const prop = properties.find(p => p.id === d.propertyId);
                const tenant = tenants.find(t => t.id === d.tenantId);
                return [prop?.nickname || '—', tenant?.name || '—', d.depositType || '—', fmtCurrency(d.amount), (d.status || '—').toUpperCase()];
            }),
            foot: [['', '', '', 'TOTAL HELD', fmtCurrency(totalDeposit)]],
            startY: sec9Y,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [127, 140, 141], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            footStyles: { fillColor: [230, 232, 234], fontStyle: 'bold' }
        });
    }

    // ---- FINAL SUMMARY PAGE ----
    doc.addPage();
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL SUMMARY', 14, 22);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const totalExpenses = totalTax + totalUtil + totalInsure + totalMgmt + totalMaint;
    const netBalance = totalCollected - totalExpenses;

    autoTable(doc, {
        head: [['Category', 'Amount (MYR)']],
        body: [
            ['INCOME', ''],
            ['  Rent Collected', fmtCurrency(totalCollected)],
            ['  Rent Outstanding (Not Yet Paid)', fmtCurrency(totalDue - totalCollected)],
            ['', ''],
            ['EXPENSES', ''],
            ['  Taxes (Cukai Pintu + Cukai Tanah)', fmtCurrency(totalTax)],
            ['  Utilities (TNB, Water, Indah Water)', fmtCurrency(totalUtil)],
            ['  Insurance Premiums', fmtCurrency(totalInsure)],
            ['  Management Fees / Sinking Fund', fmtCurrency(totalMgmt)],
            ['  Maintenance & Repairs', fmtCurrency(totalMaint)],
            ['', ''],
            ['Total Expenses', fmtCurrency(totalExpenses)],
        ],
        foot: [['NET BALANCE (Income − Expenses)', fmtCurrency(netBalance)]],
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [20, 20, 20], textColor: 255, fontSize: 11 },
        footStyles: {
            fillColor: netBalance >= 0 ? [39, 174, 96] : [192, 57, 43],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 13
        },
        columnStyles: { 1: { halign: 'right' } },
        alternateRowStyles: { fillColor: [248, 248, 248] }
    });

    doc.save(`full-statement-${today}.pdf`);
}
