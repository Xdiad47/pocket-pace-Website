import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${siteConfig.appName} — know what's safe to spend today`,
  description:
    "Pocket Pace turns salary minus rent, EMIs and bills into one honest number: what's safe to spend today.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-card-border">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold text-brand">
              {siteConfig.appName}
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/delete-account">Delete account</Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-card-border">
          <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-neutral">
            © {new Date().getFullYear()} {siteConfig.appName}. {siteConfig.packageId}
          </div>
        </footer>
      </body>
    </html>
  );
}
