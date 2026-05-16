import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { solicitarRecuperacaoSenha } from "./auth.service";
import { BrandMark } from "@/shared/components/BrandMark";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage, getFirstApiValidationMessage } from "@/shared/utils/apiError";

export default function EsqueciSenhaPage() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await solicitarRecuperacaoSenha(email);
      setSucesso(response.message);
    } catch (error) {
      setErro(
        getFirstApiValidationMessage(error, ["email"]) ??
          getApiErrorMessage(
            error,
            "Não foi possível enviar o link de redefinição. Tente novamente em instantes."
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
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="flex items-center gap-4">
                <BrandMark className="h-14 w-14 rounded-2xl shadow-sm" />

                <div>
                  <h1 className={`text-3xl font-semibold ${titleText}`}>Recuperar acesso</h1>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Enviaremos um link seguro para redefinir a senha da sua conta.
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
                Informe o e-mail cadastrado no TechOS Flow. Se houver uma conta ativa, o link
                de redefinição será enviado em instantes.
              </div>
            </section>

            <section className={`rounded-3xl border p-8 shadow-sm ${panelBg}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-semibold ${titleText}`}>Esqueci minha senha</h2>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Use o e-mail institucional da conta para receber o link de recuperação.
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
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu.email@techosflow.com.br"
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
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
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
