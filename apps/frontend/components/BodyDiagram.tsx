"use client";

import { useState } from "react";
import { OrganMapEntry } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  normal: "#3F6D57",
  attention: "#C1502E",
  unclear: "#C9D8CD",
};

// Simplified region centers (cx, cy) on a 200x400 viewBox body outline.
const REGION_POS: Record<string, { cx: number; cy: number; r: number }> = {
  brain_nervous: { cx: 100, cy: 40, r: 16 },
  thyroid: { cx: 100, cy: 78, r: 8 },
  lungs: { cx: 100, cy: 120, r: 22 },
  heart: { cx: 88, cy: 118, r: 10 },
  liver: { cx: 112, cy: 158, r: 14 },
  digestive: { cx: 100, cy: 180, r: 18 },
  kidneys: { cx: 100, cy: 170, r: 20 },
  blood: { cx: 100, cy: 200, r: 24 },
  immune: { cx: 100, cy: 200, r: 30 },
  reproductive: { cx: 100, cy: 230, r: 12 },
  bones: { cx: 100, cy: 300, r: 60 },
  skin: { cx: 100, cy: 200, r: 90 },
};

const SYSTEM_LABELS: Record<string, string> = {
  heart: "Heart", lungs: "Lungs", liver: "Liver", kidneys: "Kidneys",
  blood: "Blood", immune: "Immune system", digestive: "Digestive system",
  thyroid: "Thyroid", bones: "Bones", brain_nervous: "Brain & nervous system",
  reproductive: "Reproductive system", skin: "Skin",
};

export default function BodyDiagram({ organMap }: { organMap: OrganMapEntry[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (organMap.length === 0) {
    return (
      <p className="text-sm text-inkSoft font-mono">
        No system-level mapping available for this report.
      </p>
    );
  }

  const byName = new Map(organMap.map((e) => [e.system, e]));
  const activeEntry = active ? byName.get(active) : null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <svg viewBox="0 0 200 400" className="w-full max-w-[220px] mx-auto sm:mx-0 shrink-0">
        {/* simplified body outline */}
        <path
          d="M100 20 C112 20 122 30 122 44 C122 56 116 62 112 66
             C130 74 140 96 140 120 L140 200
             C140 210 136 216 128 220
             L132 300 C133 320 128 340 118 380
             L110 380 L108 240
             L92 240 L90 380 L82 380
             C72 340 67 320 68 300 L72 220
             C64 216 60 210 60 200 L60 120
             C60 96 70 74 88 66
             C84 62 78 56 78 44 C78 30 88 20 100 20 Z"
          fill="none"
          stroke="#C9D8CD"
          strokeWidth="2"
        />
        {Object.entries(REGION_POS).map(([system, pos]) => {
          const entry = byName.get(system);
          if (!entry) return null;
          const color = STATUS_COLOR[entry.status];
          const isActive = active === system;
          return (
            <circle
              key={system}
              cx={pos.cx}
              cy={pos.cy}
              r={isActive ? pos.r * 0.35 + 4 : pos.r * 0.3}
              fill={color}
              fillOpacity={entry.status === "attention" ? 0.85 : 0.5}
              stroke={isActive ? color : "none"}
              strokeWidth={isActive ? 2 : 0}
              className="cursor-pointer transition-all duration-300"
              onClick={() => setActive(isActive ? null : system)}
            >
              {entry.status === "attention" && (
                <animate attributeName="fill-opacity" values="0.85;0.4;0.85" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
          );
        })}
      </svg>

      <div className="flex-1 space-y-2 w-full">
        {activeEntry ? (
          <div className="border border-mist rounded-xl p-3 bg-sage-light/30">
            <p className="text-sm font-medium text-ink">{SYSTEM_LABELS[activeEntry.system]}</p>
            <p className="text-xs text-inkSoft mt-1">{activeEntry.reason}</p>
          </div>
        ) : (
          <p className="text-xs text-inkSoft/70 font-mono">Tap a highlighted region to see details</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {organMap.map((e) => (
            <button
              key={e.system}
              onClick={() => setActive(active === e.system ? null : e.system)}
              className={`text-[11px] font-mono px-2 py-1 rounded-full border transition-colors ${
                active === e.system ? "border-sage bg-sage-light" : "border-mist hover:border-sage"
              }`}
              style={{ color: STATUS_COLOR[e.status] }}
            >
              {SYSTEM_LABELS[e.system]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}