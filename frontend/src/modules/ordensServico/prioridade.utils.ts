export function formatPrioridade(prioridade: number) {
  const labels: Record<number, string> = {
    1: "Alta",
    2: "Média",
    3: "Baixa",
  };

  return labels[prioridade] ?? `Nível ${prioridade}`;
}
