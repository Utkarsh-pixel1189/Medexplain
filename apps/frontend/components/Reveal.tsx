"use client";

import { useEffect, useRef, useState } from "react";

type RevealState = { active: boolean };

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode | ((state: RevealState) => React.ReactNode);
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          revealObserver.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    revealObserver.observe(el);

    const activeObserver = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.6 }
    );
    activeObserver.observe(el);

    return () => {
      revealObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${revealed ? "animate-fade-up" : "opacity-0"} ${className}`}
      style={{ animationDelay: revealed ? `${delay}ms` : undefined }}
    >
      {typeof children === "function" ? children({ active }) : children}
    </div>
  );
}