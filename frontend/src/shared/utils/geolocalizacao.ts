export type GeolocalizacaoCapturada = {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
  capturadaEm: string;
  endereco?: string | null;
};

async function obterPosicaoAtual(): Promise<GeolocationPosition> {
  if (!("geolocation" in navigator)) {
    throw new Error("Este dispositivo nao oferece suporte a geolocalizacao.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error(
                "Permita o acesso a localizacao no navegador para enviar a foto com geolocalizacao."
              )
            );
            return;
          case error.TIMEOUT:
            reject(new Error("A captura da localizacao expirou. Tente novamente."));
            return;
          default:
            reject(new Error("Nao foi possivel obter a localizacao atual."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

async function resolverEnderecoPorCoordenadas(latitude: number, longitude: number) {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "18",
      addressdetails: "1",
      "accept-language": "pt-BR",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { display_name?: string };

    if (typeof data.display_name === "string" && data.display_name.trim()) {
      return data.display_name.trim();
    }
  } catch {
    return null;
  }

  return null;
}

export async function capturarGeolocalizacaoAtual(): Promise<GeolocalizacaoCapturada> {
  const position = await obterPosicaoAtual();
  const endereco = await resolverEnderecoPorCoordenadas(
    position.coords.latitude,
    position.coords.longitude
  );

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    precisaoMetros: Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : undefined,
    capturadaEm: new Date(position.timestamp).toISOString(),
    endereco,
  };
}

export function getGoogleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
