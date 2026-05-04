// /api/auth/google.js
// Step 1 of OAuth: redirect user to Google's consent screen
// Called when user clicks "Connect Google Calendar" in Settings
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

function signState(uid) {
    const secret = process.env.GOOGLE_STATE_SECRET || process.env.ALERT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    if (!secret) throw new Error('Missing state signing secret');
    const sig = crypto.createHmac('sha256', secret).update(uid).digest('base64url');
    return `${uid}.${sig}`;
}

export default async function handler(req, res) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://property-tracking.vercel.app/api/auth/google-callback';

    if (!clientId) {
        return res.status(500).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to Vercel environment variables.' });
    }

    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Firebase ID token required' });

    let uid;
    try {
        const decoded = await getAuth().verifyIdToken(token);
        uid = decoded.uid;
    } catch {
        return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',   // get refresh token so we can access even when user is offline
        prompt: 'consent',        // always show consent so we always get refresh_token
        state: signState(uid),
    });

    // Redirect browser to Google
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
