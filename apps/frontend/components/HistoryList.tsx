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
  onNewChat,
  disabled,
}: {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  disabled: boolean;
}) {
  return (
    <div className="border border-mist rounded-2xl bg-paper h-full flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-mist">
        <button
          onClick={onNewChat}
          disabled={disabled}
          className="w-full text-xs font-medium px-2 py-1.5 rounded-lg bg-sage text-paper hover:bg-sage-dark transition-colors disabled:opacity-50"
        >
          + New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 && <p className="text-xs text-inkSoft font-mono px-1">No history yet</p>}
        {threads.map((t) => (
          <button
            key={t.threadId}
            onClick={() => onSelect(t.threadId)}
            className={`w-full text-left text-xs px-2 py-2 rounded-lg truncate transition-colors ${
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