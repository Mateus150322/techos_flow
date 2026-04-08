import type { ReactNode } from "react";

type Props = {
  titulo: string;
  valor: number;
  icone: ReactNode;
  cardBg: string;
  cardAccent: string;
  mutedText: string;
  titleText: string;
};

export function ResumoMetricaCard({
  titulo,
  valor,
  icone,
  cardBg,
  cardAccent,
  mutedText,
  titleText,
}: Props) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
      <div className={`rounded-2xl p-4 ${cardAccent}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${mutedText}`}>{titulo}</span>
          {icone}
        </div>
        <p className={`mt-3 text-3xl font-bold ${titleText}`}>{valor}</p>
      </div>
    </div>
  );
}
