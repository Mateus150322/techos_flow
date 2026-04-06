import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  LogOut,
  PlusCircle,
  PackageOpen,
  Wrench,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "@/shared/hooks/useTheme";
import { listarOrdens, type OrdemServico } from "./ordensServico.service";
import FormularioOSGeralTecnico from "./components/FormularioOSGeralTecnico";
import FormularioETAETETecnico from "./components/FormularioETAETETecnico";
import TecnicoOSDetailsModal from "./components/TecnicoOSDetailsModal";
import { StatusBadge } from "./components/StatusBadge";

type AbaPrincipal = "criar" | "consultar";
type AbaCriacao = "os_geral" | "eta_ete";

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role: "administrador" | "tecnico" | "atendente";
};

export default function TecnicoPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [abaCriacao, setAbaCriacao] = useState<AbaCriacao>("eta_ete");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [ordemSelecionadaId, setOrdemSelecionadaId] = useState<string | null>(null);

  const currentUser: CurrentUser = useMemo(() => {
    const raw = localStorage.getItem("user");

    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return {
          name: "Usuário",
          role: "tecnico",
        };
      }
    }

    return {
      name: "Usuário",
      role: "tecnico",
    };
  }, []);

  async function carregarOrdens() {
    try {
      setLoading(true);
      setErro("");

      const response = await listarOrdens({
        include: "tecnicoResponsavel",
      });

      setOrdens(response.data ?? []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar as ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarOrdens();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const ordensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return ordens.filter((os) => {
      return (
        !termo ||
        os.numero?.toLowerCase().includes(termo) ||
        os.tipo?.toLowerCase().includes(termo) ||
        os.nome_cliente?.toLowerCase().includes(termo) ||
        os.descricao?.toLowerCase().includes(termo)
      );
    });
  }, [ordens, busca]);

  const osDisponiveis = useMemo(() => {
    return ordensFiltradas.filter(
      (os) => os.status === "aberta" && !os.tecnico_responsavel_id
    );
  }, [ordensFiltradas]);

  const minhasOS = useMemo(() => {
    return ordensFiltradas.filter(
      (os) => os.tecnico_responsavel_id === currentUser.id
    );
  }, [ordensFiltradas, currentUser.id]);

  const osEmExecucao = useMemo(() => {
    return ordensFiltradas.filter(
      (os) =>
        os.status === "em_execucao" &&
        os.tecnico_responsavel_id === currentUser.id
    );
  }, [ordensFiltradas, currentUser.id]);

  const osFinalizadas = useMemo(() => {
    return ordensFiltradas.filter(
      (os) =>
        os.status === "finalizada" &&
        os.tecnico_responsavel_id === currentUser.id
    );
  }, [ordensFiltradas, currentUser.id]);

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomeResponsavel(os: OrdemServico) {
    return (
      (os as any)?.tecnico_responsavel?.name ||
      (os as any)?.tecnicoResponsavel?.name ||
      "Sem responsável"
    );
  }

  const pageBg = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const headerBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
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
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
    : "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <header className={`border-b ${headerBg}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>

            <div>
              <h1 className={`text-2xl font-semibold ${titleText}`}>TechOS Flow</h1>
              <p className={`text-sm ${mutedText}`}>Sistema de Gerenciamento de OS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${titleText}`}>{currentUser.name}</p>
              <p className={`text-sm ${mutedText}`}>Técnico</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
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
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAbaCriacao("os_geral")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  abaCriacao === "os_geral" ? buttonActive : buttonInactive
                }`}
              >
                OS Geral
              </button>

              <button
                type="button"
                onClick={() => setAbaCriacao("eta_ete")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  abaCriacao === "eta_ete" ? buttonActive : buttonInactive
                }`}
              >
                Manutenção ETA/ETE
              </button>
            </div>

            {abaCriacao === "os_geral" ? (
              <FormularioOSGeralTecnico
                onCriada={() => {
                  setAbaPrincipal("consultar");
                  carregarOrdens();
                }}
              />
            ) : (
              <FormularioETAETETecnico />
            )}
          </>
        )}

        {abaPrincipal === "consultar" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumoCard
                titulo="OS Disponíveis"
                valor={osDisponiveis.length}
                icone={<PackageOpen className="h-5 w-5 text-blue-600" />}
                cardBg={cardBg}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Minhas OS"
                valor={minhasOS.length}
                icone={<ClipboardList className="h-5 w-5 text-indigo-600" />}
                cardBg={cardBg}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Em Execução"
                valor={osEmExecucao.length}
                icone={<Wrench className="h-5 w-5 text-amber-600" />}
                cardBg={cardBg}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Finalizadas"
                valor={osFinalizadas.length}
                icone={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                cardBg={cardBg}
                mutedText={mutedText}
                titleText={titleText}
              />
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${titleText}`}>Ordens de Serviço</h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Consulte, aceite e acompanhe as ordens de serviço do técnico.
                  </p>
                </div>

                <div className="w-full md:max-w-md">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por número, cliente, tipo ou descrição..."
                    className={inputClass}
                  />
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

              <SecaoTabela
                titulo="OS Disponíveis"
                descricao="Ordens abertas e sem responsável técnico."
                ordens={osDisponiveis}
                loading={loading}
                mutedText={mutedText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <SecaoTabela
                titulo="Minhas OS"
                descricao="Ordens já atribuídas a você."
                ordens={minhasOS}
                loading={loading}
                mutedText={mutedText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              <SecaoTabela
                titulo="Em Execução"
                descricao="Ordens que já foram iniciadas por você."
                ordens={osEmExecucao}
                loading={loading}
                mutedText={mutedText}
                tableHead={tableHead}
                rowHover={rowHover}
                tableBorder={tableBorder}
                onVer={(id) => setOrdemSelecionadaId(id)}
                formatarData={formatarData}
                nomeResponsavel={nomeResponsavel}
              />

              {!loading && ordensFiltradas.length > 0 && (
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

function ResumoCard({
  titulo,
  valor,
  icone,
  cardBg,
  mutedText,
  titleText,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  cardBg: string;
  mutedText: string;
  titleText: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${mutedText}`}>{titulo}</span>
        {icone}
      </div>
      <p className={`mt-3 text-3xl font-bold ${titleText}`}>{valor}</p>
    </div>
  );
}

function SecaoTabela({
  titulo,
  descricao,
  ordens,
  loading,
  mutedText,
  tableHead,
  rowHover,
  tableBorder,
  onVer,
  formatarData,
  nomeResponsavel,
}: {
  titulo: string;
  descricao: string;
  ordens: OrdemServico[];
  loading: boolean;
  mutedText: string;
  tableHead: string;
  rowHover: string;
  tableBorder: string;
  onVer: (id: string) => void;
  formatarData: (data?: string | null) => string;
  nomeResponsavel: (os: OrdemServico) => string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
        <p className={`text-sm ${mutedText}`}>{descricao}</p>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${tableBorder}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="p-4 text-left font-semibold">Número</th>
                <th className="p-4 text-left font-semibold">Cliente</th>
                <th className="p-4 text-left font-semibold">Tipo</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Responsável</th>
                <th className="p-4 text-left font-semibold">Data Abertura</th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <span className={mutedText}>Carregando...</span>
                  </td>
                </tr>
              )}

              {!loading && ordens.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    <span className={mutedText}>Nenhuma ordem encontrada</span>
                  </td>
                </tr>
              )}

              {!loading &&
                ordens.map((os) => (
                  <tr
                    key={os.id}
                    className={`border-t ${tableBorder} transition ${rowHover}`}
                  >
                    <td className="p-4 font-medium">{os.numero}</td>
                    <td className="p-4">
                      {os.nome_cliente || `${os.tipo} - ${os.descricao?.slice(0, 20) ?? ""}`}
                    </td>
                    <td className="p-4 capitalize">{os.tipo}</td>
                    <td className="p-4">
                      <StatusBadge status={os.status} />
                    </td>
                    <td className="p-4">{nomeResponsavel(os)}</td>
                    <td className="p-4">{formatarData(os.data_abertura)}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => onVer(os.id)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}