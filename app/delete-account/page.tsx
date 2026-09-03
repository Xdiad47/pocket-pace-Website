"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { siteConfig } from "@/lib/siteConfig";

type Status = "checking" | "signedOut" | "signedIn" | "deleting" | "done";

export default function DeleteAccountPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Google sign-in auto-creates an account on first use, so a visitor who
  // never had a Pocket Pace account still "signs in" successfully — this
  // gates the confirm-delete UI while we check for and clean up that case.
  const [checkingGoogleAccount, setCheckingGoogleAccount] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStatus(u ? "signedIn" : "signedOut");
    });
  }, []);

  async function handleGoogleSignIn() {
    setError(null);
    setCheckingGoogleAccount(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      if (getAdditionalUserInfo(result)?.isNewUser) {
        // Nothing existed before this click — delete the empty shell
        // Firebase just created rather than leave it behind, and say so.
        const idToken = await result.user.getIdToken();
        await fetch("/api/delete-account", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        }).catch(() => {});
        await signOut(auth);
        setError("No Pocket Pace account found for that Google account — nothing to delete.");
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setCheckingGoogleAccount(false);
    }
  }

  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError(
        "Couldn't sign in — check your email and password. If you've never " +
          "created a Pocket Pace account, there's nothing here to delete."
      );
    }
  }

  async function handleDelete() {
    if (!user) return;
    setError(null);
    setStatus("deleting");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Deletion failed.");
      }
      await signOut(auth);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed. Please try again.");
      setStatus("signedIn");
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Delete your account</h1>
      <p className="mt-2 text-neutral">
        This permanently deletes your Pocket Pace account and all data associated with
        it — income, expenses, goals, and AI reports. This cannot be undone.
      </p>
      <p className="mt-4 rounded-lg border border-card-border bg-card p-4 text-sm text-neutral">
        Have a Pocket Pace account and want it gone? Sign in below to confirm.{" "}
        {siteConfig.playStoreUrl ? (
          <>
            Don&apos;t have the app yet?{" "}
            <a className="text-brand underline" href={siteConfig.playStoreUrl}>
              Get it on Google Play
            </a>
            .
          </>
        ) : (
          "If you've never created a Pocket Pace account, there's nothing here to delete."
        )}
      </p>

      {status === "checking" && (
        <p className="mt-8 text-sm text-neutral">Checking sign-in status…</p>
      )}

      {checkingGoogleAccount && (
        <p className="mt-8 text-sm text-neutral">Checking your account…</p>
      )}

      {status === "signedOut" && !checkingGoogleAccount && (
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-brand-contrast"
          >
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 text-sm text-neutral">
            <div className="h-px flex-1 bg-card-border" />
            or
            <div className="h-px flex-1 bg-card-border" />
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-4 py-3"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-4 py-3"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-brand px-4 py-3 font-medium text-brand"
            >
              Sign in with email
            </button>
          </form>
        </div>
      )}

      {(status === "signedIn" || status === "deleting") && user && !checkingGoogleAccount && (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-card-border bg-card p-4 text-sm">
            Signed in as <span className="font-medium">{user.email}</span>.{" "}
            <button onClick={() => signOut(auth)} className="text-brand underline">
              Not you?
            </button>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            I understand this permanently deletes my account and all data, and
            cannot be undone.
          </label>

          <button
            onClick={handleDelete}
            disabled={!confirmed || status === "deleting"}
            className="w-full rounded-lg bg-danger px-4 py-3 font-medium text-white disabled:opacity-40"
          >
            {status === "deleting" ? "Deleting…" : "Permanently delete my account"}
          </button>
        </div>
      )}

      {status === "done" && (
        <p className="mt-8 rounded-lg border border-card-border bg-card p-4">
          Your account and data have been deleted.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
