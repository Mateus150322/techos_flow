import { useId } from "react";

import type { RelatoriosResponse } from "../relatorios.service";
import { formatDate, formatPrioridade, formatStatus } from "../relatorios.utils";

type Props = {
  atividadeRecente: RelatoriosResponse["atividadeRecente"];
  loading: boolean;
  cardBg: string;
  softCard: string;
  titleText: string;
  mutedText: string;
};

export function RelatoriosRecentActivitySection({
  atividadeRecente,
  loading,
  cardBg,
  softCard,
  titleText,
  mutedText,
}: Props) {
  const atividadeHintId = useId();

  return (
    <section
      className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}
      aria-describedby={atividadeHintId}
      aria-busy={loading}
    >
      <div className="mb-5">
        <h3 className={`text-2xl font-semibold ${titleText}`}>Atividade recente</h3>
        <p id={atividadeHintId} className={`mt-1 text-sm ${mutedText}`}>
          Últimas ordens movimentadas conforme os filtros aplicados.
        </p>
      </div>

      {loading ? (
        <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
          Carregando atividade recente...
        </div>
      ) : atividadeRecente.length === 0 ? (
        <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
          Nenhuma atividade encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-3">
          {atividadeRecente.map((ordem) => (
            <div
              key={ordem.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${softCard}`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-lg font-semibold ${titleText}`}>{ordem.numero}</p>
                  <PriorityPill prioridade={formatPrioridade(ordem.prioridade)} />
                </div>
                <p className={`text-sm ${mutedText}`}>{ordem.nome_cliente || ordem.tipo}</p>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Responsável: <span className={titleText}>{ordem.responsavel}</span>
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 text-left md:items-end md:text-right">
                <p className={`text-sm font-medium capitalize ${titleText}`}>
                  {formatStatus(ordem.status)}
                </p>
                <p className={`text-sm ${mutedText}`}>
                  Atualizada em {formatDate(ordem.atualizado_em || ordem.data_abertura)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PriorityPill({ prioridade }: { prioridade: string }) {
  const classes =
    prioridade === "Alta"
      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      : prioridade === "Média"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>{prioridade}</span>
  );
}
