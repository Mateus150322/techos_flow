import { api } from "@/shared/api/client";
import type { OrdemServico, OrdemStatus } from "@/modules/ordensServico/ordensServico.service";
import type {
  ReportDefinition,
  ResumoRelatorios,
  TecnicoFiltro,
  TipoRelatorio,
} from "./relatorios.utils";

export type BuscarRelatoriosParams = {
  tipoRelatorio: TipoRelatorio;
  status: OrdemStatus | "todos";
  tipo: string;
  prioridade: string;
  tecnicoId: string;
  dataInicio: string;
  dataFim: string;
};

export type RelatoriosResponse = {
  tipos: string[];
  tecnicos: TecnicoFiltro[];
  resumo: ResumoRelatorios;
  reportDefinition: ReportDefinition;
  atividadeRecente: Pick<
    OrdemServico,
    "id" | "numero" | "nome_cliente" | "tipo" | "status" | "data_abertura"
  >[];
  filtrosDescricao: string;
  periodoDescricao: string;
  dataEmissao: string;
};

export type RelatorioExportFormat = "csv" | "xlsx" | "pdf";

function buildRelatorioParams(params: BuscarRelatoriosParams) {
  return {
    tipo_relatorio: params.tipoRelatorio,
    status: params.status === "todos" ? undefined : params.status,
    tipo: params.tipo === "todos" ? undefined : params.tipo,
    prioridade: params.prioridade === "todas" ? undefined : params.prioridade,
    tecnico_id: params.tecnicoId === "todos" ? undefined : params.tecnicoId,
    data_inicio: params.dataInicio || undefined,
    data_fim: params.dataFim || undefined,
  };
}

export async function buscarRelatorioOrdens(params: BuscarRelatoriosParams) {
  const { data } = await api.get<RelatoriosResponse>("/relatorios/ordens-servico", {
    params: buildRelatorioParams(params),
  });

  return data;
}

export async function exportarRelatorioOrdens(
  format: RelatorioExportFormat,
  params: BuscarRelatoriosParams
) {
  const response = await api.get<Blob>(`/relatorios/ordens-servico/exportar/${format}`, {
    params: buildRelatorioParams(params),
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const fileNameMatch =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ?? disposition.match(/filename="?([^"]+)"?/i);
  const fileName = fileNameMatch?.[1]
    ? decodeURIComponent(fileNameMatch[1])
    : `relatorio-techos-flow.${format}`;

  return {
    blob: response.data,
    fileName,
  };
}
