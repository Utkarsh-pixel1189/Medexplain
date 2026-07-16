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
    <div className="border-2 border-dashed rounded-lg p-6 text-center bg-white">
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
      <label htmlFor="report-upload" className="cursor-pointer text-sm text-brand-600">
        {status === "uploading" ? "Uploading…" : "Click to upload a PDF report"}
      </label>
      {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}
