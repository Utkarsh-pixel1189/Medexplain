import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medexplain",
  description: "Understand your medical reports, safely.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold text-brand-700">Medexplain</a>
            <nav className="text-sm text-gray-600 flex gap-4">
              <a href="/dashboard">Dashboard</a>
              <a href="/login">Login</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
