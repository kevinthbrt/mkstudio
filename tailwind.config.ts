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
        gold: {
          50: "#fdf8ec",
          100: "#faefd0",
          200: "#f4d98a",
          300: "#eec455",
          400: "#e8ae2f",
          500: "#D4AF37",
          600: "#b8941e",
          700: "#97741a",
          800: "#7a5c1a",
          900: "#654d19",
          950: "#3a2a09",
        },
        dark: {
          50: "#f7f7f7",
          100: "#e3e3e3",
          200: "#c8c8c8",
          300: "#a4a4a4",
          400: "#818181",
          500: "#666666",
          600: "#515151",
          700: "#434343",
          800: "#383838",
          900: "#1a1a1a",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #F5E06B 50%, #D4AF37 100%)",
        "gradient-dark": "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      },
      boxShadow: {
        gold: "0 4px 20px rgba(212, 175, 55, 0.3)",
        "gold-lg": "0 8px 40px rgba(212, 175, 55, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
