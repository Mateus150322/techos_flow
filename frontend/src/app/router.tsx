import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import PrivateRoute from "@/shared/auth/PrivateRoute";

const LoginPage = lazy(() => import("@/modules/auth/LoginPage"));
const EsqueciSenhaPage = lazy(() => import("@/modules/auth/EsqueciSenhaPage"));
const PrimeiroAcessoPage = lazy(() => import("@/modules/auth/PrimeiroAcessoPage"));
const RedefinirSenhaPage = lazy(() => import("@/modules/auth/RedefinirSenhaPage"));
const DashboardPage = lazy(() => import("@/modules/dashboard/DashboardPage"));
const CalendarioCorporativoPage = lazy(() => import("@/modules/admin/CalendarioCorporativoPage"));
const HorasExtrasPage = lazy(() => import("@/modules/admin/HorasExtrasPage"));
const RelatoriosPage = lazy(() => import("@/modules/admin/RelatoriosPage"));
const UsuariosPage = lazy(() => import("@/modules/admin/UsuariosPage"));
const NovaOrdemPage = lazy(() => import("@/modules/ordensServico/NovaOrdemPage"));
const OrdemDetalhePage = lazy(() => import("@/modules/ordensServico/OrdemDetalhePage"));
const OrdensPage = lazy(() => import("@/modules/ordensServico/OrdensPage"));
const TecnicoPage = lazy(() => import("@/modules/ordensServico/TecnicoPage"));

function RouteLoadingFallback() {
  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="app-card w-full max-w-md px-6 py-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-[var(--text-main)]">Carregando tela...</p>
        <p className="app-muted mt-2 text-sm">
          Estamos preparando a próxima área do sistema.
        </p>
      </div>
    </div>
  );
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />

          <Route
            path="/primeiro-acesso"
            element={
              <PrivateRoute>
                <PrimeiroAcessoPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/ordens-servico"
            element={
              <PrivateRoute>
                <OrdensPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/ordens-servico/:id"
            element={
              <PrivateRoute>
                <OrdemDetalhePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/ordens-servico/nova"
            element={
              <PrivateRoute allowedRoles={["atendente"]}>
                <NovaOrdemPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/tecnico"
            element={
              <PrivateRoute allowedRoles={["tecnico"]}>
                <TecnicoPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/horas-extras"
            element={
              <PrivateRoute allowedRoles={["administrador"]}>
                <HorasExtrasPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/calendario"
            element={
              <PrivateRoute allowedRoles={["administrador"]}>
                <CalendarioCorporativoPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/relatorios"
            element={
              <PrivateRoute allowedRoles={["administrador"]}>
                <RelatoriosPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute allowedRoles={["administrador"]}>
                <UsuariosPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
