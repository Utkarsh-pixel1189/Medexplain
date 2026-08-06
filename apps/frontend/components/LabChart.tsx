"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Entity } from "@/lib/api";

function parseRange(refRange: string | null): [number, number] | null {
  if (!refRange) return null;
  const match = refRange.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  return [parseFloat(match[1]), parseFloat(match[2])];
}

const TYPE_LABELS: Record<string, string> = {
  lab: "Lab values",
  vital: "Vitals",
  medication: "Medications",
  diagnosis: "Diagnoses & findings",
};

function RangeBar({ name, value, unit, refRange, flagged, originalValue }: {
  name: string; value: number; unit: string | null; refRange: string | null;
  flagged?: boolean; originalValue?: string | null;
}) {
  const range = parseRange(refRange);

  const NameLabel = () => (
    <p className="text-sm font-medium text-ink flex items-center gap-1.5">
      {name}
      {flagged && (
        <span
          title={originalValue ? `Auto-corrected from "${originalValue}" — verify against the original report` : "Extracted value couldn't be confidently verified — check the original report"}
          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 cursor-help"
        >
          {originalValue ? "corrected" : "verify"}
        </span>
      )}
    </p>
  );

  if (!range) {
    return (
      <div className="py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <NameLabel />
          <p className="text-sm font-mono text-inkSoft shrink-0">{value} {unit || ""}</p>
        </div>
        <p className="text-xs text-inkSoft/60 font-mono mt-1">No reference range stated</p>
      </div>
    );
  }

  const [low, high] = range;
  const span = high - low;
  const padding = span * 0.3 || 1;
  const trackMin = low - padding;
  const trackMax = high + padding;
  const trackSpan = trackMax - trackMin;

  const clampedValue = Math.min(Math.max(value, trackMin), trackMax);
  const valuePct = ((clampedValue - trackMin) / trackSpan) * 100;
  const rangeStartPct = ((low - trackMin) / trackSpan) * 100;
  const rangeWidthPct = (span / trackSpan) * 100;

  const isOutOfRange = value < low || value > high;

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <NameLabel />
        <p className={`text-sm font-mono shrink-0 ${isOutOfRange ? "text-pulse" : "text-sage-dark"}`}>
          {value} {unit || ""}
        </p>
      </div>
      <div className="relative h-2 mt-2 rounded-full bg-mist/50">
        <div
          className="absolute h-full bg-sage-light rounded-full"
          style={{ left: `${rangeStartPct}%`, width: `${rangeWidthPct}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-paper ${isOutOfRange ? "bg-pulse" : "bg-sage"}`}
          style={{ left: `calc(${valuePct}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-inkSoft/60 mt-1">
        <span>{low}</span>
        <span>normal range</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function PlainRow({ name, value, unit }: { name: string; value: string | null; unit?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <p className="text-sm font-medium text-ink truncate">{name}</p>
      {value && <p className="text-sm font-mono text-inkSoft shrink-0">{value} {unit || ""}</p>}
    </div>
  );
}

function TrendLine({ name, unit, data }: { name: string; unit: string | null; data: { date: string; value: number | null }[] }) {
  return (
    <div className="py-3">
      <h3 className="text-sm font-medium text-ink mb-2">
        {name} {unit ? <span className="font-mono text-inkSoft">({unit})</span> : ""}
      </h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#C9D8CD" />
            <XAxis dataKey="date" fontSize={11} stroke="#4B5D55" />
            <YAxis fontSize={11} stroke="#4B5D55" />
            <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#C9D8CD", fontFamily: "var(--font-body)" }} />
            <Line type="monotone" dataKey="value" stroke="#C1502E" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function LabChart({ entities }: { entities: Entity[] }) {
  if (entities.length === 0) {
    return <p className="text-sm text-inkSoft font-mono">No data extracted from this report yet.</p>;
  }

  const byType = new Map<string, Entity[]>();
  for (const e of entities) {
    const list = byType.get(e.type) || [];
    list.push(e);
    byType.set(e.type, list);
  }

  return (
    <div className="space-y-8">
      {Array.from(byType.entries()).map(([type, typeEntities]) => {
        const byName = new Map<string, Entity[]>();
        for (const e of typeEntities) {
          const list = byName.get(e.name) || [];
          list.push(e);
          byName.set(e.name, list);
        }

        return (
          <div key={type}>
            <h3 className="font-mono text-xs uppercase tracking-widest text-sage mb-3">
              {TYPE_LABELS[type] || type}
            </h3>
            <div className="divide-y divide-mist/60">
              {Array.from(byName.entries()).map(([name, points], idx) => {
                if (points.length > 1) {
                  const data = points
                    .map((p) => ({ date: p.date?.slice(0, 10) || "unknown", value: p.numeric_value }))
                    .sort((a, b) => a.date.localeCompare(b.date));
                  return <TrendLine key={idx} name={name} unit={points[0].unit} data={data} />;
                }

                const p = points[0];
                if (p.numeric_value !== null) {
                  return (
                    <RangeBar
                      key={idx}
                      name={name}
                      value={p.numeric_value}
                      unit={p.unit}
                      refRange={p.ref_range}
                      flagged={p.flagged}
                      originalValue={p.original_value}
                    />
                  );
                }

                return <PlainRow key={idx} name={name} value={p.value} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}