import type { CSSProperties } from "react";

type Status =
  | "aberta"
  | "em_execucao"
  | "finalizada"
  | "nao_executada"
  | "cancelada";

type Props = {
  status: Status;
};

export function StatusBadge({ status }: Props) {
  const styles: Record<Status, CSSProperties> = {
    aberta: {
      borderColor: "color-mix(in srgb, var(--primary) 26%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
      color: "var(--primary)",
    },
    em_execucao: {
      borderColor: "color-mix(in srgb, var(--warning) 26%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
      color: "var(--warning)",
    },
    finalizada: {
      borderColor: "color-mix(in srgb, var(--success) 26%, transparent)",
      backgroundColor: "var(--success-soft)",
      color: "var(--success)",
    },
    nao_executada: {
      borderColor: "color-mix(in srgb, var(--danger) 26%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
      color: "var(--danger)",
    },
    cancelada: {
      borderColor: "color-mix(in srgb, var(--text-muted) 22%, transparent)",
      backgroundColor: "var(--neutral-soft)",
      color: "var(--text-muted)",
    },
  };

  const labels: Record<Status, string> = {
    aberta: "Aberta",
    em_execucao: "Em execução",
    finalizada: "Finalizada",
    nao_executada: "Não executada",
    cancelada: "Cancelada",
  };

  return (
    <span
      className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-center text-xs font-semibold leading-4"
      style={styles[status]}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
