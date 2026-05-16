type UnknownRecord = Record<string, unknown>;

function toRecord(value: unknown): UnknownRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const errorRecord = toRecord(error);
  const response = toRecord(errorRecord?.response);
  const data = toRecord(response?.data);
  const status = typeof response?.status === "number" ? response.status : undefined;
  const code = typeof errorRecord?.code === "string" ? errorRecord.code : "";
  const apiMessage = normalizeApiMessage(
    typeof data?.message === "string" ? data.message : undefined,
    status
  );

  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return normalizeClientError(error.message, code, status, fallback);
  }

  return mapStatusFallback(status, fallback);
}

export function getApiValidationErrors(error: unknown) {
  const errorRecord = toRecord(error);
  const response = toRecord(errorRecord?.response);
  const data = toRecord(response?.data);
  const errors = toRecord(data?.errors);

  if (!errors) {
    return undefined;
  }

  const normalized: Record<string, string[]> = {};

  for (const [field, value] of Object.entries(errors)) {
    if (!Array.isArray(value)) {
      continue;
    }

    const messages = value.filter(
      (message): message is string => typeof message === "string" && message.trim().length > 0
    );

    if (messages.length > 0) {
      normalized[field] = messages;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function getFirstApiValidationMessage(error: unknown, fields: string[]) {
  const validationErrors = getApiValidationErrors(error);

  if (!validationErrors) {
    return undefined;
  }

  for (const field of fields) {
    const message = validationErrors[field]?.[0];

    if (message) {
      return message;
    }
  }

  return undefined;
}

function normalizeApiMessage(message: string | undefined, status?: number) {
  if (!message?.trim()) {
    return "";
  }

  const normalized = fixMojibake(message.trim());
  const lower = normalized.toLowerCase();

  if (lower === "unauthenticated.") {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (lower === "forbidden." || lower === "access denied." || lower === "acesso negado") {
    return "Você não tem permissão para realizar esta ação.";
  }

  if (lower === "too many attempts." || lower.includes("too many login attempts")) {
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  }

  if (lower === "user inactive." || lower === "usuário inativo." || lower === "usuario inativo.") {
    return "Seu acesso está inativo. Procure um administrador para reativar seu usuário.";
  }

  if (lower === "invalid credentials." || lower === "credenciais inválidas.") {
    return "Credenciais inválidas. Confira e-mail e senha.";
  }

  if (status === 500 && lower === "server error") {
    return "O servidor encontrou um erro interno. Tente novamente em instantes.";
  }

  return normalized;
}

function normalizeClientError(
  message: string,
  code: string,
  status: number | undefined,
  fallback: string
) {
  const normalized = fixMojibake(message.trim());
  const lower = normalized.toLowerCase();
  const errorCode = code.toUpperCase();

  if (
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    errorCode === "ERR_NETWORK" ||
    errorCode === "ECONNREFUSED" ||
    errorCode === "ENOTFOUND"
  ) {
    return "Não foi possível conectar ao servidor. Verifique se a API está disponível e tente novamente.";
  }

  if (lower.includes("timeout") || errorCode === "ECONNABORTED") {
    return "A conexão com o servidor expirou. Tente novamente.";
  }

  return mapStatusFallback(status, fallback);
}

function mapStatusFallback(status: number | undefined, fallback: string) {
  if (status === 401) {
    return "Sua sessão expirou ou o acesso foi negado. Faça login novamente.";
  }

  if (status === 403) {
    return "Você não tem permissão para realizar esta ação.";
  }

  if (status === 404) {
    return "Recurso não encontrado.";
  }

  if (status === 422) {
    return "Os dados informados são inválidos. Revise os campos e tente novamente.";
  }

  if (status === 429) {
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  }

  if (typeof status === "number" && status >= 500) {
    return "O servidor encontrou um erro interno. Tente novamente em instantes.";
  }

  return fallback;
}

function fixMojibake(value: string) {
  return value
    .replaceAll("NÃ£o", "Não")
    .replaceAll("nÃ£o", "não")
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã£", "ã")
    .replaceAll("Ãµ", "õ")
    .replaceAll("Ã§", "ç")
    .replaceAll("Ãª", "ê")
    .replaceAll("Ã´", "ô")
    .replaceAll("Ã", "à")
    .replaceAll("UsuÃ¡rio", "Usuário")
    .replaceAll("possÃ­vel", "possível")
    .replaceAll("sessÃ£o", "sessão")
    .replaceAll("invÃ¡lidas", "inválidas")
    .replaceAll("estÃ¡", "está");
}
