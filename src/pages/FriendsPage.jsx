import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";
import FriendList from "../components/friends/FriendList";
import PendingRequests from "../components/friends/PendingRequests";
import Alert from "../components/ui/Alert";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import SkeletonList from "../components/ui/SkeletonList";

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
  // { friendshipId, name } awaiting confirmation.
  const [pendingRemoval, setPendingRemoval] = useState(null);

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

  // Deleting a friendship covers removing a friend, declining a received
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

  const confirmRemoval = () => {
    deleteFriendship(
      pendingRemoval.friendshipId,
      "Couldn't remove friend. Please try again.",
    );
    setPendingRemoval(null);
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

  const renderContent = () => {
    if (status === "loading") {
      return <SkeletonList label="Loading friends" />;
    }
    if (status === "error") {
      return (
        <Alert>Couldn't load your friends. Please refresh to try again.</Alert>
      );
    }
    if (tab === "all") {
      return (
        <FriendList
          friends={friends}
          currentUserId={currentUserId}
          busyId={busyId}
          onMessage={startConversation}
          onRemove={(friendshipId, name) =>
            setPendingRemoval({ friendshipId, name })
          }
        />
      );
    }
    return (
      <PendingRequests
        received={receivedRequests}
        sent={sentRequests}
        busyId={busyId}
        onAccept={acceptRequest}
        onDecline={(id) =>
          deleteFriendship(
            id,
            "Couldn't decline the request. Please try again.",
          )
        }
        onCancel={(id) =>
          deleteFriendship(id, "Couldn't cancel the request. Please try again.")
        }
      />
    );
  };

  const count =
    tab === "all"
      ? friends.length
      : receivedRequests.length + sentRequests.length;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">
          {tab === "all" ? "All friends" : "Pending requests"}
          {status === "ready" && (
            <>
              {" "}
              <span className="count-badge">{count}</span>
            </>
          )}
        </h1>
      </div>
      {actionError && <Alert>{actionError}</Alert>}
      {renderContent()}
      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove friend"
        confirmLabel="Remove friend"
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      >
        Are you sure you want to remove <strong>{pendingRemoval?.name}</strong>{" "}
        from your friends?
      </ConfirmDialog>
    </div>
  );
}

export default FriendsPage;
