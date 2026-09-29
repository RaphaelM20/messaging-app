import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch } from "../lib/api";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";

const FIELDS = [
  { id: "name", label: "Name", type: "text", autoComplete: "name" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    id: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    hint: "4–20 characters: letters, numbers and spaces",
  },
  {
    id: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    hint: "6–20 characters",
  },
  {
    id: "confirmPass",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
  },
];

const EMPTY_FORM = Object.fromEntries(FIELDS.map((field) => [field.id, ""]));

function SignupPage() {
  const { login } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (e) => {
    const { id, value } = e.target;
    setForm((current) => ({ ...current, [id]: value }));
  };

  // GuestOnly redirects away once login() stores the token.
  const handleSignup = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (form.password !== form.confirmPass) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/signup", { method: "POST", body: form });
      login(data.token);
    } catch (err) {
      setError(err.detail ?? "Something went wrong. Please try again");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth__card card" aria-labelledby="signup-title">
        <h1 id="signup-title" className="auth__title">
          Create an account
        </h1>
        <p className="auth__subtitle">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <form onSubmit={handleSignup} className="auth__form">
          {error && <Alert>{error}</Alert>}
          {FIELDS.map((field) => (
            <div key={field.id} className="field">
              <label htmlFor={field.id} className="field__label">
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                className="input"
                autoComplete={field.autoComplete}
                value={form[field.id]}
                onChange={updateField}
                aria-describedby={field.hint ? `${field.id}-hint` : undefined}
                required
              />
              {field.hint && (
                <p id={`${field.id}-hint`} className="field__hint">
                  {field.hint}
                </p>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="button button--primary button--block auth__submit"
            disabled={submitting}
          >
            {submitting && <Spinner />}
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default SignupPage;
