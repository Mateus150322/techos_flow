import { MapPin } from "lucide-react";

import type { Anexo } from "../ordensServico.service";
import { formatarCoordenada, formatarDataHora } from "../ordemServicoDetalhe.utils";
import { getGoogleMapsUrl } from "@/shared/utils/geolocalizacao";

type Props = {
  anexo: Anexo;
  variant: "page" | "modal";
  isDark?: boolean;
  wrapper?: "div" | "li";
};

function getClasses(variant: "page" | "modal", isDark: boolean) {
  if (variant === "modal") {
    return {
      outer:
        "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700",
      link: "mt-1 block break-all text-blue-600 hover:underline",
      fallback: "mt-1 break-all text-slate-500",
      geoCard:
        "mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-600",
      mapLink: "inline-block text-blue-600 hover:underline",
    };
  }

  return {
    outer: `rounded-lg border px-3 py-3 text-sm ${
      isDark
        ? "border-slate-800 bg-slate-950 text-slate-200"
        : "border-slate-200 bg-slate-50 text-slate-700"
    }`,
    link: "text-blue-600 hover:underline",
    fallback: isDark ? "text-slate-400" : "text-slate-500",
    geoCard: `mt-3 rounded-xl border px-3 py-3 text-sm ${
      isDark
        ? "border-slate-800 bg-slate-950 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-700"
    }`,
    mapLink: "inline-block text-blue-600 hover:underline",
  };
}

export function AnexoItemCard({
  anexo,
  variant,
  isDark = false,
  wrapper = "div",
}: Props) {
  const classes = getClasses(variant, isDark);
  const Wrapper = wrapper;

  return (
    <Wrapper className={classes.outer}>
      <p className="font-medium">{anexo.tipo || "Arquivo"}</p>

      {anexo.url ? (
        <a
          href={anexo.url}
          target="_blank"
          rel="noreferrer"
          className={classes.link}
        >
          {anexo.caminho ? anexo.caminho.split("/").pop() : anexo.id}
        </a>
      ) : (
        <p className={classes.fallback}>{anexo.caminho || "-"}</p>
      )}

      {typeof anexo.latitude === "number" && typeof anexo.longitude === "number" && (
        <div className={classes.geoCard}>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
            <div className="space-y-1">
              <p>
                Lat {formatarCoordenada(anexo.latitude)} | Lon{" "}
                {formatarCoordenada(anexo.longitude)}
              </p>
              <p>
                Precisao:{" "}
                {typeof anexo.precisao_metros === "number"
                  ? `${Math.round(anexo.precisao_metros)} m`
                  : "-"}
              </p>
              {anexo.geolocalizacao_capturada_em && (
                <p>
                  Capturada em {formatarDataHora(anexo.geolocalizacao_capturada_em)}
                </p>
              )}
              {anexo.endereco_capturado && (
                <p className="whitespace-pre-wrap">
                  Endereco/Referencia: {anexo.endereco_capturado}
                </p>
              )}
              <a
                href={getGoogleMapsUrl(anexo.latitude, anexo.longitude)}
                target="_blank"
                rel="noreferrer"
                className={classes.mapLink}
              >
                Abrir no mapa
              </a>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
