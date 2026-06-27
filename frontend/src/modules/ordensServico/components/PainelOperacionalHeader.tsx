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
      <div className="app-mobile-safe mx-auto grid max-w-7xl gap-4 py-3 sm:px-4 sm:py-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandMark className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-white/10 sm:h-12 sm:w-12" />

          <div>
            <h1 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>TechOS Flow</h1>
            <p className={`text-sm ${mutedText}`}>{subtitle}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center lg:justify-end">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left sm:order-3 sm:min-w-40 sm:text-right">
            <p className={`text-sm font-medium ${titleText}`}>{userName}</p>
            <p className={`text-sm ${mutedText}`}>{roleLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <ThemeToggle className="w-full sm:w-auto" />

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
      </div>
    </header>
  );
}
