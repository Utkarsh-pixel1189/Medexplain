export default function Marker({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <svg
        className="absolute -bottom-1 left-0 w-full"
        height="14"
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M2 8 C 60 2, 140 2, 198 8" stroke="#E9E24A" strokeWidth="10" fill="none" strokeLinecap="round" />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}