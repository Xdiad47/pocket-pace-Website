import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Server-only. Never import this file from a client component — it needs
// the service account key, set as Vercel environment variables:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (private key with literal \n sequences — Vercel's env editor stores it
// as one line, so it's un-escaped below).
//
// Lazy on purpose: Next.js imports every route module during `next build`
// to collect its config, so eager init would make the build itself fail
// without production credentials present at build time.
function loadAdminApp() {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase admin credentials. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(loadAdminApp());
}

export function getAdminDb() {
  return getFirestore(loadAdminApp());
}
