import {
  getTecnicoResponsavel,
  type OrdemServico,
  type OrdemStatus,
} from "@/modules/ordensServico/ordensServico.service";

export type TipoRelatorio =
  | "geral"
  | "status"
  | "produtividade"
  | "tipo"
  | "periodo";

export type FiltrosRelatorio = {
  tipoRelatorio: TipoRelatorio;
  status: OrdemStatus | "todos";
  tipo: string;
  prioridade: string;
  tecnicoId: string;
  dataInicio: string;
  dataFim: string;
};

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportRow = Record<string, string>;

export type ReportDefinition = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

export type TecnicoFiltro = {
  id: string;
  name: string;
};

export type ResumoRelatorios = {
  total: number;
  abertas: number;
  emExecucao: number;
  finalizadas: number;
  naoExecutadas: number;
  canceladas: number;
};

export type ProdutividadeTecnico = {
  tecnico: string;
  aceitas: number;
  iniciadas: number;
  finalizadas: number;
  naoExecutadas: number;
};

export type TipoMaisFrequente = {
  tipo: string;
  quantidade: number;
  percentual: number;
};

export type StatusResumoItem = {
  status: string;
  quantidade: number;
  percentual: number;
};

export const INITIAL_FILTERS: FiltrosRelatorio = {
  tipoRelatorio: "geral",
  status: "todos",
  tipo: "todos",
  prioridade: "todas",
  tecnicoId: "todos",
  dataInicio: "",
  dataFim: "",
};

export function getTiposFromOrdens(orders: OrdemServico[]) {
  return Array.from(new Set(orders.map((order) => order.tipo).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getTecnicosFromOrdens(orders: OrdemServico[]): TecnicoFiltro[] {
  const grouped = new Map<string, string>();

  for (const ordem of orders) {
    const tecnico = getTecnicoResponsavel(ordem);

    if (tecnico?.id && tecnico.name) {
      grouped.set(tecnico.id, tecnico.name);
    }
  }

  return Array.from(grouped.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filtrarOrdens(orders: OrdemServico[], filtrosAplicados: FiltrosRelatorio) {
  return orders.filter((order) => {
    const statusOk =
      filtrosAplicados.status === "todos" || order.status === filtrosAplicados.status;
    const tipoOk = filtrosAplicados.tipo === "todos" || order.tipo === filtrosAplicados.tipo;
    const prioridadeOk =
      filtrosAplicados.prioridade === "todas" ||
      String(order.prioridade) === filtrosAplicados.prioridade;
    const tecnico = getTecnicoResponsavel(order);
    const tecnicoOk =
      filtrosAplicados.tecnicoId === "todos" || tecnico?.id === filtrosAplicados.tecnicoId;

    const dataAbertura = order.data_abertura ? new Date(order.data_abertura) : null;
    const inicioOk =
      !filtrosAplicados.dataInicio ||
      (dataAbertura && dataAbertura >= new Date(filtrosAplicados.dataInicio));
    const fimOk =
      !filtrosAplicados.dataFim ||
      (dataAbertura && dataAbertura <= new Date(`${filtrosAplicados.dataFim}T23:59:59`));

    return (
      statusOk &&
      tipoOk &&
      prioridadeOk &&
      tecnicoOk &&
      Boolean(inicioOk) &&
      Boolean(fimOk)
    );
  });
}

export function calcularResumo(ordensFiltradas: OrdemServico[]): ResumoRelatorios {
  return {
    total: ordensFiltradas.length,
    abertas: ordensFiltradas.filter((item) => item.status === "aberta").length,
    emExecucao: ordensFiltradas.filter((item) => item.status === "em_execucao").length,
    finalizadas: ordensFiltradas.filter((item) => item.status === "finalizada").length,
    naoExecutadas: ordensFiltradas.filter((item) => item.status === "nao_executada").length,
    canceladas: ordensFiltradas.filter((item) => item.status === "cancelada").length,
  };
}

export function calcularProdutividadeTecnicos(ordensFiltradas: OrdemServico[]) {
  const grouped = new Map<string, ProdutividadeTecnico>();

  for (const ordem of ordensFiltradas) {
    const tecnico = getTecnicoResponsavel(ordem);

    if (!tecnico?.id) {
      continue;
    }

    const atual = grouped.get(tecnico.id) ?? {
      tecnico: tecnico.name,
      aceitas: 0,
      iniciadas: 0,
      finalizadas: 0,
      naoExecutadas: 0,
    };

    atual.aceitas += 1;

    if (ordem.status === "em_execucao") {
      atual.iniciadas += 1;
    }

    if (ordem.status === "finalizada") {
      atual.finalizadas += 1;
    }

    if (ordem.status === "nao_executada") {
      atual.naoExecutadas += 1;
    }

    grouped.set(tecnico.id, atual);
  }

  return Array.from(grouped.values()).sort((a, b) => b.finalizadas - a.finalizadas);
}

export function calcularTiposMaisFrequentes(
  ordensFiltradas: OrdemServico[],
  totalOrdens: number
) {
  const grouped = new Map<string, number>();

  for (const ordem of ordensFiltradas) {
    grouped.set(ordem.tipo, (grouped.get(ordem.tipo) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([tipo, quantidade]) => ({
      tipo,
      quantidade,
      percentual: totalOrdens ? Math.round((quantidade / totalOrdens) * 100) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

export function calcularStatusResumo(resumo: ResumoRelatorios): StatusResumoItem[] {
  return [
    {
      status: "Abertas",
      quantidade: resumo.abertas,
      percentual: resumo.total ? Math.round((resumo.abertas / resumo.total) * 100) : 0,
    },
    {
      status: "Em execução",
      quantidade: resumo.emExecucao,
      percentual: resumo.total ? Math.round((resumo.emExecucao / resumo.total) * 100) : 0,
    },
    {
      status: "Finalizadas",
      quantidade: resumo.finalizadas,
      percentual: resumo.total ? Math.round((resumo.finalizadas / resumo.total) * 100) : 0,
    },
    {
      status: "Não executadas",
      quantidade: resumo.naoExecutadas,
      percentual: resumo.total ? Math.round((resumo.naoExecutadas / resumo.total) * 100) : 0,
    },
    {
      status: "Canceladas",
      quantidade: resumo.canceladas,
      percentual: resumo.total ? Math.round((resumo.canceladas / resumo.total) * 100) : 0,
    },
  ];
}

export function calcularAtividadeRecente(ordensFiltradas: OrdemServico[]) {
  return [...ordensFiltradas]
    .sort(
      (a, b) =>
        new Date(b.data_abertura ?? "").getTime() - new Date(a.data_abertura ?? "").getTime()
    )
    .slice(0, 5);
}

export function buildReportDefinition({
  filtrosAplicados,
  ordensFiltradas,
  produtividadeTecnicos,
  statusResumo,
  tiposMaisFrequentes,
}: {
  filtrosAplicados: FiltrosRelatorio;
  ordensFiltradas: OrdemServico[];
  produtividadeTecnicos: ProdutividadeTecnico[];
  statusResumo: StatusResumoItem[];
  tiposMaisFrequentes: TipoMaisFrequente[];
}): ReportDefinition {
  if (filtrosAplicados.tipoRelatorio === "status") {
    return {
      title: "Relatorio por Status",
      columns: [
        { key: "status", label: "Status" },
        { key: "quantidade", label: "Quantidade" },
        { key: "percentual", label: "Percentual" },
      ],
      rows: statusResumo.map((item) => ({
        status: item.status,
        quantidade: String(item.quantidade),
        percentual: `${item.percentual}%`,
      })),
    };
  }

  if (filtrosAplicados.tipoRelatorio === "produtividade") {
    return {
      title: "Relatório de Produtividade dos Técnicos",
      columns: [
        { key: "tecnico", label: "Técnico" },
        { key: "aceitas", label: "OS aceitas" },
        { key: "iniciadas", label: "OS em execução" },
        { key: "finalizadas", label: "OS finalizadas" },
        { key: "naoExecutadas", label: "OS não executadas" },
      ],
      rows: produtividadeTecnicos.map((item) => ({
        tecnico: item.tecnico,
        aceitas: String(item.aceitas),
        iniciadas: String(item.iniciadas),
        finalizadas: String(item.finalizadas),
        naoExecutadas: String(item.naoExecutadas),
      })),
    };
  }

  if (filtrosAplicados.tipoRelatorio === "tipo") {
    return {
      title: "Relatório por Tipo de Serviço",
      columns: [
        { key: "tipo", label: "Tipo de serviço" },
        { key: "quantidade", label: "Quantidade" },
        { key: "percentual", label: "Percentual" },
      ],
      rows: tiposMaisFrequentes.map((item) => ({
        tipo: item.tipo,
        quantidade: String(item.quantidade),
        percentual: `${item.percentual}%`,
      })),
    };
  }

  return {
    title:
      filtrosAplicados.tipoRelatorio === "periodo"
        ? "Relatório por Período"
        : "Relatório Geral de Ordens de Serviço",
    columns: [
      { key: "numero", label: "Numero da OS" },
      { key: "tipo", label: "Tipo de serviço" },
      { key: "clienteLocal", label: "Cliente/Local" },
      { key: "status", label: "Status" },
      { key: "prioridade", label: "Prioridade" },
      { key: "abertura", label: "Data de abertura" },
      { key: "encerramento", label: "Data de encerramento" },
      { key: "responsavel", label: "Responsável técnico" },
      { key: "observacoes", label: "Observações" },
    ],
    rows: ordensFiltradas.map((ordem) => ({
      numero: ordem.numero,
      tipo: ordem.tipo,
      clienteLocal: ordem.nome_cliente ?? "-",
      status: formatStatus(ordem.status),
      prioridade: formatPrioridade(ordem.prioridade),
      abertura: formatDate(ordem.data_abertura),
      encerramento: formatDate(ordem.data_encerramento),
      responsavel: getTecnicoResponsavel(ordem)?.name ?? "Sem responsável",
      observacoes: ordem.motivo_nao_execucao || ordem.descricao || "-",
    })),
  };
}

export function buildPeriodoDescricao(dataInicio: string, dataFim: string) {
  if (!dataInicio && !dataFim) {
    return "Todos os períodos";
  }

  if (dataInicio && dataFim) {
    return `${formatDate(dataInicio)} a ${formatDate(dataFim)}`;
  }

  if (dataInicio) {
    return `A partir de ${formatDate(dataInicio)}`;
  }

  return `Até ${formatDate(dataFim)}`;
}

export function buildFiltrosDescricao(
  filtros: FiltrosRelatorio,
  tecnicos: TecnicoFiltro[]
) {
  const tecnico = tecnicos.find((item) => item.id === filtros.tecnicoId)?.name ?? "Todos";

  return [
    `Status = ${filtros.status === "todos" ? "Todos" : formatStatus(filtros.status)}`,
    `Tipo = ${filtros.tipo === "todos" ? "Todos" : filtros.tipo}`,
    `Prioridade = ${
      filtros.prioridade === "todas" ? "Todas" : formatPrioridade(Number(filtros.prioridade))
    }`,
    `Técnico = ${tecnico}`,
  ].join(" | ");
}

export function formatDate(value?: string | null) {
  if (!value || value === "-") {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatStatus(status: OrdemStatus) {
  if (status === "em_execucao") {
    return "Em execução";
  }

  if (status === "nao_executada") {
    return "Não executada";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatPrioridade(prioridade: number) {
  if (prioridade === 1) {
    return "Alta";
  }

  if (prioridade === 2) {
    return "Média";
  }

  if (prioridade === 3) {
    return "Baixa";
  }

  return String(prioridade);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
