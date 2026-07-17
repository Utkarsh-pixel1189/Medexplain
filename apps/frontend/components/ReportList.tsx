"use client";

import { Report } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-mist/60 text-inkSoft",
  scanning: "bg-amber-100 text-amber-800",
  parsing: "bg-amber-100 text-amber-800",
  parsed: "bg-sage-light text-sage-dark",
  failed: "bg-pulse/10 text-pulse",
};

export default function ReportList({
  reports,
  onDelete,
}: {
  reports: Report[];
  onDelete: (id: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="border border-dashed border-mist rounded-2xl p-8 text-center text-sm text-inkSoft font-mono">
        No reports yet — upload one above to get started.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {reports.map((r) => (
        <li key={r.id} className="rounded-xl border border-mist bg-paper overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <a href={`/report/${r.id}`} className="text-sm font-medium text-ink truncate hover:text-sage transition-colors min-w-0 flex-1">
              {r.original_filename}
            </a>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[r.status] || "bg-mist/60 text-inkSoft"}`}>
                {r.status}
              </span>
              <button
                onClick={() => onDelete(r.id)}
                aria-label="Delete report"
                title="Delete report"
                className="p-1.5 rounded-lg text-inkSoft/60 hover:text-pulse hover:bg-pulse/10 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M9 7V4h6v3m-8 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
