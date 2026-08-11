"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, Report } from "@/lib/api";
import UploadForm from "@/components/UploadForm";
import ReportList from "@/components/ReportList";
import StatCard from "@/components/StatCard";
import Marker from "@/components/Marker";

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listReports();
      setReports(data);
      setAuthError(false);
    } catch {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      setReports((current) => {
        if (current.some((r) => r.status === "uploaded" || r.status === "parsing")) {
          refresh();
        }
        return current;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this report? This can't be undone.")) return;
    try {
      await api.deleteReport(id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete report");
    }
  }

  const stats = useMemo(() => {
    const parsed = reports.filter((r) => r.status === "parsed").length;
    const processing = reports.filter((r) => r.status === "uploaded" || r.status === "parsing").length;
    const failed = reports.filter((r) => r.status === "failed").length;
    const latest = reports[0]
      ? new Date(reports[0].created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";
    return { total: reports.length, parsed, processing, failed, latest };
  }, [reports]);

  if (authError) {
    return (
      <p className="text-sm text-inkSoft">
        Please <a href="/login" className="text-accent underline">log in</a> to view your dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-3xl text-ink">
        Your <Marker>reports</Marker>
      </h1>

      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total reports"
            value={stats.total}
            accentColor="text-ink"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Parsed"
            value={stats.parsed}
            accentColor="text-sage"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Processing"
            value={stats.processing}
            accentColor="text-accent"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Most recent"
            value={stats.latest}
            accentColor="text-ink"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>
      )}

      <UploadForm onUploaded={refresh} />
      {loading ? (
        <p className="text-sm text-inkSoft font-mono">Loading…</p>
      ) : (
        <ReportList reports={reports} onDelete={handleDelete} />
      )}
    </div>
  );
}