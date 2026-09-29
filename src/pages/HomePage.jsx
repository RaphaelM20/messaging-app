import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";
import { formatTime } from "../lib/formatTime";

// "Groups can have up to 10 members", including the current user.
const MAX_OTHER_MEMBERS = 9;

function HomePage() {
  const { isAuthenticated, currentUserId } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [chatsStatus, setChatsStatus] = useState("loading");
  const [showNewChat, setShowNewChat] = useState(false);
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendsStatus, setFriendsStatus] = useState("idle");
  const [selectFriends, setSelectFriends] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    apiFetch("/conversations", { signal: controller.signal })
      .then((data) => {
        setChats(data);
        setChatsStatus("ready");
      })
      .catch((err) => {
        if (!isAbortError(err)) setChatsStatus("error");
      });
    return () => controller.abort();
  }, [isAuthenticated]);

  const toggleFriend = (id) => {
    setSelectFriends((selected) =>
      selected.includes(id)
        ? selected.filter((f) => f !== id)
        : [...selected, id],
    );
  };

  const openNewChat = async () => {
    setShowNewChat(true);
    setFriendsStatus("loading");
    try {
      setFriends(await apiFetch("/friends"));
      setFriendsStatus("ready");
    } catch {
      setFriendsStatus("error");
    }
  };

  const closeNewChat = () => {
    setShowNewChat(false);
    setQuery("");
    setSelectFriends([]);
    setCreateError("");
  };

  const handleNewConvo = async (e) => {
    e.preventDefault();
    if (creating || selectFriends.length === 0) return;

    setCreating(true);
    setCreateError("");
    try {
      const conversation = await apiFetch("/conversations", {
        method: "POST",
        body: { members: selectFriends },
      });
      closeNewChat();
      navigate(`/conversations/${conversation.id}`);
    } catch {
      setCreateError("Couldn't start the conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const friendUsers = friends
    .map((friend) => ({
      friendshipId: friend.id,
      ...(friend.user.id === currentUserId ? friend.buddy : friend.user),
    }))
    .filter(
      (friend) =>
        !normalizedQuery ||
        friend.name.toLowerCase().includes(normalizedQuery) ||
        friend.username.toLowerCase().includes(normalizedQuery),
    );
  const groupIsFull = selectFriends.length >= MAX_OTHER_MEMBERS;

  if (!isAuthenticated) {
    return (
      <div className="container">
        <p>Please login to view your chats</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div>
        <div className="new-chat" onClick={openNewChat}>
          New Chat
        </div>

        {showNewChat && (
          <div className="popup-overlay">
            <form onSubmit={handleNewConvo}>
              <div className="popup-header">
                <label htmlFor="search-input">New Message</label>
                <button type="button" onClick={closeNewChat} aria-label="Close">
                  ✕
                </button>
              </div>
              <p className="search-subtitle">
                Groups can have up to {MAX_OTHER_MEMBERS + 1} members
              </p>
              <input
                id="search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
              />
              {friendsStatus === "loading" && <p>Loading friends…</p>}
              {friendsStatus === "error" && (
                <p className="auth-error">Couldn't load your friends.</p>
              )}
              {friendUsers.map((friend) => {
                const checked = selectFriends.includes(friend.id);
                return (
                  <div key={friend.friendshipId} className="friend-card">
                    <img src={friend.picture} alt="" />
                    <p>{friend.name}</p>
                    <span className="tooltip">{friend.username}</span>
                    <input
                      type="checkbox"
                      aria-label={`Add ${friend.name}`}
                      checked={checked}
                      disabled={!checked && groupIsFull}
                      onChange={() => toggleFriend(friend.id)}
                    />
                  </div>
                );
              })}
              {createError && <p className="auth-error">{createError}</p>}
              <button
                type="submit"
                disabled={creating || selectFriends.length === 0}
              >
                {creating ? "Creating…" : "Create Message"}
              </button>
            </form>
          </div>
        )}

        {chatsStatus === "loading" && <p>Loading chats…</p>}
        {chatsStatus === "error" && (
          <p className="auth-error">
            Couldn't load your chats. Please refresh to try again.
          </p>
        )}

        {chats.map((chat) => {
          const otherMembers = chat.members.filter(
            (member) => member.id !== currentUserId,
          );
          const title =
            chat.name ||
            otherMembers.map((m) => m.name).join(", ") ||
            "Just you";
          const lastMsg = chat.messages[0]?.content;
          return (
            <Link key={chat.id} to={`/conversations/${chat.id}`}>
              <div className="chat-card">
                {otherMembers[0]?.picture && (
                  <img src={otherMembers[0].picture} alt="" />
                )}
                <p>{title}</p>
                <p>{lastMsg}</p>
                <p>{formatTime(chat.lastActivity)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
