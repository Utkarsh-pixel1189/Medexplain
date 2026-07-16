/**
 * Thin fetch wrapper for the backend API. Uses credentials: "include" so the
 * HttpOnly session cookie set by /api/auth/login is sent on every request.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || res.statusText, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type User = { id: string; email: string; role: string; created_at: string };
export type Report = {
  id: string;
  status: string;
  parse_status: string | null;
  original_filename: string;
  parse_summary: Record<string, unknown> | null;
  created_at: string;
};
export type Entity = {
  type: string;
  name: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  ref_range: string | null;
  date: string | null;
};
export type QASource = { chunk_id: string; page: number | null; snippet: string };
export type QAResponse = { answer: string; sources: QASource[]; thread_id: string; disclaimer: string };
export type QAHistoryItem = {
  id: string;
  thread_id: string;
  question: string;
  answer: string;
  sources: QASource[];
  created_at: string;
};

export const api = {
  register: (email: string, password: string) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  listReports: () => request<Report[]>("/report"),
  getReport: (id: string) => request<Report>(`/report/${id}`),
  getEntities: (id: string) => request<Entity[]>(`/report/${id}/entities`),
  getPdfUrl: (id: string) => request<{ url: string }>(`/report/${id}/pdf`),

  presign: (filename: string, contentType: string) =>
    request<{ upload_url: string; s3_key: string }>(
      `/s3-presign?filename=${encodeURIComponent(filename)}&content_type=${encodeURIComponent(contentType)}`
    ),
  ingest: (s3_key: string, original_filename: string) =>
    request<Report>("/report/ingest", { method: "POST", body: JSON.stringify({ s3_key, original_filename }) }),

  ask: (report_id: string, question: string, thread_id?: string) =>
    request<QAResponse>("/qa", { method: "POST", body: JSON.stringify({ report_id, question, thread_id }) }),
  getHistory: (report_id: string) =>
    request<QAHistoryItem[]>(`/qa/history/${report_id}`),
};

/** Uploads a file directly to S3 using a presigned URL (bytes never touch our API). */
export async function uploadFileDirectToS3(file: File, uploadUrl: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!res.ok) throw new Error("Upload to storage failed");
}
