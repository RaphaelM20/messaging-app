import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, isAbortError } from "../lib/api";

// The API has no push channel, so new messages are picked up by polling.
const POLL_INTERVAL_MS = 4000;

// Loads a conversation, keeps it fresh by polling, and exposes the message
// actions. `status` is "loading" | "ready" | "not-found" | "error".
export function useConversation(conversationId) {
  const [conversation, setConversation] = useState(null);
  const [status, setStatus] = useState("loading");
  const latestRequestId = useRef(0);

  const refresh = useCallback(
    async (signal) => {
      const requestId = ++latestRequestId.current;
      const data = await apiFetch(`/conversations/${conversationId}`, {
        signal,
      });
      // A newer request (poll, refresh or local change) owns the state now.
      if (requestId !== latestRequestId.current) return;
      setConversation(data);
      setStatus("ready");
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
          // Missing, or you're not a member (the API doesn't distinguish).
          if (err.status === 404) {
            setStatus("not-found");
            return;
          }
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

  // Resolves once stored; rejects on failure so the caller keeps the draft.
  const sendMessage = async (content) => {
    await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { content },
    });
    // The next poll will retry if this refresh fails.
    refresh().catch(() => {});
  };

  const deleteMessage = async (messageId) => {
    await apiFetch(`/conversations/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
    });
    // Discard any poll already in flight so it can't bring the message back.
    latestRequestId.current++;
    setConversation((current) => ({
      ...current,
      messages: current.messages.filter((m) => m.id !== messageId),
    }));
  };

  return { conversation, status, sendMessage, deleteMessage };
}
