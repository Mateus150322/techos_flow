import { useEffect, useRef, useState } from "react";

type LeafletGeoPreviewProps = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  label?: string;
};

type LeafletApi = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  marker: (
    coordinates: [number, number],
    options?: Record<string, unknown>
  ) => LeafletLayer;
  circle: (
    coordinates: [number, number],
    options?: Record<string, unknown>
  ) => LeafletLayer;
  divIcon: (options: Record<string, unknown>) => unknown;
};

type LeafletMap = {
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS_ID = "leaflet-css";
let leafletScriptPromise: Promise<LeafletApi> | null = null;

function carregarLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) {
    return;
  }

  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  document.head.append(link);
}

function carregarLeafletScript() {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (leafletScriptPromise) {
    return leafletScriptPromise;
  }

  leafletScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet indisponivel.")));
    script.onerror = () => reject(new Error("Nao foi possivel carregar o mapa."));
    document.body.append(script);
  });

  return leafletScriptPromise;
}

export function LeafletGeoPreview({
  latitude,
  longitude,
  accuracyMeters,
  label = "Localizacao capturada",
}: LeafletGeoPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapKey = `${latitude}:${longitude}:${accuracyMeters ?? ""}:${label}`;
  const [mapaProntoKey, setMapaProntoKey] = useState("");
  const [mapaErroKey, setMapaErroKey] = useState("");
  const status =
    mapaErroKey === mapKey ? "erro" : mapaProntoKey === mapKey ? "pronto" : "carregando";

  useEffect(() => {
    let cancelado = false;

    carregarLeafletCss();

    void carregarLeafletScript()
      .then((leaflet) => {
        if (cancelado || !mapContainerRef.current) {
          return;
        }

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const coordenadas: [number, number] = [latitude, longitude];
        const mapa = leaflet.map(mapContainerRef.current, {
          center: coordenadas,
          zoom: 18,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          })
          .addTo(mapa);

        const icon = leaflet.divIcon({
          className: "",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          html: '<span style="display:block;width:26px;height:26px;border-radius:999px;background:#2563eb;border:4px solid #ffffff;box-shadow:0 10px 25px rgba(15,23,42,.35);"></span>',
        });

        leaflet.marker(coordenadas, { icon, title: label }).addTo(mapa);

        if (typeof accuracyMeters === "number" && Number.isFinite(accuracyMeters) && accuracyMeters > 0) {
          leaflet
            .circle(coordenadas, {
              radius: accuracyMeters,
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.14,
              weight: 2,
            })
            .addTo(mapa);
        }

        mapRef.current = mapa;
        window.setTimeout(() => mapa.invalidateSize(), 0);
        setMapaErroKey("");
        setMapaProntoKey(mapKey);
      })
      .catch(() => {
        if (!cancelado) {
          setMapaErroKey(mapKey);
        }
      });

    return () => {
      cancelado = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accuracyMeters, label, latitude, longitude, mapKey]);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div ref={mapContainerRef} className="relative h-56 w-full bg-[var(--bg-soft)]">
        {status !== "pronto" ? (
          <div className="absolute inset-0 z-[450] flex items-center justify-center bg-[var(--bg-soft)] px-4 text-center text-sm text-[var(--text-muted)]">
            {status === "erro" ? "Mapa indisponivel neste momento." : "Carregando mapa..."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
