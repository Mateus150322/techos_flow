import api from "@/shared/api/client";

type UsuarioAutenticado = {
  id: string;
  name: string;
  email: string;
  role: "administrador" | "tecnico" | "atendente";
};

type LoginResponse = {
  token: string;
  user: UsuarioAutenticado;
};

export async function login(email: string, password: string) {
  const response = await api.post<LoginResponse>("/login", { email, password });

  const token = response.data.token;
  const user = response.data.user;

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return response.data;
}

export async function logout() {
  await api.post("/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function me() {
  const response = await api.get<UsuarioAutenticado>("/me");
  return response.data;
}

export async function aceitarOrdem(osId: string) {
  const { data } = await api.post(`/ordens-servico/${osId}/aceitar`);
  return data;
}