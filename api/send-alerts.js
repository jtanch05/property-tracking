import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Resend } from 'resend';
import { differenceInDays, startOfToday } from 'date-fns';
import { computeAlerts as computeSharedAlerts } from '../src/utils/alerts.js';

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

// ── HTML Email builder ───────────────────────────────────────────────────────
function buildEmail(alerts) {
    const dateStr = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const danger = alerts.filter(a => a.severity === 'danger' || a.severity === '🔴');
    const warning = alerts.filter(a => a.severity === 'warning' || a.severity === '⚠️');
    const info = alerts.filter(a => a.severity === 'info' || a.severity === 'ℹ️');

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

// ── Frequency check: should this user be notified today? ────────────────────
function shouldNotifyToday(settings) {
    const freq = settings.notificationFrequency || 'weekly';
    const lastNotified = settings.lastNotifiedAt ? new Date(settings.lastNotifiedAt) : null;

    if (!lastNotified) return true; // Never notified before → always send

    const daysSince = differenceInDays(startOfToday(), lastNotified);

    switch (freq) {
        case 'daily': return daysSince >= 1;
        case 'weekly': return daysSince >= 7;
        case 'biweekly': return daysSince >= 14;
        case 'monthly': return daysSince >= 30;
        default: return daysSince >= 7;
    }
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

    // ── Check if it's time to notify based on their frequency preference ──────
    if (!shouldNotifyToday(settings)) {
        const freq = settings.notificationFrequency || 'weekly';
        const last = settings.lastNotifiedAt ? new Date(settings.lastNotifiedAt).toDateString() : 'never';
        return { uid, skipped: true, reason: `Frequency: ${freq} (last sent: ${last})` };
    }

    const alerts = computeSharedAlerts({
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

    // ── Record when we last notified this user ────────────────────────────────
    await db.doc(`users/${uid}/settings/default`).set(
        { lastNotifiedAt: new Date().toISOString() },
        { merge: true } // don't overwrite other settings
    );

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
