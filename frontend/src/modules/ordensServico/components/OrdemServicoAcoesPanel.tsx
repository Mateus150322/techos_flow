import { useEffect, useId, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  PlusCircle,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";

import {
  listarFuncionariosDisponiveis,
  type FuncionarioDisponivel,
} from "../ordensServico.service";

type Variant = "page" | "modal";
type ParticipanteExecucaoInput = {
  funcionario_id: string;
  data_inicio?: string;
  data_fim?: string;
};
type ParticipanteRow = {
  id: string;
  funcionarioId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  obrigatorio: boolean;
};

type Props = {
  variant: Variant;
  status?: string;
  isDark?: boolean;
  processandoAcao: boolean;
  podeAceitar?: boolean;
  podeIniciarExecucao?: boolean;
  podeFinalizarExecucao?: boolean;
  podeMarcarNaoExecutada?: boolean;
  osSemResponsavel?: boolean;
  osEhMinha?: boolean;
  osEhDeOutroTecnico?: boolean;
  tecnicoResponsavelNome?: string | null;
  execucaoAbertaId?: string | null;
  currentUserId?: string;
  currentUserName?: string;
  onError: (message: string) => void;
  onAceitar?: () => Promise<boolean>;
  onIniciarExecucao?: (observacao?: string) => Promise<boolean>;
  onFinalizarExecucao?: (payload: {
    execucaoId: string;
    dataFim?: string;
    observacao?: string;
    funcionarios?: ParticipanteExecucaoInput[];
  }) => Promise<boolean>;
  onMarcarNaoExecutada?: (motivo: string) => Promise<boolean>;
};

const createParticipante = (
  funcionarioId = "",
  obrigatorio = false
): ParticipanteRow => ({
  id:
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  funcionarioId,
  data: "",
  horaInicio: "",
  horaFim: "",
  obrigatorio,
});

const combinarDataHora = (data: string, hora: string) =>
  data && hora ? `${data}T${hora}` : "";

const badgeClass = (status?: string) =>
  status === "aberta"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : status === "em_execucao"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status === "finalizada"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "nao_executada"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-slate-100 text-slate-700";

const getResolucao = (status?: string) =>
  status === "aberta"
    ? "Pendente de execução"
    : status === "em_execucao"
      ? "Em execução"
      : status === "finalizada"
        ? "Resolvido"
        : status === "nao_executada"
          ? "Não resolvido"
          : status === "cancelada"
            ? "Cancelada"
            : "-";

function formatarDuracao(minutos: number) {
  return `${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, "0")}`;
}

function resumoExtras(participante: ParticipanteRow) {
  if (!participante.data && !participante.horaInicio && !participante.horaFim) {
    return {
      titulo: "Usar período principal",
      detalhe: "O cálculo usará o mesmo período da execução principal.",
    };
  }

  if (!participante.data || !participante.horaInicio || !participante.horaFim) {
    return {
      titulo: "Preenchimento parcial",
      detalhe:
        "Informe data, hora de início e hora de fim para esse funcionário.",
    };
  }

  const inicio = new Date(
    combinarDataHora(participante.data, participante.horaInicio)
  );
  const fim = new Date(combinarDataHora(participante.data, participante.horaFim));

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
    return {
      titulo: "Intervalo inválido",
      detalhe: "A hora final precisa ser maior que a inicial.",
    };
  }

  const minutos = Math.round((fim.getTime() - inicio.getTime()) / 60000);

  return {
    titulo: `${formatarDuracao(minutos)} informados`,
    detalhe:
      "Prévia rápida. O cálculo oficial é confirmado ao finalizar a execução.",
  };
}

function Aviso({
  mensagem,
  tone,
}: {
  mensagem: string;
  tone: "blue" | "amber" | "emerald";
}) {
  const classes = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${classes[tone]}`}
      role="status"
    >
      {mensagem}
    </div>
  );
}

function EquipeExecucaoSection({
  participantes,
  currentUserId,
  currentUserName,
  funcionariosDisponiveis,
  participantesSelecionados,
  carregandoFuncionarios,
  processandoAcao,
  inputClass,
  onAdicionar,
  onRemover,
  onLimparPeriodo,
  onAtualizar,
}: {
  participantes: ParticipanteRow[];
  currentUserId?: string;
  currentUserName?: string;
  funcionariosDisponiveis: FuncionarioDisponivel[];
  participantesSelecionados: string[];
  carregandoFuncionarios: boolean;
  processandoAcao: boolean;
  inputClass: string;
  onAdicionar: () => void;
  onRemover: (id: string) => void;
  onLimparPeriodo: (id: string) => void;
  onAtualizar: (
    id: string,
    campo: keyof Omit<ParticipanteRow, "id">,
    valor: string
  ) => void;
}) {
  const captionId = useId();

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Equipe da execução</p>
          <p className="text-xs text-slate-500">
            O técnico responsável entra automaticamente no cálculo. Os horários
            usam o mesmo padrão de data e hora da criação da OS.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdicionar}
          disabled={processandoAcao}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          aria-label="Adicionar novo funcionário à equipe da execução"
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar funcionário
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <caption id={captionId} className="sr-only">
            Tabela da equipe da execução com funcionário, início, fim, resumo
            das horas informadas e ações disponíveis.
          </caption>
          <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Funcionário
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Início
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Fim
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Extras
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {participantes.map((participante) => {
              const obrigatorio =
                participante.obrigatorio &&
                participante.funcionarioId === currentUserId;
              const opcoes = funcionariosDisponiveis.filter(
                (item) =>
                  item.id === participante.funcionarioId ||
                  !participantesSelecionados.includes(item.id)
              );
              const preview = resumoExtras(participante);
              const nomeParticipante =
                funcionariosDisponiveis.find(
                  (item) => item.id === participante.funcionarioId
                )?.name ||
                (participante.funcionarioId === currentUserId
                  ? currentUserName
                  : undefined) ||
                "participante";

              return (
                <tr key={participante.id}>
                  <th scope="row" className="py-3 pr-3 text-left align-top">
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={participante.funcionarioId}
                        onChange={(event) =>
                          onAtualizar(
                            participante.id,
                            "funcionarioId",
                            event.target.value
                          )
                        }
                        disabled={
                          processandoAcao || carregandoFuncionarios || obrigatorio
                        }
                        className={`${inputClass} py-3 pl-10 pr-4`}
                        aria-label={`Funcionário da linha ${nomeParticipante}`}
                      >
                        <option value="">
                          {carregandoFuncionarios ? "Carregando..." : "Selecione"}
                        </option>
                        {opcoes.map((funcionario) => (
                          <option key={funcionario.id} value={funcionario.id}>
                            {funcionario.name} (
                            {funcionario.role === "tecnico"
                              ? "Técnico"
                              : "Administrador"}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                    {obrigatorio ? (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        {currentUserName || "Responsável"} obrigatório na apuração.
                      </p>
                    ) : null}
                  </th>

                  <td className="py-3 pr-3 align-top">
                    <div className="grid gap-2">
                      <input
                        type="date"
                        value={participante.data}
                        onChange={(event) =>
                          onAtualizar(participante.id, "data", event.target.value)
                        }
                        disabled={processandoAcao}
                        className={inputClass}
                        aria-label={`Data de início de ${nomeParticipante}`}
                      />
                      <input
                        type="time"
                        value={participante.horaInicio}
                        onChange={(event) =>
                          onAtualizar(
                            participante.id,
                            "horaInicio",
                            event.target.value
                          )
                        }
                        disabled={processandoAcao}
                        className={inputClass}
                        aria-label={`Hora de início de ${nomeParticipante}`}
                      />
                    </div>
                  </td>

                  <td className="py-3 pr-3 align-top">
                    <div className="grid gap-2">
                      <input
                        type="date"
                        value={participante.data}
                        onChange={(event) =>
                          onAtualizar(participante.id, "data", event.target.value)
                        }
                        disabled={processandoAcao}
                        className={inputClass}
                        aria-label={`Data de fim de ${nomeParticipante}`}
                      />
                      <input
                        type="time"
                        value={participante.horaFim}
                        onChange={(event) =>
                          onAtualizar(
                            participante.id,
                            "horaFim",
                            event.target.value
                          )
                        }
                        disabled={processandoAcao}
                        className={inputClass}
                        aria-label={`Hora de fim de ${nomeParticipante}`}
                      />
                    </div>
                  </td>

                  <td className="py-3 pr-3 align-top">
                    <div
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-700"
                      role="status"
                      aria-live="polite"
                    >
                      <p className="font-medium">{preview.titulo}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {preview.detalhe}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 text-right align-top">
                    <div className="flex justify-end gap-2">
                      {(participante.data ||
                        participante.horaInicio ||
                        participante.horaFim) && (
                        <button
                          type="button"
                          onClick={() => onLimparPeriodo(participante.id)}
                          disabled={processandoAcao}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          aria-label={`Usar o período principal para ${nomeParticipante}`}
                        >
                          Usar período principal
                        </button>
                      )}
                      {!obrigatorio ? (
                        <button
                          type="button"
                          onClick={() => onRemover(participante.id)}
                          disabled={processandoAcao}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          aria-label={`Remover ${nomeParticipante} da equipe da execução`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                          Obrigatório
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrdemServicoAcoesPanel({
  variant,
  status,
  isDark = false,
  processandoAcao,
  podeAceitar = false,
  podeIniciarExecucao = false,
  podeFinalizarExecucao = false,
  podeMarcarNaoExecutada = false,
  osSemResponsavel = false,
  osEhMinha = false,
  osEhDeOutroTecnico = false,
  tecnicoResponsavelNome,
  execucaoAbertaId,
  currentUserId,
  currentUserName,
  onError,
  onAceitar,
  onIniciarExecucao,
  onFinalizarExecucao,
  onMarcarNaoExecutada,
}: Props) {
  const [observacaoInicio, setObservacaoInicio] = useState("");
  const [observacaoFim, setObservacaoFim] = useState("");
  const [motivoNaoExecucao, setMotivoNaoExecucao] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [participantes, setParticipantes] = useState<ParticipanteRow[]>([]);
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<
    FuncionarioDisponivel[]
  >([]);
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);

  const textInputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:ring-2 disabled:opacity-60"
    : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60";
  const compactInputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
    : "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

  const participantesSelecionados = useMemo(
    () =>
      participantes
        .map((participante) => participante.funcionarioId)
        .filter(Boolean),
    [participantes]
  );

  useEffect(() => {
    if (!currentUserId) return;

    setParticipantes((current) => {
      const index = current.findIndex(
        (participante) =>
          participante.obrigatorio ||
          participante.funcionarioId === currentUserId
      );

      if (index === -1) {
        return [createParticipante(currentUserId, true), ...current];
      }

      const updated = [...current];
      updated[index] = {
        ...updated[index],
        funcionarioId: currentUserId,
        obrigatorio: true,
      };
      return updated;
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!onFinalizarExecucao || (!podeFinalizarExecucao && status !== "em_execucao")) {
      return;
    }

    let ativo = true;

    async function carregarFuncionarios() {
      try {
        setCarregandoFuncionarios(true);
        const data = await listarFuncionariosDisponiveis();
        if (ativo) setFuncionariosDisponiveis(data);
      } catch {
        if (ativo) {
          onError(
            "Não foi possível carregar os funcionários disponíveis para a execução."
          );
        }
      } finally {
        if (ativo) setCarregandoFuncionarios(false);
      }
    }

    void carregarFuncionarios();

    return () => {
      ativo = false;
    };
  }, [onError, onFinalizarExecucao, podeFinalizarExecucao, status]);

  function resetEquipe() {
    setParticipantes(currentUserId ? [createParticipante(currentUserId, true)] : []);
  }

  function normalizarParticipantes() {
    const ativos = participantes.filter(
      (participante) =>
        participante.funcionarioId ||
        participante.data.trim() ||
        participante.horaInicio.trim() ||
        participante.horaFim.trim()
    );
    const ids = ativos
      .map((participante) => participante.funcionarioId)
      .filter(Boolean);

    if (ids.some((id, index) => ids.indexOf(id) !== index)) {
      onError("Um funcionário não pode ser incluído duas vezes na mesma execução.");
      return null;
    }

    for (const participante of ativos) {
      if (!participante.funcionarioId) {
        onError("Selecione um funcionário para cada linha preenchida da equipe.");
        return null;
      }

      const temAlgumHorario = !!(
        participante.data ||
        participante.horaInicio ||
        participante.horaFim
      );

      if (
        temAlgumHorario &&
        (!participante.data ||
          !participante.horaInicio ||
          !participante.horaFim)
      ) {
        onError(
          "Quando informar período individual, preencha data, hora de início e hora de fim do funcionário."
        );
        return null;
      }

      const inicio = combinarDataHora(participante.data, participante.horaInicio);
      const fim = combinarDataHora(participante.data, participante.horaFim);

      if ((inicio || fim) && (!inicio || !fim || new Date(fim) <= new Date(inicio))) {
        onError(
          "A hora final deve ser maior que a hora inicial para cada funcionário."
        );
        return null;
      }
    }

    return ativos.map((participante) => ({
      funcionario_id: participante.funcionarioId,
      data_inicio:
        combinarDataHora(participante.data, participante.horaInicio) || undefined,
      data_fim:
        combinarDataHora(participante.data, participante.horaFim) || undefined,
    }));
  }

  function calcularDataFimPrincipal(funcionarios?: ParticipanteExecucaoInput[]) {
    const datasFim = (funcionarios ?? [])
      .map((funcionario) => funcionario.data_fim)
      .filter((value): value is string => !!value)
      .sort(
        (atual, proxima) =>
          new Date(proxima).getTime() - new Date(atual).getTime()
      );

    return datasFim[0];
  }

  async function handleFinalizarExecucao() {
    if (!onFinalizarExecucao) return;

    if (!execucaoAbertaId) {
      onError("Nenhuma execução em andamento para finalizar.");
      return;
    }

    const funcionarios = normalizarParticipantes();
    if (!funcionarios) return;

    const dataFimPrincipal = calcularDataFimPrincipal(funcionarios);

    const finalizou = await onFinalizarExecucao({
      execucaoId: execucaoAbertaId,
      dataFim: dataFimPrincipal,
      observacao: observacaoFim.trim() || undefined,
      funcionarios,
    });

    if (finalizou) {
      setObservacaoFim("");
      resetEquipe();
    }
  }

  async function handleMarcarNaoExecutada() {
    if (!onMarcarNaoExecutada) return;

    if (!motivoNaoExecucao.trim()) {
      onError("Informe o motivo da não execução.");
      return;
    }

    const marcou = await onMarcarNaoExecutada(motivoNaoExecucao.trim());
    if (marcou) setMotivoNaoExecucao("");
  }

  function adicionarParticipante() {
    setParticipantes((current) => [...current, createParticipante()]);
  }

  function removerParticipante(id: string) {
    setParticipantes((current) =>
      current.filter(
        (participante) =>
          participante.id !== id || participante.obrigatorio
      )
    );
  }

  function limparPeriodoParticipante(id: string) {
    setParticipantes((current) =>
      current.map((participante) =>
        participante.id === id
          ? { ...participante, data: "", horaInicio: "", horaFim: "" }
          : participante
      )
    );
  }

  function atualizarParticipante(
    id: string,
    campo: keyof Omit<ParticipanteRow, "id">,
    valor: string
  ) {
    setParticipantes((current) =>
      current.map((participante) =>
        participante.id === id
          ? { ...participante, [campo]: valor }
          : participante
      )
    );
  }

  const equipeProps = {
    participantes,
    currentUserId,
    currentUserName,
    funcionariosDisponiveis,
    participantesSelecionados,
    carregandoFuncionarios,
    processandoAcao,
    inputClass: compactInputClass,
    onAdicionar: adicionarParticipante,
    onRemover: removerParticipante,
    onLimparPeriodo: limparPeriodoParticipante,
    onAtualizar: atualizarParticipante,
  };

  if (variant === "modal") {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl border px-4 py-4 ${badgeClass(status)}`}>
          <p className="text-sm font-semibold">{getResolucao(status)}</p>
        </div>

        {osEhDeOutroTecnico && (
          <Aviso
            tone="amber"
            mensagem={`Esta OS já pertence a ${
              tecnicoResponsavelNome || "outro técnico"
            }.`}
          />
        )}
        {osSemResponsavel && (
          <Aviso
            tone="blue"
            mensagem="Esta OS ainda não possui responsável técnico. Você pode aceitá-la."
          />
        )}
        {osEhMinha && (
          <Aviso
            tone="emerald"
            mensagem="Esta OS está sob sua responsabilidade."
          />
        )}

        {podeAceitar && onAceitar && (
          <button
            type="button"
            onClick={() => void onAceitar()}
            disabled={processandoAcao}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60"
          >
            <ClipboardList className="h-4 w-4" />
            {processandoAcao
              ? "Processando..."
              : "Aceitar ordem de serviço"}
          </button>
        )}

        {podeIniciarExecucao && onIniciarExecucao && (
          <button
            type="button"
            onClick={() =>
              void onIniciarExecucao(observacaoInicio.trim() || undefined)
            }
            disabled={processandoAcao}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 hover:bg-blue-700 disabled:opacity-60"
          >
            <Wrench className="h-4 w-4" />
            {processandoAcao ? "Processando..." : "Iniciar execução"}
          </button>
        )}

        {(podeFinalizarExecucao || podeMarcarNaoExecutada) && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <select
              value={novoStatus}
              onChange={(event) => setNovoStatus(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
              aria-label="Selecione a ação desejada para a ordem de serviço"
            >
              <option value="">Selecione uma ação</option>
              {status === "em_execucao" && (
                <option value="finalizada">Finalizar OS</option>
              )}
              {(status === "aberta" || status === "em_execucao") && (
                <option value="nao_executada">Marcar como não executada</option>
              )}
            </select>

            {novoStatus === "finalizada" && (
              <EquipeExecucaoSection {...equipeProps} />
            )}

            {novoStatus === "nao_executada" && (
              <textarea
                rows={4}
                value={motivoNaoExecucao}
                onChange={(event) => setMotivoNaoExecucao(event.target.value)}
                placeholder="Informe o motivo da não execução"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                aria-label="Motivo da não execução"
              />
            )}

            <button
              type="button"
              onClick={() =>
                void (
                  novoStatus === "finalizada"
                    ? handleFinalizarExecucao()
                    : handleMarcarNaoExecutada()
                )
              }
              disabled={!novoStatus || processandoAcao}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {processandoAcao ? "Salvando..." : "Confirmar atualização"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {podeIniciarExecucao && onIniciarExecucao && (
        <div className="space-y-4">
          <textarea
            rows={4}
            value={observacaoInicio}
            onChange={(event) => setObservacaoInicio(event.target.value)}
            placeholder="Observação opcional ao iniciar a execução"
            disabled={processandoAcao}
            className={`${textInputClass} focus:ring-blue-500`}
            aria-label="Observação opcional ao iniciar a execução"
          />
          <button
            type="button"
            onClick={() =>
              void onIniciarExecucao(observacaoInicio.trim() || undefined)
            }
            disabled={processandoAcao}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Wrench className="h-4 w-4" />
            {processandoAcao ? "Iniciando..." : "Iniciar execução"}
          </button>
        </div>
      )}

      {podeFinalizarExecucao && onFinalizarExecucao && (
        <div className="space-y-4">
          <EquipeExecucaoSection {...equipeProps} />
          <textarea
            rows={4}
            value={observacaoFim}
            onChange={(event) => setObservacaoFim(event.target.value)}
            placeholder="Observação opcional ao finalizar a execução"
            disabled={processandoAcao}
            className={`${textInputClass} focus:ring-blue-500`}
            aria-label="Observação opcional ao finalizar a execução"
          />
          <button
            type="button"
            onClick={() => void handleFinalizarExecucao()}
            disabled={processandoAcao}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4" />
            {processandoAcao ? "Finalizando..." : "Finalizar execução"}
          </button>
        </div>
      )}

      {podeMarcarNaoExecutada && onMarcarNaoExecutada && (
        <div className="space-y-4">
          <textarea
            rows={4}
            value={motivoNaoExecucao}
            onChange={(event) => setMotivoNaoExecucao(event.target.value)}
            placeholder="Informe o motivo pelo qual a OS não foi executada"
            disabled={processandoAcao}
            className={`${textInputClass} focus:ring-red-500`}
            aria-label="Motivo pelo qual a ordem de serviço não foi executada"
          />
          <button
            type="button"
            onClick={() => void handleMarcarNaoExecutada()}
            disabled={processandoAcao}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/10 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            {processandoAcao ? "Salvando..." : "Marcar como não executada"}
          </button>
        </div>
      )}
    </div>
  );
}
