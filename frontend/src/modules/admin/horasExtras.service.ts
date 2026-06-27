import { api } from "@/shared/api/client";

export type HoraExtraExportFormat = "csv" | "xlsx" | "pdf";

export type HoraExtraFuncionarioFiltro = {
  id: string;
  name: string;
  role: "administrador" | "tecnico" | "auxiliar_tecnico";
  funcao: string;
  tipo_vinculo: "usuario" | "colaborador_operacional";
};

export type HoraExtraRow = {
  funcionario_id: string;
  funcionario_nome: string;
  role: "administrador" | "tecnico" | "auxiliar_tecnico";
  funcao: string;
  tipo_vinculo: "usuario" | "colaborador_operacional";
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
  minutos_feriados: number;
  minutos_pontos_facultativos: number;
  minutos_fins_semana: number;
  minutos_plantao: number;
  horas_feriados: string;
  horas_pontos_facultativos: string;
  horas_fins_semana: string;
  horas_plantao: string;
  aprovacao_status: "pendente" | "aprovada" | "reprovada" | "parcial" | "sem_lancamentos";
  aprovacao_pendentes: number;
  aprovacao_aprovadas: number;
  aprovacao_reprovadas: number;
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
    total_minutos_feriados: number;
    total_feriados: string;
    total_minutos_pontos_facultativos: number;
    total_pontos_facultativos: string;
    total_minutos_fins_semana: number;
    total_fins_semana: string;
    total_minutos_plantao: number;
    total_plantao: string;
  };
  aprovacao: {
    pendentes: number;
    aprovadas: number;
    reprovadas: number;
    status_geral:
      | "pendente"
      | "parcial"
      | "aprovada"
      | "com_reprovacoes"
      | "sem_lancamentos";
  };
  fechamento: null | {
    status: "aberta" | "fechada";
    id: string | null;
    competencia: string;
    fechado_em: string | null;
    fechado_por: string | null;
    observacao: string | null;
  };
  indicadores: {
    top_funcionarios: Array<{
      funcionario_id: string;
      funcionario_nome: string;
      funcao: string;
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
  const mesParam = params?.mes ? Number(params.mes) : undefined;

  const { data } = await api.get<HorasExtrasResponse>("/relatorios/horas-extras", {
    params: {
      funcionario_id: params?.funcionarioId || undefined,
      data_inicio: params?.dataInicio || undefined,
      data_fim: params?.dataFim || undefined,
      mes: Number.isFinite(mesParam) ? mesParam : undefined,
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
  const mesParam = params?.mes ? Number(params.mes) : undefined;

  const response = await api.get<Blob>(`/relatorios/horas-extras/exportar/${format}`, {
    params: {
      funcionario_id: params?.funcionarioId || undefined,
      data_inicio: params?.dataInicio || undefined,
      data_fim: params?.dataFim || undefined,
      mes: Number.isFinite(mesParam) ? mesParam : undefined,
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

export async function atualizarAprovacaoHorasExtras(
  status: "pendente" | "aprovada" | "reprovada",
  params: Omit<BuscarHorasExtrasParams, "page" | "perPage"> & { observacao?: string }
) {
  const mesParam = params.mes ? Number(params.mes) : undefined;

  const { data } = await api.post<{
    status: string;
    registros_atualizados: number;
  }>("/relatorios/horas-extras/aprovacoes", {
    status,
    observacao: params.observacao || undefined,
    funcionario_id: params.funcionarioId || undefined,
    data_inicio: params.dataInicio || undefined,
    data_fim: params.dataFim || undefined,
    mes: Number.isFinite(mesParam) ? mesParam : undefined,
    ano: params.ano || undefined,
  });

  return data;
}

export async function fecharCompetenciaHorasExtras(params: {
  mes: string;
  ano: string;
  observacao?: string;
}) {
  const { data } = await api.post<NonNullable<HorasExtrasResponse["fechamento"]>>(
    "/relatorios/horas-extras/fechamentos",
    {
      mes: Number(params.mes),
      ano: params.ano,
      observacao: params.observacao || undefined,
    }
  );

  return data;
}

export async function reabrirCompetenciaHorasExtras(fechamentoId: string) {
  const { data } = await api.delete<{ message: string }>(
    `/relatorios/horas-extras/fechamentos/${fechamentoId}`
  );

  return data;
}
