import "../styles/globals.css";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";

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
        <Header />
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
