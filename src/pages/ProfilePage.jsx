import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { apiFetch } from "../lib/api";

// Mirrors the API's signup rules, which PUT /user/me does not enforce.
const USERNAME_PATTERN = /^[a-zA-Z0-9 ]{4,20}$/;

function validate({ name, username }) {
  if (!name.trim()) return "Name is required";
  if (!USERNAME_PATTERN.test(username.trim())) {
    return "Username must be 4-20 characters: letters, numbers and spaces";
  }
  return null;
}

function ProfilePage() {
  // Shared with the navbar so the avatar updates as soon as a change saves.
  const { user, userError, setUser } = useAuth();

  const [nameInput, setNameInput] = useState("");
  const [pictureInput, setPictureInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [updateForm, setUpdateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (!user) {
    return (
      <div className="container">
        {userError ? (
          <p className="auth-error" role="alert">
            Couldn't load your profile. Please refresh to try again.
          </p>
        ) : (
          "Loading profile…"
        )}
      </div>
    );
  }

  const name = user.name ?? "";
  const username = user.username ?? "";
  const picture = user.picture ?? "";
  const bio = user.bio ?? "";

  const handleOpenForm = () => {
    setNameInput(name);
    setBioInput(bio);
    setUsernameInput(username);
    setPictureInput(picture);
    setSaveError("");
    setUpdateForm(true);
  };

  const handleCloseForm = () => {
    if (
      nameInput !== name ||
      bioInput !== bio ||
      usernameInput !== username ||
      pictureInput !== picture
    ) {
      if (window.confirm("Discard changes?")) setUpdateForm(false);
    } else {
      setUpdateForm(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (saving) return;

    const changes = {
      name: nameInput.trim(),
      picture: pictureInput.trim(),
      username: usernameInput.trim(),
      bio: bioInput.trim(),
    };
    const validationError = validate(changes);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    setSaveError("");
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
      setUpdateForm(false);
    } catch {
      setSaveError(
        "Couldn't save your profile. That username may already be taken.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <img src={picture || null} alt="" />
      <span>{name}</span>
      <span>@{username}</span>
      <span>{bio}</span>
      <button
        type="button"
        className="btn-edit-profile"
        onClick={handleOpenForm}
      >
        Edit Profile
      </button>

      {updateForm && (
        <form className="update-form" onSubmit={handleUpdate} noValidate>
          <div className="update-form-header">
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseForm}
              aria-label="Close"
            >
              ✕
            </button>
            <h2>Edit Profile</h2>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {saveError && (
            <p className="auth-error" role="alert">
              {saveError}
            </p>
          )}
          <label htmlFor="picture">Picture URL</label>
          <input
            id="picture"
            type="url"
            value={pictureInput}
            onChange={(e) => setPictureInput(e.target.value)}
          />
          <label htmlFor="bio">Bio</label>
          <input
            id="bio"
            type="text"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
          />
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
