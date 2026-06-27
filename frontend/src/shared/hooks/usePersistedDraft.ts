import { useCallback, useEffect, useState } from "react";

import {
  loadDraft,
  removeDraft,
  saveDraft,
} from "@/shared/offline/database";

export function usePersistedDraft<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [restoredKey, setRestoredKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void loadDraft<T>(key)
      .then((draft) => {
        if (active && draft !== undefined) {
          setValue(draft);
        }
      })
      .finally(() => {
        if (active) {
          setRestoredKey(key);
        }
      });

    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (restoredKey !== key) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveDraft(key, value);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [key, restoredKey, value]);

  const clearDraft = useCallback(
    async (nextValue: T) => {
      await removeDraft(key);
      setValue(nextValue);
      setRestoredKey(key);
    },
    [key]
  );

  return {
    value,
    setValue,
    clearDraft,
  };
}
