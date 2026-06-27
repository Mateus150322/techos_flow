import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { redefinirSenha } from "./auth.service";
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

export default function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const token = query.get("token") ?? "";
  const email = query.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const requisitos = useMemo(
    () =>
      getPasswordRequirements(password, {
        email,
        confirmation: passwordConfirmation,
      }),
    [email, password, passwordConfirmation]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !email) {
      setErro("O link de redefinição está incompleto. Solicite um novo link e tente novamente.");
      return;
    }

    const passwordError = getFirstPasswordPolicyError(password, {
      email,
      confirmation: passwordConfirmation,
    });

    if (passwordError) {
      setErro(`Senha inválida: ${passwordError}.`);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const response = await redefinirSenha({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      navigate("/login", {
        replace: true,
        state: {
          successMessage: response.message,
        },
      });
    } catch (error) {
      setErro(
        getFirstApiValidationMessage(error, ["token", "email", "password", "password_confirmation"]) ??
          getApiErrorMessage(
            error,
            "Não foi possível redefinir a senha. Solicite um novo link e tente novamente."
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
      <div className="app-mobile-safe mx-auto flex min-h-dvh max-w-7xl flex-col py-4 sm:px-4 sm:py-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="grid w-full max-w-5xl gap-4 sm:gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className={`rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8 ${panelBg}`}>
              <div className="flex items-center gap-4">
                <BrandMark className="h-12 w-12 rounded-xl shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl" />

                <div>
                  <h1 className={`text-2xl font-semibold sm:text-3xl ${titleText}`}>Nova senha</h1>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Defina uma senha forte para concluir a recuperação da conta.
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
                O link recebido por e-mail é temporário. Se ele expirar, basta solicitar uma
                nova redefinição.
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

            <section className={`rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-8 ${panelBg}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${titleText}`}>Redefinir senha</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Confirme o e-mail da conta e informe a nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${titleText}`}>E-mail</span>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                    />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      readOnly
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none ${inputBg} opacity-80`}
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
                      id="reset-password"
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
                      id="reset-password-confirmation"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </button>

                <Link
                  to="/login"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </form>

              {password ? (
                <p className={`mt-4 text-xs ${mutedText}`}>
                  {isStrongPassword(password, {
                    email,
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
