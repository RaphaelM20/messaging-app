import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ConversationPage() {
  const { conversationId } = useParams();
  const token = localStorage.getItem("authToken");
  const currentUserId = token ? jwtDecode(token).id : null;
  const [query, setQuery] = useState("");
  const [convoMembers, setConvoMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isFriends, setIsFriends] = useState(true);

  const handleQuery = (e) => setQuery(e.target.value);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setConvoMembers(data.members);
        setMessages(data.messages);
      });
  }, [conversationId]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/friends`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (convoMembers.length > 2) {
          setIsFriends(true);
          return;
        }
        const otherPerson = convoMembers.find((m) => m.id !== currentUserId);
        if (otherPerson) {
          const isStillFriend = data.some(
            (f) => f.userId === otherPerson.id || f.buddyId === otherPerson.id,
          );
          setIsFriends(isStillFriend);
        }
      });
  }, [convoMembers, currentUserId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    await fetch(
      `${import.meta.env.VITE_API_URL}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ content: query }),
      },
    );

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/conversations/${conversationId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      },
    );
    const data = await response.json();
    setMessages(data.messages);
    setQuery("");
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleDateString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="conversation-container">
      <div className="chat-header">
        {token &&
          convoMembers
            .filter((member) => member.id !== currentUserId)
            .map((member) => member.name)
            .join(", ")}
      </div>
      {messages.map((message) => (
        <div key={message.id} className="convo-message">
          <img src={message.sender.picture} />
          <div className="message-body">
            <div className="message-header">
              <p className="message-name">{message.sender.name}</p>
              <p className="message-time">{formatTime(message.createdAt)}</p>
            </div>
            <p className="message-content">{message.content}</p>
          </div>
        </div>
      ))}

      {isFriends ? (
        <form onSubmit={sendMessage}>
          <input
            id="message-input"
            type="search"
            value={query}
            onChange={handleQuery}
            placeholder={`Message ${convoMembers
              .filter((m) => m.id !== currentUserId)
              .map((m) => m.name)
              .join(", ")}`}
          />
          <button type="submit">Send</button>
        </form>
      ) : (
        <form>
          <input
            id="message-input"
            type="search"
            disabled
            placeholder="You are no longer friends with this person."
          />
        </form>
      )}
    </div>
  );
}

export default ConversationPage;
