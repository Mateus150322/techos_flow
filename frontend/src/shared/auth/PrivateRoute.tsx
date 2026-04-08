import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { me } from "@/modules/auth/auth.service";
import {
  clearSession,
  getDefaultRouteForRole,
  getStoredToken,
} from "./session";
import { getApiErrorMessage } from "@/shared/utils/apiError";

type RedirectState = {
  from?: ReturnType<typeof useLocation>;
  authMessage?: string;
};

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getStoredToken();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirectState, setRedirectState] = useState<RedirectState | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!token) {
        if (!alive) {
          return;
        }

        setAllowed(false);
        setRedirectTo(null);
        setRedirectState(null);
        setChecking(false);
        return;
      }

      try {
        const user = await me();

        if (!alive) {
          return;
        }

        if (user.must_change_password && location.pathname !== "/primeiro-acesso") {
          setAllowed(false);
          setRedirectTo("/primeiro-acesso");
          setRedirectState({ from: location });
        } else if (!user.must_change_password && location.pathname === "/primeiro-acesso") {
          setAllowed(false);
          setRedirectTo(getDefaultRouteForRole(user.role));
          setRedirectState(null);
        } else {
          setAllowed(true);
          setRedirectTo(null);
          setRedirectState(null);
        }
      } catch (error) {
        const message = getApiErrorMessage(error, "");

        clearSession();

        if (!alive) {
          return;
        }

        setAllowed(false);
        setRedirectTo("/login");
        setRedirectState({
          from: location,
          authMessage: message || undefined,
        });
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
  }, [location, token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-sm text-zinc-400">Verificando sessão...</div>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace state={redirectState ?? undefined} />;
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={redirectState ?? { from: location }} />;
  }

  return <>{children}</>;
}
