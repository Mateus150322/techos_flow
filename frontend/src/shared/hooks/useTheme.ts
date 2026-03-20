import { useEffect, useState } from "react";

export type AppTheme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}