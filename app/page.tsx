import { siteConfig } from "@/lib/siteConfig";

const features = [
  {
    title: "One honest number",
    body: "Salary minus rent, EMIs and bills, re-paced every day — what's safe to spend today, not just what's left this month.",
  },
  {
    title: "Reports that read your spending",
    body: "Weekly AI breakdowns and a full month-end report, built from your own categories and merchants.",
  },
  {
    title: "Bank statements, understood",
    body: "Drop in a bank statement PDF and Pocket Pace pulls out merchants and spending patterns automatically — parsed entirely on your device.",
  },
  {
    title: "Your numbers, your account",
    body: "Sign in with Google or email and your budget follows you across devices. Works fully offline, too.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Know what you can{" "}
          <span className="text-brand">spend today</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral">
          {siteConfig.appName} turns salary minus rent, EMIs and bills into one
          honest number. Calm, precise budgeting — not a game.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {siteConfig.playStoreUrl ? (
            <a
              href={siteConfig.playStoreUrl}
              className="rounded-lg bg-brand px-6 py-3 font-medium text-brand-contrast"
            >
              Get it on Google Play
            </a>
          ) : (
            <span className="rounded-lg border border-card-border px-6 py-3 text-sm text-neutral">
              Coming soon to Google Play
            </span>
          )}
        </div>
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-card-border bg-card p-6"
          >
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-neutral">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
