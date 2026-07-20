"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import PulseLine from "@/components/PulseLine";

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
    <header className="border-b border-mist bg-paper/90 backdrop-blur sticky top-0 z-10">
      <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <PulseLine className="w-8 h-5 text-sage" />
          <span className="font-display text-lg tracking-tight text-ink">Medexplain</span>
        </a>
        <nav className="text-sm font-medium text-inkSoft flex items-center gap-6 shrink-0">
          <a href="/dashboard" className="hover:text-ink transition-colors">Dashboard</a>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-ink whitespace-nowrap">Hi, {user.first_name || user.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-full border border-mist hover:border-sage transition-colors whitespace-nowrap"
              >
                Log out
              </button>
            </div>
          ) : (
            <a href="/login" className="hover:text-ink transition-colors">Log in</a>
          )}
        </nav>
      </div>
    </header>
  );
}