"use client";

import { useState } from "react";

export default function PdfPreview({ pages }: { pages: string[] }) {
  const [index, setIndex] = useState(0);

  if (pages.length === 0) {
    return (
      <div className="border border-mist rounded-2xl bg-paper h-full flex items-center justify-center text-sm text-inkSoft font-mono">
        No preview available
      </div>
    );
  }

  return (
    <div className="border border-mist rounded-2xl bg-paper h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden bg-mist/20 flex items-center justify-center p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pages[index]} alt={`Page ${index + 1}`} className="max-h-full max-w-full object-contain rounded-lg" />
      </div>
      {pages.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-mist text-xs font-mono text-inkSoft">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="disabled:opacity-30">
            ← Prev
          </button>
          <span>Page {index + 1} of {pages.length}</span>
          <button onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))} disabled={index === pages.length - 1} className="disabled:opacity-30">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}