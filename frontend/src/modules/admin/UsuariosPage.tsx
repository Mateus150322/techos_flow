import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, Search, ShieldAlert, UserPlus, X } from "lucide-react";

import { AdminShell } from "./AdminShell";
import { AdminMetricCard } from "./components/AdminMetricCard";
import {
  atualizarUsuario,
  criarUsuario,
  listarUsuarios,
  type PerfilUsuario,
  type UsuarioAdmin,
} from "./usuarios.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  getApiErrorMessage,
  getFirstApiValidationMessage,
} from "@/shared/utils/apiError";

type FormState = {
  name: string;
  email: string;
  role: PerfilUsuario;
  password: string;
  passwordConfirmation: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  role: "atendente",
  password: "",
  passwordConfirmation: "",
};

export default function UsuariosPage() {
  const { isDark } = useTheme();
  const currentUser = useCurrentUser();

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [perfilFiltro, setPerfilFiltro] = useState<PerfilUsuario | "todos">("todos");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [processandoStatusId, setProcessandoStatusId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    administradores: 0,
    tecnicos: 0,
    atendentes: 0,
    ultimos_7_dias: 0,
  });

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await listarUsuarios({
        q: busca,
        role: perfilFiltro,
        status: statusFiltro,
        page: paginaAtual,
        per_page: 10,
      });

      setUsuarios(response.data ?? []);
      setPaginaAtual(response.current_page ?? 1);
      setUltimaPagina(response.last_page ?? 1);
      setTotalUsuarios(response.total ?? 0);
      setStats(response.stats);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }, [busca, paginaAtual, perfilFiltro, statusFiltro]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarUsuarios();
    }, busca.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busca, perfilFiltro, statusFiltro, paginaAtual, carregarUsuarios]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, perfilFiltro, statusFiltro]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingUserId(null);
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
      return;
    }

    setEditingUserId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
    setErro("");
    setSucesso("");
  }

  function startEditing(usuario: UsuarioAdmin) {
    setEditingUserId(usuario.id);
    setShowForm(true);
    setForm({
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      password: "",
      passwordConfirmation: "",
    });
    setSucesso("");
    setErro("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setErro("");
      setSucesso("");

      if (!editingUserId && form.password !== form.passwordConfirmation) {
        setErro("A confirmação de senha precisa ser igual à senha informada.");
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password.trim() || undefined,
      };

      if (editingUserId) {
        await atualizarUsuario(editingUserId, payload);
        setSucesso("Usuário atualizado com sucesso.");
      } else {
        await criarUsuario({
          ...payload,
          password: payload.password ?? "",
        });
        setSucesso("Usuário criado com sucesso.");
      }

      resetForm();
      await carregarUsuarios();
    } catch (error) {
      const validationMessage = getFirstApiValidationMessage(error, [
        "name",
        "email",
        "role",
        "password",
      ]);

      setErro(
        validationMessage ??
          getApiErrorMessage(error, "Não foi possível salvar o usuário.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function alternarStatusUsuario(usuario: UsuarioAdmin) {
    if (usuario.id === currentUser.id && usuario.is_active) {
      setErro("Você não pode inativar seu próprio usuário.");
      setSucesso("");
      return;
    }

    try {
      setProcessandoStatusId(usuario.id);
      setErro("");
      setSucesso("");

      const atualizado = await atualizarUsuario(usuario.id, {
        is_active: !usuario.is_active,
      });

      setSucesso(
        atualizado.is_active
          ? "Usuário reativado com sucesso."
          : "Usuário inativado com sucesso."
      );

      await carregarUsuarios();
    } catch (error) {
      setErro(
        getApiErrorMessage(error, "Não foi possível atualizar o status do usuário.")
      );
    } finally {
      setProcessandoStatusId(null);
    }
  }

  const cardBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200";
  const softBg = isDark ? "bg-zinc-950/70 border-zinc-800" : "bg-slate-50 border-slate-200";
  const titleText = isDark ? "text-zinc-50" : "text-slate-900";
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const inputBg = isDark
    ? "border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";
  const primaryButton = isDark
    ? "bg-zinc-100 text-zinc-950 hover:bg-white"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const secondaryButton = isDark
    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const rowHover = isDark ? "hover:bg-zinc-950/80" : "hover:bg-slate-50";
  const infoBox = isDark
    ? "border-amber-900 bg-amber-950/60 text-amber-200"
    : "border-amber-200 bg-amber-50 text-amber-800";

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminShell currentUser={currentUser} activeTab="usuarios">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminMetricCard
          value={stats.total}
          label="Total filtrado"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-slate-900 dark:text-zinc-50"
          hint="Usuários conforme busca e filtros"
        />
        <AdminMetricCard
          value={stats.ativos}
          label="Ativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Usuários com acesso liberado"
        />
        <AdminMetricCard
          value={stats.inativos}
          label="Inativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-rose-500"
          hint="Usuários com acesso bloqueado"
        />
        <AdminMetricCard
          value={stats.administradores}
          label="Administradores"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-violet-500"
          hint="Acesso gerencial do sistema"
        />
        <AdminMetricCard
          value={stats.tecnicos}
          label="Técnicos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-blue-500"
          hint="Equipe operacional de campo"
        />
        <AdminMetricCard
          value={stats.atendentes}
          label="Atendentes"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-amber-500"
          hint="Equipe de abertura e consulta"
        />
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Gerenciar usuários</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Adicione, edite, inative e reative os usuários do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleForm}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${primaryButton}`}
          >
            <UserPlus className="h-4 w-4" />
            {showForm ? "Fechar formulário" : "Novo usuário"}
          </button>
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

        {sucesso ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {sucesso}
          </div>
        ) : null}

        {showForm ? (
          <div className={`mb-6 rounded-3xl border p-5 ${softBg}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${titleText}`}>
                  {editingUserId ? "Editar usuário" : "Novo usuário"}
                </h3>
                <p className={`text-sm ${mutedText}`}>
                  {editingUserId
                    ? "Atualize os dados do usuário selecionado."
                    : "Cadastre um novo acesso para a operação."}
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

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nome"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />

              <select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value as PerfilUsuario,
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="administrador">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="atendente">Atendente</option>
              </select>

              <input
                type="password"
                placeholder={editingUserId ? "Nova senha (opcional)" : "Senha inicial"}
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />

              {!editingUserId ? (
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={form.passwordConfirmation}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      passwordConfirmation: event.target.value,
                    }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                />
              ) : null}

              <div
                className={`rounded-2xl border px-4 py-3 text-sm md:col-span-2 ${
                  isDark
                    ? "border-blue-900 bg-blue-950/50 text-blue-200"
                    : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                A senha inicial deve seguir os padrões fortes do sistema. No primeiro acesso, o
                usuário será obrigado a definir uma nova senha antes de continuar.
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {saving
                      ? "Salvando..."
                      : editingUserId
                        ? "Salvar alterações"
                        : "Criar usuário"}
                  </button>

                  {editingUserId ? (
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

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_240px_220px]">
          <label className="relative block">
            <Search
              className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
            />
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar usuários..."
              className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </label>

          <select
            value={perfilFiltro}
            onChange={(event) =>
              setPerfilFiltro(event.target.value as PerfilUsuario | "todos")
            }
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          >
            <option value="todos">Todos os perfis</option>
            <option value="administrador">Administrador</option>
            <option value="tecnico">Técnico</option>
            <option value="atendente">Atendente</option>
          </select>

          <select
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
        </div>

        <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${infoBox}`}>
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Usuários inativos perdem acesso imediatamente ao sistema. A reativação libera o
            login novamente, sem apagar o histórico das ordens de serviço.
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className={isDark ? "bg-zinc-950 text-zinc-300" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th className="p-4 text-left font-semibold">Nome</th>
                  <th className="p-4 text-left font-semibold">Email</th>
                  <th className="p-4 text-left font-semibold">Perfil</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Data de criação</th>
                  <th className="p-4 text-left font-semibold">Atualizado em</th>
                  <th className="p-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <span className={mutedText}>Carregando usuários...</span>
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <span className={mutedText}>Nenhum usuário encontrado.</span>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => {
                    const isCurrentUser = usuario.id === currentUser.id;
                    const statusEmProcessamento = processandoStatusId === usuario.id;

                    return (
                      <tr
                        key={usuario.id}
                        className={`border-t border-slate-200 transition dark:border-zinc-800 ${rowHover}`}
                      >
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{usuario.name}</span>
                            {isCurrentUser ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                Atual
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4">{usuario.email}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadge(usuario.role)}`}
                          >
                            {roleLabel(usuario.role)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              usuario.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {usuario.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-4">{formatDate(usuario.created_at)}</td>
                        <td className="p-4">{formatDate(usuario.updated_at)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(usuario)}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${secondaryButton}`}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>

                            <button
                              type="button"
                              title={
                                isCurrentUser && usuario.is_active
                                  ? "Seu próprio usuário não pode ser inativado."
                                  : undefined
                              }
                              disabled={statusEmProcessamento || (isCurrentUser && usuario.is_active)}
                              onClick={() => void alternarStatusUsuario(usuario)}
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                usuario.is_active
                                  ? "bg-rose-600 hover:bg-rose-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {statusEmProcessamento
                                ? "Salvando..."
                                : isCurrentUser && usuario.is_active
                                  ? "Seu acesso"
                                  : usuario.is_active
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

        {!loading ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${mutedText}`}>
              Exibindo {usuarios.length} de {totalUsuarios}{" "}
              {totalUsuarios === 1 ? "usuário" : "usuários"}.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={paginaAtual <= 1 || loading}
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
              >
                Anterior
              </button>
              <span className={`text-sm ${mutedText}`}>
                Página {paginaAtual} de {ultimaPagina}
              </span>
              <button
                type="button"
                disabled={paginaAtual >= ultimaPagina || loading}
                onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, ultimaPagina))}
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
              >
                Próxima
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}

function roleBadge(role: PerfilUsuario) {
  if (role === "administrador") return "bg-violet-100 text-violet-700";
  if (role === "tecnico") return "bg-emerald-100 text-emerald-700";
  return "bg-blue-100 text-blue-700";
}

function roleLabel(role: PerfilUsuario) {
  if (role === "administrador") return "Administrador";
  if (role === "tecnico") return "Técnico";
  return "Atendente";
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR");
}

