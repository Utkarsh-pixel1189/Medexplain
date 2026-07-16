"use client";

import { Report } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-gray-100 text-gray-700",
  scanning: "bg-yellow-100 text-yellow-800",
  parsing: "bg-yellow-100 text-yellow-800",
  parsed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function ReportList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return <p className="text-sm text-gray-500">No reports uploaded yet.</p>;
  }

  return (
    <ul className="divide-y bg-white border rounded-lg">
      {reports.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-4 py-3">
          <a href={`/report/${r.id}`} className="text-sm font-medium text-brand-700 hover:underline">
            {r.original_filename}
          </a>
          <span
            className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[r.status] || "bg-gray-100 text-gray-700"}`}
          >
            {r.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
