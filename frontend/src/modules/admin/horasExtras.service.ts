import { api } from "@/shared/api/client";

export type HoraExtraExportFormat = "csv" | "xlsx" | "pdf";

export type HoraExtraFuncionarioFiltro = {
  id: string;
  name: string;
  role: "administrador" | "tecnico";
};

export type HoraExtraRow = {
  funcionario_id: string;
  funcionario_nome: string;
  horas_extras_50_minutos: number;
  horas_extras_50: string;
  horas_extras_100_minutos: number;
  horas_extras_100: string;
  total_extras_minutos: number;
  total_extras: string;
  horas_pagas_minutos: number;
  horas_pagas: string;
  horas_convertidas_folga_minutos: number;
  horas_convertidas_folga: string;
  dias_folga_gerados: number;
  saldo_banco_minutos: number;
  saldo_banco: string;
  valor_estimado_financeiro: number;
};

export type HorasExtrasResponse = {
  resumo: {
    total_funcionarios: number;
    total_horas_extras_50_minutos: number;
    total_horas_extras_50: string;
    total_horas_extras_100_minutos: number;
    total_horas_extras_100: string;
    total_extras_minutos: number;
    total_extras: string;
    total_horas_pagas_minutos: number;
    total_horas_pagas: string;
    total_horas_convertidas_folga_minutos: number;
    total_horas_convertidas_folga: string;
    total_dias_folga_gerados: number;
    saldo_total_banco_minutos: number;
    saldo_total_banco: string;
    total_estimado_financeiro: number;
  };
  indicadores: {
    top_funcionarios: Array<{
      funcionario_id: string;
      funcionario_nome: string;
      total_extras_minutos: number;
      total_extras: string;
    }>;
  };
  funcionarios: HoraExtraFuncionarioFiltro[];
  rows: HoraExtraRow[];
  pagination: {
    page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
  periodo_descricao: string;
  data_emissao: string;
};

export type BuscarHorasExtrasParams = {
  funcionarioId?: string;
  dataInicio?: string;
  dataFim?: string;
  mes?: string;
  ano?: string;
  page?: number;
  perPage?: number;
};

export async function buscarRelatorioHorasExtras(params?: BuscarHorasExtrasParams) {
  const { data } = await api.get<HorasExtrasResponse>("/relatorios/horas-extras", {
    params: {
      funcionario_id: params?.funcionarioId || undefined,
      data_inicio: params?.dataInicio || undefined,
      data_fim: params?.dataFim || undefined,
      mes: params?.mes || undefined,
      ano: params?.ano || undefined,
      page: params?.page,
      per_page: params?.perPage,
    },
  });

  return data;
}

export async function exportarRelatorioHorasExtras(
  format: HoraExtraExportFormat,
  params?: Omit<BuscarHorasExtrasParams, "page" | "perPage">
) {
  const response = await api.get<Blob>(`/relatorios/horas-extras/exportar/${format}`, {
    params: {
      funcionario_id: params?.funcionarioId || undefined,
      data_inicio: params?.dataInicio || undefined,
      data_fim: params?.dataFim || undefined,
      mes: params?.mes || undefined,
      ano: params?.ano || undefined,
    },
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const fileNameMatch =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ?? disposition.match(/filename="?([^"]+)"?/i);
  const fileName = fileNameMatch?.[1]
    ? decodeURIComponent(fileNameMatch[1])
    : `relatorio-horas-extras.${format}`;

  return {
    blob: response.data,
    fileName,
  };
}
