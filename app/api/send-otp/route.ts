import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { createOtp, type OtpPurpose } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string; purpose?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const purpose = body.purpose as OtpPurpose | undefined;
  if (!email || (purpose !== "signup" && purpose !== "reset")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);

    if (purpose === "signup" && existingUser) {
      return NextResponse.json(
        { error: "An account already exists with that email. Try signing in instead." },
        { status: 409 }
      );
    }

    if (purpose === "reset") {
      if (!existingUser) {
        // Deliberately silent — don't reveal whether the email has an account.
        return NextResponse.json({ success: true });
      }
      const hasPassword = existingUser.providerData.some((p) => p.providerId === "password");
      if (!hasPassword) {
        // Unlike "does this email exist at all", this is safe to say
        // outright — it's the exact information the user needs to stop
        // waiting on an email that will never come, and it's determined
        // here via the Admin SDK rather than inferred from the outcome of
        // an actual send attempt.
        return NextResponse.json(
          {
            error:
              "This account uses Google Sign-In — there's no password to reset. " +
              'Use "Continue with Google" instead.',
          },
          { status: 409 }
        );
      }
    }

    const result = await createOtp(email, purpose);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    await sendOtpEmail(email, result.code, purpose);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp failed", err);
    return NextResponse.json({ error: "Couldn't send the code. Please try again." }, { status: 500 });
  }
}
