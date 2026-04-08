import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { me } from "@/modules/auth/auth.service";
import { clearSession, getStoredToken } from "./session";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getStoredToken();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!token) {
        if (!alive) {
          return;
        }

        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        await me();

        if (!alive) {
          return;
        }

        setAllowed(true);
      } catch {
        clearSession();

        if (!alive) {
          return;
        }

        setAllowed(false);
      }

      if (!alive) {
        return;
      }

      setChecking(false);
    }

    void check();

    return () => {
      alive = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-sm text-zinc-400">Verificando sessao...</div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
