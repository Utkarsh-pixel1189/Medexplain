"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Report } from "@/lib/api";
import UploadForm from "@/components/UploadForm";
import ReportList from "@/components/ReportList";

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
    // Poll while any report is still processing, so status/charts update
    // without a manual refresh.
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

  if (authError) {
    return (
      <p className="text-sm text-gray-600">
        Please <a href="/login" className="text-brand-600 underline">log in</a> to view your dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your reports</h1>
      <UploadForm onUploaded={refresh} />
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : <ReportList reports={reports} />}
    </div>
  );
}
