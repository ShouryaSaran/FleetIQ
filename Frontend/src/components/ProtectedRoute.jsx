import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logger from "../utils/logger";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <span className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    logger.nav(`Redirecting to /login (not authenticated) for ${location.pathname}`);
    return <Navigate to="/login" replace />;
  }

  logger.nav(`Access granted: ${location.pathname} user=${user?.username} role=${user?.role_name}`);
  return children;
}
