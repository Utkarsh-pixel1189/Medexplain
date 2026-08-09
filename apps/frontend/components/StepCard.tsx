"use client";

import { useEffect, useRef, useState } from "react";

export default function StepCard({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`border-2 rounded-2xl p-6 space-y-3 bg-paper transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-sage ${
        active ? "-translate-y-1.5 shadow-xl border-sage" : "border-ink/15"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-2xl text-sage">{n}</span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-sage">
          {icon}
        </svg>
      </div>
      <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
      <p className="text-sm text-inkSoft leading-relaxed">{body}</p>
    </div>
  );
}