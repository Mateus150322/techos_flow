import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  PackageOpen,
  PlusCircle,
  Search,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  getTecnicoResponsavel,
  listarTodasOrdens,
  type OrdemServico,
} from "./ordensServico.service";
import FormularioETAETETecnico from "./components/FormularioETAETETecnico";
import { PainelOperacionalHeader } from "./components/PainelOperacionalHeader";
import { ResumoMetricaCard } from "./components/ResumoMetricaCard";
import { TabelaOrdensSection } from "./components/TabelaOrdensSection";
import TecnicoOSDetailsModal from "./components/TecnicoOSDetailsModal";

type AbaPrincipal = "criar" | "consultar";

export default function TecnicoPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);

  const currentUser = useCurrentUser("tecnico");

  async function carregarOrdens() {
    try {
      setLoading(true);
      setErro("");

      const response = await listarTodasOrdens({
        include: "tecnicoResponsavel",
      });

      setOrdens(response.data ?? []);
    } catch {
      setErro("Não foi possível carregar as ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregarOrdens();
  }, []);

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  function getResponsavelId(os: OrdemServico) {
    return os.tecnico_responsavel_id ?? getTecnicoResponsavel(os)?.id ?? null;
  }

  const ordensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return ordens.filter((os) => {
      if (!termo) return true;

      const responsavel = getTecnicoResponsavel(os)?.name?.toLowerCase() ?? "";
      const status = os.status.replaceAll("_", " ").toLowerCase();

      return [
        os.numero,
        os.tipo,
        os.nome_cliente,
        os.descricao,
        responsavel,
        status,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(termo));
    });
  }, [busca, ordens]);

  const osDisponiveis = useMemo(() => {
    return ordensFiltradas.filter(
      (os) => os.status === "aberta" && !getResponsavelId(os)
    );
  }, [ordensFiltradas]);

  const minhasOS = useMemo(() => {
    return ordensFiltradas.filter(
      (os) => !!currentUser.id && getResponsavelId(os) === currentUser.id
    );
  }, [currentUser.id, ordensFiltradas]);

  const osEmExecucao = useMemo(() => {
    return minhasOS.filter((os) => os.status === "em_execucao");
  }, [minhasOS]);

  const osFinalizadas = useMemo(() => {
    return minhasOS.filter(
      (os) => os.status === "finalizada" || os.status === "nao_executada"
    );
  }, [minhasOS]);

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomeResponsavel(os: OrdemServico) {
    return getTecnicoResponsavel(os)?.name || "Sem responsável";
  }

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
        roleLabel="Técnico"
        subtitle="Painel operacional do técnico"
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
            <PlusCircle className="h-4 w-4" />
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
            Minhas OS
          </button>
        </div>

        {abaPrincipal === "criar" && (
          <FormularioETAETETecnico
            onCriada={() => {
              setAbaPrincipal("consultar");
              void carregarOrdens();
            }}
          />
        )}

        {abaPrincipal === "consultar" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumoMetricaCard
                titulo="OS Disponíveis"
                valor={osDisponiveis.length}
                icone={<PackageOpen className="h-5 w-5 text-blue-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Minhas OS"
                valor={minhasOS.length}
                icone={<ClipboardList className="h-5 w-5 text-indigo-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Em Execução"
                valor={osEmExecucao.length}
                icone={<Wrench className="h-5 w-5 text-amber-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoMetricaCard
                titulo="Concluídas"
                valor={osFinalizadas.length}
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
                  <h2 className={`text-2xl font-semibold ${titleText}`}>Ordens de Serviço</h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Consulte, aceite e acompanhe as ordens disponíveis e atribuídas a você.
                  </p>
                </div>

                <div className="w-full lg:max-w-md">
                  <div className="relative">
                    <Search className={`pointer-events-none absolute left-4 top-3.5 h-4 w-4 ${mutedText}`} />
                    <input
                      type="text"
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Buscar por número, cliente, tipo, status ou responsável..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {erro && (
                <div
                  className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-red-900 bg-red-950 text-red-300"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {erro}
                </div>
              )}

              <TabelaOrdensSection
                titulo="OS Disponíveis"
                descricao="Ordens abertas e ainda sem responsável técnico."
                ordens={osDisponiveis}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <TabelaOrdensSection
                titulo="Minhas OS"
                descricao="Ordens já atribuídas a você, independentemente do status."
                ordens={minhasOS}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <TabelaOrdensSection
                titulo="Em Execução"
                descricao="Ordens em andamento sob sua responsabilidade."
                ordens={osEmExecucao}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <TabelaOrdensSection
                titulo="Finalizadas"
                descricao="Ordens encerradas como finalizadas ou não executadas."
                ordens={osFinalizadas}
                loading={loading}
                isDark={isDark}
                mutedText={mutedText}
                titleText={titleText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              {!loading && (
                <div className={`mt-4 text-sm ${mutedText}`}>
                  Exibindo {ordensFiltradas.length} de {ordens.length} ordens de serviço.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <TecnicoOSDetailsModal
        ordemId={ordemSelecionadaId}
        open={!!ordemSelecionadaId}
        onClose={() => setOrdemSelecionadaId(null)}
        onAtualizou={carregarOrdens}
      />
    </div>
  );
}
