import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      className={cn(
        "app-button-outline inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition sm:min-w-[6.25rem]",
        className
      )}
      aria-label="Alternar tema"
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline">{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}
