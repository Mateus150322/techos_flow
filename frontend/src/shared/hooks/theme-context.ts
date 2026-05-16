import { createContext } from "react";

export type AppTheme = "dark" | "light";

export type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

export const THEME_STORAGE_KEY = "techos-theme";
const LEGACY_THEME_STORAGE_KEY = "theme";

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function getInitialTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme =
    window.localStorage.getItem(THEME_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "light";
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
}
