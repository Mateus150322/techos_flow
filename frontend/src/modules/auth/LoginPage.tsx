import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, LockKeyhole, Mail, Moon, Sun } from "lucide-react";

import { login } from "./auth.service";
import { useTheme } from "@/shared/hooks/useTheme";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setErro("");
      const response = await login(email, password);
      navigate(response.user.role === "tecnico" ? "/tecnico" : "/");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setErro("Não foi possível entrar. Confira email e senha.");
    } finally {
      setLoading(false);
    }
  }

  const pageBg = isDark
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";
  const panelBg = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${buttonSecondary}`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Modo claro" : "Modo escuro"}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <ClipboardList className="h-7 w-7" />
                </div>

                <div>
                  <h1 className={`text-3xl font-semibold ${titleText}`}>TechOS Flow</h1>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Gestão de ordens de serviço para operação técnica e atendimento.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "border-slate-800 bg-slate-950/70"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className={`text-sm font-medium ${titleText}`}>Atendente</p>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Abre OS geral e consulta o andamento das solicitações.
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "border-slate-800 bg-slate-950/70"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className={`text-sm font-medium ${titleText}`}>Técnico</p>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Assume OS, executa atendimento e anexa evidências.
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "border-slate-800 bg-slate-950/70"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className={`text-sm font-medium ${titleText}`}>Administrador</p>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Consulta indicadores, relatórios e visão geral da operação.
                  </p>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${titleText}`}>Entrar</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Use suas credenciais para acessar o perfil correspondente.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                    Email
                  </span>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      type="email"
                      placeholder="seu.email@techosflow.com"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                    Senha
                  </span>
                  <div className="relative">
                    <LockKeyhole
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </label>

                {erro && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-red-900 bg-red-950 text-red-300"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
