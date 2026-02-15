// Alert computation logic

import { differenceInDays, parseISO, startOfToday } from 'date-fns';

/**
 * Scans all data modules and returns an array of alert objects.
 * Each alert: { id, type, severity, title, message, date, daysUntil, entityId, entityType }
 */
export function computeAlerts({ agreements = [], taxRecords = [], insuranceRecords = [], maintenanceRecords = [], rentRecords = [], managementFees = [], properties = [] }) {
    const today = startOfToday();
    const alerts = [];

    // --- Agreement Expiry Alerts ---
    agreements.forEach(a => {
        if (!a.endDate) return;
        const end = parseISO(a.endDate);
        const days = differenceInDays(end, today);
        const property = properties.find(p => p.id === a.propertyId);
        const propName = property?.nickname || 'Unknown Property';

        if (days <= 90 && days > 0) {
            let severity = 'info';
            if (days <= 14) severity = 'danger';
            else if (days <= 30) severity = 'warning';
            else if (days <= 60) severity = 'warning';

            alerts.push({
                id: `agreement-${a.id}`,
                type: 'agreement_expiry',
                severity,
                title: 'Tenancy Expiring',
                message: `${propName} — agreement expires in ${days} days`,
                date: a.endDate,
                daysUntil: days,
                entityId: a.id,
                entityType: 'agreement',
            });
        } else if (days <= 0 && days >= -30) {
            alerts.push({
                id: `agreement-expired-${a.id}`,
                type: 'agreement_expired',
                severity: 'danger',
                title: 'Tenancy Expired',
                message: `${propName} — agreement expired ${Math.abs(days)} days ago`,
                date: a.endDate,
                daysUntil: days,
                entityId: a.id,
                entityType: 'agreement',
            });
        }
    });

    // --- Rent Overdue Alerts ---
    rentRecords.forEach(r => {
        if (r.status === 'paid') return;
        const property = properties.find(p => p.id === r.propertyId);
        const propName = property?.nickname || 'Unknown Property';
        // Assume rent is due on the 1st of the month
        const dueDate = parseISO(`${r.month}-01`);
        const days = differenceInDays(today, dueDate);

        if (days > 0) {
            alerts.push({
                id: `rent-overdue-${r.id}`,
                type: 'rent_overdue',
                severity: days > 14 ? 'danger' : 'warning',
                title: 'Rent Overdue',
                message: `${propName} — rent overdue by ${days} days`,
                date: `${r.month}-01`,
                daysUntil: -days,
                entityId: r.id,
                entityType: 'rent',
            });
        }
    });

    // --- Tax Due Alerts ---
    taxRecords.forEach(t => {
        if (t.status === 'paid' || !t.dueDate) return;
        const due = parseISO(t.dueDate);
        const days = differenceInDays(due, today);
        const property = properties.find(p => p.id === t.propertyId);
        const propName = property?.nickname || 'Unknown Property';
        const taxLabel = t.taxType === 'cukai_tanah' ? 'Cukai Tanah' : 'Cukai Taksiran';

        if (days <= 60 && days >= -30) {
            alerts.push({
                id: `tax-${t.id}`,
                type: 'tax_due',
                severity: days <= 0 ? 'danger' : days <= 14 ? 'warning' : 'info',
                title: days <= 0 ? `${taxLabel} Overdue` : `${taxLabel} Due`,
                message: days <= 0
                    ? `${propName} — ${taxLabel} overdue by ${Math.abs(days)} days`
                    : `${propName} — ${taxLabel} due in ${days} days`,
                date: t.dueDate,
                daysUntil: days,
                entityId: t.id,
                entityType: 'tax',
            });
        }
    });

    // --- Insurance Expiry Alerts ---
    insuranceRecords.forEach(ins => {
        if (!ins.expiryDate) return;
        const exp = parseISO(ins.expiryDate);
        const days = differenceInDays(exp, today);
        const property = properties.find(p => p.id === ins.propertyId);
        const propName = property?.nickname || 'Unknown Property';

        if (days <= 60 && days >= -7) {
            alerts.push({
                id: `insurance-${ins.id}`,
                type: 'insurance_expiry',
                severity: days <= 0 ? 'danger' : days <= 7 ? 'danger' : days <= 30 ? 'warning' : 'info',
                title: days <= 0 ? 'Insurance Expired' : 'Insurance Expiring',
                message: days <= 0
                    ? `${propName} — ${ins.insuranceType} insurance expired ${Math.abs(days)} days ago`
                    : `${propName} — ${ins.insuranceType} insurance expires in ${days} days`,
                date: ins.expiryDate,
                daysUntil: days,
                entityId: ins.id,
                entityType: 'insurance',
            });
        }
    });

    // --- Maintenance Open Alerts ---
    maintenanceRecords.forEach(m => {
        if (m.status !== 'open') return;
        const reported = parseISO(m.reportedDate);
        const days = differenceInDays(today, reported);
        const property = properties.find(p => p.id === m.propertyId);
        const propName = property?.nickname || 'Unknown Property';

        if (days > 7) {
            alerts.push({
                id: `maintenance-${m.id}`,
                type: 'maintenance_open',
                severity: days > 30 ? 'danger' : 'warning',
                title: 'Open Maintenance Issue',
                message: `${propName} — "${m.description}" open for ${days} days`,
                date: m.reportedDate,
                daysUntil: -days,
                entityId: m.id,
                entityType: 'maintenance',
            });
        }

        // Scheduled maintenance reminders
        if (m.isScheduled && m.nextDueDate) {
            const nextDue = parseISO(m.nextDueDate);
            const daysUntil = differenceInDays(nextDue, today);
            if (daysUntil <= 14 && daysUntil >= -7) {
                alerts.push({
                    id: `scheduled-${m.id}`,
                    type: 'scheduled_maintenance',
                    severity: daysUntil <= 0 ? 'danger' : 'warning',
                    title: 'Scheduled Maintenance',
                    message: daysUntil <= 0
                        ? `${propName} — ${m.scheduledType} is overdue`
                        : `${propName} — ${m.scheduledType} due in ${daysUntil} days`,
                    date: m.nextDueDate,
                    daysUntil,
                    entityId: m.id,
                    entityType: 'maintenance',
                });
            }
        }
    });

    // --- Management Fee Due Alerts ---
    managementFees.forEach(fee => {
        if (fee.status !== 'active' || !fee.nextDueDate) return;
        const due = parseISO(fee.nextDueDate);
        const days = differenceInDays(due, today);
        const property = properties.find(p => p.id === fee.propertyId);
        const propName = property?.nickname || 'Unknown Property';
        const feeLabel = fee.description || fee.feeType;

        if (days <= 14 && days >= -30) {
            alerts.push({
                id: `mgmt-fee-${fee.id}`,
                type: 'management_fee_due',
                severity: days <= 0 ? 'danger' : days <= 7 ? 'warning' : 'info',
                title: days <= 0 ? 'Management Fee Overdue' : 'Management Fee Due',
                message: days <= 0
                    ? `${propName} — ${feeLabel} overdue by ${Math.abs(days)} days`
                    : `${propName} — ${feeLabel} due in ${days} days`,
                date: fee.nextDueDate,
                daysUntil: days,
                entityId: fee.id,
                entityType: 'managementFee',
            });
        }
    });

    // Sort: most urgent first
    alerts.sort((a, b) => a.daysUntil - b.daysUntil);

    return alerts;
}
