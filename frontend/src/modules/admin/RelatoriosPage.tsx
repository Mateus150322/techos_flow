import { useEffect, useId, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  CalendarRange,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
} from "lucide-react";

import { AdminShell } from "./AdminShell";
import { AdminMetricCard } from "./components/AdminMetricCard";
import {
  buscarRelatorioOrdens,
  exportarRelatorioOrdens,
  type RelatorioExportFormat,
  type RelatoriosResponse,
} from "./relatorios.service";
import {
  INITIAL_FILTERS,
  formatDate,
  formatStatus,
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
  const atividadeHintId = useId();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtros, setFiltros] = useState<FiltrosRelatorio>(INITIAL_FILTERS);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosRelatorio>(INITIAL_FILTERS);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatoriosResponse | null>(null);
  const [exportandoFormato, setExportandoFormato] = useState<RelatorioExportFormat | null>(null);

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
    setFiltrosAplicados({ ...filtros });
    setPaginaAtual(1);
  }

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

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  const resumo = dadosRelatorio?.resumo ?? {
    total: 0,
    abertas: 0,
    emExecucao: 0,
    finalizadas: 0,
    naoExecutadas: 0,
    canceladas: 0,
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

  return (
    <AdminShell currentUser={currentUser} activeTab="relatorios">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          value={resumo.total}
          label="Total de OS"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-blue-500"
          hint="Volume consolidado do relatório"
        />
        <AdminMetricCard
          value={resumo.abertas}
          label="OS abertas"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-blue-500"
          hint="Ordens ainda pendentes"
        />
        <AdminMetricCard
          value={resumo.emExecucao}
          label="Em execução"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-amber-500"
          hint="Ordens em andamento"
        />
        <AdminMetricCard
          value={resumo.finalizadas}
          label="Finalizadas"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Ordens concluídas"
        />
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading}>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Gerar Relatório</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Relatório geral, por status, produtividade, tipo de serviço e período.
            </p>
          </div>
        </div>

        <p id={filtrosHintId} className={`mb-4 text-sm ${mutedText}`}>
          Ajuste os filtros, gere o relatório e use os botões de exportação quando o resultado estiver carregado.
        </p>

        <div className="grid gap-4 lg:grid-cols-2" aria-describedby={filtrosHintId}>
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Tipo de Relatório</span>
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
              <option value="geral">Relatório geral de OS</option>
              <option value="status">Relatório por status</option>
              <option value="produtividade">Produtividade dos técnicos</option>
              <option value="tipo">Relatório por tipo de serviço</option>
              <option value="periodo">Relatório por período</option>
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Filtrar por Status</span>
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
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Filtrar por Tipo</span>
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
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Técnico responsável</span>
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
            Gerar Relatório
          </button>

          <button
            type="button"
            disabled={!dadosRelatorio || exportandoFormato !== null}
            onClick={() => void handleExportar("csv")}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
          >
            <Download className="h-4 w-4" />
            {getLabelExportacao("csv", "Exportar CSV")}
          </button>

          <button
            type="button"
            disabled={!dadosRelatorio || exportandoFormato !== null}
            onClick={() => void handleExportar("xlsx")}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {getLabelExportacao("xlsx", "Exportar Excel")}
          </button>

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

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading}>
        <div className="mb-5">
          <h3 className={`text-2xl font-semibold ${titleText}`}>{reportDefinition.title}</h3>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Data de emissão: {dadosRelatorio?.dataEmissao ?? "-"} | Período:{" "}
            {dadosRelatorio?.periodoDescricao ?? "-"}
          </p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Filtros aplicados: {dadosRelatorio?.filtrosDescricao ?? "-"}
          </p>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <ResumoCard label="Total de OS" value={resumo.total} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <ResumoCard label="Abertas" value={resumo.abertas} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <ResumoCard label="Em execução" value={resumo.emExecucao} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <ResumoCard label="Finalizadas" value={resumo.finalizadas} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <ResumoCard label="Não executadas" value={resumo.naoExecutadas} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <ResumoCard label="Canceladas" value={resumo.canceladas} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
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
                    <td colSpan={Math.max(reportDefinition.columns.length, 1)} className="p-6 text-center">
                      <span className={mutedText}>Carregando dados do relatório...</span>
                    </td>
                  </tr>
                ) : reportDefinition.rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(reportDefinition.columns.length, 1)} className="p-6 text-center">
                      <span className={mutedText}>
                        Nenhum dado encontrado para os filtros aplicados.
                      </span>
                    </td>
                  </tr>
                ) : (
                  reportDefinition.rows.map((row, index) => (
                    <tr
                      key={`${index}-${row[reportDefinition.columns[0]?.key] ?? "linha"}`}
                      className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                    >
                      {reportDefinition.columns.map((column, columnIndex) =>
                        columnIndex === 0 ? (
                          <th key={column.key} scope="row" className="p-4 text-left font-medium">
                            {row[column.key] ?? "-"}
                          </th>
                        ) : (
                          <td key={column.key} className="p-4">
                            {row[column.key] ?? "-"}
                          </td>
                        )
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

      <section
        className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}
        aria-describedby={atividadeHintId}
        aria-busy={loading}
      >
        <div className="mb-5">
          <h3 className={`text-2xl font-semibold ${titleText}`}>Atividade recente</h3>
          <p id={atividadeHintId} className={`mt-1 text-sm ${mutedText}`}>
            Últimas ordens de serviço atualizadas conforme os filtros aplicados.
          </p>
        </div>

        {loading ? (
          <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
            Carregando atividade recente...
          </div>
        ) : (dadosRelatorio?.atividadeRecente ?? []).length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {(dadosRelatorio?.atividadeRecente ?? []).map((ordem) => (
              <div
                key={ordem.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${softCard}`}
              >
                <div>
                  <p className={`text-lg font-semibold ${titleText}`}>{ordem.numero}</p>
                  <p className={`text-sm ${mutedText}`}>{ordem.nome_cliente || ordem.tipo}</p>
                </div>
                <div className="flex flex-col items-start gap-2 text-left md:items-end md:text-right">
                  <p className={`text-sm font-medium capitalize ${titleText}`}>
                    {formatStatus(ordem.status)}
                  </p>
                  <p className={`text-sm ${mutedText}`}>{formatDate(ordem.data_abertura)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
