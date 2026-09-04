import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string; newPassword?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const newPassword = body.newPassword;
  const code = body.code?.trim();

  if (!email || !newPassword || !code) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const verification = await verifyOtp(email, "reset", code);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { password: newPassword });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("reset-password failed", err);
    return NextResponse.json({ error: "Couldn't reset your password. Please try again." }, { status: 500 });
  }
}
