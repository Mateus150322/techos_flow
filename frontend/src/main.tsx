import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import AppRouter from "./app/router";
import { ConnectionStatusBanner } from "./shared/components/ConnectionStatusBanner";
import { ThemeProvider } from "./shared/hooks/ThemeProvider";
import { OfflineSyncProvider } from "./shared/offline/OfflineSyncProvider";
import { QueryProvider } from "./shared/query/QueryProvider";
import "./index.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "TECHOS_OFFLINE_SYNC_COMPLETE") {
      window.dispatchEvent(new Event("techosflow:offline-queue-changed"));
    }
  });
}

const sentryDsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();

Sentry.init({
  dsn: sentryDsn || undefined,
  enabled: Boolean(sentryDsn),
  environment:
    (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ||
    import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
  sendDefaultPii: false,
  tracesSampleRate: Number(
    (import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined) || "0.1"
  ),
  integrations: sentryDsn ? [Sentry.browserTracingIntegration()] : [],
});

ReactDOM.createRoot(document.getElementById("root")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <React.StrictMode>
    <QueryProvider>
      <OfflineSyncProvider>
        <ThemeProvider>
          <ConnectionStatusBanner />
          <AppRouter />
        </ThemeProvider>
      </OfflineSyncProvider>
    </QueryProvider>
  </React.StrictMode>
);
