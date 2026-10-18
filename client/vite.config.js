import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    proxy: {
      "/uploads": {
        target: "https://vedbook-digital-library-platform.onrender.com", // 👈 apna backend port yahan daalo
        changeOrigin: true,
      },
      "/api": {
        target: "https://vedbook-digital-library-platform.onrender.com", // 👈 same backend port
        changeOrigin: true,
      },
    },
  },
});
