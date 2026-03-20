import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, ClipboardList } from "lucide-react";

import { listarOrdens } from "./ordensServico.service";
import type { OrdemServico } from "./ordensServico.service";
import {StatusBadge} from "./components/StatusBadge";
import {PrioridadeBadge} from "./components/PrioridadeBadge";
import { useTheme } from "@/shared/hooks/useTheme";

export default function OrdensPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErro("");

        const res = await listarOrdens();
        setOrdens(res.data);
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);
        setErro("Não foi possível carregar as ordens de serviço.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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

      return correspondeBusca && correspondeStatus;
    });
  }, [ordens, busca, statusFiltro]);

  function formatarData(data?: string | null) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const inputBg = isDark
    ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const tableHead = isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600";
  const rowHover = isDark ? "hover:bg-slate-800/70" : "hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className={`flex items-center gap-3 text-3xl font-bold ${titleText}`}>
              <ClipboardList className="h-8 w-8" />
              Ordens de Serviço
            </h1>
            <p className={`mt-2 text-sm ${mutedText}`}>
              Consulte, filtre e acompanhe as ordens de serviço registradas no sistema.
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <Search
                className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por número, tipo, cliente ou descrição..."
                className={`w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </div>

            <div>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="todos">Todos os status</option>
                <option value="aberta">Aberta</option>
                <option value="em_execucao">Em execução</option>
                <option value="finalizada">Finalizada</option>
                <option value="nao_executada">Não executada</option>
                <option value="cancelada">Cancelada</option>
              </select>
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

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className={tableHead}>
                  <tr>
                    <th className="p-4 text-left font-semibold">Número</th>
                    <th className="p-4 text-left font-semibold">Cliente</th>
                    <th className="p-4 text-left font-semibold">Tipo</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-left font-semibold">Prioridade</th>
                    <th className="p-4 text-left font-semibold">Data de abertura</th>
                    <th className="p-4 text-right font-semibold">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center">
                        <span className={mutedText}>Carregando ordens de serviço...</span>
                      </td>
                    </tr>
                  )}

                  {!loading && ordensFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center">
                        <span className={mutedText}>
                          Nenhuma ordem de serviço encontrada com os filtros informados.
                        </span>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    ordensFiltradas.map((ordem) => (
                      <tr
                        key={ordem.id}
                        className={`cursor-pointer border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                        onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
                      >
                        <td className="p-4 font-medium">{ordem.numero}</td>
                        <td className="p-4">{ordem.nome_cliente || "-"}</td>
                        <td className="p-4 capitalize">{ordem.tipo}</td>
                        <td className="p-4">
                          <StatusBadge status={ordem.status} />
                        </td>
                        <td className="p-4">
                          <PrioridadeBadge prioridade={ordem.prioridade} />
                        </td>
                        <td className="p-4">{formatarData(ordem.data_abertura)}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ordens-servico/${ordem.id}`);
                            }}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                              isDark
                                ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && ordens.length > 0 && (
            <div className={`mt-4 text-sm ${mutedText}`}>
              Exibindo {ordensFiltradas.length} de {ordens.length} ordens de serviço.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}