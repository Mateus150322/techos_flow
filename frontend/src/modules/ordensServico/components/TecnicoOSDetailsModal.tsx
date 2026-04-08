import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  Upload,
  User as UserIcon,
  Wrench,
  X,
} from "lucide-react";

import {
  formatarCoordenada,
  formatarDataHora,
  formatarStatus,
  getTiposAceitosAnexo,
} from "../ordemServicoDetalhe.utils";
import { useOrdemServicoDetalhe } from "../useOrdemServicoDetalhe";
import { getGoogleMapsUrl } from "@/shared/utils/geolocalizacao";

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
  const [novoStatus, setNovoStatus] = useState("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");
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

  const podeAtualizarStatus =
    !!os && osEhMinha && (podeFinalizarExecucao || podeMarcarNaoExecutada);

  const resumo = useMemo(
    () => ({
      unidade: extrairCampo(os?.descricao, "Unidade"),
      local: extrairCampo(os?.descricao, "Local"),
      servico: extrairCampo(os?.descricao, "Servico") || extrairCampo(os?.descricao, "Serviço"),
      equipamento:
        extrairCampo(os?.descricao, "Equipamento") || extrairCampo(os?.descricao, "Equipamento"),
    }),
    [os?.descricao]
  );

  async function executarAcao(fn: () => Promise<boolean>) {
    const ok = await fn();

    if (ok) {
      onAtualizou?.();
    }
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
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-200">Ordem de Servico</span>
                    <span className={`rounded-full border px-3 py-1 text-sm font-medium capitalize ${badgeClass(os.status)}`}>{formatarStatus(os.status)}</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold">{os.numero}</h2>
                  <p className="mt-2 text-sm text-slate-300">{os.tipo}{os.nome_cliente ? ` • ${os.nome_cliente}` : ""}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TopoCard label="Aberta em" value={formatarDataHora(os.data_abertura)} icon={<ClipboardList className="h-4 w-4" />} />
                  <TopoCard label="Responsavel" value={tecnicoResponsavel?.name || "Nao atribuido"} icon={<UserIcon className="h-4 w-4" />} />
                  <TopoCard label="Execucao" value={execucaoAberta ? "Em andamento" : "Sem execucao aberta"} icon={<Wrench className="h-4 w-4" />} />
                </div>
              </div>
            </section>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr,1fr]">
              <section className="space-y-6">
                <CardSection titulo="Resumo da OS" icone={<FileText className="h-5 w-5" />}>
                  <Info label="Unidade" value={resumo.unidade} />
                  <Info label="Local" value={resumo.local} />
                  <Info label="Servico" value={resumo.servico} />
                  <Info label="Equipamento" value={resumo.equipamento} />
                  <Info label="Aberto por" value={criadaPor?.name} />
                  <Info label="Responsavel atual" value={tecnicoResponsavel?.name} />
                  <Info label="Descricao" value={os.descricao} full />
                </CardSection>

                <CardSection titulo="Resolucao e acoes" icone={<CheckCircle2 className="h-5 w-5" />}>
                  <div className={`rounded-2xl border px-4 py-4 ${badgeClass(os.status)}`}>
                    <p className="text-sm font-semibold">
                      {os.status === "aberta" && "Pendente de execucao"}
                      {os.status === "em_execucao" && "Em execucao"}
                      {os.status === "finalizada" && "Resolvido"}
                      {os.status === "nao_executada" && "Nao resolvido"}
                      {os.status === "cancelada" && "Cancelada"}
                    </p>
                  </div>

                  {osEhDeOutroTecnico && <Aviso tone="amber" mensagem={`Esta OS ja pertence a ${tecnicoResponsavel?.name || "outro tecnico"}.`} />}
                  {osSemResponsavel && <Aviso tone="blue" mensagem="Esta OS ainda nao possui responsavel tecnico. Voce pode aceita-la." />}
                  {osEhMinha && <Aviso tone="emerald" mensagem="Esta OS esta sob sua responsabilidade." />}

                  {podeAceitar && <button type="button" onClick={() => void executarAcao(() => aceitar())} disabled={processandoAcao} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"><ClipboardList className="h-4 w-4" />{processandoAcao ? "Processando..." : "Aceitar Ordem de Servico"}</button>}
                  {podeIniciarExecucao && <button type="button" onClick={() => void executarAcao(() => iniciar({}))} disabled={processandoAcao} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Wrench className="h-4 w-4" />{processandoAcao ? "Processando..." : "Iniciar Execucao"}</button>}

                  {podeAtualizarStatus && (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <select value={novoStatus} onChange={(event) => setNovoStatus(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900">
                        <option value="">Selecione uma acao</option>
                        {os.status === "em_execucao" && <option value="finalizada">Finalizar OS</option>}
                        {(os.status === "aberta" || os.status === "em_execucao") && <option value="nao_executada">Marcar como nao executada</option>}
                      </select>
                      {novoStatus === "nao_executada" && <textarea rows={4} value={motivoNaoExecucao} onChange={(event) => setMotivoNaoExecucao(event.target.value)} placeholder="Informe o motivo da nao execucao" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />}
                      <button type="button" onClick={() => void executarAcao(async () => { if (novoStatus === "nao_executada") { if (!motivoNaoExecucao.trim()) { setError("Informe o motivo da nao execucao."); return false; } const marcou = await marcarComoNaoExecutada({ motivo_nao_execucao: motivoNaoExecucao.trim() }); if (!marcou) { return false; } } if (novoStatus === "finalizada") { if (!execucaoAberta?.id) { setError("Nenhuma execucao em andamento para finalizar."); return false; } const finalizou = await finalizar({ execucao_id: execucaoAberta.id }); if (!finalizou) { return false; } } setNovoStatus(""); setMotivoNaoExecucao(""); return true; })} disabled={!novoStatus || processandoAcao} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{processandoAcao ? "Salvando..." : "Confirmar atualizacao"}</button>
                    </div>
                  )}
                </CardSection>
              </section>

              <section className="space-y-6">
                <CardSection titulo="Endereco e evidencias" icone={<MapPin className="h-5 w-5" />}>
                  <Info label="Endereco" value={os.endereco ? `${os.endereco.rua}, ${os.endereco.numero} - ${os.endereco.bairro}, ${os.endereco.cidade}/${os.endereco.estado}` : "-"} full />

                  {podeEnviarAnexo && (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Enviar evidencia</p>
                      <select value={tipoAnexo} onChange={(event) => selecionarTipoAnexo(event.target.value)} disabled={processandoAcao} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"><option value="foto">Foto</option><option value="pdf">PDF</option><option value="arquivo">Arquivo</option></select>
                      <input type="file" accept={getTiposAceitosAnexo(tipoAnexo)} disabled={processandoAcao} onChange={(event) => setArquivoSelecionado(event.target.files?.[0] ?? null)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />

                      {tipoAnexo === "foto" && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <label className="flex items-start gap-3">
                            <input type="checkbox" checked={incluirGeolocalizacao} disabled={processandoAcao || processandoGeolocalizacao} onChange={(event) => alternarIncluirGeolocalizacao(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                            <span className="text-sm text-slate-700">Incluir geolocalizacao e endereco aproximado junto com a foto.</span>
                          </label>
                          {incluirGeolocalizacao && (
                            <div className="mt-4 space-y-3">
                              <button type="button" onClick={handleCapturarGeolocalizacao} disabled={processandoAcao || processandoGeolocalizacao} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"><MapPin className="h-4 w-4" />{processandoGeolocalizacao ? "Capturando localizacao..." : geolocalizacaoCapturada ? "Atualizar localizacao" : "Capturar localizacao"}</button>
                              {geolocalizacaoCapturada ? (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                  <p>Latitude: {formatarCoordenada(geolocalizacaoCapturada.latitude)}</p>
                                  <p>Longitude: {formatarCoordenada(geolocalizacaoCapturada.longitude)}</p>
                                  <p>Precisao: {typeof geolocalizacaoCapturada.precisaoMetros === "number" ? `${Math.round(geolocalizacaoCapturada.precisaoMetros)} m` : "-"}</p>
                                  <textarea rows={3} value={geolocalizacaoCapturada.endereco ?? ""} onChange={(event) => atualizarEnderecoCapturado(event.target.value)} placeholder="Endereco aproximado capturado automaticamente. Ajuste se necessario." className="mt-3 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900" />
                                </div>
                              ) : <p className="text-sm text-slate-500">A localizacao atual e o endereco aproximado serao vinculados a foto no envio da evidencia.</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {arquivoSelecionado && <p className="text-sm text-slate-500">Arquivo selecionado: {arquivoSelecionado.name}</p>}
                      <button type="button" onClick={() => void handleEnviarAnexo()} disabled={processandoAcao || !arquivoSelecionado} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Upload className="h-4 w-4" />{processandoAcao ? "Enviando..." : "Enviar evidencia"}</button>
                    </div>
                  )}

                  {os.anexos?.map((anexo) => (
                    <div key={anexo.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <p className="font-medium">{anexo.tipo || "Arquivo"}</p>
                      {anexo.url ? <a href={anexo.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-blue-600 hover:underline">{anexo.caminho ? anexo.caminho.split("/").pop() : anexo.id}</a> : <p className="mt-1 break-all text-slate-500">{anexo.caminho || "-"}</p>}
                      {typeof anexo.latitude === "number" && typeof anexo.longitude === "number" && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-600">
                          <p>Lat {formatarCoordenada(anexo.latitude)} | Lon {formatarCoordenada(anexo.longitude)}</p>
                          <p>Precisao: {typeof anexo.precisao_metros === "number" ? `${Math.round(anexo.precisao_metros)} m` : "-"}</p>
                          {anexo.endereco_capturado && <p className="whitespace-pre-wrap">Endereco: {anexo.endereco_capturado}</p>}
                          <a href={getGoogleMapsUrl(anexo.latitude, anexo.longitude)} target="_blank" rel="noreferrer" className="inline-block text-blue-600 hover:underline">Abrir no mapa</a>
                        </div>
                      )}
                    </div>
                  ))}
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

function Aviso({ mensagem, tone }: { mensagem: string; tone: "blue" | "amber" | "emerald" }) {
  const classes = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${classes[tone]}`}>{mensagem}</div>;
}
