"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Report } from "@/lib/api";
import UploadForm from "@/components/UploadForm";
import ReportList from "@/components/ReportList";
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

  if (authError) {
    return (
      <p className="text-sm text-inkSoft">
        Please <a href="/login" className="text-sage underline">log in</a> to view your dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display font-bold text-3xl text-ink">
        Your <Marker>reports</Marker>
      </h1>
      <UploadForm onUploaded={refresh} />
      {loading ? (
        <p className="text-sm text-inkSoft font-mono">Loading…</p>
      ) : (
        <ReportList reports={reports} onDelete={handleDelete} />
      )}
    </div>
  );
}