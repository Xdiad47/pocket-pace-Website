import { createHash, randomInt } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

// Admin-SDK-only collection — there's no Firestore security rule for it,
// which means it's implicitly denied to every client SDK by default (rules
// only grant access under /users/**). Only these server routes ever touch it.
const COLLECTION = "otpCodes";
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
// A 6-digit code is 1,000,000 possibilities — this is what actually makes
// that safe against brute-forcing within the 10-minute expiry window.
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "signup" | "reset";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function docId(email: string): string {
  return email.trim().toLowerCase();
}

export async function createOtp(
  email: string,
  purpose: OtpPurpose
): Promise<{ code: string } | { error: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(docId(email));
  const existing = await ref.get();

  if (existing.exists) {
    const createdAtMs = (existing.data()!.createdAt as Timestamp).toMillis();
    if (Date.now() - createdAtMs < RESEND_COOLDOWN_MS) {
      return { error: "Please wait a moment before requesting another code." };
    }
  }

  // randomInt's upper bound is exclusive, so this is 100000-999999 — always six digits.
  const code = randomInt(100000, 1000000).toString();
  await ref.set({
    codeHash: hashCode(code),
    purpose,
    attempts: 0,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
  });

  return { code };
}

/** One-time use — a successful verification deletes the code immediately. */
export async function verifyOtp(
  email: string,
  purpose: OtpPurpose,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(docId(email));
  const snap = await ref.get();

  const invalid = { ok: false as const, error: "Invalid or expired code. Please request a new one." };

  if (!snap.exists) return invalid;

  const data = snap.data()!;
  if (data.purpose !== purpose) return invalid;

  if ((data.expiresAt as Timestamp).toMillis() < Date.now()) {
    await ref.delete();
    return { ok: false, error: "That code has expired. Please request a new one." };
  }

  if ((data.attempts as number) >= MAX_ATTEMPTS) {
    await ref.delete();
    return { ok: false, error: "Too many incorrect attempts. Please request a new code." };
  }

  if (data.codeHash !== hashCode(code.trim())) {
    await ref.update({ attempts: (data.attempts as number) + 1 });
    return { ok: false, error: "That code doesn't match. Please check and try again." };
  }

  await ref.delete();
  return { ok: true };
}
