"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await api.logout();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="border-b-2 border-ink/10 bg-paper sticky top-0 z-10">
      <div className="w-full px-4 sm:px-8 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <svg width="30" height="30" viewBox="0 0 40 40" className="text-sage">
            <circle cx="20" cy="10" r="6" fill="currentColor" />
            <path d="M20 16 C 8 20, 8 34, 20 34 C 32 34, 32 20, 20 16 Z" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <span className="font-display font-bold text-xl tracking-tight text-ink">Medexplain</span>
        </a>
        <nav className="text-sm font-medium text-ink flex items-center gap-8 shrink-0">
          <a href="/dashboard" className="hover:text-sage transition-colors">Dashboard</a>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap">Hi, {user.first_name || user.email}</span>
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
              className="px-5 py-2.5 rounded-full bg-sage text-paper text-sm font-medium hover:bg-sage-dark transition-colors"
            >
              Log in
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}