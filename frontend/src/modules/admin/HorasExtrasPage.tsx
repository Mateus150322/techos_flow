import { useEffect, useId, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useRef } from "react";
import {
  CalendarRange,
  CheckCircle2,
  FileDown,
  LockKeyhole,
  RotateCcw,
  TimerReset,
  Users,
  XCircle,
} from "lucide-react";

import { AdminShell } from "./AdminShell";
import { AdminMetricCard } from "./components/AdminMetricCard";
import { SpreadsheetExportMenu } from "./components/SpreadsheetExportMenu";
import {
  atualizarAprovacaoHorasExtras,
  buscarRelatorioHorasExtras,
  exportarRelatorioHorasExtras,
  fecharCompetenciaHorasExtras,
  reabrirCompetenciaHorasExtras,
  type HoraExtraExportFormat,
  type HorasExtrasResponse,
} from "./horasExtras.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";

const ROWS_PER_PAGE = 20;

export default function HorasExtrasPage() {
  const currentUser = useCurrentUser();
  const { isDark } = useTheme();
  const anoAtual = new Date().getFullYear();
  const filtrosHintId = useId();
  const tabelaCaptionId = useId();
  const destaqueHintId = useId();
  const feedbackRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<HorasExtrasResponse | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [exportandoFormato, setExportandoFormato] = useState<HoraExtraExportFormat | null>(null);
  const [processandoApuracao, setProcessandoApuracao] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState("");
  const [filtros, setFiltros] = useState({
    funcionarioId: "todos",
    dataInicio: "",
    dataFim: "",
    mes: "",
    ano: String(anoAtual),
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    funcionarioId: "todos",
    dataInicio: "",
    dataFim: "",
    mes: "",
    ano: String(anoAtual),
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErro("");
        setSucesso("");

        const response = await buscarRelatorioHorasExtras({
          funcionarioId:
            filtrosAplicados.funcionarioId !== "todos" ? filtrosAplicados.funcionarioId : undefined,
          dataInicio: filtrosAplicados.mes ? undefined : filtrosAplicados.dataInicio || undefined,
          dataFim: filtrosAplicados.mes ? undefined : filtrosAplicados.dataFim || undefined,
          mes: filtrosAplicados.mes || undefined,
          ano: filtrosAplicados.mes ? filtrosAplicados.ano : undefined,
          page: paginaAtual,
          perPage: ROWS_PER_PAGE,
        });

        setDados(response);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Não foi possível carregar o relatório de horas extras."));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [filtrosAplicados, paginaAtual]);

  useEffect(() => {
    if (!erro && !sucesso) {
      return;
    }

    window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      feedbackRef.current?.focus({ preventScroll: true });
    });
  }, [erro, sucesso]);

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

  const anosDisponiveis = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => String(anoAtual - 3 + index)).sort((a, b) =>
        a > b ? -1 : 1
      ),
    [anoAtual]
  );

  function aplicarFiltros() {
    setPaginaAtual(1);
    setFiltrosAplicados({ ...filtros });
  }

  function filtrosConsulta() {
    return {
      funcionarioId:
        filtrosAplicados.funcionarioId !== "todos" ? filtrosAplicados.funcionarioId : undefined,
      dataInicio: filtrosAplicados.mes ? undefined : filtrosAplicados.dataInicio || undefined,
      dataFim: filtrosAplicados.mes ? undefined : filtrosAplicados.dataFim || undefined,
      mes: filtrosAplicados.mes || undefined,
      ano: filtrosAplicados.mes ? filtrosAplicados.ano : undefined,
    };
  }

  async function handleExportar(formato: HoraExtraExportFormat) {
    try {
      setErro("");
      setExportandoFormato(formato);

      const { blob, fileName } = await exportarRelatorioHorasExtras(formato, filtrosConsulta());

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível exportar o relatório de horas extras."));
    } finally {
      setExportandoFormato(null);
    }
  }

  async function recarregarRelatorio() {
    const response = await buscarRelatorioHorasExtras({
      ...filtrosConsulta(),
      page: paginaAtual,
      perPage: ROWS_PER_PAGE,
    });

    setDados(response);
  }

  async function handleAprovacao(status: "pendente" | "aprovada" | "reprovada") {
    try {
      setErro("");
      setSucesso("");
      setProcessandoApuracao(status);

      const response = await atualizarAprovacaoHorasExtras(status, filtrosConsulta());

      setSucesso(`${response.registros_atualizados} lançamento(s) atualizados.`);
      await recarregarRelatorio();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível atualizar a aprovação das horas extras."));
    } finally {
      setProcessandoApuracao(null);
    }
  }

  async function handleFecharCompetencia() {
    if (!filtrosAplicados.mes) {
      setErro("Selecione mês e ano para fechar a competência.");
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setProcessandoApuracao("fechar");

      await fecharCompetenciaHorasExtras({
        mes: filtrosAplicados.mes,
        ano: filtrosAplicados.ano,
      });

      setSucesso("Competência fechada com sucesso.");
      await recarregarRelatorio();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível fechar a competência."));
    } finally {
      setProcessandoApuracao(null);
    }
  }

  async function handleReabrirCompetencia() {
    const fechamentoId = dados?.fechamento?.id;

    if (!fechamentoId) {
      return;
    }

    try {
      setErro("");
      setSucesso("");
      setProcessandoApuracao("reabrir");

      await reabrirCompetenciaHorasExtras(fechamentoId);
      setSucesso("Competência reaberta para ajustes.");
      await recarregarRelatorio();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível reabrir a competência."));
    } finally {
      setProcessandoApuracao(null);
    }
  }

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  const resumo = dados?.resumo ?? {
    total_funcionarios: 0,
    total_horas_extras_50_minutos: 0,
    total_horas_extras_50: "0h00",
    total_horas_extras_100_minutos: 0,
    total_horas_extras_100: "0h00",
    total_extras_minutos: 0,
    total_extras: "0h00",
    total_horas_pagas_minutos: 0,
    total_horas_pagas: "0h00",
    total_horas_convertidas_folga_minutos: 0,
    total_horas_convertidas_folga: "0h00",
    total_dias_folga_gerados: 0,
    saldo_total_banco_minutos: 0,
    saldo_total_banco: "0h00",
    total_estimado_financeiro: 0,
    total_minutos_feriados: 0,
    total_feriados: "0h00",
    total_minutos_pontos_facultativos: 0,
    total_pontos_facultativos: "0h00",
    total_minutos_fins_semana: 0,
    total_fins_semana: "0h00",
    total_minutos_plantao: 0,
    total_plantao: "0h00",
  };
  const competenciaMensalSelecionada = Boolean(filtrosAplicados.mes);
  const competenciaFechada = dados?.fechamento?.status === "fechada";
  const aprovacao = dados?.aprovacao ?? {
    pendentes: 0,
    aprovadas: 0,
    reprovadas: 0,
    status_geral: "sem_lancamentos" as const,
  };
  const apuracaoMensagem = competenciaFechada
    ? "Mês fechado. Reabra somente se precisar corrigir algum lançamento."
    : !competenciaMensalSelecionada
      ? "Selecione um mês no filtro para liberar o fechamento."
      : aprovacao.pendentes > 0
        ? "Existem lançamentos pendentes. Aprove ou reprove antes de fechar o mês."
        : "Sem pendências. A competência já pode ser fechada.";
  const filtroAtualDescricao = competenciaMensalSelecionada
    ? `${filtrosAplicados.mes.padStart(2, "0")}/${filtrosAplicados.ano}`
    : "período livre";

  return (
    <AdminShell currentUser={currentUser} activeTab="horas_extras">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          value={resumo.total_extras}
          label="Horas extras do período"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-blue-500"
          hint="Soma de 50% e 100%"
        />
        <AdminMetricCard
          value={resumo.saldo_total_banco}
          label="Saldo total banco"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-amber-500"
          hint="Horas remanescentes para folga"
        />
        <AdminMetricCard
          value={resumo.total_dias_folga_gerados}
          label="Dias de folga"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Dias gerados a partir do excedente"
        />
        <AdminMetricCard
          value={`R$ ${resumo.total_estimado_financeiro.toFixed(2).replace(".", ",")}`}
          label="Estimativa financeira"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-violet-500"
          hint="Valor estimado das horas pagas"
        />
      </section>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading}>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
            <TimerReset className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Relatório de Horas Extras</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Acompanhe horas extras 50%, 100%, banco de folgas e estimativa financeira por funcionário.
            </p>
          </div>
        </div>

        <p id={filtrosHintId} className={`mb-4 text-sm ${mutedText}`}>
          Filtre por funcionário, período ou mês e use os botões de exportação quando o resultado estiver carregado.
        </p>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5" aria-describedby={filtrosHintId}>
          <label className="block xl:col-span-2">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Funcionário</span>
            <select
              value={filtros.funcionarioId}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, funcionarioId: event.target.value }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os funcionários</option>
              {(dados?.funcionarios ?? []).map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.name} ({funcionario.funcao})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Mês</span>
            <select
              value={filtros.mes}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, mes: event.target.value, dataInicio: "", dataFim: "" }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="">Período livre</option>
              {[
                ["01", "Janeiro"],
                ["02", "Fevereiro"],
                ["03", "Março"],
                ["04", "Abril"],
                ["05", "Maio"],
                ["06", "Junho"],
                ["07", "Julho"],
                ["08", "Agosto"],
                ["09", "Setembro"],
                ["10", "Outubro"],
                ["11", "Novembro"],
                ["12", "Dezembro"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Ano</span>
            <select
              value={filtros.ano}
              onChange={(event) => setFiltros((prev) => ({ ...prev, ano: event.target.value }))}
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={aplicarFiltros}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton}`}
            >
              <CalendarRange className="h-4 w-4" />
              Aplicar filtros
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Data inicial</span>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, dataInicio: event.target.value, mes: "" }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${titleText}`}>Data final</span>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(event) =>
                setFiltros((prev) => ({ ...prev, dataFim: event.target.value, mes: "" }))
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SpreadsheetExportMenu
            disabled={!dados || exportandoFormato !== null}
            exportandoFormato={exportandoFormato}
            isDark={isDark}
            onSelect={(format) => void handleExportar(format)}
          />

          <button
            type="button"
            disabled={!dados || exportandoFormato !== null}
            onClick={() => void handleExportar("pdf")}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
          >
            <FileDown className="h-4 w-4" />
            {exportandoFormato === "pdf" ? "Exportando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </section>

      <section className={`mb-6 rounded-3xl border p-4 shadow-sm sm:p-6 ${cardBg}`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className={`text-xl font-semibold ${titleText}`}>Apuração mensal</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              As ações abaixo consideram o filtro atual: {filtroAtualDescricao}.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              competenciaFechada
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
            }`}
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            {competenciaFechada ? "Competência fechada" : "Competência aberta"}
          </span>
        </div>

        <div
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
            competenciaFechada
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
          }`}
        >
          <span className="font-semibold">Próxima ação: </span>
          {apuracaoMensagem}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoBox
            label="Pendentes"
            value={String(aprovacao.pendentes)}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          <InfoBox
            label="Aprovadas"
            value={String(aprovacao.aprovadas)}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
          <InfoBox
            label="Reprovadas"
            value={String(aprovacao.reprovadas)}
            cardBg={softCard}
            titleText={titleText}
            mutedText={mutedText}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={!dados || competenciaFechada || processandoApuracao !== null}
            onClick={() => void handleAprovacao("aprovada")}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${secondaryButton}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {processandoApuracao === "aprovada" ? "Aprovando..." : "Aprovar lançamentos do filtro"}
          </button>

          <button
            type="button"
            disabled={!dados || competenciaFechada || processandoApuracao !== null}
            onClick={() => void handleAprovacao("reprovada")}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${secondaryButton}`}
          >
            <XCircle className="h-4 w-4" />
            {processandoApuracao === "reprovada" ? "Reprovando..." : "Reprovar lançamentos do filtro"}
          </button>

          {competenciaFechada ? (
            <button
              type="button"
              disabled={processandoApuracao !== null}
              onClick={() => void handleReabrirCompetencia()}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${secondaryButton}`}
            >
              <RotateCcw className="h-4 w-4" />
              {processandoApuracao === "reabrir" ? "Reabrindo..." : "Reabrir mês para ajuste"}
            </button>
          ) : (
            <button
              type="button"
              disabled={
                !dados ||
                !competenciaMensalSelecionada ||
                aprovacao.pendentes > 0 ||
                processandoApuracao !== null
              }
              onClick={() => void handleFecharCompetencia()}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButton}`}
            >
              <LockKeyhole className="h-4 w-4" />
              {processandoApuracao === "fechar" ? "Fechando..." : "Fechar mês"}
            </button>
          )}
        </div>

        {!competenciaMensalSelecionada ? (
          <p className={`mt-4 text-sm ${mutedText}`}>
            Selecione um mês para liberar o fechamento mensal da competência.
          </p>
        ) : null}
      </section>

      <div ref={feedbackRef} tabIndex={-1} className="outline-none">
        {sucesso ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="status"
          >
            {sucesso}
          </div>
        ) : null}

        {erro ? (
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
        ) : null}
      </div>

      <section className={`mb-6 rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className={`text-2xl font-semibold ${titleText}`}>Consolidado por funcionário</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Período: {dados?.periodo_descricao || "-"} | Emissão: {dados?.data_emissao || "-"}
            </p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-sm ${softCard}`} aria-describedby={destaqueHintId}>
            <p className={`font-medium ${titleText}`}>Funcionários com mais horas extras</p>
            <p id={destaqueHintId} className="sr-only">
              Lista resumida dos funcionários com maior volume de horas extras no período filtrado.
            </p>
            {(dados?.indicadores.top_funcionarios ?? []).length === 0 ? (
              <p className={`mt-2 ${mutedText}`}>Sem destaques no período.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(dados?.indicadores.top_funcionarios ?? []).map((item) => (
                  <li key={item.funcionario_id} className={`flex flex-wrap items-center justify-between gap-2 ${mutedText}`}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{item.funcionario_nome}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${papelBadge(
                          inferirRolePorFuncao(item.funcao)
                        )}`}
                      >
                        {papelLabel(inferirRolePorFuncao(item.funcao))}
                      </span>
                      {item.funcao !== papelLabel(inferirRolePorFuncao(item.funcao)) ? (
                        <span className="text-xs opacity-80">{item.funcao}</span>
                      ) : null}
                    </span>
                    <span className={titleText}>{item.total_extras}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4 xl:hidden">
          {loading ? (
            <div className={`rounded-3xl border p-6 text-center text-sm ${softCard} ${mutedText}`}>
              Carregando relatório...
            </div>
          ) : (dados?.rows ?? []).length === 0 ? (
            <div className={`rounded-3xl border p-6 text-center text-sm ${softCard} ${mutedText}`}>
              Nenhum lançamento encontrado para os filtros aplicados.
            </div>
          ) : (
            (dados?.rows ?? []).map((row) => (
              <HoraExtraMobileCard
                key={row.funcionario_id}
                row={row}
                isDark={isDark}
                titleText={titleText}
                mutedText={mutedText}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 xl:block">
            <table className="w-full table-fixed text-sm">
              <caption id={tabelaCaptionId} className="sr-only">
                Consolidado por funcionário com horas extras de 50%, 100%, horas pagas, folga, saldo em banco e estimativa financeira.
              </caption>
              <thead className={tableHead}>
                <tr>
                  <th scope="col" className="p-4 text-left font-semibold">Funcionário</th>
                  <th scope="col" className="p-4 text-left font-semibold">Horas 50%</th>
                  <th scope="col" className="p-4 text-left font-semibold">Horas 100%</th>
                  <th scope="col" className="p-4 text-left font-semibold">Total extras</th>
                  <th scope="col" className="p-4 text-left font-semibold">Calendário</th>
                  <th scope="col" className="p-4 text-left font-semibold">Plantão</th>
                  <th scope="col" className="p-4 text-left font-semibold">Horas pagas</th>
                  <th scope="col" className="p-4 text-left font-semibold">Folga</th>
                  <th scope="col" className="p-4 text-left font-semibold">Dias de folga</th>
                  <th scope="col" className="p-4 text-left font-semibold">Saldo banco</th>
                  <th scope="col" className="p-4 text-left font-semibold">Estimativa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center">
                      <span className={mutedText}>Carregando relatório...</span>
                    </td>
                  </tr>
                ) : (dados?.rows ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-center">
                      <span className={mutedText}>Nenhum lançamento encontrado para os filtros aplicados.</span>
                    </td>
                  </tr>
                ) : (
                  (dados?.rows ?? []).map((row) => (
                    <tr
                      key={row.funcionario_id}
                      className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                    >
                      <th scope="row" className="p-4 text-left font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{row.funcionario_nome}</span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${papelBadge(
                                row.role
                              )}`}
                            >
                              {papelLabel(row.role)}
                            </span>
                            {row.tipo_vinculo === "colaborador_operacional" ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isDark
                                    ? "bg-slate-800 text-slate-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                Sem login
                              </span>
                            ) : null}
                          </div>
                          {row.funcao !== papelLabel(row.role) ? (
                            <span className={`text-xs font-normal ${mutedText}`}>
                              {row.funcao}
                            </span>
                          ) : null}
                        </div>
                      </th>
                      <td className="p-4">{row.horas_extras_50}</td>
                      <td className="p-4">{row.horas_extras_100}</td>
                      <td className="p-4">{row.total_extras}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span>Feriados: {row.horas_feriados}</span>
                          <span>Pontos: {row.horas_pontos_facultativos}</span>
                          <span>Fim semana: {row.horas_fins_semana}</span>
                        </div>
                      </td>
                      <td className="p-4">{row.horas_plantao}</td>
                      <td className="p-4">{row.horas_pagas}</td>
                      <td className="p-4">{row.horas_convertidas_folga}</td>
                      <td className="p-4">{row.dias_folga_gerados}</td>
                      <td className="p-4">{row.saldo_banco}</td>
                      <td className="p-4">{`R$ ${row.valor_estimado_financeiro.toFixed(2).replace(".", ",")}`}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

        {(dados?.pagination?.last_page ?? 1) > 1 ? (
          <div
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginação do relatório de horas extras"
          >
            <p className={`text-sm ${mutedText}`}>
              Página {dados?.pagination?.page ?? 1} de {dados?.pagination?.last_page ?? 1}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading || (dados?.pagination?.page ?? 1) <= 1}
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${secondaryButton}`}
              >
                Página anterior
              </button>
              <button
                type="button"
                disabled={loading || (dados?.pagination?.page ?? 1) >= (dados?.pagination?.last_page ?? 1)}
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, dados?.pagination?.last_page ?? prev))
                }
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${secondaryButton}`}
              >
                Próxima página
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${titleText}`}>Leitura administrativa</h3>
            <p className={`mt-1 text-sm ${mutedText}`}>
              As primeiras 48 horas extras do mês entram no cálculo financeiro. O excedente vai para o banco de folgas.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoBox label="Horas 50%" value={resumo.total_horas_extras_50} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Horas 100%" value={resumo.total_horas_extras_100} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Feriados" value={resumo.total_feriados} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Pontos facultativos" value={resumo.total_pontos_facultativos} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Fins de semana" value={resumo.total_fins_semana} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Horas em escala" value={resumo.total_plantao} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Horas pagas" value={resumo.total_horas_pagas} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
          <InfoBox label="Horas em folga" value={resumo.total_horas_convertidas_folga} cardBg={softCard} titleText={titleText} mutedText={mutedText} />
        </div>
      </section>
    </AdminShell>
  );
}

function InfoBox({
  label,
  value,
  cardBg,
  titleText,
  mutedText,
}: {
  label: string;
  value: string;
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

function papelBadge(role: "administrador" | "tecnico" | "auxiliar_tecnico") {
  if (role === "administrador") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200";
  }

  if (role === "auxiliar_tecnico") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200";
  }

  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200";
}

function papelLabel(role: "administrador" | "tecnico" | "auxiliar_tecnico") {
  if (role === "administrador") {
    return "Administrador";
  }

  if (role === "auxiliar_tecnico") {
    return "Auxiliar técnico";
  }

  return "Técnico";
}

function inferirRolePorFuncao(
  funcao: string
): "administrador" | "tecnico" | "auxiliar_tecnico" {
  const texto = funcao.trim().toLowerCase();

  if (texto.includes("auxiliar")) {
    return "auxiliar_tecnico";
  }

  if (texto.includes("admin")) {
    return "administrador";
  }

  return "tecnico";
}

function HoraExtraMobileCard({
  row,
  isDark,
  titleText,
  mutedText,
}: {
  row: HorasExtrasResponse["rows"][number];
  isDark: boolean;
  titleText: string;
  mutedText: string;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-base font-semibold ${titleText}`}>{row.funcionario_nome}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${papelBadge(row.role)}`}>
              {papelLabel(row.role)}
            </span>
            {row.tipo_vinculo === "colaborador_operacional" ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                }`}
              >
                Sem login
              </span>
            ) : null}
          </div>
          {row.funcao !== papelLabel(row.role) ? (
            <p className={`mt-2 text-sm ${mutedText}`}>{row.funcao}</p>
          ) : null}
        </div>
        <p className={`text-lg font-semibold ${titleText}`}>{row.total_extras}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileValue label="Horas 50%" value={row.horas_extras_50} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Horas 100%" value={row.horas_extras_100} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Feriados" value={row.horas_feriados} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Pontos facultativos" value={row.horas_pontos_facultativos} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Fins de semana" value={row.horas_fins_semana} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Em escala" value={row.horas_plantao} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Horas pagas" value={row.horas_pagas} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Folga" value={row.horas_convertidas_folga} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Dias de folga" value={String(row.dias_folga_gerados)} titleText={titleText} mutedText={mutedText} />
        <MobileValue label="Saldo banco" value={row.saldo_banco} titleText={titleText} mutedText={mutedText} />
        <MobileValue
          label="Estimativa"
          value={`R$ ${row.valor_estimado_financeiro.toFixed(2).replace(".", ",")}`}
          titleText={titleText}
          mutedText={mutedText}
        />
      </dl>
    </article>
  );
}

function MobileValue({
  label,
  value,
  titleText,
  mutedText,
}: {
  label: string;
  value: string;
  titleText: string;
  mutedText: string;
}) {
  return (
    <div>
      <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>{label}</dt>
      <dd className={`mt-1 text-sm ${titleText}`}>{value}</dd>
    </div>
  );
}



