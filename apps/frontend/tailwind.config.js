/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F3E8",
        ink: "#16231B",
        inkSoft: "#47594C",
        sage: { DEFAULT: "#1F3327", light: "#E4EDE2", dark: "#0F1D14" },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-dark-rgb) / <alpha-value>)",
        },
        mist: "#DCD5C2",
        pulse: "#C1502E",
        highlight: "#E9E24A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};