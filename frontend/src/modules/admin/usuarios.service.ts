import { api } from "@/shared/api/client";
import type { UserRole } from "@/shared/auth/session";

export type PerfilUsuario = UserRole;

export type UsuarioAdmin = {
  id: string;
  name: string;
  email: string;
  role: PerfilUsuario;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
  stats: {
    total: number;
    ativos: number;
    inativos: number;
    administradores: number;
    tecnicos: number;
    atendentes: number;
    ultimos_7_dias: number;
  };
};

export type ListarUsuariosParams = {
  q?: string;
  role?: PerfilUsuario | "todos";
  status?: "todos" | "ativos" | "inativos";
  per_page?: number;
  page?: number;
};

export type CriarUsuarioPayload = {
  name: string;
  email: string;
  role: PerfilUsuario;
  password: string;
};

export type AtualizarUsuarioPayload = {
  name?: string;
  email?: string;
  role?: PerfilUsuario;
  password?: string;
  is_active?: boolean;
};

export async function listarUsuarios(params?: ListarUsuariosParams) {
  const { data } = await api.get<Paginated<UsuarioAdmin>>("/usuarios", {
    params: {
      q: params?.q || undefined,
      role: params?.role && params.role !== "todos" ? params.role : undefined,
      status: params?.status && params.status !== "todos" ? params.status : undefined,
      per_page: params?.per_page ?? 50,
      page: params?.page,
    },
  });

  return data;
}

export async function criarUsuario(payload: CriarUsuarioPayload) {
  const { data } = await api.post<UsuarioAdmin>("/usuarios", payload);
  return data;
}

export async function atualizarUsuario(id: string, payload: AtualizarUsuarioPayload) {
  const { data } = await api.put<UsuarioAdmin>(`/usuarios/${id}`, payload);
  return data;
}
