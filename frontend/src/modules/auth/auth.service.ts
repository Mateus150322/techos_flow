import api from "@/shared/api/client";

export async function login(email: string, password: string) {
  const response = await api.post("/login", { email, password });

  const token = response.data.token;

  localStorage.setItem("token", token);

  return response.data;
}

export async function logout() {
  await api.post("/logout");
  localStorage.removeItem("token");
}

export async function me() {
  const response = await api.get("/me");
  return response.data;
}