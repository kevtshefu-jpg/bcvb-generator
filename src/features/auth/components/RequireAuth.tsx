import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { MemberRole } from "../../../data/memberDirectory";

export function RequireAuth({ roles }: { roles?: MemberRole[] }) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/espace" replace />;
  }

  return <Outlet />;
}
