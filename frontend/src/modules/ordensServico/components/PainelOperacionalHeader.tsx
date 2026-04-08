import type { ReactNode } from "react";
import { LogOut, Moon, Sun } from "lucide-react";

type Props = {
  headerBg: string;
  titleText: string;
  mutedText: string;
  buttonSecondary: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void | Promise<void>;
  userName: string;
  roleLabel: string;
  subtitle: string;
  icon: ReactNode;
};

export function PainelOperacionalHeader({
  headerBg,
  titleText,
  mutedText,
  buttonSecondary,
  isDark,
  onToggleTheme,
  onLogout,
  userName,
  roleLabel,
  subtitle,
  icon,
}: Props) {
  return (
    <header className={`border-b ${headerBg}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            {icon}
          </div>

          <div>
            <h1 className={`text-2xl font-semibold ${titleText}`}>TechOS Flow</h1>
            <p className={`text-sm ${mutedText}`}>{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="text-left sm:order-3 sm:ml-auto sm:text-right">
            <p className={`text-sm font-medium ${titleText}`}>{userName}</p>
            <p className={`text-sm ${mutedText}`}>{roleLabel}</p>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${buttonSecondary}`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Modo claro" : "Modo escuro"}
          </button>

          <button
            type="button"
            onClick={() => void onLogout()}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${buttonSecondary}`}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
