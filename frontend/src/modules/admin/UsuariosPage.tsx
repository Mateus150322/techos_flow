import { useCallback, useEffect, useId, useState } from "react";
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
import {
  getFirstPasswordPolicyError,
  getPasswordRequirements,
} from "@/shared/utils/passwordPolicy";

type FormState = {
  name: string;
  email: string;
  role: PerfilUsuario;
  password: string;
  passwordConfirmation: string;
  valorHora: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  role: "atendente",
  password: "",
  passwordConfirmation: "",
  valorHora: "",
};

export default function UsuariosPage() {
  const { isDark } = useTheme();
  const currentUser = useCurrentUser();
  const buscaId = useId();
  const perfilFiltroId = useId();
  const statusFiltroId = useId();
  const nomeId = useId();
  const emailId = useId();
  const roleId = useId();
  const senhaId = useId();
  const confirmarSenhaId = useId();
  const valorHoraId = useId();
  const tabelaCaptionId = useId();

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

  const requisitosSenha = getPasswordRequirements(form.password, {
    name: form.name,
    email: form.email,
    confirmation: form.passwordConfirmation,
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
      valorHora: usuario.valor_hora ?? "",
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

      const password = form.password.trim();
      const passwordConfirmation = form.passwordConfirmation.trim();

      if (!editingUserId && !password) {
        setErro("Informe a senha inicial.");
        return;
      }

      if (password && password !== passwordConfirmation) {
        setErro("A confirmação de senha precisa ser igual à senha informada.");
        return;
      }

      if (password) {
        const passwordError = getFirstPasswordPolicyError(password, {
          name: form.name,
          email: form.email,
          confirmation: passwordConfirmation,
        });

        if (passwordError) {
          setErro(`Senha inválida: ${passwordError}.`);
          return;
        }
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: password || undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
        valor_hora: form.valorHora.trim()
          ? Number(form.valorHora.replace(",", "."))
          : undefined,
      };

      if (editingUserId) {
        await atualizarUsuario(editingUserId, payload);
        setSucesso("Usuário atualizado com sucesso.");
      } else {
        await criarUsuario({
          ...payload,
          password: payload.password ?? "",
          password_confirmation: payload.password_confirmation ?? "",
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
        "valor_hora",
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
          accentClass="text-slate-900 dark:text-slate-50"
          hint="Usuarios conforme busca e filtros"
        />
        <AdminMetricCard
          value={stats.ativos}
          label="Ativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-emerald-500"
          hint="Usuarios com acesso liberado"
        />
        <AdminMetricCard
          value={stats.inativos}
          label="Inativos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accentClass="text-rose-500"
          hint="Usuarios com acesso bloqueado"
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
          label="Tecnicos"
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

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`} aria-busy={loading || saving}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Gerenciar usuarios</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Adicione, edite, inative e reative os usuarios do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleForm}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${primaryButton}`}
          >
            <UserPlus className="h-4 w-4" />
            {showForm ? "Fechar formulario" : "Novo usuario"}
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
                  {editingUserId ? "Editar usuario" : "Novo usuario"}
                </h3>
                <p className={`text-sm ${mutedText}`}>
                  {editingUserId
                    ? "Atualize os dados do usuario selecionado."
                    : "Cadastre um novo acesso para a operacao."}
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

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2" aria-busy={saving}>
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
                <span className={`mb-2 block text-sm font-medium ${titleText}`}>E-mail</span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                />
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-medium ${titleText}`}>Perfil</span>
                <select
                  id={roleId}
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
                  <option value="tecnico">Tecnico</option>
                  <option value="atendente">Atendente</option>
                </select>
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                  {editingUserId ? "Nova senha (opcional)" : "Senha inicial"}
                </span>
                <input
                  id={senhaId}
                  type="password"
                  autoComplete={editingUserId ? "new-password" : "new-password"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                />
              </label>

              <label className="block">
                <span className={`mb-2 block text-sm font-medium ${titleText}`}>
                  {editingUserId ? "Confirmar nova senha" : "Confirmar senha"}
                </span>
                <input
                  id={confirmarSenhaId}
                  type="password"
                  autoComplete="new-password"
                  value={form.passwordConfirmation}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      passwordConfirmation: event.target.value,
                    }))
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
                className={`rounded-2xl border px-4 py-3 text-sm md:col-span-2 ${
                  isDark
                    ? "border-blue-900 bg-blue-950/50 text-blue-200"
                    : "border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                A senha inicial deve seguir os padroes fortes do sistema. No primeiro acesso, o
                usuario sera obrigado a definir uma nova senha antes de continuar.
              </div>

              <div className="grid gap-2 md:col-span-2 md:grid-cols-2 xl:grid-cols-3">
                {requisitosSenha.map((requisito) => (
                  <div
                    key={requisito.id}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      requisito.ok
                        ? isDark
                          ? "border-emerald-900 bg-emerald-950/50 text-emerald-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isDark
                          ? "border-slate-800 bg-slate-950 text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          requisito.ok ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span>{requisito.label}</span>
                    </div>
                  </div>
                ))}
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
                        ? "Salvar alteracoes"
                        : "Criar usuario"}
                  </button>

                  {editingUserId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
                    >
                      Cancelar edicao
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        ) : null}

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_240px_220px]" role="search" aria-label="Buscar e filtrar usuários">
          <label className="relative block" htmlFor={buscaId}>
            <span className="sr-only">Buscar usuários</span>
            <Search
              className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
            />
            <input
              id={buscaId}
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar usuarios..."
              className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            />
          </label>

          <label className="block" htmlFor={perfilFiltroId}>
            <span className="sr-only">Filtrar por perfil</span>
            <select
              id={perfilFiltroId}
              value={perfilFiltro}
              onChange={(event) =>
                setPerfilFiltro(event.target.value as PerfilUsuario | "todos")
              }
              className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
            >
              <option value="todos">Todos os perfis</option>
              <option value="administrador">Administrador</option>
              <option value="tecnico">Tecnico</option>
              <option value="atendente">Atendente</option>
            </select>
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
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Usuarios inativos perdem acesso imediatamente ao sistema. A reativacao libera o
            login novamente, sem apagar o historico das ordens de servico.
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <caption id={tabelaCaptionId} className="sr-only">
                Tabela de usuários com nome, e-mail, perfil, valor por hora, status e ações administrativas.
              </caption>
              <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th scope="col" className="p-4 text-left font-semibold">Nome</th>
                  <th scope="col" className="p-4 text-left font-semibold">Email</th>
                  <th scope="col" className="p-4 text-left font-semibold">Perfil</th>
                  <th scope="col" className="p-4 text-left font-semibold">Valor/hora</th>
                  <th scope="col" className="p-4 text-left font-semibold">Status</th>
                  <th scope="col" className="p-4 text-left font-semibold">Data de criacao</th>
                  <th scope="col" className="p-4 text-left font-semibold">Atualizado em</th>
                  <th scope="col" className="p-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center">
                      <span className={mutedText}>Carregando usuarios...</span>
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center">
                      <span className={mutedText}>Nenhum usuario encontrado.</span>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => {
                    const isCurrentUser = usuario.id === currentUser.id;
                    const statusEmProcessamento = processandoStatusId === usuario.id;

                    return (
                      <tr
                        key={usuario.id}
                        className={`border-t border-slate-200 transition dark:border-slate-800 ${rowHover}`}
                      >
                        <th scope="row" className="p-4 text-left font-medium">
                          <div className="flex items-center gap-2">
                            <span>{usuario.name}</span>
                            {isCurrentUser ? (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Atual
                              </span>
                            ) : null}
                          </div>
                        </th>
                        <td className="p-4">{usuario.email}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadge(usuario.role)}`}
                          >
                            {roleLabel(usuario.role)}
                          </span>
                        </td>
                        <td className="p-4">
                          {usuario.valor_hora
                            ? `R$ ${Number(usuario.valor_hora).toFixed(2).replace(".", ",")}`
                            : "-"}
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
                              aria-label={`Editar usuário ${usuario.name}`}
                              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${secondaryButton}`}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>

                            <button
                              type="button"
                              title={
                                isCurrentUser && usuario.is_active
                                  ? "Seu proprio usuario nao pode ser inativado."
                                  : undefined
                              }
                              disabled={statusEmProcessamento || (isCurrentUser && usuario.is_active)}
                              onClick={() => void alternarStatusUsuario(usuario)}
                              aria-label={
                                usuario.is_active
                                  ? `Inativar usuário ${usuario.name}`
                                  : `Reativar usuário ${usuario.name}`
                              }
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
          <div
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginação da lista de usuários"
          >
            <p className={`text-sm ${mutedText}`}>
              Exibindo {usuarios.length} de {totalUsuarios}{" "}
              {totalUsuarios === 1 ? "usuario" : "usuarios"}.
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
                Pagina {paginaAtual} de {ultimaPagina}
              </span>
              <button
                type="button"
                disabled={paginaAtual >= ultimaPagina || loading}
                onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, ultimaPagina))}
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
              >
                Proxima
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
  if (role === "tecnico") return "Tecnico";
  return "Atendente";
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR");
}
