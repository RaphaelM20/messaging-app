import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch } from "../lib/api";

const GUEST_CREDENTIALS = { username: "guest", password: "guest123" };

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Which login is in flight: "credentials", "guest" or null.
  const [pending, setPending] = useState(null);

  // GuestOnly redirects away once login() stores the token.
  const authenticate = async (credentials, kind) => {
    if (pending) return;
    setError("");
    setPending(kind);
    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: credentials,
      });
      login(data.token);
    } catch (err) {
      setError(
        err.status === 401
          ? "Invalid username or password"
          : "Something went wrong. Please try again",
      );
      setPending(null);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    authenticate({ username: username.trim(), password }, "credentials");
  };

  const handleGuestLogin = () => authenticate(GUEST_CREDENTIALS, "guest");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={!!pending}>
            {pending === "credentials" ? "Logging in…" : "Login"}
          </button>
        </form>
        <button
          type="button"
          className="auth-btn-guest"
          onClick={handleGuestLogin}
          disabled={!!pending}
        >
          {pending === "guest" ? "Signing in as guest…" : "Continue as Guest"}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
