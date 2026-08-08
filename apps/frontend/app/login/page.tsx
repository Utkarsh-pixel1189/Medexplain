"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import Marker from "@/components/Marker";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="max-w-md mx-auto space-y-8">
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
                className="w-full border-2 border-mist rounded-xl px-4 py-2.5 text-sm focus:border-sage focus:outline-none"
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
              className="w-full border-2 border-mist rounded-xl px-4 py-2.5 text-sm focus:border-sage focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-inkSoft mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-mist rounded-xl px-4 py-2.5 text-sm focus:border-sage focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-pulse">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-paper rounded-full py-3.5 text-sm font-semibold hover:bg-sage-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-5 text-sm text-sage hover:underline w-full text-center"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}