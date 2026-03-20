import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  BarChart3,
  Users,
  LogOut,
  PlusCircle,
  Sun,
  Moon,
} from "lucide-react";

import { useTheme } from "@/shared/hooks/useTheme";
import NovaOrdemPage from "@/modules/ordensServico/NovaOrdemPage";
import OrdensPage from "@/modules/ordensServico/OrdensPage";

type UserRole = "administrador" | "tecnico" | "atendente";

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
};

type AbaAdmin = "indicadores" | "consultar" | "relatorios" | "usuarios";
type AbaAtendente = "criar" | "consultar";
type AbaTecnico = "consultar";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [abaAdminAtiva, setAbaAdminAtiva] = useState<AbaAdmin>("indicadores");
  const [abaAtendenteAtiva, setAbaAtendenteAtiva] =
    useState<AbaAtendente>("criar");
  const [abaTecnicoAtiva, setAbaTecnicoAtiva] =
    useState<AbaTecnico>("consultar");

  const currentUser: CurrentUser = useMemo(() => {
    const raw = localStorage.getItem("user");

    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return {
          name: "Usuário",
          role: "atendente",
        };
      }
    }

    return {
      name: "Usuário",
      role: "atendente",
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const pageBg = isDark ? "bg-zinc-950" : "bg-slate-50";
  const headerBg = isDark
    ? "bg-zinc-950 border-zinc-800"
    : "bg-white border-slate-200";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const textPrimary = isDark ? "text-zinc-100" : "text-slate-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-slate-500";
  const buttonSecondary = isDark
    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  const tabBase =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const tabActive = isDark
    ? "bg-zinc-100 text-zinc-900"
    : "bg-white text-slate-900 border shadow-sm";
  const tabInactive = isDark
    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <header className={`sticky top-0 z-10 border-b ${headerBg}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className={`font-semibold ${textPrimary}`}>TechOS Flow</h1>
              <p className={`text-sm ${textSecondary}`}>
                Sistema de Gerenciamento de OS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${textPrimary}`}>
                {currentUser.name}
              </p>
              <p className={`text-xs capitalize ${textSecondary}`}>
                {currentUser.role}
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${buttonSecondary}`}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {isDark ? "Modo claro" : "Modo escuro"}
            </button>

            <button
              onClick={handleLogout}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${buttonSecondary}`}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {currentUser.role === "atendente" && (
          <div className="space-y-6">
            <section className={`rounded-2xl p-4 shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setAbaAtendenteAtiva("criar")}
                  className={`${tabBase} ${
                    abaAtendenteAtiva === "criar" ? tabActive : tabInactive
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar OS
                </button>

                <button
                  onClick={() => setAbaAtendenteAtiva("consultar")}
                  className={`${tabBase} ${
                    abaAtendenteAtiva === "consultar"
                      ? tabActive
                      : tabInactive
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Consultar OS
                </button>
              </div>
            </section>

            <section>
              {abaAtendenteAtiva === "criar" && <NovaOrdemPage />}
              {abaAtendenteAtiva === "consultar" && <OrdensPage />}
            </section>
          </div>
        )}

        {currentUser.role === "administrador" && (
          <div className="space-y-6">
            <section className={`rounded-2xl p-6 shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setAbaAdminAtiva("indicadores")}
                  className={`${tabBase} ${
                    abaAdminAtiva === "indicadores" ? tabActive : tabInactive
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Indicadores
                </button>

                <button
                  onClick={() => setAbaAdminAtiva("consultar")}
                  className={`${tabBase} ${
                    abaAdminAtiva === "consultar" ? tabActive : tabInactive
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Consultar OS
                </button>

                <button
                  onClick={() => setAbaAdminAtiva("relatorios")}
                  className={`${tabBase} ${
                    abaAdminAtiva === "relatorios" ? tabActive : tabInactive
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Relatórios
                </button>

                <button
                  onClick={() => setAbaAdminAtiva("usuarios")}
                  className={`${tabBase} ${
                    abaAdminAtiva === "usuarios" ? tabActive : tabInactive
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </button>
              </div>
            </section>

            {abaAdminAtiva === "indicadores" && (
              <section className={`rounded-2xl p-6 shadow-sm ${cardBg}`}>
                <h2 className={`text-2xl font-semibold ${textPrimary}`}>
                  Indicadores
                </h2>
                <p className={`mt-1 text-sm ${textSecondary}`}>
                  Área administrativa de indicadores.
                </p>
              </section>
            )}

            {abaAdminAtiva === "consultar" && (
              <section>
                <OrdensPage />
              </section>
            )}

            {abaAdminAtiva === "relatorios" && (
              <section className={`rounded-2xl p-6 shadow-sm ${cardBg}`}>
                <h2 className={`text-2xl font-semibold ${textPrimary}`}>
                  Relatórios
                </h2>
                <p className={`mt-1 text-sm ${textSecondary}`}>
                  Área administrativa de relatórios.
                </p>
              </section>
            )}

            {abaAdminAtiva === "usuarios" && (
              <section className={`rounded-2xl p-6 shadow-sm ${cardBg}`}>
                <h2 className={`text-2xl font-semibold ${textPrimary}`}>
                  Usuários
                </h2>
                <p className={`mt-1 text-sm ${textSecondary}`}>
                  Área administrativa de gerenciamento de usuários.
                </p>
              </section>
            )}
          </div>
        )}

        {currentUser.role === "tecnico" && (
          <div className="space-y-6">
            <section className={`rounded-2xl p-4 shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setAbaTecnicoAtiva("consultar")}
                  className={`${tabBase} ${
                    abaTecnicoAtiva === "consultar" ? tabActive : tabInactive
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Minhas OS
                </button>
              </div>
            </section>

            <section>{abaTecnicoAtiva === "consultar" && <OrdensPage />}</section>
          </div>
        )}
      </main>
    </div>
  );
}