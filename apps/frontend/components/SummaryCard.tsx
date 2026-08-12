"use client";

import { useState } from "react";
import { AISummary } from "@/lib/api";

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  normal: { dot: "bg-sage", label: "Normal", text: "text-sage-dark" },
  low: { dot: "bg-amber-500", label: "Low", text: "text-amber-700" },
  high: { dot: "bg-pulse", label: "High", text: "text-pulse" },
  unclear: { dot: "bg-mist", label: "Unclear", text: "text-inkSoft" },
};

function InsightRow({ name, value, unit, status }: { name: string; value: string | null; unit: string | null; status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.unclear;
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{name}</p>
          {value && <p className="text-xs text-ink">{value} {unit || ""}</p>}
        </div>
      </div>
      <span className={`text-xs font-bold shrink-0 ${style.text}`}>{style.label}</span>
    </div>
  );
}

export default function SummaryCard({ summary }: { summary: AISummary }) {
  const [showAll, setShowAll] = useState(false);

  const attention = summary.insights.filter((i) => i.status !== "normal");
  const normal = summary.insights.filter((i) => i.status === "normal");

  return (
    <div className="border-2 border-ink/15 rounded-2xl bg-paper p-5 space-y-5 shadow-sm">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-sage mb-2">Summary</h2>
        <p className="text-sm text-ink leading-relaxed">{summary.overview}</p>
      </div>

      {attention.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-inkSoft">Worth a second look</h3>
          <div className="divide-y divide-ink/10">
            {attention.map((i, idx) => (
              <InsightRow key={idx} name={i.name} value={i.value} unit={i.unit} status={i.status} />
            ))}
          </div>
        </div>
      ) : (
        summary.insights.length > 0 && (
          <p className="text-sm font-semibold text-sage-dark bg-sage-light/50 rounded-lg px-3 py-2">
            All extracted values fall within their stated normal ranges.
          </p>
        )
      )}

      {normal.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-bold text-accent hover:underline"
          >
            {showAll ? "Hide" : `Show ${normal.length} normal value${normal.length === 1 ? "" : "s"}`}
          </button>
          {showAll && (
            <div className="divide-y divide-ink/10 mt-2">
              {normal.map((i, idx) => (
                <InsightRow key={idx} name={i.name} value={i.value} unit={i.unit} status={i.status} />
              ))}
            </div>
          )}
        </div>
      )}

      {summary.suggestions.length > 0 && (
        <div className="bg-accent/10 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold text-accent">What you can do</h3>
          <ul className="space-y-1">
            {summary.suggestions.map((s, idx) => (
              <li key={idx} className="text-sm text-ink leading-relaxed">{s}</li>
            ))}
          </ul>
          <p className="text-xs text-inkSoft italic pt-1">
            General information only — always confirm with your physician.
          </p>
        </div>
      )}
    </div>
  );
}