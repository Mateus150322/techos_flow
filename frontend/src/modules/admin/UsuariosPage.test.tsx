import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import UsuariosPage from "./UsuariosPage";
import { renderWithProviders } from "@/test/test-utils";

const usuariosServiceMock = vi.hoisted(() => ({
  listarUsuarios: vi.fn(),
  criarUsuario: vi.fn(),
  atualizarUsuario: vi.fn(),
}));

const colaboradoresServiceMock = vi.hoisted(() => ({
  listarColaboradoresOperacionais: vi.fn(),
  criarColaboradorOperacional: vi.fn(),
  atualizarColaboradorOperacional: vi.fn(),
}));

vi.mock("./usuarios.service", () => ({
  listarUsuarios: usuariosServiceMock.listarUsuarios,
  criarUsuario: usuariosServiceMock.criarUsuario,
  atualizarUsuario: usuariosServiceMock.atualizarUsuario,
}));

vi.mock("./colaboradores.service", () => ({
  listarColaboradoresOperacionais:
    colaboradoresServiceMock.listarColaboradoresOperacionais,
  criarColaboradorOperacional:
    colaboradoresServiceMock.criarColaboradorOperacional,
  atualizarColaboradorOperacional:
    colaboradoresServiceMock.atualizarColaboradorOperacional,
}));

vi.mock("@/shared/auth/session", () => ({
  useCurrentUser: () => ({
    id: "admin-1",
    name: "Admin Teste",
    email: "admin@teste.com",
    role: "administrador",
    must_change_password: false,
  }),
}));

describe("UsuariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuariosServiceMock.listarUsuarios.mockResolvedValue({
      current_page: 1,
      data: [
        {
          id: "user-1",
          name: "Carlos Andrade",
          email: "carlos@teste.com",
          role: "tecnico",
          is_active: true,
          valor_hora: "25.50",
          created_at: "2026-05-01T10:00:00",
          updated_at: "2026-05-02T10:00:00",
        },
      ],
      per_page: 10,
      total: 1,
      last_page: 1,
      stats: {
        total: 1,
        ativos: 1,
        inativos: 0,
        administradores: 1,
        tecnicos: 1,
        atendentes: 0,
        ultimos_7_dias: 1,
      },
    });
    usuariosServiceMock.criarUsuario.mockResolvedValue({});
    usuariosServiceMock.atualizarUsuario.mockResolvedValue({});
    colaboradoresServiceMock.listarColaboradoresOperacionais.mockResolvedValue({
      current_page: 1,
      data: [
        {
          id: "colab-1",
          name: "João Apoio",
          funcao: "Auxiliar técnico",
          valor_hora: "18.50",
          is_active: true,
          created_at: "2026-05-01T10:00:00",
          updated_at: "2026-05-02T10:00:00",
        },
      ],
      per_page: 50,
      total: 1,
      last_page: 1,
      stats: {
        total: 1,
        ativos: 1,
        inativos: 0,
      },
    });
    colaboradoresServiceMock.criarColaboradorOperacional.mockResolvedValue({});
    colaboradoresServiceMock.atualizarColaboradorOperacional.mockResolvedValue(
      {},
    );
  });

  it("renderiza a listagem e o formulário sem violações básicas de acessibilidade", async () => {
    const { container } = renderWithProviders(<UsuariosPage />, {
      route: "/admin/usuarios",
    });

    expect(
      await screen.findByRole("heading", { name: /gerenciar usuários/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /colaboradores operacionais/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /novo usuário/i }),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/carlos@teste\.com/i)).length,
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/joão apoio/i)).length).toBeGreaterThan(
      0,
    );

    fireEvent.click(screen.getByRole("button", { name: /novo usuário/i }));

    expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^perfil$/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
