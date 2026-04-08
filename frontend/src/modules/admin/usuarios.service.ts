import { api } from "@/shared/api/client";

export type PerfilUsuario = "administrador" | "tecnico" | "atendente";

export type UsuarioAdmin = {
  id: string;
  name: string;
  email: string;
  role: PerfilUsuario;
  created_at?: string;
  updated_at?: string;
};

type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
};

export type ListarUsuariosParams = {
  q?: string;
  role?: PerfilUsuario | "todos";
  per_page?: number;
  page?: number;
};

export type SalvarUsuarioPayload = {
  name: string;
  email: string;
  role: PerfilUsuario;
  password?: string;
};

export async function listarUsuarios(params?: ListarUsuariosParams) {
  const { data } = await api.get<Paginated<UsuarioAdmin>>("/usuarios", {
    params: {
      q: params?.q || undefined,
      role: params?.role && params.role !== "todos" ? params.role : undefined,
      per_page: params?.per_page ?? 50,
      page: params?.page,
    },
  });

  return data;
}

export async function listarTodosUsuarios(params?: ListarUsuariosParams) {
  const acumulados: UsuarioAdmin[] = [];
  let paginaAtual = 1;
  let ultimaPagina = 1;
  let total = 0;

  do {
    const resposta = await listarUsuarios({
      ...params,
      page: paginaAtual,
      per_page: 100,
    });

    acumulados.push(...resposta.data);
    ultimaPagina = resposta.last_page || 1;
    total = resposta.total;
    paginaAtual += 1;
  } while (paginaAtual <= ultimaPagina);

  return {
    current_page: ultimaPagina,
    data: acumulados,
    per_page: 100,
    total,
    last_page: ultimaPagina,
  } satisfies Paginated<UsuarioAdmin>;
}

export async function criarUsuario(payload: SalvarUsuarioPayload) {
  const { data } = await api.post<UsuarioAdmin>("/usuarios", payload);
  return data;
}

export async function atualizarUsuario(id: string, payload: SalvarUsuarioPayload) {
  const { data } = await api.put<UsuarioAdmin>(`/usuarios/${id}`, payload);
  return data;
}
