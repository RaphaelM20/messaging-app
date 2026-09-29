import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch } from "../lib/api";
import { GUEST_USERNAME } from "../lib/auth";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";

const GUEST_CREDENTIALS = { username: GUEST_USERNAME, password: "guest123" };

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
    <div className="auth">
      <section className="auth__card card" aria-labelledby="login-title">
        <h1 id="login-title" className="auth__title">
          Welcome back
        </h1>
        <p className="auth__subtitle">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
        <form onSubmit={handleLogin} className="auth__form">
          {error && <Alert>{error}</Alert>}
          <div className="field">
            <label htmlFor="username" className="field__label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password" className="field__label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="button button--primary button--block auth__submit"
            disabled={!!pending}
          >
            {pending === "credentials" && <Spinner />}
            {pending === "credentials" ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="divider">or</p>
        <button
          type="button"
          className="button button--secondary button--block"
          onClick={handleGuestLogin}
          disabled={!!pending}
        >
          {pending === "guest" && <Spinner />}
          {pending === "guest" ? "Signing in as guest…" : "Continue as guest"}
        </button>
      </section>
    </div>
  );
}

export default LoginPage;
