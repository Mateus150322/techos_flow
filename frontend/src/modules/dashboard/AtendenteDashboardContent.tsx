import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  LogOut,
  Moon,
  PlayCircle,
  Search,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutSession } from "@/modules/auth/auth.service";
import FormularioOSGeral from "@/modules/ordensServico/components/FormularioOSGeral";
import { StatusBadge } from "@/modules/ordensServico/components/StatusBadge";
import {
  getTecnicoResponsavel,
  type OrdemServico,
} from "@/modules/ordensServico/ordensServico.service";
import { type CurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

type AtendenteDashboardContentProps = {
  currentUser: CurrentUser;
  orders: OrdemServico[];
  loading: boolean;
};

type AbaPrincipal = "criar" | "consultar";

export function AtendenteDashboardContent({
  currentUser,
  orders,
  loading,
}: AtendenteDashboardContentProps) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [abaPrincipal, setAbaPrincipal] = useState<AbaPrincipal>("consultar");
  const [busca, setBusca] = useState("");

  async function handleLogout() {
    await logoutSession();
    navigate("/login");
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomeResponsavel(os: OrdemServico) {
    return getTecnicoResponsavel(os)?.name || "Sem responsável";
  }

  const ordensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return orders.filter((os) => {
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
  }, [busca, orders]);

  const ordensAbertas = useMemo(() => {
    return ordensFiltradas.filter((os) => os.status === "aberta");
  }, [ordensFiltradas]);

  const ordensEmExecucao = useMemo(() => {
    return ordensFiltradas.filter((os) => os.status === "em_execucao");
  }, [ordensFiltradas]);

  const ordensEncerradas = useMemo(() => {
    return ordensFiltradas.filter((os) =>
      ["finalizada", "nao_executada", "cancelada"].includes(os.status)
    );
  }, [ordensFiltradas]);

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
      <header className={`border-b ${headerBg}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>

            <div>
              <h1 className={`text-2xl font-semibold ${titleText}`}>TechOS Flow</h1>
              <p className={`text-sm ${mutedText}`}>Painel operacional do atendente</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${titleText}`}>{currentUser.name}</p>
              <p className={`text-sm ${mutedText}`}>Atendente</p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${buttonSecondary}`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Modo claro" : "Modo escuro"}
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${buttonSecondary}`}
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
          <div className="space-y-6">
            <div className={`rounded-2xl border p-4 text-sm ${cardBg}`}>
              <p className={titleText}>Abertura geral sob responsabilidade do atendente.</p>
              <p className={`mt-2 ${mutedText}`}>
                Use este painel para registrar novas ordens e acompanhar o andamento da operação.
              </p>
            </div>

            <FormularioOSGeral
              titulo="Nova OS geral"
              descricao="Abra uma nova ordem de serviço com cliente, prioridade, descrição e endereço."
              onCriada={(ordemCriada) => navigate(`/ordens-servico/${ordemCriada.id}`)}
            />
          </div>
        )}

        {abaPrincipal === "consultar" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResumoCard
                titulo="Total de OS"
                valor={orders.length}
                icone={<ClipboardList className="h-5 w-5 text-blue-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Abertas"
                valor={ordensAbertas.length}
                icone={<FilePlus2 className="h-5 w-5 text-sky-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Em execução"
                valor={ordensEmExecucao.length}
                icone={<PlayCircle className="h-5 w-5 text-amber-600" />}
                cardBg={cardBg}
                cardAccent={cardAccent}
                mutedText={mutedText}
                titleText={titleText}
              />

              <ResumoCard
                titulo="Encerradas"
                valor={ordensEncerradas.length}
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
                    Consulte o andamento das ordens abertas pelo atendimento e pela operação.
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

              <SecaoTabela
                titulo="Abertas"
                descricao="Ordens aguardando aceite ou início da execução."
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

              <SecaoTabela
                titulo="Em execução"
                descricao="Ordens atualmente em andamento com a equipe técnica."
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

              <SecaoTabela
                titulo="Encerradas"
                descricao="Ordens concluídas, não executadas ou canceladas."
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
                  Exibindo {ordensFiltradas.length} de {orders.length} ordens de serviço.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
  cardBg,
  cardAccent,
  mutedText,
  titleText,
}: {
  titulo: string;
  valor: number;
  icone: ReactNode;
  cardBg: string;
  cardAccent: string;
  mutedText: string;
  titleText: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
      <div className={`rounded-2xl p-4 ${cardAccent}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${mutedText}`}>{titulo}</span>
          {icone}
        </div>
        <p className={`mt-3 text-3xl font-bold ${titleText}`}>{valor}</p>
      </div>
    </div>
  );
}

function SecaoTabela({
  titulo,
  descricao,
  ordens,
  loading,
  isDark,
  mutedText,
  titleText,
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
  isDark: boolean;
  mutedText: string;
  titleText: string;
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
        <h3 className={`text-lg font-semibold ${titleText}`}>{titulo}</h3>
        <p className={`text-sm ${mutedText}`}>{descricao}</p>
      </div>

      <div className={`overflow-hidden rounded-2xl border ${tableBorder}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="p-4 text-left font-semibold">Número</th>
                <th className="p-4 text-left font-semibold">Cliente</th>
                <th className="p-4 text-left font-semibold">Tipo</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Responsável</th>
                <th className="p-4 text-left font-semibold">Data de abertura</th>
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
                    <span className={mutedText}>Nenhuma ordem encontrada.</span>
                  </td>
                </tr>
              )}

              {!loading &&
                ordens.map((os) => (
                  <tr
                    key={os.id}
                    className={`border-t ${tableBorder} transition ${rowHover}`}
                  >
                    <td className={`p-4 font-medium ${titleText}`}>{os.numero}</td>
                    <td className={`p-4 ${titleText}`}>
                      {os.nome_cliente || `${os.tipo} - ${os.descricao?.slice(0, 36) ?? ""}`}
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
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isDark
                            ? "bg-slate-100 text-slate-900 hover:bg-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
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
