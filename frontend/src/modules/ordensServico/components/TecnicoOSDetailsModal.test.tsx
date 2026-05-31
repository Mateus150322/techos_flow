import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import TecnicoOSDetailsModal from "./TecnicoOSDetailsModal";
import { renderWithProviders } from "@/test/test-utils";

const modalMock = vi.hoisted(() => ({
  exportarRelatorioDetalhadoOrdem: vi.fn(),
  useOrdemServicoDetalhe: vi.fn(),
}));

vi.mock("../ordensServico.service", () => ({
  exportarRelatorioDetalhadoOrdem:
    modalMock.exportarRelatorioDetalhadoOrdem,
}));

vi.mock("../useOrdemServicoDetalhe", () => ({
  useOrdemServicoDetalhe: modalMock.useOrdemServicoDetalhe,
}));

vi.mock("./AnexoItemCard", () => ({
  AnexoItemCard: ({ anexo }: { anexo: { id: string } }) => (
    <div>Evidência {anexo.id}</div>
  ),
}));

vi.mock("./EvidenciaUploadPanel", () => ({
  EvidenciaUploadPanel: () => <div>Painel de evidência</div>,
}));

vi.mock("./OrdemServicoAcoesPanel", () => ({
  OrdemServicoAcoesPanel: () => <div>Ações da OS</div>,
}));

describe("TecnicoOSDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modalMock.useOrdemServicoDetalhe.mockReturnValue({
      currentUser: {
        id: "tec-1",
        name: "Carlos Andrade",
        role: "tecnico",
      },
      loading: false,
      error: "",
      setError: vi.fn(),
      os: {
        id: "os-1",
        numero: "2026-000001",
        tipo: "Reparo",
        nome_cliente: "João da Silva",
        status: "aberta",
        prioridade: 1,
        data_abertura: "2026-05-08T10:00:00",
        data_encerramento: null,
        descricao: "Reparo em rede de água",
        endereco: {
          rua: "Rua Principal",
          numero: "100",
          bairro: "Centro",
          cidade: "Rio Branco",
          estado: "AC",
          cep: "69900-000",
        },
        execucoes: [],
        anexos: [],
      },
      criadaPor: {
        name: "Atendente Teste",
        email: "atendente@teste.com",
      },
      tecnicoResponsavel: null,
      ultimaExecucaoAberta: null,
      execucaoParaFinalizacao: null,
      osSemResponsavel: true,
      osEhMinha: false,
      osEhDeOutroTecnico: false,
      podeAceitar: true,
      podeIniciarExecucao: false,
      podeFinalizarExecucao: false,
      podeMarcarNaoExecutada: false,
      podeEnviarAnexo: false,
      processandoAcao: false,
      arquivoSelecionado: [],
      setArquivoSelecionado: vi.fn(),
      tipoAnexo: "foto",
      selecionarTipoAnexo: vi.fn(),
      incluirGeolocalizacao: true,
      alternarIncluirGeolocalizacao: vi.fn(),
      processandoGeolocalizacao: false,
      geolocalizacaoCapturada: null,
      atualizarEnderecoCapturado: vi.fn(),
      aceitar: vi.fn().mockResolvedValue(true),
      iniciar: vi.fn().mockResolvedValue(true),
      finalizar: vi.fn().mockResolvedValue(true),
      marcarComoNaoExecutada: vi.fn().mockResolvedValue(true),
      capturarGeolocalizacao: vi.fn().mockResolvedValue(null),
      enviarEvidencia: vi.fn().mockResolvedValue(true),
    });
    modalMock.exportarRelatorioDetalhadoOrdem.mockResolvedValue({
      blob: new Blob(["pdf"]),
      fileName: "relatorio.pdf",
    });
  });

  it("renderiza como diálogo acessível e fecha com Escape", async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <TecnicoOSDetailsModal
        ordemId="os-1"
        open
        onClose={onClose}
      />
    );

    expect(
      screen.getByRole("dialog", { name: /2026-000001/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /fechar detalhes da ordem de serviço/i })
    ).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
