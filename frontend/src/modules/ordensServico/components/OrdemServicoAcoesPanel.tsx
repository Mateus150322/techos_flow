import { useState } from "react";
import { CheckCircle2, ClipboardList, FileText, Wrench } from "lucide-react";

type Variant = "page" | "modal";

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
  onError: (message: string) => void;
  onAceitar?: () => Promise<boolean>;
  onIniciarExecucao?: (observacao?: string) => Promise<boolean>;
  onFinalizarExecucao?: (payload: {
    execucaoId: string;
    observacao?: string;
  }) => Promise<boolean>;
  onMarcarNaoExecutada?: (motivo: string) => Promise<boolean>;
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

function getResolucao(status?: string) {
  if (status === "aberta") return "Pendente de execução";
  if (status === "em_execucao") return "Em execução";
  if (status === "finalizada") return "Resolvido";
  if (status === "nao_executada") return "Não resolvido";
  if (status === "cancelada") return "Cancelada";
  return "-";
}

function Aviso({ mensagem, tone }: { mensagem: string; tone: "blue" | "amber" | "emerald" }) {
  const classes = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${classes[tone]}`}>{mensagem}</div>;
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

  const pageInputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:ring-2 disabled:opacity-60"
    : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60";

  const podeAtualizarStatus = podeFinalizarExecucao || podeMarcarNaoExecutada;

  async function handleAceitar() {
    if (!onAceitar) {
      return;
    }

    await onAceitar();
  }

  async function handleIniciarExecucao() {
    if (!onIniciarExecucao) {
      return;
    }

    const iniciou = await onIniciarExecucao(observacaoInicio.trim() || undefined);

    if (iniciou) {
      setObservacaoInicio("");
    }
  }

  async function handleFinalizarExecucao() {
    if (!onFinalizarExecucao) {
      return;
    }

    if (!execucaoAbertaId) {
      onError("Nenhuma execução em andamento para finalizar.");
      return;
    }

    const finalizou = await onFinalizarExecucao({
      execucaoId: execucaoAbertaId,
      observacao: observacaoFim.trim() || undefined,
    });

    if (finalizou) {
      setObservacaoFim("");
    }
  }

  async function handleMarcarNaoExecutada() {
    if (!onMarcarNaoExecutada) {
      return;
    }

    if (!motivoNaoExecucao.trim()) {
      onError("Informe o motivo da não execução.");
      return;
    }

    const marcou = await onMarcarNaoExecutada(motivoNaoExecucao.trim());

    if (marcou) {
      setMotivoNaoExecucao("");
    }
  }

  async function handleConfirmarAtualizacao() {
    if (novoStatus === "nao_executada") {
      if (!motivoNaoExecucao.trim()) {
        onError("Informe o motivo da não execução.");
        return;
      }

      const marcou = await onMarcarNaoExecutada?.(motivoNaoExecucao.trim());

      if (!marcou) {
        return;
      }
    }

    if (novoStatus === "finalizada") {
      if (!execucaoAbertaId) {
        onError("Nenhuma execução em andamento para finalizar.");
        return;
      }

      const finalizou = await onFinalizarExecucao?.({
        execucaoId: execucaoAbertaId,
      });

      if (!finalizou) {
        return;
      }
    }

    setNovoStatus("");
    setMotivoNaoExecucao("");
  }

  if (variant === "modal") {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl border px-4 py-4 ${badgeClass(status)}`}>
          <p className="text-sm font-semibold">{getResolucao(status)}</p>
        </div>

        {osEhDeOutroTecnico && (
          <Aviso
            tone="amber"
            mensagem={`Esta OS já pertence a ${tecnicoResponsavelNome || "outro técnico"}.`}
          />
        )}
        {osSemResponsavel && (
          <Aviso
            tone="blue"
            mensagem="Esta OS ainda não possui responsável técnico. Você pode aceitá-la."
          />
        )}
        {osEhMinha && (
          <Aviso tone="emerald" mensagem="Esta OS está sob sua responsabilidade." />
        )}

        {podeAceitar && onAceitar && (
          <button
            type="button"
            onClick={() => void handleAceitar()}
            disabled={processandoAcao}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <ClipboardList className="h-4 w-4" />
            {processandoAcao ? "Processando..." : "Aceitar ordem de serviço"}
          </button>
        )}

        {podeIniciarExecucao && onIniciarExecucao && (
          <button
            type="button"
            onClick={() => void handleIniciarExecucao()}
            disabled={processandoAcao}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Wrench className="h-4 w-4" />
            {processandoAcao ? "Processando..." : "Iniciar execução"}
          </button>
        )}

        {podeAtualizarStatus && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <select
              value={novoStatus}
              onChange={(event) => setNovoStatus(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
            >
              <option value="">Selecione uma ação</option>
              {status === "em_execucao" && <option value="finalizada">Finalizar OS</option>}
              {(status === "aberta" || status === "em_execucao") && (
                <option value="nao_executada">Marcar como não executada</option>
              )}
            </select>

            {novoStatus === "nao_executada" && (
              <textarea
                rows={4}
                value={motivoNaoExecucao}
                onChange={(event) => setMotivoNaoExecucao(event.target.value)}
                placeholder="Informe o motivo da não execução"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
              />
            )}

            <button
              type="button"
              onClick={() => void handleConfirmarAtualizacao()}
              disabled={!novoStatus || processandoAcao}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
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
            className={`${pageInputClass} focus:ring-blue-500`}
          />

          <button
            type="button"
            onClick={() => void handleIniciarExecucao()}
            disabled={processandoAcao}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wrench className="h-4 w-4" />
            {processandoAcao ? "Iniciando..." : "Iniciar execução"}
          </button>
        </div>
      )}

      {podeFinalizarExecucao && onFinalizarExecucao && (
        <div className="space-y-4">
          <textarea
            rows={4}
            value={observacaoFim}
            onChange={(event) => setObservacaoFim(event.target.value)}
            placeholder="Observação opcional ao finalizar a execução"
            disabled={processandoAcao}
            className={`${pageInputClass} focus:ring-blue-500`}
          />

          <button
            type="button"
            onClick={() => void handleFinalizarExecucao()}
            disabled={processandoAcao}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            className={`${pageInputClass} focus:ring-red-500`}
          />

          <button
            type="button"
            onClick={() => void handleMarcarNaoExecutada()}
            disabled={processandoAcao}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {processandoAcao ? "Salvando..." : "Marcar como não executada"}
          </button>
        </div>
      )}
    </div>
  );
}
