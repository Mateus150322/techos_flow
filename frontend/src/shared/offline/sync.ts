import {
  aceitarOrdem,
  enviarAnexo,
  finalizarExecucao,
  iniciarExecucao,
  marcarNaoExecutada,
  type FinalizarExecucaoPayload,
  type GeolocalizacaoAnexoPayload,
  type IniciarExecucaoPayload,
  type MarcarNaoExecutadaPayload,
} from "@/modules/ordensServico/ordensServico.service";
import { getStoredToken, getStoredUser } from "@/shared/auth/session";
import { queryClient } from "@/shared/query/queryClient";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
  claimNextOfflineOperation,
  completeOfflineOperation,
  deleteOfflineOperation,
  failOfflineOperation,
  getOfflineOperation,
  releaseOfflineOperation,
  resetInterruptedOfflineOperations,
} from "./database";
import {
  isNetworkUnavailableError,
  notifyOfflineQueueChanged,
} from "./queue";
import type {
  OfflineOperation,
  OfflineOperationPayloadMap,
} from "./types";

class OfflineDependencyPendingError extends Error {}

let activeSync: Promise<void> | null = null;

function extractId(value: unknown, key: string) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = (value as Record<string, unknown>)[key];

  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const id = (candidate as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

async function resolveExecutionId(executionId: string) {
  if (!executionId.startsWith("offline:")) {
    return executionId;
  }

  const sourceOperationId = executionId.slice("offline:".length);
  const sourceOperation = await getOfflineOperation(sourceOperationId);
  const resolvedId = sourceOperation?.result?.executionId;

  if (!resolvedId) {
    throw new OfflineDependencyPendingError(
      "Aguardando a sincronizacao do inicio da execucao."
    );
  }

  return resolvedId;
}

async function executeOfflineOperation(operation: OfflineOperation) {
  switch (operation.type) {
    case "accept_order": {
      await aceitarOrdem(operation.orderId, operation.id);
      return undefined;
    }

    case "start_execution": {
      const response = await iniciarExecucao(
        operation.orderId,
        operation.payload as IniciarExecucaoPayload,
        operation.id
      );

      return {
        executionId: extractId(response, "execucao"),
      };
    }

    case "finish_execution": {
      const payload =
        operation.payload as OfflineOperationPayloadMap["finish_execution"];
      const executionId = await resolveExecutionId(payload.execucao_id);

      await finalizarExecucao(
        operation.orderId,
        {
          ...payload,
          execucao_id: executionId,
        } satisfies FinalizarExecucaoPayload,
        operation.id
      );
      return undefined;
    }

    case "mark_not_executed": {
      await marcarNaoExecutada(
        operation.orderId,
        operation.payload as MarcarNaoExecutadaPayload,
        operation.id
      );
      return undefined;
    }

    case "upload_attachment": {
      const payload =
        operation.payload as OfflineOperationPayloadMap["upload_attachment"];
      const file = new File([payload.file.blob], payload.file.name, {
        type: payload.file.type,
        lastModified: payload.file.lastModified,
      });
      const response = await enviarAnexo(
        operation.orderId,
        file,
        payload.metadata as string | GeolocalizacaoAnexoPayload,
        operation.id
      );

      return {
        attachmentId: extractId(response, "anexo"),
      };
    }
  }
}

async function runOfflineSync() {
  if (
    typeof navigator === "undefined" ||
    !navigator.onLine ||
    !getStoredToken()
  ) {
    return;
  }

  const user = getStoredUser("tecnico");

  if (!user.id) {
    return;
  }

  await resetInterruptedOfflineOperations(user.id);
  notifyOfflineQueueChanged();

  while (navigator.onLine && getStoredToken()) {
    const operation = await claimNextOfflineOperation(user.id);

    if (!operation) {
      break;
    }

    notifyOfflineQueueChanged();

    try {
      const result = await executeOfflineOperation(operation);
      await completeOfflineOperation(operation.id, result);

      if (operation.type !== "start_execution") {
        await deleteOfflineOperation(operation.id);
      }

      if (operation.type === "finish_execution") {
        const payload =
          operation.payload as OfflineOperationPayloadMap["finish_execution"];

        if (payload.execucao_id.startsWith("offline:")) {
          await deleteOfflineOperation(
            payload.execucao_id.slice("offline:".length)
          );
        }
      }
    } catch (error) {
      if (error instanceof OfflineDependencyPendingError) {
        await releaseOfflineOperation(operation.id);
        notifyOfflineQueueChanged();
        break;
      }

      if (isNetworkUnavailableError(error)) {
        await releaseOfflineOperation(operation.id);
        notifyOfflineQueueChanged();
        break;
      }

      await failOfflineOperation(
        operation.id,
        getApiErrorMessage(
          error,
          "Nao foi possivel sincronizar esta alteracao."
        )
      );
    }

    notifyOfflineQueueChanged();
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dashboard-tecnico"] }),
    queryClient.invalidateQueries({ queryKey: ["ordem-servico"] }),
  ]);
}

export function requestOfflineSync() {
  if (activeSync) {
    return activeSync;
  }

  activeSync = runOfflineSync().finally(() => {
    activeSync = null;
    notifyOfflineQueueChanged();
  });

  return activeSync;
}
