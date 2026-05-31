import { AdminMetricCard } from "./AdminMetricCard";

type Stats = {
  total: number;
  ativos: number;
  inativos: number;
  administradores: number;
  tecnicos: number;
  atendentes: number;
  ultimos_7_dias: number;
};

type Props = {
  stats: Stats;
  cardBg: string;
  titleText: string;
  mutedText: string;
};

export function UsuariosMetricsSection({
  stats,
  cardBg,
  titleText,
  mutedText,
}: Props) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <AdminMetricCard
        value={stats.total}
        label="Total filtrado"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-slate-900 dark:text-slate-50"
        hint="Usuários conforme busca e filtros"
      />
      <AdminMetricCard
        value={stats.ativos}
        label="Ativos"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-emerald-500"
        hint="Usuários com acesso liberado"
      />
      <AdminMetricCard
        value={stats.inativos}
        label="Inativos"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-rose-500"
        hint="Usuários com acesso bloqueado"
      />
      <AdminMetricCard
        value={stats.administradores}
        label="Administradores"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-violet-500"
        hint="Acesso gerencial do sistema"
      />
      <AdminMetricCard
        value={stats.tecnicos}
        label="Técnicos"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-blue-500"
        hint="Equipe operacional de campo"
      />
      <AdminMetricCard
        value={stats.atendentes}
        label="Atendentes"
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
        accentClass="text-amber-500"
        hint="Equipe de abertura e consulta"
      />
    </section>
  );
}
