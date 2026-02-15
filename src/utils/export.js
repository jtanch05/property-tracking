// JSON export/import for data backup

import { getStorageItem, setStorageItem, getAllStorageKeys, clearAllStorage } from './storage';

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
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
