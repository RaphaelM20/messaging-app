import { Link } from "react-router-dom";
import { formatTime } from "../../lib/formatTime";
import Avatar from "../ui/Avatar";

function ChatRow({ chat, currentUserId }) {
  const otherMembers = chat.members.filter(
    (member) => member.id !== currentUserId,
  );
  const title =
    chat.name || otherMembers.map((m) => m.name).join(", ") || "Just you";
  const lastMessage = chat.messages[0]?.content;

  return (
    <li>
      <Link to={`/conversations/${chat.id}`} className="chat-row">
        <Avatar src={otherMembers[0]?.picture} name={title} size="lg" />
        <div className="chat-row__body">
          <div className="chat-row__top">
            <span className="chat-row__title">{title}</span>
            <time className="chat-row__time" dateTime={chat.lastActivity}>
              {formatTime(chat.lastActivity)}
            </time>
          </div>
          {lastMessage ? (
            <p className="chat-row__preview">{lastMessage}</p>
          ) : (
            <p className="chat-row__preview chat-row__preview--empty">
              No messages yet
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function ChatList({ chats, currentUserId }) {
  return (
    <ul className="row-list" aria-label="Conversations">
      {chats.map((chat) => (
        <ChatRow key={chat.id} chat={chat} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}

export default ChatList;
