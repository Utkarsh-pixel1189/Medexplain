"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, User } from "@/lib/api";
export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  }

  async function handleSwitchAccount() {
    await api.logout();
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <header className="border-b-2 border-ink/10 bg-paper sticky top-0 z-20">
      <div className="w-full px-4 sm:px-8 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <Image src="/logo-mark.png" alt="" width={80} height={88} className="shrink-0 h-14 w-auto" priority />
          <span className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-ink truncate">Medexplain</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex text-sm font-medium text-ink items-center gap-8 shrink-0">
          <a href="/dashboard" className="hover:text-sage transition-colors">Dashboard</a>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap">Hi, {user.first_name || user.email}</span>
              <button
                onClick={handleSwitchAccount}
                className="text-xs text-accent hover:underline whitespace-nowrap"
              >
                Switch account
              </button>
              <button
                onClick={handleLogout}
                className="text-xs px-4 py-2 rounded-full border-2 border-ink hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
              >
                Log out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="px-5 py-2.5 rounded-full bg-accent text-paper text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              Log in
            </a>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden shrink-0 p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t-2 border-ink/10 px-4 py-4 space-y-3 bg-paper">
          <a
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="block text-sm font-medium text-ink py-2"
          >
            Dashboard
          </a>
          {user ? (
            <>
              <p className="text-sm text-inkSoft truncate">Signed in as {user.first_name || user.email}</p>
              <button
                onClick={handleLogout}
                className="w-full text-sm px-4 py-2.5 rounded-full border-2 border-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Log out
              </button>
              <button
                onClick={handleSwitchAccount}
                className="w-full text-sm px-4 py-2.5 rounded-full text-accent hover:underline"
              >
                Log in with another account
              </button>
            </>
          ) : (
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block w-full text-center px-5 py-2.5 rounded-full bg-accent text-paper text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              Log in
            </a>
          )}
        </div>
      )}
    </header>
  );
}