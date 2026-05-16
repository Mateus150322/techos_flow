import { MapPin, Upload } from "lucide-react";

import {
  formatarCoordenada,
  formatarDataHora,
  getTiposAceitosAnexo,
} from "../ordemServicoDetalhe.utils";
import type { GeolocalizacaoCapturada } from "@/shared/utils/geolocalizacao";

type Props = {
  variant: "page" | "modal";
  isDark?: boolean;
  processandoAcao: boolean;
  arquivoSelecionado: File | null;
  setArquivoSelecionado: (file: File | null) => void;
  tipoAnexo: string;
  selecionarTipoAnexo: (tipo: string) => void;
  incluirGeolocalizacao: boolean;
  alternarIncluirGeolocalizacao: (ativo: boolean) => void;
  processandoGeolocalizacao: boolean;
  geolocalizacaoCapturada: GeolocalizacaoCapturada | null;
  atualizarEnderecoCapturado: (value: string) => void;
  onCapturarGeolocalizacao: () => Promise<void> | void;
  onEnviar: () => Promise<void> | void;
};

function getClasses(variant: "page" | "modal") {
  if (variant === "modal") {
    return {
      panel: "app-card-soft space-y-3 rounded-2xl p-4",
      field: "app-input w-full px-4 py-3 text-sm",
      photoBox: "app-card rounded-2xl p-4",
      toggleText: "text-sm text-[var(--text-main)]",
      secondaryButton:
        "app-button-outline inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60",
      helperText: "app-muted text-sm",
      fileInfo: "app-muted text-sm",
      geoBox: "badge-success rounded-2xl border px-4 py-3 text-sm",
      textarea: "app-input mt-3 w-full px-4 py-3 text-sm",
      submitButton:
        "app-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60",
    };
  }

  return {
    panel: "app-card-soft space-y-4 rounded-2xl p-4",
    field: "app-input w-full px-4 py-3 text-sm disabled:opacity-60",
    photoBox: "app-card rounded-2xl p-4",
    toggleText: "text-sm text-[var(--text-main)]",
    secondaryButton:
      "app-button-outline inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60",
    helperText: "app-muted text-sm",
    fileInfo: "app-muted text-sm",
    geoBox: "badge-success rounded-xl border px-4 py-3 text-sm",
    textarea: "app-input w-full px-4 py-3 text-sm",
    submitButton:
      "app-button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
  };
}

export function EvidenciaUploadPanel({
  variant,
  isDark = false,
  processandoAcao,
  arquivoSelecionado,
  setArquivoSelecionado,
  tipoAnexo,
  selecionarTipoAnexo,
  incluirGeolocalizacao,
  alternarIncluirGeolocalizacao,
  processandoGeolocalizacao,
  geolocalizacaoCapturada,
  atualizarEnderecoCapturado,
  onCapturarGeolocalizacao,
  onEnviar,
}: Props) {
  void isDark;
  const classes = getClasses(variant);

  return (
    <div className={classes.panel}>
      <p className="text-sm font-semibold text-[var(--text-main)]">Enviar evidencia</p>

      <div className={variant === "page" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
        <select
          value={tipoAnexo}
          onChange={(event) => selecionarTipoAnexo(event.target.value)}
          disabled={processandoAcao}
          className={classes.field}
        >
          <option value="foto">Foto</option>
          <option value="pdf">PDF</option>
          <option value="arquivo">Arquivo</option>
        </select>

        <input
          type="file"
          accept={getTiposAceitosAnexo(tipoAnexo)}
          disabled={processandoAcao}
          onChange={(event) => setArquivoSelecionado(event.target.files?.[0] ?? null)}
          className={classes.field}
        />
      </div>

      {tipoAnexo === "foto" && (
        <div className={classes.photoBox}>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={incluirGeolocalizacao}
              disabled={processandoAcao || processandoGeolocalizacao}
              onChange={(event) => alternarIncluirGeolocalizacao(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
            />
            <span className={classes.toggleText}>
              Incluir a geolocalizacao do aparelho junto com a foto. Se quiser,
              informe um endereco ou ponto de referencia manualmente.
            </span>
          </label>

          {incluirGeolocalizacao && (
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={onCapturarGeolocalizacao}
                disabled={processandoAcao || processandoGeolocalizacao}
                className={classes.secondaryButton}
              >
                <MapPin className="h-4 w-4" />
                {processandoGeolocalizacao
                  ? "Capturando localizacao..."
                  : geolocalizacaoCapturada
                    ? "Atualizar localizacao"
                    : "Capturar localizacao"}
              </button>

              {geolocalizacaoCapturada ? (
                <div className={classes.geoBox}>
                  {variant === "page" && (
                    <p className="font-semibold">Localizacao pronta para envio</p>
                  )}
                  <p className={variant === "page" ? "mt-2" : undefined}>
                    Latitude: {formatarCoordenada(geolocalizacaoCapturada.latitude)}
                  </p>
                  <p>
                    Longitude: {formatarCoordenada(geolocalizacaoCapturada.longitude)}
                  </p>
                  <p>
                    Precisao:{" "}
                    {typeof geolocalizacaoCapturada.precisaoMetros === "number"
                      ? `${Math.round(geolocalizacaoCapturada.precisaoMetros)} m`
                      : "-"}
                  </p>
                  {variant === "page" && (
                    <p>Capturada em {formatarDataHora(geolocalizacaoCapturada.capturadaEm)}</p>
                  )}

                  <div className={variant === "page" ? "mt-3" : undefined}>
                    {variant === "page" && (
                      <label className="mb-2 block text-sm font-medium text-[var(--success)]">
                        Endereco ou referencia da evidencia
                      </label>
                    )}
                    <textarea
                      rows={3}
                      value={geolocalizacaoCapturada.endereco ?? ""}
                      onChange={(event) => atualizarEnderecoCapturado(event.target.value)}
                      placeholder="Endereco ou ponto de referencia da evidencia (opcional)."
                      className={classes.textarea}
                    />
                  </div>
                </div>
              ) : (
                <p className={classes.helperText}>
                  A localizacao atual sera vinculada a foto. O endereco pode ser
                  preenchido manualmente como complemento.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {arquivoSelecionado && (
        <p className={classes.fileInfo}>Arquivo selecionado: {arquivoSelecionado.name}</p>
      )}

      <div className={variant === "page" ? "sticky bottom-3 z-10 pt-2" : undefined}>
        <button
          type="button"
          onClick={onEnviar}
          disabled={processandoAcao || !arquivoSelecionado}
          className={classes.submitButton}
        >
          <Upload className="h-4 w-4" />
          {processandoAcao ? "Enviando..." : "Enviar evidencia"}
        </button>
      </div>
    </div>
  );
}
