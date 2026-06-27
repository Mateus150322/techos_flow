const BACKGROUND_SYNC_TAG = "techos-flow-sync";

export async function registerOfflineBackgroundSync() {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const syncManager = (
      registration as ServiceWorkerRegistration & {
        sync?: { register(tag: string): Promise<void> };
      }
    ).sync;

    if (!syncManager) {
      return false;
    }

    await syncManager.register(BACKGROUND_SYNC_TAG);

    return true;
  } catch {
    return false;
  }
}

export { BACKGROUND_SYNC_TAG };
