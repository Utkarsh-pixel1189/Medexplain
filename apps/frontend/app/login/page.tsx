"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import Marker from "@/components/Marker";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await api.login(email, password);
      } else {
        await api.register(firstName, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="font-display font-bold text-3xl text-center text-ink">
        {mode === "login" ? (
          <>Welcome <Marker>back</Marker></>
        ) : (
          <>Let&rsquo;s get <Marker>started</Marker></>
        )}
      </h1>

      <div className="border-2 border-ink rounded-3xl p-8 bg-paper">
        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-inkSoft mb-1.5">First name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border-2 border-mist rounded-xl px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-inkSoft mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-mist rounded-xl px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-inkSoft mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-mist rounded-xl pl-4 pr-12 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-inkSoft hover:text-ink transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.24A9.6 9.6 0 0112 4c5 0 9 4 9.9 8-.3 1.15-.86 2.24-1.62 3.2M6.1 6.1C3.9 7.5 2.3 9.6 2.1 12c.9 4 4.9 8 9.9 8 1.5 0 2.9-.35 4.15-.96" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2.1 12S6 4 12 4s9.9 8 9.9 8-3.9 8-9.9 8-9.9-8-9.9-8z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            {mode === "register" && (
              <ul className="mt-1.5 space-y-0.5">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.label} className={`text-xs flex items-center gap-1.5 ${met ? "text-sage" : "text-inkSoft/60"}`}>
                      <span>{met ? "✓" : "•"}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {error && <p className="text-sm text-pulse">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-paper rounded-full py-3.5 text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-5 text-sm text-accent hover:underline w-full text-center"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}