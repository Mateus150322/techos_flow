import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3 } from "lucide-react";

import { AdminShell } from "@/modules/admin/AdminShell";
import { AdminMetricCard } from "@/modules/admin/components/AdminMetricCard";
import { StatusBadge } from "@/modules/ordensServico/components/StatusBadge";
import { type CurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { buscarDashboardAdmin, type AdminDashboardResponse } from "./dashboard.service";

type AdminDashboardContentProps = {
  currentUser: CurrentUser;
};

export function AdminDashboardContent({ currentUser }: AdminDashboardContentProps) {
  const { isDark } = useTheme();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoading(true);
        setErro("");
        const data = await buscarDashboardAdmin();
        setDashboard(data);
      } catch (error) {
        setDashboard(null);
        setErro(getApiErrorMessage(error, "Não foi possível carregar os indicadores."));
      } finally {
        setLoading(false);
      }
    }

    void carregarDashboard();
  }, []);

  const resumo = dashboard?.resumo;
  const distribuicaoStatus = dashboard?.distribuicao_status ?? [];
  const tiposBreakdown = dashboard?.tipos_breakdown ?? [];
  const produtividadeTecnicos = dashboard?.produtividade_tecnicos ?? [];
  const resumoMesAtual = dashboard?.resumo_mes_atual;
  const recentOrders = dashboard?.atividade_recente ?? [];

  const tempoMedioHoras = useMemo(() => {
    if (typeof resumo?.tempo_medio_horas !== "number") {
      return "-";
    }

    return `${resumo.tempo_medio_horas.toFixed(1)}h`;
  }, [resumo?.tempo_medio_horas]);

  const abertas = resumo?.abertas ?? 0;
  const finalizadas = resumo?.finalizadas ?? 0;
  const total = resumo?.total ?? 0;

  const cardBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const softBg = isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-zinc-50" : "text-slate-900";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const barTrack = isDark ? "bg-zinc-800" : "bg-slate-200";
  const centerCircleBg = isDark ? "bg-zinc-950" : "bg-slate-50";

  return (
    <AdminShell currentUser={currentUser} activeTab="indicadores">
      {erro ? (
        <div
          className={`mb-6 rounded-3xl border px-5 py-4 text-sm ${
            isDark
              ? "border-red-900 bg-red-950 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {erro}
        </div>
      ) : null}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Total de OS"
          value={total}
          icon={<BarChart3 className="h-6 w-6 text-blue-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          hint="Panorama geral da operação"
        />
        <AdminMetricCard
          label="Taxa de conclusão"
          value={`${total ? Math.round((finalizadas / total) * 100) : 0}%`}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          hint="Percentual concluído no conjunto atual"
        />
        <AdminMetricCard
          label="Tempo médio"
          value={tempoMedioHoras}
          icon={<Clock3 className="h-6 w-6 text-amber-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          hint="Média entre abertura e encerramento"
        />
        <AdminMetricCard
          label="Pendentes"
          value={resumo?.pendentes ?? 0}
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          hint="Ordens abertas ou em execução"
        />
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-2xl font-semibold ${titleText}`}>Distribuição por status</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Visão geral do status das ordens de serviço.
          </p>

          <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="relative h-56 w-56 rounded-full p-8"
              style={{
                background: `conic-gradient(
                  #3b82f6 0 ${getPercentual(distribuicaoStatus, "aberta")}%, 
                  #f4b400 ${getPercentual(distribuicaoStatus, "aberta")}% ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao")
                  }%,
                  #22c55e ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao")
                  }% ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao") +
                    getPercentual(distribuicaoStatus, "finalizada")
                  }%,
                  #ef4444 ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao") +
                    getPercentual(distribuicaoStatus, "finalizada")
                  }% ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao") +
                    getPercentual(distribuicaoStatus, "finalizada") +
                    getPercentual(distribuicaoStatus, "nao_executada")
                  }%,
                  #6b7280 ${
                    getPercentual(distribuicaoStatus, "aberta") +
                    getPercentual(distribuicaoStatus, "em_execucao") +
                    getPercentual(distribuicaoStatus, "finalizada") +
                    getPercentual(distribuicaoStatus, "nao_executada")
                  } 100%
                )`,
              }}
            >
              <div className={`h-full w-full rounded-full ${centerCircleBg}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`rounded-2xl border px-4 py-3 shadow-sm ${cardBg}`}>
                  <p className={`text-sm font-medium ${titleText}`}>Abertas: {abertas}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {distribuicaoStatus.map((item) => (
                <LegendItem
                  key={item.status}
                  label={`${item.label}: ${item.percentual}%`}
                  color={statusColor(item.status)}
                  mutedText={mutedText}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-2xl font-semibold ${titleText}`}>OS por tipo de serviço</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Quantidade de ordens por categoria.</p>

          <div className="mt-8 overflow-x-auto pb-2">
            <div className="flex min-h-[320px] min-w-[420px] items-end gap-4">
              {tiposBreakdown.map((item) => (
                <div key={item.tipo} className="flex flex-1 flex-col items-center gap-3">
                  <div className={`flex h-72 w-full items-end rounded-2xl ${barTrack}`}>
                    <div
                      className="w-full rounded-2xl bg-blue-500"
                      style={{
                        height: `${Math.max(
                          (item.total / Math.max(...tiposBreakdown.map((tipo) => tipo.total), 1)) *
                            100,
                          item.total ? 16 : 0
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${titleText}`}>{item.tipo}</p>
                    <p className={`text-xs ${mutedText}`}>{item.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Produtividade dos técnicos</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Comparação entre OS atribuídas e finalizadas por técnico.
        </p>

        <div className="mt-8 space-y-6">
          {loading ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Carregando produtividade...
            </div>
          ) : produtividadeTecnicos.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Nenhum técnico com ordens atribuídas no momento.
            </div>
          ) : (
            produtividadeTecnicos.map((item) => (
              <div key={item.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-medium ${titleText}`}>{item.nome}</span>
                  <span className={`text-sm ${mutedText}`}>
                    {item.finalizadas} finalizadas de {item.atribuidas} atribuídas
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <div className={`h-5 rounded-full ${barTrack}`}>
                    <div
                      className="h-5 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.max(
                          (item.atribuidas /
                            Math.max(...produtividadeTecnicos.map((tecnico) => tecnico.atribuidas), 1)) *
                            100,
                          8
                        )}%`,
                      }}
                    />
                  </div>
                  <div className={`h-5 rounded-full ${barTrack}`}>
                    <div
                      className="h-5 rounded-full bg-emerald-500"
                      style={{
                        width: `${
                          item.atribuidas
                            ? Math.max((item.finalizadas / item.atribuidas) * 100, item.finalizadas ? 8 : 0)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className={`text-sm ${mutedText}`}>Atribuídas / Finalizadas</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Resumo do mês atual</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>Indicadores com base nas OS abertas neste mês.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SoftMetric
            label="Abertas"
            value={resumoMesAtual?.abertas ?? 0}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Em execução"
            value={resumoMesAtual?.em_execucao ?? 0}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Finalizadas"
            value={resumoMesAtual?.finalizadas ?? 0}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Técnicos ativos"
            value={resumoMesAtual?.tecnicos_ativos ?? 0}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Atividade recente</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>Últimas ordens de serviço atualizadas.</p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Carregando atividade...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Nenhuma atividade recente encontrada.
            </div>
          ) : (
            recentOrders.map((ordem) => (
              <div
                key={ordem.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${softBg}`}
              >
                <div>
                  <p className={`text-lg font-semibold ${titleText}`}>{ordem.numero}</p>
                  <p className={`text-sm ${mutedText}`}>{ordem.nome_cliente || ordem.tipo}</p>
                </div>
                <div className="flex flex-col items-start gap-2 text-left md:items-end md:text-right">
                  <StatusBadge status={ordem.status} />
                  <p className={`text-sm ${mutedText}`}>
                    {new Date(ordem.data_abertura).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "aberta":
      return "bg-blue-500";
    case "em_execucao":
      return "bg-amber-400";
    case "finalizada":
      return "bg-emerald-500";
    case "nao_executada":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}

function getPercentual(
  distribuicaoStatus: AdminDashboardResponse["distribuicao_status"],
  status: string
) {
  return distribuicaoStatus.find((item) => item.status === status)?.percentual ?? 0;
}

function LegendItem({
  label,
  color,
  mutedText,
}: {
  label: string;
  color: string;
  mutedText: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className={`text-sm ${mutedText}`}>{label}</span>
    </div>
  );
}

function SoftMetric({
  label,
  value,
  softBg,
  titleText,
  mutedText,
}: {
  label: string;
  value: number;
  softBg: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${softBg}`}>
      <p className={`text-sm ${mutedText}`}>{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${titleText}`}>{value}</p>
    </div>
  );
}
