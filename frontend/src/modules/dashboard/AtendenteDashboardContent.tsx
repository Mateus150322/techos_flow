import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import FormularioOSGeral from "@/modules/ordensServico/components/FormularioOSGeral";
import { ConsultaOrdensPainel } from "@/modules/ordensServico/components/ConsultaOrdensPainel";
import { MobileOperationalNav } from "@/modules/ordensServico/components/MobileOperationalNav";
import { PainelOperacionalHeader } from "@/modules/ordensServico/components/PainelOperacionalHeader";
import {
  getTecnicoResponsavel,
  type OrdemServico,
} from "@/modules/ordensServico/ordensServico.service";
import { type CurrentUser } from "@/shared/auth/session";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
  buscarDashboardAtendente,
  type AtendenteDashboardResponse,
} from "./dashboard.service";

type AtendenteDashboardContentProps = {
  currentUser: CurrentUser;
};

type AbaPrincipal = "criar" | "consultar";

export function AtendenteDashboardContent({
  currentUser,
}: AtendenteDashboardContentProps) {
  const navigate = useNavigate();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [busca, setBusca] = useState("");
  const buscaAplicada = useDebouncedValue(busca, 300);
  const [dashboard, setDashboard] = useState<AtendenteDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (abaPrincipal !== "consultar") {
      return;
    }

    async function carregarDashboard() {
      try {
        setLoading(true);
        setErro("");
        const data = await buscarDashboardAtendente(buscaAplicada);
        setDashboard(data);
      } catch (error) {
        setDashboard(null);
        setErro(getApiErrorMessage(error, "Não foi possível carregar as ordens de serviço."));
      } finally {
        setLoading(false);
      }
    }

    void carregarDashboard();
  }, [abaPrincipal, buscaAplicada]);

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomeResponsavel(os: OrdemServico) {
    return getTecnicoResponsavel(os)?.name || "Sem responsavel";
  }

  const resumo = dashboard?.resumo;
  const ordensAbertas = dashboard?.secoes.abertas ?? [];
  const ordensEmExecucao = dashboard?.secoes.em_execucao ?? [];
  const ordensEncerradas = dashboard?.secoes.encerradas ?? [];

  const metricas = useMemo(
    () => [
      {
        titulo: "Total de OS",
        valor: resumo?.total ?? 0,
        icone: <ClipboardList className="h-5 w-5 text-blue-600" />,
      },
      {
        titulo: "Abertas",
        valor: resumo?.abertas ?? 0,
        icone: <FilePlus2 className="h-5 w-5 text-sky-600" />,
      },
      {
        titulo: "Em execucao",
        valor: resumo?.em_execucao ?? 0,
        icone: <PlayCircle className="h-5 w-5 text-amber-600" />,
      },
      {
        titulo: "Encerradas",
        valor: resumo?.encerradas ?? 0,
        icone: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      },
    ],
    [resumo]
  );

  const secoes = [
    {
      titulo: "Abertas",
      descricao: "Ordens aguardando aceite ou inicio da execucao.",
      ordens: ordensAbertas,
    },
    {
      titulo: "Em execucao",
      descricao: "Ordens atualmente em andamento com a equipe tecnica.",
      ordens: ordensEmExecucao,
    },
    {
      titulo: "Encerradas",
      descricao: "Ordens concluidas, nao executadas ou canceladas.",
      ordens: ordensEncerradas,
    },
  ];

  const totalOrdens = ordensAbertas.length + ordensEmExecucao.length + ordensEncerradas.length;

  const pageBg = "app-page";
  const headerBg = "app-header-shell";
  const mutedText = "app-muted";
  const titleText = "text-white dark:text-slate-50";
  const buttonInactive =
    "app-tab-inactive border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-soft)]";
  const buttonActive = "app-tab-active border border-[var(--border)]";
  const inputClass = "app-input px-4 py-3 pl-11";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition";

  return (
    <div className={pageBg}>
      <PainelOperacionalHeader
        headerBg={headerBg}
        titleText={titleText}
        mutedText={mutedText}
        buttonSecondary={buttonSecondary}
        onLogout={handleLogout}
        userName={currentUser.name}
        roleLabel="Atendente"
        subtitle="Painel operacional do atendente"
      />

      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="app-mobile-page-offset mx-auto max-w-7xl px-3 pt-4 sm:px-6 sm:py-6"
      >
        <div className="mb-6 hidden gap-3 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setAbaPrincipal("criar")}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${
              abaPrincipal === "criar" ? buttonActive : buttonInactive
            }`}
          >
            <FilePlus2 className="h-4 w-4" />
            Criar OS
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal("consultar")}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${
              abaPrincipal === "consultar" ? buttonActive : buttonInactive
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Consultar OS
          </button>
        </div>

        {abaPrincipal === "criar" && (
          <FormularioOSGeral
            mobileNavOffset
            titulo="Nova OS geral"
            descricao="Abra uma nova ordem de servico com cliente, prioridade, descricao e endereco."
            onCriada={(ordemCriada) => navigate(`/ordens-servico/${ordemCriada.id}`)}
          />
        )}

        {abaPrincipal === "consultar" && (
          <ConsultaOrdensPainel
            titulo="Consultar OS"
            descricao="Consulte ordens abertas, em execucao e encerradas no painel de atendimento."
            metricas={metricas}
            secoes={secoes}
            busca={busca}
            onBuscaChange={setBusca}
            loading={loading}
            erro={erro}
            inputClass={inputClass}
            onVer={(id) => navigate(`/ordens-servico/${id}`)}
            formatarData={formatarData}
            nomeResponsavel={nomeResponsavel}
            rodape={
              !loading ? (
                <div className="app-muted mt-4 text-sm">
                  Exibindo ate {totalOrdens} ordens no painel consultado.
                </div>
              ) : null
            }
          />
        )}
      </main>

      <MobileOperationalNav value={abaPrincipal} onChange={setAbaPrincipal} />
    </div>
  );
}
