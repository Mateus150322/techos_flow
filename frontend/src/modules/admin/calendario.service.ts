import { api } from "@/shared/api/client";
import type { FuncionarioDisponivel } from "@/modules/ordensServico/ordensServico.service";

export type TipoDataCalendario = "feriado" | "ponto_facultativo";
export type EscopoDataCalendario = "nacional" | "estadual" | "municipal" | "interno";

export type DataCalendarioCorporativo = {
  id: string;
  nome: string;
  data: string;
  tipo: TipoDataCalendario;
  escopo: EscopoDataCalendario;
  estado?: string | null;
  municipio?: string | null;
  percentual_hora_extra: number;
  recorrente: boolean;
  observacao?: string | null;
  ativo: boolean;
};

export type CalendarioCorporativoResponse = {
  data: DataCalendarioCorporativo[];
  stats: {
    total: number;
    feriados: number;
    pontos_facultativos: number;
    ativos: number;
  };
};

export type CalendarioPayload = {
  nome: string;
  data: string;
  tipo: TipoDataCalendario;
  escopo: EscopoDataCalendario;
  estado?: string | null;
  municipio?: string | null;
  percentual_hora_extra: number;
  recorrente?: boolean;
  observacao?: string | null;
  ativo?: boolean;
};

export type EscalaPlantao = {
  id: string;
  participante_id: string;
  tipo_vinculo: FuncionarioDisponivel["tipo_vinculo"];
  participante_nome: string;
  descricao: string;
  funcao_escala: "mecanico" | "auxiliar_mecanica" | "outro";
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  observacao?: string | null;
};

export type EscalasPlantaoResponse = {
  data: EscalaPlantao[];
  stats: {
    total: number;
    ativas: number;
  };
};

export type EscalaPlantaoPayload = {
  participante_id: string;
  tipo_vinculo: FuncionarioDisponivel["tipo_vinculo"];
  descricao: string;
  funcao_escala?: EscalaPlantao["funcao_escala"];
  data_inicio: string;
  data_fim: string;
  ativo?: boolean;
  observacao?: string | null;
};

export async function listarCalendarioCorporativo(ano: string) {
  const { data } = await api.get<CalendarioCorporativoResponse>("/calendario-corporativo", {
    params: {
      ano,
      status: "todos",
    },
  });

  return data;
}

export async function salvarDataCalendario(
  payload: CalendarioPayload,
  id?: string | null
) {
  const requestPayload = {
    ...payload,
    estado: payload.estado?.trim() ? payload.estado.trim().toUpperCase() : null,
    municipio: payload.municipio?.trim() || null,
    observacao: payload.observacao?.trim() || null,
  };

  if (id) {
    const { data } = await api.put<DataCalendarioCorporativo>(
      `/calendario-corporativo/${id}`,
      requestPayload
    );
    return data;
  }

  const { data } = await api.post<DataCalendarioCorporativo>(
    "/calendario-corporativo",
    requestPayload
  );
  return data;
}

export async function removerDataCalendario(id: string) {
  const { data } = await api.delete<{ message: string }>(`/calendario-corporativo/${id}`);
  return data;
}

export async function listarEscalasPlantao(ano: string, mes?: string) {
  const mesParam = mes ? Number(mes) : undefined;

  const { data } = await api.get<EscalasPlantaoResponse>("/escalas-plantoes", {
    params: {
      ano,
      mes: Number.isFinite(mesParam) ? mesParam : undefined,
      status: "todos",
    },
  });

  return data;
}

export async function salvarEscalaPlantao(payload: EscalaPlantaoPayload, id?: string | null) {
  const requestPayload = {
    ...payload,
    observacao: payload.observacao?.trim() || null,
  };

  if (id) {
    const { data } = await api.put<EscalaPlantao>(`/escalas-plantoes/${id}`, requestPayload);
    return data;
  }

  const { data } = await api.post<EscalaPlantao>("/escalas-plantoes", requestPayload);
  return data;
}

export async function removerEscalaPlantao(id: string) {
  const { data } = await api.delete<{ message: string }>(`/escalas-plantoes/${id}`);
  return data;
}
