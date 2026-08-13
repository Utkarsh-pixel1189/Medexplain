"use client";

const TABS = [
  { id: "document", label: "Document" },
  { id: "report", label: "Summary" },
  { id: "chat", label: "Chat" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export default function ReportTabs({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex gap-1 border-b-2 border-ink/10 px-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
            active === tab.id ? "text-accent" : "text-inkSoft hover:text-ink"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-accent rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}