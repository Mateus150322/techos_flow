import type { ReactNode } from "react";

type Props = {
  value: string | number;
  label: string;
  hint?: string;
  cardBg: string;
  titleText: string;
  mutedText: string;
  accentClass?: string;
  icon?: ReactNode;
};

export function AdminMetricCard({
  value,
  label,
  hint,
  cardBg,
  titleText,
  mutedText,
  accentClass,
  icon,
}: Props) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${cardBg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm ${mutedText}`}>{label}</p>
          <p className={`mt-3 text-4xl font-semibold ${accentClass ?? titleText}`}>{value}</p>
        </div>
        {icon ? <div className="mt-1">{icon}</div> : null}
      </div>
      {hint ? <p className={`mt-4 text-sm ${mutedText}`}>{hint}</p> : null}
    </div>
  );
}
