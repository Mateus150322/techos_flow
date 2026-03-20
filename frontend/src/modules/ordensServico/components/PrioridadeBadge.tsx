type Props = {
  prioridade: number;
};

export function PrioridadeBadge({ prioridade }: Props) {
  const labels: Record<number, string> = {
    1: "Baixa",
    2: "Média",
    3: "Alta",
  };

  const styles: Record<number, string> = {
    1: "bg-emerald-100 text-emerald-700",
    2: "bg-amber-100 text-amber-700",
    3: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[prioridade] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[prioridade] ?? `Nível ${prioridade}`}
    </span>
  );
}