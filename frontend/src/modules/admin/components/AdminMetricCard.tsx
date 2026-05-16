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
  void cardBg;
  return (
    <div className="app-card rounded-2xl p-4 shadow-sm transition">
      <div className="app-card-soft rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
              {label}
            </p>
            <p className={`text-3xl font-bold leading-none ${accentClass ?? titleText}`}>{value}</p>
          </div>

          {icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
              {icon}
            </div>
          ) : null}
        </div>
        {hint ? <p className={`mt-4 text-sm ${mutedText}`}>{hint}</p> : null}
      </div>
    </div>
  );
}
