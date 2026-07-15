import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../.site-dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
