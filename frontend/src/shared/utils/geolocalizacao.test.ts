import { afterEach, describe, expect, it, vi } from "vitest";

import {
  capturarGeolocalizacaoAtual,
  diagnosticarGeolocalizacao,
  getGoogleMapsUrl,
} from "./geolocalizacao";

describe("geolocalizacao", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it("identifica contexto inseguro fora de localhost", () => {
    vi.stubGlobal("navigator", {
      geolocation: {},
    } as Navigator);
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        hostname: "192.168.0.10",
      },
    });

    const diagnostico = diagnosticarGeolocalizacao();

    expect(diagnostico.disponivel).toBe(false);
    expect(diagnostico.requerHttps).toBe(true);
  });

  it("reaproveita localizacao valida em cache", async () => {
    const geolocalizacao = {
      latitude: -9.97,
      longitude: -67.81,
      precisaoMetros: 18,
      capturadaEm: new Date().toISOString(),
      rua: null,
      bairro: null,
      cidade: null,
      estado: null,
      endereco: null,
    };

    window.sessionStorage.setItem(
      "techosflow:last-valid-geolocation",
      JSON.stringify(geolocalizacao)
    );

    const capturada = await capturarGeolocalizacaoAtual();

    expect(capturada).toEqual(geolocalizacao);
  });

  it("gera link do Google Maps com coordenadas", () => {
    expect(getGoogleMapsUrl(-9.97, -67.81)).toContain("query=-9.97%2C-67.81");
  });

  it("aceita a melhor localizacao encontrada quando nao alcanca 100 metros", async () => {
    vi.useFakeTimers();

    const criarPosicao = (accuracy: number): GeolocationPosition =>
      ({
        coords: {
          latitude: -9.97,
          longitude: -67.81,
          accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      }) as GeolocationPosition;

    let chamadasGetCurrentPosition = 0;

    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => {
          chamadasGetCurrentPosition += 1;

          if (chamadasGetCurrentPosition === 1) {
            success(criarPosicao(180));
            return;
          }

          success(criarPosicao(140));
        },
        watchPosition: (success: PositionCallback) => {
          success(criarPosicao(120));
          return 1;
        },
        clearWatch: vi.fn(),
      },
    } as unknown as Navigator);

    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        hostname: "localhost",
      },
    });

    const capturaPromise = capturarGeolocalizacaoAtual();

    await vi.advanceTimersByTimeAsync(30000);

    const capturada = await capturaPromise;

    expect(capturada.precisaoMetros).toBe(120);
  });
});
