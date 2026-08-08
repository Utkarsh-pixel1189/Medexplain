export default function HeroSketch() {
  return (
    <svg viewBox="0 0 400 220" className="w-full max-w-md mx-auto text-ink" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* question mark */}
      <path d="M190 20 C 190 8, 210 8, 210 20 C 210 30, 195 30, 195 42" />
      <circle cx="196" cy="54" r="1.5" fill="currentColor" />

      {/* document */}
      <rect x="60" y="50" width="70" height="90" rx="4" />
      <line x1="72" y1="70" x2="118" y2="70" />
      <line x1="72" y1="82" x2="118" y2="82" />
      <line x1="72" y1="94" x2="100" y2="94" />

      {/* magnifying glass */}
      <circle cx="290" cy="90" r="28" />
      <line x1="310" y1="110" x2="332" y2="132" />

      {/* person */}
      <circle cx="200" cy="150" r="18" />
      <path d="M170 214 C 170 180, 230 180, 230 214" />
      <path d="M175 195 L 150 175" />
      <path d="M225 195 L 250 175" />

      {/* highlighter mark under person */}
      <path d="M150 216 C 180 210, 220 210, 250 216" stroke="#E9E24A" strokeWidth="8" />
    </svg>
  );
}