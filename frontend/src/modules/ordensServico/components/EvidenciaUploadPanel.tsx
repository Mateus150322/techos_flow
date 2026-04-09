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

function getClasses(variant: "page" | "modal", isDark: boolean) {
  if (variant === "modal") {
    return {
      panel: "space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4",
      field:
        "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900",
      photoBox: "rounded-2xl border border-slate-200 bg-white p-4",
      toggleText: "text-sm text-slate-700",
      secondaryButton:
        "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60",
      helperText: "text-sm text-slate-500",
      fileInfo: "text-sm text-slate-500",
      geoBox:
        "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700",
      textarea:
        "mt-3 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900",
      submitButton:
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60",
    };
  }

  return {
    panel: `space-y-4 rounded-2xl border p-4 ${
      isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
    }`,
    field: `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${
      isDark
        ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
        : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
    }`,
    photoBox: `rounded-2xl border p-4 ${
      isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
    }`,
    toggleText: `text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`,
    secondaryButton: `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
      isDark
        ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
    }`,
    helperText: `text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`,
    fileInfo: `text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`,
    geoBox:
      "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700",
    textarea:
      "w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-500",
    submitButton:
      "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60",
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
  const classes = getClasses(variant, isDark);

  return (
    <div className={classes.panel}>
      <p className="text-sm font-semibold text-slate-900">Enviar evidência</p>

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
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className={classes.toggleText}>
              Incluir a geolocalização do aparelho junto com a foto. Se quiser,
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
                  ? "Capturando localização..."
                  : geolocalizacaoCapturada
                    ? "Atualizar localização"
                    : "Capturar localização"}
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
                    <p>
                      Capturada em{" "}
                      {formatarDataHora(geolocalizacaoCapturada.capturadaEm)}
                    </p>
                  )}

                  <div className={variant === "page" ? "mt-3" : undefined}>
                    {variant === "page" && (
                      <label className="mb-2 block text-sm font-medium text-emerald-800">
                        Endereço ou referência da evidência
                      </label>
                    )}
                    <textarea
                      rows={3}
                      value={geolocalizacaoCapturada.endereco ?? ""}
                      onChange={(event) =>
                        atualizarEnderecoCapturado(event.target.value)
                      }
                      placeholder="Endereço ou ponto de referência da evidência (opcional)."
                      className={classes.textarea}
                    />
                  </div>
                </div>
              ) : (
                <p className={classes.helperText}>
                  A localização atual será vinculada à foto. O endereço pode ser
                  preenchido manualmente como complemento.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {arquivoSelecionado && (
        <p className={classes.fileInfo}>
          Arquivo selecionado: {arquivoSelecionado.name}
        </p>
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={processandoAcao || !arquivoSelecionado}
        className={classes.submitButton}
      >
        <Upload className="h-4 w-4" />
        {processandoAcao ? "Enviando..." : "Enviar evidência"}
      </button>
    </div>
  );
}
