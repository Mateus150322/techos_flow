import { ClipboardList, PlusCircle } from "lucide-react";

type AbaPrincipal = "criar" | "consultar";

type MobileOperationalNavProps = {
  value: AbaPrincipal;
  onChange: (value: AbaPrincipal) => void;
};

const items: Array<{
  value: AbaPrincipal;
  label: string;
  icon: typeof ClipboardList;
}> = [
  {
    value: "consultar",
    label: "Consultar",
    icon: ClipboardList,
  },
  {
    value: "criar",
    label: "Criar OS",
    icon: PlusCircle,
  },
];

export function MobileOperationalNav({
  value,
  onChange,
}: MobileOperationalNavProps) {
  return (
    <nav
      aria-label="Navegação operacional"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_92%,transparent)] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-2 rounded-[1.4rem] border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-[var(--shadow-soft)]">
          {items.map((item) => {
            const Icon = item.icon;
            const ativo = value === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                aria-pressed={ativo}
                className={`inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-3 py-2 text-xs font-semibold transition ${
                  ativo
                    ? "bg-[var(--primary)] text-white shadow-[var(--shadow-soft)]"
                    : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
