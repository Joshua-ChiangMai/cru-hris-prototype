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
        background: "#f1f5f9",
        foreground: "#0f172a",
        card: "#ffffff",
        cardForeground: "#1e293b",
        border: "#e2e8f0",
        muted: "#64748b",
        primary: "#2563eb",
        primaryForeground: "#ffffff"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
