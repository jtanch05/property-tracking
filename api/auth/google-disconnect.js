import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Firebase ID token required' });

    try {
        const decoded = await getAuth().verifyIdToken(token);
        await db.doc(`users/${decoded.uid}/integrations/googleCalendar`).delete();
        await db.doc(`users/${decoded.uid}/settings/default`).set(
            { googleCalendarConnected: false },
            { merge: true }
        );
        return res.status(200).json({ success: true });
    } catch {
        return res.status(401).json({ error: 'Invalid Firebase ID token' });
    }
}
