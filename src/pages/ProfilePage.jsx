import { useState } from "react";
import { useAuth } from "../context/auth-context";
import { GUEST_USERNAME } from "../lib/auth";
import EditProfileDialog from "../components/profile/EditProfileDialog";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";

function ProfileSkeleton() {
  return (
    <div className="profile-card card" role="status">
      <span className="visually-hidden">Loading profile</span>
      <span className="skeleton skeleton--avatar avatar--xl" />
      <span className="skeleton skeleton--line" style={{ width: "40%" }} />
      <span className="skeleton skeleton--line" style={{ width: "25%" }} />
    </div>
  );
}

function ProfilePage() {
  // Shared with the navbar so the avatar updates as soon as a change saves.
  const { user, userError } = useAuth();
  const [editing, setEditing] = useState(false);

  const renderProfile = () => {
    if (userError) {
      return (
        <Alert>Couldn't load your profile. Please refresh to try again.</Alert>
      );
    }
    if (!user) return <ProfileSkeleton />;

    return (
      <section className="profile-card card" aria-labelledby="profile-name">
        <Avatar src={user.picture} name={user.name} size="xl" />
        <h2 id="profile-name" className="profile-card__name">
          {user.name}
        </h2>
        <p className="profile-card__username">@{user.username}</p>
        <p className="profile-card__bio">
          {user.bio || <span className="text-subtle">No bio yet.</span>}
        </p>
        <div className="profile-card__actions">
          {user.username === GUEST_USERNAME ? (
            <p className="text-subtle">
              The shared guest profile can't be edited. Log out and sign up to
              create your own.
            </p>
          ) : (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setEditing(true)}
            >
              Edit profile
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h1 className="page__title">Your profile</h1>
      </div>
      {renderProfile()}
      {editing && user && (
        <EditProfileDialog user={user} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

export default ProfilePage;
