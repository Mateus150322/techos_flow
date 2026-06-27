export type OfflineStorageStatus = {
  persistent: boolean | null;
  usage?: number;
  quota?: number;
};

export async function prepareOfflineStorage(): Promise<OfflineStorageStatus> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { persistent: null };
  }

  let persistent: boolean | null = null;

  try {
    persistent = navigator.storage.persist
      ? await navigator.storage.persist()
      : null;
  } catch {
    persistent = null;
  }

  try {
    const estimate = await navigator.storage.estimate();

    return {
      persistent,
      usage: estimate.usage,
      quota: estimate.quota,
    };
  } catch {
    return { persistent };
  }
}
