import type { ReactNode } from "react";

type Props = {
  titulo: string;
  valor: number;
  icone: ReactNode;
};

export function ResumoMetricaCard({ titulo, valor, icone }: Props) {
  return (
    <div className="app-card rounded-[1.5rem] p-3 transition sm:rounded-[1.75rem] sm:p-4">
      <div className="app-card-soft rounded-[1.2rem] p-3 sm:rounded-[1.35rem] sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="app-muted text-xs font-semibold uppercase tracking-[0.14em]">
              {titulo}
            </span>
            <p className="text-2xl font-bold leading-none text-[var(--primary-dark)] dark:text-[var(--primary-light)] sm:text-3xl">
              {valor}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--primary)] shadow-sm sm:h-11 sm:w-11">
            {icone}
          </div>
        </div>
      </div>
    </div>
  );
}
