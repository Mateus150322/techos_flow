import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  BarChart3,
  Users,
  LogOut,
  PlusCircle,
  Wrench,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";

import {
  listarOrdens,
  type OrdemServico,
} from "@/modules/ordensServico/ordensServico.service";
import { StatusBadge } from "@/modules/ordensServico/components/StatusBadge";
import { PrioridadeBadge } from "@/modules/ordensServico/components/PrioridadeBadge";

type UserRole = "administrador" | "tecnico" | "atendente";

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return "dark";
  });

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

  async function carregarOrdens() {
    try {
      setLoading(true);
      const response = await listarOrdens();
      setOrders(response.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  useEffect(() => {
    carregarOrdens();
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const abertas = orders.filter((os) => os.status === "aberta").length;
  const emExecucao = orders.filter((os) => os.status === "em_execucao").length;
  const finalizadas = orders.filter((os) => os.status === "finalizada").length;
  const naoExecutadas = orders.filter((os) => os.status === "nao_executada").length;

  const isDark = theme === "dark";

  const pageBg = isDark ? "bg-zinc-950" : "bg-slate-50";
  const headerBg = isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-slate-200";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const cardBorder = isDark ? "border-zinc-800" : "border-slate-200";
  const textPrimary = isDark ? "text-zinc-100" : "text-slate-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-slate-500";
  const textTertiary = isDark ? "text-zinc-300" : "text-slate-700";
  const tableRowBg = isDark ? "bg-zinc-800/70" : "bg-slate-50";
  const buttonSecondary = isDark
    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
  const quickActionHover = isDark ? "hover:bg-zinc-800" : "hover:bg-slate-50";
  const quickActionIconBg = isDark ? "bg-blue-950/50" : "bg-blue-50";
  const primaryButton = isDark
    ? "bg-blue-600 text-white hover:bg-blue-500"
    : "bg-blue-600 text-white hover:bg-blue-700";

  const tabBase =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition";
  const tabActive = isDark
    ? "bg-slate-100 text-slate-900"
    : "bg-white text-slate-900 border shadow-sm";
  const tabInactive = isDark
    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";

  const quickActionsByRole = {
    atendente: [
      {
        label: "Criar Ordem de Serviço",
        icon: PlusCircle,
        onClick: () => navigate("/ordens-servico/nova"),
      },
      {
        label: "Consultar Ordens",
        icon: ClipboardList,
        onClick: () => navigate("/ordens-servico"),
      },
    ],
    tecnico: [
      {
        label: "Painel do Técnico",
        icon: Wrench,
        onClick: () => navigate("/tecnico"),
      },
    ],
    administrador: [
      {
        label: "Indicadores",
        icon: BarChart3,
        onClick: () => navigate("/dashboard"),
      },
      {
        label: "Consultar Ordens",
        icon: ClipboardList,
        onClick: () => navigate("/ordens-servico"),
      },
      {
        label: "Relatórios",
        icon: FileText,
        onClick: () => alert("Tela de relatórios será implementada"),
      },
      {
        label: "Usuários",
        icon: Users,
        onClick: () => alert("Tela de usuários será implementada"),
      },
    ],
  };

  const quickActions = quickActionsByRole[currentUser.role] ?? [];

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
                Sistema de Gerenciamento de Ordens de Serviço
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${textPrimary}`}>{currentUser.name}</p>
              <p className={`text-xs capitalize ${textSecondary}`}>{currentUser.role}</p>
            </div>

            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${buttonSecondary}`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
        <section className={`mb-6 rounded-2xl p-6 shadow-sm ${cardBg}`}>
          <h2 className={`text-2xl font-semibold ${textPrimary}`}>
            Bem-vindo, {currentUser.name}
          </h2>
          <p className={`mt-1 text-sm ${textSecondary}`}>
            Painel operacional do TechOS Flow para acompanhamento de ordens de serviço.
          </p>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>OS Abertas</span>
              <Clock3 className="h-5 w-5 text-amber-500" />
            </div>
            <p className={`mt-3 text-3xl font-bold ${textPrimary}`}>{abertas}</p>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Em Execução</span>
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <p className={`mt-3 text-3xl font-bold ${textPrimary}`}>{emExecucao}</p>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Finalizadas</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className={`mt-3 text-3xl font-bold ${textPrimary}`}>{finalizadas}</p>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${textSecondary}`}>Não Executadas</span>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className={`mt-3 text-3xl font-bold ${textPrimary}`}>{naoExecutadas}</p>
          </div>
        </section>

        {currentUser.role === "tecnico" ? (
          <div className="space-y-6">
            <section className={`rounded-2xl p-4 shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/tecnico")}
                  className={`${tabBase} ${tabActive}`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Minhas OS
                </button>
              </div>
            </section>

            <section className={`rounded-2xl p-6 shadow-sm ${cardBg}`}>
              <h2 className={`text-2xl font-semibold ${textPrimary}`}>
                Painel do Técnico
              </h2>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                Acesse suas ordens de serviço, registre execuções e acompanhe o andamento.
              </p>
            </section>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className={`rounded-2xl p-6 shadow-sm lg:col-span-1 ${cardBg}`}>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Ações rápidas</h3>
              <p className={`mb-4 mt-1 text-sm ${textSecondary}`}>
                Atalhos principais para o seu perfil.
              </p>

              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${cardBorder} ${quickActionHover}`}
                    >
                      <div className={`rounded-lg p-2 ${quickActionIconBg}`}>
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className={`text-sm font-medium ${textPrimary}`}>
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={`rounded-2xl p-6 shadow-sm lg:col-span-2 ${cardBg}`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>
                    Ordens recentes
                  </h3>
                  <p className={`mt-1 text-sm ${textSecondary}`}>
                    Visão rápida das últimas ordens cadastradas.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/ordens-servico")}
                  className={`rounded-lg px-4 py-2 text-sm ${primaryButton}`}
                >
                  Ver todas
                </button>
              </div>

              {loading ? (
                <div
                  className={`rounded-xl border border-dashed p-6 text-sm ${cardBorder} ${textSecondary}`}
                >
                  Carregando ordens...
                </div>
              ) : orders.length === 0 ? (
                <div
                  className={`rounded-xl border border-dashed p-6 text-sm ${cardBorder} ${textSecondary}`}
                >
                  Nenhuma ordem de serviço encontrada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className={`text-left text-sm ${textSecondary}`}>
                        <th className="pb-2">Número</th>
                        <th className="pb-2">Tipo</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Prioridade</th>
                        <th className="pb-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 6).map((os) => (
                        <tr key={os.id} className={`${tableRowBg}`}>
                          <td className={`rounded-l-xl px-3 py-3 font-medium ${textPrimary}`}>
                            {os.numero}
                          </td>
                          <td className={`px-3 py-3 text-sm ${textTertiary}`}>
                            {os.tipo}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={os.status} />
                          </td>
                          <td className="px-3 py-3">
                            <PrioridadeBadge prioridade={os.prioridade} />
                          </td>
                          <td className="rounded-r-xl px-3 py-3">
                            <button
                              onClick={() => navigate(`/ordens-servico/${os.id}`)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}