import api from "@/shared/api/client";
import {
  clearSession,
  getStoredToken,
  saveSession,
  updateStoredUser,
  type CurrentUser,
} from "@/shared/auth/session";

type UsuarioAutenticado = CurrentUser;

type LoginResponse = {
  token: string;
  user: UsuarioAutenticado;
};

type AlterarSenhaPrimeiroAcessoPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

type AlterarSenhaPrimeiroAcessoResponse = {
  message: string;
  user: UsuarioAutenticado;
};

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>("/login", { email, password });

  const token = response.data.token;
  const user = response.data.user;

  saveSession(token, user);

  return response.data;
}

export async function logout() {
  try {
    await api.post("/logout");
  } finally {
    clearSession();
  }
}

export async function me() {
  const response = await api.get<UsuarioAutenticado>("/me");
  const token = getStoredToken();

  if (token) {
    updateStoredUser(response.data);
  }

  return response.data;
}

export async function alterarSenhaPrimeiroAcesso(
  payload: AlterarSenhaPrimeiroAcessoPayload
) {
  const response = await api.post<AlterarSenhaPrimeiroAcessoResponse>(
    "/me/alterar-senha",
    payload
  );

  updateStoredUser(response.data.user);

  return response.data;
}
