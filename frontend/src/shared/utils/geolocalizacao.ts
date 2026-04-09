export type GeolocalizacaoCapturada = {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
  capturadaEm: string;
  endereco?: string | null;
};

async function obterPosicaoAtual(): Promise<GeolocationPosition> {
  if (!("geolocation" in navigator)) {
    throw new Error("Este dispositivo não oferece suporte a geolocalização.");
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
                "Permita o acesso à localização no navegador para enviar a foto com geolocalização."
              )
            );
            return;
          case error.TIMEOUT:
            reject(new Error("A captura da localização expirou. Tente novamente."));
            return;
          default:
            reject(new Error("Não foi possível obter a localização atual."));
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

export async function capturarGeolocalizacaoAtual(): Promise<GeolocalizacaoCapturada> {
  const position = await obterPosicaoAtual();

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    precisaoMetros: Number.isFinite(position.coords.accuracy)
      ? position.coords.accuracy
      : undefined,
    capturadaEm: new Date(position.timestamp).toISOString(),
    endereco: null,
  };
}

export function getGoogleMapsUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    api: "1",
    query: `${latitude},${longitude}`,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
