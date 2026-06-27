import { Fragment, useEffect, useId, useState } from "react";
import { useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  Camera,
  Clock3,
  FileDown,
  FileText,
  Filter,
  ShieldAlert,
  UserRoundX,
  Users,
} from "lucide-react";

import { AdminShell } from "./AdminShell";
import { AdminMetricCard } from "./components/AdminMetricCard";
import { RelatoriosOperationalOverviewSection } from "./components/RelatoriosOperationalOverviewSection";
import { RelatoriosRecentActivitySection } from "./components/RelatoriosRecentActivitySection";
import { ReportCellRenderer } from "./components/RelatoriosReportUi";
import { SpreadsheetExportMenu } from "./components/SpreadsheetExportMenu";
import {
  buscarRelatorioOrdens,
  exportarRelatorioOrdens,
  type RelatorioExportFormat,
  type RelatoriosResponse,
} from "./relatorios.service";
import {
  INITIAL_FILTERS,
  type FiltrosRelatorio,
  type TipoRelatorio,
} from "./relatorios.utils";
import { type OrdemStatus } from "@/modules/ordensServico/ordensServico.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";

const REPORTS_PER_PAGE = 20;

export default function RelatoriosPage() {
  const { isDark } = useTheme();
  const currentUser = useCurrentUser();
  const filtrosHintId = useId();
  const tabelaCaptionId = useId();
  const resultadoRelatorioRef = useRef<HTMLElement | null>(null);
  const deveFocarResultadoRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState<FiltrosRelatorio>(INITIAL_FILTERS);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosRelatorio>(INITIAL_FILTERS);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatoriosResponse | null>(null);
  const [exportandoFormato, setExportandoFormato] = useState<RelatorioExportFormat | null>(null);
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErro("");

        const response = await buscarRelatorioOrdens({
          tipoRelatorio: filtrosAplicados.tipoRelatorio,
          status: filtrosAplicados.status,
          tipo: filtrosAplicados.tipo,
          prioridade: filtrosAplicados.prioridade,
          tecnicoId: filtrosAplicados.tecnicoId,
          dataInicio: filtrosAplicados.dataInicio,
          dataFim: filtrosAplicados.dataFim,
          page: paginaAtual,
          perPage: REPORTS_PER_PAGE,
        });

        setDadosRelatorio(response);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Não foi possível carregar os relatórios."));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [filtrosAplicados, paginaAtual]);

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const softCard = isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-slate-50" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100"
    : "border-slate-200 bg-slate-50 text-slate-900";
  const primaryButton = isDark
    ? "bg-slate-100 text-slate-950 hover:bg-white"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const secondaryButton = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const tableHead = isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600";
  const rowHover = isDark ? "hover:bg-slate-950/80" : "hover:bg-slate-50";

  function aplicarFiltros() {
    deveFocarResultadoRef.current = true;
    setFiltrosAplicados({ ...filtros });
    setPaginaAtual(1);
  }

  useEffect(() => {
    if (loading || !dadosRelatorio || !deveFocarResultadoRef.current) {
      return;
    }

    deveFocarResultadoRef.current = false;

    const frame = window.requestAnimationFrame(() => {
      resultadoRelatorioRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      resultadoRelatorioRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dadosRelatorio, loading]);

  function getLabelExportacao(formato: RelatorioExportFormat, labelPadrao: string) {
    return exportandoFormato === formato ? `Exportando ${formato.toUpperCase()}...` : labelPadrao;
  }

  async function handleExportar(formato: RelatorioExportFormat) {
    try {
      setExportandoFormato(formato);
      setErro("");

      const { blob, fileName } = await exportarRelatorioOrdens(formato, {
        tipoRelatorio: filtrosAplicados.tipoRelatorio,
        status: filtrosAplicados.status,
        tipo: filtrosAplicados.tipo,
        prioridade: filtrosAplicados.prioridade,
        tecnicoId: filtrosAplicados.tecnicoId,
        dataInicio: filtrosAplicados.dataInicio,
        dataFim: filtrosAplicados.dataFim,
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = fileName;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível exportar o relatório."));
    } finally {
      setExportandoFormato(null);
    }
  }

  const resumo = dadosRelatorio?.resumo ?? {
    total: 0,
    abertas: 0,
    emExecucao: 0,
    finalizadas: 0,
    naoExecutadas: 0,
    canceladas: 0,
  };

  const resumoOperacional = dadosRelatorio?.resumoOperacional ?? {
    filaAtiva: 0,
    semResponsavel: 0,
    criticasAtivas: 0,
    abertas48h: 0,
    execucao24h: 0,
    fotosAnexadas: 0,
    horasExtrasFormatadas: "0h00",
  };

  const reportDefinition = dadosRelatorio?.reportDefinition ?? {
    title: "Relatório",
    columns: [],
    rows: [],
  };

  const reportPagination = dadosRelatorio?.reportPagination ?? {
    page: 1,
    perPage: REPORTS_PER_PAGE,
    lastPage: 1,
    total: 0,
  };

  const isOperationalView = filtrosAplicados.tipoRelatorio === "operacional";
  const colSpan = Math.max(reportDefinition.columns.length, 1);

  const metricCards = isOperationalView
    ? [
        {
          label: "Fila ativa",
          value: resumoOperacional.filaAtiva,
          hint: "OS abertas e em execução no recorte",
          accentClass: "text-blue-500",
          icon: <Activity className="h-5 w-5 text-blue-500" />,
        },
        {
          label: "Sem responsável",
          value: resumoOperacional.semResponsavel,
          hint: "Ordens aguardando aceite técnico",
          accentClass: "text-rose-500",
          icon: <UserRoundX className="h-5 w-5 text-rose-500" />,
        },
        {
          label: "Críticas ativas",
          value: resumoOperacional.criticasAtivas,
          hint: "Alta prioridade aberta ou em execução",
          accentClass: "text-amber-500",
          icon: <ShieldAlert className="h-5 w-5 text-amber-500" />,
        },
        {
          label: "Abertas > 48h",
          value: resumoOperacional.abertas48h,
          hint: "Risco de represamento na fila",
          accentClass: "text-orange-500",
          icon: <Clock3 className="h-5 w-5 text-orange-500" />,
        },
        {
          label: "Execução > 24h",
          value: resumoOperacional.execucao24h,
          hint: "Ordens em execução que merecem revisão",
          accentClass: "text-violet-500",
          icon: <AlertTriangle className="h-5 w-5 text-violet-500" />,
        },
        {
          label: "Horas extras",
          value: resumoOperacional.horasExtrasFormatadas,
          hint: "Carga operacional acumulada no período",
          accentClass: "text-cyan-500",
          icon: <Users className="h-5 w-5 text-cyan-500" />,
        },
      ]
    : [
        {
          label: "Total de OS",
          value: resumo.total,
          hint: "Volume consolidado do relatório",
          accentClass: "text-blue-500",
          icon: <FileText className="h-5 w-5 text-blue-500" />,
        },
        {
          label: "OS abertas",
          value: resumo.abertas,
          hint: "Ordens ainda pendentes",
          accentClass: "text-blue-500",
          icon: <Activity className="h-5 w-5 text-blue-500" />,
        },
        {
          label: "Em execução",
          value: resumo.emExecucao,
          hint: "Ordens em andamento",
          accentClass: "text-amber-500",
          icon: <Clock3 className="h-5 w-5 text-amber-500" />,
        },
        {
          label: "Finalizadas",
          value: resumo.finalizadas,
          hint: "Ordens concluídas",
          accentClass: "text-emerald-500",
          icon: <Camera className="h-5 w-5 text-emerald-500" />,
        },
      ];

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminShell currentUser={currentUser} activeTab="relatorios">
      <section
        className={`mb-6 grid gap-4 md:grid-cols-2 ${
          isOperationalView ? "xl:grid-cols-3 2xl:grid-cols-6" : "xl:grid-cols-4"
        }`}
      >
        {metricCards.map((card) => (
          <AdminMetricCard
            key={card.label}
            value={card.value}
            label={card.label}
            cardBg={cardBg}
            titleText={titleText}
            mutedText={mutedText}
            accentClass={card.accentClass}
            hint={card.hint}
            icon={card.icon}
          />
        ))}
      </section>

      <section className={`mb-6 rounded-3xl border p-4 shadow-sm sm:p-6 ${cardBg}`} aria-busy={loading}>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
            <FileText className="h-5 w-5" />
          </div>
          <div>
          <h2 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>Gerar relatório</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Use o contexto operacional para acompanhar fila, gargalos e carga da equipe. Os
              demais modos continuam disponíveis para visão gerencial e exportação.
            </p>
          </div>
        </div>

        <p id={filtrosHintId} className={`mb-4 text-sm ${mutedText}`}>
          Ajuste os filtros, gere o relatório e use os botões de exportação quando o resultado
          estiver carregado.
        </p>

        <div className="grid gap-4 lg:grid-cols-2" aria-describedby={filtrosHintId}>
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Tipo de relatório</span>
            <select
              value={filtros.tipoRelatorio}
              onChange={(event) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipoRelatorio: event.target.value as TipoRelatorio,
                }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="operacional">Contexto operacional</option>
              <option value="geral">Relatório geral de OS</option>
              <option value="status">Relatório por status</option>
              <option value="produtividade">Produtividade dos técnicos</option>
              <option value="tipo">Relatório por tipo de serviço</option>
              <option value="periodo">Relatório por período</option>
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Filtrar por status</span>
            <select
              value={filtros.status}
              onChange={(event) =>
                setFiltros((prev) => ({
                  ...prev,
                  status: event.target.value as OrdemStatus | "todos",
                }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os status</option>
              <option value="aberta">Aberta</option>
              <option value="em_execucao">Em execução</option>
              <option value="finalizada">Finalizada</option>
              <option value="nao_executada">Não executada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Filtrar por tipo</span>
            <select
              value={filtros.tipo}
              onChange={(event) => setFiltros((prev) => ({ ...prev, tipo: event.target.value }))}
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os tipos</option>
              {(dadosRelatorio?.tipos ?? []).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Prioridade</span>
            <select
              value={filtros.prioridade}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, prioridade: event.target.value }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todas">Todas as prioridades</option>
              <option value="1">Alta</option>
              <option value="2">Média</option>
              <option value="3">Baixa</option>
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>
              Técnico responsável
            </span>
            <select
              value={filtros.tecnicoId}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, tecnicoId: event.target.value }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os técnicos</option>
              {(dadosRelatorio?.tecnicos ?? []).map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Período</span>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="relative block">
                <CalendarRange
                  className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                />
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(event) =>
                    setFiltros((prev) => ({ ...prev, dataInicio: event.target.value }))
                  }
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                />
              </label>

              <label className="relative block">
                <CalendarRange
                  className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
                />
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(event) =>
                    setFiltros((prev) => ({ ...prev, dataFim: event.target.value }))
                  }
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={aplicarFiltros}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton}`}
          >
            <Filter className="h-4 w-4" />
            Gerar relatório
          </button>

          <SpreadsheetExportMenu
            disabled={!dadosRelatorio || exportandoFormato !== null}
            exportandoFormato={exportandoFormato}
            isDark={isDark}
            onSelect={(format) => void handleExportar(format)}
          />

          <button
            type="button"
            disabled={!dadosRelatorio || exportandoFormato !== null}
            onClick={() => void handleExportar("pdf")}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
          >
            <FileDown className="h-4 w-4" />
            {getLabelExportacao("pdf", "Exportar PDF")}
          </button>
        </div>
      </section>

      {erro && (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            isDark
              ? "border-red-900 bg-red-950 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="alert"
          aria-live="assertive"
        >
          {erro}
        </div>
      )}

      {isOperationalView && dadosRelatorio && (
        <RelatoriosOperationalOverviewSection
          dadosRelatorio={dadosRelatorio}
          loading={loading}
          isDark={isDark}
          cardBg={cardBg}
          softCard={softCard}
          titleText={titleText}
          mutedText={mutedText}
        />
      )}

      <section
        ref={resultadoRelatorioRef}
        tabIndex={-1}
        className={`mb-6 scroll-mt-4 rounded-3xl border p-4 shadow-sm outline-none sm:p-6 ${cardBg}`}
        aria-busy={loading}
      >
        <div className="mb-5">
          <h3 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>{reportDefinition.title}</h3>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Data de emissão: {dadosRelatorio?.dataEmissao || "-"} | Período:{" "}
            {dadosRelatorio?.periodoDescricao || "-"}
          </p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Filtros aplicados: {dadosRelatorio?.filtrosDescricao || "-"}
          </p>
        </div>

        <div
          className={`mb-5 grid gap-4 sm:grid-cols-2 ${
            isOperationalView ? "xl:grid-cols-4" : "xl:grid-cols-6"
          }`}
        >
          <ResumoCard
            label="Total de OS"
            value={resumo.total}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          <ResumoCard
            label="Abertas"
            value={resumo.abertas}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          <ResumoCard
            label="Em execução"
            value={resumo.emExecucao}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          <ResumoCard
            label="Finalizadas"
            value={resumo.finalizadas}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          {!isOperationalView && (
            <>
              <ResumoCard
                label="Não executadas"
                value={resumo.naoExecutadas}
                cardBg={softCard}
                titleText={titleText}
                mutedText={mutedText}
              />
              <ResumoCard
                label="Canceladas"
                value={resumo.canceladas}
                cardBg={softCard}
                titleText={titleText}
                mutedText={mutedText}
              />
            </>
          )}
        </div>

        {isOperationalView && (
          <div className="space-y-4 2xl:hidden">
            {loading ? (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
                Carregando dados do relatório...
              </div>
            ) : reportDefinition.rows.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
                Nenhum dado encontrado para os filtros aplicados.
              </div>
            ) : (
              reportDefinition.rows.map((row, index) => {
                const rowKey = String(
                  row.numero ?? row[reportDefinition.columns[0]?.key] ?? `${index}-linha`
                );

                return (
                  <MobileOperationalReportCard
                    key={rowKey}
                    row={row}
                    rowKey={rowKey}
                    isDark={isDark}
                    titleText={titleText}
                    mutedText={mutedText}
                    expanded={Boolean(expandedRows[rowKey])}
                    contextExpanded={Boolean(expandedContexts[rowKey])}
                    onToggleDetails={() =>
                      setExpandedRows((current) => ({
                        ...current,
                        [rowKey]: !current[rowKey],
                      }))
                    }
                    onToggleContext={() =>
                      setExpandedContexts((current) => ({
                        ...current,
                        [rowKey]: !current[rowKey],
                      }))
                    }
                  />
                );
              })
            )}
          </div>
        )}

        {!isOperationalView && (
          <div className="space-y-4 xl:hidden">
            {loading ? (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
                Carregando dados do relatório...
              </div>
            ) : reportDefinition.rows.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
                Nenhum dado encontrado para os filtros aplicados.
              </div>
            ) : (
              reportDefinition.rows.map((row, index) => (
                <MobileReportCard
                  key={String(
                    row.numero ?? row[reportDefinition.columns[0]?.key] ?? `${index}-linha`
                  )}
                  row={row}
                  columns={reportDefinition.columns}
                  isDark={isDark}
                  titleText={titleText}
                  mutedText={mutedText}
                />
              ))
            )}
          </div>
        )}

        <div
          className={`overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 ${
            isOperationalView ? "hidden 2xl:block" : "hidden xl:block"
          }`}
        >
            <table className="w-full table-fixed text-sm">
              <caption id={tabelaCaptionId} className="sr-only">
                Tabela do relatório atual com as colunas e linhas retornadas para os filtros aplicados.
              </caption>
              <thead className={tableHead}>
                <tr>
                  {reportDefinition.columns.map((column) => (
                    <th key={column.key} scope="col" className="p-4 text-left font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="p-6 text-center">
                      <span className={mutedText}>Carregando dados do relatório...</span>
                    </td>
                  </tr>
                ) : reportDefinition.rows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="p-6 text-center">
                      <span className={mutedText}>
                        Nenhum dado encontrado para os filtros aplicados.
                      </span>
                    </td>
                  </tr>
                ) : (
                  reportDefinition.rows.map((row, index) => {
                    const rowKey = String(
                      row.numero ?? row[reportDefinition.columns[0]?.key] ?? `${index}-linha`
                    );
                    const rowExpanded = Boolean(expandedRows[rowKey]);

                    return (
                      <Fragment key={rowKey}>
                        <tr
                          className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                        >
                          {reportDefinition.columns.map((column, columnIndex) => {
                            const value = row[column.key] || "-";
                            const content = (
                              <ReportCellRenderer
                                columnKey={column.key}
                                value={value}
                                rowKey={rowKey}
                                isOperationalView={isOperationalView}
                                isDark={isDark}
                                titleText={titleText}
                                mutedText={mutedText}
                                expanded={Boolean(expandedContexts[rowKey])}
                                onToggleContext={() =>
                                  setExpandedContexts((current) => ({
                                    ...current,
                                    [rowKey]: !current[rowKey],
                                  }))
                                }
                              />
                            );

                            return columnIndex === 0 ? (
                              <th
                                key={column.key}
                                scope="row"
                                className="p-4 text-left align-top font-medium"
                              >
                                <div className="space-y-3">
                                  <div>{content}</div>
                                  {isOperationalView ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedRows((current) => ({
                                          ...current,
                                          [rowKey]: !current[rowKey],
                                        }))
                                      }
                                      aria-expanded={rowExpanded}
                                      aria-controls={`linha-detalhe-${rowKey}`}
                                      className={`text-xs font-medium underline-offset-2 transition hover:underline ${
                                        isDark ? "text-sky-300" : "text-sky-700"
                                      }`}
                                    >
                                      {rowExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                                    </button>
                                  ) : null}
                                </div>
                              </th>
                            ) : (
                              <td
                                key={column.key}
                                className={
                                  column.key === "contexto" ||
                                  column.key === "observacoes" ||
                                  column.key === "local" ||
                                  column.key === "origem" ||
                                  column.key === "servico" ||
                                  column.key === "equipamento"
                                    ? "p-4 align-top"
                                    : "p-4"
                                }
                              >
                                {content}
                              </td>
                            );
                          })}
                        </tr>
                        {isOperationalView && rowExpanded ? (
                          <tr
                            id={`linha-detalhe-${rowKey}`}
                            className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60"
                          >
                            <td colSpan={colSpan} className="p-4">
                              <OperationalExpandedRow
                                row={row}
                                isDark={isDark}
                                titleText={titleText}
                                mutedText={mutedText}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>

        <div className={`mt-4 text-sm ${mutedText}`}>
          Total de registros: {reportPagination.total} | Responsável pela emissão:{" "}
          {currentUser.name}
        </div>

        {reportPagination.lastPage > 1 && (
          <div
            className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginação do relatório"
          >
            <p className={mutedText}>
              Página {reportPagination.page} de {reportPagination.lastPage}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading || reportPagination.page <= 1}
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                className={`rounded-2xl border px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${secondaryButton}`}
              >
                Página anterior
              </button>
              <button
                type="button"
                disabled={loading || reportPagination.page >= reportPagination.lastPage}
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, reportPagination.lastPage))
                }
                className={`rounded-2xl border px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${secondaryButton}`}
              >
                Próxima página
              </button>
            </div>
          </div>
        )}
      </section>

      <RelatoriosRecentActivitySection
        atividadeRecente={dadosRelatorio?.atividadeRecente ?? []}
        loading={loading}
        cardBg={cardBg}
        softCard={softCard}
        titleText={titleText}
        mutedText={mutedText}
      />
    </AdminShell>
  );
}

function ResumoCard({
  label,
  value,
  cardBg,
  titleText,
  mutedText,
}: {
  label: string;
  value: number;
  cardBg: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${cardBg}`}>
      <p className={`text-sm ${mutedText}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${titleText}`}>{value}</p>
    </div>
  );
}

function MobileReportCard({
  row,
  columns,
  isDark,
  titleText,
  mutedText,
}: {
  row: Record<string, string>;
  columns: Array<{ key: string; label: string }>;
  isDark: boolean;
  titleText: string;
  mutedText: string;
}) {
  const headlineKey = columns[0]?.key;
  const headline = headlineKey ? row[headlineKey] : undefined;

  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <h4 className={`text-base font-semibold ${titleText}`}>{headline || "Registro"}</h4>

      <dl className="mt-4 space-y-3">
        {columns.slice(1).map((column) => (
          <div key={column.key}>
            <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
              {column.label}
            </dt>
            <dd className={`mt-1 whitespace-pre-wrap break-words text-sm ${titleText}`}>
              {row[column.key] || "-"}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function PriorityPill({ prioridade }: { prioridade: string }) {
  const classes =
    prioridade === "Alta"
      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      : prioridade === "Média"
        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>{prioridade}</span>
  );
}


function MobileOperationalReportCard({
  row,
  rowKey,
  isDark,
  titleText,
  mutedText,
  expanded,
  contextExpanded,
  onToggleDetails,
  onToggleContext,
}: {
  row: Record<string, string>;
  rowKey: string;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  expanded: boolean;
  contextExpanded: boolean;
  onToggleDetails: () => void;
  onToggleContext: () => void;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-lg font-semibold ${titleText}`}>{row.numero || "OS sem número"}</p>
          <p className={`mt-1 text-sm ${mutedText}`}>{row.tipo || "Tipo não informado"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityPill prioridade={row.prioridade || "Baixa"} />
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? "bg-slate-900 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            {row.status || "Status não informado"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileInfoBlock label="Unidade / Local" value={row.local} titleText={titleText} mutedText={mutedText} />
        <MobileInfoBlock label="Origem" value={row.origem} titleText={titleText} mutedText={mutedText} />
        <MobileInfoBlock label="Responsável" value={row.responsavel} titleText={titleText} mutedText={mutedText} />
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>Tempo em fila</p>
          <div className="mt-2">
            <QueueAgeBadge value={row.idade || "-"} isDark={isDark} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)]/55 p-4">
        <div className="grid gap-3">
          <MobileInfoBlock
            label="Serviço solicitado"
            value={row.servico}
            titleText={titleText}
            mutedText={mutedText}
          />
          <MobileInfoBlock
            label="Equipamento"
            value={row.equipamento}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>

        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Resumo operacional
          </p>
          <div className="mt-2">
            <OperationalContextCellV2
              value={row.contexto || "-"}
              isDark={isDark}
              titleText={titleText}
              mutedText={mutedText}
              expanded={contextExpanded}
              onToggle={onToggleContext}
              contextId={`contexto-mobile-${rowKey}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={expanded}
          aria-controls={`detalhe-mobile-${rowKey}`}
          className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
          }`}
        >
          {expanded ? "Ocultar detalhes completos" : "Ver detalhes completos"}
        </button>
      </div>

      {expanded ? (
        <div id={`detalhe-mobile-${rowKey}`} className="mt-4">
          <OperationalExpandedRow
            row={row}
            isDark={isDark}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>
      ) : null}
    </article>
  );
}

function MobileInfoBlock({
  label,
  value,
  titleText,
  mutedText,
}: {
  label: string;
  value?: string;
  titleText: string;
  mutedText: string;
}) {
  const hasValue = Boolean(value && value !== "-");

  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>{label}</p>
      <p className={`mt-1 text-sm leading-6 ${hasValue ? titleText : mutedText}`}>
        {hasValue ? value : "Não informado"}
      </p>
    </div>
  );
}

function OperationalExpandedRow({
  row,
  isDark,
  titleText,
  mutedText,
}: {
  row: Record<string, string>;
  isDark: boolean;
  titleText: string;
  mutedText: string;
}) {
  const fields = [
    { label: "Unidade / Local", value: row.local },
    { label: "Origem da solicitação", value: row.origem },
    { label: "Serviço solicitado", value: row.servico },
    { label: "Equipamento", value: row.equipamento },
    { label: "Responsável técnico", value: row.responsavel },
    { label: "Tempo em fila", value: row.idade },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className={`text-base font-semibold ${titleText}`}>Detalhamento operacional da OS</p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Resumo estruturado da ordem para leitura rápida e tomada de decisão.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-700"
            }`}
          >
            {row.status || "Status não informado"}
          </span>
          <PriorityPill prioridade={row.prioridade || "Baixa"} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className={`rounded-2xl border p-4 ${
              isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
              {field.label}
            </p>
            <p className={`mt-2 text-sm leading-6 ${field.value && field.value !== "-" ? titleText : mutedText}`}>
              {field.value && field.value !== "-" ? field.value : "Não informado"}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
        }`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
          Resumo operacional
        </p>
        <div className="mt-3">
          <OperationalContextCellV2
            value={row.contexto || "-"}
            isDark={isDark}
            titleText={titleText}
            mutedText={mutedText}
            expanded
            onToggle={() => undefined}
            contextId={`contexto-expandido-${String(row.numero ?? "linha")}`}
            allowToggle={false}
          />
        </div>
      </div>
    </div>
  );
}

function OperationalContextCellV2({
  value,
  isDark,
  titleText,
  mutedText,
  expanded,
  onToggle,
  contextId,
  allowToggle = true,
}: {
  value: string;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  expanded: boolean;
  onToggle: () => void;
  contextId: string;
  allowToggle?: boolean;
}) {
  if (!value || value === "-") {
    return <span className={mutedText}>Sem contexto resumido</span>;
  }

  if (value === "Registro inicial de demonstracao.") {
    return <span className={mutedText}>Registro inicial de demonstração</span>;
  }

  if (value.startsWith("Não executada:") || value.startsWith("Nao executada:")) {
    return (
      <div className="max-w-[24rem] space-y-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isDark ? "bg-red-950 text-red-300" : "bg-red-50 text-red-700"
          }`}
        >
          Não executada
        </span>
        <p className={`text-sm leading-5 ${titleText}`}>
          {value.replace("Não executada:", "").replace("Nao executada:", "").trim()}
        </p>
      </div>
    );
  }

  const parts = value
    .split(/•|â€¢|Ã¢â‚¬Â¢/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    const canExpandText = value.length > 72;

    return (
      <div className="max-w-[24rem] space-y-2">
        <p
          id={contextId}
          className={`text-sm leading-5 ${titleText}`}
          style={
            expanded || !canExpandText
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
          }
        >
          {value}
        </p>
        {allowToggle && canExpandText ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={contextId}
            className={`text-xs font-medium underline-offset-2 transition hover:underline ${
              isDark ? "text-sky-300" : "text-sky-700"
            }`}
          >
            {expanded ? "Ver menos" : "Ver mais"}
          </button>
        ) : null}
      </div>
    );
  }

  const [headline, ...tags] = parts;
  const visibleTags = expanded ? tags : tags.slice(0, 2);
  const hiddenTags = Math.max(tags.length - visibleTags.length, 0);
  const canExpandTags = tags.length > 2;

  return (
    <div className="max-w-[24rem] space-y-2">
      <p
        id={contextId}
        className={`text-sm font-medium leading-5 ${titleText}`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {headline}
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            {tag}
          </span>
        ))}
        {!expanded && hiddenTags > 0 ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isDark ? "bg-slate-900 text-slate-400" : "bg-slate-200 text-slate-600"
            }`}
          >
            +{hiddenTags}
          </span>
        ) : null}
      </div>
      {allowToggle && canExpandTags ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={contextId}
          className={`text-xs font-medium underline-offset-2 transition hover:underline ${
            isDark ? "text-sky-300" : "text-sky-700"
          }`}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
}

function QueueAgeBadge({ value, isDark }: { value: string; isDark: boolean }) {
  const numericDays = Number.parseInt(value.split("d")[0] ?? "0", 10);
  const tone =
    numericDays >= 3
      ? isDark
        ? "bg-red-950 text-red-300"
        : "bg-red-50 text-red-700"
      : numericDays >= 1
        ? isDark
          ? "bg-amber-950 text-amber-300"
          : "bg-amber-50 text-amber-700"
        : isDark
          ? "bg-emerald-950 text-emerald-300"
          : "bg-emerald-50 text-emerald-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}





