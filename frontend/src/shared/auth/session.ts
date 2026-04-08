import { useMemo, useSyncExternalStore } from "react";

export type UserRole = "administrador" | "tecnico" | "atendente";

export type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
};

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
const SESSION_EVENT_NAME = "techosflow:session-changed";

function isUserRole(value: unknown): value is UserRole {
  return value === "administrador" || value === "tecnico" || value === "atendente";
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function parseStoredUser(raw: string | null, fallbackRole: UserRole = "atendente"): CurrentUser {
  const fallbackUser: CurrentUser = {
    name: "Usuario",
    role: fallbackRole,
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
  const rawUser = useSyncExternalStore(
    subscribeToSession,
    getStoredUserRaw,
    () => null
  );

  return useMemo(() => parseStoredUser(rawUser, fallbackRole), [fallbackRole, rawUser]);
}

export function saveSession(token: string, user: CurrentUser) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function updateStoredUser(user: CurrentUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  emitSessionChange();
}
