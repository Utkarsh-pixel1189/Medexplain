"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import PulseLine from "@/components/PulseLine";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
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
        await api.register(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto grid sm:grid-cols-2 rounded-2xl overflow-hidden border border-mist">
      <div className="hidden sm:flex flex-col justify-between bg-sage text-paper p-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paper/70">Medexplain</p>
          <h2 className="font-display text-2xl mt-4 leading-snug">Your reports, in your own words.</h2>
        </div>
        <PulseLine className="w-full h-10 text-paper/60" />
      </div>
      <div className="bg-paper p-8">
        <h1 className="font-display text-xl text-ink mb-6">
          {mode === "login" ? "Log in" : "Create an account"}
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-inkSoft mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-mist rounded-lg px-3 py-2 text-sm focus:border-sage focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wide text-inkSoft mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-mist rounded-lg px-3 py-2 text-sm focus:border-sage focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-pulse">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-paper rounded-lg py-2.5 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 text-xs font-mono text-sage hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
