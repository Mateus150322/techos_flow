import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  PackageOpen,
  PlusCircle,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import {
  buscarDashboardTecnico,
  type TecnicoDashboardResponse,
} from "@/modules/dashboard/dashboard.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { ConsultaOrdensPainel } from "./components/ConsultaOrdensPainel";
import FormularioETAETETecnico from "./components/FormularioETAETETecnico";
import { MobileOperationalNav } from "./components/MobileOperationalNav";
import { PainelOperacionalHeader } from "./components/PainelOperacionalHeader";
import TecnicoOSDetailsModal from "./components/TecnicoOSDetailsModal";
import { getTecnicoResponsavel, type OrdemServico } from "./ordensServico.service";

type AbaPrincipal = "criar" | "consultar";
type StatusFiltro = "todos" | "aberta" | "em_execucao" | "finalizada" | "nao_executada" | "cancelada";

export default function TecnicoPage() {
  const navigate = useNavigate();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [dashboard, setDashboard] = useState<TecnicoDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const buscaAplicada = useDebouncedValue(busca, 300);
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const deveFocarAbaRef = useRef(false);

  const currentUser = useCurrentUser("tecnico");

  const carregarOrdens = useCallback(
    async (search = buscaAplicada, status = statusFiltro) => {
      try {
        setLoading(true);
        setErro("");
        const response = await buscarDashboardTecnico(search, status);
        setDashboard(response);
      } catch (error) {
        setDashboard(null);
        setErro(getApiErrorMessage(error, "Não foi possível carregar as ordens de serviço."));
      } finally {
        setLoading(false);
      }
    },
    [buscaAplicada, statusFiltro]
  );

  useEffect(() => {
    if (abaPrincipal !== "consultar") {
      return;
    }

    void carregarOrdens();
  }, [abaPrincipal, buscaAplicada, carregarOrdens, statusFiltro]);

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  function handleAbaPrincipalChange(value: AbaPrincipal) {
    if (value === abaPrincipal) {
      return;
    }

    deveFocarAbaRef.current = true;
    setAbaPrincipal(value);
  }

  useEffect(() => {
    if (!deveFocarAbaRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      mainRef.current?.focus({ preventScroll: true });
      deveFocarAbaRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [abaPrincipal]);

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomeResponsavel(os: OrdemServico) {
    return getTecnicoResponsavel(os)?.name || "Sem responsavel";
  }

  function handleBuscaChange(value: string) {
    setBusca(value);
  }

  function handleStatusFiltroChange(value: string) {
    setStatusFiltro(value as StatusFiltro);
  }

  const osDisponiveis = dashboard?.secoes.disponiveis ?? [];
  const minhasOS = dashboard?.secoes.minhas ?? [];
  const osEmExecucao = dashboard?.secoes.em_execucao ?? [];
  const osFinalizadas = dashboard?.secoes.finalizadas ?? [];

  const metricas = useMemo(
    () => [
      {
        titulo: "OS Disponiveis",
        valor: dashboard?.resumo.disponiveis ?? 0,
        icone: <PackageOpen className="h-5 w-5 text-blue-600" />,
      },
      {
        titulo: "Minhas OS",
        valor: dashboard?.resumo.minhas ?? 0,
        icone: <ClipboardList className="h-5 w-5 text-indigo-600" />,
      },
      {
        titulo: "Em execucao",
        valor: dashboard?.resumo.em_execucao ?? 0,
        icone: <Wrench className="h-5 w-5 text-amber-600" />,
      },
      {
        titulo: "Encerradas",
        valor: dashboard?.resumo.concluidas ?? 0,
        icone: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      },
    ],
    [dashboard]
  );

  const secoes = [
    {
      titulo: "OS Disponiveis",
      descricao: "Ordens abertas e ainda sem responsavel tecnico.",
      ordens: osDisponiveis,
      statusVisiveis: ["todos", "aberta"],
    },
    {
      titulo: "Minhas OS",
      descricao:
        statusFiltro === "aberta"
          ? "Ordens abertas ja atribuidas a voce."
          : "Ordens ja atribuidas a voce, independentemente do status.",
      ordens: minhasOS,
      statusVisiveis: ["todos", "aberta"],
    },
    {
      titulo: "Em execucao",
      descricao: "Ordens em andamento sob sua responsabilidade.",
      ordens: osEmExecucao,
      statusVisiveis: ["todos", "em_execucao"],
    },
    {
      titulo: "Encerradas",
      descricao: "Ordens finalizadas, nao executadas ou canceladas.",
      ordens: osFinalizadas,
      statusVisiveis: ["todos", "finalizada", "nao_executada", "cancelada"],
    },
  ].filter((secao) => secao.statusVisiveis.includes(statusFiltro));

  const totalOrdens = dashboard?.resumo.total_filtrado ?? 0;

  const pageBg = "app-page";
  const headerBg = "app-header-shell";
  const mutedText = "text-blue-100 dark:text-slate-300";
  const titleText = "text-white dark:text-slate-50";
  const buttonInactive =
    "app-tab-inactive border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-soft)]";
  const buttonActive = "app-tab-active border border-[var(--border)]";
  const inputClass = "app-input px-4 py-3 pl-11";
  const inputBg = "app-input bg-[var(--bg-card)] px-4 py-3 text-[var(--text-main)]";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition";
  const controlesExtras = (
    <div className="w-full xl:w-56">
      <label htmlFor="tecnico-status-filtro" className="sr-only">
        Filtrar OS por status
      </label>
      <select
        id="tecnico-status-filtro"
        value={statusFiltro}
        onChange={(event) => handleStatusFiltroChange(event.target.value)}
        className={`w-full ${inputBg}`}
      >
        <option value="todos">Todos os status</option>
        <option value="aberta">Aberta</option>
        <option value="em_execucao">Em execucao</option>
        <option value="finalizada">Finalizada</option>
        <option value="nao_executada">Nao executada</option>
        <option value="cancelada">Cancelada</option>
      </select>
    </div>
  );

  return (
    <div className={pageBg}>
      <PainelOperacionalHeader
        headerBg={headerBg}
        titleText={titleText}
        mutedText={mutedText}
        buttonSecondary={buttonSecondary}
        onLogout={handleLogout}
        userName={currentUser.name}
        roleLabel="Tecnico"
        subtitle="Painel operacional do tecnico"
      />

      <MobileOperationalNav value={abaPrincipal} onChange={handleAbaPrincipalChange} />

      <main
        ref={mainRef}
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-3 pt-4 sm:px-6 sm:py-6"
      >
        <div className="mb-6 hidden gap-3 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => handleAbaPrincipalChange("criar")}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${
              abaPrincipal === "criar" ? buttonActive : buttonInactive
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Criar OS
          </button>

          <button
            type="button"
            onClick={() => handleAbaPrincipalChange("consultar")}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${
              abaPrincipal === "consultar" ? buttonActive : buttonInactive
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Consultar OS
          </button>
        </div>

        {abaPrincipal === "criar" && (
          <FormularioETAETETecnico
            mobileNavOffset
            onCriada={() => {
              setStatusFiltro("todos");
              handleAbaPrincipalChange("consultar");
              void carregarOrdens("", "todos");
            }}
          />
        )}

        {abaPrincipal === "consultar" && (
          <ConsultaOrdensPainel
            titulo="Consultar OS"
            descricao="Consulte ordens disponiveis, atribuidas e encerradas no seu painel operacional."
            metricas={metricas}
            secoes={secoes}
            busca={busca}
            onBuscaChange={handleBuscaChange}
            placeholderBusca="Buscar por numero, cliente, tipo, status ou responsavel..."
            loading={loading}
            erro={erro}
            inputClass={inputClass}
            onVer={setOrdemSelecionadaId}
            formatarData={formatarData}
            nomeResponsavel={nomeResponsavel}
            controlesExtras={controlesExtras}
            rodape={
              !loading ? (
                <div className="app-muted mt-4 text-sm">
                  Exibindo ate {totalOrdens} ordens no painel filtrado por busca e status.
                </div>
              ) : null
            }
          />
        )}
      </main>

      <TecnicoOSDetailsModal
        ordemId={ordemSelecionadaId}
        open={!!ordemSelecionadaId}
        onClose={() => setOrdemSelecionadaId(null)}
        onAtualizou={() => void carregarOrdens()}
      />
    </div>
  );
}
