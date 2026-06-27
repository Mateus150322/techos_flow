import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { existsSync, readFileSync } from "node:fs";

function loadLocalHttpsOptions(env: Record<string, string>) {
  if (env.VITE_DEV_HTTPS !== "true") {
    return undefined;
  }

  const keyPath = env.VITE_DEV_HTTPS_KEY;
  const certPath = env.VITE_DEV_HTTPS_CERT;

  if (!keyPath || !certPath || !existsSync(keyPath) || !existsSync(certPath)) {
    return undefined;
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
}

function manualChunks(moduleId: string) {
  const normalizedId = moduleId.replaceAll("\\", "/");

  if (
    normalizedId.includes("/node_modules/react/") ||
    normalizedId.includes("/node_modules/react-dom/") ||
    normalizedId.includes("/node_modules/react-router") ||
    normalizedId.includes("/node_modules/scheduler/")
  ) {
    return "vendor-react";
  }

  if (
    normalizedId.includes("/node_modules/@tanstack/") ||
    normalizedId.includes("/node_modules/dexie/")
  ) {
    return "vendor-query";
  }

  if (normalizedId.includes("/node_modules/@sentry/")) {
    return "vendor-sentry";
  }

  return undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1";
  const proxyHost = env.VITE_API_PROXY_HOST || "backend-flow.test";
  const appHost = env.VITE_APP_HOST || "localhost";
  const httpsOptions = loadLocalHttpsOptions(env);

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        includeAssets: ["techos-icon.png"],
        manifest: {
          name: "TechOS Flow",
          short_name: "TechOS Flow",
          description: "Gestão de ordens de serviço e atividades técnicas em campo.",
          lang: "pt-BR",
          theme_color: "#005ca8",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "techos-icon.png",
              sizes: "1254x1254",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
      }),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      https: httpsOptions,
      allowedHosts: [appHost, "localhost", "127.0.0.1", "techosflow.test"],
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: false,
          secure: false,
          headers: {
            host: proxyHost,
          },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      exclude: ["e2e/**", "node_modules/**", "dist/**"],
    },
  };
});
