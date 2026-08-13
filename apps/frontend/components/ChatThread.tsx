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
}: {
  reportId: string;
  threadId: string | null;
  messages: Message[];
  disabled: boolean;
  onNewMessage: (threadId: string, message: Message) => void;
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isNewChat && !pending && messages.length === 0 && (
          <p className="text-sm text-inkSoft">
            Ask things like &ldquo;what does my LDL result mean?&rdquo; or &ldquo;are any of my labs
            outside the normal range?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-end">
              <p className="max-w-[80%] bg-accent text-paper text-sm rounded-2xl rounded-tr-sm px-4 py-2.5">
                {m.question}
              </p>
            </div>
            {m.answer && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-sage-light text-ink text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 space-y-2">
                  <p className="whitespace-pre-line">{m.answer}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="text-xs text-inkSoft space-y-1 pt-1 border-t border-ink/10">
                      <p className="font-bold text-sage-dark pt-1">Sources</p>
                      {m.sources.map((s, j) => (
                        <p key={j}>
                          [source {j + 1}] (p.{s.page ?? "?"}): {s.snippet}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {pending && (
          <div className="space-y-1.5">
            <div className="flex justify-end">
              <p className="max-w-[80%] bg-accent text-paper text-sm rounded-2xl rounded-tr-sm px-4 py-2.5">
                {pending.question}
              </p>
            </div>
            <div className="flex justify-start">
              {pending.error ? (
                <p className="text-sm text-pulse">{pending.error}</p>
              ) : (
                <p className="text-sm text-inkSoft px-1">Thinking…</p>
              )}
            </div>
          </div>
        )}
        <p className="text-xs text-inkSoft italic pt-2">
          This is not medical advice. Always confirm results with your physician.
        </p>
      </div>
      <form onSubmit={onSubmit} className="border-t-2 border-ink/10 p-3 flex gap-2 shrink-0">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Waiting for report to finish processing…" : "Ask a question"}
          className="flex-1 border-2 border-mist rounded-full px-4 py-2.5 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="px-5 py-2.5 rounded-full bg-accent text-paper text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 shrink-0"
        >
          Ask
        </button>
      </form>
    </div>
  );
}