import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { TabelaOrdensSection } from "./TabelaOrdensSection";
import { renderWithProviders } from "@/test/test-utils";
import type { OrdemServico } from "../ordensServico.service";

const ordemExemplo: OrdemServico = {
  id: "os-1",
  numero: "2026-000001",
  tipo: "Reparo",
  nome_cliente: "João da Silva",
  status: "aberta",
  prioridade: 1,
  data_abertura: "2026-05-08T10:00:00",
  data_encerramento: null,
  descricao: "Reparo em rede de água",
};

describe("TabelaOrdensSection", () => {
  it("renderiza tabela operacional sem violações básicas de acessibilidade", async () => {
    const onVer = vi.fn();
    const { container } = renderWithProviders(
      <TabelaOrdensSection
        titulo="Abertas"
        descricao="Ordens aguardando aceite."
        ordens={[ordemExemplo]}
        loading={false}
        onVer={onVer}
        formatarData={() => "08/05/2026"}
        nomeResponsavel={() => "Sem responsável"}
      />
    );

    expect(
      screen.getByText(/abertas\. ordens aguardando aceite\./i)
    ).toHaveClass("sr-only");
    expect(
      screen.getByRole("button", {
        name: /ver detalhes da ordem de serviço 2026-000001/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /sem responsável/i })).toBeInTheDocument();
    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
