import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";
import MessageComposer from "../components/conversation/MessageComposer";
import MessageList from "../components/conversation/MessageList";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import SkeletonList from "../components/ui/SkeletonList";

// The API has no push channel, so new messages are picked up by polling.
const POLL_INTERVAL_MS = 4000;

function Conversation({ conversationId }) {
  const { currentUserId } = useAuth();
  const [conversation, setConversation] = useState(null);
  // "loading" | "ready" | "not-found" | "error"
  const [status, setStatus] = useState("loading");
  // null until known, so the input never flashes enabled for an ex-friend.
  const [isFriends, setIsFriends] = useState(null);
  const latestRequestId = useRef(0);

  const refresh = useCallback(
    async (signal) => {
      const requestId = ++latestRequestId.current;
      const data = await apiFetch(`/conversations/${conversationId}`, {
        signal,
      });
      // A newer request (poll or post-send refresh) owns the state now.
      if (requestId !== latestRequestId.current) return;
      if (data) {
        setConversation(data);
        setStatus("ready");
      } else {
        setStatus("not-found");
      }
    },
    [conversationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId;

    const poll = async () => {
      if (!document.hidden) {
        try {
          await refresh(controller.signal);
        } catch (err) {
          if (isAbortError(err)) return;
          // Keep showing what we have if a background poll fails.
          setStatus((current) => (current === "ready" ? current : "error"));
        }
      }
      if (!controller.signal.aborted) {
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [refresh]);

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

  const sendMessage = async (content) => {
    await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { content },
    });
    // The next poll will retry if this refresh fails.
    refresh().catch(() => {});
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
      />
      <MessageComposer
        recipientNames={otherNames}
        disabledReason={disabledReason}
        onSend={sendMessage}
      />
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
