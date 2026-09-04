import { Resend } from "resend";
import type { OtpPurpose } from "@/lib/otp";

// Lazy for the same reason as lib/firebaseAdmin.ts — Next.js imports every
// route module during `next build`, so eager init would fail the build
// itself if RESEND_API_KEY isn't present at build time.
function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY.");
  return new Resend(apiKey);
}

const COPY: Record<OtpPurpose, { subject: string; heading: string; body: string }> = {
  signup: {
    subject: "Verify your email — Pocket Pace",
    heading: "Confirm your email",
    body: "Enter this code in the app to finish creating your account.",
  },
  reset: {
    subject: "Reset your password — Pocket Pace",
    heading: "Reset your password",
    body: "Enter this code in the app to set a new password.",
  },
};

export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose) {
  const resend = getResend();
  const { subject, heading, body } = COPY[purpose];

  const { error } = await resend.emails.send({
    // Verified with Resend via send.auraplanapp.com (SPF/DKIM/DMARC) —
    // borrowed from the developer's other app since Pocket Pace doesn't
    // have its own domain yet. Swap this once it does; nothing else here
    // needs to change.
    from: "Pocket Pace <otp@send.auraplanapp.com>",
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <img
          src="https://pocket-pace-website.vercel.app/logo.png"
          alt="Pocket Pace"
          width="56"
          height="56"
          style="border-radius: 14px; margin-bottom: 16px;"
        />
        <h2 style="color: #0E6E6B;">${heading}</h2>
        <p style="color: #16201F;">${body}</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0E6E6B; margin: 24px 0;">
          ${code}
        </p>
        <p style="color: #5F6B6A; font-size: 14px;">
          This code expires in 10 minutes. If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
