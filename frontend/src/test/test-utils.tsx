import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { ThemeProvider } from "@/shared/hooks/ThemeProvider";

type Options = {
  route?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: Options = {}
) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider>{children}</ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
