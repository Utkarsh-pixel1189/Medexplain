"use client";

import { useState } from "react";
import { OrganMapEntry } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  normal: "#3F6D57",
  attention: "#C1502E",
  unclear: "#9BAFA6",
};

// Organ-shaped regions (ellipses, not dots) positioned on a 200x520
// frontal body silhouette. rx/ry give each region a shape roughly matching
// the organ/system it represents rather than a generic circle.
const REGIONS: Record<string, { cx: number; cy: number; rx: number; ry: number; rotate?: number }> = {
  brain_nervous: { cx: 100, cy: 48, rx: 20, ry: 22 },
  thyroid: { cx: 100, cy: 92, rx: 10, ry: 7 },
  lungs: { cx: 100, cy: 150, rx: 34, ry: 42 },
  heart: { cx: 90, cy: 152, rx: 13, ry: 16, rotate: -15 },
  liver: { cx: 122, cy: 202, rx: 22, ry: 16, rotate: 10 },
  kidneys: { cx: 100, cy: 210, rx: 30, ry: 14 },
  digestive: { cx: 100, cy: 225, rx: 26, ry: 22 },
  blood: { cx: 100, cy: 190, rx: 46, ry: 90 },
  immune: { cx: 100, cy: 190, rx: 50, ry: 96 },
  reproductive: { cx: 100, cy: 268, rx: 16, ry: 12 },
  bones: { cx: 100, cy: 380, rx: 50, ry: 140 },
  skin: { cx: 100, cy: 260, rx: 62, ry: 220 },
};

const SYSTEM_LABELS: Record<string, string> = {
  heart: "Heart", lungs: "Lungs", liver: "Liver", kidneys: "Kidneys",
  blood: "Blood", immune: "Immune system", digestive: "Digestive system",
  thyroid: "Thyroid", bones: "Bones", brain_nervous: "Brain & nervous system",
  reproductive: "Reproductive system", skin: "Skin",
};

// Deep systemic regions render behind more localized organs so a "blood"
// or "skin" highlight doesn't visually bury the heart/liver/etc.
const RENDER_ORDER = [
  "skin", "immune", "blood", "bones", "brain_nervous", "thyroid",
  "lungs", "heart", "liver", "kidneys", "digestive", "reproductive",
];

function Silhouette() {
  return (
    <path
      d="M100 8
         C 112 8 121 18 121 32
         C 121 42 116 49 110 53
         C 128 58 142 66 150 82
         C 158 96 160 112 158 128
         L 172 160
         C 176 168 174 178 166 182
         C 160 185 154 182 151 176
         L 140 148
         L 142 210
         C 148 240 150 270 146 300
         L 152 420
         C 154 440 152 460 146 478
         L 128 478
         C 124 460 122 440 122 420
         L 118 320
         L 110 320
         L 106 420
         C 106 440 104 460 100 478
         L 82 478
         C 78 460 76 440 76 420
         L 82 300
         C 78 270 80 240 86 210
         L 88 148
         L 77 176
         C 74 182 68 185 62 182
         C 54 178 52 168 56 160
         L 70 128
         C 68 112 70 96 78 82
         C 86 66 100 58 118 53
         C 112 49 107 42 107 32
         C 107 18 88 8 100 8 Z"
      fill="#E9F0EB"
      stroke="#C9D8CD"
      strokeWidth="2"
    />
  );
}

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
  const orderedSystems = RENDER_ORDER.filter((s) => byName.has(s));

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      <svg viewBox="0 0 200 500" className="w-full max-w-[200px] mx-auto sm:mx-0 shrink-0">
        <defs>
          <filter id="organGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Silhouette />

        {orderedSystems.map((system) => {
          const entry = byName.get(system)!;
          const pos = REGIONS[system];
          const color = STATUS_COLOR[entry.status];
          const isActive = active === system;
          const baseOpacity = entry.status === "attention" ? 0.55 : 0.32;

          return (
            <g
              key={system}
              onClick={() => setActive(isActive ? null : system)}
              className="cursor-pointer"
              transform={pos.rotate ? `rotate(${pos.rotate} ${pos.cx} ${pos.cy})` : undefined}
            >
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx}
                ry={pos.ry}
                fill={color}
                fillOpacity={isActive ? baseOpacity + 0.25 : baseOpacity}
                filter="url(#organGlow)"
                className="transition-all duration-300"
              >
                {entry.status === "attention" && (
                  <animate
                    attributeName="fill-opacity"
                    values={`${baseOpacity};${baseOpacity + 0.3};${baseOpacity}`}
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                )}
              </ellipse>
              {isActive && (
                <ellipse
                  cx={pos.cx}
                  cy={pos.cy}
                  rx={pos.rx}
                  ry={pos.ry}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
            </g>
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
          <p className="text-xs text-inkSoft/70 font-mono">Tap a highlighted area to see details</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {organMap.map((e) => (
            <button
              key={e.system}
              onClick={() => setActive(active === e.system ? null : e.system)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
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