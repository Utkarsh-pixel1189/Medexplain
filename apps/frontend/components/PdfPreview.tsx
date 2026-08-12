"use client";

import { useState } from "react";

export default function PdfPreview({ pages }: { pages: string[] }) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-inkSoft font-mono">
        No preview available
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden bg-mist/20 flex items-center justify-center p-4 min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pages[index]}
            alt={`Page ${index + 1}`}
            onClick={() => setFullscreen(true)}
            className="max-h-full max-w-full object-contain rounded-lg cursor-zoom-in shadow-sm"
          />
        </div>
        {pages.length > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-ink/10 text-xs font-mono text-inkSoft shrink-0">
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

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-6"
          onClick={() => setFullscreen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pages[index]}
            alt={`Page ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full w-auto rounded-lg shadow-2xl cursor-zoom-out my-auto"
          />
          <button
            onClick={() => setFullscreen(false)}
            className="fixed top-6 right-6 text-paper text-sm font-mono px-3 py-1.5 rounded-full bg-ink/60 hover:bg-ink/80 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}