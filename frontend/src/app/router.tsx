import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/modules/auth/LoginPage";
import DashboardPage from "@/modules/DashboardPage";
import PrivateRoute from "@/shared/auth/PrivateRoute";
import OrdensPage from "@/modules/ordensServico/OrdensPage";
import OrdemDetalhePage from "@/modules/ordensServico/OrdemDetalhePage";
import NovaOrdemPage from "@/modules/ordensServico/NovaOrdemPage";
import TecnicoPage from "@/modules/ordensServico/TecnicoPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

        {/* ✅ AQUI dentro */}
        <Route
          path="/tecnico"
          element={
            <PrivateRoute>
              <TecnicoPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}