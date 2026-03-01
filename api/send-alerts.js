import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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

// ── Alert computation ────────────────────────────────────────────────────────
function computeAlerts({ properties, rentRecords, taxRecords, insuranceRecords, agreements, maintenanceRecords, managementFees }) {
    const today = startOfToday();
    const alerts = [];

    agreements.forEach(a => {
        if (!a.endDate) return;
        const days = differenceInDays(parseISO(a.endDate), today);
        const name = properties.find(p => p.id === a.propertyId)?.nickname || 'Unknown';
        if (days <= 90 && days > 0)
            alerts.push({ severity: days <= 14 ? '🔴' : '⚠️', title: 'Tenancy Expiring', message: `${name} — agreement expires in ${days} days` });
        else if (days <= 0 && days >= -30)
            alerts.push({ severity: '🔴', title: 'Tenancy Expired', message: `${name} — agreement expired ${Math.abs(days)} days ago` });
    });

    rentRecords.forEach(r => {
        if (r.status === 'paid') return;
        const name = properties.find(p => p.id === r.propertyId)?.nickname || 'Unknown';
        const days = differenceInDays(today, parseISO(`${r.month}-01`));
        if (days > 0)
            alerts.push({ severity: days > 14 ? '🔴' : '⚠️', title: 'Rent Overdue', message: `${name} — rent overdue by ${days} days` });
    });

    taxRecords.forEach(t => {
        if (t.status === 'paid' || !t.dueDate) return;
        const days = differenceInDays(parseISO(t.dueDate), today);
        const name = properties.find(p => p.id === t.propertyId)?.nickname || 'Unknown';
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
        const name = properties.find(p => p.id === ins.propertyId)?.nickname || 'Unknown';
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
        const name = properties.find(p => p.id === m.propertyId)?.nickname || 'Unknown';
        if (days > 7)
            alerts.push({ severity: days > 30 ? '🔴' : '⚠️', title: 'Open Maintenance Issue', message: `${name} — "${m.description}" open for ${days} days` });
    });

    managementFees.forEach(fee => {
        if (fee.status !== 'active' || !fee.nextDueDate) return;
        const days = differenceInDays(parseISO(fee.nextDueDate), today);
        const name = properties.find(p => p.id === fee.propertyId)?.nickname || 'Unknown';
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
    <div style="background:#111;padding:28px 32px;">
      <div style="color:#fff;font-size:20px;font-weight:700;">🏠 PropTrack MY</div>
      <div style="color:#aaa;font-size:13px;margin-top:4px;">Daily Alert Digest · ${dateStr}</div>
    </div>
    <div style="background:#f8fafc;border-bottom:1px solid #e5e7eb;padding:16px 32px;">
      <div style="font-weight:600;color:#111;">${alerts.length} item${alerts.length !== 1 ? 's' : ''} need${alerts.length === 1 ? 's' : ''} your attention</div>
      <div style="color:#666;font-size:13px;margin-top:4px;">${danger.length} urgent · ${warning.length} warning · ${info.length} info</div>
    </div>
    <div style="padding:24px 32px;">
      ${renderGroup(danger, '#dc2626', '#fef2f2', '🔴 Urgent')}
      ${renderGroup(warning, '#d97706', '#fffbeb', '⚠️ Warnings')}
      ${renderGroup(info, '#2563eb', '#eff6ff', 'ℹ️ Info')}
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <div style="color:#999;font-size:12px;">Sent by PropTrack MY · <a href="https://property-tracking.vercel.app" style="color:#2563eb;">Open App</a></div>
    </div>
  </div>
</body>
</html>`;
}

// ── Process a single user ────────────────────────────────────────────────────
async function processUser(uid, resend) {
    const userRef = db.collection('users').doc(uid);

    const [propSnap, rentSnap, taxSnap, insSnap, agreeSnap, maintSnap, mgmtSnap, settingsSnap] = await Promise.all([
        userRef.collection('properties').get(),
        userRef.collection('rentRecords').get(),
        userRef.collection('taxRecords').get(),
        userRef.collection('insuranceRecords').get(),
        userRef.collection('agreements').get(),
        userRef.collection('maintenanceRecords').get(),
        userRef.collection('managementFees').get(),
        db.doc(`users/${uid}/settings/default`).get(),
    ]);

    const toArr = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    // Only send if user has configured an alert email
    const alertEmail = settings.alertEmail;
    if (!alertEmail) return { uid, skipped: true, reason: 'No alert email set' };

    const alerts = computeAlerts({
        properties: toArr(propSnap),
        rentRecords: toArr(rentSnap),
        taxRecords: toArr(taxSnap),
        insuranceRecords: toArr(insSnap),
        agreements: toArr(agreeSnap),
        maintenanceRecords: toArr(maintSnap),
        managementFees: toArr(mgmtSnap),
    });

    if (alerts.length === 0) return { uid, skipped: true, reason: 'No alerts today' };

    await resend.emails.send({
        from: 'PropTrack <onboarding@resend.dev>',
        to: alertEmail,
        subject: `🏠 PropTrack — ${alerts.length} alert${alerts.length > 1 ? 's' : ''} need your attention`,
        html: buildEmail(alerts),
    });

    return { uid, email: alertEmail, alertsSent: alerts.length };
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { secret } = req.body || {};

    if (!secret || secret !== process.env.ALERT_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const auth = getAuth();

        // ── Get ALL registered users from Firebase Auth ──────────────────────
        // (Firestore users/{uid} documents may not exist explicitly — only subcollections do)
        const listResult = await auth.listUsers(1000); // up to 1000 users
        const uids = listResult.users.map(u => u.uid);

        if (uids.length === 0) {
            return res.status(200).json({ success: true, message: 'No registered users found', processed: 0 });
        }

        // Process each user concurrently
        const results = await Promise.allSettled(
            uids.map(uid => processUser(uid, resend))
        );

        const summary = results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return { uid: uids[i], error: r.reason?.message || 'Unknown error' };
        });

        const sent = summary.filter(r => r.alertsSent > 0).length;
        const skipped = summary.filter(r => r.skipped).length;
        const errors = summary.filter(r => r.error).length;

        console.log(`Alert run complete: ${sent} sent, ${skipped} skipped, ${errors} errors`);

        return res.status(200).json({
            success: true,
            totalUsers: uids.length,
            emailsSent: sent,
            skipped,
            errors,
            details: summary,
        });

    } catch (err) {
        console.error('Alert batch error:', err);
        return res.status(500).json({ error: err.message });
    }
}
