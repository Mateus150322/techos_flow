import { useEffect, type ReactNode } from "react";

import { getStoredToken, useCurrentUser } from "@/shared/auth/session";
import { saveOfflineSession } from "./database";
import { registerOfflineBackgroundSync } from "./backgroundSync";
import { prepareOfflineStorage } from "./storage";
import { requestOfflineSync } from "./sync";

const SYNC_INTERVAL_MS = 30_000;

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser("tecnico");

  useEffect(() => {
    if (!currentUser.id) {
      return;
    }

    void prepareOfflineStorage();
    void registerOfflineBackgroundSync();
    const token = getStoredToken();

    if (token) {
      void saveOfflineSession(currentUser.id, token);
    }

    const sync = () => {
      if (navigator.onLine) {
        void requestOfflineSync();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };
    const interval = window.setInterval(sync, SYNC_INTERVAL_MS);

    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", handleVisibility);
    sync();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUser.id]);

  return children;
}
