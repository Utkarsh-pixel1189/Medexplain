"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, User } from "@/lib/api";
import { useTheme, THEMES, ThemeName } from "@/components/ThemeProvider";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setOptionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const OptionsPanel = () => (
    <div className="p-3 space-y-1">
      <p className="text-xs font-semibold text-inkSoft px-1 pb-1">Accent color</p>
      <div className="flex gap-2 px-1">
        {(Object.keys(THEMES) as ThemeName[]).map((key) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            aria-label={THEMES[key].label}
            title={THEMES[key].label}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              theme === key ? "border-ink scale-110" : "border-ink/20 hover:scale-105"
            }`}
            style={{ backgroundColor: THEMES[key].swatch }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <header className="border-b-2 border-ink/10 bg-paper sticky top-0 z-20">
      <div className="w-full px-4 sm:px-8 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <Image src="/logo-mark.png" alt="" width={80} height={88} className="shrink-0 h-8 sm:h-9 w-auto" priority />
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-ink truncate">Medexplain</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex text-sm font-medium text-ink items-center gap-6 shrink-0">
          <a href="/dashboard" className="hover:text-sage transition-colors">Dashboard</a>

          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setOptionsOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-sage-light transition-colors text-ink"
              aria-label="Options"
              title="Options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {optionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 border-2 border-ink/15 rounded-2xl bg-paper shadow-lg">
                <OptionsPanel />
              </div>
            )}
          </div>

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
          <div className="border-t border-ink/10 pt-3">
            <OptionsPanel />
          </div>
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