"use client";

import { useEffect, useState } from "react";
import { api, Report, Entity } from "@/lib/api";
import LabChart from "@/components/LabChart";
import QAPanel from "@/components/QAPanel";

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

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!report) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{report.original_filename}</h1>
        <p className="text-sm text-gray-500">Status: {report.status}</p>
      </div>

      {report.status !== "parsed" && (
        <p className="text-sm text-gray-500">
          Your report is still being processed — this page will update automatically.
        </p>
      )}

      {report.status === "failed" && (
        <p className="text-sm text-red-600">
          Something went wrong while processing this report. Try re-uploading it.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {pdfUrl && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe src={pdfUrl} className="w-full h-96" title="Original report PDF" />
            </div>
          )}
          {entities.length > 0 && (
            <div className="border rounded-lg bg-white p-4">
              <h2 className="text-sm font-medium mb-3">Lab trends</h2>
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
