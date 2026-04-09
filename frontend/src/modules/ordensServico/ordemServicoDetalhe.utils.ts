import type { Endereco } from "./ordensServico.service";

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

export function getTiposAceitosAnexo(tipoAnexo: string) {
  if (tipoAnexo === "foto") {
    return ".jpg,.jpeg,.png";
  }

  if (tipoAnexo === "pdf") {
    return ".pdf";
  }

  return ".csv,.doc,.docx,.pdf,.txt,.xls,.xlsx,.jpg,.jpeg,.png";
}
