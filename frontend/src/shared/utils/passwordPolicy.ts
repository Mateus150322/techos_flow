export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

type PasswordPolicyContext = {
  name?: string;
  email?: string;
  currentPassword?: string;
  confirmation?: string;
};

export type PasswordRequirement = {
  id: string;
  label: string;
  ok: boolean;
};

function extractTokens(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function containsPersonalData(password: string, context: PasswordPolicyContext) {
  const tokens = [
    ...extractTokens(context.name),
    ...extractTokens(context.email?.split("@")[0]),
  ];

  return tokens.some((token) => password.includes(token));
}

function containsCommonSequence(password: string) {
  return ["1234", "abcd", "qwer", "senha", "password", "admin"].some((term) =>
    password.includes(term)
  );
}

export function getPasswordRequirements(
  password: string,
  context: PasswordPolicyContext = {}
): PasswordRequirement[] {
  const normalized = password.toLowerCase();

  return [
    {
      id: "length-min",
      label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
      ok: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "length-max",
      label: `No máximo ${PASSWORD_MAX_LENGTH} caracteres`,
      ok: password.length > 0 && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "uppercase",
      label: "Uma letra maiúscula",
      ok: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "Uma letra minúscula",
      ok: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Um número",
      ok: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "Um caractere especial",
      ok: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "spaces",
      label: "Sem espaços",
      ok: password.length > 0 && !/\s/.test(password),
    },
    {
      id: "sequence",
      label: "Sem sequências comuns como 1234, abcd, qwer, senha ou password",
      ok: password.length > 0 && !containsCommonSequence(normalized),
    },
    {
      id: "personal-data",
      label: "Não conter partes do nome ou do e-mail",
      ok: password.length > 0 && !containsPersonalData(normalized, context),
    },
    {
      id: "different-current",
      label: "Ser diferente da senha atual",
      ok:
        !context.currentPassword ||
        (password.length > 0 && password !== context.currentPassword),
    },
    {
      id: "confirmation",
      label: "Confirmação igual à nova senha",
      ok:
        context.confirmation === undefined ||
        (password.length > 0 && password === context.confirmation),
    },
  ];
}

export function getFirstPasswordPolicyError(
  password: string,
  context: PasswordPolicyContext = {}
) {
  const requirements = getPasswordRequirements(password, context);
  const failed = requirements.find((item) => !item.ok);

  return failed?.label ?? "";
}

export function isStrongPassword(
  password: string,
  context: PasswordPolicyContext = {}
) {
  return getPasswordRequirements(password, context).every((item) => item.ok);
}
