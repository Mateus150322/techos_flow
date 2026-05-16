import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { me } from "@/modules/auth/auth.service";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import {
  clearSession,
  getDefaultRouteForRole,
  getStoredToken,
  hasFreshSessionValidation,
  useCurrentUser,
  type UserRole,
} from "./session";

type RedirectState = {
  from?: ReturnType<typeof useLocation>;
  authMessage?: string;
};

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const location = useLocation();
  const token = getStoredToken();
  const currentUser = useCurrentUser();

  const [checking, setChecking] = useState(() => Boolean(token) && (!currentUser.id || !hasFreshSessionValidation()));
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function validateSession() {
      if (!token) {
        if (!alive) {
          return;
        }

        setAuthMessage(null);
        setChecking(false);
        return;
      }

      if (currentUser.id && hasFreshSessionValidation()) {
        if (!alive) {
          return;
        }

        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        await me();

        if (!alive) {
          return;
        }

        setAuthMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, "");

        clearSession();

        if (!alive) {
          return;
        }

        setAuthMessage(message || null);
      } finally {
        if (alive) {
          setChecking(false);
        }
      }
    }

    void validateSession();

    return () => {
      alive = false;
    };
  }, [token, currentUser.id]);

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

  if (authMessage) {
    const redirectState: RedirectState = {
      from: location,
      authMessage,
    };

    return <Navigate to="/login" replace state={redirectState} />;
  }

  if (currentUser.must_change_password && location.pathname !== "/primeiro-acesso") {
    return <Navigate to="/primeiro-acesso" replace state={{ from: location }} />;
  }

  if (!currentUser.must_change_password && location.pathname === "/primeiro-acesso") {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return <>{children}</>;
}
