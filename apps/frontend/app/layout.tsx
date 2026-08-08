import "../styles/globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Medexplain",
  description: "Understand your medical reports, safely.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">{children}</main>
        <footer className="border-t-2 border-ink/10 mt-16">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <p className="inline-block text-sm font-medium text-ink bg-highlight/40 px-4 py-2 rounded-full">
              Medexplain is not medical advice. Always confirm results with a physician.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}