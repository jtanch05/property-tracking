// /api/sync-calendar.js
// Called by a scheduled backend job.
// For every user who has connected Google Calendar:
//   1. Read their property alerts from Firestore
//   2. Create or update events directly in their Google Calendar
//   3. Events appear automatically — user sees them without doing anything

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { computeAlerts } from '../src/utils/alerts.js';

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

// ── Get a fresh access token using the stored refresh token ──────────────────
async function refreshAccessToken(refreshToken) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: 'refresh_token',
        }),
    });
    return res.json();
}

// ── Get a valid access token (refresh if expired) ────────────────────────────
async function getValidToken(uid, calendarData) {
    // If token expires in more than 5 minutes, use it as-is
    if (calendarData.expiresAt > Date.now() + 300000) {
        return calendarData.accessToken;
    }

    // Token expired — use refresh token to get a new one
    const newTokens = await refreshAccessToken(calendarData.refreshToken);
    if (newTokens.error) throw new Error(`Token refresh failed: ${newTokens.error}`);

    // Save the new access token back to Firestore
    await db.doc(`users/${uid}/integrations/googleCalendar`).update({
        accessToken: newTokens.access_token,
        expiresAt: Date.now() + (newTokens.expires_in * 1000),
    });

    return newTokens.access_token;
}

// ── Google Calendar API helpers ──────────────────────────────────────────────
async function findExistingEvent(accessToken, proptrackId) {
    // Find if we already created this alert as a calendar event before
    const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=proptrackId%3D${proptrackId}&maxResults=1`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    return data.items?.[0] || null;
}

async function createOrUpdateEvent(accessToken, alert) {
    const eventDate = alert.date || new Date().toISOString().split('T')[0];
    // End date is day after (Google Calendar all-day events need start + end)
    const endDate = new Date(new Date(eventDate).getTime() + 86400000).toISOString().split('T')[0];

    const severityEmoji = alert.severity === 'danger' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    const event = {
        summary: `${severityEmoji} ${alert.title}`,
        description: `${alert.message}\n\nManaged by PropTrack MY\nhttps://property-tracking.vercel.app`,
        start: { date: eventDate },
        end: { date: endDate },
        colorId: alert.severity === 'danger' ? '11' : alert.severity === 'warning' ? '5' : '9', // red, yellow, blue
        extendedProperties: {
            private: {
                proptrackId: alert.id,  // our unique ID — used to find & update this event later
                source: 'proptrack',
            }
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 60 * 24 },    // 1 day before
                { method: 'popup', minutes: 60 * 24 * 7 }, // 1 week before
                { method: 'email', minutes: 60 * 24 },
            ],
        },
    };

    const existing = await findExistingEvent(accessToken, alert.id);

    if (existing) {
        // Update the existing event (PATCH = partial update)
        await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.id}`,
            {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
            }
        );
        return 'updated';
    } else {
        // Create new event
        await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
            }
        );
        return 'created';
    }
}

// ── Process one user's calendar sync ─────────────────────────────────────────
async function syncUserCalendar(uid) {
    // Check if this user has connected Google Calendar
    const calendarDoc = await db.doc(`users/${uid}/integrations/googleCalendar`).get();
    if (!calendarDoc.exists) return { uid, skipped: true, reason: 'Google Calendar not connected' };

    const calendarData = calendarDoc.data();
    if (!calendarData.refreshToken) return { uid, skipped: true, reason: 'No refresh token' };

    // Get a valid (non-expired) access token
    const accessToken = await getValidToken(uid, calendarData);

    // Read user's Firestore data
    const userRef = db.collection('users').doc(uid);
    const [propSnap, rentSnap, taxSnap, insSnap, agreeSnap, maintSnap, mgmtSnap] = await Promise.all([
        userRef.collection('properties').get(),
        userRef.collection('rentRecords').get(),
        userRef.collection('taxRecords').get(),
        userRef.collection('insuranceRecords').get(),
        userRef.collection('agreements').get(),
        userRef.collection('maintenanceRecords').get(),
        userRef.collection('managementFees').get(),
    ]);

    const toArr = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const alerts = computeAlerts({
        properties: toArr(propSnap),
        rentRecords: toArr(rentSnap),
        taxRecords: toArr(taxSnap),
        insuranceRecords: toArr(insSnap),
        agreements: toArr(agreeSnap),
        maintenanceRecords: toArr(maintSnap),
        managementFees: toArr(mgmtSnap),
    });

    if (alerts.length === 0) return { uid, skipped: true, reason: 'No alerts to sync' };

    // Create or update each alert as a Google Calendar event
    const results = await Promise.allSettled(
        alerts.map(alert => createOrUpdateEvent(accessToken, alert))
    );

    const created = results.filter(r => r.status === 'fulfilled' && r.value === 'created').length;
    const updated = results.filter(r => r.status === 'fulfilled' && r.value === 'updated').length;

    return { uid, created, updated, total: alerts.length };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { secret } = req.body || {};
    if (!secret || secret !== process.env.ALERT_SECRET) return res.status(401).json({ error: 'Unauthorized' });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel environment variables.' });
    }

    try {
        const auth = getAuth();
        const listResult = await auth.listUsers(1000);
        const uids = listResult.users.map(u => u.uid);

        const results = await Promise.allSettled(uids.map(uid => syncUserCalendar(uid)));

        const summary = results.map((r, i) => {
            if (r.status === 'fulfilled') return r.value;
            return { uid: uids[i], error: r.reason?.message };
        });

        const synced = summary.filter(r => r.created !== undefined || r.updated !== undefined).length;
        const skipped = summary.filter(r => r.skipped).length;

        return res.status(200).json({
            success: true,
            totalUsers: uids.length,
            calendarsSynced: synced,
            skipped,
            details: summary,
        });

    } catch (err) {
        console.error('Calendar sync error:', err);
        return res.status(500).json({ error: err.message });
    }
}
