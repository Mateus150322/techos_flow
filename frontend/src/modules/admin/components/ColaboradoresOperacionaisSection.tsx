import { useCallback, useEffect, useId, useState } from "react";
import { Pencil, Search, UserPlus, Users, Wrench, X } from "lucide-react";

import { AdminMetricCard } from "./AdminMetricCard";
import {
  atualizarColaboradorOperacional,
  criarColaboradorOperacional,
  listarColaboradoresOperacionais,
  type ColaboradorOperacionalAdmin,
} from "../colaboradores.service";
import {
  getApiErrorMessage,
  getFirstApiValidationMessage,
} from "@/shared/utils/apiError";

type Props = {
  isDark: boolean;
};

type FormState = {
  name: string;
  funcao: string;
  valorHora: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  funcao: "Auxiliar técnico",
  valorHora: "",
};

export function ColaboradoresOperacionaisSection({ isDark }: Props) {
  const buscaId = useId();
  const statusFiltroId = useId();
  const nomeId = useId();
  const funcaoId = useId();
  const valorHoraId = useId();
  const tabelaCaptionId = useId();

  const [colaboradores, setColaboradores] = useState<ColaboradorOperacionalAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativos" | "inativos">(
    "ativos"
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [processandoStatusId, setProcessandoStatusId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
  });

  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const softBg = isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-slate-50" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";
  const primaryButton = isDark
    ? "bg-slate-100 text-slate-950 hover:bg-white"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const secondaryButton = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const rowHover = isDark ? "hover:bg-slate-950/80" : "hover:bg-slate-50";
  const infoBox = isDark
    ? "border-blue-900 bg-blue-950/60 text-blue-200"
    : "border-blue-200 bg-blue-50 text-blue-800";

  const carregarColaboradores = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await listarColaboradoresOperacionais({
        q: busca,
        status: statusFiltro,
        per_page: 50,
      });

      setColaboradores(response.data ?? []);
      setStats(response.stats ?? { total: 0, ativos: 0, inativos: 0 });
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          "Não foi possível carregar os colaboradores operacionais."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [busca, statusFiltro]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarColaboradores();
    }, busca.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busca, statusFiltro, carregarColaboradores]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
      return;
    }

    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
    setErro("");
    setSucesso("");
  }

  function startEditing(colaborador: ColaboradorOperacionalAdmin) {
    setEditingId(colaborador.id);
    setShowForm(true);
    setErro("");
    setSucesso("");
    setForm({
      name: colaborador.name,
      funcao: colaborador.funcao,
      valorHora: colaborador.valor_hora ?? "",
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      const payload = {
        name: form.name.trim(),
        funcao: form.funcao.trim(),
        valor_hora: form.valorHora.trim()
          ? Number(form.valorHora.replace(",", "."))
          : undefined,
      };

      if (editingId) {
        await atualizarColaboradorOperacional(editingId, payload);
        setSucesso("Colaborador operacional atualizado com sucesso.");
      } else {
        await criarColaboradorOperacional(payload);
        setSucesso("Colaborador operacional criado com sucesso.");
      }

      resetForm();
      await carregarColaboradores();
    } catch (error) {
      const validationMessage = getFirstApiValidationMessage(error, [
        "name",
        "funcao",
        "valor_hora",
      ]);

      setErro(
        validationMessage ??
          getApiErrorMessage(
            error,
            "Não foi possível salvar o colaborador operacional."
          )
      );
    } finally {
      setSaving(false);
    }
  }

  async function alternarStatus(colaborador: ColaboradorOperacionalAdmin) {
    try {
      setProcessandoStatusId(colaborador.id);
      setErro("");
      setSucesso("");

      const atualizado = await atualizarColaboradorOperacional(colaborador.id, {
        is_active: !colaborador.is_active,
      });

      setSucesso(
        atualizado.is_active
          ? "Colaborador operacional reativado com sucesso."
          : "Colaborador operacional inativado com sucesso."
      );

      await carregarColaboradores();
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          "Não foi possível atualizar o status do colaborador operacional."
        )
      );
    } finally {
      setProcessandoStatusId(null);
    }
  }

  return (
    <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading || saving}>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          value={stats.total}
          label="Colaboradores"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-slate-900 dark:text-slate-50"
          hint="Base operacional sem acesso ao sistema"
          icon={<Users className="h-5 w-5 text-blue-500" />}
        />
        <AdminMetricCard
          value={stats.ativos}
          label="Ativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Podem ser adicionados na equipe da OS"
          icon={<Wrench className="h-5 w-5 text-emerald-500" />}
        />
        <AdminMetricCard
          value={stats.inativos}
          label="Inativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-rose-500"
          hint="Ficam fora da equipe e da apuração nova"
          icon={<Users className="h-5 w-5 text-rose-500" />}
        />
      </div>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={`text-2xl font-semibold ${titleText}`}>
            Colaboradores operacionais
          </h2>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Cadastre auxiliares e apoios de campo que entram na equipe da OS e
            no cálculo de horas extras, mas não recebem login no sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleForm}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${primaryButton}`}
        >
          <UserPlus className="h-4 w-4" />
          {showForm ? "Fechar formulário" : "Novo colaborador"}
        </button>
      </div>

      {erro ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
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

      {sucesso ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            isDark
              ? "border-emerald-900 bg-emerald-950 text-emerald-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {sucesso}
        </div>
      ) : null}

      {showForm ? (
        <div className={`mb-6 rounded-3xl border p-5 ${softBg}`}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className={`text-lg font-semibold ${titleText}`}>
                {editingId ? "Editar colaborador" : "Novo colaborador"}
              </h3>
              <p className={`text-sm ${mutedText}`}>
                Use este cadastro para auxiliares e apoios de campo sem acesso
                ao sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${secondaryButton}`}
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3" aria-busy={saving}>
            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Nome</span>
              <input
                id={nomeId}
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </label>

            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Função operacional</span>
              <input
                id={funcaoId}
                type="text"
                value={form.funcao}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, funcao: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </label>

            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                Valor/hora para horas extras (R$)
              </span>
              <input
                id={valorHoraId}
                type="number"
                min="0"
                step="0.01"
                value={form.valorHora}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, valorHora: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </label>

            <div
              className={`rounded-2xl border px-4 py-3 text-sm md:col-span-3 ${infoBox}`}
            >
              Esse cadastro não cria login. Ele só libera a participação do
              auxiliar na equipe da OS e na apuração administrativa de horas
              extras.
            </div>

            <div className="md:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton} disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar alterações"
                      : "Criar colaborador"}
                </button>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <div
        className="mb-5 grid gap-4 lg:grid-cols-[1fr_220px]"
        role="search"
        aria-label="Buscar e filtrar colaboradores operacionais"
      >
        <label className="relative block" htmlFor={buscaId}>
          <span className="sr-only">Buscar colaboradores operacionais</span>
          <Search
            className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
          />
          <input
            id={buscaId}
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar colaboradores..."
            className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />
        </label>

        <label className="block" htmlFor={statusFiltroId}>
          <span className="sr-only">Filtrar por status</span>
          <select
            id={statusFiltroId}
            value={statusFiltro}
            onChange={(event) =>
              setStatusFiltro(event.target.value as "todos" | "ativos" | "inativos")
            }
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Apenas ativos</option>
            <option value="inativos">Apenas inativos</option>
          </select>
        </label>
      </div>

      <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${infoBox}`}>
        <Users className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          Colaboradores operacionais entram na equipe da OS e no relatório de
          horas extras, mas não podem abrir, assumir nem acessar ordens de
          serviço.
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {loading ? (
          <div className={`rounded-3xl border p-6 text-center text-sm ${softBg} ${mutedText}`}>
            Carregando colaboradores...
          </div>
        ) : colaboradores.length === 0 ? (
          <div className={`rounded-3xl border p-6 text-center text-sm ${softBg} ${mutedText}`}>
            Nenhum colaborador encontrado.
          </div>
        ) : (
          colaboradores.map((colaborador) => (
            <ColaboradorMobileCard
              key={colaborador.id}
              colaborador={colaborador}
              processandoStatusId={processandoStatusId}
              isDark={isDark}
              titleText={titleText}
              mutedText={mutedText}
              secondaryButton={secondaryButton}
              onEdit={startEditing}
              onToggleStatus={alternarStatus}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <caption id={tabelaCaptionId} className="sr-only">
              Tabela de colaboradores operacionais com nome, função,
              valor/hora, status e ações administrativas.
            </caption>
            <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
              <tr>
                <th scope="col" className="p-4 text-left font-semibold">Nome</th>
                <th scope="col" className="p-4 text-left font-semibold">Função</th>
                <th scope="col" className="p-4 text-left font-semibold">Valor/hora</th>
                <th scope="col" className="p-4 text-left font-semibold">Status</th>
                <th scope="col" className="p-4 text-left font-semibold">Atualizado em</th>
                <th scope="col" className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    <span className={mutedText}>Carregando colaboradores...</span>
                  </td>
                </tr>
              ) : colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    <span className={mutedText}>Nenhum colaborador encontrado.</span>
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => {
                  const statusEmProcessamento =
                    processandoStatusId === colaborador.id;

                  return (
                    <tr
                      key={colaborador.id}
                      className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                    >
                      <th scope="row" className="p-4 text-left font-medium">
                        {colaborador.name}
                      </th>
                      <td className="p-4">{colaborador.funcao}</td>
                      <td className="p-4">
                        {colaborador.valor_hora
                          ? `R$ ${Number(colaborador.valor_hora).toFixed(2).replace(".", ",")}`
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            colaborador.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {colaborador.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4">{formatDate(colaborador.updated_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(colaborador)}
                            aria-label={`Editar colaborador ${colaborador.name}`}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${secondaryButton}`}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={statusEmProcessamento}
                            onClick={() => void alternarStatus(colaborador)}
                            aria-label={
                              colaborador.is_active
                                ? `Inativar colaborador ${colaborador.name}`
                                : `Reativar colaborador ${colaborador.name}`
                            }
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              colaborador.is_active
                                ? "bg-rose-600 hover:bg-rose-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {statusEmProcessamento
                              ? "Salvando..."
                              : colaborador.is_active
                                ? "Inativar"
                                : "Reativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR");
}

function ColaboradorMobileCard({
  colaborador,
  processandoStatusId,
  isDark,
  titleText,
  mutedText,
  secondaryButton,
  onEdit,
  onToggleStatus,
}: {
  colaborador: ColaboradorOperacionalAdmin;
  processandoStatusId: string | null;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  secondaryButton: string;
  onEdit: (colaborador: ColaboradorOperacionalAdmin) => void;
  onToggleStatus: (colaborador: ColaboradorOperacionalAdmin) => Promise<void>;
}) {
  const statusEmProcessamento = processandoStatusId === colaborador.id;

  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-base font-semibold ${titleText}`}>{colaborador.name}</h3>
          <p className={`mt-1 text-sm ${mutedText}`}>{colaborador.funcao}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            colaborador.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {colaborador.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Valor/hora
          </dt>
          <dd className={`mt-1 text-sm ${titleText}`}>
            {colaborador.valor_hora
              ? `R$ ${Number(colaborador.valor_hora).toFixed(2).replace(".", ",")}`
              : "-"}
          </dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Atualizado em
          </dt>
          <dd className={`mt-1 text-sm ${titleText}`}>{formatDate(colaborador.updated_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(colaborador)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${secondaryButton}`}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>

        <button
          type="button"
          disabled={statusEmProcessamento}
          onClick={() => void onToggleStatus(colaborador)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            colaborador.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {statusEmProcessamento
            ? "Salvando..."
            : colaborador.is_active
              ? "Inativar"
              : "Reativar"}
        </button>
      </div>
    </article>
  );
}
