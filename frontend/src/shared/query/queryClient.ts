import { QueryClient } from "@tanstack/react-query";

import { clearPersistedFieldData } from "@/shared/offline/database";

export const queryKeys = {
  dashboardTecnico: (search: string, status: string) =>
    ["dashboard-tecnico", { search, status }] as const,
  ordemServico: (id: string) => ["ordem-servico", id] as const,
  funcionariosDisponiveis: ["funcionarios-disponiveis"] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
      networkMode: "offlineFirst",
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      networkMode: "online",
      retry: 0,
    },
  },
});

export async function clearFieldQueryCache() {
  queryClient.clear();
  await clearPersistedFieldData();
}
