import { LockKeyhole, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { alterarSenhaPrimeiroAcesso, logout } from "./auth.service";
import {
  getDefaultRouteForRole,
  useCurrentUser,
} from "@/shared/auth/session";
import { BrandMark } from "@/shared/components/BrandMark";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  getApiErrorMessage,
  getFirstApiValidationMessage,
} from "@/shared/utils/apiError";
import {
  getFirstPasswordPolicyError,
  getPasswordRequirements,
  isStrongPassword,
} from "@/shared/utils/passwordPolicy";

export default function PrimeiroAcessoPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const currentUser = useCurrentUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const panelBg = isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400";

  const requisitos = useMemo(
    () =>
      getPasswordRequirements(password, {
        name: currentUser.name,
        email: currentUser.email,
        currentPassword,
        confirmation: passwordConfirmation,
      }),
    [currentPassword, currentUser.email, currentUser.name, password, passwordConfirmation]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const passwordError = getFirstPasswordPolicyError(password, {
      name: currentUser.name,
      email: currentUser.email,
      currentPassword,
      confirmation: passwordConfirmation,
    });

    if (passwordError) {
      setErro(`Senha inválida: ${passwordError}.`);
      setSucesso("");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await alterarSenhaPrimeiroAcesso({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSucesso(response.message);
      navigate(getDefaultRouteForRole(currentUser.role), { replace: true });
    } catch (error) {
      setErro(
        getFirstApiValidationMessage(error, [
          "current_password",
          "password",
          "password_confirmation",
        ]) ?? getApiErrorMessage(error, "Não foi possível atualizar a senha.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setSaindo(true);
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="flex items-center gap-4">
                <BrandMark className="h-14 w-14 rounded-2xl shadow-sm" />

                <div>
                  <h1 className={`text-3xl font-semibold ${titleText}`}>Primeiro acesso</h1>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Sua conta precisa definir uma senha forte antes de continuar.
                  </p>
                </div>
              </div>

              <div
                className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${
                  isDark
                    ? "border-blue-900 bg-blue-950/60 text-blue-200"
                    : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                <p className="font-medium">{currentUser.name}</p>
                <p className="mt-1">
                  Troque a senha temporária agora. Esse passo é obrigatório só no
                  primeiro acesso ou quando a senha for redefinida por um administrador.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {requisitos.map((requisito) => (
                  <div
                    key={requisito.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      requisito.ok
                        ? isDark
                          ? "border-emerald-900 bg-emerald-950/50 text-emerald-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isDark
                          ? "border-slate-800 bg-slate-950 text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        requisito.ok ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>{requisito.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${titleText}`}>Atualizar senha</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Use uma senha forte para liberar o acesso ao sistema.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                    Senha atual
                  </span>
                  <div className="relative">
                    <LockKeyhole
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="primeiro-acesso-senha-atual"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Digite a senha temporária"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                    Nova senha
                  </span>
                  <div className="relative">
                    <LockKeyhole
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="primeiro-acesso-nova-senha"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Digite a nova senha"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                    Confirmar nova senha
                  </span>
                  <div className="relative">
                    <LockKeyhole
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="primeiro-acesso-confirmacao"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Salvando..." : "Salvar nova senha"}
                  </button>

                  <button
                    type="button"
                    disabled={saindo}
                    onClick={() => void handleLogout()}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <LogOut className="h-4 w-4" />
                    {saindo ? "Saindo..." : "Sair"}
                  </button>
                </div>
              </form>

              {password ? (
                <p className={`mt-4 text-xs ${mutedText}`}>
                  {isStrongPassword(password, {
                    name: currentUser.name,
                    email: currentUser.email,
                    currentPassword,
                    confirmation: passwordConfirmation,
                  })
                    ? "Senha forte pronta para uso."
                    : "Revise os requisitos antes de salvar."}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
