"use client";

import { useEffect, useState } from "react";
import { api, ApiError, QAResponse, QAHistoryItem } from "@/lib/api";

type Turn = { id: string; question: string; response?: QAResponse; error?: string };

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function QAPanel({ reportId, disabled }: { reportId: string; disabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const history: QAHistoryItem[] = await api.getHistory(reportId);
        if (cancelled) return;
        const loadedTurns = history.map((h) => ({
          id: h.id,
          question: h.question,
          response: {
            answer: h.answer,
            sources: h.sources,
            disclaimer: "This is not medical advice. Always confirm results with your physician.",
          },
        }));
        setTurns(loadedTurns);
        if (loadedTurns.length > 0) setSelectedId(loadedTurns[loadedTurns.length - 1].id);
      } catch {
        // no history yet — fine to start blank
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    const tempId = `pending-${Date.now()}`;
    setQuestion("");
    setLoading(true);
    setTurns((prev) => [...prev, { id: tempId, question: q }]);
    setSelectedId(tempId);
    try {
      const response = await api.ask(reportId, q);
      setTurns((prev) => prev.map((t) => (t.id === tempId ? { ...t, response } : t)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setTurns((prev) => prev.map((t) => (t.id === tempId ? { ...t, error: message } : t)));
    } finally {
      setLoading(false);
    }
  }

  const selectedTurn = turns.find((t) => t.id === selectedId);
  const isAsking = selectedId === null;

  return (
    <div className="border rounded-lg bg-white flex h-full overflow-hidden">
      {/* Sidebar: question history */}
      <div className="w-40 sm:w-48 border-r flex flex-col shrink-0">
        <div className="px-3 py-3 border-b">
          <button
            onClick={() => setSelectedId(null)}
            disabled={disabled}
            className="w-full text-xs font-medium px-2 py-1.5 rounded bg-brand-600 text-white disabled:opacity-50"
          >
            + New question
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {historyLoaded && turns.length === 0 && (
            <p className="text-xs text-gray-400 px-1">No history yet</p>
          )}
          {turns.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left text-xs px-2 py-2 rounded truncate ${
                selectedId === t.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
              title={t.question}
            >
              {truncate(t.question, 40)}
            </button>
          ))}
        </div>
      </div>

      {/* Main panel: selected Q&A or the new-question form */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b font-medium text-sm">Ask about this report</div>
        <div className="flex-1 overflow-y-auto p-4 max-h-96">
          {isAsking && (
            <p className="text-sm text-gray-500">
              Ask things like &ldquo;what does my LDL result mean?&rdquo; or &ldquo;are any of my labs
              outside the normal range?&rdquo;
            </p>
          )}
          {selectedTurn && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedTurn.question}</p>
              {selectedTurn.error && <p className="text-sm text-red-600">{selectedTurn.error}</p>}
              {selectedTurn.response && (
                <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 space-y-2">
                  <p className="whitespace-pre-line">{selectedTurn.response.answer}</p>
                  {selectedTurn.response.sources.length > 0 && (
                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      <p className="font-medium text-gray-600">Sources</p>
                      {selectedTurn.response.sources.map((s, j) => (
                        <p key={j}>
                          [source {j + 1}] (p.{s.page ?? "?"}): {s.snippet}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 italic">{selectedTurn.response.disclaimer}</p>
                </div>
              )}
              {!selectedTurn.response && !selectedTurn.error && (
                <p className="text-sm text-gray-400">Thinking…</p>
              )}
            </div>
          )}
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
    </div>
  );
}
