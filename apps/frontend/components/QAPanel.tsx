"use client";

import { useEffect, useState } from "react";
import { api, ApiError, QASource, QAHistoryItem } from "@/lib/api";

type Message = { question: string; answer?: string; sources?: QASource[]; error?: string };
type Thread = { threadId: string; label: string; messages: Message[] };

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function QAPanel({ reportId, disabled }: { reportId: string; disabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null); // null = new chat
  const [pending, setPending] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const items: QAHistoryItem[] = await api.getHistory(reportId);
        if (cancelled) return;

        const byThread = new Map<string, Thread>();
        for (const item of items) {
          let thread = byThread.get(item.thread_id);
          if (!thread) {
            thread = { threadId: item.thread_id, label: truncate(item.question, 40), messages: [] };
            byThread.set(item.thread_id, thread);
          }
          thread.messages.push({ question: item.question, answer: item.answer, sources: item.sources });
        }
        setThreads(Array.from(byThread.values()));
        // Default view on load is always "new chat" — not the last thread.
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
    setQuestion("");
    setLoading(true);
    setPending({ question: q });

    try {
      const response = await api.ask(reportId, q, selectedThreadId || undefined);
      const newMessage: Message = { question: q, answer: response.answer, sources: response.sources };

      setThreads((prev) => {
        const existing = prev.find((t) => t.threadId === response.thread_id);
        if (existing) {
          return prev.map((t) =>
            t.threadId === response.thread_id ? { ...t, messages: [...t.messages, newMessage] } : t
          );
        }
        return [...prev, { threadId: response.thread_id, label: truncate(q, 40), messages: [newMessage] }];
      });
      setSelectedThreadId(response.thread_id);
      setPending(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setPending({ question: q, error: message });
    } finally {
      setLoading(false);
    }
  }

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId);
  const isNewChat = selectedThreadId === null;

  return (
    <div className="border rounded-lg bg-white flex h-full overflow-hidden">
      {/* Sidebar: chat threads */}
      <div className="w-40 sm:w-48 border-r flex flex-col shrink-0">
        <div className="px-3 py-3 border-b">
          <button
            onClick={() => {
              setSelectedThreadId(null);
              setPending(null);
            }}
            disabled={disabled}
            className="w-full text-xs font-medium px-2 py-1.5 rounded bg-brand-600 text-white disabled:opacity-50"
          >
            + New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {historyLoaded && threads.length === 0 && (
            <p className="text-xs text-gray-400 px-1">No history yet</p>
          )}
          {threads.map((t) => (
            <button
              key={t.threadId}
              onClick={() => {
                setSelectedThreadId(t.threadId);
                setPending(null);
              }}
              className={`w-full text-left text-xs px-2 py-2 rounded truncate ${
                selectedThreadId === t.threadId ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
              title={t.label}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main panel: selected thread conversation, or a blank new-chat view */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b font-medium text-sm">Ask about this report</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          {isNewChat && !pending && (
            <p className="text-sm text-gray-500">
              Ask things like &ldquo;what does my LDL result mean?&rdquo; or &ldquo;are any of my labs
              outside the normal range?&rdquo;
            </p>
          )}
          {selectedThread?.messages.map((m, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm font-medium">{m.question}</p>
              {m.answer && (
                <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 space-y-2">
                  <p className="whitespace-pre-line">{m.answer}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      <p className="font-medium text-gray-600">Sources</p>
                      {m.sources.map((s, j) => (
                        <p key={j}>
                          [source {j + 1}] (p.{s.page ?? "?"}): {s.snippet}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{pending.question}</p>
              {pending.error ? (
                <p className="text-sm text-red-600">{pending.error}</p>
              ) : (
                <p className="text-sm text-gray-400">Thinking…</p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 italic">
            This is not medical advice. Always confirm results with your physician.
          </p>
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
