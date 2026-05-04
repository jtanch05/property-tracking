// /api/auth/google-callback.js
// Step 2 of OAuth: Google redirects back here after user approves
// We exchange the temporary "code" for real access + refresh tokens
// Then save them to Firestore under the user's account

import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

function verifyState(state) {
    const secret = process.env.GOOGLE_STATE_SECRET || process.env.ALERT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    if (!secret || !state) return null;
    const separator = state.lastIndexOf('.');
    if (separator <= 0) return null;
    const uid = state.slice(0, separator);
    const sig = state.slice(separator + 1);
    const expected = crypto.createHmac('sha256', secret).update(uid).digest('base64url');
    if (sig.length !== expected.length) return null;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? uid : null;
}

export default async function handler(req, res) {
    const { code, state, error } = req.query;
    const uid = verifyState(state);
    const appUrl = 'https://property-tracking.vercel.app';

    // User denied permission
    if (error || !code) {
        return res.redirect(`${appUrl}/settings?calendar=denied`);
    }

    if (!uid) {
        return res.redirect(`${appUrl}/settings?calendar=error&reason=invalid_state`);
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google-callback`;

        // Exchange the one-time code for access_token + refresh_token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenRes.json();

        if (tokens.error) {
            console.error('Token exchange error:', tokens);
            return res.redirect(`${appUrl}/settings?calendar=error&reason=token_exchange`);
        }

        // Save tokens to Firestore so we can use them anytime (even when user is offline)
        await db.doc(`users/${uid}/integrations/googleCalendar`).set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,       // long-lived, never expires unless revoked
            expiresAt: Date.now() + (tokens.expires_in * 1000), // when access_token expires
            connectedAt: new Date().toISOString(),
            scope: tokens.scope,
        });

        console.log(`Google Calendar connected for user: ${uid}`);

        // Redirect back to Settings with success message
        return res.redirect(`${appUrl}/settings?calendar=success`);

    } catch (err) {
        console.error('Google callback error:', err);
        return res.redirect(`${appUrl}/settings?calendar=error&reason=server_error`);
    }
}
