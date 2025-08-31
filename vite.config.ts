import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [solid(), tailwindcss()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./shared"),
      "@overlay": path.resolve(__dirname, "./apps/overlay"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        overlay: path.resolve(__dirname, "apps/snap_overlay/index.html"),
        // settings: path.resolve(__dirname, "apps/settings/index.html"),
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
