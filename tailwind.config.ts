import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#080b10",
          secondary: "#0d1117",
          tertiary: "#161b22",
          card: "#0d1117",
          hover: "#1a2233",
        },
        accent: {
          green: "#39d353",
          cyan: "#58a6ff",
          purple: "#bc8cff",
          orange: "#f0883e",
          red: "#f85149",
          yellow: "#e3b341",
        },
        border: {
          default: "#30363d",
          muted: "#21262d",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#6e7681",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#e6edf3",
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
