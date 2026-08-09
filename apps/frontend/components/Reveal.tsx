"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  delay = 0,
  className = "",
  activeClassName = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Extra classes applied while the element is prominently in view — lets
   * mobile users get a "hovered" feel as they scroll, since real :hover
   * doesn't exist on touch devices. */
  activeClassName?: string;
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

    // Re-fires on every enter/exit — used to simulate "hover while scrolling"
    // on touch devices, where a card is only ever briefly centered.
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
      className={`${revealed ? "animate-fade-up" : "opacity-0"} ${active ? activeClassName : ""} ${className}`}
      style={{ animationDelay: revealed ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}