import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/test-utils";
import { OrdemServicoAcoesPanel } from "./OrdemServicoAcoesPanel";

const acoesMock = vi.hoisted(() => ({
  listarFuncionariosDisponiveis: vi.fn(),
}));

vi.mock("../ordensServico.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../ordensServico.service")>();

  return {
    ...actual,
    listarFuncionariosDisponiveis:
      acoesMock.listarFuncionariosDisponiveis,
  };
});

describe("OrdemServicoAcoesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acoesMock.listarFuncionariosDisponiveis.mockResolvedValue([
      {
        id: "tec-1",
        name: "Carlos Andrade",
        role: "tecnico",
        funcao: "Tecnico",
        tipo_vinculo: "usuario",
      },
    ]);
  });

  it("envia a resolucao tecnica ao finalizar a execucao", async () => {
    const onFinalizarExecucao = vi.fn().mockResolvedValue(true);

    renderWithProviders(
      <OrdemServicoAcoesPanel
        variant="page"
        status="em_execucao"
        processandoAcao={false}
        podeFinalizarExecucao
        execucaoAbertaId="exec-1"
        currentUserId="tec-1"
        currentUserName="Carlos Andrade"
        onError={vi.fn()}
        onFinalizarExecucao={onFinalizarExecucao}
      />
    );

    fireEvent.change(screen.getByRole("textbox", { name: /diagnóstico/i }), {
      target: { value: "Rolamento danificado" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: /procedimento executado/i }),
      {
        target: { value: "Substituicao do rolamento" },
      }
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /material utilizado/i }),
      {
        target: { value: "Rolamento 6204" },
      }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /finalizar execução/i })
    );

    await waitFor(() =>
      expect(onFinalizarExecucao).toHaveBeenCalledWith(
        expect.objectContaining({
          execucaoId: "exec-1",
          diagnostico: "Rolamento danificado",
          procedimento: "Substituicao do rolamento",
          materialUtilizado: "Rolamento 6204",
        })
      )
    );
  });

  it("impede a finalizacao sem diagnostico", () => {
    const onError = vi.fn();
    const onFinalizarExecucao = vi.fn().mockResolvedValue(true);

    renderWithProviders(
      <OrdemServicoAcoesPanel
        variant="page"
        status="em_execucao"
        processandoAcao={false}
        podeFinalizarExecucao
        execucaoAbertaId="exec-1"
        currentUserId="tec-1"
        currentUserName="Carlos Andrade"
        onError={onError}
        onFinalizarExecucao={onFinalizarExecucao}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /finalizar execução/i })
    );

    expect(onError).toHaveBeenCalledWith(
      "Informe o diagnóstico da execução."
    );
    expect(onFinalizarExecucao).not.toHaveBeenCalled();
  });
});
