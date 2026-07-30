"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Entity } from "@/lib/api";
import Gauge from "@/components/Gauge";

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

function PlainRow({ name, value, unit, note }: { name: string; value: string | null; unit?: string | null; note?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <p className="text-sm font-medium text-ink truncate">{name}</p>
      <div className="text-right shrink-0">
        {value && <p className="text-sm font-mono text-inkSoft">{value} {unit || ""}</p>}
        {note && <p className="text-[10px] text-inkSoft/60 font-mono">{note}</p>}
      </div>
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

        const trends: JSX.Element[] = [];
        const gauges: JSX.Element[] = [];
        const plain: JSX.Element[] = [];

        Array.from(byName.entries()).forEach(([name, points], idx) => {
          if (points.length > 1) {
            const data = points
              .map((p) => ({ date: p.date?.slice(0, 10) || "unknown", value: p.numeric_value }))
              .sort((a, b) => a.date.localeCompare(b.date));
            trends.push(<TrendLine key={`t-${idx}`} name={name} unit={points[0].unit} data={data} />);
            return;
          }

          const p = points[0];
          const range = p.numeric_value !== null ? parseRange(p.ref_range) : null;

          if (p.numeric_value !== null && range) {
            gauges.push(
              <Gauge key={`g-${idx}`} name={name} value={p.numeric_value} unit={p.unit} low={range[0]} high={range[1]} />
            );
          } else if (p.numeric_value !== null) {
            plain.push(
              <PlainRow key={`p-${idx}`} name={name} value={p.value} unit={p.unit} note="No reference range stated" />
            );
          } else {
            plain.push(<PlainRow key={`p-${idx}`} name={name} value={p.value} />);
          }
        });

        return (
          <div key={type}>
            <h3 className="font-mono text-xs uppercase tracking-widest text-sage mb-3">
              {TYPE_LABELS[type] || type}
            </h3>

            {trends.length > 0 && <div className="mb-2">{trends}</div>}

            {gauges.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-4 mb-4">
                {gauges}
              </div>
            )}

            {plain.length > 0 && (
              <div className="divide-y divide-mist/60">{plain}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}