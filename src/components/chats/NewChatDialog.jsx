import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { apiFetch, isAbortError } from "../../lib/api";
import Alert from "../ui/Alert";
import Avatar from "../ui/Avatar";
import Dialog from "../ui/Dialog";
import EmptyState from "../ui/EmptyState";
import IconButton from "../ui/IconButton";
import SkeletonList from "../ui/SkeletonList";
import Spinner from "../ui/Spinner";

// "Groups can have up to 10 members", including the current user.
const MAX_OTHER_MEMBERS = 9;

// Mounted only while the dialog is open, so every opening starts fresh.
function NewChatForm({ onClose }) {
  const { currentUserId } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/friends", { signal: controller.signal })
      .then((data) => {
        setFriends(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!isAbortError(err)) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const toggleFriend = (id) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creating || selected.length === 0) return;

    setCreating(true);
    setError("");
    try {
      const conversation = await apiFetch("/conversations", {
        method: "POST",
        body: { members: selected },
      });
      onClose();
      navigate(`/conversations/${conversation.id}`);
    } catch {
      setError("Couldn't start the conversation. Please try again.");
      setCreating(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const people = friends
    .map((friend) => ({
      friendshipId: friend.id,
      ...(friend.user.id === currentUserId ? friend.buddy : friend.user),
    }))
    .filter(
      (person) =>
        !normalizedQuery ||
        person.name.toLowerCase().includes(normalizedQuery) ||
        person.username.toLowerCase().includes(normalizedQuery),
    );
  const groupIsFull = selected.length >= MAX_OTHER_MEMBERS;

  const renderFriends = () => {
    if (status === "loading") {
      return <SkeletonList label="Loading friends" rows={3} />;
    }
    if (status === "error") {
      return <Alert>Couldn't load your friends. Please try again.</Alert>;
    }
    if (friends.length === 0) {
      return (
        <EmptyState
          icon="users"
          title="No friends yet"
          action={
            <Link
              to="/users/search"
              className="button button--primary"
              onClick={onClose}
            >
              Add a friend
            </Link>
          }
        >
          Add friends to start a conversation.
        </EmptyState>
      );
    }
    if (people.length === 0) {
      return <p className="text-subtle">No friends match “{query.trim()}”.</p>;
    }
    return (
      <ul className="row-list">
        {people.map((person) => {
          const checked = selected.includes(person.id);
          return (
            <li key={person.friendshipId}>
              <label className="picker-row">
                <Avatar src={person.picture} name={person.name} />
                <span className="person-row__text">
                  <span className="person-row__name">{person.name}</span>
                  <span className="person-row__username">
                    @{person.username}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={checked}
                  disabled={!checked && groupIsFull}
                  onChange={() => toggleFriend(person.id)}
                />
              </label>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="dialog__content">
      <div className="dialog__header">
        <div>
          <h2 id="new-chat-title" className="dialog__title">
            New message
          </h2>
          <p className="dialog__subtitle">
            Groups can have up to {MAX_OTHER_MEMBERS + 1} members.
          </p>
        </div>
        <IconButton
          icon="close"
          label="Close"
          variant="plain"
          onClick={onClose}
        />
      </div>
      <div className="dialog__body">
        <div className="field">
          <label htmlFor="new-chat-search" className="visually-hidden">
            Search friends
          </label>
          <input
            id="new-chat-search"
            type="search"
            className="input"
            placeholder="Search friends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // Enter shouldn't create the chat from the search box.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            data-autofocus
          />
        </div>
        {renderFriends()}
        {error && <Alert>{error}</Alert>}
      </div>
      <div className="dialog__footer">
        <span className="dialog__footer-note" aria-live="polite">
          {selected.length} of {MAX_OTHER_MEMBERS} selected
        </span>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button button--primary"
          disabled={creating || selected.length === 0}
        >
          {creating && <Spinner />}
          {creating ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}

function NewChatDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="new-chat-title">
      <NewChatForm onClose={onClose} />
    </Dialog>
  );
}

export default NewChatDialog;
