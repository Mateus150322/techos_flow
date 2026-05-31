import { useEffect, useState } from "react";
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
};

function getClasses(variant: "page" | "modal") {
  if (variant === "modal") {
    return {
      outer: "app-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--text-main)]",
      link: "mt-1 block break-all text-[var(--primary)] hover:underline",
      fallback: "app-muted mt-1 break-all",
      previewButton:
        "mt-3 block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[var(--primary)]",
      previewFrame:
        "flex min-h-[180px] items-center justify-center bg-[var(--bg-soft)] p-3",
      previewImage: "max-h-[220px] w-auto max-w-full rounded-xl object-contain",
      previewPlaceholder:
        "app-muted flex min-h-[180px] items-center justify-center text-sm",
      geoCard: "app-card mt-3 rounded-xl px-3 py-3 text-[var(--text-main)]",
      mapLink: "inline-block text-[var(--primary)] hover:underline",
      innerTag: "app-card-soft rounded-xl px-3 py-3",
    };
  }

  return {
    outer: "app-card-soft rounded-lg px-3 py-3 text-sm text-[var(--text-main)]",
    link: "text-[var(--primary)] hover:underline",
    fallback: "app-muted",
    previewButton:
      "mt-3 block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] transition hover:border-[var(--primary)]",
    previewFrame:
      "flex min-h-[140px] items-center justify-center bg-[var(--bg-soft)] p-3",
    previewImage: "max-h-[180px] w-auto max-w-full rounded-lg object-contain",
    previewPlaceholder:
      "app-muted flex min-h-[140px] items-center justify-center text-sm",
    geoCard: "app-card mt-3 rounded-xl px-3 py-3 text-sm text-[var(--text-main)]",
    mapLink: "inline-block text-[var(--primary)] hover:underline",
    innerTag: "app-card-soft rounded-xl px-3 py-3",
  };
}

function GeoInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--text-main)]">{value}</p>
    </div>
  );
}

export function AnexoItemCard({
  anexo,
  variant,
  isDark = false,
  wrapper = "div",
}: Props) {
  const [baixandoArquivo, setBaixandoArquivo] = useState(false);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [erroArquivo, setErroArquivo] = useState("");

  void isDark;

  const classes = getClasses(variant);
  const Wrapper = wrapper;
  const fileLabel = anexo.nome_arquivo || anexo.id;
  const ehFoto = anexo.tipo === "foto";

  useEffect(() => {
    if (!ehFoto || !anexo.id) {
      setPreviewUrl("");
      setCarregandoPreview(false);
      return;
    }

    let ativo = true;
    let objectUrl = "";

    async function carregarPreview() {
      try {
        setCarregandoPreview(true);
        const { blob } = await obterArquivoAnexo(anexo.id);

        if (!ativo) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (ativo) {
          setPreviewUrl("");
        }
      } finally {
        if (ativo) {
          setCarregandoPreview(false);
        }
      }
    }

    void carregarPreview();

    return () => {
      ativo = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [anexo.id, ehFoto]);

  async function handleAbrirArquivo() {
    const ehVisualizavel = ehFoto || anexo.tipo === "pdf";
    const previewWindow = ehVisualizavel
      ? window.open("", "_blank", "noopener,noreferrer")
      : null;

    if (ehFoto && previewUrl) {
      try {
        setErroArquivo("");
        if (previewWindow) {
          previewWindow.location.href = previewUrl;
        }
        return;
      } catch {
        if (previewWindow) {
          previewWindow.close();
        }
      }
    }

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
      <p className="font-medium text-[var(--text-main)]">{anexo.tipo || "Arquivo"}</p>

      {ehFoto ? (
        <button
          type="button"
          onClick={() => void handleAbrirArquivo()}
          disabled={baixandoArquivo}
          className={classes.previewButton}
        >
          <div className={classes.previewFrame}>
            {previewUrl ? (
              <img src={previewUrl} alt={fileLabel} className={classes.previewImage} />
            ) : carregandoPreview ? (
              <span className={classes.previewPlaceholder}>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando miniatura...
                </span>
              </span>
            ) : (
              <span className={classes.previewPlaceholder}>Miniatura indisponível</span>
            )}
          </div>
        </button>
      ) : null}

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

      {erroArquivo ? <p className="mt-2 text-xs text-[var(--danger)]">{erroArquivo}</p> : null}

      {typeof anexo.latitude === "number" && typeof anexo.longitude === "number" && (
        <div className={classes.geoCard}>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
            <div className="space-y-3">
              <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                Geolocalização da evidência
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <GeoInfoItem label="Latitude" value={formatarCoordenada(anexo.latitude)} />
                <GeoInfoItem label="Longitude" value={formatarCoordenada(anexo.longitude)} />
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
              <div className={classes.innerTag}>
                <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Endereço capturado pela geolocalização
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <GeoInfoItem label="Rua" value={anexo.rua_capturada || "-"} />
                  <GeoInfoItem label="Bairro" value={anexo.bairro_capturado || "-"} />
                  <GeoInfoItem label="Cidade" value={anexo.cidade_capturada || "-"} />
                  <GeoInfoItem label="Estado" value={anexo.estado_capturado || "-"} />
                </div>
              </div>
              {anexo.endereco_capturado && (
                <div className={classes.innerTag}>
                  <p className="app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Endereço completo informado
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-main)]">
                    {anexo.endereco_capturado}
                  </p>
                </div>
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
