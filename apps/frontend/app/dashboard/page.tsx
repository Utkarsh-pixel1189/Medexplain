"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, Report } from "@/lib/api";
import UploadForm from "@/components/UploadForm";
import ReportList from "@/components/ReportList";
import StatCard from "@/components/StatCard";
import Marker from "@/components/Marker";

type SortOption = "date-new" | "date-old" | "name-az" | "name-za";

const SORT_LABELS: Record<SortOption, string> = {
  "date-new": "Newest first",
  "date-old": "Oldest first",
  "name-az": "Name (A–Z)",
  "name-za": "Name (Z–A)",
};

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [sort, setSort] = useState<SortOption>("date-new");

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
    const latest = reports[0]
      ? new Date(reports[0].created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";
    return { total: reports.length, parsed, processing, latest };
  }, [reports]);

  const sortedReports = useMemo(() => {
    const copy = [...reports];
    switch (sort) {
      case "date-old":
        return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "name-az":
        return copy.sort((a, b) => a.original_filename.localeCompare(b.original_filename));
      case "name-za":
        return copy.sort((a, b) => b.original_filename.localeCompare(a.original_filename));
      case "date-new":
      default:
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [reports, sort]);

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Processing"
            value={stats.processing}
            accentColor="text-accent"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <UploadForm onUploaded={refresh} />
        {reports.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-inkSoft">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="border-2 border-mist rounded-full px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none bg-paper"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-inkSoft font-mono">Loading…</p>
      ) : (
        <ReportList reports={sortedReports} onDelete={handleDelete} onRenamed={refresh} />
      )}
    </div>
  );
}