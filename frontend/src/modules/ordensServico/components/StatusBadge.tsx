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
  const styles: Record<Status, string> = {
    aberta: "bg-yellow-100 text-yellow-800",
    em_execucao: "bg-blue-100 text-blue-800",
    finalizada: "bg-green-100 text-green-800",
    nao_executada: "bg-red-100 text-red-800",
    cancelada: "bg-gray-200 text-gray-700",
  };

  const labels: Record<Status, string> = {
    aberta: "Aberta",
    em_execucao: "Em execução",
    finalizada: "Finalizada",
    nao_executada: "Não executada",
    cancelada: "Cancelada",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}