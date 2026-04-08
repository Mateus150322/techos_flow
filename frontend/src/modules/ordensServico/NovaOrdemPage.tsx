import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Moon, Sun } from "lucide-react";

import FormularioOSGeral from "./components/FormularioOSGeral";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

export default function NovaOrdemPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const currentUserRole = useCurrentUser().role;

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  if (currentUserRole === "tecnico") {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <div className="mb-5 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Modo claro" : "Modo escuro"}
              </button>
            </div>

            <div
              className={`rounded-2xl border px-5 py-4 ${
                isDark
                  ? "border-amber-900 bg-amber-950/40 text-amber-200"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <div>
                  <h1 className="text-lg font-semibold">Acesso restrito</h1>
                  <p className="mt-2 text-sm">
                    Técnico não pode abrir OS geral. Para abertura técnica, use o
                    fluxo de Manutenção ETA/ETE no painel do técnico.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/tecnico")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Ir para painel do técnico
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>

              <h1 className={`text-3xl font-bold ${titleText}`}>Nova Ordem de Serviço</h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Preencha os dados para criar uma nova OS.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Modo claro" : "Modo escuro"}
            </button>
          </div>

          <FormularioOSGeral onCriada={(ordemCriada) => navigate(`/ordens-servico/${ordemCriada.id}`)} />
        </div>
      </div>
    </div>
  );
}
