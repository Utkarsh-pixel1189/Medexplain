"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Entity } from "@/lib/api";

/** Groups lab entities by name and renders one trend line per lab. */
export default function LabChart({ entities }: { entities: Entity[] }) {
  const labs = entities.filter((e) => e.type === "lab" && e.numeric_value !== null);

  if (labs.length === 0) {
    return <p className="text-sm text-gray-500">No numeric lab values found to chart yet.</p>;
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
            <h3 className="text-sm font-medium mb-2">
              {name} {points[0].unit ? `(${points[0].unit})` : ""}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b6fd6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
