import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Moon,
  Paperclip,
  PlayCircle,
  Sun,
  Upload,
  UserCircle2,
  Wrench,
} from "lucide-react";

import {
  formatarCoordenada,
  formatarDataHora,
  formatarStatus,
  getTiposAceitosAnexo,
} from "./ordemServicoDetalhe.utils";
import { useOrdemServicoDetalhe } from "./useOrdemServicoDetalhe";
import { PrioridadeBadge } from "./components/PrioridadeBadge";
import { StatusBadge } from "./components/StatusBadge";
import { useTheme } from "@/shared/hooks/useTheme";
import { getGoogleMapsUrl } from "@/shared/utils/geolocalizacao";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [observacaoInicio, setObservacaoInicio] = useState("");
  const [observacaoFim, setObservacaoFim] = useState("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");
  const {
    loading,
    error,
    setError,
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta,
    osEhDeOutroTecnico,
    podeIniciarExecucao,
    podeFinalizarExecucao,
    podeMarcarNaoExecutada,
    podeEnviarAnexo,
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
    iniciar,
    finalizar,
    marcarComoNaoExecutada,
    capturarGeolocalizacao,
    enviarEvidencia,
  } = useOrdemServicoDetalhe({ ordemId: id });

  async function handleIniciarExecucao() {
    const iniciou = await iniciar({
        observacao: observacaoInicio.trim() || undefined,
      });

    if (iniciou) {
      setObservacaoInicio("");
    }
  }

  async function handleFinalizarExecucao() {
    if (!os?.id || !ultimaExecucaoAberta?.id) {
      return;
    }

    const finalizou = await finalizar({
        execucao_id: ultimaExecucaoAberta.id,
        observacao: observacaoFim.trim() || undefined,
      });

    if (finalizou) {
      setObservacaoFim("");
    }
  }

  async function handleMarcarNaoExecutada() {
    if (!os?.id) {
      return;
    }

    if (!motivoNaoExecucao.trim()) {
      setError("Informe o motivo da nao execucao.");
      return;
    }

    const marcou = await marcarComoNaoExecutada({
        motivo_nao_execucao: motivoNaoExecucao.trim(),
      });

    if (marcou) {
      setMotivoNaoExecucao("");
    }
  }

  async function handleCapturarGeolocalizacao() {
    await capturarGeolocalizacao();
  }

  async function handleEnviarAnexo() {
    await enviarEvidencia();
  }

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const innerCardBg = isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const bodyText = isDark ? "text-slate-200" : "text-slate-700";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <p className={`text-sm ${mutedText}`}>Carregando detalhes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <p className="text-sm text-red-500">{error}</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <p className={`text-sm ${mutedText}`}>Ordem de servico nao encontrada.</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={os.status} />
                <PrioridadeBadge prioridade={os.prioridade} />
              </div>

              <h1 className={`mt-3 text-3xl font-bold ${titleText}`}>{os.numero}</h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {os.tipo}
                {os.nome_cliente ? ` • ${os.nome_cliente}` : ""}
              </p>
              <p className={`mt-2 text-sm capitalize ${bodyText}`}>
                Status atual: {formatarStatus(os.status)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Modo claro" : "Modo escuro"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
          </div>

          {error && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-red-900 bg-red-950 text-red-300"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          {osEhDeOutroTecnico && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-amber-900 bg-amber-950 text-amber-200"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              Esta OS esta atribuida a {tecnicoResponsavel?.name || "outro tecnico"}.
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Section title="Descricao" icon={<FileText className="h-4 w-4" />} cardBg={cardBg}>
                <p className={`whitespace-pre-wrap text-sm ${bodyText}`}>{os.descricao}</p>
              </Section>

              {podeIniciarExecucao && (
                <Section
                  title="Iniciar execucao"
                  icon={<PlayCircle className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <div className="space-y-4">
                    <textarea
                      rows={4}
                      value={observacaoInicio}
                      onChange={(event) => setObservacaoInicio(event.target.value)}
                      placeholder="Observacao opcional ao iniciar a execucao"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                    />

                    <button
                      type="button"
                      onClick={handleIniciarExecucao}
                      disabled={processandoAcao}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {processandoAcao ? "Iniciando..." : "Iniciar execucao"}
                    </button>
                  </div>
                </Section>
              )}

              {podeFinalizarExecucao && (
                <Section
                  title="Finalizar execucao"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <div className="space-y-4">
                    <textarea
                      rows={4}
                      value={observacaoFim}
                      onChange={(event) => setObservacaoFim(event.target.value)}
                      placeholder="Observacao opcional ao finalizar a execucao"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                    />

                    <button
                      type="button"
                      onClick={handleFinalizarExecucao}
                      disabled={processandoAcao}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {processandoAcao ? "Finalizando..." : "Finalizar execucao"}
                    </button>
                  </div>
                </Section>
              )}

              {podeMarcarNaoExecutada && (
                <Section
                  title="Marcar como nao executada"
                  icon={<FileText className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <div className="space-y-4">
                    <textarea
                      rows={4}
                      value={motivoNaoExecucao}
                      onChange={(event) => setMotivoNaoExecucao(event.target.value)}
                      placeholder="Informe o motivo pelo qual a OS nao foi executada"
                      disabled={processandoAcao}
                      className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-red-500 disabled:opacity-60 ${inputBg}`}
                    />

                    <button
                      type="button"
                      onClick={handleMarcarNaoExecutada}
                      disabled={processandoAcao}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText className="h-4 w-4" />
                      {processandoAcao ? "Salvando..." : "Marcar como nao executada"}
                    </button>
                  </div>
                </Section>
              )}

              {podeEnviarAnexo && (
                <Section
                  title="Enviar evidencia"
                  icon={<Upload className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={tipoAnexo}
                        onChange={(event) => selecionarTipoAnexo(event.target.value)}
                        disabled={processandoAcao}
                        className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                      >
                        <option value="foto">Foto</option>
                        <option value="pdf">PDF</option>
                        <option value="arquivo">Arquivo</option>
                      </select>

                      <input
                        type="file"
                        accept={getTiposAceitosAnexo(tipoAnexo)}
                        disabled={processandoAcao}
                        onChange={(event) =>
                          setArquivoSelecionado(event.target.files?.[0] ?? null)
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${inputBg}`}
                      />
                    </div>

                    {tipoAnexo === "foto" && (
                      <div className={`rounded-2xl border p-4 ${innerCardBg}`}>
                        <label className={`flex items-start gap-3 text-sm ${bodyText}`}>
                          <input
                            type="checkbox"
                            checked={incluirGeolocalizacao}
                            disabled={processandoAcao || processandoGeolocalizacao}
                            onChange={(event) =>
                              alternarIncluirGeolocalizacao(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span>Incluir geolocalizacao e endereco aproximado junto com a foto.</span>
                        </label>

                        {incluirGeolocalizacao && (
                          <div className="mt-4 space-y-3">
                            <button
                              type="button"
                              onClick={handleCapturarGeolocalizacao}
                              disabled={processandoAcao || processandoGeolocalizacao}
                              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${buttonSecondary}`}
                            >
                              <MapPin className="h-4 w-4" />
                              {processandoGeolocalizacao
                                ? "Capturando localizacao..."
                                : geolocalizacaoCapturada
                                  ? "Atualizar localizacao"
                                  : "Capturar localizacao"}
                            </button>

                            {geolocalizacaoCapturada ? (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                <p className="font-semibold">Localizacao pronta para envio</p>
                                <p className="mt-2">
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
                                <p>
                                  Capturada em {formatarDataHora(geolocalizacaoCapturada.capturadaEm)}
                                </p>

                                <div className="mt-3">
                                  <label className="mb-2 block text-sm font-medium text-emerald-800">
                                    Endereco da evidencia
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={geolocalizacaoCapturada.endereco ?? ""}
                                    onChange={(event) =>
                                      atualizarEnderecoCapturado(event.target.value)
                                    }
                                    placeholder="Endereco aproximado capturado automaticamente. Ajuste se necessario."
                                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className={`text-sm ${mutedText}`}>
                                A localizacao atual e o endereco aproximado serao vinculados a foto no envio da evidencia.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {arquivoSelecionado && (
                      <p className={`text-sm ${mutedText}`}>
                        Arquivo selecionado: {arquivoSelecionado.name}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleEnviarAnexo}
                      disabled={processandoAcao || !arquivoSelecionado}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4" />
                      {processandoAcao ? "Enviando..." : "Enviar evidencia"}
                    </button>
                  </div>
                </Section>
              )}

              <Section title="Execucoes" icon={<Wrench className="h-4 w-4" />} cardBg={cardBg}>
                {os.execucoes?.length ? (
                  <div className="space-y-3">
                    {os.execucoes.map((execucao) => (
                      <div
                        key={execucao.id}
                        className={`rounded-xl border px-4 py-3 ${innerCardBg}`}
                      >
                        <p className={`text-sm ${bodyText}`}>
                          <span className={mutedText}>Tecnico:</span>{" "}
                          {execucao.tecnico?.name ?? "-"}
                        </p>
                        <p className={`mt-1 text-sm ${bodyText}`}>
                          <span className={mutedText}>Inicio:</span>{" "}
                          {formatarDataHora(execucao.data_inicio)}
                        </p>
                        <p className={`mt-1 text-sm ${bodyText}`}>
                          <span className={mutedText}>Fim:</span>{" "}
                          {formatarDataHora(execucao.data_fim)}
                        </p>
                        <p className={`mt-3 text-sm ${bodyText}`}>
                          {execucao.observacao ?? "Sem observacoes registradas."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${mutedText}`}>Nenhuma execucao registrada.</p>
                )}
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Endereco" icon={<MapPin className="h-4 w-4" />} cardBg={cardBg}>
                {os.endereco ? (
                  <div className={`space-y-1 text-sm ${bodyText}`}>
                    <p>
                      {os.endereco.rua}, {os.endereco.numero}
                    </p>
                    {os.endereco.complemento ? <p>{os.endereco.complemento}</p> : null}
                    <p>{os.endereco.bairro}</p>
                    <p>
                      {os.endereco.cidade} - {os.endereco.estado}
                    </p>
                    <p>CEP: {os.endereco.cep}</p>
                  </div>
                ) : (
                  <p className={`text-sm ${mutedText}`}>Endereco nao informado.</p>
                )}
              </Section>

              <Section
                title="Criada por"
                icon={<UserCircle2 className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <p className={`text-sm ${bodyText}`}>{criadaPor?.name ?? "-"}</p>
                <p className={`mt-1 text-xs ${mutedText}`}>{criadaPor?.email ?? ""}</p>
              </Section>

              <Section title="Anexos" icon={<Paperclip className="h-4 w-4" />} cardBg={cardBg}>
                {os.anexos?.length ? (
                  <ul className="space-y-2">
                    {os.anexos.map((anexo) => (
                      <li
                        key={anexo.id}
                        className={`rounded-lg border px-3 py-3 text-sm ${innerCardBg} ${bodyText}`}
                      >
                        {anexo.url ? (
                          <a
                            href={anexo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {anexo.caminho ? anexo.caminho.split("/").pop() : anexo.id}
                          </a>
                        ) : (
                          anexo.caminho?.split("/").pop() ?? anexo.id
                        )}

                        {typeof anexo.latitude === "number" &&
                          typeof anexo.longitude === "number" && (
                            <div
                              className={`mt-3 rounded-xl border px-3 py-3 text-sm ${innerCardBg}`}
                            >
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
                                      Capturada em{" "}
                                      {formatarDataHora(anexo.geolocalizacao_capturada_em)}
                                    </p>
                                  )}
                                  {anexo.endereco_capturado && (
                                    <p className="whitespace-pre-wrap">
                                      Endereco: {anexo.endereco_capturado}
                                    </p>
                                  )}
                                  <a
                                    href={getGoogleMapsUrl(anexo.latitude, anexo.longitude)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block text-blue-600 hover:underline"
                                  >
                                    Abrir no mapa
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-sm ${mutedText}`}>Sem anexos.</p>
                )}
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
  cardBg,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  cardBg: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${cardBg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
