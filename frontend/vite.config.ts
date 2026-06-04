import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1";
  const proxyHost = env.VITE_API_PROXY_HOST || "backend-flow.test";
  const appHost = env.VITE_APP_HOST || "techosflow.test";

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: [appHost],
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
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
