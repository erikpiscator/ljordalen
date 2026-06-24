# Ljørdalen — Family Cabin Booking

A simple, tight booking calendar for a shared family cabin where **only one
household can stay at a time**. Family members sign in with Google, see a
color-coded month calendar of who's there when, and book/cancel stays without
ever double-booking.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui ·
Firestore · NextAuth (Google) · Cloud Storage · Resend**, hosted on **GCP App
Engine**.

## Features

- **Google sign-in**, restricted to a family allowlist you control.
- **Color-coded month calendar** — tap a free day to book, tap a booking to see
  details / edit / cancel.
- **No double-booking** — overlap is rejected inside a Firestore transaction, so
  two people booking the same dates at once can't both win. Back-to-back stays
  (one family leaves the day another arrives) are allowed.
- **Bookings list** with upcoming/past tabs and per-household filtering.
- **Notes** on each booking ("bringing the dog", "arriving late").
- **Email notifications** to the family on every booking change (via Resend).
- **Profile pictures** — upload a photo (auto-cropped to a circle) or pick one of
  8 cute pixel-art animals. New members get a stable default animal.
- **Admin area** to add/remove family members, set households + colors, and grant
  admin.

## How it works

| Concern | Approach |
| --- | --- |
| Auth | NextAuth (Google). The allowlist is enforced at sign-in in [`lib/auth.ts`](lib/auth.ts); a non-member never gets a session. |
| Access gate | [`proxy.ts`](proxy.ts) (Next 16's renamed middleware) redirects anyone without a session to `/signin`. |
| Data | Firestore `members/{email}` and `bookings/{id}`, accessed server-side only via the Admin SDK. |
| Dates | Stored as plain `YYYY-MM-DD`, half-open ranges `[start, end)`. See [`lib/dates.ts`](lib/dates.ts). |
| Overlap safety | Transaction in [`lib/bookings.ts`](lib/bookings.ts). |
| Avatars | Procedural pixel-art in [`lib/avatars.ts`](lib/avatars.ts); uploads resized with `sharp` → Cloud Storage in [`app/api/avatar/route.ts`](app/api/avatar/route.ts). |

## One-time GCP setup

You need a GCP project. Replace `YOUR_PROJECT` below.

```bash
gcloud config set project YOUR_PROJECT
gcloud services enable appengine.googleapis.com firestore.googleapis.com storage.googleapis.com

# Firestore in Native mode (pick a region, e.g. europe-west1)
gcloud firestore databases create --location=europe-west1

# App Engine app (same region family)
gcloud app create --region=europe-west

# Cloud Storage bucket for avatars, with public read
gsutil mb -l europe-west1 gs://YOUR_PROJECT-avatars
gsutil iam ch allUsers:objectViewer gs://YOUR_PROJECT-avatars
```

**Google OAuth credentials** (Console → APIs & Services → Credentials → *Create
OAuth client ID* → *Web application*):

- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://YOUR_PROJECT.REGION.r.appspot.com/api/auth/callback/google`

Copy the client ID/secret into the env below.

**Resend** (optional, for emails): create an account, add + verify a sender
domain (or a single sender address), and create an API key.

## Local development (zero-setup dev mode)

Click through the whole app locally with **no GCP project and no Google OAuth** —
it runs against the Firestore emulator with a dev-only login.

Prerequisites: Node 20+, a JDK (for the emulator), and the Firebase CLI
(`npm install -g firebase-tools`).

```bash
npm install
cp .env.local.example .env.local   # the committed example is preset for dev mode

# Terminal 1 — Firestore emulator
npm run emulator

# Terminal 2 — the app
npm run dev                          # http://localhost:3000
```

On the sign-in page use the **"Dev sign in"** box (enabled by `DEV_LOGIN=true`)
to sign in as any name/email — no password. Whoever matches `ADMIN_EMAILS`
becomes an admin and sees the **Family** page. Emulator data is in-memory and
resets when you stop it.

> Dev mode is automatically disabled in production builds, so the dev login can
> never appear on the deployed app.

### Testing the real Google flow locally

Set `DEV_LOGIN=false`, remove `FIRESTORE_EMULATOR_HOST`, point
`FIREBASE_PROJECT_ID` at a real project, fill in `AUTH_GOOGLE_ID/SECRET`, and run
`gcloud auth application-default login` (or set `FIREBASE_SERVICE_ACCOUNT_KEY`).
The first email in `ADMIN_EMAILS` is auto-provisioned as admin on first sign-in.

### Environment variables

See [`.env.local.example`](.env.local.example). Summary:

| Var | Purpose |
| --- | --- |
| `AUTH_SECRET` | NextAuth session secret (`openssl rand -base64 32`). |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client. |
| `AUTH_URL` | Public URL in production (e.g. the appspot URL). |
| `FIREBASE_PROJECT_ID` | GCP project id (auto on App Engine). |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Only for local dev without ADC. |
| `STORAGE_BUCKET` | Avatar bucket name, e.g. `YOUR_PROJECT-avatars`. |
| `ADMIN_EMAILS` | Comma-separated bootstrap admin emails. |
| `RESEND_API_KEY` / `RESEND_FROM` | Email notifications (optional). |

## Deploy to App Engine

Set runtime env vars in [`app.yaml`](app.yaml) under `env_variables` (keep
secrets out of git — prefer Secret Manager or pass them at deploy time), then:

```bash
gcloud app deploy
gcloud app browse
```

App Engine runs `npm install` → `npm run gcp-build` (`next build`) → `npm start`
(`next start -p $PORT`). It scales to zero when idle (`min_instances: 0`), so it
costs ~nothing between bookings. The default App Engine service account already
has Firestore + Storage access in the same project.

> **Note:** If App Engine ever feels constraining for Next.js, this app moves to
> Cloud Run with no code changes — only the deploy command differs.

## Project layout

```
app/
  (app)/            calendar, bookings, profile, admin (auth-gated group)
  signin, no-access auth screens
  api/auth, api/avatar
  actions/          server actions (bookings, members, auth)
lib/                auth, firebase, members, bookings, dates, avatars, notify
components/         calendar board, dialogs, avatars, nav, member table
proxy.ts            auth gate (edge)
app.yaml            App Engine config
```
