"use client";

export type Thread = {
  threadId: string;
  label: string;
  messages: { question: string; answer?: string }[];
};

export default function HistorySidebar({
  threads,
  selectedThreadId,
  onSelect,
  onNewChat,
  collapsed,
  onToggleCollapse,
  disabled,
}: {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  disabled: boolean;
}) {
  if (collapsed) {
    return (
      <div className="hidden lg:flex flex-col items-center gap-3 border-r-2 border-ink/10 bg-paper py-4 px-2 w-14 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-full hover:bg-sage-light transition-colors text-ink"
          aria-label="Expand history"
          title="Expand history"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onNewChat}
          disabled={disabled}
          className="p-2 rounded-full bg-accent text-paper hover:bg-accent-dark transition-colors disabled:opacity-50"
          aria-label="New chat"
          title="New chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col border-r-2 border-ink/10 bg-paper w-64 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink/10">
        <span className="font-mono text-xs uppercase tracking-widest text-sage">History</span>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-full hover:bg-sage-light transition-colors text-ink"
          aria-label="Collapse history"
          title="Collapse history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <button
          onClick={onNewChat}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2.5 rounded-full bg-accent text-paper hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {threads.length === 0 && (
          <p className="text-xs text-inkSoft font-mono px-2 py-4 text-center">No history yet</p>
        )}
        {threads.map((t) => (
          <button
            key={t.threadId}
            onClick={() => onSelect(t.threadId)}
            className={`w-full text-left text-sm px-3 py-2.5 rounded-xl truncate transition-colors ${
              selectedThreadId === t.threadId ? "bg-sage-light text-sage-dark font-medium" : "text-ink hover:bg-sage-light/30"
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