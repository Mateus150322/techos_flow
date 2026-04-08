import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Search,
} from "lucide-react";

import { AdminShell } from "@/modules/admin/AdminShell";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  getTecnicoResponsavel,
  listarTodasOrdens,
  type OrdemServico,
} from "./ordensServico.service";
import { ResumoMetricaCard } from "./components/ResumoMetricaCard";
import { StatusBadge } from "./components/StatusBadge";

export default function OrdensPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const currentUser = useCurrentUser();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErro("");

        const res = await listarTodasOrdens({ include: "tecnicoResponsavel" });
        setOrdens(res.data);
      } catch {
        setErro("Não foi possível carregar as ordens de serviço.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const tipos = useMemo(() => {
    return Array.from(new Set(ordens.map((ordem) => ordem.tipo).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [ordens]);

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((ordem) => {
      const termo = busca.toLowerCase().trim();

      const correspondeBusca =
        !termo ||
        ordem.numero?.toLowerCase().includes(termo) ||
        ordem.tipo?.toLowerCase().includes(termo) ||
        ordem.nome_cliente?.toLowerCase().includes(termo) ||
        ordem.descricao?.toLowerCase().includes(termo);

      const correspondeStatus =
        statusFiltro === "todos" || ordem.status === statusFiltro;

      const correspondeTipo = tipoFiltro === "todos" || ordem.tipo === tipoFiltro;

      return correspondeBusca && correspondeStatus && correspondeTipo;
    });
  }, [ordens, busca, statusFiltro, tipoFiltro]);

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const tableHead = isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600";
  const rowHover = isDark ? "hover:bg-slate-800/70" : "hover:bg-slate-50";
  const cardAccent = isDark ? "bg-slate-950/60" : "bg-slate-50";
  const buttonSecondary = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";
  const abertas = ordensFiltradas.filter((ordem) => ordem.status === "aberta").length;
  const emExecucao = ordensFiltradas.filter((ordem) => ordem.status === "em_execucao").length;
  const finalizadas = ordensFiltradas.filter(
    (ordem) => ordem.status === "finalizada" || ordem.status === "nao_executada"
  ).length;

  const content = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoMetricaCard
          titulo="Total de OS"
          valor={ordensFiltradas.length}
          icone={<Search className="h-5 w-5 text-blue-600" />}
          cardBg={cardBg}
          cardAccent={cardAccent}
          mutedText={mutedText}
          titleText={titleText}
        />
        <ResumoMetricaCard
          titulo="Abertas"
          valor={abertas}
          icone={<StatusDot className="h-5 w-5 text-sky-600" />}
          cardBg={cardBg}
          cardAccent={cardAccent}
          mutedText={mutedText}
          titleText={titleText}
        />
        <ResumoMetricaCard
          titulo="Em Execução"
          valor={emExecucao}
          icone={<StatusDot className="h-5 w-5 text-amber-600" />}
          cardBg={cardBg}
          cardAccent={cardAccent}
          mutedText={mutedText}
          titleText={titleText}
        />
        <ResumoMetricaCard
          titulo="Encerradas"
          valor={finalizadas}
          icone={<StatusDot className="h-5 w-5 text-emerald-600" />}
          cardBg={cardBg}
          cardAccent={cardAccent}
          mutedText={mutedText}
          titleText={titleText}
        />
      </div>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5">
        <h2 className={`text-2xl font-semibold ${titleText}`}>Ordens de Serviço</h2>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Consulte e gerencie as ordens de serviço cadastradas.
        </p>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <label className="relative block">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente..."
            className={`w-full rounded-2xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />
        </label>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
        >
          <option value="todos">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="em_execucao">Em Execução</option>
          <option value="finalizada">Finalizada</option>
          <option value="nao_executada">Não executada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
        >
          <option value="todos">Todos os tipos</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        </div>

        {erro && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? "border-red-900 bg-red-950 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {erro}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className={tableHead}>
                <tr>
                  <th className="p-4 text-left font-semibold">Número</th>
                  <th className="p-4 text-left font-semibold">Cliente</th>
                  <th className="p-4 text-left font-semibold">Tipo</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Data Abertura</th>
                  <th className="p-4 text-left font-semibold">Responsável</th>
                  <th className="p-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <span className={mutedText}>Carregando ordens de serviço...</span>
                    </td>
                  </tr>
                ) : ordensFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <span className={mutedText}>
                        Nenhuma ordem de serviço encontrada com os filtros informados.
                      </span>
                    </td>
                  </tr>
                ) : (
                  ordensFiltradas.map((ordem) => (
                    <tr
                      key={ordem.id}
                      className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                    >
                      <td className="p-4 font-medium">{ordem.numero}</td>
                      <td className="p-4">{ordem.nome_cliente || "-"}</td>
                      <td className="p-4 capitalize">{ordem.tipo}</td>
                      <td className="p-4">
                        <StatusBadge status={ordem.status} />
                      </td>
                      <td className="p-4">{formatarData(ordem.data_abertura)}</td>
                      <td className="p-4">{getTecnicoResponsavel(ordem)?.name || "-"}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${buttonSecondary}`}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && (
          <p className={`mt-4 text-sm ${mutedText}`}>
            Exibindo {ordensFiltradas.length} de {ordens.length} ordens de serviço.
          </p>
        )}
      </section>
    </div>
  );

  if (currentUser.role === "administrador") {
    return (
      <AdminShell currentUser={currentUser} activeTab="ordens">
        {content}
      </AdminShell>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${buttonSecondary}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

function StatusDot({ className }: { className?: string }) {
  return <span className={`inline-block h-3 w-3 rounded-full bg-current ${className ?? ""}`} />;
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
