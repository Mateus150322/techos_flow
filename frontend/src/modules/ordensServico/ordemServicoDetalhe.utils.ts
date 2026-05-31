import type { Anexo, Endereco, OrdemServicoDetalhe } from "./ordensServico.service";

export const ORDEM_SERVICO_DETALHE_INCLUDES = [
  "endereco",
  "criadaPor",
  "tecnicoResponsavel",
  "execucoes",
  "execucoes.tecnico",
  "anexos",
] as const;

export function formatarDataHora(valor?: string | null) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarStatus(status?: string) {
  if (!status) {
    return "-";
  }

  return status.replaceAll("_", " ");
}

export function formatarCoordenada(valor?: number | null) {
  if (typeof valor !== "number") {
    return "-";
  }

  return valor.toFixed(6);
}

export function listarLinhasEnderecoOperacional(endereco?: Endereco | null) {
  if (!endereco) {
    return [];
  }

  const cidadeEstado = [endereco.cidade, endereco.estado]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [endereco.rua, endereco.bairro, cidadeEstado].filter(
    (value): value is string => Boolean(value)
  );
}

export function extrairCamposDescricao(descricao?: string | null) {
  const campos: Record<string, string> = {};

  for (const linha of (descricao ?? "").split(/\r\n|\r|\n/)) {
    const [label, ...resto] = linha.split(":");

    if (!label || resto.length === 0) {
      continue;
    }

    campos[label.trim().toLowerCase()] = resto.join(":").trim();
  }

  return campos;
}

export function obterResumoUnidadeOperacional(os?: OrdemServicoDetalhe | null) {
  if (!os) {
    return [];
  }

  const campos = extrairCamposDescricao(os.descricao);

  return [
    { label: "Unidade", value: campos["unidade"] || "-" },
    { label: "Local operacional", value: campos["local operacional"] || os.nome_cliente || "-" },
    { label: "Setor", value: campos["setor"] || "-" },
    { label: "Encarregado", value: campos["encarregado"] || "-" },
  ];
}

export function obterUltimaGeolocalizacaoEvidencia(anexos?: Anexo[] | null) {
  if (!anexos?.length) {
    return null;
  }

  const comGeolocalizacao = anexos.filter(
    (anexo) =>
      (typeof anexo.latitude === "number" && typeof anexo.longitude === "number") ||
      Boolean(
        anexo.endereco_capturado ||
          anexo.rua_capturada ||
          anexo.bairro_capturado ||
          anexo.cidade_capturada ||
          anexo.estado_capturado
      )
  );

  if (!comGeolocalizacao.length) {
    return null;
  }

  return [...comGeolocalizacao].sort((a, b) => {
    const dataA = a.geolocalizacao_capturada_em
      ? new Date(a.geolocalizacao_capturada_em).getTime()
      : 0;
    const dataB = b.geolocalizacao_capturada_em
      ? new Date(b.geolocalizacao_capturada_em).getTime()
      : 0;

    return dataB - dataA;
  })[0];
}

export function getTiposAceitosAnexo(tipoAnexo: string) {
  if (tipoAnexo === "foto") {
    return ".jpg,.jpeg,.png";
  }

  if (tipoAnexo === "pdf") {
    return ".pdf";
  }

  return ".csv,.doc,.docx,.pdf,.txt,.xls,.xlsx,.jpg,.jpeg,.png";
}
