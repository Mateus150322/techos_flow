import { useMemo, useSyncExternalStore } from "react";

export type UserRole = "administrador" | "tecnico" | "atendente";

export type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  must_change_password?: boolean;
};

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const TOKEN_EXPIRES_AT_STORAGE_KEY = "token_expires_at";
const SESSION_VALIDATED_AT_STORAGE_KEY = "session_validated_at";
const SESSION_EVENT_NAME = "techosflow:session-changed";
const SESSION_VALIDATION_TTL_MS = 60_000;

function isUserRole(value: unknown): value is UserRole {
  return value === "administrador" || value === "tecnico" || value === "atendente";
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === "tecnico" ? "/tecnico" : "/";
}

export function getStoredToken() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    return null;
  }

  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_STORAGE_KEY);

  if (!expiresAt) {
    return token;
  }

  const expiresAtTimestamp = Date.parse(expiresAt);

  if (!Number.isFinite(expiresAtTimestamp)) {
    localStorage.removeItem(TOKEN_EXPIRES_AT_STORAGE_KEY);
    return token;
  }

  if (Date.now() >= expiresAtTimestamp) {
    clearSession();
    return null;
  }

  return token;
}

function parseStoredUser(raw: string | null, fallbackRole: UserRole = "atendente"): CurrentUser {
  const fallbackUser: CurrentUser = {
    name: "Usuario",
    role: fallbackRole,
    must_change_password: false,
  };

  if (!raw) {
    return fallbackUser;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CurrentUser>;

    return {
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : fallbackUser.name,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      role: isUserRole(parsed.role) ? parsed.role : fallbackRole,
      must_change_password: typeof parsed.must_change_password === "boolean"
        ? parsed.must_change_password
        : false,
    };
  } catch {
    return fallbackUser;
  }
}

export function getStoredUser(fallbackRole: UserRole = "atendente"): CurrentUser {
  return parseStoredUser(localStorage.getItem(USER_STORAGE_KEY), fallbackRole);
}

function getStoredUserRaw() {
  return localStorage.getItem(USER_STORAGE_KEY);
}

function setSessionValidatedAt(value: number) {
  localStorage.setItem(SESSION_VALIDATED_AT_STORAGE_KEY, String(value));
}

function clearSessionValidatedAt() {
  localStorage.removeItem(SESSION_VALIDATED_AT_STORAGE_KEY);
}

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT_NAME));
}

function subscribeToSession(onStoreChange: () => void) {
  window.addEventListener(SESSION_EVENT_NAME, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(SESSION_EVENT_NAME, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useCurrentUser(fallbackRole: UserRole = "atendente") {
  const rawUser = useSyncExternalStore(subscribeToSession, getStoredUserRaw, () => null);

  return useMemo(() => parseStoredUser(rawUser, fallbackRole), [fallbackRole, rawUser]);
}

export function hasFreshSessionValidation(ttlMs = SESSION_VALIDATION_TTL_MS) {
  const rawValue = localStorage.getItem(SESSION_VALIDATED_AT_STORAGE_KEY);

  if (!rawValue) {
    return false;
  }

  const validatedAt = Number(rawValue);

  if (!Number.isFinite(validatedAt)) {
    return false;
  }

  return Date.now() - validatedAt < ttlMs;
}

export function saveSession(token: string, user: CurrentUser, tokenExpiresAt?: string | null) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  if (tokenExpiresAt) {
    localStorage.setItem(TOKEN_EXPIRES_AT_STORAGE_KEY, tokenExpiresAt);
  } else {
    localStorage.removeItem(TOKEN_EXPIRES_AT_STORAGE_KEY);
  }

  setSessionValidatedAt(Date.now());
  emitSessionChange();
}

export function updateStoredUser(user: CurrentUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  setSessionValidatedAt(Date.now());
  emitSessionChange();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_STORAGE_KEY);
  clearSessionValidatedAt();
  emitSessionChange();
}
