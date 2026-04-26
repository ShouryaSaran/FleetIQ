import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Stay blank while restoring auth from localStorage — avoids a flash of the form
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
