import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';

// ── Init Firebase Admin ──────────────────────────────────────────────────────
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();

// ── Alert computation (mirrors src/utils/alerts.js) ─────────────────────────
function computeAlerts({ properties, rentRecords, taxRecords, insuranceRecords, agreements, maintenanceRecords, managementFees }) {
    const today = startOfToday();
    const alerts = [];

    agreements.forEach(a => {
        if (!a.endDate) return;
        const days = differenceInDays(parseISO(a.endDate), today);
        const prop = properties.find(p => p.id === a.propertyId);
        const name = prop?.nickname || 'Unknown';
        if (days <= 90 && days > 0)
            alerts.push({ severity: days <= 14 ? '🔴' : '⚠️', title: 'Tenancy Expiring', message: `${name} — agreement expires in ${days} days` });
        else if (days <= 0 && days >= -30)
            alerts.push({ severity: '🔴', title: 'Tenancy Expired', message: `${name} — agreement expired ${Math.abs(days)} days ago` });
    });

    rentRecords.forEach(r => {
        if (r.status === 'paid') return;
        const prop = properties.find(p => p.id === r.propertyId);
        const name = prop?.nickname || 'Unknown';
        const days = differenceInDays(today, parseISO(`${r.month}-01`));
        if (days > 0)
            alerts.push({ severity: days > 14 ? '🔴' : '⚠️', title: 'Rent Overdue', message: `${name} — rent overdue by ${days} days` });
    });

    taxRecords.forEach(t => {
        if (t.status === 'paid' || !t.dueDate) return;
        const days = differenceInDays(parseISO(t.dueDate), today);
        const prop = properties.find(p => p.id === t.propertyId);
        const name = prop?.nickname || 'Unknown';
        const label = t.taxType === 'cukai_tanah' ? 'Cukai Tanah' : 'Cukai Taksiran';
        if (days <= 60 && days >= -30)
            alerts.push({
                severity: days <= 0 ? '🔴' : days <= 14 ? '⚠️' : 'ℹ️',
                title: days <= 0 ? `${label} Overdue` : `${label} Due`,
                message: days <= 0 ? `${name} — ${label} overdue by ${Math.abs(days)} days` : `${name} — ${label} due in ${days} days`
            });
    });

    insuranceRecords.forEach(ins => {
        if (!ins.expiryDate) return;
        const days = differenceInDays(parseISO(ins.expiryDate), today);
        const prop = properties.find(p => p.id === ins.propertyId);
        const name = prop?.nickname || 'Unknown';
        if (days <= 60 && days >= -7)
            alerts.push({
                severity: days <= 0 ? '🔴' : days <= 30 ? '⚠️' : 'ℹ️',
                title: days <= 0 ? 'Insurance Expired' : 'Insurance Expiring',
                message: days <= 0 ? `${name} — ${ins.insuranceType} expired ${Math.abs(days)} days ago` : `${name} — ${ins.insuranceType} expires in ${days} days`
            });
    });

    maintenanceRecords.forEach(m => {
        if (m.status !== 'open') return;
        const days = differenceInDays(today, parseISO(m.reportedDate));
        const prop = properties.find(p => p.id === m.propertyId);
        const name = prop?.nickname || 'Unknown';
        if (days > 7)
            alerts.push({ severity: days > 30 ? '🔴' : '⚠️', title: 'Open Maintenance Issue', message: `${name} — "${m.description}" open for ${days} days` });
    });

    managementFees.forEach(fee => {
        if (fee.status !== 'active' || !fee.nextDueDate) return;
        const days = differenceInDays(parseISO(fee.nextDueDate), today);
        const prop = properties.find(p => p.id === fee.propertyId);
        const name = prop?.nickname || 'Unknown';
        const label = fee.description || fee.feeType || 'Fee';
        if (days <= 14 && days >= -30)
            alerts.push({
                severity: days <= 0 ? '🔴' : '⚠️',
                title: days <= 0 ? 'Management Fee Overdue' : 'Management Fee Due',
                message: days <= 0 ? `${name} — ${label} overdue by ${Math.abs(days)} days` : `${name} — ${label} due in ${days} days`
            });
    });

    return alerts;
}

// ── HTML Email builder ───────────────────────────────────────────────────────
function buildEmail(alerts) {
    const dateStr = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const danger = alerts.filter(a => a.severity === '🔴');
    const warning = alerts.filter(a => a.severity === '⚠️');
    const info = alerts.filter(a => a.severity === 'ℹ️');

    const renderGroup = (items, color, bg, label) => {
        if (!items.length) return '';
        return `
        <div style="margin-bottom:20px;">
            <div style="background:${bg};border-left:4px solid ${color};border-radius:6px;padding:14px 18px;margin-bottom:8px;">
                <strong style="color:${color};font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">${label}</strong>
            </div>
            ${items.map(a => `
            <div style="border:1px solid #e5e7eb;border-radius:6px;padding:14px 18px;margin-bottom:8px;background:#fff;">
                <div style="font-weight:600;color:#111;margin-bottom:4px;">${a.title}</div>
                <div style="color:#555;font-size:14px;">${a.message}</div>
            </div>`).join('')}
        </div>`;
    };

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#111;padding:28px 32px;">
      <div style="color:#fff;font-size:20px;font-weight:700;">🏠 PropTrack MY</div>
      <div style="color:#aaa;font-size:13px;margin-top:4px;">Daily Alert Digest · ${dateStr}</div>
    </div>

    <!-- Summary Banner -->
    <div style="background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:16px 32px;display:flex;align-items:center;gap:12px;">
      <div style="font-size:24px;">${alerts.length > 0 ? '🔔' : '✅'}</div>
      <div>
        <div style="font-weight:600;color:#111;">${alerts.length} item${alerts.length !== 1 ? 's' : ''} need${alerts.length === 1 ? 's' : ''} your attention</div>
        <div style="color:#666;font-size:13px;">${danger.length} urgent · ${warning.length} warning · ${info.length} info</div>
      </div>
    </div>

    <!-- Alerts -->
    <div style="padding:24px 32px;">
      ${renderGroup(danger, '#dc2626', '#fef2f2', '🔴 Urgent')}
      ${renderGroup(warning, '#d97706', '#fffbeb', '⚠️ Warnings')}
      ${renderGroup(info, '#2563eb', '#eff6ff', 'ℹ️ Info')}
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <div style="color:#999;font-size:12px;">Sent by PropTrack MY · <a href="https://property-tracking.vercel.app" style="color:#2563eb;">Open App</a></div>
    </div>
  </div>
</body>
</html>`;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { secret, userId } = req.body || {};

    if (!secret || secret !== process.env.ALERT_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        // Read all Firestore data for this user
        const userRef = db.collection('users').doc(userId);

        const [propSnap, rentSnap, taxSnap, insSnap, agreeSnap, maintSnap, mgmtSnap, settingsSnap] = await Promise.all([
            userRef.collection('properties').get(),
            userRef.collection('rentRecords').get(),
            userRef.collection('taxRecords').get(),
            userRef.collection('insuranceRecords').get(),
            userRef.collection('agreements').get(),
            userRef.collection('maintenanceRecords').get(),
            userRef.collection('managementFees').get(),
            db.doc(`users/${userId}/settings/default`).get(),
        ]);

        const toArr = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const properties = toArr(propSnap);
        const rentRecords = toArr(rentSnap);
        const taxRecords = toArr(taxSnap);
        const insuranceRecords = toArr(insSnap);
        const agreements = toArr(agreeSnap);
        const maintenanceRecords = toArr(maintSnap);
        const managementFees = toArr(mgmtSnap);

        // Get alert email from settings or env fallback
        const settings = settingsSnap.exists ? settingsSnap.data() : {};
        const alertEmail = settings.alertEmail || process.env.ALERT_EMAIL;

        if (!alertEmail) {
            return res.status(400).json({ error: 'No alert email configured' });
        }

        // Compute alerts
        const alerts = computeAlerts({ properties, rentRecords, taxRecords, insuranceRecords, agreements, maintenanceRecords, managementFees });

        if (alerts.length === 0) {
            return res.status(200).json({ success: true, message: 'No alerts today — all good!', alertsSent: 0 });
        }

        // Send email
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'PropTrack <onboarding@resend.dev>',
            to: alertEmail,
            subject: `🏠 PropTrack — ${alerts.length} alert${alerts.length > 1 ? 's' : ''} need your attention`,
            html: buildEmail(alerts),
        });

        return res.status(200).json({ success: true, alertsSent: alerts.length, email: alertEmail });

    } catch (err) {
        console.error('Alert send error:', err);
        return res.status(500).json({ error: err.message });
    }
}
