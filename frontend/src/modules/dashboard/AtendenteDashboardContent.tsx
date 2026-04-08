import { useDeferredValue, useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  PlayCircle,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import FormularioOSGeral from "@/modules/ordensServico/components/FormularioOSGeral";
import { PainelOperacionalHeader } from "@/modules/ordensServico/components/PainelOperacionalHeader";
import { ResumoMetricaCard } from "@/modules/ordensServico/components/ResumoMetricaCard";
import { TabelaOrdensSection } from "@/modules/ordensServico/components/TabelaOrdensSection";
import { getTecnicoResponsavel, type OrdemServico } from "@/modules/ordensServico/ordensServico.service";
import { type CurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { buscarDashboardAtendente, type AtendenteDashboardResponse } from "./dashboard.service";

type AtendenteDashboardContentProps = {
  currentUser: CurrentUser;
};

type AbaPrincipal = "criar" | "consultar";

export function AtendenteDashboardContent({
  currentUser,
}: AtendenteDashboardContentProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [busca, setBusca] = useState("");
  const buscaAplicada = useDeferredValue(busca);
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
        setErro(getApiErrorMessage(error, "Nao foi possivel carregar as ordens de servico."));
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

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const headerBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const cardAccent = isDark ? "bg-slate-950/60" : "bg-slate-50";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const buttonInactive = isDark
    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
    : "bg-slate-100 text-slate-700 hover:bg-slate-200";
  const buttonActive = isDark
    ? "bg-slate-100 text-slate-900"
    : "bg-white text-slate-900 border shadow-sm";
  const tableHead = isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600";
  const rowHover = isDark ? "hover:bg-slate-800/70" : "hover:bg-slate-50";
  const tableBorder = isDark ? "border-slate-800" : "border-slate-200";
  const inputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-11 outline-none transition focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
    : "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pl-11 outline-none transition focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <PainelOperacionalHeader
        headerBg={headerBg}
        titleText={titleText}
        mutedText={mutedText}
        buttonSecondary={buttonSecondary}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        userName={currentUser.name}
        roleLabel="Atendente"
        subtitle="Painel operacional do atendente"
        icon={<ClipboardList className="h-6 w-6" />}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAbaPrincipal("criar")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              abaPrincipal === "criar" ? buttonActive : buttonInactive
            }`}
          >
            <FilePlus2 className="h-4 w-4" />
            Criar OS
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal("consultar")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              abaPrincipal === "consultar" ? buttonActive : buttonInactive
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Consultar OS
          </button>
        </div>

        {abaPrincipal === "criar" && (
          <FormularioOSGeral
            titulo="Nova OS geral"
            descricao="Abra uma nova ordem de servico com cliente, prioridade, descricao e endereco."
            onCriada={(ordemCriada) => navigate(`/ordens-servico/${ordemCriada.id}`)}
          />
        )}

        {abaPrincipal === "consultar" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumoMetricaCard
                titulo="Total de OS"
                valor={resumo?.total ?? 0}
                icone={<ClipboardList className="h-5 w-5 text-blue-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Abertas"
                valor={resumo?.abertas ?? 0}
                icone={<FilePlus2 className="h-5 w-5 text-sky-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Em execucao"
                valor={resumo?.em_execucao ?? 0}
                icone={<PlayCircle className="h-5 w-5 text-amber-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Encerradas"
                valor={resumo?.encerradas ?? 0}
                icone={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${titleText}`}>Ordens de Servico</h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Consulte o andamento das ordens abertas pelo atendimento e pela operacao.
                  </p>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="relative">
                    <Search className={`pointer-events-none absolute left-4 top-3.5 h-4 w-4 ${mutedText}`} />
                    <input
                      type="text"
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Buscar por numero, cliente, tipo, status ou responsavel..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {erro ? (
                <div
                  className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-red-900 bg-red-950 text-red-300"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {erro}
                </div>
              ) : null}

              <TabelaOrdensSection
                titulo="Abertas"
                descricao="Ordens aguardando aceite ou inicio da execucao."
                ordens={ordensAbertas}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => navigate(`/ordens-servico/${id}`)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <TabelaOrdensSection
                titulo="Em execucao"
                descricao="Ordens atualmente em andamento com a equipe tecnica."
                ordens={ordensEmExecucao}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => navigate(`/ordens-servico/${id}`)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <TabelaOrdensSection
                titulo="Encerradas"
                descricao="Ordens concluidas, nao executadas ou canceladas."
                ordens={ordensEncerradas}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => navigate(`/ordens-servico/${id}`)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              {!loading && (
                <div className={`mt-4 text-sm ${mutedText}`}>
                  Exibindo ate {ordensAbertas.length + ordensEmExecucao.length + ordensEncerradas.length} ordens no painel consultado.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
