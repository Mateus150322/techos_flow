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
  const message = data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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
