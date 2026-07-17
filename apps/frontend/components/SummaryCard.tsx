import { AISummary } from "@/lib/api";

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  normal: { dot: "bg-sage", label: "Normal", text: "text-sage-dark" },
  low: { dot: "bg-amber-400", label: "Low", text: "text-amber-700" },
  high: { dot: "bg-pulse", label: "High", text: "text-pulse" },
  unclear: { dot: "bg-mist", label: "Unclear", text: "text-inkSoft" },
};

export default function SummaryCard({ summary }: { summary: AISummary }) {
  return (
    <div className="border border-mist rounded-2xl bg-paper p-5 space-y-5">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-sage mb-2">Summary</h2>
        <p className="text-sm text-ink leading-relaxed">{summary.overview}</p>
      </div>

      {summary.insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-inkSoft">Key insights</h3>
          <div className="divide-y divide-mist/60">
            {summary.insights.map((i, idx) => {
              const style = STATUS_STYLES[i.status] || STATUS_STYLES.unclear;
              return (
                <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{i.name}</p>
                      {i.value && (
                        <p className="text-xs font-mono text-inkSoft">
                          {i.value} {i.unit || ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${style.text}`}>{style.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary.suggestions.length > 0 && (
        <div className="bg-sage-light/40 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-sage-dark">What you can do</h3>
          <ul className="space-y-1">
            {summary.suggestions.map((s, idx) => (
              <li key={idx} className="text-sm text-inkSoft leading-relaxed">{s}</li>
            ))}
          </ul>
          <p className="text-xs text-inkSoft/70 italic pt-1">
            General information only — always confirm with your physician.
          </p>
        </div>
      )}
    </div>
  );
}