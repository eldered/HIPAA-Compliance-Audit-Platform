import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Brand palette (see requirements/design)
        brand: {
          DEFAULT: "#0066CC", // professional blue (trust)
          50: "#E6F0FB",
          100: "#CCE0F7",
          500: "#0066CC",
          600: "#0052A3",
          700: "#003D7A",
        },
        success: {
          DEFAULT: "#10B981", // compliant / green
          fg: "#065F46",
        },
        danger: {
          DEFAULT: "#EF4444", // risk / red
          fg: "#991B1B",
        },
        border: "hsl(214 32% 91%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        muted: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(215 16% 47%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
