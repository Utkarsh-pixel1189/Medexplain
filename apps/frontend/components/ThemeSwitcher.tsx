"use client";

import { useTheme, THEMES, ThemeName } from "@/components/ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-3 justify-center flex-wrap">
      <span className="text-xs font-semibold text-inkSoft">Accent color</span>
      <div className="flex gap-2">
        {(Object.keys(THEMES) as ThemeName[]).map((key) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            aria-label={THEMES[key].label}
            title={THEMES[key].label}
            className={`w-7 h-7 rounded-full border-2 transition-all ${
              theme === key ? "border-ink scale-110" : "border-ink/20 hover:scale-105"
            }`}
            style={{ backgroundColor: THEMES[key].swatch }}
          />
        ))}
      </div>
    </div>
  );
}