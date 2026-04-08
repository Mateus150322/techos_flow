import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Pencil, PlusCircle, Search, UserPlus, X } from "lucide-react";

import { AdminShell } from "./AdminShell";
import {
  atualizarUsuario,
  criarUsuario,
  listarTodosUsuarios,
  type PerfilUsuario,
  type UsuarioAdmin,
} from "./usuarios.service";
import { useCurrentUser } from "@/shared/auth/session";
import { useTheme } from "@/shared/hooks/useTheme";

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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const response = await listarTodosUsuarios({
        q: busca,
        role: perfilFiltro,
      });

      setUsuarios(response.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
      setErro("Nao foi possivel carregar os usuarios.");
    } finally {
      setLoading(false);
    }
  }, [busca, perfilFiltro]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarUsuarios();
    }, busca.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busca, perfilFiltro, carregarUsuarios]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingUserId(null);
    setShowForm(false);
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
        setErro("A confirmacao de senha precisa ser igual a senha informada.");
        setSaving(false);
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
        setSucesso("Usuario atualizado com sucesso.");
      } else {
        await criarUsuario({
          ...payload,
          password: payload.password ?? "",
        });
        setSucesso("Usuario criado com sucesso.");
      }

      resetForm();
      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao salvar usuario:", error);
      setErro("Nao foi possivel salvar o usuario.");
    } finally {
      setSaving(false);
    }
  }

  const totalAdmins = usuarios.filter((usuario) => usuario.role === "administrador").length;
  const totalTecnicos = usuarios.filter((usuario) => usuario.role === "tecnico").length;
  const totalAtendentes = usuarios.filter((usuario) => usuario.role === "atendente").length;
  const cadastrosRecentes = usuarios.filter((usuario) => {
    if (!usuario.created_at) {
      return false;
    }

    const criadoEm = new Date(usuario.created_at).getTime();
    const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return Number.isFinite(criadoEm) && criadoEm >= limite;
  }).length;

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

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role !== "administrador") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminShell currentUser={currentUser} activeTab="usuarios">
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          value={usuarios.length}
          label="Cadastros exibidos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accent="text-slate-900 dark:text-zinc-50"
        />
        <MetricCard
          value={totalAdmins}
          label="Administradores"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accent="text-violet-500"
        />
        <MetricCard
          value={totalTecnicos}
          label="Tecnicos"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accent="text-blue-500"
        />
        <MetricCard
          value={totalAtendentes}
          label="Atendentes"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accent="text-amber-500"
        />
        <MetricCard
          value={cadastrosRecentes}
          label="Ultimos 7 dias"
          cardBg={cardBg}
          titleText={titleText}
          mutedText={mutedText}
          accent="text-emerald-500"
        />
      </section>

      <section className={`rounded-3xl border p-6 shadow-sm ${cardBg}`}>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-2xl font-semibold ${titleText}`}>Gerenciar usuarios</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Adicione, edite e acompanhe os usuarios do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);

              if (showForm) {
                resetForm();
              } else {
                setEditingUserId(null);
                setForm(INITIAL_FORM);
              }
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${primaryButton}`}
          >
            <UserPlus className="h-4 w-4" />
            {showForm ? "Fechar formulario" : "Novo usuario"}
          </button>
        </div>

        {showForm && (
          <div className={`mb-6 rounded-3xl border p-5 ${softBg}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 text-blue-500" />
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

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
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
                <option value="tecnico">Tecnico</option>
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

              {!editingUserId && (
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
              )}

              <div className="lg:col-span-2">
                {erro && (
                  <div
                    className={`mb-3 rounded-2xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-red-900 bg-red-950 text-red-300"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {erro}
                  </div>
                )}

                {sucesso && (
                  <div
                    className={`mb-3 rounded-2xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {sucesso}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
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

                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${secondaryButton}`}
                    >
                      Cancelar edicao
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-[1fr_240px]">
          <label className="relative block">
            <Search
              className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedText}`}
            />
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar usuarios..."
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
            <option value="tecnico">Tecnico</option>
            <option value="atendente">Atendente</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className={isDark ? "bg-zinc-950 text-zinc-300" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th className="p-4 text-left font-semibold">Nome</th>
                  <th className="p-4 text-left font-semibold">Email</th>
                  <th className="p-4 text-left font-semibold">Perfil</th>
                  <th className="p-4 text-left font-semibold">Data de criacao</th>
                  <th className="p-4 text-left font-semibold">Atualizado em</th>
                  <th className="p-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center">
                      <span className={mutedText}>Carregando usuarios...</span>
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center">
                      <span className={mutedText}>Nenhum usuario encontrado.</span>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className={`border-t border-slate-200 transition dark:border-zinc-800 ${rowHover}`}
                    >
                      <td className="p-4 font-medium">{usuario.name}</td>
                      <td className="p-4">{usuario.email}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadge(usuario.role)}`}
                        >
                          {roleLabel(usuario.role)}
                        </span>
                      </td>
                      <td className="p-4">{formatDate(usuario.created_at)}</td>
                      <td className="p-4">{formatDate(usuario.updated_at)}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => startEditing(usuario)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${secondaryButton}`}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
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
            Exibindo {usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}.
          </p>
        )}
      </section>
    </AdminShell>
  );
}

function MetricCard({
  value,
  label,
  cardBg,
  titleText,
  mutedText,
  accent,
}: {
  value: number;
  label: string;
  cardBg: string;
  titleText: string;
  mutedText: string;
  accent: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${cardBg}`}>
      <p className={`text-4xl font-semibold ${accent}`}>{value}</p>
      <p className={`mt-1 text-sm ${mutedText}`}>{label}</p>
      <p className={`mt-4 text-sm ${titleText}`}>Painel administrativo</p>
    </div>
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
