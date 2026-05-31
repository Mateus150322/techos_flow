import { api } from "@/shared/api/client";

export type ColaboradorOperacionalAdmin = {
  id: string;
  name: string;
  funcao: string;
  valor_hora?: string | null;
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
  };
};

export type ListarColaboradoresParams = {
  q?: string;
  status?: "todos" | "ativos" | "inativos";
  per_page?: number;
  page?: number;
};

export type CriarColaboradorPayload = {
  name: string;
  funcao: string;
  valor_hora?: number;
};

export type AtualizarColaboradorPayload = {
  name?: string;
  funcao?: string;
  valor_hora?: number;
  is_active?: boolean;
};

export async function listarColaboradoresOperacionais(
  params?: ListarColaboradoresParams
) {
  const { data } = await api.get<Paginated<ColaboradorOperacionalAdmin>>(
    "/colaboradores-operacionais",
    {
      params: {
        q: params?.q || undefined,
        status:
          params?.status && params.status !== "todos" ? params.status : undefined,
        per_page: params?.per_page ?? 10,
        page: params?.page,
      },
    }
  );

  return data;
}

export async function criarColaboradorOperacional(
  payload: CriarColaboradorPayload
) {
  const { data } = await api.post<ColaboradorOperacionalAdmin>(
    "/colaboradores-operacionais",
    payload
  );

  return data;
}

export async function atualizarColaboradorOperacional(
  id: string,
  payload: AtualizarColaboradorPayload
) {
  const { data } = await api.put<ColaboradorOperacionalAdmin>(
    `/colaboradores-operacionais/${id}`,
    payload
  );

  return data;
}
