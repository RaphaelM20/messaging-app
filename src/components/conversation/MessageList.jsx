import { useLayoutEffect, useRef } from "react";
import { formatTime } from "../../lib/formatTime";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";

// How close to the bottom (px) still counts as "following" the chat.
const STICKY_THRESHOLD_PX = 80;

function MessageList({ messages, currentUserId }) {
  const logRef = useRef(null);
  const followingRef = useRef(true);
  const lastMessageIdRef = useRef(null);

  const handleScroll = () => {
    const log = logRef.current;
    followingRef.current =
      log.scrollHeight - log.scrollTop - log.clientHeight < STICKY_THRESHOLD_PX;
  };

  // Scroll to the newest message on first load, when you send one, and when
  // one arrives while you're already at the bottom. Reading older messages
  // is never interrupted by someone else's message.
  const lastMessage = messages.at(-1);
  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log || !lastMessage) return;
    if (lastMessage.id === lastMessageIdRef.current) return;

    const isOwnMessage = lastMessage.sender?.id === currentUserId;
    if (followingRef.current || isOwnMessage) {
      log.scrollTop = log.scrollHeight;
      followingRef.current = true;
    }
    lastMessageIdRef.current = lastMessage.id;
  }, [lastMessage, currentUserId]);

  return (
    <div
      ref={logRef}
      className="message-log"
      role="log"
      aria-label="Messages"
      tabIndex={0}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <EmptyState icon="message" title="No messages yet">
          Say hi to start the conversation.
        </EmptyState>
      ) : (
        <ol className="message-list">
          {messages.map((message) => (
            <li key={message.id} className="message">
              <Avatar
                src={message.sender?.picture}
                name={message.sender?.name}
              />
              <div className="message__body">
                <div className="message__meta">
                  <span className="message__author">
                    {message.sender?.name}
                  </span>
                  <time className="message__time" dateTime={message.createdAt}>
                    {formatTime(message.createdAt)}
                  </time>
                </div>
                <p className="message__content">{message.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default MessageList;
