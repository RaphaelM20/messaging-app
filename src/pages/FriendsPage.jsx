import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";

function FriendsPage() {
  const { currentUserId } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "pending" ? "pending" : "all";
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [status, setStatus] = useState("loading");
  const [actionError, setActionError] = useState("");
  // Friendship ID with a request in flight, to block repeat clicks.
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      apiFetch("/friends", { signal }),
      apiFetch("/friends/pending", { signal }),
    ])
      .then(([friendsData, pendingData]) => {
        setFriends(friendsData);
        setSentRequests(pendingData.sent);
        setReceivedRequests(pendingData.received);
        setStatus("ready");
      })
      .catch((err) => {
        if (!isAbortError(err)) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const runAction = async (friendshipId, action, errorMessage) => {
    if (busyId !== null) return;
    setBusyId(friendshipId);
    setActionError("");
    try {
      await action();
    } catch {
      setActionError(errorMessage);
    } finally {
      setBusyId(null);
    }
  };

  const acceptRequest = (friendshipId) =>
    runAction(
      friendshipId,
      async () => {
        await apiFetch(`/friends/${friendshipId}`, { method: "PUT" });
        setReceivedRequests((received) =>
          received.filter((r) => r.id !== friendshipId),
        );
        setFriends(await apiFetch("/friends"));
      },
      "Couldn't accept the request. Please try again.",
    );

  // Deleting a friendship covers removing a friend, denying a received
  // request and cancelling a sent one.
  const deleteFriendship = (friendshipId, errorMessage) =>
    runAction(
      friendshipId,
      async () => {
        await apiFetch(`/friends/${friendshipId}`, { method: "DELETE" });
        const keep = (item) => item.id !== friendshipId;
        setFriends((current) => current.filter(keep));
        setSentRequests((current) => current.filter(keep));
        setReceivedRequests((current) => current.filter(keep));
      },
      errorMessage,
    );

  const removeFriend = (friendshipId, name) => {
    if (!window.confirm(`Remove ${name} from your friends?`)) return;
    deleteFriendship(friendshipId, "Couldn't remove friend. Please try again.");
  };

  const startConversation = (friendshipId, friendUserId) =>
    runAction(
      friendshipId,
      async () => {
        const conversation = await apiFetch("/conversations", {
          method: "POST",
          body: { members: [friendUserId] },
        });
        navigate(`/conversations/${conversation.id}`);
      },
      "Couldn't open the conversation. Please try again.",
    );

  if (status === "loading") {
    return <div className="container">Loading friends…</div>;
  }

  if (status === "error") {
    return (
      <div className="container">
        <p className="auth-error" role="alert">
          Couldn't load your friends. Please refresh to try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      {actionError && (
        <p className="auth-error" role="alert">
          {actionError}
        </p>
      )}

      {tab === "all" &&
        friends.map((friend) => {
          const yourFriend =
            friend.user.id === currentUserId ? friend.buddy : friend.user;
          const busy = busyId === friend.id;

          return (
            <div key={friend.id} className="friend-card">
              <img src={yourFriend.picture} alt="" />
              <p>{yourFriend.name}</p>
              <div className="request-actions">
                <button
                  onClick={() => startConversation(friend.id, yourFriend.id)}
                  disabled={busy}
                  aria-label={`Message ${yourFriend.name}`}
                >
                  💬
                </button>
                <button
                  onClick={() => removeFriend(friend.id, yourFriend.name)}
                  disabled={busy}
                  aria-label={`Remove ${yourFriend.name}`}
                >
                  ✗
                </button>
              </div>
            </div>
          );
        })}

      {tab === "pending" && (
        <>
          <p className="received-subtitle">
            Received-{receivedRequests.length}
          </p>
          {receivedRequests.map((received) => {
            const busy = busyId === received.id;
            return (
              <div key={received.id} className="received-card">
                <img src={received.user.picture} alt="" />
                <p>{received.user.name}</p>
                <p>{received.user.username}</p>
                <div className="request-actions">
                  <button
                    onClick={() => acceptRequest(received.id)}
                    disabled={busy}
                    aria-label={`Accept ${received.user.name}`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() =>
                      deleteFriendship(
                        received.id,
                        "Couldn't decline the request. Please try again.",
                      )
                    }
                    disabled={busy}
                    aria-label={`Decline ${received.user.name}`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            );
          })}

          <p className="sent-subtitle">Sent-{sentRequests.length}</p>
          {sentRequests.map((sent) => (
            <div key={sent.id} className="sent-card">
              <img src={sent.buddy.picture} alt="" />
              <p>{sent.buddy.name}</p>
              <p>{sent.buddy.username}</p>
              <button
                onClick={() =>
                  deleteFriendship(
                    sent.id,
                    "Couldn't cancel the request. Please try again.",
                  )
                }
                disabled={busyId === sent.id}
                aria-label={`Cancel request to ${sent.buddy.name}`}
              >
                ✗
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default FriendsPage;
