import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { me } from "@/modules/auth/auth.service";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!token) {
        if (!alive) return;
        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        await me(); // valida token no backend
        if (!alive) return;
        setAllowed(true);
      } catch {
        // token inválido/expirado
        localStorage.removeItem("token");
        if (!alive) return;
        setAllowed(false);
      } finally {
        if (!alive) return;
        setChecking(false);
      }
    }

    check();

    return () => {
      alive = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-sm text-zinc-400">Verificando sessão...</div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
  
}