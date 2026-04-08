import { Navigate } from "react-router-dom";

import { useCurrentUser } from "@/shared/auth/session";
import { AdminDashboardContent } from "./AdminDashboardContent";
import { AtendenteDashboardContent } from "./AtendenteDashboardContent";

export default function DashboardPage() {
  const currentUser = useCurrentUser();

  if (currentUser.role === "tecnico") {
    return <Navigate to="/tecnico" replace />;
  }

  if (currentUser.role === "administrador") {
    return <AdminDashboardContent currentUser={currentUser} />;
  }

  return <AtendenteDashboardContent currentUser={currentUser} />;
}
