"use client";

import { useState } from "react";
import { api, Report } from "@/lib/api";

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

function stripPdfExtension(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}

export default function ReportList({
  reports,
  onDelete,
  onRenamed,
}: {
  reports: Report[];
  onDelete: (id: string) => void;
  onRenamed: () => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function startRename(r: Report) {
    setRenamingId(r.id);
    setNameDraft(stripPdfExtension(r.original_filename));
  }

  async function saveRename(id: string) {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.renameReport(id, `${stripPdfExtension(trimmed)}.pdf`);
      setRenamingId(null);
      onRenamed();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename report");
    } finally {
      setSaving(false);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/20 rounded-2xl p-10 text-center text-sm text-inkSoft">
        No reports yet — upload one above to get started.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 w-full">
      {reports.map((r) => (
        <li key={r.id} className="w-full min-w-0">
          <div className="w-full min-w-0 rounded-3xl border-2 border-ink/15 bg-paper shadow-sm px-4 py-4 sm:px-5 overflow-hidden">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 overflow-hidden">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sage-light flex items-center justify-center text-sage shrink-0">
                <FileIcon />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                {renamingId === r.id ? (
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(r.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full text-sm font-medium text-ink border-2 border-accent rounded-lg px-2 py-1 focus:outline-none"
                  />
                ) : (
                  <a href={`/report/${r.id}`} className="block transition-transform duration-150 active:scale-[0.97]">
                    <p className="text-sm font-medium text-ink truncate max-w-full">{stripPdfExtension(r.original_filename)}</p>
                    <p className="text-xs text-inkSoft mt-0.5">
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </a>
                )}
              </div>
              {renamingId === r.id ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => saveRename(r.id)}
                    disabled={saving}
                    className="p-2 rounded-full text-sage hover:bg-sage-light transition-colors disabled:opacity-50"
                    aria-label="Save name"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="p-2 rounded-full text-inkSoft hover:bg-mist/40 transition-colors"
                    aria-label="Cancel rename"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => startRename(r)}
                    aria-label="Rename report"
                    title="Rename report"
                    className="p-2 rounded-full text-inkSoft/60 hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    aria-label="Delete report"
                    title="Delete report"
                    className="p-2 rounded-full text-inkSoft/60 hover:text-pulse hover:bg-pulse/10 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 7h16M9 7V4h6v3m-8 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
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