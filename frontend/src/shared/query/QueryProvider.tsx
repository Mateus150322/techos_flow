import type { ReactNode } from "react";
import type { Query } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { fieldQueryPersister } from "@/shared/offline/database";
import { queryClient } from "./queryClient";

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CACHE_BUSTER = "techos-flow-field-v2";

function devePersistirQuery(query: Query) {
  const chave = query.queryKey[0];

  return (
    query.state.status === "success" &&
    (chave === "dashboard-tecnico" ||
      chave === "ordem-servico" ||
      chave === "funcionarios-disponiveis")
  );
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: CACHE_BUSTER,
        maxAge: CACHE_MAX_AGE_MS,
        persister: fieldQueryPersister,
        dehydrateOptions: {
          shouldDehydrateQuery: devePersistirQuery,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
