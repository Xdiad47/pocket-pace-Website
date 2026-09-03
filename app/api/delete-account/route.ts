import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

// Needs the Node runtime, not Edge — firebase-admin isn't Edge-compatible.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  let adminAuth: ReturnType<typeof getAdminAuth>;
  let adminDb: ReturnType<typeof getAdminDb>;
  try {
    adminAuth = getAdminAuth();
    adminDb = getAdminDb();
  } catch (err) {
    // Almost always a malformed/missing FIREBASE_* env var — surface that
    // clearly instead of a bare 500 with no body.
    console.error("Admin SDK init failed", err);
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  let uid: string;
  try {
    // checkRevoked catches a token minted before a very recent password
    // change/sign-out, so a stolen old token can't be replayed here.
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid or expired session. Please sign in again." }, { status: 401 });
  }

  try {
    // Delete the Firestore document tree first — if this fails, the user
    // still has a valid account to retry with. Deleting Auth first would
    // orphan their data with no way back in to ask for it to be removed.
    await adminDb.recursiveDelete(adminDb.collection("users").doc(uid));
    await adminAuth.deleteUser(uid);
  } catch (err) {
    console.error("Account deletion failed", err);
    return NextResponse.json(
      { error: "Deletion failed partway through. Please try again or contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
