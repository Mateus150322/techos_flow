import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import HorasExtrasPage from "./HorasExtrasPage";
import { renderWithProviders } from "@/test/test-utils";
import type { HorasExtrasResponse } from "./horasExtras.service";

const horasExtrasServiceMock = vi.hoisted(() => ({
  atualizarAprovacaoHorasExtras: vi.fn(),
  buscarRelatorioHorasExtras: vi.fn(),
  exportarRelatorioHorasExtras: vi.fn(),
  fecharCompetenciaHorasExtras: vi.fn(),
  reabrirCompetenciaHorasExtras: vi.fn(),
}));

vi.mock("./horasExtras.service", () => ({
  atualizarAprovacaoHorasExtras:
    horasExtrasServiceMock.atualizarAprovacaoHorasExtras,
  buscarRelatorioHorasExtras: horasExtrasServiceMock.buscarRelatorioHorasExtras,
  exportarRelatorioHorasExtras:
    horasExtrasServiceMock.exportarRelatorioHorasExtras,
  fecharCompetenciaHorasExtras:
    horasExtrasServiceMock.fecharCompetenciaHorasExtras,
  reabrirCompetenciaHorasExtras:
    horasExtrasServiceMock.reabrirCompetenciaHorasExtras,
}));

vi.mock("@/shared/auth/session", () => ({
  useCurrentUser: () => ({
    id: "admin-1",
    name: "Admin Teste",
    email: "admin@teste.com",
    role: "administrador",
    must_change_password: false,
  }),
}));

const responseMock: HorasExtrasResponse = {
  resumo: {
    total_funcionarios: 1,
    total_horas_extras_50_minutos: 120,
    total_horas_extras_50: "2h00",
    total_horas_extras_100_minutos: 60,
    total_horas_extras_100: "1h00",
    total_extras_minutos: 180,
    total_extras: "3h00",
    total_horas_pagas_minutos: 180,
    total_horas_pagas: "3h00",
    total_horas_convertidas_folga_minutos: 0,
    total_horas_convertidas_folga: "0h00",
    total_dias_folga_gerados: 0,
    saldo_total_banco_minutos: 0,
    saldo_total_banco: "0h00",
    total_estimado_financeiro: 150,
    total_minutos_feriados: 60,
    total_feriados: "1h00",
    total_minutos_pontos_facultativos: 0,
    total_pontos_facultativos: "0h00",
    total_minutos_fins_semana: 0,
    total_fins_semana: "0h00",
    total_minutos_plantao: 120,
    total_plantao: "2h00",
  },
  aprovacao: {
    pendentes: 1,
    aprovadas: 0,
    reprovadas: 0,
    status_geral: "pendente",
  },
  fechamento: {
    status: "aberta",
    id: null,
    competencia: "2026-05",
    fechado_em: null,
    fechado_por: null,
    observacao: null,
  },
  indicadores: {
    top_funcionarios: [
      {
        funcionario_id: "tec-1",
        funcionario_nome: "Carlos Andrade",
        funcao: "Técnico",
        total_extras_minutos: 180,
        total_extras: "3h00",
      },
    ],
  },
  funcionarios: [
    {
      id: "tec-1",
      name: "Carlos Andrade",
      role: "tecnico",
      funcao: "Técnico",
      tipo_vinculo: "usuario",
    },
  ],
  rows: [
    {
      funcionario_id: "tec-1",
      funcionario_nome: "Carlos Andrade",
      role: "tecnico",
      funcao: "Técnico",
      tipo_vinculo: "usuario",
      horas_extras_50_minutos: 120,
      horas_extras_50: "2h00",
      horas_extras_100_minutos: 60,
      horas_extras_100: "1h00",
      total_extras_minutos: 180,
      total_extras: "3h00",
      horas_pagas_minutos: 180,
      horas_pagas: "3h00",
      horas_convertidas_folga_minutos: 0,
      horas_convertidas_folga: "0h00",
      dias_folga_gerados: 0,
      saldo_banco_minutos: 0,
      saldo_banco: "0h00",
      valor_estimado_financeiro: 150,
      minutos_feriados: 60,
      minutos_pontos_facultativos: 0,
      minutos_fins_semana: 0,
      minutos_plantao: 120,
      horas_feriados: "1h00",
      horas_pontos_facultativos: "0h00",
      horas_fins_semana: "0h00",
      horas_plantao: "2h00",
      aprovacao_status: "pendente",
      aprovacao_pendentes: 1,
      aprovacao_aprovadas: 0,
      aprovacao_reprovadas: 0,
    },
  ],
  pagination: {
    page: 1,
    per_page: 20,
    last_page: 1,
    total: 1,
  },
  periodo_descricao: "Maio de 2026",
  data_emissao: "08/05/2026",
};

describe("HorasExtrasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    horasExtrasServiceMock.buscarRelatorioHorasExtras.mockResolvedValue(
      responseMock
    );
    horasExtrasServiceMock.exportarRelatorioHorasExtras.mockResolvedValue({
      blob: new Blob(["teste"]),
      fileName: "horas-extras.pdf",
    });
  });

  it("renderiza o relatório sem violações básicas de acessibilidade", async () => {
    const { container } = renderWithProviders(<HorasExtrasPage />, {
      route: "/admin/horas-extras",
    });

    expect(
      await screen.findByRole("heading", {
        name: /consolidado por funcion/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /aplicar filtros/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: /r\$ 150,00/i })
    ).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
