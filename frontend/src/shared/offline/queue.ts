import type {
  OfflineOperation,
  OfflineOperationPayloadMap,
  OfflineOperationType,
} from "./types";
import {
  getOfflineQueueSummary,
  putOfflineOperation,
  retryFailedOfflineOperations,
} from "./database";
import { registerOfflineBackgroundSync } from "./backgroundSync";

export const OFFLINE_QUEUE_EVENT = "techosflow:offline-queue-changed";

function createOperationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (digit) =>
    (
      Number(digit) ^
      (Math.random() * 16) >> (Number(digit) / 4)
    ).toString(16)
  );
}

export function notifyOfflineQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENT));
  }
}

export function subscribeOfflineQueue(listener: () => void) {
  window.addEventListener(OFFLINE_QUEUE_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(OFFLINE_QUEUE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export async function enqueueOfflineOperation<T extends OfflineOperationType>({
  userId,
  orderId,
  type,
  payload,
}: {
  userId: string;
  orderId: string;
  type: T;
  payload: OfflineOperationPayloadMap[T];
}) {
  const now = Date.now();
  const operation: OfflineOperation = {
    id: createOperationId(),
    userId,
    orderId,
    type,
    payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  await putOfflineOperation(operation);
  void registerOfflineBackgroundSync();
  notifyOfflineQueueChanged();

  return operation;
}

export async function getCurrentOfflineQueueSummary(userId?: string) {
  if (!userId) {
    return { pending: 0, syncing: 0, failed: 0 };
  }

  return getOfflineQueueSummary(userId);
}

export async function retryOfflineQueue(userId: string) {
  await retryFailedOfflineOperations(userId);
  notifyOfflineQueueChanged();
}

export function isNetworkUnavailableError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as {
    code?: string;
    message?: string;
    response?: unknown;
  };
  const code = String(record.code ?? "").toUpperCase();
  const message = String(record.message ?? "").toLowerCase();

  return (
    !record.response &&
    (code === "ERR_NETWORK" ||
      code === "ECONNREFUSED" ||
      code === "ENOTFOUND" ||
      message.includes("network error") ||
      message.includes("failed to fetch") ||
      message.includes("load failed"))
  );
}
