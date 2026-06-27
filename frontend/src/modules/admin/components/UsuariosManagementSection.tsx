import { useId, type FormEvent } from "react";
import { useEffect, useRef } from "react";
import { Pencil, Search, ShieldAlert, UserPlus, X } from "lucide-react";

import type { PerfilUsuario, UsuarioAdmin } from "../usuarios.service";
import {
  formatUsuarioDate,
  formatValorHora,
  roleBadge,
  roleLabel,
  type UsuarioFormState,
} from "../usuarios.utils";

type PasswordRequirement = {
  id: string;
  label: string;
  ok: boolean;
};

type Props = {
  currentUserId: string;
  loading: boolean;
  saving: boolean;
  erro: string;
  sucesso: string;
  showForm: boolean;
  editingUserId: string | null;
  form: UsuarioFormState;
  requisitosSenha: PasswordRequirement[];
  busca: string;
  perfilFiltro: PerfilUsuario | "todos";
  statusFiltro: "todos" | "ativos" | "inativos";
  usuarios: UsuarioAdmin[];
  paginaAtual: number;
  ultimaPagina: number;
  totalUsuarios: number;
  processandoStatusId: string | null;
  isDark: boolean;
  cardBg: string;
  softBg: string;
  titleText: string;
  mutedText: string;
  inputBg: string;
  infoBox: string;
  rowHover: string;
  primaryButton: string;
  secondaryButton: string;
  onToggleForm: () => void;
  onResetForm: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangeForm: <K extends keyof UsuarioFormState>(
    field: K,
    value: UsuarioFormState[K],
  ) => void;
  onBuscaChange: (value: string) => void;
  onPerfilFiltroChange: (value: PerfilUsuario | "todos") => void;
  onStatusFiltroChange: (value: "todos" | "ativos" | "inativos") => void;
  onEdit: (usuario: UsuarioAdmin) => void;
  onToggleStatus: (usuario: UsuarioAdmin) => void;
  onPaginaAnterior: () => void;
  onPaginaSeguinte: () => void;
};

export function UsuariosManagementSection({
  currentUserId,
  loading,
  saving,
  erro,
  sucesso,
  showForm,
  editingUserId,
  form,
  requisitosSenha,
  busca,
  perfilFiltro,
  statusFiltro,
  usuarios,
  paginaAtual,
  ultimaPagina,
  totalUsuarios,
  processandoStatusId,
  isDark,
  cardBg,
  softBg,
  titleText,
  mutedText,
  inputBg,
  infoBox,
  rowHover,
  primaryButton,
  secondaryButton,
  onToggleForm,
  onResetForm,
  onSubmit,
  onChangeForm,
  onBuscaChange,
  onPerfilFiltroChange,
  onStatusFiltroChange,
  onEdit,
  onToggleStatus,
  onPaginaAnterior,
  onPaginaSeguinte,
}: Props) {
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
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const nomeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      window.setTimeout(() => {
        nomeInputRef.current?.focus({ preventScroll: true });
      }, 250);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingUserId, showForm]);

  return (
    <section className={`rounded-3xl border p-4 shadow-sm sm:p-6 ${cardBg}`} aria-busy={loading || saving}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className={`text-xl font-semibold sm:text-2xl ${titleText}`}>Gerenciar usuários</h2>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Adicione, edite, inative e reative os usuários do sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleForm}
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
        <div ref={formPanelRef} className={`mb-6 scroll-mt-4 rounded-3xl border p-4 sm:p-5 ${softBg}`}>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
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
              onClick={onResetForm}
              className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition sm:w-auto ${secondaryButton}`}
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2" aria-busy={saving}>
            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Nome</span>
              <input
                ref={nomeInputRef}
                id={nomeId}
                type="text"
                value={form.name}
                onChange={(event) => onChangeForm("name", event.target.value)}
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
                onChange={(event) => onChangeForm("email", event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              />
            </label>

            <label className="block">
              <span className={`mb-2 block text-sm font-medium ${titleText}`}>Perfil</span>
              <select
                id={roleId}
                value={form.role}
                onChange={(event) => onChangeForm("role", event.target.value as PerfilUsuario)}
                className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
              >
                <option value="administrador">Administrador</option>
                <option value="tecnico">Técnico</option>
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
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => onChangeForm("password", event.target.value)}
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
                onChange={(event) => onChangeForm("passwordConfirmation", event.target.value)}
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
                onChange={(event) => onChangeForm("valorHora", event.target.value)}
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
              A senha inicial deve seguir os padrões fortes do sistema. No primeiro acesso, o
              usuário será obrigado a definir uma nova senha antes de continuar.
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
              <div className="app-mobile-sticky-actions flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${primaryButton} disabled:cursor-not-allowed disabled:opacity-70`}
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
                    onClick={onResetForm}
                    className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
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
        className="mb-5 grid gap-4 lg:grid-cols-[1fr_240px_220px]"
        role="search"
        aria-label="Buscar e filtrar usuários"
      >
        <label className="relative block" htmlFor={buscaId}>
          <span className="sr-only">Buscar usuários</span>
          <Search
            className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
          />
          <input
            id={buscaId}
            type="text"
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            placeholder="Buscar usuários..."
            className={`w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />
        </label>

        <label className="block" htmlFor={perfilFiltroId}>
          <span className="sr-only">Filtrar por perfil</span>
          <select
            id={perfilFiltroId}
            value={perfilFiltro}
            onChange={(event) => onPerfilFiltroChange(event.target.value as PerfilUsuario | "todos")}
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          >
            <option value="todos">Todos os perfis</option>
            <option value="administrador">Administrador</option>
            <option value="tecnico">Técnico</option>
            <option value="atendente">Atendente</option>
          </select>
        </label>

        <label className="block" htmlFor={statusFiltroId}>
          <span className="sr-only">Filtrar por status</span>
          <select
            id={statusFiltroId}
            value={statusFiltro}
            onChange={(event) =>
              onStatusFiltroChange(event.target.value as "todos" | "ativos" | "inativos")
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
          Usuários inativos perdem acesso imediatamente ao sistema. A reativação libera o login
          novamente, sem apagar o histórico das ordens de serviço.
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        {loading ? (
          <div className={`rounded-3xl border p-6 text-center text-sm ${softBg} ${mutedText}`}>
            Carregando usuários...
          </div>
        ) : usuarios.length === 0 ? (
          <div className={`rounded-3xl border p-6 text-center text-sm ${softBg} ${mutedText}`}>
            Nenhum usuário encontrado.
          </div>
        ) : (
          usuarios.map((usuario) => (
            <UsuarioMobileCard
              key={usuario.id}
              usuario={usuario}
              currentUserId={currentUserId}
              processandoStatusId={processandoStatusId}
              isDark={isDark}
              titleText={titleText}
              mutedText={mutedText}
              secondaryButton={secondaryButton}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 xl:block">
          <table className="w-full table-fixed text-sm">
            <caption id={tabelaCaptionId} className="sr-only">
              Tabela de usuários com nome, e-mail, perfil, valor por hora, status e ações
              administrativas.
            </caption>
            <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
              <tr>
                <th scope="col" className="p-4 text-left font-semibold">Nome</th>
                <th scope="col" className="p-4 text-left font-semibold">Email</th>
                <th scope="col" className="p-4 text-left font-semibold">Perfil</th>
                <th scope="col" className="p-4 text-left font-semibold">Valor/hora</th>
                <th scope="col" className="p-4 text-left font-semibold">Status</th>
                <th scope="col" className="p-4 text-left font-semibold">Data de criação</th>
                <th scope="col" className="p-4 text-left font-semibold">Atualizado em</th>
                <th scope="col" className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    <span className={mutedText}>Carregando usuários...</span>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center">
                    <span className={mutedText}>Nenhum usuário encontrado.</span>
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const isCurrentUser = usuario.id === currentUserId;
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
                      <td className="p-4">{formatValorHora(usuario.valor_hora)}</td>
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
                      <td className="p-4">{formatUsuarioDate(usuario.created_at)}</td>
                      <td className="p-4">{formatUsuarioDate(usuario.updated_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(usuario)}
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
                                ? "Seu próprio usuário não pode ser inativado."
                                : undefined
                            }
                            disabled={statusEmProcessamento || (isCurrentUser && usuario.is_active)}
                            onClick={() => onToggleStatus(usuario)}
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

      {!loading ? (
        <div
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Paginação da lista de usuários"
        >
          <p className={`text-sm ${mutedText}`}>
            Exibindo {usuarios.length} de {totalUsuarios}{" "}
            {totalUsuarios === 1 ? "usuário" : "usuários"}.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={paginaAtual <= 1 || loading}
              onClick={onPaginaAnterior}
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
              onClick={onPaginaSeguinte}
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButton}`}
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UsuarioMobileCard({
  usuario,
  currentUserId,
  processandoStatusId,
  isDark,
  titleText,
  mutedText,
  secondaryButton,
  onEdit,
  onToggleStatus,
}: {
  usuario: UsuarioAdmin;
  currentUserId: string;
  processandoStatusId: string | null;
  isDark: boolean;
  titleText: string;
  mutedText: string;
  secondaryButton: string;
  onEdit: (usuario: UsuarioAdmin) => void;
  onToggleStatus: (usuario: UsuarioAdmin) => void;
}) {
  const isCurrentUser = usuario.id === currentUserId;
  const statusEmProcessamento = processandoStatusId === usuario.id;

  return (
    <article
      className={`rounded-3xl border p-4 shadow-sm ${
        isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-base font-semibold ${titleText}`}>{usuario.name}</h3>
            {isCurrentUser ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Atual
              </span>
            ) : null}
          </div>
          <p className={`mt-1 break-all text-sm ${mutedText}`}>{usuario.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadge(usuario.role)}`}>
            {roleLabel(usuario.role)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              usuario.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {usuario.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Valor/hora
          </dt>
          <dd className={`mt-1 text-sm ${titleText}`}>{formatValorHora(usuario.valor_hora)}</dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Criado em
          </dt>
          <dd className={`mt-1 text-sm ${titleText}`}>{formatUsuarioDate(usuario.created_at)}</dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedText}`}>
            Atualizado em
          </dt>
          <dd className={`mt-1 text-sm ${titleText}`}>{formatUsuarioDate(usuario.updated_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(usuario)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${secondaryButton}`}
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
          onClick={() => onToggleStatus(usuario)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            usuario.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
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
    </article>
  );
}




