import { siteConfig } from "@/lib/siteConfig";

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">
        {number}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-neutral">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral">
        Last updated: {siteConfig.lastUpdated}
      </p>

      <Section number={1} title="Overview">
        <p>
          {siteConfig.appName} is a personal budgeting app for Android. It turns
          your salary, rent, EMIs and bills into one number: what&apos;s safe to
          spend today. This page explains what data the app collects, why, and
          how you can have it deleted.
        </p>
      </Section>

      <Section number={2} title="Information We Collect">
        <p>
          <strong>Account information.</strong> When you sign in with Google, we
          receive your email address and display name.
        </p>
        <p>
          <strong>Financial information you enter.</strong> Salary/income, fixed
          expenses (rent, EMIs, bills, and any due dates you set), daily expenses
          (items and amounts), and savings goals (name, target amount, target
          date, progress).
        </p>
        <p>
          <strong>Bank statements.</strong> If you import a bank statement PDF,
          it&apos;s parsed entirely on your device. The raw file and individual
          transaction lines never leave your phone — only an aggregated summary
          (total debits/credits and top merchant names) may be sent to our AI
          provider to generate a report.
        </p>
        <p>
          <strong>Device information.</strong> A push-notification token, once
          notification features are enabled, so we can deliver a notification to
          your device.
        </p>
      </Section>

      <Section number={3} title="How We Use Your Information">
        <p>
          To calculate what&apos;s safe to spend today, generate the weekly and
          month-end AI reports, keep your budget in sync across devices, and let
          you sign back in after reinstalling. We don&apos;t sell your data, and
          we don&apos;t run advertising or third-party analytics in the app.
        </p>
      </Section>

      <Section number={4} title="Data Retention & Deletion">
        <p>
          Your data is kept for as long as your account exists. You can delete
          your account and everything tied to it at any time, either from
          inside the app or from{" "}
          <a className="text-brand underline" href="/delete-account">
            this website
          </a>
          . Deletion removes your Firebase Authentication account and your
          entire Firestore data — immediately and permanently, with no recovery
          window.
        </p>
      </Section>

      <Section number={5} title="Third-Party Services">
        <p>
          <strong>Firebase</strong> (Authentication and Cloud Firestore) stores
          your account and financial data on Google Cloud infrastructure, over
          encrypted (HTTPS) connections. Firestore security rules restrict every
          document to the signed-in account that owns it.
        </p>
        <p>
          <strong>Groq</strong> generates the AI budget reports. It receives the
          aggregated financial summary text needed to write a report — never
          your raw bank statement, password, or full transaction history.
        </p>
        <p>
          We don&apos;t share your information with data brokers or use it for
          advertising.
        </p>
      </Section>

      <Section number={6} title="Data Security">
        <p>
          All data in transit is encrypted over HTTPS. Firestore security rules
          mean only your signed-in account can read or write your data —
          including us, outside of the deletion process described above, which
          runs as a trusted server operation.
        </p>
      </Section>

      <Section number={7} title="Your Choices">
        <p>
          You choose what to enter into the app — nothing is collected passively
          beyond your account email and display name. You can delete your
          account and data at any time (Section 4), and notifications can be
          turned off in your device settings.
        </p>
      </Section>

      <Section number={8} title="Children's Privacy">
        <p>
          {siteConfig.appName} is not directed at children and we don&apos;t
          knowingly collect information from children under 13.
        </p>
      </Section>

      <Section number={9} title="Changes to This Policy">
        <p>
          If this policy changes materially, we&apos;ll update the date above
          and, where required, notify you in the app.
        </p>
      </Section>

      <Section number={10} title="Contact">
        <p>
          Questions about this policy or your data:{" "}
          <a className="text-brand underline" href={`mailto:${siteConfig.contactEmail}`}>
            {siteConfig.contactEmail}
          </a>
        </p>
      </Section>
    </div>
  );
}
