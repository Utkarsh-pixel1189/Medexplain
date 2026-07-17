"use client";

import { useEffect, useState } from "react";
import { api, Report, Entity } from "@/lib/api";
import LabChart from "@/components/LabChart";
import SummaryCard from "@/components/SummaryCard";
import QAPanel from "@/components/QAPanel";

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-mist/60 text-inkSoft",
  scanning: "bg-amber-100 text-amber-800",
  parsing: "bg-amber-100 text-amber-800",
  parsed: "bg-sage-light text-sage-dark",
  failed: "bg-pulse/10 text-pulse",
};

export default function ReportViewerPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await api.getReport(params.id);
        if (cancelled) return;
        setReport(r);

        if (r.status === "parsed") {
          const [ents, pdf] = await Promise.all([
            api.getEntities(params.id),
            api.getPdfUrl(params.id),
          ]);
          if (cancelled) return;
          setEntities(ents);
          setPdfUrl(pdf.url);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load report");
      }
    }

    load();
    const interval = setInterval(() => {
      if (report?.status !== "parsed" && report?.status !== "failed") load();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, report?.status]);

  if (error) return <p className="text-sm text-pulse">{error}</p>;
  if (!report) return <p className="text-sm text-inkSoft font-mono">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-xl text-ink">{report.original_filename}</h1>
        <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[report.status] || "bg-mist/60 text-inkSoft"}`}>
          {report.status}
        </span>
      </div>

      {report.status !== "parsed" && report.status !== "failed" && (
        <p className="text-sm text-inkSoft font-mono">
          Your report is still being processed — this page will update automatically.
        </p>
      )}

      {report.status === "failed" && (
        <p className="text-sm text-pulse">
          Something went wrong while processing this report. Try re-uploading it.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {report.ai_summary && <SummaryCard summary={report.ai_summary} />}
          {pdfUrl && (
            <div className="border border-mist rounded-2xl overflow-hidden bg-paper">
              <iframe src={pdfUrl} className="w-full h-96" title="Original report PDF" />
            </div>
          )}
          {entities.length > 0 && (
            <div className="border border-mist rounded-2xl bg-paper p-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-sage mb-3">Lab trends</h2>
              <LabChart entities={entities} />
            </div>
          )}
        </div>
        <div className="h-[32rem]">
          <QAPanel reportId={report.id} disabled={report.status !== "parsed"} />
        </div>
      </div>
    </div>
  );
}