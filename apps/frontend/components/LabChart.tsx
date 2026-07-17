"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Entity } from "@/lib/api";

export default function LabChart({ entities }: { entities: Entity[] }) {
  const labs = entities.filter((e) => e.type === "lab" && e.numeric_value !== null);

  if (labs.length === 0) {
    return <p className="text-sm text-inkSoft font-mono">No numeric values found to chart yet.</p>;
  }

  const byName = new Map<string, Entity[]>();
  for (const lab of labs) {
    const list = byName.get(lab.name) || [];
    list.push(lab);
    byName.set(lab.name, list);
  }

  return (
    <div className="space-y-8">
      {Array.from(byName.entries()).map(([name, points]) => {
        const data = points
          .map((p) => ({ date: p.date?.slice(0, 10) || "unknown", value: p.numeric_value }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return (
          <div key={name}>
            <h3 className="text-sm font-medium text-ink mb-2">
              {name} {points[0].unit ? <span className="font-mono text-inkSoft">({points[0].unit})</span> : ""}
            </h3>
            <div className="h-48">
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
      })}
    </div>
  );
}