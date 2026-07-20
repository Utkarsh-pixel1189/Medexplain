"use client";

export type Thread = {
  threadId: string;
  label: string;
  messages: { question: string; answer?: string }[];
};

export default function HistoryList({
  threads,
  selectedThreadId,
  onSelect,
  disabled,
}: {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="border border-mist rounded-2xl bg-paper flex flex-col overflow-hidden max-h-48">
      <div className="px-3 py-2 border-b border-mist font-mono text-xs uppercase tracking-widest text-sage">
        History
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 && <p className="text-xs text-inkSoft font-mono px-1">No history yet</p>}
        {threads.map((t) => (
          <button
            key={t.threadId}
            onClick={() => onSelect(t.threadId)}
            disabled={disabled}
            className={`w-full text-left text-xs px-2 py-2 rounded-lg truncate transition-colors disabled:opacity-50 ${
              selectedThreadId === t.threadId ? "bg-sage-light text-sage-dark font-medium" : "text-inkSoft hover:bg-sage-light/30"
            }`}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}