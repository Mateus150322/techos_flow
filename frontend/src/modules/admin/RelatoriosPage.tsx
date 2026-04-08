import { useEffect, useMemo, useState } from "react";
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
import { exportarCsv, exportarExcel, exportarPdf } from "./relatorios.export";
import {
  INITIAL_FILTERS,
  buildFiltrosDescricao,
  buildPeriodoDescricao,
  buildReportDefinition,
  calcularAtividadeRecente,
  calcularProdutividadeTecnicos,
  calcularResumo,
  calcularStatusResumo,
  calcularTiposMaisFrequentes,
  filtrarOrdens,
  formatDate,
  formatStatus,
  getTecnicosFromOrdens,
  getTiposFromOrdens,
  type FiltrosRelatorio,
  type TipoRelatorio,
} from "./relatorios.utils";
import {
  listarTodasOrdens,
  type OrdemServico,
  type OrdemStatus,
} from "@/modules/ordensServico/ordensServico.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

export default function RelatoriosPage() {
  const { isDark } = useTheme();
  const currentUser = useCurrentUser();

  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosRelatorio>(INITIAL_FILTERS);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosRelatorio>(INITIAL_FILTERS);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const response = await listarTodasOrdens({ include: "tecnicoResponsavel" });
        setOrders(response.data ?? []);
      } catch (error) {
        console.error("Erro ao carregar relatorios:", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const tipos = useMemo(() => getTiposFromOrdens(orders), [orders]);
  const tecnicos = useMemo(() => getTecnicosFromOrdens(orders), [orders]);
  const ordensFiltradas = useMemo(
    () => filtrarOrdens(orders, filtrosAplicados),
    [orders, filtrosAplicados]
  );
  const resumo = useMemo(() => calcularResumo(ordensFiltradas), [ordensFiltradas]);
  const produtividadeTecnicos = useMemo(
    () => calcularProdutividadeTecnicos(ordensFiltradas),
    [ordensFiltradas]
  );
  const tiposMaisFrequentes = useMemo(
    () => calcularTiposMaisFrequentes(ordensFiltradas, resumo.total),
    [ordensFiltradas, resumo.total]
  );
  const statusResumo = useMemo(() => calcularStatusResumo(resumo), [resumo]);
  const atividadeRecente = useMemo(
    () => calcularAtividadeRecente(ordensFiltradas),
    [ordensFiltradas]
  );
  const reportDefinition = useMemo(
    () =>
      buildReportDefinition({
        filtrosAplicados,
        ordensFiltradas,
        produtividadeTecnicos,
        statusResumo,
        tiposMaisFrequentes,
      }),
    [
      filtrosAplicados,
      ordensFiltradas,
      produtividadeTecnicos,
      statusResumo,
      tiposMaisFrequentes,
    ]
  );

  const filtrosDescricao = buildFiltrosDescricao(filtrosAplicados, tecnicos);
  const periodoDescricao = buildPeriodoDescricao(
    filtrosAplicados.dataInicio,
    filtrosAplicados.dataFim
  );
  const dataEmissao = new Date().toLocaleDateString("pt-BR");

  const cardBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const softCard = isDark ? "bg-zinc-950/70 border-zinc-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-zinc-50" : "text-slate-900";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const inputBg = isDark
    ? "border-zinc-700 bg-zinc-950 text-zinc-100"
    : "border-slate-200 bg-slate-50 text-slate-900";
  const primaryButton = isDark
    ? "bg-zinc-100 text-zinc-950 hover:bg-white"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const secondaryButton = isDark
    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const tableHead = isDark ? "bg-zinc-950 text-zinc-300" : "bg-slate-100 text-slate-600";
  const rowHover = isDark ? "hover:bg-zinc-950/80" : "hover:bg-slate-50";

  function aplicarFiltros() {
    setFiltrosAplicados(filtros);
  }

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminShell currentUser={currentUser} activeTab="relatorios">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TopMetric
          value={resumo.total}
          label="Total de OS"
          accent="text-blue-500"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <TopMetric
          value={resumo.abertas}
          label="OS abertas"
          accent="text-blue-500"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <TopMetric
          value={resumo.emExecucao}
          label="Em execucao"
          accent="text-amber-500"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
        <TopMetric
          value={resumo.finalizadas}
          label="Finalizadas"
          accent="text-emerald-500"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
        />
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-zinc-100 dark:text-zinc-950">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Gerar Relatorio</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Relatorio geral, por status, produtividade, tipo de servico e periodo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Tipo de Relatorio</span>
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
              <option value="geral">Relatorio geral de OS</option>
              <option value="status">Relatorio por status</option>
              <option value="produtividade">Produtividade dos tecnicos</option>
              <option value="tipo">Relatorio por tipo de servico</option>
              <option value="periodo">Relatorio por periodo</option>
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
              <option value="em_execucao">Em execucao</option>
              <option value="finalizada">Finalizada</option>
              <option value="nao_executada">Nao executada</option>
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
              {tipos.map((tipo) => (
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
              <option value="2">Media</option>
              <option value="3">Baixa</option>
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Tecnico Responsavel</span>
            <select
              value={filtros.tecnicoId}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, tecnicoId: event.target.value }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os tecnicos</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Periodo</span>
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

        <div className="mt-6 flex flex-col gap-3 xl:flex-row">
          <button
            type="button"
            onClick={aplicarFiltros}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton}`}
          >
            <Filter className="h-4 w-4" />
            Gerar Relatorio
          </button>

          <button
            type="button"
            onClick={() => exportarCsv(reportDefinition)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() =>
              exportarExcel({
                reportDefinition,
                resumo,
                dataEmissao,
                periodoDescricao,
                filtrosDescricao,
              })
            }
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={() =>
              exportarPdf({
                reportDefinition,
                resumo,
                dataEmissao,
                periodoDescricao,
                filtrosDescricao,
                responsavelEmissao: currentUser.name,
              })
            }
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5">
          <h3 className={`text-2xl font-semibold ${titleText}`}>{reportDefinition.title}</h3>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Data de emissao: {dataEmissao} | Periodo: {periodoDescricao}
          </p>
          <p className={`mt-1 text-sm ${mutedText}`}>Filtros aplicados: {filtrosDescricao}</p>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
            label="Em execucao"
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
          <ResumoCard
            label="Nao executadas"
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
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className={tableHead}>
                <tr>
                  {reportDefinition.columns.map((column) => (
                    <th key={column.key} className="p-4 text-left font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportDefinition.rows.length === 0 ? (
                  <tr>
                    <td colSpan={reportDefinition.columns.length} className="p-6 text-center">
                      <span className={mutedText}>
                        Nenhum dado encontrado para os filtros aplicados.
                      </span>
                    </td>
                  </tr>
                ) : (
                  reportDefinition.rows.map((row, index) => (
                    <tr
                      key={`${index}-${row[reportDefinition.columns[0].key] ?? "linha"}`}
                      className={`border-t border-slate-200 transition dark:border-zinc-800 ${rowHover}`}
                    >
                      {reportDefinition.columns.map((column) => (
                        <td key={column.key} className="p-4">
                          {row[column.key] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`mt-4 text-sm ${mutedText}`}>
          Total de registros: {reportDefinition.rows.length} | Responsavel pela emissao:{" "}
          {currentUser.name}
        </div>
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5">
          <h3 className={`text-2xl font-semibold ${titleText}`}>Atividade Recente</h3>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Ultimas ordens de servico atualizadas conforme os filtros aplicados.
          </p>
        </div>

        {loading ? (
          <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
            Carregando atividade recente...
          </div>
        ) : atividadeRecente.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-6 text-sm ${mutedText}`}>
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {atividadeRecente.map((ordem) => (
              <div
                key={ordem.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${softCard}`}
              >
                <div>
                  <p className={`text-lg font-semibold ${titleText}`}>{ordem.numero}</p>
                  <p className={`text-sm ${mutedText}`}>{ordem.nome_cliente || ordem.tipo}</p>
                </div>
                <div className="text-right">
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

function TopMetric({
  value,
  label,
  accent,
  cardBg,
  titleText,
  mutedText,
}: {
  value: number;
  label: string;
  accent: string;
  cardBg: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${cardBg}`}>
      <p className={`text-4xl font-semibold ${accent}`}>{value}</p>
      <p className={`mt-1 text-sm ${mutedText}`}>{label}</p>
      <div className="mt-4 h-px w-full bg-slate-100 dark:bg-zinc-800" />
      <p className={`mt-3 text-sm ${titleText}`}>Painel consolidado</p>
    </div>
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
