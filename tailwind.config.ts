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
        primary: "#FF8C42",
        bg: {
          DEFAULT: "#000000",
          surface: "#0a0a0a",
        },
        accent: {
          orange: "#FF8C42",
          warm: "#F59E42",
          cyan: "#22d3ee",
          violet: "#8b5cf6",
          emerald: "#34d399",
          rose: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        headline: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-alt": "float-alt 20s ease-in-out infinite",
        "float-slow": "float-slow 15s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        morph: "morph 8s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-alt": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-30px, -20px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,140,66,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(255,140,66,0.4)" },
        },
        morph: {
          "0%, 100%": { borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%" },
          "34%": { borderRadius: "70% 30% 46% 54% / 30% 29% 71% 70%" },
          "67%": { borderRadius: "28% 72% 44% 56% / 49% 40% 60% 51%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      fontSize: {
        "hero": ["clamp(2rem, 8vw, 5.5rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "section": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "sub": ["clamp(1.25rem, 3vw, 1.75rem)", { lineHeight: "1.3" }],
      },
    },
  },
  plugins: [],
};
export default config;
