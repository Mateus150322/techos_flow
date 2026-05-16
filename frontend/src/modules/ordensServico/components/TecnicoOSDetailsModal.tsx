import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileDown,
  FileText,
  MapPin,
  User as UserIcon,
  Wrench,
  X,
} from "lucide-react";

import {
  formatarDataHora,
  listarLinhasEnderecoOperacional,
  formatarStatus,
} from "../ordemServicoDetalhe.utils";
import { exportarRelatorioDetalhadoOrdem } from "../ordensServico.service";
import { AnexoItemCard } from "./AnexoItemCard";
import { EvidenciaUploadPanel } from "./EvidenciaUploadPanel";
import { OrdemServicoAcoesPanel } from "./OrdemServicoAcoesPanel";
import { PrioridadeBadge } from "./PrioridadeBadge";
import { StatusBadge } from "./StatusBadge";
import { useOrdemServicoDetalhe } from "../useOrdemServicoDetalhe";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { getApiErrorMessage } from "@/shared/utils/apiError";

type Props = {
  ordemId: string | null;
  open: boolean;
  onClose: () => void;
  onAtualizou?: () => void;
};

export default function TecnicoOSDetailsModal({
  ordemId,
  open,
  onClose,
  onAtualizou,
}: Props) {
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const titleId = "modal-os-titulo";
  const descriptionId = "modal-os-descricao";

  const {
    currentUser,
    loading,
    error: erro,
    setError,
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta: execucaoAberta,
    execucaoParaFinalizacao,
    osSemResponsavel,
    osEhMinha,
    osEhDeOutroTecnico,
    podeAceitar,
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
    aceitar,
    iniciar,
    finalizar,
    marcarComoNaoExecutada,
    capturarGeolocalizacao,
    enviarEvidencia,
  } = useOrdemServicoDetalhe({
    ordemId,
    enabled: open,
    fallbackRole: "tecnico",
  });

  const linhasEndereco = useMemo(
    () => listarLinhasEnderecoOperacional(os?.endereco),
    [os?.endereco]
  );
  const enderecoReferencia = useMemo(() => linhasEndereco.join("\n"), [linhasEndereco]);

  async function executarAcao(fn: () => Promise<boolean>) {
    const ok = await fn();

    if (ok) {
      onAtualizou?.();
    }

    return ok;
  }

  async function handleCapturarGeolocalizacao() {
    await capturarGeolocalizacao();
  }

  async function handleEnviarAnexo() {
    await executarAcao(() => enviarEvidencia());
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

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedElementRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-0 py-0 sm:items-center sm:px-4 sm:py-6"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative h-full max-h-screen w-full overflow-y-auto rounded-t-[28px] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-[28px]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes da ordem de serviço"
          className="absolute right-5 top-5 z-10 rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-2 text-[var(--text-muted)] shadow-sm transition hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)]"
        >
          <X className="h-5 w-5" />
        </button>

        {loading && <p className="app-muted p-6 text-sm" role="status" aria-live="polite">Carregando...</p>}

        {!loading && erro && (
          <div className="app-alert-danger m-6 rounded-xl px-4 py-3 text-sm" role="alert" aria-live="assertive">
            {erro}
          </div>
        )}

        {!loading && os && (
          <div>
            <section className="border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-[var(--text-main)] sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)] dark:text-[var(--primary-light)]">
                      Ordem de Servico
                    </span>
                    <StatusBadge status={os.status} />
                    <PrioridadeBadge prioridade={os.prioridade} />
                  </div>
                  <h2 id={titleId} className="mt-4 text-2xl font-semibold sm:text-3xl">{os.numero}</h2>
                  <p id={descriptionId} className="app-muted mt-2 text-sm">
                    {os.tipo}
                    {os.nome_cliente ? ` - ${os.nome_cliente}` : ""}
                  </p>
                </div>

                <div className="w-full space-y-3 xl:w-auto">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                    <button
                      type="button"
                      onClick={handleBaixarRelatorio}
                      disabled={baixandoRelatorio}
                      className="app-button-outline inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      <FileDown className="h-4 w-4" />
                      {baixandoRelatorio ? "Gerando PDF..." : "Baixar relatório PDF"}
                    </button>
                    <ThemeToggle />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <TopoCard
                      label="Aberta em"
                      value={formatarDataHora(os.data_abertura)}
                      icon={<ClipboardList className="h-4 w-4" />}
                    />
                    <TopoCard
                      label="Responsavel"
                      value={tecnicoResponsavel?.name || "Não atribuído"}
                      icon={<UserIcon className="h-4 w-4" />}
                    />
                    <TopoCard
                      label="Execucao"
                      value={execucaoAberta ? "Em andamento" : "Sem execucao aberta"}
                      icon={<Wrench className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1.3fr,1fr]">
              <section className="space-y-6">
                <CardSection titulo="Resumo da OS" icone={<FileText className="h-5 w-5" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info label="Tipo de serviço" value={os.tipo} />
                    <Info label="Cliente" value={os.nome_cliente} />
                    <Info label="Status atual" value={formatarStatus(os.status)} />
                    <Info label="Data de abertura" value={formatarDataHora(os.data_abertura)} />
                    <Info
                      label="Data de encerramento"
                      value={formatarDataHora(os.data_encerramento)}
                    />
                    <Info
                      label="Responsável atual"
                      value={tecnicoResponsavel?.name || "Não atribuído"}
                    />
                    <Info label="Aberto por" value={criadaPor?.name} />
                    <Info label="Email de abertura" value={criadaPor?.email} />
                  </div>
                  <Info label="Descricao" value={os.descricao} full />
                </CardSection>

                <CardSection titulo="Resolucao e acoes" icone={<CheckCircle2 className="h-5 w-5" />}>
                  <OrdemServicoAcoesPanel
                    variant="modal"
                    status={os.status}
                    processandoAcao={processandoAcao}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    podeAceitar={podeAceitar}
                    podeIniciarExecucao={podeIniciarExecucao}
                    podeFinalizarExecucao={podeFinalizarExecucao}
                    podeMarcarNaoExecutada={podeMarcarNaoExecutada}
                    osSemResponsavel={osSemResponsavel}
                    osEhMinha={osEhMinha}
                    osEhDeOutroTecnico={osEhDeOutroTecnico}
                    tecnicoResponsavelNome={tecnicoResponsavel?.name}
                    execucaoAbertaId={execucaoParaFinalizacao?.id}
                    onError={setError}
                    onAceitar={() => executarAcao(() => aceitar())}
                    onIniciarExecucao={() => executarAcao(() => iniciar({}))}
                    onFinalizarExecucao={({ execucaoId, dataFim, funcionarios }) =>
                      executarAcao(() =>
                        finalizar({
                          execucao_id: execucaoId,
                          data_fim: dataFim,
                          funcionarios,
                        })
                      )
                    }
                    onMarcarNaoExecutada={(motivo: string) =>
                      executarAcao(() =>
                        marcarComoNaoExecutada({
                          motivo_nao_execucao: motivo,
                        })
                      )
                    }
                  />
                </CardSection>

                <CardSection titulo="Execucoes registradas" icone={<Wrench className="h-5 w-5" />}>
                  {os.execucoes?.length ? (
                    <div className="space-y-3">
                      {os.execucoes.map((execucao) => (
                        <div
                          key={execucao.id}
                          className="app-card-soft rounded-2xl px-4 py-4"
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Info label="Tecnico" value={execucao.tecnico?.name} />
                            <Info label="Inicio" value={formatarDataHora(execucao.data_inicio)} />
                            <Info label="Fim" value={formatarDataHora(execucao.data_fim)} />
                            <Info
                              label="Observacao"
                              value={execucao.observacao || "Sem observacoes registradas."}
                              full
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="app-muted text-sm">Nenhuma execucao registrada ate o momento.</p>
                  )}
                </CardSection>
              </section>

              <section className="space-y-6">
                <CardSection titulo="Endereco e evidencias" icone={<MapPin className="h-5 w-5" />}>
                  <div className="app-card-soft rounded-2xl px-4 py-4">
                    <p className="app-muted text-xs font-medium uppercase tracking-[0.16em]">
                      Endereco da OS
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text-main)]">
                      {linhasEndereco.join("\n") || "-"}
                    </p>
                  </div>

                  {podeEnviarAnexo && (
                    <div className="app-card-soft rounded-2xl px-4 py-4">
                      <p className="app-muted mb-3 text-xs font-medium uppercase tracking-[0.16em]">
                        Nova evidencia
                      </p>
                      <EvidenciaUploadPanel
                        variant="modal"
                        processandoAcao={processandoAcao}
                        arquivoSelecionado={arquivoSelecionado}
                        setArquivoSelecionado={setArquivoSelecionado}
                        tipoAnexo={tipoAnexo}
                        selecionarTipoAnexo={selecionarTipoAnexo}
                        incluirGeolocalizacao={incluirGeolocalizacao}
                        alternarIncluirGeolocalizacao={alternarIncluirGeolocalizacao}
                        processandoGeolocalizacao={processandoGeolocalizacao}
                        geolocalizacaoCapturada={geolocalizacaoCapturada}
                        atualizarEnderecoCapturado={atualizarEnderecoCapturado}
                        onCapturarGeolocalizacao={handleCapturarGeolocalizacao}
                        onEnviar={handleEnviarAnexo}
                      />
                    </div>
                  )}

                  {os.anexos?.length ? (
                    <div className="space-y-3">
                      <p className="app-muted text-xs font-medium uppercase tracking-[0.16em]">
                        Evidencias enviadas
                      </p>
                      {os.anexos.map((anexo) => (
                        <AnexoItemCard
                          key={anexo.id}
                          anexo={anexo}
                          variant="modal"
                          enderecoReferencia={enderecoReferencia}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="app-muted text-sm">Sem anexos enviados ate o momento.</p>
                  )}
                </CardSection>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <div className="app-muted flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-[var(--text-main)]">{value}</p>
    </div>
  );
}

function CardSection({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="app-card rounded-[24px] p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="app-card-soft rounded-xl p-2 text-[var(--primary)]">{icone}</div>
        <h3 className="text-base font-semibold text-[var(--text-main)] sm:text-lg">{titulo}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="app-muted text-xs font-medium uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-main)]">{value || "-"}</p>
    </div>
  );
}
