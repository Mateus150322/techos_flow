import { useMemo, type ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  User as UserIcon,
  Wrench,
  X,
} from "lucide-react";

import {
  formatarDataHora,
  formatarStatus,
} from "../ordemServicoDetalhe.utils";
import { AnexoItemCard } from "./AnexoItemCard";
import { EvidenciaUploadPanel } from "./EvidenciaUploadPanel";
import { OrdemServicoAcoesPanel } from "./OrdemServicoAcoesPanel";
import { useOrdemServicoDetalhe } from "../useOrdemServicoDetalhe";

type Props = {
  ordemId: string | null;
  open: boolean;
  onClose: () => void;
  onAtualizou?: () => void;
};

function badgeClass(status?: string) {
  switch (status) {
    case "aberta":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "em_execucao":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "finalizada":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "nao_executada":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function extrairCampo(descricao: string | undefined, label: string) {
  if (!descricao) {
    return "";
  }

  const match = descricao.match(new RegExp(`${label}:\\s*(.*)`));
  return match?.[1]?.trim() ?? "";
}

export default function TecnicoOSDetailsModal({
  ordemId,
  open,
  onClose,
  onAtualizou,
}: Props) {
  const {
    loading,
    error: erro,
    setError,
    os,
    criadaPor,
    tecnicoResponsavel,
    ultimaExecucaoAberta: execucaoAberta,
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

  const resumo = useMemo(
    () => ({
      unidade: extrairCampo(os?.descricao, "Unidade"),
      local: extrairCampo(os?.descricao, "Local"),
      servico: extrairCampo(os?.descricao, "Servico"),
      equipamento: extrairCampo(os?.descricao, "Equipamento"),
    }),
    [os?.descricao]
  );

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>

        {loading && <p className="p-6 text-sm text-slate-500">Carregando...</p>}
        {!loading && erro && <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

        {!loading && os && (
          <div>
            <section className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-200">Ordem de Serviço</span>
                    <span className={`rounded-full border px-3 py-1 text-sm font-medium capitalize ${badgeClass(os.status)}`}>{formatarStatus(os.status)}</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold">{os.numero}</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {os.tipo}
                    {os.nome_cliente ? ` - ${os.nome_cliente}` : ""}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TopoCard label="Aberta em" value={formatarDataHora(os.data_abertura)} icon={<ClipboardList className="h-4 w-4" />} />
                  <TopoCard label="Responsável" value={tecnicoResponsavel?.name || "Não atribuído"} icon={<UserIcon className="h-4 w-4" />} />
                  <TopoCard label="Execução" value={execucaoAberta ? "Em andamento" : "Sem execução aberta"} icon={<Wrench className="h-4 w-4" />} />
                </div>
              </div>
            </section>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr,1fr]">
              <section className="space-y-6">
                <CardSection titulo="Resumo da OS" icone={<FileText className="h-5 w-5" />}>
                  <Info label="Unidade" value={resumo.unidade} />
                  <Info label="Local" value={resumo.local} />
                  <Info label="Serviço" value={resumo.servico} />
                  <Info label="Equipamento" value={resumo.equipamento} />
                  <Info label="Aberto por" value={criadaPor?.name} />
                  <Info label="Responsável atual" value={tecnicoResponsavel?.name} />
                  <Info label="Descrição" value={os.descricao} full />
                </CardSection>

                <CardSection titulo="Resolução e ações" icone={<CheckCircle2 className="h-5 w-5" />}>
                  <OrdemServicoAcoesPanel
                    variant="modal"
                    status={os.status}
                    processandoAcao={processandoAcao}
                    podeAceitar={podeAceitar}
                    podeIniciarExecucao={podeIniciarExecucao}
                    podeFinalizarExecucao={podeFinalizarExecucao}
                    podeMarcarNaoExecutada={podeMarcarNaoExecutada}
                    osSemResponsavel={osSemResponsavel}
                    osEhMinha={osEhMinha}
                    osEhDeOutroTecnico={osEhDeOutroTecnico}
                    tecnicoResponsavelNome={tecnicoResponsavel?.name}
                    execucaoAbertaId={execucaoAberta?.id}
                    onError={setError}
                    onAceitar={() => executarAcao(() => aceitar())}
                    onIniciarExecucao={() => executarAcao(() => iniciar({}))}
                    onFinalizarExecucao={({ execucaoId }: { execucaoId: string; observacao?: string }) =>
                      executarAcao(() =>
                        finalizar({
                          execucao_id: execucaoId,
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
              </section>

              <section className="space-y-6">
                <CardSection titulo="Endereço e evidências" icone={<MapPin className="h-5 w-5" />}>
                  <Info label="Endereço" value={os.endereco ? `${os.endereco.rua}, ${os.endereco.numero} - ${os.endereco.bairro}, ${os.endereco.cidade}/${os.endereco.estado}` : "-"} full />

                  {podeEnviarAnexo && (
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
                  )}

                  {os.anexos?.length ? (
                    <div className="space-y-3">
                      {os.anexos.map((anexo) => (
                        <AnexoItemCard key={anexo.id} anexo={anexo} variant="modal" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Sem anexos enviados até o momento.</p>
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

function TopoCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">{icon}<span>{label}</span></div>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function CardSection({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icone}</div>
        <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Info({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{value || "-"}</p>
    </div>
  );
}
