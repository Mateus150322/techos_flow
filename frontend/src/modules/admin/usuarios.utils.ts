import type { PerfilUsuario } from "./usuarios.service";

export type UsuarioFormState = {
  name: string;
  email: string;
  role: PerfilUsuario;
  password: string;
  passwordConfirmation: string;
  valorHora: string;
};

export const INITIAL_USUARIO_FORM: UsuarioFormState = {
  name: "",
  email: "",
  role: "atendente",
  password: "",
  passwordConfirmation: "",
  valorHora: "",
};

export function roleBadge(role: PerfilUsuario) {
  if (role === "administrador") return "bg-violet-100 text-violet-700";
  if (role === "tecnico") return "bg-emerald-100 text-emerald-700";
  return "bg-blue-100 text-blue-700";
}

export function roleLabel(role: PerfilUsuario) {
  if (role === "administrador") return "Administrador";
  if (role === "tecnico") return "Técnico";
  return "Atendente";
}

export function formatUsuarioDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatValorHora(valorHora?: string | number | null) {
  if (!valorHora) {
    return "-";
  }

  return `R$ ${Number(valorHora).toFixed(2).replace(".", ",")}`;
}
