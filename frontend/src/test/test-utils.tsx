import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { ThemeProvider } from "@/shared/hooks/ThemeProvider";

type Options = {
  route?: string;
};

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: Options = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>{children}</ThemeProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
