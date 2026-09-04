import { NextRequest, NextResponse } from "next/server";
import { JWT } from "google-auth-library";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const PACKAGE_NAME = "io.xdiad.pocketpace";
const EXPECTED_PRODUCT_ID = "pocketpace_premium_monthly";

const ACTIVE_STATES = new Set(["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"]);

/** Pulled out standalone so the Play-state-to-entitlement mapping can be eyeballed (and later unit tested) without a network call. */
export function isEntitled(subscriptionState: string): boolean {
  return ACTIVE_STATES.has(subscriptionState);
}

function getPlayClient(): JWT {
  const email = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing Play service account credentials. Set GOOGLE_PLAY_SERVICE_ACCOUNT_CLIENT_EMAIL and GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY."
    );
  }
  return new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/androidpublisher"] });
}

interface SubscriptionPurchaseV2 {
  subscriptionState: string;
  acknowledgementState?: string;
  lineItems?: { productId: string; expiryTime: string }[];
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  let body: { purchaseToken?: string; productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const purchaseToken = body.purchaseToken?.trim();
  const productId = body.productId?.trim();
  if (!purchaseToken || !productId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  // Defends against a tampered client claiming a product it didn't actually buy.
  if (productId !== EXPECTED_PRODUCT_ID) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  let adminAuth: ReturnType<typeof getAdminAuth>;
  let adminDb: ReturnType<typeof getAdminDb>;
  try {
    adminAuth = getAdminAuth();
    adminDb = getAdminDb();
  } catch (err) {
    console.error("Admin SDK init failed", err);
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid or expired session. Please sign in again." }, { status: 401 });
  }

  let playClient: JWT;
  try {
    playClient = getPlayClient();
  } catch (err) {
    console.error("Play client init failed", err);
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  let purchase: SubscriptionPurchaseV2;
  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
    const response = await playClient.request<SubscriptionPurchaseV2>({ url });
    purchase = response.data;
  } catch (err) {
    console.error("verify-purchase: Play API call failed", err);
    return NextResponse.json(
      { error: "Could not verify purchase with Google Play. Please try again." },
      { status: 502 }
    );
  }

  const lineItem = purchase.lineItems?.[0];
  if (!lineItem || lineItem.productId !== EXPECTED_PRODUCT_ID) {
    return NextResponse.json({ error: "Purchase does not match the expected product." }, { status: 400 });
  }

  // Belt-and-suspenders alongside the client's own acknowledgePurchase() call —
  // Google auto-refunds and revokes any subscription left unacknowledged for
  // 3 days, so this closes the gap if the client-side ack never lands (e.g.
  // the app was killed right after purchase).
  if (purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    try {
      const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${EXPECTED_PRODUCT_ID}/tokens/${purchaseToken}:acknowledge`;
      await playClient.request({ url: ackUrl, method: "POST", data: {} });
    } catch (err) {
      // Non-fatal — the client's own acknowledgePurchase() is the primary
      // path; this is only a backstop, so a failure here shouldn't block
      // the entitlement write below.
      console.error("verify-purchase: server-side acknowledge failed", err);
    }
  }

  const entitled = isEntitled(purchase.subscriptionState);

  try {
    await adminDb.collection("users").doc(uid).set(
      {
        plan: entitled ? "premium" : "free",
        subscriptionStatus: purchase.subscriptionState,
        purchaseToken,
        expiryAt: Timestamp.fromDate(new Date(lineItem.expiryTime)),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("verify-purchase: Firestore write failed", err);
    return NextResponse.json({ error: "Couldn't save your subscription. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan: entitled ? "premium" : "free" });
}
