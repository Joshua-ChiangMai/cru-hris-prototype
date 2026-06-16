import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        foreground: "#f8fafc",
        card: "#111827",
        cardForeground: "#e5e7eb",
        border: "#1f2937",
        muted: "#94a3b8",
        primary: "#2563eb",
        primaryForeground: "#eff6ff"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
