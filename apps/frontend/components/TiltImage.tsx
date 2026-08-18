"use client";

import { useRef } from "react";
import Image from "next/image";

export default function TiltImage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    const img = imgRef.current;
    if (!el || !img) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    img.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) scale(1.02)`;
  }

  function handleMouseLeave() {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-h-[54vh] overflow-hidden rounded-[2rem] border-2 border-ink animate-rise-in animate-shimmer"
    >
      <div ref={imgRef} className="transition-transform duration-300 ease-out will-change-transform">
        <Image
          src="/hero-illustration.png"
          alt="How Medexplain works: upload, read, surface values, answer questions"
          width={1200}
          height={751}
          className="w-full h-full object-cover object-top"
          priority
        />
      </div>
    </div>
  );
}