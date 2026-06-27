/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<unknown>;
};

const DATABASE_NAME = "techos-flow-offline";
const SYNC_TAG = "techos-flow-sync";
const API_BASE_URL = "/api/v1";

type OfflineSession = {
  id: "active";
  userId: string;
  token: string;
  expiresAt?: string | null;
};

type OfflineOperation = {
  id: string;
  userId: string;
  orderId: string;
  type:
    | "accept_order"
    | "start_execution"
    | "finish_execution"
    | "mark_not_executed"
    | "upload_attachment";
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "failed" | "completed";
  attempts: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  result?: {
    executionId?: string;
    attachmentId?: string;
  };
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/pulse(?:\/|$)/, /^\/up$/],
  })
);

self.addEventListener(
  "sync",
  ((event: ExtendableEvent & { tag: string }) => {
    if (event.tag === SYNC_TAG) {
      event.waitUntil(syncOfflineQueue());
    }
  }) as EventListener
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

async function syncOfflineQueue() {
  const database = await openDatabase();
  const session = await getRecord<OfflineSession>(database, "session", "active");

  if (
    !session ||
    (session.expiresAt && Date.parse(session.expiresAt) <= Date.now())
  ) {
    return;
  }

  const operations = (await getAllRecords<OfflineOperation>(database, "operations"))
    .filter(
      (operation) =>
        operation.userId === session.userId &&
        (operation.status === "pending" || operation.status === "syncing")
    )
    .sort((left, right) => left.createdAt - right.createdAt);

  for (const operation of operations) {
    await updateOperation(database, operation.id, {
      status: "syncing",
      attempts: operation.attempts + 1,
      updatedAt: Date.now(),
      lastError: undefined,
    });

    try {
      const result = await executeOperation(database, session, operation);

      if (operation.type === "start_execution") {
        await updateOperation(database, operation.id, {
          status: "completed",
          updatedAt: Date.now(),
          result,
        });
      } else {
        await deleteRecord(database, "operations", operation.id);
      }

      if (operation.type === "finish_execution") {
        const executionId = String(operation.payload.execucao_id ?? "");

        if (executionId.startsWith("offline:")) {
          await deleteRecord(
            database,
            "operations",
            executionId.slice("offline:".length)
          );
        }
      }
    } catch (error) {
      if (error instanceof TypeError) {
        await updateOperation(database, operation.id, {
          status: "pending",
          updatedAt: Date.now(),
          lastError: undefined,
        });
        throw error;
      }

      await updateOperation(database, operation.id, {
        status: "failed",
        updatedAt: Date.now(),
        lastError:
          error instanceof Error
            ? error.message
            : "Não foi possível sincronizar esta alteração.",
      });
    }
  }

  await notifyClients();
}

async function executeOperation(
  database: IDBDatabase,
  session: OfflineSession,
  operation: OfflineOperation
) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${session.token}`,
  };
  let response: Response;

  switch (operation.type) {
    case "accept_order":
      response = await postJson(
        `${API_BASE_URL}/ordens-servico/${operation.orderId}/aceitar`,
        { client_operation_id: operation.id },
        headers
      );
      break;

    case "start_execution":
      response = await postJson(
        `${API_BASE_URL}/ordens-servico/${operation.orderId}/iniciar`,
        { ...operation.payload, client_operation_id: operation.id },
        headers
      );
      break;

    case "finish_execution": {
      const payload = { ...operation.payload };
      const executionId = String(payload.execucao_id ?? "");

      if (executionId.startsWith("offline:")) {
        const sourceOperation = await getRecord<OfflineOperation>(
          database,
          "operations",
          executionId.slice("offline:".length)
        );
        const resolvedId = sourceOperation?.result?.executionId;

        if (!resolvedId) {
          throw new Error("Aguardando a sincronização do início da execução.");
        }

        payload.execucao_id = resolvedId;
      }

      response = await postJson(
        `${API_BASE_URL}/ordens-servico/${operation.orderId}/execucoes/finalizar`,
        { ...payload, client_operation_id: operation.id },
        headers
      );
      break;
    }

    case "mark_not_executed":
      response = await postJson(
        `${API_BASE_URL}/ordens-servico/${operation.orderId}/nao-executada`,
        { ...operation.payload, client_operation_id: operation.id },
        headers
      );
      break;

    case "upload_attachment": {
      const file = operation.payload.file as {
        blob: Blob;
        name: string;
        type: string;
      };
      const metadata = operation.payload.metadata;
      const formData = new FormData();
      formData.append(
        "arquivo",
        new File([file.blob], file.name, { type: file.type })
      );

      if (typeof metadata === "string") {
        formData.append("tipo", metadata);
      } else if (metadata && typeof metadata === "object") {
        for (const [key, value] of Object.entries(metadata)) {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        }
      }

      formData.append("client_operation_id", operation.id);
      response = await fetch(
        `${API_BASE_URL}/ordens-servico/${operation.orderId}/anexos`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );
      break;
    }
  }

  const data = await parseResponse(response);

  return {
    executionId: extractNestedId(data, "execucao"),
    attachmentId: extractNestedId(data, "anexo"),
  };
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string>
) {
  return fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function parseResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : `Falha na sincronização (${response.status}).`
    );
  }

  return data;
}

function extractNestedId(data: Record<string, unknown>, key: string) {
  const nested = data[key];

  if (!nested || typeof nested !== "object") {
    return undefined;
  }

  const id = (nested as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getRecord<T>(database: IDBDatabase, storeName: string, key: IDBValidKey) {
  return new Promise<T | undefined>((resolve, reject) => {
    const request = database
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

function getAllRecords<T>(database: IDBDatabase, storeName: string) {
  return new Promise<T[]>((resolve, reject) => {
    const request = database
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

function updateOperation(
  database: IDBDatabase,
  id: string,
  changes: Partial<OfflineOperation>
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("operations", "readwrite");
    const store = transaction.objectStore("operations");
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        store.put({ ...request.result, ...changes });
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function deleteRecord(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey
) {
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function notifyClients() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clients) {
    client.postMessage({ type: "TECHOS_OFFLINE_SYNC_COMPLETE" });
  }
}
