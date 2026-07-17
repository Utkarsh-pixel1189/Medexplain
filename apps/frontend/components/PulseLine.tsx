export default function PulseLine({
  className = "",
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg viewBox="0 0 600 60" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 30 H120 L145 30 L160 8 L180 52 L200 30 L230 30 H600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "animate-draw-pulse" : ""}
      />
    </svg>
  );
}