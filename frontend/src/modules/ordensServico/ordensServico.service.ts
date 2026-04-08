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

export type OrdemServicoUsuarioRelacionamento = Usuario | null | undefined;

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
  latitude?: number | null;
  longitude?: number | null;
  precisao_metros?: number | null;
  geolocalizacao_capturada_em?: string | null;
  endereco_capturado?: string | null;
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
  motivo_nao_execucao?: string | null;
  endereco?: Endereco | null;
  tecnico_responsavel_id?: string | null;
  tecnicoResponsavel?: Usuario | null;
  tecnico_responsavel?: Usuario | null;
};

export type OrdemServicoDetalhe = OrdemServico & {
  criadaPor?: Usuario | null;
  criada_por?: Usuario | null;
  execucoes?: Execucao[];
  anexos?: Anexo[];
};

export function getTecnicoResponsavel(
  ordem?: Partial<OrdemServicoDetalhe> | null
): OrdemServicoUsuarioRelacionamento {
  return ordem?.tecnico_responsavel ?? ordem?.tecnicoResponsavel ?? null;
}

export function getCriadaPor(
  ordem?: Partial<OrdemServicoDetalhe> | null
): OrdemServicoUsuarioRelacionamento {
  return ordem?.criada_por ?? ordem?.criadaPor ?? null;
}

export type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
};

export type ResumoOrdens = {
  total: number;
  abertas: number;
  em_execucao: number;
  finalizadas: number;
  nao_executadas: number;
  canceladas: number;
  encerradas: number;
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

export async function buscarResumoOrdens(
  params?: Record<string, string | number | undefined>
) {
  const { data } = await api.get<ResumoOrdens>("/ordens-servico/resumo", {
    params,
  });

  return data;
}

export async function listarOpcoesFiltroOrdens() {
  const { data } = await api.get<{ tipos: string[] }>("/ordens-servico/opcoes-filtro");
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

export type GeolocalizacaoAnexoPayload = {
  tipo?: string;
  latitude?: number;
  longitude?: number;
  precisao_metros?: number;
  geolocalizacao_capturada_em?: string;
  endereco_capturado?: string;
};

export async function enviarAnexo(
  osId: string,
  arquivo: File,
  tipoOuPayload?: string | GeolocalizacaoAnexoPayload
) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  if (typeof tipoOuPayload === "string") {
    formData.append("tipo", tipoOuPayload);
  }

  if (tipoOuPayload && typeof tipoOuPayload !== "string") {
    if (tipoOuPayload.tipo) {
      formData.append("tipo", tipoOuPayload.tipo);
    }

    if (typeof tipoOuPayload.latitude === "number") {
      formData.append("latitude", String(tipoOuPayload.latitude));
    }

    if (typeof tipoOuPayload.longitude === "number") {
      formData.append("longitude", String(tipoOuPayload.longitude));
    }

    if (typeof tipoOuPayload.precisao_metros === "number") {
      formData.append("precisao_metros", String(tipoOuPayload.precisao_metros));
    }

    if (tipoOuPayload.geolocalizacao_capturada_em) {
      formData.append(
        "geolocalizacao_capturada_em",
        tipoOuPayload.geolocalizacao_capturada_em
      );
    }

    if (tipoOuPayload.endereco_capturado) {
      formData.append("endereco_capturado", tipoOuPayload.endereco_capturado);
    }
  }

  const { data } = await api.post(`/ordens-servico/${osId}/anexos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function obterArquivoAnexo(anexoId: string) {
  const response = await api.get<Blob>(`/anexos/${anexoId}/arquivo`, {
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const fileNameMatch =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) ?? disposition.match(/filename="?([^"]+)"?/i);
  const fileName = fileNameMatch?.[1]
    ? decodeURIComponent(fileNameMatch[1])
    : `anexo-${anexoId}`;

  return {
    blob: response.data,
    fileName,
    mimeType: String(response.headers["content-type"] ?? "application/octet-stream"),
  };
}

export async function aceitarOrdem(osId: string) {
  const { data } = await api.post(`/ordens-servico/${osId}/aceitar`);
  return data;
}
