import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: "index.html",
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@ui": path.resolve(__dirname, "src/ui"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
