import { Activity, AlertTriangle, Camera, Clock3, Users } from "lucide-react";

import type { RelatoriosResponse } from "../relatorios.service";
import { formatStatus } from "../relatorios.utils";
import { GargaloCard, OperationalStatusPill, PriorityPill } from "./RelatoriosReportUi";

type Props = {
  dadosRelatorio: RelatoriosResponse;
  loading: boolean;
  isDark: boolean;
  cardBg: string;
  softCard: string;
  titleText: string;
  mutedText: string;
};

export function RelatoriosOperationalOverviewSection({
  dadosRelatorio,
  loading,
  isDark,
  cardBg,
  softCard,
  titleText,
  mutedText,
}: Props) {
  return (
    <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading}>
      <div className="mb-5">
        <h3 className={`text-2xl font-semibold ${titleText}`}>Contexto operacional</h3>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Use este bloco para decidir prioridades do dia, revisar gargalos e distribuir carga
          entre os técnicos.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`rounded-3xl border p-5 ${softCard}`}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h4 className={`text-lg font-semibold ${titleText}`}>Gargalos prioritários</h4>
          </div>
          <div className="space-y-3">
            {dadosRelatorio.gargalosOperacionais.map((gargalo) => (
              <GargaloCard
                key={gargalo.id}
                gargalo={gargalo}
                isDark={isDark}
                titleText={titleText}
                mutedText={mutedText}
              />
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border p-5 ${softCard}`}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-500" />
            <h4 className={`text-lg font-semibold ${titleText}`}>Fila imediata</h4>
          </div>
          <div className="space-y-3">
            {dadosRelatorio.filaOperacional.length === 0 ? (
              <p className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                Não há ordens abertas ou em execução para os filtros aplicados.
              </p>
            ) : (
              dadosRelatorio.filaOperacional.map((ordem) => (
                <div
                  key={ordem.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={`text-base font-semibold ${titleText}`}>{ordem.numero}</p>
                      <p className={`text-sm ${mutedText}`}>{ordem.clienteLocal || ordem.tipo}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityPill prioridade={ordem.prioridade} />
                      <OperationalStatusPill status={ordem.status} isDark={isDark}>
                        {formatStatus(ordem.status)}
                      </OperationalStatusPill>
                    </div>
                  </div>
                  <div className={`mt-3 grid gap-2 text-sm ${mutedText} sm:grid-cols-2`}>
                    <p>
                      Responsável: <span className={titleText}>{ordem.responsavel}</span>
                    </p>
                    <p>
                      Tempo em fila: <span className={titleText}>{ordem.idadeDescricao}</span>
                    </p>
                  </div>
                  <p className={`mt-3 text-sm ${titleText}`}>{ordem.contexto}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className={`rounded-3xl border p-5 ${softCard}`}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h4 className={`text-lg font-semibold ${titleText}`}>Carga ativa por técnico</h4>
          </div>
          <div className="space-y-3 md:hidden">
            {dadosRelatorio.cargaTecnicos.length === 0 ? (
              <p className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                Nenhum técnico com carga ativa no recorte selecionado.
              </p>
            ) : (
              dadosRelatorio.cargaTecnicos.map((item) => (
                <div
                  key={item.tecnico}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <p className={`text-sm font-semibold ${titleText}`}>{item.tecnico}</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p className={mutedText}>
                      Abertas: <span className={titleText}>{item.abertas}</span>
                    </p>
                    <p className={mutedText}>
                      Em execução: <span className={titleText}>{item.emExecucao}</span>
                    </p>
                    <p className={mutedText}>
                      Críticas: <span className={titleText}>{item.criticas}</span>
                    </p>
                    <p className={mutedText}>
                      Ativas: <span className={titleText}>{item.totalAtivas}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600"}>
                  <tr>
                    <th className="p-3 text-left font-semibold">Técnico</th>
                    <th className="p-3 text-left font-semibold">Abertas</th>
                    <th className="p-3 text-left font-semibold">Em execução</th>
                    <th className="p-3 text-left font-semibold">Críticas</th>
                    <th className="p-3 text-left font-semibold">Ativas</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosRelatorio.cargaTecnicos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`p-4 text-center ${mutedText}`}>
                        Nenhum técnico com carga ativa no recorte selecionado.
                      </td>
                    </tr>
                  ) : (
                    dadosRelatorio.cargaTecnicos.map((item) => (
                      <tr
                        key={item.tecnico}
                        className={`border-t border-slate-200 transition dark:border-slate-800 ${
                          isDark ? "hover:bg-slate-950/80" : "hover:bg-slate-50"
                        }`}
                      >
                        <th scope="row" className="p-3 text-left font-medium">
                          {item.tecnico}
                        </th>
                        <td className="p-3">{item.abertas}</td>
                        <td className="p-3">{item.emExecucao}</td>
                        <td className="p-3">{item.criticas}</td>
                        <td className="p-3 font-semibold">{item.totalAtivas}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`rounded-3xl border p-5 ${softCard}`}>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <h4 className={`text-lg font-semibold ${titleText}`}>Tipos com mais demanda</h4>
          </div>
          <div className="space-y-3">
            {dadosRelatorio.resumoTiposStatus.length === 0 ? (
              <p className={`rounded-2xl border border-dashed p-4 text-sm ${mutedText}`}>
                Não há distribuição por tipo para os filtros aplicados.
              </p>
            ) : (
              dadosRelatorio.resumoTiposStatus.slice(0, 5).map((tipo) => (
                <div
                  key={tipo.tipo}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${titleText}`}>{tipo.tipo}</p>
                    <span className={`text-sm font-medium ${mutedText}`}>{tipo.total} OS</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p className={mutedText}>
                      Abertas: <span className={titleText}>{tipo.abertas}</span>
                    </p>
                    <p className={mutedText}>
                      Em execução: <span className={titleText}>{tipo.emExecucao}</span>
                    </p>
                    <p className={mutedText}>
                      Finalizadas: <span className={titleText}>{tipo.finalizadas}</span>
                    </p>
                    <p className={mutedText}>
                      Não executadas: <span className={titleText}>{tipo.naoExecutadas}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border p-4 ${softCard}`}>
          <p className={`text-sm ${mutedText}`}>Fotos anexadas no recorte</p>
          <div className="mt-2 flex items-center gap-3">
            <Camera className="h-5 w-5 text-indigo-500" />
            <p className={`text-2xl font-semibold ${titleText}`}>
              {dadosRelatorio.metricasOperacionais.fotosAnexadas}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${softCard}`}>
          <p className={`text-sm ${mutedText}`}>Horas extras registradas no recorte</p>
          <div className="mt-2 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-cyan-500" />
            <p className={`text-2xl font-semibold ${titleText}`}>
              {dadosRelatorio.metricasOperacionais.horasExtrasFormatadas}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}



