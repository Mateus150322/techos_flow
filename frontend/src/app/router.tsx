import { BrowserRouter, Route, Routes } from "react-router-dom";

import LoginPage from "@/modules/auth/LoginPage";
import PrimeiroAcessoPage from "@/modules/auth/PrimeiroAcessoPage";
import DashboardPage from "@/modules/dashboard/DashboardPage";
import RelatoriosPage from "@/modules/admin/RelatoriosPage";
import UsuariosPage from "@/modules/admin/UsuariosPage";
import NovaOrdemPage from "@/modules/ordensServico/NovaOrdemPage";
import OrdemDetalhePage from "@/modules/ordensServico/OrdemDetalhePage";
import OrdensPage from "@/modules/ordensServico/OrdensPage";
import TecnicoPage from "@/modules/ordensServico/TecnicoPage";
import PrivateRoute from "@/shared/auth/PrivateRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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
            <PrivateRoute>
              <NovaOrdemPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/tecnico"
          element={
            <PrivateRoute>
              <TecnicoPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/relatorios"
          element={
            <PrivateRoute>
              <RelatoriosPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <PrivateRoute>
              <UsuariosPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
