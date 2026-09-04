import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const code = body.code?.trim();

  if (!email || !password || !code) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  // Verifying here — server-side, before the account can be created at all —
  // is what makes the OTP step a real gate. If account creation happened
  // client-side instead, nothing would stop a client from skipping the OTP
  // screen entirely and calling Firebase directly.
  const verification = await verifyOtp(email, "signup", code);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const user = await adminAuth.createUser({ email, password, emailVerified: true });
    // Lets the app sign the user in immediately without re-entering anything.
    const customToken = await adminAuth.createCustomToken(user.uid);
    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("complete-signup failed", err);
    const code =
      err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
    const message =
      code === "auth/email-already-exists"
        ? "An account already exists with that email. Try signing in instead."
        : "Couldn't create your account. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
