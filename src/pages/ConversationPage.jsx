import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useConversation } from "../hooks/useConversation";
import { apiFetch, isAbortError } from "../lib/api";
import MessageComposer from "../components/conversation/MessageComposer";
import MessageList from "../components/conversation/MessageList";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import SkeletonList from "../components/ui/SkeletonList";

function Conversation({ conversationId }) {
  const { currentUserId } = useAuth();
  const { conversation, status, sendMessage, deleteMessage } =
    useConversation(conversationId);
  // null until known, so the input never flashes enabled for an ex-friend.
  const [isFriends, setIsFriends] = useState(null);
  // Message awaiting delete confirmation, and the one being deleted.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const members = conversation?.members ?? [];
  const otherMembers = members.filter((m) => m.id !== currentUserId);
  const otherNames = otherMembers.map((m) => m.name).join(", ");
  // Only one-to-one chats are gated on friendship; groups are always open.
  const directPartnerId =
    otherMembers.length === 1 && members.length === 2
      ? otherMembers[0].id
      : null;

  useEffect(() => {
    if (directPartnerId === null) return;
    const controller = new AbortController();
    apiFetch("/friends", { signal: controller.signal })
      .then((friends) =>
        setIsFriends(
          friends.some(
            (f) =>
              f.userId === directPartnerId || f.buddyId === directPartnerId,
          ),
        ),
      )
      .catch((err) => {
        // Fail open: the server doesn't enforce friendship either.
        if (!isAbortError(err)) setIsFriends(true);
      });
    return () => controller.abort();
  }, [directPartnerId]);

  const confirmDelete = async () => {
    const { id } = pendingDelete;
    setPendingDelete(null);
    setDeletingId(id);
    setActionError("");
    try {
      await deleteMessage(id);
    } catch (err) {
      setActionError(
        err.detail ?? "Couldn't delete the message. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="conversation">
        <div className="conversation__status">
          <SkeletonList label="Loading conversation" rows={5} />
        </div>
      </div>
    );
  }

  if (status === "not-found" || status === "error") {
    return (
      <div className="conversation">
        <div className="conversation__status">
          {status === "not-found" ? (
            <EmptyState
              icon="message"
              title="Conversation not found"
              action={
                <Link to="/" className="button button--primary">
                  Back to conversations
                </Link>
              }
            >
              It may have been removed, or the link is wrong.
            </EmptyState>
          ) : (
            <Alert>
              Couldn't load this conversation. Please refresh to try again.
            </Alert>
          )}
        </div>
      </div>
    );
  }

  let disabledReason = null;
  if (directPartnerId !== null && isFriends === null) {
    disabledReason = "Loading…";
  } else if (directPartnerId !== null && !isFriends) {
    disabledReason = "You are no longer friends with this person.";
  }

  const title = otherNames || "Just you";

  return (
    <section className="conversation" aria-labelledby="conversation-title">
      <header className="conversation__header">
        <Avatar src={otherMembers[0]?.picture} name={title} size="sm" />
        <h1 id="conversation-title" className="conversation__title">
          {title}
        </h1>
        {members.length > 2 && (
          <span className="conversation__meta">· {members.length} members</span>
        )}
      </header>
      <MessageList
        messages={conversation.messages}
        currentUserId={currentUserId}
        deletingId={deletingId}
        onDelete={setPendingDelete}
      />
      {actionError && (
        <div className="conversation__notice">
          <Alert>{actionError}</Alert>
        </div>
      )}
      <MessageComposer
        recipientNames={otherNames}
        disabledReason={disabledReason}
        onSend={sendMessage}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete message"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        This will permanently delete your message for everyone in the
        conversation.
        {pendingDelete && (
          <q className="confirm-quote">{pendingDelete.content}</q>
        )}
      </ConfirmDialog>
    </section>
  );
}

// Keyed on the route param so switching conversations starts from a clean
// state instead of briefly showing (or being overwritten by) the old one.
function ConversationPage() {
  const { conversationId } = useParams();
  return <Conversation key={conversationId} conversationId={conversationId} />;
}

export default ConversationPage;
