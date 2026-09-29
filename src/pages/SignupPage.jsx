import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch } from "../lib/api";

function SignupPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // GuestOnly redirects away once login() stores the token.
  const handleSignup = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPass) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/signup", {
        method: "POST",
        body: { name, email, username, password, confirmPass },
      });
      login(data.token);
    } catch (err) {
      setError(err.detail ?? "Something went wrong. Please try again");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        <p className="auth-subtitle">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSignup} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPass">Confirm Password</label>
            <input
              type="password"
              id="confirmPass"
              autoComplete="new-password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
