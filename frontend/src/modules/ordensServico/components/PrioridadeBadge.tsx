import type { CSSProperties } from "react";

type Props = {
  prioridade: number;
};

export function PrioridadeBadge({ prioridade }: Props) {
  const labels: Record<number, string> = {
    1: "Baixa",
    2: "Media",
    3: "Alta",
  };

  const styles: Record<number, CSSProperties> = {
    1: {
      borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
      color: "var(--primary)",
    },
    2: {
      borderColor: "color-mix(in srgb, var(--warning) 26%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
      color: "var(--warning)",
    },
    3: {
      borderColor: "color-mix(in srgb, var(--danger) 26%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)",
      color: "var(--danger)",
    },
  };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
      style={
        styles[prioridade] ?? {
          borderColor: "color-mix(in srgb, var(--text-muted) 22%, transparent)",
          backgroundColor: "var(--neutral-soft)",
          color: "var(--text-muted)",
        }
      }
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {labels[prioridade] ?? `Nivel ${prioridade}`}
    </span>
  );
}
