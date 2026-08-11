"use client";

import { Report } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-mist/60 text-inkSoft",
  scanning: "bg-highlight/40 text-ink",
  parsing: "bg-highlight/40 text-ink",
  parsed: "bg-sage-light text-sage-dark",
  failed: "bg-pulse/10 text-pulse",
};

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReportList({
  reports,
  onDelete,
}: {
  reports: Report[];
  onDelete: (id: string) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/20 rounded-2xl p-10 text-center text-sm text-inkSoft">
        No reports yet — upload one above to get started.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {reports.map((r) => (
        <li key={r.id}>
          <div className="rounded-2xl border-2 border-ink/15 bg-paper shadow-sm px-4 py-4 sm:px-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-sage">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sage-light flex items-center justify-center text-sage shrink-0">
                <FileIcon />
              </div>
              <a href={`/report/${r.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{r.original_filename}</p>
                <p className="text-xs text-inkSoft mt-0.5">
                  {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </a>
              <button
                onClick={() => onDelete(r.id)}
                aria-label="Delete report"
                title="Delete report"
                className="p-2 rounded-full text-inkSoft/60 hover:text-pulse hover:bg-pulse/10 transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M9 7V4h6v3m-8 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-3 pl-12 sm:pl-14">
              <span className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${STATUS_STYLES[r.status] || "bg-mist/60 text-inkSoft"}`}>
                {r.status}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}