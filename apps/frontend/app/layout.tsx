import "../styles/globals.css";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import PulseLine from "@/components/PulseLine";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Medexplain",
  description: "Understand your medical reports, safely.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-mist bg-paper/90 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <PulseLine className="w-8 h-5 text-sage" />
              <span className="font-display text-lg tracking-tight text-ink">Medexplain</span>
            </a>
            <nav className="text-sm font-medium text-inkSoft flex gap-6">
              <a href="/dashboard" className="hover:text-ink transition-colors">Dashboard</a>
              <a href="/login" className="hover:text-ink transition-colors">Log in</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">{children}</main>
        <footer className="border-t border-mist mt-16">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs font-mono text-inkSoft/70">
            Medexplain is not medical advice. Always confirm results with a physician.
          </div>
        </footer>
      </body>
    </html>
  );
}
