# Pocket Pace — website

Landing page, Privacy Policy, Terms and Conditions, and a self-service
account-deletion page for the Pocket Pace Android app (`io.xdiad.pocketpace`).
Deployed on Vercel.

## Structure

- `app/page.tsx` — landing page
- `app/privacy/page.tsx`, `app/terms/page.tsx` — legal pages
- `app/delete-account/page.tsx` — sign in (Google or email/password), confirm,
  and permanently delete the account
- `app/api/delete-account/route.ts` — verifies the Firebase ID token server-side,
  then deletes the Firestore document tree and the Firebase Auth user via the
  Admin SDK. This is what makes the deletion page a real, self-service delete
  rather than just instructions — it's the same requirement as the in-app
  delete flow, exposed over HTTPS as well.
- `lib/firebaseClient.ts` — public web SDK config (safe to be public; access is
  controlled by Firestore security rules, not by hiding this)
- `lib/firebaseAdmin.ts` — server-only Admin SDK, lazily initialized from env vars
- `lib/siteConfig.ts` — the few facts only you can supply (see below)

## Before this can go live

1. **Fill in `lib/siteConfig.ts`**: `legalEntityName`, `contactEmail`,
   `jurisdiction`. These appear on the Privacy Policy and Terms pages.
2. **Generate a Firebase service account key** for the deletion API route:
   Firebase Console → Project settings → Service accounts →
   `pocketpace-14241` → Generate new private key. In the Vercel project,
   add as environment variables (see `.env.local.example` for the names):
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
   Never commit the downloaded JSON.
3. **Add the deployed domain to Firebase Auth's authorized domains** —
   Firebase Console → Authentication → Settings → Authorized domains. Needed
   for both Google sign-in and email/password sign-in to work on this site;
   `*.vercel.app` preview URLs are not authorized by default, only the
   specific domain(s) you add.
4. Once there's a Play Store listing, set `playStoreUrl` in `siteConfig.ts` to
   turn the landing page's "Coming soon" button into a real link.

## Local development

```bash
npm install
npm run dev
```

The delete-account page's sign-in works without the admin env vars; the
actual deletion call needs them (see step 2 above), so use
`.env.local.example` as a template for a local `.env.local` if you need to
test deletion end-to-end.

## Deploying

Push this repo (or just the `website/` directory, if deploying as a
subfolder of the Android repo) to Vercel and set the three env vars from
step 2 in Project Settings → Environment Variables. Vercel auto-detects
Next.js — no other config needed.
