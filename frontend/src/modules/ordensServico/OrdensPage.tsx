import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  PlayCircle,
} from "lucide-react";

import { AdminShell } from "@/modules/admin/AdminShell";
import { useCurrentUser } from "@/shared/auth/session";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { ConsultaOrdensPainel } from "./components/ConsultaOrdensPainel";
import {
  buscarResumoOrdens,
  getTecnicoResponsavel,
  listarOpcoesFiltroOrdens,
  listarOrdens,
  type OrdemServico,
  type Paginated,
  type ResumoOrdens,
} from "./ordensServico.service";

export default function OrdensPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const [ordensResponse, setOrdensResponse] = useState<Paginated<OrdemServico> | null>(null);
  const [resumo, setResumo] = useState<ResumoOrdens | null>(null);
  const [tipos, setTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const buscaAplicada = useDebouncedValue(busca, 300);

  const params = useMemo(
    () => ({
      include: "tecnicoResponsavel",
      q: buscaAplicada.trim() || undefined,
      status: statusFiltro === "todos" ? undefined : statusFiltro,
      tipo: tipoFiltro === "todos" ? undefined : tipoFiltro,
      page: paginaAtual,
      per_page: 15,
    }),
    [buscaAplicada, paginaAtual, statusFiltro, tipoFiltro]
  );

  useEffect(() => {
    void listarOpcoesFiltroOrdens()
      .then((data) => setTipos(data.tipos ?? []))
      .catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErro("");

        const [resumoData, ordensData] = await Promise.all([
          buscarResumoOrdens({
            q: params.q,
            status: params.status,
            tipo: params.tipo,
          }),
          listarOrdens(params),
        ]);

        setResumo(resumoData);
        setOrdensResponse(ordensData);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Não foi possível carregar as ordens de serviço."));
        setOrdensResponse(null);
        setResumo(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params]);

  const ordens = ordensResponse?.data ?? [];
  const ordensAbertas = ordens.filter((ordem) => ordem.status === "aberta");
  const ordensEmExecucao = ordens.filter((ordem) => ordem.status === "em_execucao");
  const ordensEncerradas = ordens.filter((ordem) =>
    ["finalizada", "nao_executada", "cancelada"].includes(ordem.status)
  );

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
        titulo: "Em execução",
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

  const secoes = useMemo(
    () => [
      {
        titulo: "Abertas",
        descricao: "Ordens aguardando aceite, atribuição ou início da execução.",
        ordens: ordensAbertas,
      },
      {
        titulo: "Em execução",
        descricao: "Ordens em andamento acompanhadas pelo painel administrativo.",
        ordens: ordensEmExecucao,
      },
      {
        titulo: "Encerradas",
        descricao: "Ordens finalizadas, não executadas ou canceladas.",
        ordens: ordensEncerradas,
      },
    ],
    [ordensAbertas, ordensEmExecucao, ordensEncerradas]
  );

  const pageBg = "app-page";
  const inputBg = "app-input bg-[var(--bg-card)] px-4 py-3 text-[var(--text-main)]";
  const inputClass = "app-input px-4 py-3 pl-11";
  const buttonSecondary =
    "app-button-outline inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition";

  function formatarData(data?: string | null) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function nomeResponsavel(ordem: OrdemServico) {
    return getTecnicoResponsavel(ordem)?.name || "Sem responsável";
  }

  function handleBuscaChange(value: string) {
    setBusca(value);
    setPaginaAtual(1);
  }

  function handleStatusFiltroChange(value: string) {
    setStatusFiltro(value);
    setPaginaAtual(1);
  }

  function handleTipoFiltroChange(value: string) {
    setTipoFiltro(value);
    setPaginaAtual(1);
  }

  const controlesExtras = (
    <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto">
      <select
        value={statusFiltro}
        onChange={(event) => handleStatusFiltroChange(event.target.value)}
        className={`w-full ${inputBg}`}
      >
        <option value="todos">Todos os status</option>
        <option value="aberta">Aberta</option>
        <option value="em_execucao">Em execução</option>
        <option value="finalizada">Finalizada</option>
        <option value="nao_executada">Não executada</option>
        <option value="cancelada">Cancelada</option>
      </select>

      <select
        value={tipoFiltro}
        onChange={(event) => handleTipoFiltroChange(event.target.value)}
        className={`w-full ${inputBg}`}
      >
        <option value="todos">Todos os tipos</option>
        {tipos.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>
    </div>
  );

  const rodape =
    !loading && ordensResponse ? (
      <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="app-muted">
          Exibindo {ordens.length} de {ordensResponse.total} ordens de serviço.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            type="button"
            onClick={() => setPaginaAtual((current) => Math.max(current - 1, 1))}
            disabled={ordensResponse.current_page <= 1}
            className={`min-h-11 rounded-lg border px-3 py-2 ${buttonSecondary} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Anterior
          </button>
          <span className="app-muted col-span-2 text-center sm:col-span-1">
            Página {ordensResponse.current_page} de {ordensResponse.last_page}
          </span>
          <button
            type="button"
            onClick={() =>
              setPaginaAtual((current) => Math.min(current + 1, ordensResponse.last_page))
            }
            disabled={ordensResponse.current_page >= ordensResponse.last_page}
            className={`min-h-11 rounded-lg border px-3 py-2 ${buttonSecondary} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Próxima
          </button>
        </div>
      </div>
    ) : null;

  const content = (
    <ConsultaOrdensPainel
      titulo="Consultar OS"
      descricao="Consulte e acompanhe ordens de serviço com filtros administrativos e visão por status."
      metricas={metricas}
      secoes={secoes}
      busca={busca}
      onBuscaChange={handleBuscaChange}
      loading={loading}
      erro={erro}
      inputClass={inputClass}
      onVer={(id) => navigate(`/ordens-servico/${id}`)}
      formatarData={formatarData}
      nomeResponsavel={nomeResponsavel}
      controlesExtras={controlesExtras}
      rodape={rodape}
    />
  );

  if (currentUser.role === "administrador") {
    return (
      <AdminShell currentUser={currentUser} activeTab="ordens">
        {content}
      </AdminShell>
    );
  }

  return (
    <div className={pageBg}>
      <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm sm:w-auto ${buttonSecondary}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
        {content}
      </main>
    </div>
  );
}





