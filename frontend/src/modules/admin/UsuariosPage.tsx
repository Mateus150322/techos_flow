import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { AdminShell } from "./AdminShell";
import { ColaboradoresOperacionaisSection } from "./components/ColaboradoresOperacionaisSection";
import { UsuariosManagementSection } from "./components/UsuariosManagementSection";
import { UsuariosMetricsSection } from "./components/UsuariosMetricsSection";
import {
  atualizarUsuario,
  criarUsuario,
  listarUsuarios,
  type PerfilUsuario,
  type UsuarioAdmin,
} from "./usuarios.service";
import {
  INITIAL_USUARIO_FORM,
  type UsuarioFormState,
} from "./usuarios.utils";
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
  const [form, setForm] = useState<UsuarioFormState>(INITIAL_USUARIO_FORM);
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

  function updateFormField<K extends keyof UsuarioFormState>(
    field: K,
    value: UsuarioFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(INITIAL_USUARIO_FORM);
    setEditingUserId(null);
    setShowForm(false);
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
      return;
    }

    setEditingUserId(null);
    setForm(INITIAL_USUARIO_FORM);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
          getApiErrorMessage(error, "Não foi possível salvar o usuário."),
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
          : "Usuário inativado com sucesso.",
      );

      await carregarUsuarios();
    } catch (error) {
      setErro(
        getApiErrorMessage(error, "Não foi possível atualizar o status do usuário."),
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
      <UsuariosMetricsSection
        stats={stats}
        cardBg={cardBg}
        titleText={titleText}
        mutedText={mutedText}
      />

      <UsuariosManagementSection
        currentUserId={currentUser.id ?? ""}
        loading={loading}
        saving={saving}
        erro={erro}
        sucesso={sucesso}
        showForm={showForm}
        editingUserId={editingUserId}
        form={form}
        requisitosSenha={requisitosSenha}
        busca={busca}
        perfilFiltro={perfilFiltro}
        statusFiltro={statusFiltro}
        usuarios={usuarios}
        paginaAtual={paginaAtual}
        ultimaPagina={ultimaPagina}
        totalUsuarios={totalUsuarios}
        processandoStatusId={processandoStatusId}
        isDark={isDark}
        cardBg={cardBg}
        softBg={softBg}
        titleText={titleText}
        mutedText={mutedText}
        inputBg={inputBg}
        infoBox={infoBox}
        rowHover={rowHover}
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        onToggleForm={toggleForm}
        onResetForm={resetForm}
        onSubmit={handleSubmit}
        onChangeForm={updateFormField}
        onBuscaChange={setBusca}
        onPerfilFiltroChange={setPerfilFiltro}
        onStatusFiltroChange={setStatusFiltro}
        onEdit={startEditing}
        onToggleStatus={(usuario) => void alternarStatusUsuario(usuario)}
        onPaginaAnterior={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
        onPaginaSeguinte={() => setPaginaAtual((prev) => Math.min(prev + 1, ultimaPagina))}
      />

      <ColaboradoresOperacionaisSection isDark={isDark} />
    </AdminShell>
  );
}
