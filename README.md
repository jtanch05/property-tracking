# PropTrack MY

PropTrack MY is a React + Vite property portfolio management app for tracking properties, tenants, agreements, rent, expenses, maintenance, vendors, cash flow, alerts, and exports.

## Current Stack

- React 19
- Vite 7
- Firebase Auth
- Firestore
- Firebase Cloud Messaging
- Google Calendar API
- Resend email alerts
- jsPDF exports
- Lucide React icons
- Tailwind CSS utilities where needed

## Features

- Google sign-in
- Per-user Firestore data storage
- Local storage migration into Firestore
- Property, tenant, agreement, rent, expense, maintenance, vendor, payout, and deposit tracking
- Dashboard summaries and alert timeline
- PDF exports and full statement export
- JSON backup/import
- WhatsApp reminder helpers
- Configurable alert frequency
- Resend email alert digests
- Google Calendar OAuth and alert event sync
- Dark and light themes

## Design Direction

The current design is a dark-first operational SaaS interface:

- Font: Inter
- Dark background: `#141414`
- Surface: `#1c1c1c`
- Primary text: `#f0f0f0`
- Secondary text: `#a0a0a0`
- Accent: monochrome silver/white
- Status colors are semantic: success, warning, danger

The current design source of truth is:

- `designsystem`
- `src/index.css`
- `src/pages/Landing.css`

Do not use the old teal/Cinzel/Josefin design direction.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and fill in Firebase client values.

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Client-side Firebase:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

Server/API integrations:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
RESEND_API_KEY=
ALERT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Notes

The Firebase Messaging service worker lives in `public/firebase-messaging-sw.js`. Because it is served as a public service worker file, it cannot use Vite `import.meta.env` directly. Keep its Firebase public config synchronized with the active Firebase project.
