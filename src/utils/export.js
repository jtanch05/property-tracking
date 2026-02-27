// JSON export/import for data backup

import { getStorageItem, setStorageItem, getAllStorageKeys, clearAllStorage } from './storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DATA_KEYS = [
    'properties',
    'tenants',
    'agreements',
    'rentRecords',
    'taxRecords',
    'utilityRecords',
    'insuranceRecords',
    'maintenanceRecords',
    'vendors',
    'managementFees',
    'payouts',
    'deposits',
    'settings',
];

export function exportAllData() {
    const data = {};
    DATA_KEYS.forEach(key => {
        const value = getStorageItem(key);
        if (value !== null) {
            data[key] = value;
        }
    });
    data._exportedAt = new Date().toISOString();
    data._version = '1.0';
    return data;
}

export function downloadBackup() {
    const data = exportAllData();
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
        if (!data._version) {
            throw new Error('Invalid backup file: missing version');
        }
        DATA_KEYS.forEach(key => {
            if (data[key] !== undefined) {
                setStorageItem(key, data[key]);
            }
        });
        return { success: true, keys: Object.keys(data).filter(k => !k.startsWith('_')) };
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
                ? `"${str.replace(/"/g, '""')}"`
                : str;
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

export function exportToPDF(data, filename, title = "Data Report") {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();

    // Add Report Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Add Timestamp
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated: ${dateStr}`, 14, 30);

    const headers = Object.keys(data[0]);

    // Format rows to handle objects/nulls safely for PDF rendering
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
