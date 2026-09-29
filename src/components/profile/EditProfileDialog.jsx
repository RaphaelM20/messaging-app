import { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { apiFetch } from "../../lib/api";
import Alert from "../ui/Alert";
import Avatar from "../ui/Avatar";
import Dialog from "../ui/Dialog";
import IconButton from "../ui/IconButton";
import Spinner from "../ui/Spinner";

// Mirrors the API's signup rules, which PUT /user/me does not enforce.
const USERNAME_PATTERN = /^[a-zA-Z0-9 ]{4,20}$/;

const TEXT_FIELDS = [
  { id: "name", label: "Name", autoComplete: "name" },
  {
    id: "username",
    label: "Username",
    autoComplete: "username",
    hint: "4–20 characters: letters, numbers and spaces",
  },
  { id: "bio", label: "Bio" },
];

function validate({ name, username }) {
  if (!name) return "Name is required";
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 4-20 characters: letters, numbers and spaces";
  }
  return null;
}

function toForm(user) {
  return {
    name: user.name ?? "",
    username: user.username ?? "",
    picture: user.picture ?? "",
    bio: user.bio ?? "",
  };
}

// Render only while editing: each mount starts from the saved profile.
function EditProfileDialog({ user, onClose }) {
  const { setUser } = useAuth();
  const [initial] = useState(() => toForm(user));
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const isDirty = Object.keys(form).some((key) => form[key] !== initial[key]);

  // Close, Cancel, Escape and backdrop clicks ask first if there are unsaved
  // changes; asking again (e.g. a second Escape) discards them.
  const requestClose = () => {
    if (isDirty && !confirmingDiscard) setConfirmingDiscard(true);
    else onClose();
  };

  const updateField = (e) => {
    const { id, value } = e.target;
    setForm((current) => ({ ...current, [id]: value }));
    setConfirmingDiscard(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const changes = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    const validationError = validate(changes);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await apiFetch("/user/me", {
        method: "PUT",
        body: changes,
      });
      // Keep only profile fields; the response includes the whole user row.
      setUser({
        name: updated.name,
        username: updated.username,
        picture: updated.picture,
        bio: updated.bio,
      });
      onClose();
    } catch {
      setError(
        "Couldn't save your profile. That username may already be taken.",
      );
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      onDismiss={requestClose}
      labelledBy="edit-profile-title"
    >
      <form className="dialog__content" onSubmit={handleSubmit} noValidate>
        <div className="dialog__header">
          <h2 id="edit-profile-title" className="dialog__title">
            Edit profile
          </h2>
          <IconButton
            icon="close"
            label="Close"
            variant="plain"
            onClick={requestClose}
          />
        </div>
        <div className="dialog__body">
          {error && <Alert>{error}</Alert>}
          <div className="profile-preview">
            <Avatar src={form.picture} name={form.name} size="lg" />
            <div className="field">
              <label htmlFor="picture" className="field__label">
                Picture URL
              </label>
              <input
                id="picture"
                type="url"
                className="input"
                value={form.picture}
                onChange={updateField}
                placeholder="https://…"
              />
            </div>
          </div>
          {TEXT_FIELDS.map((field) => (
            <div key={field.id} className="field">
              <label htmlFor={field.id} className="field__label">
                {field.label}
              </label>
              <input
                id={field.id}
                type="text"
                className="input"
                autoComplete={field.autoComplete}
                value={form[field.id]}
                onChange={updateField}
                aria-describedby={field.hint ? `${field.id}-hint` : undefined}
                data-autofocus={field.id === "name" || undefined}
              />
              {field.hint && (
                <p id={`${field.id}-hint`} className="field__hint">
                  {field.hint}
                </p>
              )}
            </div>
          ))}
        </div>
        <div
          className={`dialog__footer${confirmingDiscard ? " dialog__footer--confirm" : ""}`}
        >
          {confirmingDiscard ? (
            <>
              <span className="dialog__footer-note" role="status">
                Discard your changes?
              </span>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setConfirmingDiscard(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={onClose}
              >
                Discard
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button--ghost"
                onClick={requestClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving && <Spinner />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </form>
    </Dialog>
  );
}

export default EditProfileDialog;
