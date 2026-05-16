import { LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { login } from "./auth.service";
import { getDefaultRouteForRole } from "@/shared/auth/session";
import { BrandMark } from "@/shared/components/BrandMark";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";

type LoginLocationState = {
  authMessage?: string;
  successMessage?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = (location.state as LoginLocationState | null) ?? null;
    const authMessage = state?.authMessage;
    const successMessage = state?.successMessage;

    if (!authMessage) {
      setErro("");
    } else {
      setErro(normalizeAuthMessage(authMessage));
    }

    if (!successMessage) {
      setSucesso("");
    } else {
      setSucesso(successMessage);
    }
  }, [location.state]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await login(email, password);

      navigate(
        response.user.must_change_password
          ? "/primeiro-acesso"
          : getDefaultRouteForRole(response.user.role),
        { replace: true }
      );
    } catch (error) {
      setErro(
        normalizeAuthMessage(
          getApiErrorMessage(error, "Não foi possível entrar. Confira e-mail e senha.")
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const panelBg = isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="flex items-center gap-4">
                <BrandMark className="h-14 w-14 rounded-2xl shadow-sm" />

                <div>
                  <h1 className={`text-3xl font-semibold ${titleText}`}>TechOS Flow</h1>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Gestão de ordens de serviço para operação técnica e atendimento.
                  </p>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${titleText}`}>Entrar</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Use suas credenciais para acessar o sistema.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>E-mail</span>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      placeholder="seu.email@techosflow.com"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>Senha</span>
                  <div className="relative">
                    <LockKeyhole
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </label>

                {erro ? (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-red-900 bg-red-950 text-red-300"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {erro}
                  </div>
                ) : null}

                {sucesso ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {sucesso}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>

                <div className="text-right">
                  <Link
                    to="/esqueci-senha"
                    className={`text-sm font-medium transition hover:underline ${
                      isDark ? "text-sky-300" : "text-blue-700"
                    }`}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeAuthMessage(message: string) {
  if (message === "Usuário inativo.") {
    return "Seu acesso está inativo. Procure um administrador para reativar seu usuário.";
  }

  return message;
}
