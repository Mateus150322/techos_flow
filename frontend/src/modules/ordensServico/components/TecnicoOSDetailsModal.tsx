import { useEffect, useMemo, useState } from "react";
import {
  X,
  Calendar,
  User as UserIcon,
  ClipboardList,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import {
  aceitarOrdem,
  buscarOrdem,
  finalizarExecucao,
  iniciarExecucao,
  marcarNaoExecutada,
  type OrdemServicoDetalhe,
} from "../ordensServico.service";

type Props = {
  ordemId: string | null;
  open: boolean;
  onClose: () => void;
  onAtualizou?: () => void;
};

type DadosTecnicos = {
  dataChamada?: string;
  horaInicio?: string;
  horaFim?: string;
  dataFinal?: string;
  unidade?: string;
  local?: string;
  setorRequisitante?: string;
  encarregado?: string;
  equipe?: string;
  tipoManutencao?: string;
  servico?: string;
  equipamento?: string;
  diagnostico?: string;
  procedimento?: string;
  materialUtilizado?: string;
  resolucao?: boolean;
  motivoNaoResolucao?: string;
};

type UsuarioLogado = {
  id?: string;
  name?: string;
  email?: string;
  role?: "administrador" | "tecnico" | "atendente";
};

function badgeClass(status?: string) {
  switch (status) {
    case "aberta":
      return "bg-blue-100 text-blue-700";
    case "em_execucao":
      return "bg-yellow-100 text-yellow-700";
    case "finalizada":
      return "bg-green-100 text-green-700";
    case "nao_executada":
      return "bg-red-100 text-red-700";
    case "cancelada":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatarStatus(status?: string) {
  if (!status) return "-";
  return status.replaceAll("_", " ");
}

export default function TecnicoOSDetailsModal({
  ordemId,
  open,
  onClose,
  onAtualizou,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [os, setOs] = useState<OrdemServicoDetalhe | null>(null);
  const [processando, setProcessando] = useState(false);
  const [novoStatus, setNovoStatus] = useState("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");

  const usuarioLogado: UsuarioLogado = useMemo(() => {
    const raw = localStorage.getItem("user");

    if (!raw) return {};

    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, []);

  const criadoPor = useMemo(() => {
    return (os as any)?.criada_por ?? (os as any)?.criadaPor ?? null;
  }, [os]);

  const tecnicoResponsavel = useMemo(() => {
    return (os as any)?.tecnico_responsavel ?? (os as any)?.tecnicoResponsavel ?? null;
  }, [os]);

  const dadosTecnicos = useMemo(() => {
    const descricao = os?.descricao ?? "";

    function extrair(label: string) {
      const regex = new RegExp(`${label}:\\s*(.*)`);
      const match = descricao.match(regex);
      return match?.[1]?.trim() || "";
    }

    const unidade = extrair("Unidade");
    const local = extrair("Local");
    const setorRequisitante = extrair("Setor");
    const encarregado = extrair("Encarregado");
    const equipe = extrair("Equipe");
    const tipoManutencao = extrair("Tipo Manutenção");
    const servico = extrair("Serviço");
    const equipamento = extrair("Equipamento");
    const diagnostico = extrair("Diagnóstico");
    const procedimento = extrair("Procedimento");
    const materialUtilizado = extrair("Material");
    const resolvido = extrair("Resolvido");
    const motivo = extrair("Motivo");

    return {
      unidade,
      local,
      setorRequisitante,
      encarregado,
      equipe,
      tipoManutencao,
      servico,
      equipamento,
      diagnostico,
      procedimento,
      materialUtilizado,
      resolucao: resolvido === "SIM",
      motivoNaoResolucao: motivo,
    } as DadosTecnicos;
  }, [os]);

  const execucaoAberta = useMemo(() => {
    return os?.execucoes?.find((item) => !item.data_fim) ?? null;
  }, [os]);

  const tecnicoResponsavelId =
    (os as any)?.tecnico_responsavel_id ?? tecnicoResponsavel?.id ?? null;

  const osSemResponsavel = !tecnicoResponsavelId;
  const osEhMinha = !!tecnicoResponsavelId && tecnicoResponsavelId === usuarioLogado.id;
  const osEhDeOutroTecnico =
    !!tecnicoResponsavelId && tecnicoResponsavelId !== usuarioLogado.id;

  const podeAceitar = os?.status === "aberta" && osSemResponsavel;
  const podeIniciarExecucao = !!os && os.status === "aberta" && osEhMinha;
  const podeAtualizarStatus =
    !!os && osEhMinha && (os.status === "aberta" || os.status === "em_execucao");

  async function carregar() {
    if (!ordemId) return;

    try {
      setLoading(true);
      setErro("");

      const data = await buscarOrdem(ordemId, [
        "endereco",
        "criadaPor",
        "tecnicoResponsavel",
        "execucoes",
        "execucoes.tecnico",
        "anexos",
      ]);

      setOs(data);
    } catch (error: any) {
      console.error(error);
      setErro(error?.response?.data?.message || "Não foi possível carregar a OS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && ordemId) {
      carregar();
    }
  }, [open, ordemId]);

  async function handleAceitarOS() {
    if (!os?.id) return;

    try {
      setProcessando(true);
      setErro("");

      await aceitarOrdem(os.id);

      await carregar();
      onAtualizou?.();
    } catch (error: any) {
      console.error(error);
      setErro(error?.response?.data?.message || "Não foi possível aceitar a OS.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleRegistrarExecucao() {
    if (!os?.id) return;

    try {
      setProcessando(true);
      setErro("");

      await iniciarExecucao(os.id, {});
      await carregar();
      onAtualizou?.();
    } catch (error: any) {
      console.error(error);
      setErro(error?.response?.data?.message || "Não foi possível iniciar a execução.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleAtualizarStatus() {
    if (!os?.id || !novoStatus) return;

    try {
      setProcessando(true);
      setErro("");

      if (novoStatus === "nao_executada") {
        if (!motivoNaoExecucao.trim()) {
          setErro("Informe o motivo da não execução.");
          setProcessando(false);
          return;
        }

        await marcarNaoExecutada(os.id, {
          motivo_nao_execucao: motivoNaoExecucao,
        });
      } else if (novoStatus === "finalizada") {
        if (!execucaoAberta?.id) {
          setErro("Nenhuma execução em andamento para finalizar.");
          setProcessando(false);
          return;
        }

        await finalizarExecucao(os.id, {
          execucao_id: execucaoAberta.id,
        });
      }

      setNovoStatus("");
      setMotivoNaoExecucao("");
      await carregar();
      onAtualizou?.();
    } catch (error: any) {
      console.error(error);
      setErro(error?.response?.data?.message || "Não foi possível atualizar o status.");
    } finally {
      setProcessando(false);
    }
  }

  function formatarDataHora(valor?: string | null) {
    if (!valor) return "-";
    return new Date(valor).toLocaleString("pt-BR");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-500 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {loading && <p className="text-sm text-slate-500">Carregando...</p>}

        {!loading && erro && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {!loading && os && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">
                  Ordem de Serviço {os.numero}
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${badgeClass(
                    os.status
                  )}`}
                >
                  {formatarStatus(os.status)}
                </span>
              </div>

              <p className="text-sm text-slate-500">
                Detalhes e informações da ordem de serviço
              </p>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Informações da OS ETA/ETE</h3>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <Info label="Tipo de Serviço" value="Manutenção ETA/ETE" />
                <Info label="Unidade" value={dadosTecnicos.unidade} />
                <Info label="Local" value={dadosTecnicos.local} />
                <Info label="Tipo de Manutenção" value={dadosTecnicos.tipoManutencao} />
              </div>
            </section>

            <hr />

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Responsáveis</h3>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <Info
                  label="Setor Requisitante"
                  value={dadosTecnicos.setorRequisitante}
                />
                <Info label="Encarregado" value={dadosTecnicos.encarregado} />
                <Info label="Equipe" value={dadosTecnicos.equipe} />
              </div>
            </section>

            <hr />

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Detalhes do Serviço</h3>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <Info label="Serviço" value={dadosTecnicos.servico} />
                <Info label="Equipamento" value={dadosTecnicos.equipamento} />
                <Info label="Diagnóstico" value={dadosTecnicos.diagnostico} />
                <Info label="Procedimento" value={dadosTecnicos.procedimento} />
                <Info label="Material Utilizado" value={dadosTecnicos.materialUtilizado} />
              </div>
            </section>

            <hr />

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Resolução</h3>

              <div className="text-sm">
                <p className="text-slate-500">Problema Resolvido</p>
                <p className={dadosTecnicos.resolucao ? "text-green-600" : "text-red-600"}>
                  {dadosTecnicos.resolucao ? "SIM" : "NÃO"}
                </p>
                {!dadosTecnicos.resolucao && dadosTecnicos.motivoNaoResolucao && (
                  <p className="mt-2 text-slate-600">
                    Motivo: {dadosTecnicos.motivoNaoResolucao}
                  </p>
                )}
              </div>
            </section>

            <hr />

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Controle</h3>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Data de Abertura</p>
                    <p>{formatarDataHora(os.data_abertura)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserIcon className="mt-1 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Aberto por</p>
                    <p>{criadoPor?.name || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserIcon className="mt-1 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500">Responsável</p>
                    <p>{tecnicoResponsavel?.name || "-"}</p>
                  </div>
                </div>
              </div>
            </section>

            <hr />

            {osEhDeOutroTecnico && (
              <>
                <section className="space-y-2">
                  <h3 className="text-xl font-semibold">Ações do Técnico</h3>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Esta OS já foi aceita por outro técnico.
                  </div>
                </section>
                <hr />
              </>
            )}

            {(podeAceitar || podeIniciarExecucao) && (
              <>
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold">Ações do Técnico</h3>

                  {podeAceitar && (
                    <button
                      type="button"
                      onClick={handleAceitarOS}
                      disabled={processando}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {processando ? "Processando..." : "Aceitar Ordem de Serviço"}
                    </button>
                  )}

                  {podeIniciarExecucao && (
                    <button
                      type="button"
                      onClick={handleRegistrarExecucao}
                      disabled={processando}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Wrench className="h-4 w-4" />
                      {processando ? "Processando..." : "Registrar Execução"}
                    </button>
                  )}
                </section>

                <hr />
              </>
            )}

            {podeAtualizarStatus && (
              <section className="space-y-4">
                <h3 className="text-xl font-semibold">Atualizar Status</h3>

                <div className="flex gap-3">
                  <select
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                  >
                    <option value="">Selecione novo status</option>

                    {os.status === "em_execucao" && (
                      <option value="finalizada">Finalizada</option>
                    )}

                    {(os.status === "aberta" || os.status === "em_execucao") && (
                      <option value="nao_executada">Não Executada</option>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={handleAtualizarStatus}
                    disabled={!novoStatus || processando}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-400 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Atualizar
                  </button>
                </div>

                {novoStatus === "nao_executada" && (
                  <textarea
                    rows={3}
                    value={motivoNaoExecucao}
                    onChange={(e) => setMotivoNaoExecucao(e.target.value)}
                    placeholder="Informe o motivo da não execução"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3"
                  />
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null | boolean;
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="text-slate-900">{String(value ?? "-")}</p>
    </div>
  );
}