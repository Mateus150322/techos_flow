import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LogOut,
  Users,
} from "lucide-react";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import { type CurrentUser } from "@/shared/auth/session";
import { BrandMark } from "@/shared/components/BrandMark";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useTheme } from "@/shared/hooks/useTheme";

type AdminShellProps = {
  currentUser: CurrentUser;
  activeTab: "indicadores" | "ordens" | "relatorios" | "horas_extras" | "usuarios";
  children: ReactNode;
};

export function AdminShell({ currentUser, activeTab, children }: AdminShellProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  const pageBg = "app-page";
  const panelBg = "app-header-shell";
  const softBg = "app-nav-shell";
  const titleText = isDark ? "text-slate-50" : "text-white";
  const mutedText = isDark ? "text-slate-400" : "text-slate-100/80";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition";
  const tabActive = "app-tab-active";
  const tabInactive = "app-tab-inactive";

  const tabs = [
    {
      key: "indicadores",
      label: "Indicadores",
      icon: BarChart3,
      to: "/",
    },
    {
      key: "ordens",
      label: "Consultar OS",
      icon: ClipboardList,
      to: "/ordens-servico",
    },
    {
      key: "relatorios",
      label: "Relatórios",
      icon: FileText,
      to: "/admin/relatorios",
    },
    {
      key: "horas_extras",
      label: "Horas Extras",
      icon: ClipboardList,
      to: "/admin/horas-extras",
    },
    {
      key: "usuarios",
      label: "Usuários",
      icon: Users,
      to: "/admin/usuarios",
    },
  ] as const;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <a href="#conteudo-principal" className="app-skip-link">
        Pular para o conteúdo principal
      </a>
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <header className={`mb-4 px-4 py-4 sm:mb-5 sm:px-6 sm:py-5 ${panelBg}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <BrandMark className="h-11 w-11 rounded-2xl shadow-sm ring-1 ring-white/10 sm:h-12 sm:w-12" />

              <div>
                <h1 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>TechOS Flow</h1>
                <p className={`text-sm ${mutedText}`}>Painel administrativo do sistema</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="text-left sm:order-3 sm:ml-auto sm:text-right">
                <p className={`text-sm font-medium ${titleText}`}>{currentUser.name}</p>
                <p className={`text-sm ${mutedText}`}>Administrador</p>
              </div>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => void handleLogout()}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm transition sm:w-auto ${buttonSecondary}`}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <nav
          className="app-touch-scroll mb-5 overflow-x-auto pb-1"
          aria-label="Navegação administrativa"
        >
          <div className={`${softBg} flex min-w-max flex-nowrap gap-1`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => navigate(tab.to)}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.key ? tabActive : tabInactive
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main id="conteudo-principal" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
