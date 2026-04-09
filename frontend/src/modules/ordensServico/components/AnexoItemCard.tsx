import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { obterArquivoAnexo, type Anexo } from "../ordensServico.service";
import { formatarCoordenada, formatarDataHora } from "../ordemServicoDetalhe.utils";
import { getGoogleMapsUrl } from "@/shared/utils/geolocalizacao";
import { getApiErrorMessage } from "@/shared/utils/apiError";

type Props = {
  anexo: Anexo;
  variant: "page" | "modal";
  isDark?: boolean;
  wrapper?: "div" | "li";
  enderecoReferencia?: string;
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

function GeoInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export function AnexoItemCard({
  anexo,
  variant,
  isDark = false,
  wrapper = "div",
  enderecoReferencia,
}: Props) {
  const [baixandoArquivo, setBaixandoArquivo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState("");
  const classes = getClasses(variant, isDark);
  const Wrapper = wrapper;
  const fileLabel = anexo.nome_arquivo || anexo.id;

  async function handleAbrirArquivo() {
    const ehVisualizavel = anexo.tipo === "foto" || anexo.tipo === "pdf";
    const previewWindow = ehVisualizavel ? window.open("", "_blank", "noopener,noreferrer") : null;

    try {
      setBaixandoArquivo(true);
      setErroArquivo("");

      const { blob, fileName } = await obterArquivoAnexo(anexo.id);
      const objectUrl = URL.createObjectURL(blob);

      if (ehVisualizavel && previewWindow) {
        previewWindow.location.href = objectUrl;
      } else {
        if (previewWindow) {
          previewWindow.close();
        }

        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName || fileLabel || `anexo-${anexo.id}`;
        anchor.rel = "noreferrer";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
      }

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 60_000);
    } catch (error) {
      if (previewWindow) {
        previewWindow.close();
      }

      setErroArquivo(getApiErrorMessage(error, "Não foi possível abrir o anexo."));
    } finally {
      setBaixandoArquivo(false);
    }
  }

  return (
    <Wrapper className={classes.outer}>
      <p className="font-medium">{anexo.tipo || "Arquivo"}</p>

      {anexo.id ? (
        <button
          type="button"
          onClick={() => void handleAbrirArquivo()}
          disabled={baixandoArquivo}
          className={classes.link}
        >
          {baixandoArquivo ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Abrindo anexo...
            </span>
          ) : (
            fileLabel
          )}
        </button>
      ) : (
        <p className={classes.fallback}>{anexo.nome_arquivo || "-"}</p>
      )}

      {erroArquivo ? <p className="mt-2 text-xs text-red-600">{erroArquivo}</p> : null}

      {typeof anexo.latitude === "number" && typeof anexo.longitude === "number" && (
        <div className={classes.geoCard}>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Geolocalização da evidência
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <GeoInfoItem
                  label="Latitude"
                  value={formatarCoordenada(anexo.latitude)}
                />
                <GeoInfoItem
                  label="Longitude"
                  value={formatarCoordenada(anexo.longitude)}
                />
                <GeoInfoItem
                  label="Precisão"
                  value={
                    typeof anexo.precisao_metros === "number"
                      ? `${Math.round(anexo.precisao_metros)} m`
                      : "-"
                  }
                />
                <GeoInfoItem
                  label="Capturada em"
                  value={
                    anexo.geolocalizacao_capturada_em
                      ? formatarDataHora(anexo.geolocalizacao_capturada_em)
                      : "-"
                  }
                />
              </div>
              {anexo.endereco_capturado && (
                <div className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Referência
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {anexo.endereco_capturado}
                  </p>
                </div>
              )}
              {enderecoReferencia ? (
                <div className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Endereço da OS
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {enderecoReferencia}
                  </p>
                </div>
              ) : null}
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
