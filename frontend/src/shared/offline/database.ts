import Dexie, { type Table } from "dexie";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import type {
  OfflineOperation,
  OfflineOperationResult,
  OfflineOperationStatus,
  OfflineQueueSummary,
} from "./types";

type QueryCacheEntry = {
  id: "field-query-cache";
  client: PersistedClient;
};

type DraftEntry = {
  id: string;
  value: unknown;
  updatedAt: number;
};

type OfflineSessionEntry = {
  id: "active";
  userId: string;
  token: string;
  expiresAt?: string | null;
};

class TechOSOfflineDatabase extends Dexie {
  queryCache!: Table<QueryCacheEntry, QueryCacheEntry["id"]>;
  drafts!: Table<DraftEntry, DraftEntry["id"]>;
  operations!: Table<OfflineOperation, OfflineOperation["id"]>;
  session!: Table<OfflineSessionEntry, OfflineSessionEntry["id"]>;

  constructor() {
    super("techos-flow-offline");
    this.version(1).stores({
      queryCache: "id",
    });
    this.version(2).stores({
      queryCache: "id",
      drafts: "id,updatedAt",
    });
    this.version(3).stores({
      queryCache: "id",
      drafts: "id,updatedAt",
      operations: "id,userId,orderId,status,createdAt,[userId+status]",
    });
    this.version(4).stores({
      queryCache: "id",
      drafts: "id,updatedAt",
      operations: "id,userId,orderId,status,createdAt,[userId+status]",
      session: "id,userId",
    });
  }
}

const offlineDatabase = new TechOSOfflineDatabase();
const QUERY_CACHE_ID = "field-query-cache" as const;

function indexedDbDisponivel() {
  return typeof indexedDB !== "undefined";
}

export const fieldQueryPersister: Persister = {
  async persistClient(client) {
    if (!indexedDbDisponivel()) {
      return;
    }

    await offlineDatabase.queryCache.put({
      id: QUERY_CACHE_ID,
      client,
    });
  },

  async restoreClient() {
    if (!indexedDbDisponivel()) {
      return undefined;
    }

    return (await offlineDatabase.queryCache.get(QUERY_CACHE_ID))?.client;
  },

  async removeClient() {
    if (!indexedDbDisponivel()) {
      return;
    }

    await offlineDatabase.queryCache.delete(QUERY_CACHE_ID);
  },
};

export async function clearPersistedFieldData() {
  await fieldQueryPersister.removeClient();
}

export async function loadDraft<T>(id: string) {
  if (!indexedDbDisponivel()) {
    return undefined;
  }

  return (await offlineDatabase.drafts.get(id))?.value as T | undefined;
}

export async function saveDraft<T>(id: string, value: T) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.drafts.put({
    id,
    value,
    updatedAt: Date.now(),
  });
}

export async function removeDraft(id: string) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.drafts.delete(id);
}

export async function clearUserDrafts(userId?: string) {
  if (!indexedDbDisponivel() || !userId) {
    return;
  }

  await offlineDatabase.drafts
    .filter((draft) => draft.id.includes(`:${userId}`))
    .delete();
}

export async function saveOfflineSession(
  userId: string,
  token: string,
  expiresAt?: string | null
) {
  if (!indexedDbDisponivel()) {
    return;
  }

  const current = await offlineDatabase.session.get("active");

  await offlineDatabase.session.put({
    id: "active",
    userId,
    token,
    expiresAt: expiresAt === undefined ? current?.expiresAt : expiresAt,
  });
}

export async function clearOfflineSession() {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.session.delete("active");
}

export async function putOfflineOperation(operation: OfflineOperation) {
  if (!indexedDbDisponivel()) {
    throw new Error("O armazenamento offline nao esta disponivel neste aparelho.");
  }

  await offlineDatabase.operations.put(operation);
}

export async function getOfflineOperation(id: string) {
  if (!indexedDbDisponivel()) {
    return undefined;
  }

  return offlineDatabase.operations.get(id);
}

export async function claimNextOfflineOperation(userId: string) {
  if (!indexedDbDisponivel()) {
    return undefined;
  }

  return offlineDatabase.transaction(
    "rw",
    offlineDatabase.operations,
    async () => {
      const pending = await offlineDatabase.operations
        .where("[userId+status]")
        .equals([userId, "pending"])
        .sortBy("createdAt");
      const operation = pending[0];

      if (!operation) {
        return undefined;
      }

      const updatedAt = Date.now();

      await offlineDatabase.operations.update(operation.id, {
        status: "syncing",
        attempts: operation.attempts + 1,
        updatedAt,
        lastError: undefined,
      });

      return {
        ...operation,
        status: "syncing" as const,
        attempts: operation.attempts + 1,
        updatedAt,
        lastError: undefined,
      };
    }
  );
}

export async function updateOfflineOperation(
  id: string,
  changes: Partial<
    Pick<
      OfflineOperation,
      "payload" | "status" | "updatedAt" | "lastError" | "result"
    >
  >
) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.operations.update(id, changes);
}

export async function completeOfflineOperation(
  id: string,
  result?: OfflineOperationResult
) {
  await updateOfflineOperation(id, {
    status: "completed",
    updatedAt: Date.now(),
    lastError: undefined,
    result,
  });
}

export async function deleteOfflineOperation(id: string) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.operations.delete(id);
}

export async function failOfflineOperation(id: string, message: string) {
  await updateOfflineOperation(id, {
    status: "failed",
    updatedAt: Date.now(),
    lastError: message,
  });
}

export async function releaseOfflineOperation(id: string) {
  await updateOfflineOperation(id, {
    status: "pending",
    updatedAt: Date.now(),
    lastError: undefined,
  });
}

export async function resetInterruptedOfflineOperations(userId: string) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.operations
    .where("[userId+status]")
    .equals([userId, "syncing"])
    .modify({
      status: "pending" as OfflineOperationStatus,
      updatedAt: Date.now(),
    });
}

export async function retryFailedOfflineOperations(userId: string) {
  if (!indexedDbDisponivel()) {
    return;
  }

  await offlineDatabase.operations
    .where("[userId+status]")
    .equals([userId, "failed"])
    .modify({
      status: "pending" as OfflineOperationStatus,
      updatedAt: Date.now(),
      lastError: undefined,
    });
}

export async function getOfflineQueueSummary(
  userId: string
): Promise<OfflineQueueSummary> {
  if (!indexedDbDisponivel()) {
    return { pending: 0, syncing: 0, failed: 0 };
  }

  const [pending, syncing, failed] = await Promise.all([
    offlineDatabase.operations
      .where("[userId+status]")
      .equals([userId, "pending"])
      .count(),
    offlineDatabase.operations
      .where("[userId+status]")
      .equals([userId, "syncing"])
      .count(),
    offlineDatabase.operations
      .where("[userId+status]")
      .equals([userId, "failed"])
      .count(),
  ]);

  return { pending, syncing, failed };
}
