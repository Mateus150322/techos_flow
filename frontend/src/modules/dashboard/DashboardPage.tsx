import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { listarTodasOrdens, type OrdemServico } from "@/modules/ordensServico/ordensServico.service";
import { useCurrentUser } from "@/shared/auth/session";
import { AdminDashboardContent } from "./AdminDashboardContent";
import { AtendenteDashboardContent } from "./AtendenteDashboardContent";

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();

  useEffect(() => {
    async function carregarOrdens() {
      try {
        setLoading(true);

        const response = await listarTodasOrdens({ include: "tecnicoResponsavel" });
        setOrders(response.data ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    void carregarOrdens();
  }, []);

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role === "administrador") {
    return (
      <AdminDashboardContent
        currentUser={currentUser}
        orders={orders}
        loading={loading}
      />
    );
  }

  return (
    <AtendenteDashboardContent
      currentUser={currentUser}
      orders={orders}
      loading={loading}
    />
  );
}
