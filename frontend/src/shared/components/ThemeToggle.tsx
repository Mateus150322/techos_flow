import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/shared/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      className="app-button-outline inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition"
      aria-label="Alternar tema"
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline">{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
