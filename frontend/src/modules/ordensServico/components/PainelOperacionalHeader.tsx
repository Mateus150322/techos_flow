import { LogOut } from "lucide-react";

import { BrandMark } from "@/shared/components/BrandMark";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

type Props = {
  headerBg: string;
  titleText: string;
  mutedText: string;
  buttonSecondary: string;
  onLogout: () => void | Promise<void>;
  userName: string;
  roleLabel: string;
  subtitle: string;
};

export function PainelOperacionalHeader({
  headerBg,
  titleText,
  mutedText,
  buttonSecondary,
  onLogout,
  userName,
  roleLabel,
  subtitle,
}: Props) {
  return (
    <header className={headerBg}>
      <a href="#conteudo-principal" className="app-skip-link">
        Pular para o conteúdo principal
      </a>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandMark className="h-11 w-11 rounded-xl shadow-sm ring-1 ring-white/10 sm:h-12 sm:w-12" />

          <div>
            <h1 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>TechOS Flow</h1>
            <p className={`text-sm ${mutedText}`}>{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="text-left sm:order-3 sm:ml-auto sm:text-right">
            <p className={`text-sm font-medium ${titleText}`}>{userName}</p>
            <p className={`text-sm ${mutedText}`}>{roleLabel}</p>
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => void onLogout()}
            aria-label="Sair do sistema"
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition sm:w-auto ${buttonSecondary}`}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
