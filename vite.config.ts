import net from "node:net";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

type ListenServer = {
  address: () => net.AddressInfo | string | null;
  once: (event: "listening", listener: () => void) => void;
  on: (event: "close", listener: () => void) => void;
};

/** `localhost` в Node часто остаётся только на ::1, и 127.0.0.1 не открывается. */
function listenOnBothLocalhosts(): Plugin {
  const attach = (httpServer: ListenServer | null) => {
    if (!httpServer) return;
    const bridge = net.createServer((incoming) => {
      const address = httpServer.address();
      if (!address || typeof address === "string") {
        incoming.destroy();
        return;
      }
      const target = net.connect({ port: address.port, host: address.address });
      incoming.pipe(target);
      target.pipe(incoming);
      incoming.on("error", () => target.destroy());
      target.on("error", () => incoming.destroy());
    });
    httpServer.once("listening", () => {
      const address = httpServer.address();
      if (!address || typeof address === "string") return;
      const other = address.address === "127.0.0.1" ? "::1" : "127.0.0.1";
      bridge.listen(address.port, other);
    });
    httpServer.on("close", () => {
      bridge.close();
    });
  };

  return {
    name: "listen-on-both-localhosts",
    configureServer(server) {
      attach(server.httpServer);
    },
    configurePreviewServer(server) {
      attach(server.httpServer);
    },
  };
}

function siteBase(): string {
  const value = process.env.VITE_BASE_PATH;
  if (!value || value === "/") return "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authTarget =
    env.UPSTREAM_TARGET ||
    process.env.UPSTREAM_TARGET ||
    env.AUTH_PROXY_TARGET ||
    process.env.AUTH_PROXY_TARGET ||
    "http://localhost:3005";

  return {
    base: siteBase(),
    plugins: [react(), listenOnBothLocalhosts()],
    server: {
      host: "localhost",
      port: 4721,
      strictPort: true,
      proxy: {
        "/login": { target: authTarget, changeOrigin: true, secure: false },
        "/auth": { target: authTarget, changeOrigin: true, secure: false },
      },
    },
    preview: {
      host: "localhost",
      port: 4721,
      strictPort: true,
    },
  };
});
