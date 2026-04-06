import { api } from "@/shared/api/client";

export type OrdemStatus =
  | "aberta"
  | "em_execucao"
  | "finalizada"
  | "nao_executada"
  | "cancelada";

export type Endereco = {
  id?: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: string | null;
  longitude?: string | null;
};

export type Usuario = {
  id: string;
  name: string;
  email: string;
  role: "administrador" | "tecnico" | "atendente";
};

export type Execucao = {
  id: string;
  os_id: string;
  tecnico_id: string;
  data_inicio: string;
  data_fim: string | null;
  observacao: string | null;
  tecnico?: Usuario;
};

export type Anexo = {
  id: string;
  caminho?: string | null;
  tipo?: string | null;
  url?: string | null;
};

export type OrdemServico = {
  id: string;
  numero: string;
  tipo: string;
  nome_cliente?: string | null;
  status: OrdemStatus;
  prioridade: number;
  data_abertura: string;
  data_encerramento: string | null;
  descricao: string;
  endereco?: Endereco | null;
  tecnico_responsavel_id?: string | null;
  tecnicoResponsavel?: Usuario | null;
};

export type OrdemServicoDetalhe = OrdemServico & {
  criadaPor?: Usuario | null;
  execucoes?: Execucao[];
  anexos?: Anexo[];
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
};

export type CriarOrdemAtendentePayload = {
  tipo_servico: string;
  nome_cliente: string;
  prioridade: number;
  descricao: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
};

export async function listarOrdens(
  params?: Record<string, string | number | undefined>
) {
  const { data } = await api.get<Paginated<OrdemServico>>("/ordens-servico", {
    params,
  });
  return data;
}

export async function buscarOrdem(id: string, include?: string[]) {
  const params = include?.length ? { include: include.join(",") } : undefined;
  const { data } = await api.get<OrdemServicoDetalhe>(`/ordens-servico/${id}`, {
    params,
  });
  return data;
}

export async function criarOrdem(
  payload: CriarOrdemAtendentePayload
): Promise<OrdemServicoDetalhe> {
  const { data } = await api.post<OrdemServicoDetalhe>("/ordens-servico", payload);
  return data;
}

export type IniciarExecucaoPayload = {
  data_inicio?: string;
  observacao?: string;
};

export type FinalizarExecucaoPayload = {
  execucao_id: string;
  data_fim?: string;
  observacao?: string;
};

export async function iniciarExecucao(
  osId: string,
  payload?: IniciarExecucaoPayload
) {
  const { data } = await api.post(`/ordens-servico/${osId}/iniciar`, payload ?? {});
  return data;
}

export async function finalizarExecucao(
  osId: string,
  payload: FinalizarExecucaoPayload
) {
  const { data } = await api.post(
    `/ordens-servico/${osId}/execucoes/finalizar`,
    payload
  );
  return data;
}

export type MarcarNaoExecutadaPayload = {
  motivo_nao_execucao: string;
};

export async function marcarNaoExecutada(
  osId: string,
  payload: MarcarNaoExecutadaPayload
) {
  const { data } = await api.post(`/ordens-servico/${osId}/nao-executada`, payload);
  return data;
}

export async function enviarAnexo(osId: string, arquivo: File, tipo?: string) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  if (tipo) {
    formData.append("tipo", tipo);
  }

  const { data } = await api.post(`/ordens-servico/${osId}/anexos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function aceitarOrdem(osId: string) {
  const { data } = await api.post(`/ordens-servico/${osId}/aceitar`);
  return data;
}