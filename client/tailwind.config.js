/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: "#193F34", // Dark Green
        "primary-light": "#245748", // Forest Green
        "primary-dark": "#102F28",
        cream: "#FAF8F3", // Warm Cream
        gold: "#A8833E", // Muted Gold
        "gold-light": "#F6EEDB", // Gold Background
        mint: "#E9F0E9", // Soft Green
        charcoal: "#292923", // Primary Text
        surface: "#F4EFE6",
        paper: "#FFFFFF",
        secondary: "#50534D", // Secondary Text
        muted: "#70736D", // Muted Text
        border: "#E6E1D7", // Border
      },

      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "sans-serif"],
      },

      boxShadow: {
        soft: "0 10px 30px -12px rgba(23,36,58,0.18)",
      },

      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },

      animation: {
        float: "float 4s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};
