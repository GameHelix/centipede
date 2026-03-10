import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00ff88",
          cyan: "#00ffff",
          pink: "#ff44cc",
          yellow: "#ffff00",
          orange: "#ff8800",
          purple: "#cc44ff",
        },
      },
      fontFamily: {
        mono: ["'Courier New'", "Courier", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        flicker: "flicker 4s infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { textShadow: "0 0 8px #00ff88, 0 0 16px #00ff88" },
          "50%": {
            textShadow:
              "0 0 16px #00ff88, 0 0 32px #00ff88, 0 0 48px #00ff88",
          },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%, 98%": { opacity: "0.5" },
          "97%": { opacity: "0.8" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
