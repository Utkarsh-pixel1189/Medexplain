"use client";

import { useState } from "react";
import { api, ApiError, QASource } from "@/lib/api";

type Message = { question: string; answer?: string; sources?: QASource[]; error?: string };

export default function ChatThread({
  reportId,
  threadId,
  messages,
  disabled,
  onNewMessage,
  onNewChat,
}: {
  reportId: string;
  threadId: string | null;
  messages: Message[];
  disabled: boolean;
  onNewMessage: (threadId: string, message: Message) => void;
  onNewChat: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    setPending({ question: q });
    try {
      const response = await api.ask(reportId, q, threadId || undefined);
      onNewMessage(response.thread_id, { question: q, answer: response.answer, sources: response.sources });
      setPending(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setPending({ question: q, error: message });
    } finally {
      setLoading(false);
    }
  }

  const isNewChat = threadId === null;

  return (
    <div className="border border-mist rounded-2xl bg-paper h-full flex flex-col overflow-hidden">
      <div className="px-4 h-11 border-b border-mist flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-sage whitespace-nowrap overflow-hidden text-ellipsis">
          Ask about this report
        </span>
        <button
          onClick={onNewChat}
          disabled={disabled}
          className="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-sage text-paper hover:bg-sage-dark transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          + New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isNewChat && !pending && messages.length === 0 && (
          <p className="text-sm text-inkSoft">
            Ask things like &ldquo;what does my LDL result mean?&rdquo; or &ldquo;are any of my labs
            outside the normal range?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="space-y-1">
            <p className="text-sm font-medium text-ink">{m.question}</p>
            {m.answer && (
              <div className="text-sm text-inkSoft bg-sage-light/40 rounded-xl p-3 space-y-2">
                <p className="whitespace-pre-line">{m.answer}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="text-xs text-inkSoft/80 space-y-1 mt-2 font-mono">
                    <p className="font-medium text-sage-dark">Sources</p>
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
            <p className="text-sm font-medium text-ink">{pending.question}</p>
            {pending.error ? (
              <p className="text-sm text-pulse">{pending.error}</p>
            ) : (
              <p className="text-sm text-inkSoft font-mono">Thinking…</p>
            )}
          </div>
        )}
        <p className="text-xs text-inkSoft/70 italic">
          This is not medical advice. Always confirm results with your physician.
        </p>
      </div>
      <form onSubmit={onSubmit} className="border-t border-mist p-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Waiting for report to finish processing…" : "Ask a question"}
          className="flex-1 border border-mist rounded-lg px-3 py-2 text-sm focus:border-sage focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-3 py-2 rounded-lg bg-sage text-paper text-sm hover:bg-sage-dark transition-colors disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}