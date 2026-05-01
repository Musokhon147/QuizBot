/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        "bg-secondary": "var(--color-bg-secondary)",
        foreground: "var(--color-foreground)",
        subtle: "var(--color-subtle)",
        muted: "var(--color-muted)",
        divider: "var(--color-divider)",
        accent: {
          DEFAULT: "#6c5ce7",
          light: "#a29bfe",
          dark: "#4834d4",
        },
        mint: {
          DEFAULT: "#00cec9",
          light: "#55efc4",
          dark: "#00b894",
        },
        coral: {
          DEFAULT: "#ff6b6b",
          light: "#ff8787",
          dark: "#ee5a24",
        },
        glass: {
          DEFAULT: "var(--color-glass)",
          border: "var(--color-glass-border)",
          hover: "var(--color-glass-hover)",
        },
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
      },
      animation: {
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
