import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import FormularioOSGeral from "./components/FormularioOSGeral";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { useCurrentUser } from "@/shared/auth/session";

export default function NovaOrdemPage() {
  const navigate = useNavigate();
  const currentUserRole = useCurrentUser().role;

  const pageBg = "app-page";
  const cardBg = "app-card";
  const mutedText = "app-muted";
  const titleText = "text-[var(--text-main)]";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition";

  if (currentUserRole === "tecnico") {
    return (
      <div className={pageBg}>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className={`${cardBg} rounded-2xl p-6`}>
            <div className="mb-5 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={buttonSecondary}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <ThemeToggle />
            </div>

            <div className="app-alert-warning rounded-2xl px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5" />
                <div>
                  <h1 className="text-lg font-semibold">Acesso restrito</h1>
                  <p className="mt-2 text-sm">
                    Tecnico nao pode abrir OS geral. Para abertura tecnica, use o
                    fluxo de Manutencao ETA/ETE no painel do tecnico.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/tecnico")}
                className="app-button-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
              >
                Ir para painel do tecnico
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className={`${cardBg} rounded-2xl p-6`}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className={buttonSecondary}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>

              <h1 className={`text-3xl font-bold ${titleText}`}>Nova Ordem de Servico</h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Preencha os dados para criar uma nova OS.
              </p>
            </div>

            <ThemeToggle />
          </div>

          <FormularioOSGeral
            onCriada={(ordemCriada) => navigate(`/ordens-servico/${ordemCriada.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
