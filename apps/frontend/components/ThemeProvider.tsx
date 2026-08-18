"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "blue" | "maroon" | "black" | "red" | "purple";

export const THEMES: Record<ThemeName, { rgb: string; darkRgb: string; label: string; swatch: string }> = {
  blue: { rgb: "29 116 242", darkRgb: "21 93 199", label: "Blue", swatch: "#1D74F2" },
  maroon: { rgb: "128 0 32", darkRgb: "92 0 23", label: "Maroon", swatch: "#800020" },
  black: { rgb: "17 17 17", darkRgb: "0 0 0", label: "Black", swatch: "#111111" },
  red: { rgb: "226 55 68", darkRgb: "196 32 48", label: "Red", swatch: "#E23744" },
  purple: { rgb: "124 58 237", darkRgb: "109 40 217", label: "Purple", swatch: "#7C3AED" },
};

const STORAGE_KEY = "medexplain-theme";

const ThemeContext = createContext<{ theme: ThemeName; setTheme: (t: ThemeName) => void }>({
  theme: "blue",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(t: ThemeName) {
  const { rgb, darkRgb } = THEMES[t];
  document.documentElement.style.setProperty("--accent-rgb", rgb);
  document.documentElement.style.setProperty("--accent-dark-rgb", darkRgb);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("blue");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored && THEMES[stored]) {
      applyTheme(stored);
      setThemeState(stored);
    }
  }, []);

  function setTheme(t: ThemeName) {
    applyTheme(t);
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}