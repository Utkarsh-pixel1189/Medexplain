"use client";

import { useEffect, useState } from "react";
import { api, Report, Entity, QASource } from "@/lib/api";
import SummaryCard from "@/components/SummaryCard";
import LabChart from "@/components/LabChart";
import PdfPreview from "@/components/PdfPreview";
import HistoryList from "@/components/HistoryList";
import ChatThread from "@/components/ChatThread";

type Message = { question: string; answer?: string; sources?: QASource[] };
type Thread = { threadId: string; label: string; messages: Message[] };

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

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
  const [pages, setPages] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const r = await api.getReport(params.id);
        if (cancelled) return;
        setReport(r);

        if (r.status === "parsed") {
          const [ents, pageData, history] = await Promise.all([
            api.getEntities(params.id),
            api.getPages(params.id),
            api.getHistory(params.id),
          ]);
          if (cancelled) return;
          setEntities(ents);
          setPages(pageData.pages);

          const byThread = new Map<string, Thread>();
          for (const item of history) {
            let thread = byThread.get(item.thread_id);
            if (!thread) {
              thread = { threadId: item.thread_id, label: truncate(item.question, 40), messages: [] };
              byThread.set(item.thread_id, thread);
            }
            thread.messages.push({ question: item.question, answer: item.answer, sources: item.sources });
          }
          setThreads(Array.from(byThread.values()));
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

  function handleNewMessage(threadId: string, message: Message) {
    setThreads((prev) => {
      const existing = prev.find((t) => t.threadId === threadId);
      if (existing) {
        return prev.map((t) => (t.threadId === threadId ? { ...t, messages: [...t.messages, message] } : t));
      }
      return [...prev, { threadId, label: truncate(message.question, 40), messages: [message] }];
    });
    setSelectedThreadId(threadId);
  }

  if (error) return <p className="text-sm text-pulse px-4">{error}</p>;
  if (!report) return <p className="text-sm text-inkSoft font-mono px-4">Loading…</p>;

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId);
  const isReady = report.status === "parsed";

  if (!isReady) {
    return (
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="font-display text-xl text-ink">{report.original_filename}</h1>
          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[report.status] || "bg-mist/60 text-inkSoft"}`}>
            {report.status}
          </span>
        </div>
        {report.status !== "failed" ? (
          <p className="text-sm text-inkSoft font-mono">
            Your report is still being processed — this page will update automatically.
          </p>
        ) : (
          <p className="text-sm text-pulse">Something went wrong while processing this report. Try re-uploading it.</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 bg-paper">
      <div className="h-full flex flex-col overflow-y-auto lg:overflow-hidden px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2 shrink-0 pb-3">
          <h1 className="font-display text-lg text-ink truncate">{report.original_filename}</h1>
          <span className={`text-xs font-mono px-2 py-1 rounded-full shrink-0 ${STATUS_STYLES[report.status]}`}>
            {report.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] gap-4 flex-1 min-h-0">
          <div className="grid grid-rows-[1fr_auto] gap-4 min-h-0 h-full">
            <PdfPreview pages={pages} />
            <HistoryList
              threads={threads}
              selectedThreadId={selectedThreadId}
              onSelect={setSelectedThreadId}
              disabled={!isReady}
            />
          </div>

          <div className="border border-mist rounded-2xl bg-paper overflow-y-auto p-5 space-y-6 min-h-0">
            {report.ai_summary && <SummaryCard summary={report.ai_summary} />}
            {entities.length > 0 && (
              <div>
                <h2 className="font-mono text-xs uppercase tracking-widest text-sage mb-3">Lab trends</h2>
                <LabChart entities={entities} />
              </div>
            )}
          </div>

          <ChatThread
            reportId={report.id}
            threadId={selectedThreadId}
            messages={selectedThread?.messages || []}
            disabled={!isReady}
            onNewMessage={handleNewMessage}
            onNewChat={() => setSelectedThreadId(null)}
          />
        </div>
      </div>
    </div>
  );
}