"use client";

import { useRef, useState } from "react";
import { api, uploadFileDirectToS3 } from "@/lib/api";

export default function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setErrorMsg("Please select a PDF file.");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setErrorMsg(null);
    try {
      const { upload_url, s3_key } = await api.presign(file.name, file.type);
      await uploadFileDirectToS3(file, upload_url);
      await api.ingest(s3_key, file.name);
      setStatus("idle");
      onUploaded();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="border-2 border-dashed border-ink/25 rounded-2xl p-8 text-center bg-sage-light/30 hover:border-sage hover:bg-sage-light/50 transition-all">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        id="report-upload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <label htmlFor="report-upload" className="cursor-pointer flex flex-col items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sage">
          <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-medium text-sage">
          {status === "uploading" ? "Uploading…" : "Click to upload a PDF report"}
        </span>
      </label>
      {errorMsg && <p className="mt-2 text-sm text-pulse">{errorMsg}</p>}
    </div>
  );
}