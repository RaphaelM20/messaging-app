import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth-context";
import { apiFetch, isAbortError, setUnauthorizedHandler } from "../lib/api";
import {
  clearToken,
  decodeToken,
  getValidStoredToken,
  storeToken,
} from "../lib/auth";

// setTimeout overflows above ~24.8 days.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function AuthProvider({ children }) {
  const [token, setToken] = useState(getValidStoredToken);
  const [user, setUser] = useState(null);
  const [userError, setUserError] = useState(false);

  const login = useCallback((newToken) => {
    storeToken(newToken);
    setUser(null);
    setUserError(false);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setUserError(false);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Log out as soon as the token expires rather than waiting for a 401.
  useEffect(() => {
    const exp = decodeToken(token)?.exp;
    if (!exp) return;
    const delay = Math.min(
      Math.max(exp * 1000 - Date.now(), 0),
      MAX_TIMEOUT_MS,
    );
    const timeoutId = setTimeout(logout, delay);
    return () => clearTimeout(timeoutId);
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiFetch("/user/me", { signal: controller.signal })
      .then(setUser)
      .catch((err) => {
        if (!isAbortError(err)) setUserError(true);
      });
    return () => controller.abort();
  }, [token]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      currentUserId: decodeToken(token)?.id ?? null,
      user,
      userError,
      setUser,
      login,
      logout,
    }),
    [token, user, userError, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
