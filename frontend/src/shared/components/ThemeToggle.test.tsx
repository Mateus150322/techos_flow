import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { ThemeToggle } from "./ThemeToggle";
import { renderWithProviders } from "@/test/test-utils";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
  });

  it("renderiza sem violações básicas de acessibilidade", async () => {
    const { container } = renderWithProviders(<ThemeToggle />);

    const results = await axe(container);

    expect(results.violations).toHaveLength(0);
  });

  it("alterna o tema e atualiza o estado acessível", () => {
    renderWithProviders(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /alternar tema/i });

    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("techos-theme")).toBe("dark");
  });
});
