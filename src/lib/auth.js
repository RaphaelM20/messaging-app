import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "authToken";

// Shared public demo account used by "Continue as guest".
export const GUEST_USERNAME = "guest";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the
    // session then lasts only as long as the in-memory auth state.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // See storeToken.
  }
}

// Returns the token's payload, or null if it is missing, malformed or expired.
export function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Reads the stored token, discarding it if it is no longer usable.
export function getValidStoredToken() {
  const token = getToken();
  if (token && !decodeToken(token)) {
    clearToken();
    return null;
  }
  return token;
}
