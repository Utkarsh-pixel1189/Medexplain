/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F5F7F4",
        ink: "#16241F",
        inkSoft: "#4B5D55",
        sage: { DEFAULT: "#3F6D57", light: "#E9F0EB", dark: "#2C4E3E" },
        mist: "#C9D8CD",
        pulse: "#C1502E",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};