import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { AdminShell } from "./AdminShell";
import { renderWithProviders } from "@/test/test-utils";

describe("AdminShell", () => {
  it("expõe landmarks e navegação acessíveis", async () => {
    const { container } = renderWithProviders(
      <AdminShell
        currentUser={{
          id: "admin-1",
          name: "Admin Teste",
          email: "admin@teste.com",
          role: "administrador",
          must_change_password: false,
        }}
        activeTab="ordens"
      >
        <section>Conteúdo administrativo</section>
      </AdminShell>,
      { route: "/ordens-servico" }
    );

    expect(screen.getByRole("link", { name: /pular para o conteúdo principal/i })).toHaveAttribute(
      "href",
      "#conteudo-principal"
    );
    expect(screen.getByRole("navigation", { name: /navegação administrativa/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo-principal");
    expect(screen.getByRole("button", { name: /consultar os/i })).toHaveAttribute(
      "aria-current",
      "page"
    );

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });
});
