import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileText,
  MapPin,
  Paperclip,
  UserCircle2,
  Wrench,
} from "lucide-react";

import {
  formatarDataHora,
  formatarStatus,
  obterResumoUnidadeOperacional,
  obterUltimaGeolocalizacaoEvidencia,
  formatarCoordenada,
} from "./ordemServicoDetalhe.utils";
import { exportarRelatorioDetalhadoOrdem } from "./ordensServico.service";
import { AnexoItemCard } from "./components/AnexoItemCard";
import { EvidenciaUploadPanel } from "./components/EvidenciaUploadPanel";
import { OrdemServicoAcoesPanel } from "./components/OrdemServicoAcoesPanel";
import { PrioridadeBadge } from "./components/PrioridadeBadge";
import { formatPrioridade } from "./prioridade.utils";
import { StatusBadge } from "./components/StatusBadge";
import { useOrdemServicoDetalhe } from "./useOrdemServicoDetalhe";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";

export default function OrdemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);

  const {
    currentUser,
    loading,
    error,
    setError,
    os,
    criadaPor,
    tecnicoResponsavel,
    execucaoParaFinalizacao,
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
    processandoEnderecoCapturado,
    geolocalizacaoCapturada,
    feedbackGeolocalizacao,
    diagnosticoGeolocalizacao,
    atualizarEnderecoCapturado,
    iniciar,
    finalizar,
    marcarComoNaoExecutada,
    capturarGeolocalizacao,
    enviarEvidencia,
  } = useOrdemServicoDetalhe({ ordemId: id });

  async function handleCapturarGeolocalizacao() {
    await capturarGeolocalizacao();
  }

  async function handleEnviarAnexo() {
    await enviarEvidencia();
  }

  async function handleBaixarRelatorio() {
    if (!os?.id) {
      return;
    }

    try {
      setBaixandoRelatorio(true);
      setError("");

      const { blob, fileName } = await exportarRelatorioDetalhadoOrdem(os.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        getApiErrorMessage(downloadError, "Não foi possível gerar o relatório PDF da OS.")
      );
    } finally {
      setBaixandoRelatorio(false);
    }
  }

  const pageBg = "app-page";
  const cardBg = "app-card";
  const innerCardBg = "app-card-soft";
  const titleText = "text-[var(--text-main)]";
  const mutedText = "app-muted";
  const bodyText = "text-[var(--text-main)]";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition";
  const podeBaixarRelatorio = currentUser.role === "administrador";
  const temAcoesOperacionais =
    podeIniciarExecucao || podeFinalizarExecucao || podeMarcarNaoExecutada;
  const resumoUnidade = useMemo(() => obterResumoUnidadeOperacional(os), [os]);
  const ultimaGeolocalizacao = useMemo(
    () => obterUltimaGeolocalizacaoEvidencia(os?.anexos),
    [os?.anexos]
  );

  if (loading) {
    return (
      <div className={pageBg}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`${cardBg} rounded-2xl p-6`}>
            <p className={`text-sm ${mutedText}`}>Carregando detalhes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !os) {
    return (
      <div className={pageBg}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`${cardBg} rounded-2xl p-6`}>
            <p className="app-alert-danger rounded-xl px-4 py-3 text-sm">{error}</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`mt-4 ${buttonSecondary}`}
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
      <div className={pageBg}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className={`${cardBg} rounded-2xl p-6`}>
            <p className={`text-sm ${mutedText}`}>Ordem de serviço não encontrada.</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`mt-4 ${buttonSecondary}`}
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
    <div className={pageBg}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className={`${cardBg} rounded-[1.75rem] p-4 sm:rounded-3xl sm:p-6`}>
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={os.status} />
                <PrioridadeBadge prioridade={os.prioridade} />
              </div>

              <h1 className={`mt-3 text-2xl font-bold sm:text-3xl ${titleText}`}>{os.numero}</h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {os.tipo}
                {os.nome_cliente ? ` - ${os.nome_cliente}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {podeBaixarRelatorio ? (
                <button
                  type="button"
                  onClick={handleBaixarRelatorio}
                  disabled={baixandoRelatorio}
                  className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${buttonSecondary}`}
                >
                  <FileDown className="h-4 w-4" />
                  {baixandoRelatorio ? "Gerando PDF..." : "Relatório PDF"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`min-h-11 w-full justify-center sm:w-auto ${buttonSecondary}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
          </div>

          {error && (
            <div className="app-alert-danger mb-4 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {osEhDeOutroTecnico && (
            <div className="app-alert-warning mb-4 rounded-xl px-4 py-3 text-sm">
              Esta OS está atribuída a {tecnicoResponsavel?.name || "outro técnico"}.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResumoTopCard
              label="Data de abertura"
              value={formatarDataHora(os.data_abertura)}
              cardBg={innerCardBg}
              mutedText={mutedText}
              titleText={titleText}
            />
            <ResumoTopCard
              label="Responsável"
              value={tecnicoResponsavel?.name || "Não atribuído"}
              cardBg={innerCardBg}
              mutedText={mutedText}
              titleText={titleText}
            />
            <ResumoTopCard
              label="Criada por"
              value={criadaPor?.name || "-"}
              cardBg={innerCardBg}
              mutedText={mutedText}
              titleText={titleText}
            />
            <ResumoTopCard
              label="Encerramento"
              value={formatarDataHora(os.data_encerramento)}
              cardBg={innerCardBg}
              mutedText={mutedText}
              titleText={titleText}
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <Section title="Resumo da OS" icon={<FileText className="h-4 w-4" />} cardBg={cardBg}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Tipo de serviço" value={os.tipo} bodyText={bodyText} mutedText={mutedText} />
                  <DetailItem label="Cliente" value={os.nome_cliente} bodyText={bodyText} mutedText={mutedText} />
                  <DetailItem label="Status atual" value={formatarStatus(os.status)} bodyText={bodyText} mutedText={mutedText} />
                  <DetailItem
                    label="Prioridade"
                    value={formatPrioridade(os.prioridade)}
                    bodyText={bodyText}
                    mutedText={mutedText}
                  />
                  <DetailItem label="Responsável atual" value={tecnicoResponsavel?.name || "Não atribuído"} bodyText={bodyText} mutedText={mutedText} />
                  <DetailItem label="Aberto por" value={criadaPor?.name} bodyText={bodyText} mutedText={mutedText} />
                  <DetailItem
                    label="Descrição"
                    value={os.descricao}
                    bodyText={bodyText}
                    mutedText={mutedText}
                    full
                  />
                </div>
              </Section>

              {temAcoesOperacionais && (
                <Section
                  title="Ações da OS"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  cardBg={cardBg}
                >
                  <OrdemServicoAcoesPanel
                    variant="page"
                    isDark={isDark}
                    processandoAcao={processandoAcao}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    podeIniciarExecucao={podeIniciarExecucao}
                    podeFinalizarExecucao={podeFinalizarExecucao}
                    podeMarcarNaoExecutada={podeMarcarNaoExecutada}
                    execucaoAbertaId={execucaoParaFinalizacao?.id}
                    onError={setError}
                    onIniciarExecucao={(observacao) =>
                      iniciar({
                        observacao,
                      })
                    }
                    onFinalizarExecucao={({ execucaoId, dataFim, observacao, funcionarios }) =>
                      finalizar({
                        execucao_id: execucaoId,
                        data_fim: dataFim,
                        observacao,
                        funcionarios,
                      })
                    }
                    onMarcarNaoExecutada={(motivo) =>
                      marcarComoNaoExecutada({
                        motivo_nao_execucao: motivo,
                      })
                    }
                  />
                </Section>
              )}

              <Section title="Execuções" icon={<Wrench className="h-4 w-4" />} cardBg={cardBg}>
                {os.execucoes?.length ? (
                  <div className="space-y-3">
                    {os.execucoes.map((execucao) => (
                      <div
                        key={execucao.id}
                        className={`${innerCardBg} rounded-xl px-4 py-3`}
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <DetailItem label="Técnico" value={execucao.tecnico?.name} bodyText={bodyText} mutedText={mutedText} />
                          <DetailItem label="Início" value={formatarDataHora(execucao.data_inicio)} bodyText={bodyText} mutedText={mutedText} />
                          <DetailItem label="Fim" value={formatarDataHora(execucao.data_fim)} bodyText={bodyText} mutedText={mutedText} />
                          <DetailItem
                            label="Observação"
                            value={execucao.observacao || "Sem observações registradas."}
                            bodyText={bodyText}
                            mutedText={mutedText}
                            full
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${mutedText}`}>Nenhuma execução registrada.</p>
                )}
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Unidade e geolocalização" icon={<MapPin className="h-4 w-4" />} cardBg={cardBg}>
                <div className={`${innerCardBg} rounded-xl px-4 py-4`}>
                  <p className={`text-xs font-medium uppercase tracking-[0.16em] ${mutedText}`}>
                    Dados da unidade operacional
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {resumoUnidade.map((item) => (
                      <DetailItem
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                    ))}
                  </div>
                </div>

                <div className={`${innerCardBg} rounded-xl px-4 py-4`}>
                  <p className={`text-xs font-medium uppercase tracking-[0.16em] ${mutedText}`}>
                    Geolocalização da evidência
                  </p>
                  {ultimaGeolocalizacao ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <DetailItem
                        label="Latitude"
                        value={formatarCoordenada(ultimaGeolocalizacao.latitude)}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Longitude"
                        value={formatarCoordenada(ultimaGeolocalizacao.longitude)}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Rua"
                        value={ultimaGeolocalizacao.rua_capturada}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Bairro"
                        value={ultimaGeolocalizacao.bairro_capturado}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Cidade"
                        value={ultimaGeolocalizacao.cidade_capturada}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Estado"
                        value={ultimaGeolocalizacao.estado_capturado}
                        bodyText={bodyText}
                        mutedText={mutedText}
                      />
                      <DetailItem
                        label="Endereço capturado"
                        value={ultimaGeolocalizacao.endereco_capturado}
                        bodyText={bodyText}
                        mutedText={mutedText}
                        full
                      />
                    </div>
                  ) : (
                    <p className={`mt-3 text-sm ${mutedText}`}>
                      A localização aparecerá aqui quando o técnico enviar uma evidência com geolocalização.
                    </p>
                  )}
                </div>
              </Section>

              {podeEnviarAnexo && (
                <Section title="Nova evidência" icon={<Paperclip className="h-4 w-4" />} cardBg={cardBg}>
                  <EvidenciaUploadPanel
                    variant="page"
                    isDark={isDark}
                    processandoAcao={processandoAcao}
                    arquivoSelecionado={arquivoSelecionado}
                    setArquivoSelecionado={setArquivoSelecionado}
                    tipoAnexo={tipoAnexo}
                    selecionarTipoAnexo={selecionarTipoAnexo}
                    incluirGeolocalizacao={incluirGeolocalizacao}
                    alternarIncluirGeolocalizacao={alternarIncluirGeolocalizacao}
                    processandoGeolocalizacao={processandoGeolocalizacao}
                    processandoEnderecoCapturado={processandoEnderecoCapturado}
                    geolocalizacaoCapturada={geolocalizacaoCapturada}
                    feedbackGeolocalizacao={feedbackGeolocalizacao}
                    diagnosticoGeolocalizacao={diagnosticoGeolocalizacao}
                    atualizarEnderecoCapturado={atualizarEnderecoCapturado}
                    onCapturarGeolocalizacao={handleCapturarGeolocalizacao}
                    onEnviar={handleEnviarAnexo}
                  />
                </Section>
              )}

              <Section
                title="Criada por"
                icon={<UserCircle2 className="h-4 w-4" />}
                cardBg={cardBg}
              >
                <p className={`text-sm ${bodyText}`}>{criadaPor?.name || "-"}</p>
                <p className={`mt-1 text-xs ${mutedText}`}>{criadaPor?.email || "-"}</p>
              </Section>

              <Section title="Anexos" icon={<Paperclip className="h-4 w-4" />} cardBg={cardBg}>
                {os.anexos?.length ? (
                  <ul className="space-y-2">
                    {os.anexos.map((anexo) => (
                      <AnexoItemCard
                        key={anexo.id}
                        anexo={anexo}
                        variant="page"
                        isDark={isDark}
                        wrapper="li"
                      />
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
    <div className={`${cardBg} rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-medium text-[var(--text-main)] sm:text-lg">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ResumoTopCard({
  label,
  value,
  cardBg,
  mutedText,
  titleText,
}: {
  label: string;
  value: string;
  cardBg: string;
  mutedText: string;
  titleText: string;
}) {
  return (
    <div className={`${cardBg} rounded-2xl p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>{label}</p>
      <p className={`mt-2 text-base font-semibold sm:text-lg ${titleText}`}>{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  bodyText,
  mutedText,
  full,
}: {
  label: string;
  value?: string | null;
  bodyText: string;
  mutedText: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className={`text-xs font-medium uppercase tracking-[0.16em] ${mutedText}`}>{label}</p>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm ${bodyText}`}>{value || "-"}</p>
    </div>
  );
}





