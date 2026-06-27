import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OfflineOperation } from "./types";

const syncMock = vi.hoisted(() => ({
  queue: [] as OfflineOperation[],
  stored: new Map<string, OfflineOperation>(),
  aceitarOrdem: vi.fn(),
  enviarAnexo: vi.fn(),
  finalizarExecucao: vi.fn(),
  iniciarExecucao: vi.fn(),
  marcarNaoExecutada: vi.fn(),
  completeOfflineOperation: vi.fn(),
  deleteOfflineOperation: vi.fn(),
  failOfflineOperation: vi.fn(),
  releaseOfflineOperation: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@/modules/ordensServico/ordensServico.service", () => ({
  aceitarOrdem: syncMock.aceitarOrdem,
  enviarAnexo: syncMock.enviarAnexo,
  finalizarExecucao: syncMock.finalizarExecucao,
  iniciarExecucao: syncMock.iniciarExecucao,
  marcarNaoExecutada: syncMock.marcarNaoExecutada,
}));

vi.mock("@/shared/auth/session", () => ({
  getStoredToken: () => "token",
  getStoredUser: () => ({
    id: "tec-1",
    name: "Carlos",
    role: "tecnico",
  }),
}));

vi.mock("@/shared/query/queryClient", () => ({
  queryClient: {
    invalidateQueries: syncMock.invalidateQueries,
  },
}));

vi.mock("./queue", () => ({
  isNetworkUnavailableError: () => false,
  notifyOfflineQueueChanged: vi.fn(),
}));

vi.mock("./database", () => ({
  resetInterruptedOfflineOperations: vi.fn(),
  claimNextOfflineOperation: vi.fn(async () => syncMock.queue.shift()),
  getOfflineOperation: vi.fn(async (id: string) => syncMock.stored.get(id)),
  completeOfflineOperation: syncMock.completeOfflineOperation,
  deleteOfflineOperation: syncMock.deleteOfflineOperation,
  failOfflineOperation: syncMock.failOfflineOperation,
  releaseOfflineOperation: syncMock.releaseOfflineOperation,
}));

import { requestOfflineSync } from "./sync";

function operation(
  partial: Pick<OfflineOperation, "id" | "type" | "payload">
): OfflineOperation {
  return {
    ...partial,
    userId: "tec-1",
    orderId: "os-1",
    status: "syncing",
    attempts: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("offline sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncMock.queue.length = 0;
    syncMock.stored.clear();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    syncMock.invalidateQueries.mockResolvedValue(undefined);
    syncMock.completeOfflineOperation.mockImplementation(
      async (id: string, result?: { executionId?: string }) => {
        const current = syncMock.stored.get(id);

        if (current) {
          syncMock.stored.set(id, {
            ...current,
            status: "completed",
            result,
          });
        }
      }
    );
    syncMock.deleteOfflineOperation.mockImplementation(async (id: string) => {
      syncMock.stored.delete(id);
    });
  });

  it("resolve o ID temporario antes de finalizar a execucao", async () => {
    const start = operation({
      id: "11111111-1111-4111-8111-111111111111",
      type: "start_execution",
      payload: { observacao: "Inicio offline" },
    });
    const finish = operation({
      id: "22222222-2222-4222-8222-222222222222",
      type: "finish_execution",
      payload: {
        execucao_id: `offline:${start.id}`,
        diagnostico: "Falha identificada",
        procedimento: "Componente substituido",
      },
    });

    syncMock.queue.push(start, finish);
    syncMock.stored.set(start.id, start);
    syncMock.stored.set(finish.id, finish);
    syncMock.iniciarExecucao.mockResolvedValue({
      execucao: { id: "execucao-real" },
    });
    syncMock.finalizarExecucao.mockResolvedValue({});

    await requestOfflineSync();

    expect(syncMock.iniciarExecucao).toHaveBeenCalledWith(
      "os-1",
      { observacao: "Inicio offline" },
      start.id
    );
    expect(syncMock.finalizarExecucao).toHaveBeenCalledWith(
      "os-1",
      expect.objectContaining({
        execucao_id: "execucao-real",
        diagnostico: "Falha identificada",
      }),
      finish.id
    );
    expect(syncMock.deleteOfflineOperation).toHaveBeenCalledWith(start.id);
    expect(syncMock.failOfflineOperation).not.toHaveBeenCalled();
  });
});
