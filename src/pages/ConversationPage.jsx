import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { apiFetch, isAbortError } from "../lib/api";
import { formatTime } from "../lib/formatTime";

// The API has no push channel, so new messages are picked up by polling.
const POLL_INTERVAL_MS = 4000;

function Conversation({ conversationId }) {
  const { currentUserId } = useAuth();
  const [conversation, setConversation] = useState(null);
  // "loading" | "ready" | "not-found" | "error"
  const [status, setStatus] = useState("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
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

  const otherMembers = (conversation?.members ?? []).filter(
    (m) => m.id !== currentUserId,
  );
  const otherNames = otherMembers.map((m) => m.name).join(", ");
  // Only one-to-one chats are gated on friendship; groups are always open.
  const directPartnerId =
    otherMembers.length === 1 && conversation?.members.length === 2
      ? otherMembers[0].id
      : null;
  const canMessage = directPartnerId === null || isFriends === true;

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

  const sendMessage = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setSendError("");
    try {
      await apiFetch(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { content },
      });
    } catch {
      setSendError("Your message couldn't be sent. Please try again.");
      setSending(false);
      return;
    }
    setDraft("");
    setSending(false);
    // The next poll will retry if this refresh fails.
    refresh().catch(() => {});
  };

  if (status === "loading") {
    return <div className="conversation-container">Loading conversation…</div>;
  }

  if (status === "not-found" || status === "error") {
    return (
      <div className="conversation-container">
        <p className="auth-error" role="alert">
          {status === "not-found"
            ? "This conversation doesn't exist."
            : "Couldn't load this conversation. Please refresh to try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="conversation-container">
      <div className="chat-header">{otherNames}</div>
      {conversation.messages.map((message) => (
        <div key={message.id} className="convo-message">
          <img src={message.sender?.picture} alt="" />
          <div className="message-body">
            <div className="message-header">
              <p className="message-name">{message.sender?.name}</p>
              <p className="message-time">{formatTime(message.createdAt)}</p>
            </div>
            <p className="message-content">{message.content}</p>
          </div>
        </div>
      ))}

      {sendError && (
        <p className="auth-error" role="alert">
          {sendError}
        </p>
      )}

      {canMessage ? (
        <form onSubmit={sendMessage}>
          <input
            id="message-input"
            type="text"
            autoComplete="off"
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={otherNames ? `Message ${otherNames}` : "Message"}
          />
          <button type="submit" disabled={sending || !draft.trim()}>
            Send
          </button>
        </form>
      ) : (
        <form>
          <input
            id="message-input"
            type="text"
            aria-label="Message"
            disabled
            placeholder={
              isFriends === false
                ? "You are no longer friends with this person."
                : "Loading…"
            }
          />
        </form>
      )}
    </div>
  );
}

// Keyed on the route param so switching conversations starts from a clean
// state instead of briefly showing (or being overwritten by) the old one.
function ConversationPage() {
  const { conversationId } = useParams();
  return <Conversation key={conversationId} conversationId={conversationId} />;
}

export default ConversationPage;
