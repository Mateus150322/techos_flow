import { useCallback, useEffect, useState } from "react";

import { useCurrentUser } from "@/shared/auth/session";
import {
  getCurrentOfflineQueueSummary,
  subscribeOfflineQueue,
} from "./queue";
import type { OfflineQueueSummary } from "./types";

const EMPTY_SUMMARY: OfflineQueueSummary = {
  pending: 0,
  syncing: 0,
  failed: 0,
};

export function useOfflineQueueStatus() {
  const currentUser = useCurrentUser("tecnico");
  const [summary, setSummary] = useState<OfflineQueueSummary>(EMPTY_SUMMARY);

  const refresh = useCallback(async () => {
    setSummary(await getCurrentOfflineQueueSummary(currentUser.id));
  }, [currentUser.id]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refresh();
    }, 0);
    const unsubscribe = subscribeOfflineQueue(() => {
      void refresh();
    });

    return () => {
      window.clearTimeout(initialRefresh);
      unsubscribe();
    };
  }, [refresh]);

  return summary;
}
