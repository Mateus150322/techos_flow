import type {
  FinalizarExecucaoPayload,
  GeolocalizacaoAnexoPayload,
  IniciarExecucaoPayload,
  MarcarNaoExecutadaPayload,
} from "@/modules/ordensServico/ordensServico.service";

export type OfflineOperationStatus =
  | "pending"
  | "syncing"
  | "failed"
  | "completed";

export type OfflineOperationType =
  | "accept_order"
  | "start_execution"
  | "finish_execution"
  | "mark_not_executed"
  | "upload_attachment";

export type StoredOfflineFile = {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
};

export type OfflineOperationPayloadMap = {
  accept_order: Record<string, never>;
  start_execution: IniciarExecucaoPayload;
  finish_execution: FinalizarExecucaoPayload;
  mark_not_executed: MarcarNaoExecutadaPayload;
  upload_attachment: {
    file: StoredOfflineFile;
    metadata: string | GeolocalizacaoAnexoPayload;
  };
};

export type OfflineOperationResult = {
  executionId?: string;
  attachmentId?: string;
};

export type OfflineOperation = {
  id: string;
  userId: string;
  orderId: string;
  type: OfflineOperationType;
  payload: OfflineOperationPayloadMap[OfflineOperationType];
  status: OfflineOperationStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  result?: OfflineOperationResult;
};

export type OfflineQueueSummary = {
  pending: number;
  syncing: number;
  failed: number;
};
