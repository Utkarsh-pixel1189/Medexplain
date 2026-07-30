"use client";

import { useEffect, useState } from "react";

const COLORS = { low: "#F59E0B", normal: "#3F6D57", high: "#C1502E", track: "#C9D8CD", needle: "#16241F" };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function Gauge({
  name, value, unit, low, high,
}: {
  name: string; value: number; unit: string | null; low: number; high: number;
}) {
  const span = high - low || 1;
  const padding = span * 0.35;
  const trackMin = low - padding;
  const trackMax = high + padding;
  const trackSpan = trackMax - trackMin;

  const clamped = Math.min(Math.max(value, trackMin), trackMax);
  const targetAngle = ((clamped - trackMin) / trackSpan) * 180;

  const fLow = padding / trackSpan;
  const fHigh = (padding + span) / trackSpan;
  const thetaLow = 180 - fLow * 180;
  const thetaHigh = 180 - fHigh * 180;

  const status = value < low ? "low" : value > high ? "high" : "normal";
  const statusLabel = status === "low" ? "Low" : status === "high" ? "High" : "Normal";
  const statusColor = COLORS[status];

  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAngle(targetAngle), 50);
    return () => clearTimeout(t);
  }, [targetAngle]);

  const cx = 60, cy = 58, r = 46, needleLen = r - 10;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 66" className="w-full max-w-[140px]">
        <path d={describeArc(cx, cy, r, 180, thetaLow)} stroke={COLORS.low} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, thetaLow, thetaHigh)} stroke={COLORS.normal} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, thetaHigh, 0)} stroke={COLORS.high} strokeWidth="8" fill="none" strokeLinecap="round" />
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${angle}deg)`, transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <line x1={cx} y1={cy} x2={cx - needleLen} y2={cy} stroke={COLORS.needle} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="4" fill={COLORS.needle} />
      </svg>
      <p className="text-sm font-medium text-ink text-center -mt-1 truncate w-full" title={name}>{name}</p>
      <p className="text-sm font-mono" style={{ color: statusColor }}>
        {value} {unit || ""} <span className="text-xs">· {statusLabel}</span>
      </p>
    </div>
  );
}