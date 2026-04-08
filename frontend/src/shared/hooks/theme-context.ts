import { createContext } from "react";

export type AppTheme = "dark" | "light";

export type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  document.body.style.backgroundColor = isDark ? "#020617" : "#f8fafc";
  document.body.style.color = isDark ? "#f8fafc" : "#0f172a";
}
