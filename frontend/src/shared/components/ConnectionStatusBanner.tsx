import { Loader2, RefreshCw, WifiOff } from "lucide-react";

import { useCurrentUser } from "@/shared/auth/session";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { retryOfflineQueue } from "@/shared/offline/queue";
import { requestOfflineSync } from "@/shared/offline/sync";
import { useOfflineQueueStatus } from "@/shared/offline/useOfflineQueueStatus";

export function ConnectionStatusBanner() {
  const online = useOnlineStatus();
  const currentUser = useCurrentUser("tecnico");
  const summary = useOfflineQueueStatus();
  const queued = summary.pending + summary.syncing;

  if (online && queued === 0 && summary.failed === 0) {
    return null;
  }

  async function handleRetry() {
    if (!currentUser.id) {
      return;
    }

    await retryOfflineQueue(currentUser.id);
    await requestOfflineSync();
  }

  const tone = summary.failed > 0
    ? "border-red-300 bg-red-50 text-red-950"
    : online
      ? "border-blue-300 bg-blue-50 text-blue-950"
      : "border-amber-300 bg-amber-50 text-amber-950";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-[80] border-b px-4 py-2 shadow-sm ${tone}`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-sm font-medium">
        {summary.syncing > 0 ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : online ? (
          <RefreshCw className="h-4 w-4 shrink-0" />
        ) : (
          <WifiOff className="h-4 w-4 shrink-0" />
        )}
        <span>
          {summary.failed > 0
            ? `${summary.failed} alteração(ões) precisam de atenção.`
            : summary.syncing > 0
              ? `Sincronizando ${queued} alteração(ões)...`
              : queued > 0
                ? `Sem internet. ${queued} alteração(ões) salva(s) neste aparelho.`
                : "Sem internet. Exibindo os dados salvos neste aparelho."}
        </span>
        {summary.failed > 0 && online && currentUser.id ? (
          <button
            type="button"
            onClick={() => void handleRetry()}
            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-current px-2 py-1 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        ) : null}
      </div>
    </div>
  );
}
