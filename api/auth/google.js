// /api/auth/google.js
// Step 1 of OAuth: redirect user to Google's consent screen
// Called when user clicks "Connect Google Calendar" in Settings

export default function handler(req, res) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://property-tracking.vercel.app/api/auth/google-callback';

    if (!clientId) {
        return res.status(500).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID to Vercel environment variables.' });
    }

    // The "state" is the user's Firebase UID — passed through OAuth so we know who to save the token for
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',   // get refresh token so we can access even when user is offline
        prompt: 'consent',        // always show consent so we always get refresh_token
        state: uid,               // pass uid through, Google will return it in callback
    });

    // Redirect browser to Google
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
