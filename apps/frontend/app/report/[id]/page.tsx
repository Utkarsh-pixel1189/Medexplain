"use client";

import { useEffect, useRef, useState } from "react";
import { api, Report, Entity, QASource } from "@/lib/api";
import SummaryCard from "@/components/SummaryCard";
import LabChart from "@/components/LabChart";
import PdfPreview from "@/components/PdfPreview";
import HistorySidebar from "@/components/HistorySidebar";
import ChatThread from "@/components/ChatThread";
import ReportTabs, { TabId } from "@/components/ReportTabs";

type Message = { question: string; answer?: string; sources?: QASource[] };
type Thread = { threadId: string; label: string; messages: Message[] };

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-mist/60 text-inkSoft",
  scanning: "bg-highlight/40 text-ink",
  parsing: "bg-highlight/40 text-ink",
  parsed: "bg-sage-light text-sage-dark",
  failed: "bg-pulse/10 text-pulse",
};

const MOBILE_TABS = [
  { id: "document", label: "Document" },
  { id: "report", label: "Summary" },
  { id: "chat", label: "Chat" },
  { id: "history", label: "History" },
] as const;
type MobileTabId = (typeof MOBILE_TABS)[number]["id"];
const MOBILE_TAB_ORDER: MobileTabId[] = ["document", "report", "chat", "history"];

export default function ReportViewerPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("document");
  const [mobileTab, setMobileTab] = useState<MobileTabId>("document");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore mostly-vertical swipes (scrolling) and short swipes.
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;

    const currentIndex = MOBILE_TAB_ORDER.indexOf(mobileTab);
    if (dx < 0 && currentIndex < MOBILE_TAB_ORDER.length - 1) {
      setMobileTab(MOBILE_TAB_ORDER[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      setMobileTab(MOBILE_TAB_ORDER[currentIndex - 1]);
    }
  }

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
          <h1 className="font-display font-bold text-xl text-ink">{report.original_filename}</h1>
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

  const reportTabContent = (
    <div className="h-full overflow-y-auto p-5">
      {report.ai_summary && <SummaryCard summary={report.ai_summary} />}
      {entities.length > 0 && (
        <div className="mt-6 border-t-2 border-ink/10 pt-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sage mb-3">Report details</h2>
          <LabChart entities={entities} />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-x-0 top-14 bottom-0 bg-paper">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Desktop sidebar */}
        <HistorySidebar
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={(id) => {
            setSelectedThreadId(id);
            setTab("chat");
          }}
          onNewChat={() => {
            setSelectedThreadId(null);
            setTab("chat");
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          disabled={!isReady}
        />

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b-2 border-ink/10 shrink-0 bg-sage-light/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center text-sage shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="font-display font-bold text-base sm:text-lg text-ink truncate">{report.original_filename}</h1>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${STATUS_STYLES[report.status]}`}>
              {report.status}
            </span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden lg:block shrink-0">
            <ReportTabs active={tab} onChange={setTab} />
          </div>

          <div className="flex-1 min-h-0 hidden lg:block">
            {tab === "document" && <PdfPreview pages={pages} />}
            {tab === "report" && reportTabContent}
            {tab === "chat" && (
              <ChatThread
                reportId={report.id}
                threadId={selectedThreadId}
                messages={selectedThread?.messages || []}
                disabled={!isReady}
                onNewMessage={handleNewMessage}
              />
            )}
          </div>

          {/* Mobile tabs — top, matching desktop placement */}
          <div className="lg:hidden shrink-0 border-b-2 border-ink/10 bg-paper flex">
            {MOBILE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setMobileTab(t.id)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  mobileTab === t.id ? "text-accent border-b-2 border-accent" : "text-inkSoft"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile view — swipeable */}
          <div
            className="flex-1 min-h-0 lg:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {mobileTab === "document" && <PdfPreview pages={pages} />}
            {mobileTab === "report" && reportTabContent}
            {mobileTab === "chat" && (
              <ChatThread
                reportId={report.id}
                threadId={selectedThreadId}
                messages={selectedThread?.messages || []}
                disabled={!isReady}
                onNewMessage={handleNewMessage}
              />
            )}
            {mobileTab === "history" && (
              <div className="h-full overflow-y-auto">
                <div className="p-3">
                  <button
                    onClick={() => {
                      setSelectedThreadId(null);
                      setMobileTab("chat");
                    }}
                    disabled={!isReady}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2.5 rounded-full bg-accent text-paper hover:bg-accent-dark transition-colors disabled:opacity-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    New chat
                  </button>
                </div>
                {threads.length === 0 && (
                  <p className="text-xs text-inkSoft px-4 py-6 text-center">No history yet</p>
                )}
                <div>
                  {threads.map((t, idx) => (
                    <button
                      key={t.threadId}
                      onClick={() => {
                        setSelectedThreadId(t.threadId);
                        setMobileTab("chat");
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-ink/10 relative ${
                        selectedThreadId === t.threadId ? "bg-sage-light/40" : ""
                      }`}
                    >
                      {selectedThreadId === t.threadId && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                      )}
                      <p className="text-[10px] font-bold text-inkSoft uppercase tracking-wide mb-0.5">
                        Thread {idx + 1}
                      </p>
                      <p className={`text-sm truncate ${selectedThreadId === t.threadId ? "font-semibold text-ink" : "text-ink"}`}>
                        {t.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}