import { useMemo, type ReactNode } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3 } from "lucide-react";

import { AdminShell } from "@/modules/admin/AdminShell";
import {
  getTecnicoResponsavel,
  type OrdemServico,
} from "@/modules/ordensServico/ordensServico.service";
import { StatusBadge } from "@/modules/ordensServico/components/StatusBadge";
import { type CurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

type AdminDashboardContentProps = {
  currentUser: CurrentUser;
  orders: OrdemServico[];
  loading: boolean;
};

export function AdminDashboardContent({
  currentUser,
  orders,
  loading,
}: AdminDashboardContentProps) {
  const { isDark } = useTheme();

  const abertas = orders.filter((os) => os.status === "aberta").length;
  const emExecucao = orders.filter((os) => os.status === "em_execucao").length;
  const finalizadas = orders.filter((os) => os.status === "finalizada").length;
  const naoExecutadas = orders.filter((os) => os.status === "nao_executada").length;
  const canceladas = orders.filter((os) => os.status === "cancelada").length;
  const pendentes = abertas + emExecucao;

  const ordensDoMesAtual = useMemo(() => {
    const agora = new Date();
    const mes = agora.getMonth();
    const ano = agora.getFullYear();

    return orders.filter((order) => {
      const dataAbertura = new Date(order.data_abertura ?? "");

      return (
        Number.isFinite(dataAbertura.getTime()) &&
        dataAbertura.getMonth() === mes &&
        dataAbertura.getFullYear() === ano
      );
    });
  }, [orders]);

  const tempoMedioHoras = useMemo(() => {
    const duracoes = orders
      .filter((order) => order.status === "finalizada" && order.data_abertura && order.data_encerramento)
      .map((order) => {
        const inicio = new Date(order.data_abertura).getTime();
        const fim = new Date(order.data_encerramento ?? "").getTime();

        if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) {
          return null;
        }

        return (fim - inicio) / (1000 * 60 * 60);
      })
      .filter((value): value is number => typeof value === "number");

    if (!duracoes.length) {
      return "-";
    }

    const media = duracoes.reduce((total, value) => total + value, 0) / duracoes.length;
    return `${media.toFixed(1)}h`;
  }, [orders]);

  const tiposBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const order of orders) {
      const tipo = order.tipo?.trim() || "Sem tipo";
      grouped.set(tipo, (grouped.get(tipo) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .map(([tipo, total]) => ({ tipo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders]);

  const statusPercentages = useMemo(() => {
    const total = orders.length || 1;

    return {
      abertas: Math.round((abertas / total) * 100),
      emExecucao: Math.round((emExecucao / total) * 100),
      finalizadas: Math.round((finalizadas / total) * 100),
      naoExecutadas: Math.round((naoExecutadas / total) * 100),
      canceladas: Math.round((canceladas / total) * 100),
    };
  }, [abertas, canceladas, emExecucao, finalizadas, naoExecutadas, orders.length]);

  const produtividadeTecnicos = useMemo(() => {
    const grouped = new Map<string, { nome: string; atribuidas: number; finalizadas: number }>();

    for (const order of orders) {
      const tecnico = getTecnicoResponsavel(order);
      const key = tecnico?.id ?? "nao_atribuida";
      const nome = tecnico?.name ?? "Sem responsavel";
      const atual = grouped.get(key) ?? { nome, atribuidas: 0, finalizadas: 0 };

      atual.atribuidas += tecnico ? 1 : 0;
      atual.finalizadas += tecnico && order.status === "finalizada" ? 1 : 0;

      grouped.set(key, atual);
    }

    return Array.from(grouped.values())
      .filter((item) => item.nome !== "Sem responsavel")
      .sort((a, b) => b.atribuidas - a.atribuidas)
      .slice(0, 4);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.data_abertura ?? "").getTime() -
          new Date(a.data_abertura ?? "").getTime()
      )
      .slice(0, 5);
  }, [orders]);

  const cardBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const softBg = isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-zinc-50" : "text-slate-900";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const barTrack = isDark ? "bg-zinc-800" : "bg-slate-200";
  const centerCircleBg = isDark ? "bg-zinc-950" : "bg-slate-50";

  return (
    <AdminShell currentUser={currentUser} activeTab="indicadores">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total de OS"
          value={orders.length}
          icon={<BarChart3 className="h-6 w-6 text-blue-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <MetricCard
          label="Taxa de conclusao"
          value={`${orders.length ? Math.round((finalizadas / orders.length) * 100) : 0}%`}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <MetricCard
          label="Tempo medio"
          value={tempoMedioHoras}
          icon={<Clock3 className="h-6 w-6 text-amber-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <MetricCard
          label="Pendentes"
          value={pendentes}
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-2xl font-semibold ${titleText}`}>Distribuicao por status</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Visao geral do status das ordens de servico.
          </p>

          <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="relative h-56 w-56 rounded-full p-8"
              style={{
                background: `conic-gradient(
                  #3b82f6 0 ${statusPercentages.abertas}%,
                  #f4b400 ${statusPercentages.abertas}% ${statusPercentages.abertas + statusPercentages.emExecucao}%,
                  #22c55e ${statusPercentages.abertas + statusPercentages.emExecucao}% ${
                    statusPercentages.abertas + statusPercentages.emExecucao + statusPercentages.finalizadas
                  }%,
                  #ef4444 ${
                    statusPercentages.abertas + statusPercentages.emExecucao + statusPercentages.finalizadas
                  }% ${
                    statusPercentages.abertas +
                    statusPercentages.emExecucao +
                    statusPercentages.finalizadas +
                    statusPercentages.naoExecutadas
                  }%,
                  #6b7280 ${
                    statusPercentages.abertas +
                    statusPercentages.emExecucao +
                    statusPercentages.finalizadas +
                    statusPercentages.naoExecutadas
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
              <LegendItem
                label={`Abertas: ${statusPercentages.abertas}%`}
                color="bg-blue-500"
                mutedText={mutedText}
              />
              <LegendItem
                label={`Em execucao: ${statusPercentages.emExecucao}%`}
                color="bg-amber-400"
                mutedText={mutedText}
              />
              <LegendItem
                label={`Finalizadas: ${statusPercentages.finalizadas}%`}
                color="bg-emerald-500"
                mutedText={mutedText}
              />
              <LegendItem
                label={`Nao executadas: ${statusPercentages.naoExecutadas}%`}
                color="bg-red-500"
                mutedText={mutedText}
              />
              <LegendItem
                label={`Canceladas: ${statusPercentages.canceladas}%`}
                color="bg-slate-500"
                mutedText={mutedText}
              />
            </div>
          </div>
        </div>

        <div className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-2xl font-semibold ${titleText}`}>OS por tipo de servico</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>Quantidade de ordens por categoria.</p>

          <div className="mt-8 flex min-h-[320px] items-end gap-4">
            {tiposBreakdown.map((item) => (
              <div key={item.tipo} className="flex flex-1 flex-col items-center gap-3">
                <div className={`flex h-72 w-full items-end rounded-2xl ${barTrack}`}>
                  <div
                    className="w-full rounded-2xl bg-blue-500"
                    style={{
                      height: `${Math.max(
                        (item.total / Math.max(...tiposBreakdown.map((tipo) => tipo.total), 1)) * 100,
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
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Produtividade dos tecnicos</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Comparacao entre OS atribuidas e finalizadas por tecnico.
        </p>

        <div className="mt-8 space-y-6">
          {produtividadeTecnicos.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Nenhum tecnico com ordens atribuidas no momento.
            </div>
          ) : (
            produtividadeTecnicos.map((item) => (
              <div key={item.nome}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-medium ${titleText}`}>{item.nome}</span>
                  <span className={`text-sm ${mutedText}`}>
                    {item.finalizadas} finalizadas de {item.atribuidas} atribuidas
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
                            ? Math.max(
                                (item.finalizadas / item.atribuidas) * 100,
                                item.finalizadas ? 8 : 0
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className={`text-sm ${mutedText}`}>Atribuidas / Finalizadas</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Resumo do mes atual</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>Indicadores com base nas OS abertas neste mes.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SoftMetric
            label="Abertas"
            value={ordensDoMesAtual.filter((os) => os.status === "aberta").length}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Em execucao"
            value={ordensDoMesAtual.filter((os) => os.status === "em_execucao").length}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Finalizadas"
            value={ordensDoMesAtual.filter((os) => os.status === "finalizada").length}
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
          <SoftMetric
            label="Tecnicos ativos"
            value={
              new Set(
                ordensDoMesAtual
                  .map((order) => getTecnicoResponsavel(order)?.id)
                  .filter((id): id is string => Boolean(id))
              ).size
            }
            softBg={softBg}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <h2 className={`text-2xl font-semibold ${titleText}`}>Atividade recente</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>Ultimas ordens de servico atualizadas.</p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
              Carregando atividade...
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

function MetricCard({
  label,
  value,
  icon,
  cardBg,
  titleText,
  mutedText,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  cardBg: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${cardBg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm ${mutedText}`}>{label}</p>
          <p className={`mt-3 text-4xl font-semibold ${titleText}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
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
