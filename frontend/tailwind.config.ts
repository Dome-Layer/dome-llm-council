import type { Config } from "tailwindcss";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import domePreset from "@dome-layer/dome-ui/tailwind-preset";

const config: Config = {
  presets: [domePreset as Partial<Config> as Config],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      maxWidth: {
        content: "1200px",
        narrow: "720px",
        wide: "1400px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        barGrow: {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-width)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.25s ease forwards",
        spin: "spin 600ms linear infinite",
        "bar-grow":
          "barGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
