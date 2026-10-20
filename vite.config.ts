import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function siteBase(): string {
  const value = process.env.VITE_BASE_PATH;
  if (!value || value === "/") return "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: siteBase(),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4721,
    strictPort: true,
  },
});
