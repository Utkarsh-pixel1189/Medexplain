"use client";

import { useState } from "react";
import { api, ApiError, QAResponse } from "@/lib/api";

type Turn = { question: string; response?: QAResponse; error?: string };

export default function QAPanel({ reportId, disabled }: { reportId: string; disabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    setTurns((prev) => [...prev, { question: q }]);
    try {
      const response = await api.ask(reportId, q);
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, response } : t)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, error: message } : t)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b font-medium text-sm">Ask about this report</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {turns.length === 0 && (
          <p className="text-sm text-gray-500">
            Ask things like &ldquo;what does my LDL result mean?&rdquo; or &ldquo;are any of my labs
            outside the normal range?&rdquo;
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-1">
            <p className="text-sm font-medium">{t.question}</p>
            {t.error && <p className="text-sm text-red-600">{t.error}</p>}
            {t.response && (
              <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 space-y-2">
                <p className="whitespace-pre-line">{t.response.answer}</p>
                {t.response.sources.length > 0 && (
                  <div className="text-xs text-gray-500 space-y-1 mt-2">
                    <p className="font-medium text-gray-600">Sources</p>
                    {t.response.sources.map((s, j) => (
                      <p key={j}>
                        [source {j + 1}] (p.{s.page ?? "?"}): {s.snippet}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 italic">{t.response.disclaimer}</p>
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Thinking…</p>}
      </div>
      <form onSubmit={onSubmit} className="border-t p-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Waiting for report to finish processing…" : "Ask a question"}
          className="flex-1 border rounded px-3 py-2 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-3 py-2 rounded bg-brand-600 text-white text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
