import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";

// Login and signup pages: once authenticated, send the user back to where
// RequireAuth intercepted them (or home).
function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from;
    const to = from ? `${from.pathname}${from.search ?? ""}` : "/";
    return <Navigate to={to} replace />;
  }
  return children;
}

export default GuestOnly;
