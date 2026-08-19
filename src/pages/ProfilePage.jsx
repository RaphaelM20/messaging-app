import { useEffect, useState } from "react";

function ProfilePage() {
  const [picture, setPicture] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [pictureInput, setPictureInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [updateForm, setUpdateForm] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/user/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        (setPicture(data.picture || ""),
          setBio(data.bio || ""),
          setUsername(data.username || ""),
          setName(data.name || ""));
      });
  }, []);

  const handleOpenForm = () => {
    setNameInput(name);
    setBioInput(bio);
    setUsernameInput(username);
    setPictureInput(picture);
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

  const handleUpdate = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/user/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        name: nameInput,
        picture: pictureInput,
        username: usernameInput,
        bio: bioInput,
      }),
    });
    const data = await response.json();
    setPicture(data.picture);
    setBio(data.bio);
    setUsername(data.username);
    setName(data.name);
    setUpdateForm(false);
  };

  return (
    <div className="container">
      <img src={picture || null} />
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
        <div className="update-form">
          <div className="update-form-header">
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseForm}
            >
              ✕
            </button>
            <h2>Edit Profile</h2>
            <button
              type="button"
              className="btn-save"
              onClick={() => {
                handleUpdate();
              }}
            >
              Save
            </button>
          </div>
          <input
            id="picture"
            type="text"
            value={pictureInput}
            onChange={(e) => setPictureInput(e.target.value)}
          />
          <label htmlFor="bio">Bio: {bio}</label>
          <input
            id="bio"
            type="text"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
          />
          <label htmlFor="username">Username: {username}</label>
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <label htmlFor="name">Name: {name}</label>
          <input
            id="name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
