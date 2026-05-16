import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  ThemeContext,
  THEME_STORAGE_KEY,
  applyTheme,
  getInitialTheme,
  type AppTheme,
} from "./theme-context";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key === THEME_STORAGE_KEY &&
        (event.newValue === "light" || event.newValue === "dark")
      ) {
        setTheme(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: (nextTheme: AppTheme) => setTheme(nextTheme),
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
