import { MapPin, Upload } from "lucide-react";

import {
  formatarCoordenada,
  formatarDataHora,
  getTiposAceitosAnexo,
} from "../ordemServicoDetalhe.utils";
import type {
  DiagnosticoGeolocalizacao,
  GeolocalizacaoCapturada,
} from "@/shared/utils/geolocalizacao";

type Props = {
  variant: "page" | "modal";
  isDark?: boolean;
  processandoAcao: boolean;
  arquivoSelecionado: File[];
  setArquivoSelecionado: (files: File[]) => void;
  tipoAnexo: string;
  selecionarTipoAnexo: (tipo: string) => void;
  incluirGeolocalizacao: boolean;
  alternarIncluirGeolocalizacao: (ativo: boolean) => void;
  processandoGeolocalizacao: boolean;
  processandoEnderecoCapturado: boolean;
  geolocalizacaoCapturada: GeolocalizacaoCapturada | null;
  feedbackGeolocalizacao: {
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null;
  diagnosticoGeolocalizacao: DiagnosticoGeolocalizacao;
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
  processandoEnderecoCapturado,
  geolocalizacaoCapturada,
  feedbackGeolocalizacao,
  diagnosticoGeolocalizacao,
  atualizarEnderecoCapturado,
  onCapturarGeolocalizacao,
  onEnviar,
}: Props) {
  void isDark;

  const classes = getClasses(variant);
  const inputKey =
    arquivoSelecionado.length > 0
      ? arquivoSelecionado.map((file) => `${file.name}-${file.size}`).join("|")
      : "sem-arquivo";
  const precisaCapturarAntesDoEnvio =
    tipoAnexo === "foto" &&
    incluirGeolocalizacao &&
    !geolocalizacaoCapturada &&
    diagnosticoGeolocalizacao.disponivel;
  const envioBloqueado =
    processandoAcao || arquivoSelecionado.length === 0 || precisaCapturarAntesDoEnvio;

  return (
    <div className={classes.panel}>
      <p className="text-sm font-semibold text-[var(--text-main)]">Enviar evidência</p>

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
          key={inputKey}
          type="file"
          multiple
          accept={getTiposAceitosAnexo(tipoAnexo)}
          disabled={processandoAcao}
          onChange={(event) =>
            setArquivoSelecionado(Array.from(event.target.files ?? []))
          }
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
              Incluir a geolocalização do aparelho junto com a foto. Se quiser,
              informe um endereço ou ponto de referência manualmente.
            </span>
          </label>

          {incluirGeolocalizacao && (
            <div className="mt-4 space-y-3">
              {!diagnosticoGeolocalizacao.disponivel &&
              diagnosticoGeolocalizacao.mensagem ? (
                <div className="app-alert-warning rounded-2xl px-4 py-3 text-sm">
                  <p className="font-semibold">Localização indisponível neste acesso</p>
                  <p className="mt-1">{diagnosticoGeolocalizacao.mensagem}</p>
                  {diagnosticoGeolocalizacao.requerHttps ? (
                    <p className="mt-2">
                      Para testar no celular, use um endereço com HTTPS, como o
                      domínio publicado do projeto ou um túnel seguro.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={onCapturarGeolocalizacao}
                disabled={
                  processandoAcao ||
                  processandoGeolocalizacao ||
                  !diagnosticoGeolocalizacao.disponivel
                }
                className={classes.secondaryButton}
              >
                <MapPin className="h-4 w-4" />
                {processandoGeolocalizacao
                  ? "Capturando localização..."
                  : geolocalizacaoCapturada
                    ? "Atualizar localização"
                    : "Capturar localização"}
              </button>

              {feedbackGeolocalizacao ? (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    feedbackGeolocalizacao.tipo === "sucesso"
                      ? "app-alert-success"
                      : "app-alert-danger"
                  }`}
                >
                  {feedbackGeolocalizacao.mensagem}
                </div>
              ) : null}

              {processandoEnderecoCapturado && geolocalizacaoCapturada ? (
                <div className="app-alert-info rounded-xl px-4 py-3 text-sm">
                  Coordenadas prontas. Identificando rua, bairro, cidade e estado...
                </div>
              ) : null}

              {geolocalizacaoCapturada ? (
                <div className={classes.geoBox}>
                  {variant === "page" ? (
                    <p className="font-semibold">Localização pronta para envio</p>
                  ) : null}
                  <p className={variant === "page" ? "mt-2" : undefined}>
                    Latitude: {formatarCoordenada(geolocalizacaoCapturada.latitude)}
                  </p>
                  <p>
                    Longitude: {formatarCoordenada(geolocalizacaoCapturada.longitude)}
                  </p>
                  <p>
                    Precisão:{" "}
                    {typeof geolocalizacaoCapturada.precisaoMetros === "number"
                      ? `${Math.round(geolocalizacaoCapturada.precisaoMetros)} m`
                      : "-"}
                  </p>
                  {variant === "page" ? (
                    <p>
                      Capturada em{" "}
                      {formatarDataHora(geolocalizacaoCapturada.capturadaEm)}
                    </p>
                  ) : null}

                  <div className={variant === "page" ? "mt-3" : undefined}>
                    <p className="mb-2 text-sm font-medium text-[var(--success)]">
                      Endereço capturado pela geolocalização
                    </p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="font-medium">Rua:</span>{" "}
                        {geolocalizacaoCapturada.rua || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Bairro:</span>{" "}
                        {geolocalizacaoCapturada.bairro || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Cidade:</span>{" "}
                        {geolocalizacaoCapturada.cidade || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Estado:</span>{" "}
                        {geolocalizacaoCapturada.estado || "-"}
                      </p>
                    </div>
                    <label className="mb-2 mt-3 block text-sm font-medium text-[var(--success)]">
                      Endereço completo ou ajuste manual
                    </label>
                    <textarea
                      rows={3}
                      value={geolocalizacaoCapturada.endereco || ""}
                      onChange={(event) => atualizarEnderecoCapturado(event.target.value)}
                      placeholder="Endereço completo ou ponto de referência da evidência."
                      className={classes.textarea}
                    />
                  </div>
                </div>
              ) : null}

              {precisaCapturarAntesDoEnvio ? (
                <div className="app-alert-info rounded-xl px-4 py-3 text-sm">
                  Capture a localização primeiro para liberar o envio da foto com
                  geolocalização.
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {arquivoSelecionado.length > 0 ? (
        <div className={classes.fileInfo}>
          <p>
            {arquivoSelecionado.length === 1
              ? `Arquivo selecionado: ${arquivoSelecionado[0]?.name || ""}`
              : `${arquivoSelecionado.length} arquivos selecionados:`}
          </p>
          {arquivoSelecionado.length > 1 ? (
            <ul className="mt-1 list-disc pl-5">
              {arquivoSelecionado.slice(0, 5).map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
              {arquivoSelecionado.length > 5 ? (
                <li>...e mais {arquivoSelecionado.length - 5} arquivo(s)</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className={variant === "page" ? "sticky bottom-3 z-10 pt-2" : undefined}>
        <button
          type="button"
          onClick={onEnviar}
          disabled={envioBloqueado}
          className={classes.submitButton}
        >
          <Upload className="h-4 w-4" />
          {processandoAcao
            ? "Enviando..."
            : precisaCapturarAntesDoEnvio
              ? "Capture a localização para enviar"
              : "Enviar evidência"}
        </button>
      </div>
    </div>
  );
}
