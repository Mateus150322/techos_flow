import { describe, expect, it } from "vitest";

import {
  getApiErrorMessage,
  getApiValidationErrors,
  getFirstApiValidationMessage,
} from "./apiError";

describe("apiError", () => {
  it("normaliza mensagem de autenticacao expirada", () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            status: 401,
            data: {
              message: "Unauthenticated.",
            },
          },
        },
        "fallback"
      )
    ).toBe("Sua sessao expirou. Faca login novamente.");
  });

  it("mapeia erros de rede para mensagem amigavel", () => {
    const error = new Error("Network Error") as Error & { code?: string };
    error.code = "ERR_NETWORK";

    expect(
      getApiErrorMessage(
        error,
        "fallback"
      )
    ).toContain("Nao foi possivel conectar ao servidor");
  });

  it("preserva mensagens locais do cliente quando nao ha status de API", () => {
    expect(
      getApiErrorMessage(
        new Error("Permita o acesso a localizacao no navegador para enviar a foto com geolocalizacao."),
        "fallback"
      )
    ).toBe("Permita o acesso a localizacao no navegador para enviar a foto com geolocalizacao.");
  });

  it("normaliza erros de validacao", () => {
    const error = {
      response: {
        data: {
          errors: {
            email: ["O campo e-mail Ã© obrigatÃ³rio."],
          },
        },
      },
    };

    expect(getApiValidationErrors(error)).toEqual({
      email: ["O campo e-mail e obrigatorio."],
    });
    expect(getFirstApiValidationMessage(error, ["email"])).toBe(
      "O campo e-mail e obrigatorio."
    );
  });
});
