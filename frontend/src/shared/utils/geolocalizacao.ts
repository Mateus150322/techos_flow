export type GeolocalizacaoCapturada = {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
  capturadaEm: string;
  rua?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;
};

export type DiagnosticoGeolocalizacao = {
  disponivel: boolean;
  requerHttps: boolean;
  mensagem: string | null;
};

export type EnderecoReversoCapturado = {
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  enderecoFormatado: string | null;
};

const PRECISAO_MAXIMA_ACEITAVEL_METROS = 100;
const TEMPO_MAXIMO_CAPTURA_MS = 30000;
const TEMPO_TENTATIVA_RAPIDA_MS = 6000;
const TEMPO_TENTATIVA_PRECISA_MS = 10000;
const MAX_CACHE_AGE_MS = 2 * 60 * 1000;
const CACHE_KEY = "techosflow:last-valid-geolocation";

function isHostLocal(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function formatarEnderecoCapturado(endereco: Omit<EnderecoReversoCapturado, "enderecoFormatado">) {
  const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(" - ");

  return [endereco.rua, endereco.bairro, cidadeEstado].filter(Boolean).join(", ") || null;
}

function isPrecisaoValida(precisao?: number) {
  return typeof precisao === "number" && Number.isFinite(precisao) && precisao <= PRECISAO_MAXIMA_ACEITAVEL_METROS;
}

function isPrecisaoMensuravel(precisao?: number) {
  return typeof precisao === "number" && Number.isFinite(precisao) && precisao > 0;
}

function escolherMelhorPosicao(
  atual: GeolocationPosition | null,
  candidata: GeolocationPosition | null
) {
  if (!candidata) {
    return atual;
  }

  if (!atual) {
    return candidata;
  }

  const precisaoAtual = atual.coords.accuracy;
  const precisaoCandidata = candidata.coords.accuracy;

  if (!isPrecisaoMensuravel(precisaoAtual)) {
    return candidata;
  }

  if (!isPrecisaoMensuravel(precisaoCandidata)) {
    return atual;
  }

  return precisaoCandidata < precisaoAtual ? candidata : atual;
}

function normalizarPosicao(position: GeolocationPosition): GeolocalizacaoCapturada {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    precisaoMetros: Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : undefined,
    capturadaEm: new Date(position.timestamp).toISOString(),
    rua: null,
    bairro: null,
    cidade: null,
    estado: null,
    endereco: null,
  };
}

function salvarUltimaCapturaValida(geolocalizacao: GeolocalizacaoCapturada) {
  if (typeof window === "undefined" || !isPrecisaoValida(geolocalizacao.precisaoMetros)) {
    return;
  }

  window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(geolocalizacao));
}

function obterUltimaCapturaValida(): GeolocalizacaoCapturada | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CACHE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const geolocalizacao = JSON.parse(raw) as GeolocalizacaoCapturada;
    const capturadaEm = Date.parse(geolocalizacao.capturadaEm);

    if (!Number.isFinite(capturadaEm)) {
      return null;
    }

    if (Date.now() - capturadaEm > MAX_CACHE_AGE_MS) {
      return null;
    }

    return isPrecisaoValida(geolocalizacao.precisaoMetros) ? geolocalizacao : null;
  } catch {
    return null;
  }
}

async function obterEnderecoPorCoordenadas(
  latitude: number,
  longitude: number
): Promise<EnderecoReversoCapturado | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    zoom: "18",
    layer: "address",
    "accept-language": "pt-BR",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };

  const address = data.address ?? {};
  const endereco = {
    rua: firstNonEmpty(
      address.road,
      address.pedestrian,
      address.footway,
      address.path,
      address.cycleway,
      address.residential
    ),
    bairro: firstNonEmpty(
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.residential,
      address.quarter,
      address.hamlet
    ),
    cidade: firstNonEmpty(
      address.city,
      address.town,
      address.village,
      address.municipality,
      address.county
    ),
    estado: firstNonEmpty(address.state, address.region),
  };

  return {
    ...endereco,
    enderecoFormatado: formatarEnderecoCapturado(endereco) ?? data.display_name?.trim() ?? null,
  };
}

function obterPosicaoUnica(options: PositionOptions): Promise<GeolocationPosition | null> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              "Permita o acesso a localizacao no navegador para enviar a foto com geolocalizacao."
            )
          );
          return;
        }

        resolve(null);
      },
      options
    );
  });
}

function obterPosicaoAssistida(
  melhorPosicaoInicial: GeolocationPosition | null = null
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let melhorPosicao: GeolocationPosition | null = melhorPosicaoInicial;
    let finalizado = false;
    let ultimoErro: string | null = null;
    let watchId: number | null = null;

    const finalizar = (callback: () => void) => {
      if (finalizado) {
        return;
      }

      finalizado = true;

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      window.clearTimeout(timerId);
      callback();
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        melhorPosicao = escolherMelhorPosicao(melhorPosicao, position);

        if (position.coords.accuracy <= PRECISAO_MAXIMA_ACEITAVEL_METROS) {
          finalizar(() => resolve(position));
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finalizar(() =>
            reject(
              new Error(
                "Permita o acesso a localizacao no navegador para enviar a foto com geolocalizacao."
              )
            )
          );
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          ultimoErro =
            "O aparelho ainda nao conseguiu determinar sua localizacao. Tente novamente em uma area mais aberta.";
          return;
        }

        if (error.code === error.TIMEOUT) {
          ultimoErro = "A captura de localizacao demorou demais. Tente novamente com o GPS ativo.";
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: TEMPO_MAXIMO_CAPTURA_MS,
      }
    );

    const timerId = window.setTimeout(() => {
      if (melhorPosicao && isPrecisaoMensuravel(melhorPosicao.coords.accuracy)) {
        const melhorPosicaoEncontrada = melhorPosicao;

        finalizar(() => resolve(melhorPosicaoEncontrada));
        return;
      }

      finalizar(() =>
        reject(
          new Error(
            ultimoErro ?? "Nao foi possivel obter a localizacao do dispositivo. Tente novamente em uma area mais aberta."
          )
        )
      );
    }, TEMPO_MAXIMO_CAPTURA_MS);
  });
}

export function diagnosticarGeolocalizacao(): DiagnosticoGeolocalizacao {
  if (typeof window === "undefined") {
    return {
      disponivel: true,
      requerHttps: false,
      mensagem: null,
    };
  }

  if (!("geolocation" in navigator)) {
    return {
      disponivel: false,
      requerHttps: false,
      mensagem: "Este dispositivo nao oferece suporte a geolocalizacao.",
    };
  }

  const acessoLocal = isHostLocal(window.location.hostname);

  if (!window.isSecureContext && !acessoLocal) {
    return {
      disponivel: false,
      requerHttps: true,
      mensagem:
        "A captura de localizacao no celular precisa de HTTPS ou acesso local. Pelo link de rede do Vite, o navegador pode bloquear a geolocalizacao.",
    };
  }

  return {
    disponivel: true,
    requerHttps: false,
    mensagem: null,
  };
}

async function obterPosicaoAtual(): Promise<GeolocationPosition> {
  const diagnostico = diagnosticarGeolocalizacao();

  if (!diagnostico.disponivel) {
    throw new Error(
      diagnostico.mensagem ?? "Nao foi possivel iniciar a captura da localizacao."
    );
  }

  const tentativaRapida = await obterPosicaoUnica({
    enableHighAccuracy: false,
    maximumAge: MAX_CACHE_AGE_MS,
    timeout: TEMPO_TENTATIVA_RAPIDA_MS,
  });

  if (tentativaRapida && isPrecisaoValida(tentativaRapida.coords.accuracy)) {
    return tentativaRapida;
  }

  const tentativaPrecisa = await obterPosicaoUnica({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: TEMPO_TENTATIVA_PRECISA_MS,
  });

  if (tentativaPrecisa && isPrecisaoValida(tentativaPrecisa.coords.accuracy)) {
    return tentativaPrecisa;
  }

  const melhorTentativaInicial = escolherMelhorPosicao(tentativaRapida, tentativaPrecisa);

  return obterPosicaoAssistida(melhorTentativaInicial);
}

export async function capturarGeolocalizacaoAtual(): Promise<GeolocalizacaoCapturada> {
  const cache = obterUltimaCapturaValida();

  if (cache) {
    return cache;
  }

  const position = await obterPosicaoAtual();
  const geolocalizacao = normalizarPosicao(position);

  salvarUltimaCapturaValida(geolocalizacao);

  return geolocalizacao;
}

export async function preencherEnderecoCapturado(
  geolocalizacao: GeolocalizacaoCapturada
): Promise<GeolocalizacaoCapturada> {
  let enderecoReverso: EnderecoReversoCapturado | null = null;

  try {
    enderecoReverso = await obterEnderecoPorCoordenadas(
      geolocalizacao.latitude,
      geolocalizacao.longitude
    );
  } catch {
    enderecoReverso = null;
  }

  const geolocalizacaoComEndereco = {
    ...geolocalizacao,
    rua: enderecoReverso?.rua ?? geolocalizacao.rua ?? null,
    bairro: enderecoReverso?.bairro ?? geolocalizacao.bairro ?? null,
    cidade: enderecoReverso?.cidade ?? geolocalizacao.cidade ?? null,
    estado: enderecoReverso?.estado ?? geolocalizacao.estado ?? null,
    endereco: enderecoReverso?.enderecoFormatado ?? geolocalizacao.endereco ?? null,
  };

  salvarUltimaCapturaValida(geolocalizacaoComEndereco);

  return geolocalizacaoComEndereco;
}

export function getGoogleMapsUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    api: "1",
    query: `${latitude},${longitude}`,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
