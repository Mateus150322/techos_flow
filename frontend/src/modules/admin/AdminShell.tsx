import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LogOut,
  Moon,
  Sun,
  Users,
  Wrench,
} from "lucide-react";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import { type CurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

type AdminShellProps = {
  currentUser: CurrentUser;
  activeTab: "indicadores" | "ordens" | "relatorios" | "usuarios";
  children: ReactNode;
};

export function AdminShell({
  currentUser,
  activeTab,
  children,
}: AdminShellProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  const pageBg = isDark ? "bg-zinc-950 text-zinc-100" : "bg-slate-50 text-slate-900";
  const panelBg = isDark ? "border-zinc-800 bg-zinc-900" : "border-slate-200 bg-white";
  const softBg = isDark ? "bg-zinc-950/80" : "bg-slate-100";
  const titleText = isDark ? "text-zinc-50" : "text-slate-900";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const buttonSecondary = isDark
    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
  const tabActive = isDark
    ? "bg-zinc-100 text-zinc-950 shadow-sm"
    : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200";
  const tabInactive = isDark
    ? "text-zinc-300 hover:bg-zinc-800"
    : "text-slate-700 hover:bg-white";

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
      key: "usuarios",
      label: "Usuários",
      icon: Users,
      to: "/admin/usuarios",
    },
  ] as const;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className={`mb-5 rounded-3xl border px-6 py-5 shadow-sm ${panelBg}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <Wrench className="h-6 w-6" />
              </div>

              <div>
                <h1 className={`text-2xl font-semibold ${titleText}`}>TechOS Flow</h1>
                <p className={`text-sm ${mutedText}`}>Sistema de Gerenciamento de OS</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${buttonSecondary}`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Modo claro" : "Modo escuro"}
              </button>

              <div className="text-right">
                <p className={`text-sm font-medium ${titleText}`}>{currentUser.name}</p>
                <p className={`text-sm ${mutedText}`}>Administrador</p>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${buttonSecondary}`}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </header>

        <nav className={`mb-6 inline-flex flex-wrap gap-1 rounded-2xl p-1 ${softBg}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.to)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key ? tabActive : tabInactive
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
