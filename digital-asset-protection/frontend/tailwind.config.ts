import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04080f",
          900: "#080d17",
          800: "#0d1421",
          700: "#111a2c",
          600: "#162035",
          500: "#1e2d45",
        },
        line: { DEFAULT: "#1e2d45", light: "#253548" },
        txt: { primary: "#f1f5f9", secondary: "#94a3b8", muted: "#475569" },
        brand: { DEFAULT: "#2563eb", light: "#3b82f6", dark: "#1d4ed8" },
        danger: { DEFAULT: "#dc2626", light: "#ef4444" },
        safe: { DEFAULT: "#16a34a", light: "#22c55e" },
        warn: { DEFAULT: "#d97706", light: "#f59e0b" },
        sky: { DEFAULT: "#0ea5e9", light: "#38bdf8" },
        // keep backward compat for existing pages
        surface: {
          900: "#080d17",
          800: "#0d1421",
          700: "#111a2c",
          600: "#162035",
          500: "#1e2d45",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
